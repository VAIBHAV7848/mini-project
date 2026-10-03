import prisma from '@/lib/db';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { NotFoundError, InvalidStateTransitionError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import crypto from 'node:crypto';

export interface CreatePaymentRecordInput {
  orderId: string;
  milestoneId: string;
  contractId: string;
  clientId: string;
  amount: number; // In INR / GF
  amountPaise: number; // In integer paise
  currency?: string;
  paymentSessionId: string;
}

export class PaymentService {
  /**
   * Persists an initial pending payment order.
   */
  static async createPaymentRecord(input: CreatePaymentRecordInput) {
    try {
      return await prisma.payment.create({
        data: {
          id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          contractId: input.contractId,
          milestoneId: input.milestoneId,
          clientId: input.clientId,
          amountPaise: input.amountPaise,
          currency: input.currency || 'INR',
          provider: 'CASHFREE',
          providerOrderId: input.orderId,
          paymentSessionId: input.paymentSessionId,
          status: 'PENDING',
        },
      });
    } catch (err) {
      logger.error('Error creating payment record in Prisma', { err });
      throw err;
    }
  }

  /**
   * Finds an active unpaid payment record for a milestone.
   */
  static async findActivePendingPayment(milestoneId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { milestoneId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
      if (!payment) return null;
      return {
        id: payment.id,
        orderId: payment.providerOrderId || payment.id,
        milestoneId: payment.milestoneId,
        contractId: payment.contractId,
        clientId: payment.clientId,
        amount: payment.amountPaise / 100,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        paymentSessionId: payment.paymentSessionId,
        status: payment.status,
      };
    } catch {
      return null;
    }
  }

  /**
   * Finds payment record by orderId.
   */
  static async getPaymentByOrderId(orderId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { providerOrderId: orderId },
            { id: orderId },
          ],
        },
      });
      if (!payment) return null;
      return {
        id: payment.id,
        orderId: payment.providerOrderId || payment.id,
        milestoneId: payment.milestoneId!,
        contractId: payment.contractId,
        clientId: payment.clientId,
        amount: payment.amountPaise / 100,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        paymentSessionId: payment.paymentSessionId,
        status: payment.status,
        providerPaymentId: payment.providerPaymentId,
      };
    } catch {
      return null;
    }
  }

  /**
   * Updates payment record status.
   */
  static async updatePaymentStatus(orderId: string, status: string, cfPaymentId?: string, rawResponse?: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { providerOrderId: orderId },
            { id: orderId },
          ],
        },
      });
      if (!payment) return;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          ...(cfPaymentId ? { providerPaymentId: cfPaymentId } : {}),
        },
      });

      if (rawResponse) {
        await prisma.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: status,
            providerEventId: cfPaymentId || null,
            rawPayload: rawResponse,
            status,
          },
        });
      }
    } catch (err) {
      logger.error('Failed to update payment status', { orderId, status, err });
    }
  }

  /**
   * Deduplicates webhooks via WebhookLog.
   * Returns true if already processed.
   */
  static async isWebhookProcessed(eventId: string): Promise<boolean> {
    try {
      const log = await prisma.webhookLog.findFirst({
        where: { id: eventId },
      });
      return log?.processed === true;
    } catch {
      return false;
    }
  }

  /**
   * Records or updates a webhook log entry.
   */
  static async recordWebhookLog(input: {
    eventId: string;
    eventType: string;
    orderId?: string;
    payload: string;
    status: 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';
    errorMessage?: string;
  }) {
    try {
      const existing = await prisma.webhookLog.findFirst({
        where: { id: input.eventId },
      });

      if (existing) {
        return await prisma.webhookLog.update({
          where: { id: existing.id },
          data: {
            processed: input.status === 'PROCESSED',
            error: input.errorMessage ?? null,
          },
        });
      }

      return await prisma.webhookLog.create({
        data: {
          id: input.eventId,
          provider: 'CASHFREE',
          eventType: input.eventType,
          payload: input.payload,
          isValid: true,
          processed: input.status === 'PROCESSED',
          error: input.errorMessage ?? null,
        },
      });
    } catch (err) {
      logger.error('Error recording webhook log', { err });
    }
  }

  /**
   * Atomic Escrow Funding without debiting client platform balance.
   * Increments contract.escrowBalance and updates milestone to FUNDED.
   */
  static async fundMilestoneViaGateway(params: {
    orderId: string;
    cfPaymentId?: string;
    actorId?: string;
  }) {
    const payment = await this.getPaymentByOrderId(params.orderId);
    if (!payment) {
      throw new NotFoundError('Payment', params.orderId);
    }

    if (payment.status === 'SUCCESS') {
      return { alreadyFunded: true, milestoneId: payment.milestoneId };
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch milestone with contract
      const milestone = await tx.milestone.findUnique({
        where: { id: payment.milestoneId },
        include: { contract: true },
      });

      if (!milestone) {
        throw new NotFoundError('Milestone', payment.milestoneId);
      }

      if (
        milestone.status !== 'AWAITING_DEPOSIT' &&
        milestone.status !== 'PENDING'
      ) {
        if (milestone.status === 'FUNDED') {
          return { alreadyFunded: true, milestoneId: milestone.id };
        }
        throw new InvalidStateTransitionError(
          milestone.status,
          'GATEWAY_FUND',
          `Milestone is in state '${milestone.status}' and cannot be funded.`
        );
      }

      // 2. Increment contract escrow balance
      const newContractStatus =
        milestone.contract.status === 'AWAITING_DEPOSIT'
          ? 'FUNDED'
          : milestone.contract.status;

      await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          escrowBalance: { increment: payment.amount },
          escrowBalancePaise: { increment: payment.amountPaise },
          status: newContractStatus,
        },
      });

      // 3. Transition milestone status to FUNDED
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestone.id },
        data: {
          status: 'FUNDED',
        },
      });

      // 4. Record EscrowTransaction in double-entry ledger
      const txRecord = await tx.escrowTransaction.create({
        data: {
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          fromUserId: milestone.contract.clientId,
          toUserId: null,
          amount: payment.amount,
          amountPaise: payment.amountPaise,
          type: 'DEPOSIT',
          status: 'COMPLETED',
        },
      });

      // 5. Update Payment record to SUCCESS
      await this.updatePaymentStatus(params.orderId, 'SUCCESS', params.cfPaymentId);

      // 6. Append chained cryptographic audit log
      await globalAuditLogger.logAction(
        {
          actorId: params.actorId || milestone.contract.clientId,
          entityName: 'Milestone',
          entityId: milestone.id,
          action: 'ESCROW_FUNDED_VIA_GATEWAY',
          previousState: milestone.status,
          newState: 'FUNDED',
        },
        tx
      );

      logger.info('Milestone escrow successfully funded via Cashfree gateway', {
        orderId: params.orderId,
        milestoneId: milestone.id,
        amount: payment.amount,
        amountPaise: payment.amountPaise,
        transactionId: txRecord.id,
      });

      return {
        alreadyFunded: false,
        milestoneId: updatedMilestone.id,
        contractId: milestone.contractId,
        amount: payment.amount,
        amountPaise: payment.amountPaise,
        status: updatedMilestone.status,
      };
    });
  }
}
