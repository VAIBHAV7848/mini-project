/**
 * Engine 04 (Web Technologies) - Project & Milestone Progress Domain Calculator
 * Kle Technological University - Team 07
 */

export interface MilestoneProgressInput {
  id: string;
  title: string;
  amount: number;
  status: string;
  sequenceOrder: number;
  dueDate?: Date | string | null;
  reviewDeadline?: Date | string | null;
  deliverable?: {
    id?: string;
    fileName?: string;
    sha256Checksum?: string;
    submittedAt?: Date | string;
  } | null;
}

export interface ProjectProgressSummary {
  totalMilestones: number;
  completedMilestones: number;
  pendingMilestones: number;
  progressPercentage: number;
  financialPercentage: number;
  totalAmount: number;
  releasedAmount: number;
  escrowBalance: number;
  currentMilestone: MilestoneProgressInput | null;
  isAllCompleted: boolean;
  statusBadge: {
    label: string;
    variant: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  };
  clientActionPrompt?: {
    action: string;
    label: string;
    description: string;
  } | null;
}

const TERMINAL_STATUSES = new Set(['RELEASED', 'REFUNDED']);

/**
 * Calculates deterministic execution and financial progress metrics for a project/contract.
 */
export function calculateProjectProgress(
  milestones: MilestoneProgressInput[] = [],
  totalAmount: number = 0,
  escrowBalance: number = 0
): ProjectProgressSummary {
  const sortedMilestones = [...milestones].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const totalMilestones = sortedMilestones.length;

  const completedList = sortedMilestones.filter(
    (m) => m.status === 'RELEASED' || m.status === 'APPROVED'
  );
  const completedMilestones = completedList.length;
  const pendingMilestones = Math.max(0, totalMilestones - completedMilestones);

  const progressPercentage =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const releasedAmount = sortedMilestones
    .filter((m) => m.status === 'RELEASED')
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  const effectiveTotal =
    totalAmount > 0
      ? totalAmount
      : sortedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);

  const financialPercentage =
    effectiveTotal > 0 ? Math.min(100, Math.round((releasedAmount / effectiveTotal) * 100)) : 0;

  // Find first active (non-terminal) milestone
  const currentMilestone =
    sortedMilestones.find((m) => !TERMINAL_STATUSES.has(m.status)) ??
    (sortedMilestones.length > 0 ? sortedMilestones[sortedMilestones.length - 1] : null);

  const isAllCompleted = totalMilestones > 0 && completedMilestones === totalMilestones;

  // Determine user-friendly status badge
  let statusBadge: ProjectProgressSummary['statusBadge'] = {
    label: 'Not Started',
    variant: 'default',
  };

  if (isAllCompleted) {
    statusBadge = { label: '100% Completed', variant: 'success' };
  } else if (currentMilestone) {
    switch (currentMilestone.status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        statusBadge = { label: 'Review Required', variant: 'brand' };
        break;
      case 'IN_PROGRESS':
        statusBadge = { label: 'In Progress', variant: 'brand' };
        break;
      case 'FUNDED':
        statusBadge = { label: 'Funded & Ready', variant: 'brand' };
        break;
      case 'AWAITING_DEPOSIT':
        statusBadge = { label: 'Awaiting Deposit', variant: 'warning' };
        break;
      case 'DISPUTED':
        statusBadge = { label: 'Disputed · Frozen', variant: 'danger' };
        break;
      default:
        statusBadge = { label: currentMilestone.status, variant: 'default' };
    }
  }

  // Client prompt recommendation
  let clientActionPrompt: ProjectProgressSummary['clientActionPrompt'] = null;
  if (currentMilestone) {
    if (currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW') {
      clientActionPrompt = {
        action: 'APPROVE_MILESTONE',
        label: 'Review & Approve Deliverable',
        description:
          'Deliverable submitted with verified SHA-256 hash. Review deliverables to release milestone payment.',
      };
    } else if (currentMilestone.status === 'APPROVED') {
      clientActionPrompt = {
        action: 'RELEASE_ESCROW',
        label: 'Release Milestone Escrow',
        description: 'Milestone is approved. Release escrow funds to the freelancer.',
      };
    } else if (currentMilestone.status === 'AWAITING_DEPOSIT') {
      clientActionPrompt = {
        action: 'DEPOSIT',
        label: 'Deposit Escrow Funds',
        description: 'Deposit funds into escrow to allow the freelancer to commence work.',
      };
    }
  }

  return {
    totalMilestones,
    completedMilestones,
    pendingMilestones,
    progressPercentage,
    financialPercentage,
    totalAmount: effectiveTotal,
    releasedAmount,
    escrowBalance,
    currentMilestone,
    isAllCompleted,
    statusBadge,
    clientActionPrompt,
  };
}
