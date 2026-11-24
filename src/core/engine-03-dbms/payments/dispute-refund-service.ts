import crypto from 'node:crypto';
import prisma from '@/lib/db';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { AuditLogger, globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { CashfreeGateway, globalCashfreeGateway } from './cashfree-gateway';
import {
  InitiateDisputeRefundInput,
  DisputeRefundResult,
  RefundRecord,
  CashfreeRefundWebhookPayload,
  RefundStatus,
  SettlementTransferStatus,
} from './types';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  InvalidStateTransitionError,
} from '@/lib/errors';

export class DisputeRefundService {
  private gateway: CashfreeGateway;
  private auditLogger: AuditLogger;

  // In-memory registry for refund tracking records (extending database ledger)
  private refundRecords: Map<string, RefundRecord> = new Map();

  constructor(
    gateway: CashfreeGateway = globalCashfreeGateway,
    auditLogger: AuditLogger = globalAuditLogger
  ) {
    this.gateway = gateway;
    this.auditLogger = auditLogger;
  }

  /**
   * Validates dispute ruling, verifies arbitrator authority, calculates exact
   * integer paise splits, advances FSM to REFUND_PENDING, calls Cashfree PG,
   * and creates pending escrow records.
   */
  async initiateDisputeRefund(input: InitiateDisputeRefundInput): Promise<DisputeRefundResult> {
    return await globalKeyedMutex.runExclusive(`dispute:${input.disputeId}`, async () => {
      // 1. Verify arbitrator authorization & role before external gateway calls
      const reviewer = await prisma.user.findUnique({
        where: { id: input.reviewerId },
      });

      if (!reviewer || (reviewer.role !== 'REVIEWER' && reviewer.role !== 'ADMIN')) {
        throw new AuthorizationError(
          'Only authorized Reviewers or Administrators can resolve disputes and issue refunds.'
        );
      }

      // 2. Retrieve dispute and associated milestone & contract
      const dispute = await prisma.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          milestone: {
            include: { contract: true },
          },
        },
      });

      if (!dispute) {
        throw new NotFoundError('Dispute', input.disputeId);
      }

      if (dispute.status === 'RESOLVED') {
        throw new InvalidStateTransitionError(
          dispute.status,
          'RESOLVE_REFUND',
          'Dispute is already resolved with a binding ruling.'
        );
      }

      if (dispute.milestone.status !== 'DISPUTED') {
        throw new InvalidStateTransitionError(
          dispute.milestone.status,
          'REFUND',
          `Milestone must be in 'DISPUTED' state to execute a dispute refund. Current state: '${dispute.milestone.status}'.`
        );
      }

      // 3. Integer paise conversion & precision validation
      const totalMilestonePaise =
        dispute.milestone.amountPaise > 0
          ? dispute.milestone.amountPaise
          : Math.round(dispute.milestone.amount * 100);
      if (totalMilestonePaise <= 0) {
        throw new ValidationError('Milestone amount must be greater than zero.');
      }

      let clientRefundPaise: number;
      let freelancerTransferPaise: number;
      let rulingType: 'FULL_REFUND' | 'PARTIAL_SPLIT' = 'FULL_REFUND';

      if (input.splitRatio) {
        const { clientPercentage, freelancerPercentage } = input.splitRatio;

        if (clientPercentage < 0 || freelancerPercentage < 0) {
          throw new ValidationError('Split percentages must be non-negative.');
        }

        if (clientPercentage + freelancerPercentage !== 100) {
          throw new ValidationError(
            `Split percentages must sum to exactly 100. Received: client=${clientPercentage}%, freelancer=${freelancerPercentage}%.`
          );
        }

        rulingType = 'PARTIAL_SPLIT';

        // Integer arithmetic with zero rounding leakage
        clientRefundPaise = Math.floor(totalMilestonePaise * (clientPercentage / 100));
        freelancerTransferPaise = totalMilestonePaise - clientRefundPaise;

        // Mathematical invariant check
        if (clientRefundPaise + freelancerTransferPaise !== totalMilestonePaise) {
          throw new ValidationError(
            `Paise conservation violated: ${clientRefundPaise} + ${freelancerTransferPaise} !== ${totalMilestonePaise}`
          );
        }
      } else {
        // Full refund to client
        clientRefundPaise = totalMilestonePaise;
        freelancerTransferPaise = 0;
      }

      // 4. External Gateway Calls (executed strictly outside DB transaction lock)
      const refundId = `rfnd_${dispute.id}_${Date.now()}`;
      const orderId = dispute.milestone.contractId;

      const refundResult = await this.gateway.createRefund({
        orderId,
        refundId,
        amountPaise: clientRefundPaise,
        refundReason: input.rulingNotes,
      });

      if (!refundResult.success) {
        throw new Error(
          `Cashfree Refund failed: ${refundResult.failureReason || refundResult.failureCode}`
        );
      }

      let transferResult: any = null;
      if (freelancerTransferPaise > 0) {
        const transferId = `trf_${dispute.id}_${Date.now()}`;
        transferResult = await this.gateway.createTransfer({
          transferId,
          beneficiaryId: dispute.milestone.contract.freelancerId,
          amountPaise: freelancerTransferPaise,
          remarks: `Dispute split settlement: ${input.rulingNotes}`,
        });

        if (!transferResult.success) {
          throw new Error(
            `Cashfree Freelancer Transfer failed: ${transferResult.failureReason || transferResult.failureCode}`
          );
        }
      }

      const nextMilestoneState =
        rulingType === 'PARTIAL_SPLIT' ? 'PARTIALLY_REFUNDED_PENDING' : 'REFUND_PENDING';
      const rulingTitle =
        rulingType === 'PARTIAL_SPLIT' ? 'SPLIT_SETTLEMENT' : 'REFUND_TO_CLIENT';

      // 5. Persist state & ledger entries atomically
      return await prisma.$transaction(
        async (tx) => {
          const freshDispute = await tx.dispute.findUnique({ where: { id: dispute.id } });
          if (freshDispute?.status === 'RESOLVED') {
            throw new InvalidStateTransitionError(
              'RESOLVED',
              'RESOLVE_REFUND',
              'Dispute is already resolved with a binding ruling.'
            );
          }

          await tx.milestone.update({
            where: { id: dispute.milestoneId },
            data: { status: nextMilestoneState },
          });

          await tx.dispute.update({
            where: { id: dispute.id },
            data: {
              status: 'RESOLVED',
              ruling: rulingTitle,
              reviewerId: input.reviewerId,
              rulingNotes: input.rulingNotes,
              resolvedAt: new Date(),
            },
          });

          const refundRecord: RefundRecord = {
            id: `ref_rec_${Date.now()}`,
            disputeId: dispute.id,
            milestoneId: dispute.milestoneId,
            contractId: dispute.milestone.contractId,
            clientId: dispute.milestone.contract.clientId,
            orderId,
            providerRefundId: refundResult.providerRefundId || null,
            idempotencyKey: refundId,
            amountPaise: clientRefundPaise,
            status: 'PENDING',
            reason: input.rulingNotes,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.refundRecords.set(refundId, refundRecord);

          const linkedPayment = await tx.payment.findFirst({
            where: { contractId: dispute.milestone.contractId, status: 'SUCCESS' },
            select: { id: true },
          });

          if (linkedPayment) {
            await tx.refund.create({
              data: {
                paymentId: linkedPayment.id,
                contractId: dispute.milestone.contractId,
                milestoneId: dispute.milestoneId,
                amountPaise: clientRefundPaise,
                providerRefundId: refundResult.providerRefundId || refundId,
                reason: input.rulingNotes,
                status: 'PENDING',
              },
            });
          }

          await tx.escrowTransaction.create({
            data: {
              contractId: dispute.milestone.contractId,
              milestoneId: dispute.milestoneId,
              fromUserId: null,
              toUserId: dispute.milestone.contract.clientId,
              amount: clientRefundPaise / 100,
              amountPaise: clientRefundPaise,
              type: 'REFUND',
              status: 'PENDING',
            },
          });

          if (freelancerTransferPaise > 0) {
            await tx.escrowTransaction.create({
              data: {
                contractId: dispute.milestone.contractId,
                milestoneId: dispute.milestoneId,
                fromUserId: null,
                toUserId: dispute.milestone.contract.freelancerId,
                amount: freelancerTransferPaise / 100,
                amountPaise: freelancerTransferPaise,
                type: 'RELEASE',
                status: 'PENDING',
              },
            });
          }

          await this.auditLogger.logAction(
            {
              actorId: input.reviewerId,
              entityName: 'Dispute',
              entityId: dispute.id,
              action: `DISPUTE_${rulingTitle}_INITIATED`,
              previousState: 'DISPUTED',
              newState: nextMilestoneState,
            },
            tx
          );

          return {
            success: true,
            disputeId: dispute.id,
            milestoneId: dispute.milestoneId,
            contractId: dispute.milestone.contractId,
            type: rulingType,
            clientRefund: {
              refundId,
              providerRefundId: refundResult.providerRefundId,
              amountPaise: clientRefundPaise,
              status: 'PENDING',
            },
            freelancerTransfer: transferResult
              ? {
                  transferId: transferResult.transferId || `trf_${dispute.id}`,
                  gatewayTransferId: transferResult.gatewayTransferId,
                  amountPaise: freelancerTransferPaise,
                  status: transferResult.status as SettlementTransferStatus,
                }
              : undefined,
            totalMilestonePaise,
            message:
              rulingType === 'FULL_REFUND'
                ? `Full client refund of ₹${(clientRefundPaise / 100).toFixed(2)} initiated with Cashfree.`
                : `Split refund initiated: ₹${(clientRefundPaise / 100).toFixed(2)} to client, ₹${(freelancerTransferPaise / 100).toFixed(2)} to freelancer.`,
          };
        },
        { maxWait: 15000, timeout: 30000 }
      );
    });
  }

  /**
   * Ingests and processes asynchronous Cashfree webhook callbacks for refunds.
   * Cryptographically verifies HMAC-SHA256 signature and timestamp freshness.
   * Idempotently updates Refund record, Milestone state, Contract state, and AuditLog.
   */
  async handleRefundWebhook(
    rawBody: string,
    timestamp: string,
    signature: string
  ): Promise<{ success: boolean; action: string; transactionId?: string }> {
    // 1. Webhook Signature & Freshness verification
    const isValid = this.gateway.verifyWebhookSignature(rawBody, timestamp, signature);
    if (!isValid) {
      throw new AuthorizationError('Invalid Cashfree webhook cryptographic signature.');
    }

    const payload: CashfreeRefundWebhookPayload = JSON.parse(rawBody);
    const refundData = payload.data?.refund;

    if (!refundData || !refundData.refund_id) {
      throw new ValidationError('Malformed Cashfree refund webhook payload.');
    }

    return await prisma.$transaction(async (tx) => {
      // 2. Check Idempotency: Has this transaction already been completed?
      const existingCompletedTx = await tx.escrowTransaction.findFirst({
        where: {
          contractId: refundData.order_id,
          type: 'REFUND',
          status: 'COMPLETED',
        },
      });

      if (existingCompletedTx) {
        return {
          success: true,
          action: 'ALREADY_PROCESSED_IDEMPOTENT',
          transactionId: existingCompletedTx.id,
        };
      }

      // Find pending escrow transaction
      const pendingTx = await tx.escrowTransaction.findFirst({
        where: {
          contractId: refundData.order_id,
          type: 'REFUND',
          status: 'PENDING',
        },
      });

      // Update in-memory / persistent refund record status
      const localRecord = this.refundRecords.get(refundData.refund_id);
      if (localRecord) {
        localRecord.status = refundData.refund_status as RefundStatus;
        localRecord.processedAt = new Date();
        localRecord.updatedAt = new Date();
      }

      // 3. Handle REFUND_SUCCESS
      if (refundData.refund_status === 'SUCCESS') {
        const refundAmount = refundData.refund_amount;
        const refundPaise = Math.round(refundAmount * 100);

        // Transition pending escrow transaction to COMPLETED
        if (pendingTx) {
          await tx.escrowTransaction.update({
            where: { id: pendingTx.id },
            data: { status: 'COMPLETED', amountPaise: refundPaise },
          });
        }

        // Decrement contract escrow balance and update status (syncing float & integer paise)
        const contract = await tx.contract.findUnique({
          where: { id: refundData.order_id },
        });

        if (contract) {
          const curEscrowPaise =
            contract.escrowBalancePaise > 0
              ? contract.escrowBalancePaise
              : Math.round(contract.escrowBalance * 100);
          const nextEscrowPaise = Math.max(0, curEscrowPaise - refundPaise);
          await tx.contract.update({
            where: { id: contract.id },
            data: {
              escrowBalance: nextEscrowPaise / 100,
              escrowBalancePaise: nextEscrowPaise,
              status: nextEscrowPaise === 0 ? 'REFUNDED' : contract.status,
            },
          });
        }

        // Transition milestone to terminal REFUNDED state
        if (pendingTx?.milestoneId) {
          await tx.milestone.update({
            where: { id: pendingTx.milestoneId },
            data: { status: 'REFUNDED' },
          });
        }

        // Credit client balance in double-entry ledger (float + integer paise)
        if (pendingTx?.toUserId) {
          const clientUser = await tx.user.findUnique({
            where: { id: pendingTx.toUserId },
            select: { balance: true, balancePaise: true },
          });
          const curClientPaise = clientUser
            ? clientUser.balancePaise > 0
              ? clientUser.balancePaise
              : Math.round(clientUser.balance * 100)
            : 0;
          await tx.user.update({
            where: { id: pendingTx.toUserId },
            data: {
              balance: { increment: refundAmount },
              balancePaise: curClientPaise + refundPaise,
            },
          });
        }

        // Cryptographic Audit Log
        await this.auditLogger.logAction(
          {
            actorId: 'CASHFREE_WEBHOOK_DAEMON',
            entityName: 'Milestone',
            entityId: pendingTx?.milestoneId || refundData.order_id,
            action: 'CASHFREE_REFUND_SUCCESS',
            previousState: 'REFUND_PENDING',
            newState: 'REFUNDED',
          },
          tx
        );

        return {
          success: true,
          action: 'REFUND_SETTLED',
          transactionId: pendingTx?.id,
        };
      }

      // 4. Handle REFUND_FAILED
      if (refundData.refund_status === 'FAILED') {
        if (pendingTx) {
          await tx.escrowTransaction.update({
            where: { id: pendingTx.id },
            data: { status: 'FAILED' },
          });
        }

        if (pendingTx?.milestoneId) {
          await tx.milestone.update({
            where: { id: pendingTx.milestoneId },
            data: { status: 'REFUND_FAILED' },
          });
        }

        await this.auditLogger.logAction(
          {
            actorId: 'CASHFREE_WEBHOOK_DAEMON',
            entityName: 'Milestone',
            entityId: pendingTx?.milestoneId || refundData.order_id,
            action: 'CASHFREE_REFUND_FAILED',
            previousState: 'REFUND_PENDING',
            newState: 'REFUND_FAILED',
          },
          tx
        );

        return {
          success: false,
          action: 'REFUND_FAILED_NOTIFIED',
          transactionId: pendingTx?.id,
        };
      }

      return {
        success: true,
        action: `REFUND_STATUS_${refundData.refund_status}`,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  /**
   * Helper to retrieve tracked refund record.
   */
  getRefundRecord(refundId: string): RefundRecord | undefined {
    return this.refundRecords.get(refundId);
  }
}

export const globalDisputeRefundService = new DisputeRefundService();
