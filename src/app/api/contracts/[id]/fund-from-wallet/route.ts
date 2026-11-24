import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import {
  formatSuccessResponse,
  formatErrorResponse,
  NotFoundError,
  ValidationError,
  AuthorizationError,
  InvalidStateTransitionError,
} from '@/lib/errors';
import { z } from 'zod';

const fundFromWalletSchema = z.object({
  milestoneId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        milestones: { orderBy: { sequenceOrder: 'asc' } },
        client: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contract', contractId);
    }

    if (session.role === 'CLIENT' && contract.clientId !== session.userId) {
      throw new AuthorizationError('Only the contracted client can fund this milestone from wallet.');
    }

    const rawBody = await request.json();
    const validated = fundFromWalletSchema.parse(rawBody);

    const milestone = contract.milestones.find((m) => m.id === validated.milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone', validated.milestoneId);
    }

    // Idempotency: if already funded, return gracefully without debiting
    if (milestone.status === 'FUNDED') {
      return NextResponse.json(
        formatSuccessResponse({
          alreadyFunded: true,
          milestoneId: milestone.id,
          contractId: contract.id,
          message: 'Milestone is already funded.',
        })
      );
    }

    if (milestone.status !== 'AWAITING_DEPOSIT' && milestone.status !== 'PENDING') {
      throw new InvalidStateTransitionError(
        milestone.status,
        'FUND_MILESTONE',
        `Milestone is in state '${milestone.status}'. Only PENDING or AWAITING_DEPOSIT milestones can be funded.`
      );
    }

    // Sequential dependency check
    const precedingPending = contract.milestones.find(
      (m) => m.sequenceOrder < milestone.sequenceOrder && (m.status === 'PENDING' || m.status === 'AWAITING_DEPOSIT')
    );
    if (precedingPending) {
      throw new InvalidStateTransitionError(
        milestone.status,
        'FUND_MILESTONE',
        `Preceding milestone #${precedingPending.sequenceOrder} must be funded before milestone #${milestone.sequenceOrder}.`
      );
    }

    const lockKey = `contract:${contractId}`;
    const releaseLock = await globalKeyedMutex.acquire(lockKey);

    try {
      return await prisma.$transaction(async (tx) => {
        const freshContract = await tx.contract.findUnique({
          where: { id: contractId },
        });
        const freshMilestone = await tx.milestone.findUnique({
          where: { id: milestone.id },
        });

        if (!freshContract || !freshMilestone) {
          throw new NotFoundError('Milestone', milestone.id);
        }

        if (freshMilestone.status === 'FUNDED') {
          return NextResponse.json(
            formatSuccessResponse({
              alreadyFunded: true,
              milestoneId: freshMilestone.id,
              contractId: freshContract.id,
              message: 'Milestone is already funded.',
            })
          );
        }

        if (freshMilestone.status !== 'AWAITING_DEPOSIT' && freshMilestone.status !== 'PENDING') {
          throw new InvalidStateTransitionError(
            freshMilestone.status,
            'FUND_MILESTONE',
            `Milestone is in state '${freshMilestone.status}'. Only PENDING or AWAITING_DEPOSIT milestones can be funded.`
          );
        }

        // Fetch current user wallet balance inside transaction
        const client = await tx.user.findUnique({
          where: { id: freshContract.clientId },
        });

        if (!client) {
          throw new NotFoundError('User', freshContract.clientId);
        }

        const requiredPaise =
          freshMilestone.amountPaise > 0
            ? freshMilestone.amountPaise
            : Math.round(freshMilestone.amount * 100);
        const requiredInr = requiredPaise / 100;
        const availableClientPaise =
          client.balancePaise > 0 ? client.balancePaise : Math.round(client.balance * 100);

        if (availableClientPaise < requiredPaise) {
          throw new ValidationError(
            `Insufficient wallet balance. Required: ₹${requiredInr.toFixed(2)}, Available: ₹${(availableClientPaise / 100).toFixed(2)}.`
          );
        }

        const nextClientPaise = availableClientPaise - requiredPaise;
        const currentEscrowPaise =
          freshContract.escrowBalancePaise > 0
            ? freshContract.escrowBalancePaise
            : Math.round(freshContract.escrowBalance * 100);
        const nextEscrowPaise = currentEscrowPaise + requiredPaise;

        // 1. Debit client wallet balance (atomic float & integer paise)
        const updatedClient = await tx.user.update({
          where: { id: client.id },
          data: {
            balancePaise: nextClientPaise,
            balance: nextClientPaise / 100,
          },
        });

        // 2. Increment contract escrow vault
        const newContractStatus =
          freshContract.status === 'AWAITING_DEPOSIT' ? 'FUNDED' : freshContract.status;
        const updatedContract = await tx.contract.update({
          where: { id: freshContract.id },
          data: {
            escrowBalancePaise: nextEscrowPaise,
            escrowBalance: nextEscrowPaise / 100,
            status: newContractStatus,
          },
        });

        // 3. Update milestone to FUNDED
        const updatedMilestone = await tx.milestone.update({
          where: { id: freshMilestone.id },
          data: {
            status: 'FUNDED',
          },
        });

        // 4. Record EscrowTransaction (LOCK)
        const escrowTx = await tx.escrowTransaction.create({
          data: {
            contractId: freshContract.id,
            milestoneId: freshMilestone.id,
            fromUserId: client.id,
            toUserId: null, // Locked in escrow
            amount: requiredInr,
            amountPaise: requiredPaise,
            type: 'LOCK',
            status: 'COMPLETED',
          },
        });

        // 5. Append chained AuditLog
        await globalAuditLogger.logAction(
          {
            actorId: session.userId,
            entityName: 'Milestone',
            entityId: freshMilestone.id,
            action: 'MILESTONE_FUNDED_FROM_WALLET',
            previousState: freshMilestone.status,
            newState: 'FUNDED',
          },
          tx
        );

        return NextResponse.json(
          formatSuccessResponse({
            success: true,
            milestoneId: updatedMilestone.id,
            contractId: updatedContract.id,
            fundedAmountInr: requiredInr,
            fundedAmountPaise: requiredPaise,
            remainingWalletBalanceInr: updatedClient.balance,
            escrowTransactionId: escrowTx.id,
          })
        );
      });
    } finally {
      releaseLock();
    }
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
