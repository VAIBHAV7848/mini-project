import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { WatchdogScheduler } from '@/core/engine-01-os/watchdog';
import { AuditLogger } from '@/core/engine-03-dbms/audit-logger';

describe('Engine 01 (OS) — Automated Watchdog Scheduler & Review Timeout (FR-02, D-02)', () => {
  const watchdog = new WatchdogScheduler();
  const auditLogger = new AuditLogger();

  let clientUser: any;
  let devUser: any;
  let contract: any;

  beforeEach(async () => {
    await prisma.milestone.updateMany({
      where: {
        status: 'SUBMITTED',
        reviewDeadline: { lt: new Date() },
      },
      data: { status: 'REVIEW_TIMEOUT' },
    });

    clientUser = await prisma.user.create({
      data: {
        email: `watchdog-client-${Date.now()}@test.local`,
        passwordHash: 'hashed',
        name: 'Watchdog Client',
        role: 'CLIENT',
        balance: 1000.0,
      },
    });

    devUser = await prisma.user.create({
      data: {
        email: `watchdog-dev-${Date.now()}@test.local`,
        passwordHash: 'hashed',
        name: 'Watchdog Dev',
        role: 'FREELANCER',
        balance: 0.0,
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: clientUser.id,
        title: 'Watchdog Timeout Test Project',
        description: 'Testing automatic milestone approval on review expiry',
        budget: 500.0,
        skillTags: '["typescript"]',
      },
    });

    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: clientUser.id,
        freelancerId: devUser.id,
        totalAmount: 500.0,
        escrowBalance: 500.0,
        status: 'FUNDED',
      },
    });
  });

  it('should transition overdue submitted deliverable to REVIEW_TIMEOUT when 7-day review window expires', async () => {
    // 8 days ago (expired)
    const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueMilestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Overdue Deliverable Milestone',
        description: 'Freelancer submitted work 8 days ago, client unresponsive',
        amount: 500.0,
        sequenceOrder: 1,
        status: 'SUBMITTED',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        reviewDeadline: pastDeadline,
      },
    });

    const results = await watchdog.processOverdueMilestones();

    expect(results).toHaveLength(1);
    expect(results[0].milestoneId).toBe(overdueMilestone.id);
    expect(results[0].timedOut).toBe(true);
    expect(results[0].status).toBe('REVIEW_TIMEOUT');

    const updated = await prisma.milestone.findUnique({
      where: { id: overdueMilestone.id },
    });
    expect(updated!.status).toBe('REVIEW_TIMEOUT');

    // Verify cryptographic audit chain integrity was preserved
    const auditStatus = await auditLogger.verifyAuditChain();
    expect(auditStatus.isValid).toBe(true);
    expect(auditStatus.tamperedRecordIds).toHaveLength(0);
  });

  it('should NOT auto-approve milestones when review window is still active', async () => {
    // Deadline is 3 days in future
    const futureDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const activeMilestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Active Deliverable Milestone',
        description: 'Review window still open for client',
        amount: 500.0,
        sequenceOrder: 2,
        status: 'SUBMITTED',
        dueDate: new Date(),
        reviewDeadline: futureDeadline,
      },
    });

    const results = await watchdog.processOverdueMilestones();

    expect(results).toHaveLength(0);

    const untouched = await prisma.milestone.findUnique({
      where: { id: activeMilestone.id },
    });
    expect(untouched!.status).toBe('SUBMITTED');
  });

  it('should never auto-approve disputed milestones even if review deadline has passed', async () => {
    const pastDeadline = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const disputedMilestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Disputed Milestone',
        description: 'Dispute raised, timers must freeze',
        amount: 500.0,
        sequenceOrder: 3,
        status: 'DISPUTED',
        dueDate: new Date(),
        reviewDeadline: pastDeadline,
      },
    });

    const results = await watchdog.processOverdueMilestones();
    expect(results.some((r) => r.milestoneId === disputedMilestone.id)).toBe(false);

    const untouched = await prisma.milestone.findUnique({
      where: { id: disputedMilestone.id },
    });
    expect(untouched!.status).toBe('DISPUTED');
  });

  it('should permit escrow release from REVIEW_TIMEOUT state', async () => {
    const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const timedOutMilestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Timed Out Milestone',
        description: 'Testing release from REVIEW_TIMEOUT',
        amount: 500.0,
        sequenceOrder: 10,
        status: 'SUBMITTED',
        dueDate: new Date(),
        reviewDeadline: pastDeadline,
      },
    });

    await watchdog.processOverdueMilestones();

    const inTimeout = await prisma.milestone.findUnique({
      where: { id: timedOutMilestone.id },
    });
    expect(inTimeout!.status).toBe('REVIEW_TIMEOUT');

    // System or Client triggers release from REVIEW_TIMEOUT
    const { LedgerCoordinator } = await import('@/core/engine-03-dbms/ledger');
    const ledger = new LedgerCoordinator();
    const receipt = await ledger.releaseMilestoneEscrow({
      contractId: contract.id,
      milestoneId: timedOutMilestone.id,
      freelancerId: devUser.id,
      amount: 500.0,
      actorId: 'SYSTEM',
    });

    expect(receipt.success).toBe(true);

    const released = await prisma.milestone.findUnique({
      where: { id: timedOutMilestone.id },
    });
    expect(released!.status).toBe('RELEASED');
  });
});
