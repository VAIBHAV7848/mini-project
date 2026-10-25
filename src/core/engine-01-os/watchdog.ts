import prisma from '@/lib/db';
import { globalEscrowFsm } from './escrow-fsm';
import { globalKeyedMutex } from './mutex';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { EscrowStatus } from '@/types';
import { logger } from '@/lib/logger';

export interface WatchdogTimeoutResult {
  milestoneId: string;
  contractId: string;
  timedOut: boolean;
  status: EscrowStatus;
  autoApproved?: boolean; // backwards compatibility
  error?: string;
}

export class WatchdogScheduler {
  async processOverdueMilestones(now = new Date()): Promise<WatchdogTimeoutResult[]> {
    const overdueMilestones = await prisma.milestone.findMany({
      where: {
        status: { in: ['UNDER_REVIEW', 'SUBMITTED'] },
        reviewDeadline: {
          lte: now,
        },
      },
      include: {
        contract: true,
      },
    });

    const results: WatchdogTimeoutResult[] = [];

    for (const milestone of overdueMilestones) {
      const releaseLock = await globalKeyedMutex.acquire(milestone.id);

      try {
        // Re-check milestone status inside mutex critical section (prevent TOCTOU)
        const freshMilestone = await prisma.milestone.findUnique({
          where: { id: milestone.id },
          include: { contract: true },
        });

        if (
          !freshMilestone ||
          (freshMilestone.status !== 'UNDER_REVIEW' && freshMilestone.status !== 'SUBMITTED')
        ) {
          continue;
        }

        // Validate FSM transition legality for watchdog review timeout (returns REVIEW_TIMEOUT)
        const nextState = globalEscrowFsm.assertValidTransition(
          freshMilestone.status as EscrowStatus,
          'TIMEOUT_WATCHDOG',
          'SYSTEM'
        );

        // Atomic milestone transition and cryptographically chained audit log insertion
        await prisma.$transaction(async (tx) => {
          await tx.milestone.update({
            where: { id: freshMilestone.id },
            data: {
              status: nextState,
              updatedAt: new Date(),
            },
          });

          await globalAuditLogger.logAction(
            {
              actorId: 'SYSTEM_WATCHDOG',
              entityName: 'Milestone',
              entityId: freshMilestone.id,
              action: 'WATCHDOG_REVIEW_TIMEOUT',
              previousState: freshMilestone.status,
              newState: nextState,
            },
            tx
          );
        }, {
          maxWait: 15000,
          timeout: 30000,
        });

        logger.info('Watchdog transitioned milestone to REVIEW_TIMEOUT due to review deadline expiration', {
          service: 'engine-01-os',
          milestoneId: freshMilestone.id,
          contractId: freshMilestone.contractId,
        });

        results.push({
          milestoneId: freshMilestone.id,
          contractId: freshMilestone.contractId,
          timedOut: true,
          status: nextState,
          autoApproved: true,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error('Failed to auto-approve overdue milestone', {
          service: 'engine-01-os',
          milestoneId: milestone.id,
          error: errorMsg,
        });
        results.push({
          milestoneId: milestone.id,
          contractId: milestone.contractId,
          timedOut: false,
          status: milestone.status as EscrowStatus,
          autoApproved: false,
          error: errorMsg,
        });
      } finally {
        releaseLock();
      }
    }

    return results;
  }
}

export const globalWatchdog = new WatchdogScheduler();
