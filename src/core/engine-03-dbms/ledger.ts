/**
 * Engine 03 (DBMS Engine) — Double-Entry Transaction Ledger & Contract Manager
 * Owner: Purvi Sammatshetti (Roll No: 11, SRN: 02FE24BCS022)
 * Verified GitHub Account: purvisammatshetti <sammatshettipurvi@gmail.com>
 *
 * Implements ACID relational transaction boundaries, double-entry escrow balances,
 * and tamper-resistant audit logging in accordance with BCNF relational specifications.
 */

import prisma from '@/lib/db';
import { AuditLogger, globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { KeyedMutex, globalKeyedMutex } from '@/core/engine-01-os/mutex';
import {
  InsufficientFundsError,
  DoubleAllocationError,
  NotFoundError,
  InvalidStateTransitionError,
  ValidationError,
  AuthorizationError,
} from '@/lib/errors';

export interface DepositEscrowInput {
  contractId: string;
  clientId: string;
  amount: number;
}

export interface ReleaseEscrowInput {
  contractId: string;
  milestoneId: string;
  freelancerId: string;
  amount: number;
  actorId: string;
}

export interface RefundEscrowInput {
  contractId: string;
  milestoneId?: string;
  clientId: string;
  amount: number;
  actorId: string;
  reason?: string;
}

export interface TransactionReceipt {
  success: boolean;
  transactionId: string;
  contractId: string;
  amount: number;
  type: 'DEPOSIT' | 'RELEASE' | 'REFUND';
  timestamp: Date;
}

export class LedgerCoordinator {
  private auditLogger: AuditLogger;
  private mutex: KeyedMutex;

  constructor(auditLogger: AuditLogger = globalAuditLogger, mutex: KeyedMutex = globalKeyedMutex) {
    this.auditLogger = auditLogger;
    this.mutex = mutex;
  }

  /**
   * Atomic Escrow Deposit:
   * Debits client balance and credits contract escrow_balance within a single ACID transaction.
   * Mathematical invariant: Delta Client (-amount) + Delta Escrow (+amount) = 0.
   */
  async depositEscrow(input: DepositEscrowInput): Promise<TransactionReceipt> {
    return await this.mutex.runExclusive(input.contractId, async () => {
      return await prisma.$transaction(async (tx) => {
      // 1. Read & validate client balance
      const client = await tx.user.findUnique({
        where: { id: input.clientId },
      });

      if (!client) {
        throw new NotFoundError('User', input.clientId);
      }

      if (client.balance < input.amount) {
        throw new InsufficientFundsError(client.balance, input.amount);
      }

      // 2. Read & validate contract state
      const contract = await tx.contract.findUnique({
        where: { id: input.contractId },
      });

      if (!contract) {
        throw new NotFoundError('Contract', input.contractId);
      }

      if (contract.status === 'FUNDED' || contract.escrowBalance > 0) {
        throw new DoubleAllocationError(input.contractId);
      }

      if (contract.status !== 'AWAITING_DEPOSIT') {
        throw new InvalidStateTransitionError(
          contract.status,
          'DEPOSIT',
          `Cannot deposit to contract with status '${contract.status}'.`
        );
      }

      // 3. Debit client balance
      await tx.user.update({
        where: { id: input.clientId },
        data: {
          balance: { decrement: input.amount },
        },
      });

      // 4. Credit contract escrow balance and transition status
      await tx.contract.update({
        where: { id: input.contractId },
        data: {
          escrowBalance: { increment: input.amount },
          status: 'FUNDED',
        },
      });

      // 5. Update first milestone if in PENDING state
      await tx.milestone.updateMany({
        where: {
          contractId: input.contractId,
          sequenceOrder: 1,
          status: 'PENDING',
        },
        data: {
          status: 'FUNDED',
        },
      });

      // 6. Record transaction in ledger
      const txRecord = await tx.escrowTransaction.create({
        data: {
          contractId: input.contractId,
          fromUserId: input.clientId,
          toUserId: null,
          amount: input.amount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
        },
      });

      // 7. Chained audit logging
      await this.auditLogger.logAction(
        {
          actorId: input.clientId,
          entityName: 'Contract',
          entityId: input.contractId,
          action: 'DEPOSIT_ESCROW',
          previousState: 'AWAITING_DEPOSIT',
          newState: 'FUNDED',
        },
        tx
      );

      return {
        success: true,
        transactionId: txRecord.id,
        contractId: input.contractId,
        amount: input.amount,
        type: 'DEPOSIT',
        timestamp: txRecord.createdAt,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
    });
  }

  /**
   * Atomic Escrow Release:
   * Debits contract escrow_balance and credits freelancer balance within a single ACID transaction.
   * Mathematical invariant: Delta Escrow (-amount) + Delta Freelancer (+amount) = 0.
   */
  async releaseMilestoneEscrow(input: ReleaseEscrowInput): Promise<TransactionReceipt> {
    return await this.mutex.runExclusive(input.contractId, async () => {
      return await prisma.$transaction(async (tx) => {
      // 1. Read & validate contract escrow funds
      const contract = await tx.contract.findUnique({
        where: { id: input.contractId },
        include: { milestones: true },
      });

      if (!contract) {
        throw new NotFoundError('Contract', input.contractId);
      }

      if (contract.escrowBalance < input.amount) {
        throw new InsufficientFundsError(contract.escrowBalance, input.amount);
      }

      // 2. Read & validate milestone state
      const milestone = await tx.milestone.findUnique({
        where: { id: input.milestoneId },
      });

      if (!milestone) {
        throw new NotFoundError('Milestone', input.milestoneId);
      }

      if (milestone.contractId !== contract.id) {
        throw new ValidationError('Milestone does not belong to the specified contract.');
      }

      if (input.freelancerId !== contract.freelancerId) {
        throw new AuthorizationError('Payout recipient must match the contract freelancer.');
      }

      if (Math.abs(input.amount - milestone.amount) > 0.001) {
        throw new ValidationError('Release amount must exactly match the milestone amount.');
      }

      if (
        milestone.status !== 'APPROVED' &&
        milestone.status !== 'DISPUTED' &&
        milestone.status !== 'REVIEW_TIMEOUT'
      ) {
        throw new InvalidStateTransitionError(
          milestone.status,
          'RELEASE_ESCROW',
          `Cannot release escrow for milestone with status '${milestone.status}'. Must be APPROVED, REVIEW_TIMEOUT, or DISPUTED.`
        );
      }

      // 3. Debit contract escrow balance
      const updatedContract = await tx.contract.update({
        where: { id: input.contractId },
        data: {
          escrowBalance: { decrement: input.amount },
        },
      });

      // 4. Credit freelancer balance
      await tx.user.update({
        where: { id: input.freelancerId },
        data: {
          balance: { increment: input.amount },
        },
      });

      // 5. Update milestone state to RELEASED
      await tx.milestone.update({
        where: { id: input.milestoneId },
        data: {
          status: 'RELEASED',
        },
      });

      // 6. Milestone sequencing & contract overall status
      const allMilestones = await tx.milestone.findMany({
        where: { contractId: input.contractId },
        orderBy: { sequenceOrder: 'asc' },
      });

      // Activate next sequential milestone if pending and covered by remaining escrow
      const nextMilestone = allMilestones.find(
        (m) => m.sequenceOrder === milestone.sequenceOrder + 1 && m.status === 'PENDING'
      );
      if (nextMilestone && updatedContract.escrowBalance >= nextMilestone.amount) {
        await tx.milestone.update({
          where: { id: nextMilestone.id },
          data: { status: 'FUNDED' },
        });
      }

      const allResolved = allMilestones.every(
        (m) => m.id === input.milestoneId || m.status === 'RELEASED' || m.status === 'REFUNDED'
      );

      if (allResolved) {
        await tx.contract.update({
          where: { id: input.contractId },
          data: { status: 'RELEASED' },
        });
      }

      // 7. Record transaction in ledger
      const txRecord = await tx.escrowTransaction.create({
        data: {
          contractId: input.contractId,
          milestoneId: input.milestoneId,
          fromUserId: null,
          toUserId: input.freelancerId,
          amount: input.amount,
          type: 'RELEASE',
          status: 'COMPLETED',
        },
      });

      // 8. Chained audit logging
      await this.auditLogger.logAction(
        {
          actorId: input.actorId,
          entityName: 'Milestone',
          entityId: input.milestoneId,
          action: 'RELEASE_ESCROW',
          previousState: milestone.status,
          newState: 'RELEASED',
        },
        tx
      );

      return {
        success: true,
        transactionId: txRecord.id,
        contractId: input.contractId,
        amount: input.amount,
        type: 'RELEASE',
        timestamp: txRecord.createdAt,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
    });
  }

  /**
   * Atomic Escrow Refund:
   * Debits contract escrow_balance and credits client balance within a single ACID transaction.
   * Mathematical invariant: Delta Escrow (-amount) + Delta Client (+amount) = 0.
   */
  async refundMilestoneEscrow(input: RefundEscrowInput): Promise<TransactionReceipt> {
    return await this.mutex.runExclusive(input.contractId, async () => {
      return await prisma.$transaction(async (tx) => {
      // 1. Read & validate contract escrow funds
      const contract = await tx.contract.findUnique({
        where: { id: input.contractId },
      });

      if (!contract) {
        throw new NotFoundError('Contract', input.contractId);
      }

      if (contract.escrowBalance < input.amount) {
        throw new InsufficientFundsError(contract.escrowBalance, input.amount);
      }

      // 2. Debit contract escrow balance
      const updatedContract = await tx.contract.update({
        where: { id: input.contractId },
        data: {
          escrowBalance: { decrement: input.amount },
        },
      });

      // 3. Credit client balance
      await tx.user.update({
        where: { id: input.clientId },
        data: {
          balance: { increment: input.amount },
        },
      });

      // 4. Update milestone state if specified
      if (input.milestoneId) {
        const milestone = await tx.milestone.findUnique({
          where: { id: input.milestoneId },
        });

        if (milestone) {
          if (milestone.contractId !== contract.id) {
            throw new ValidationError('Milestone does not belong to the specified contract.');
          }
          if (milestone.status === 'RELEASED') {
            throw new InvalidStateTransitionError(
              milestone.status,
              'REFUND_ESCROW',
              'Cannot refund an already released milestone.'
            );
          }
          await tx.milestone.update({
            where: { id: input.milestoneId },
            data: { status: 'REFUNDED' },
          });

          await this.auditLogger.logAction(
            {
              actorId: input.actorId,
              entityName: 'Milestone',
              entityId: input.milestoneId,
              action: 'REFUND_ESCROW',
              previousState: milestone.status,
              newState: 'REFUNDED',
            },
            tx
          );
        }
      }

      // 5. Update contract status if fully refunded
      if (updatedContract.escrowBalance <= 0) {
        await tx.contract.update({
          where: { id: input.contractId },
          data: { status: 'REFUNDED' },
        });
      }

      // 6. Record transaction in ledger
      const txRecord = await tx.escrowTransaction.create({
        data: {
          contractId: input.contractId,
          milestoneId: input.milestoneId ?? null,
          fromUserId: null,
          toUserId: input.clientId,
          amount: input.amount,
          type: 'REFUND',
          status: 'COMPLETED',
        },
      });

      // 7. Chained audit logging
      await this.auditLogger.logAction(
        {
          actorId: input.actorId,
          entityName: 'Contract',
          entityId: input.contractId,
          action: 'REFUND_ESCROW',
          previousState: contract.status,
          newState: 'REFUNDED',
        },
        tx
      );

      return {
        success: true,
        transactionId: txRecord.id,
        contractId: input.contractId,
        amount: input.amount,
        type: 'REFUND',
        timestamp: txRecord.createdAt,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
    });
  }
}

export const globalLedgerCoordinator = new LedgerCoordinator();
