import { describe, it, expect } from 'vitest';
import {
  calculateProjectProgress,
  MilestoneProgressInput,
} from '@/core/engine-04-web/project-progress';

describe('Engine 04 (Web) — Milestone & Project Progress Calculator', () => {
  describe('Multi-Milestone Progress Calculation (3-Milestone Contract Flow)', () => {
    // Exact requested scenario: 1 RELEASED, 1 SUBMITTED, 1 FUNDED
    const demoMilestones: MilestoneProgressInput[] = [
      {
        id: 'm-1',
        title: 'Phase 1: Project Setup & Database Architecture',
        amount: 300,
        status: 'RELEASED',
        sequenceOrder: 1,
        deliverable: {
          id: 'del-1',
          fileName: 'schema.sql',
          sha256Checksum: 'a'.repeat(64),
        },
      },
      {
        id: 'm-2',
        title: 'Phase 2: API Endpoints & Escrow State Machine',
        amount: 400,
        status: 'SUBMITTED',
        sequenceOrder: 2,
        deliverable: {
          id: 'del-2',
          fileName: 'api-core.tar.gz',
          sha256Checksum: 'b'.repeat(64),
        },
      },
      {
        id: 'm-3',
        title: 'Phase 3: Client Dashboard & UI Testing',
        amount: 300,
        status: 'FUNDED',
        sequenceOrder: 3,
      },
    ];

    it('should accurately calculate 33% progress for 1 of 3 completed milestones', () => {
      const result = calculateProjectProgress(demoMilestones, 1000, 700);

      expect(result.totalMilestones).toBe(3);
      expect(result.completedMilestones).toBe(1);
      expect(result.pendingMilestones).toBe(2);
      expect(result.progressPercentage).toBe(33); // Math.round(1/3 * 100) = 33%
      expect(result.isAllCompleted).toBe(false);
    });

    it('should detect the first non-terminal milestone (Milestone 2 - SUBMITTED) as current active milestone', () => {
      const result = calculateProjectProgress(demoMilestones, 1000, 700);

      expect(result.currentMilestone).not.toBeNull();
      expect(result.currentMilestone?.id).toBe('m-2');
      expect(result.currentMilestone?.title).toBe('Phase 2: API Endpoints & Escrow State Machine');
      expect(result.currentMilestone?.status).toBe('SUBMITTED');
      expect(result.currentMilestone?.sequenceOrder).toBe(2);
    });

    it('should accurately calculate released funds vs protected escrow funds', () => {
      const result = calculateProjectProgress(demoMilestones, 1000, 700);

      expect(result.totalAmount).toBe(1000);
      expect(result.releasedAmount).toBe(300);
      expect(result.escrowBalance).toBe(700);
      expect(result.financialPercentage).toBe(30); // 300 / 1000 = 30%
    });

    it('should produce "Review Required" badge and APPROVE_MILESTONE action prompt for client', () => {
      const result = calculateProjectProgress(demoMilestones, 1000, 700);

      expect(result.statusBadge).toEqual({
        label: 'Review Required',
        variant: 'brand',
      });

      expect(result.clientActionPrompt).toEqual({
        action: 'APPROVE_MILESTONE',
        label: 'Review & Approve Deliverable',
        description:
          'Deliverable submitted with verified SHA-256 hash. Review deliverables to release milestone payment.',
      });
    });
  });

  describe('Sequential Progression & State Transitions', () => {
    it('should handle transition when Milestone 2 is APPROVED (ready for release)', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 300, status: 'RELEASED', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 400, status: 'APPROVED', sequenceOrder: 2 },
        { id: 'm-3', title: 'M3', amount: 300, status: 'FUNDED', sequenceOrder: 3 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 700);

      // Both RELEASED and APPROVED count toward completed milestone work
      expect(result.completedMilestones).toBe(2);
      expect(result.progressPercentage).toBe(67); // Math.round(2/3 * 100) = 67%
      expect(result.releasedAmount).toBe(300); // only M1 is RELEASED so far
      expect(result.currentMilestone?.id).toBe('m-2');
      expect(result.currentMilestone?.status).toBe('APPROVED');

      // Prompt client to release escrow
      expect(result.clientActionPrompt).toEqual({
        action: 'RELEASE_ESCROW',
        label: 'Release Milestone Escrow',
        description: 'Milestone is approved. Release escrow funds to the freelancer.',
      });
    });

    it('should handle 100% completion when all milestones are RELEASED', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 300, status: 'RELEASED', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 400, status: 'RELEASED', sequenceOrder: 2 },
        { id: 'm-3', title: 'M3', amount: 300, status: 'RELEASED', sequenceOrder: 3 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 0);

      expect(result.completedMilestones).toBe(3);
      expect(result.pendingMilestones).toBe(0);
      expect(result.progressPercentage).toBe(100);
      expect(result.financialPercentage).toBe(100);
      expect(result.releasedAmount).toBe(1000);
      expect(result.escrowBalance).toBe(0);
      expect(result.isAllCompleted).toBe(true);
      expect(result.statusBadge).toEqual({
        label: '100% Completed',
        variant: 'success',
      });
      expect(result.clientActionPrompt).toBeNull();
    });

    it('should handle project in AWAITING_DEPOSIT state', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 500, status: 'AWAITING_DEPOSIT', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 500, status: 'PENDING', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 0);

      expect(result.progressPercentage).toBe(0);
      expect(result.completedMilestones).toBe(0);
      expect(result.currentMilestone?.id).toBe('m-1');
      expect(result.statusBadge).toEqual({
        label: 'Awaiting Deposit',
        variant: 'warning',
      });
      expect(result.clientActionPrompt).toEqual({
        action: 'DEPOSIT',
        label: 'Deposit Escrow Funds',
        description: 'Deposit funds into escrow to allow the freelancer to commence work.',
      });
    });

    it('should handle active milestone IN_PROGRESS', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 500, status: 'IN_PROGRESS', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 500, status: 'PENDING', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 1000);

      expect(result.progressPercentage).toBe(0);
      expect(result.currentMilestone?.status).toBe('IN_PROGRESS');
      expect(result.statusBadge).toEqual({
        label: 'In Progress',
        variant: 'brand',
      });
      expect(result.clientActionPrompt).toBeNull();
    });

    it('should handle active milestone FUNDED', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 500, status: 'FUNDED', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 500, status: 'PENDING', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 1000);

      expect(result.currentMilestone?.status).toBe('FUNDED');
      expect(result.statusBadge).toEqual({
        label: 'Funded & Ready',
        variant: 'brand',
      });
      expect(result.clientActionPrompt).toBeNull();
    });

    it('should handle UNDER_REVIEW status as requiring review', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 500, status: 'UNDER_REVIEW', sequenceOrder: 1 },
      ];

      const result = calculateProjectProgress(milestones, 500, 500);

      expect(result.statusBadge).toEqual({
        label: 'Review Required',
        variant: 'brand',
      });
      expect(result.clientActionPrompt?.action).toBe('APPROVE_MILESTONE');
    });

    it('should handle frozen DISPUTED milestone status', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 300, status: 'RELEASED', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 700, status: 'DISPUTED', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 700);

      expect(result.completedMilestones).toBe(1);
      expect(result.currentMilestone?.id).toBe('m-2');
      expect(result.currentMilestone?.status).toBe('DISPUTED');
      expect(result.statusBadge).toEqual({
        label: 'Disputed · Frozen',
        variant: 'danger',
      });
      expect(result.clientActionPrompt).toBeNull();
    });
  });

  describe('Edge Cases & Defensive Calculations', () => {
    it('should handle empty milestones array gracefully', () => {
      const result = calculateProjectProgress([], 0, 0);

      expect(result.totalMilestones).toBe(0);
      expect(result.completedMilestones).toBe(0);
      expect(result.pendingMilestones).toBe(0);
      expect(result.progressPercentage).toBe(0);
      expect(result.financialPercentage).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.releasedAmount).toBe(0);
      expect(result.escrowBalance).toBe(0);
      expect(result.currentMilestone).toBeNull();
      expect(result.isAllCompleted).toBe(false);
      expect(result.statusBadge).toEqual({
        label: 'Not Started',
        variant: 'default',
      });
      expect(result.clientActionPrompt).toBeNull();
    });

    it('should default missing arguments cleanly', () => {
      const result = calculateProjectProgress();

      expect(result.totalMilestones).toBe(0);
      expect(result.progressPercentage).toBe(0);
      expect(result.financialPercentage).toBe(0);
      expect(result.currentMilestone).toBeNull();
    });

    it('should automatically compute totalAmount from milestone amounts if totalAmount is 0', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 250, status: 'RELEASED', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 750, status: 'IN_PROGRESS', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 0, 750);

      expect(result.totalAmount).toBe(1000); // 250 + 750
      expect(result.releasedAmount).toBe(250);
      expect(result.financialPercentage).toBe(25); // 250 / 1000 = 25%
    });

    it('should handle zero amounts without division-by-zero errors', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'Volunteer Task', amount: 0, status: 'RELEASED', sequenceOrder: 1 },
      ];

      const result = calculateProjectProgress(milestones, 0, 0);

      expect(result.financialPercentage).toBe(0);
      expect(result.progressPercentage).toBe(100);
      expect(result.isAllCompleted).toBe(true);
    });

    it('should sort milestones that are passed out of sequenceOrder', () => {
      const unorderedMilestones: MilestoneProgressInput[] = [
        { id: 'm-3', title: 'Third', amount: 200, status: 'PENDING', sequenceOrder: 3 },
        { id: 'm-1', title: 'First', amount: 300, status: 'RELEASED', sequenceOrder: 1 },
        { id: 'm-2', title: 'Second', amount: 500, status: 'IN_PROGRESS', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(unorderedMilestones, 1000, 700);

      // Active milestone must be sequenceOrder 2 ('Second'), not 'Third'
      expect(result.currentMilestone?.id).toBe('m-2');
      expect(result.currentMilestone?.sequenceOrder).toBe(2);
    });

    it('should treat REFUNDED as a terminal status and advance active milestone', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'Refunded Task', amount: 200, status: 'REFUNDED', sequenceOrder: 1 },
        { id: 'm-2', title: 'Next Task', amount: 800, status: 'FUNDED', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 800);

      // Current milestone skips m-1 (terminal REFUNDED) and points to m-2 (FUNDED)
      expect(result.currentMilestone?.id).toBe('m-2');
      expect(result.currentMilestone?.status).toBe('FUNDED');
    });

    it('should cap financial percentage at 100% even if amounts have minor discrepancies', () => {
      const milestones: MilestoneProgressInput[] = [
        { id: 'm-1', title: 'M1', amount: 600, status: 'RELEASED', sequenceOrder: 1 },
        { id: 'm-2', title: 'M2', amount: 600, status: 'RELEASED', sequenceOrder: 2 },
      ];

      const result = calculateProjectProgress(milestones, 1000, 0);

      expect(result.financialPercentage).toBe(100);
    });
  });
});
