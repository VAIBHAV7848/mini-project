import prisma from '@/lib/db';
import { AuditLogger, globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { LedgerCoordinator, globalLedgerCoordinator } from '@/core/engine-03-dbms/ledger';
import { globalEvidenceTreeManager, EvidenceNodeType } from '@/core/engine-02-dsa-se/evidence-tree';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  InvalidStateTransitionError,
} from '@/lib/errors';

export interface MilestoneSplitInput {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
}

export interface CreateContractInput {
  proposalId: string;
  milestones: MilestoneSplitInput[];
  actorId: string;
}

export interface SubmitDeliverableInput {
  milestoneId: string;
  freelancerId: string;
  fileName: string;
  fileUrl: string;
  sha256Checksum: string;
  submissionNotes?: string;
}

export interface ApproveMilestoneInput {
  milestoneId: string;
  clientId: string;
}

export interface RaiseDisputeInput {
  milestoneId: string;
  raisedById: string;
  reason: string;
}

export interface ResolveDisputeInput {
  disputeId: string;
  reviewerId: string;
  ruling: 'RELEASE_TO_FREELANCER' | 'REFUND_TO_CLIENT';
  rulingNotes: string;
}

export class ContractManager {
  private auditLogger: AuditLogger;
  private ledger: LedgerCoordinator;

  constructor(
    auditLogger: AuditLogger = globalAuditLogger,
    ledger: LedgerCoordinator = globalLedgerCoordinator
  ) {
    this.auditLogger = auditLogger;
    this.ledger = ledger;
  }

  /**
   * Forms a contract from an accepted proposal and provisions sequential milestones.
   */
  async createContractFromProposal(input: CreateContractInput) {
    return await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.findUnique({
        where: { id: input.proposalId },
        include: { project: true },
      });

      if (!proposal) {
        throw new NotFoundError('Proposal', input.proposalId);
      }

      if (proposal.project.clientId !== input.actorId) {
        throw new AuthorizationError('Only the project owner can accept a proposal and form a contract.');
      }

      const totalSplit = input.milestones.reduce((acc, m) => acc + m.amount, 0);
      if (Math.abs(totalSplit - proposal.bidAmount) > 0.01) {
        throw new ValidationError(
          `Milestones total (${totalSplit.toFixed(2)}) must equal proposal bid amount (${proposal.bidAmount.toFixed(2)}).`
        );
      }

      // Create contract
      const contract = await tx.contract.create({
        data: {
          projectId: proposal.projectId,
          clientId: proposal.project.clientId,
          freelancerId: proposal.freelancerId,
          totalAmount: proposal.bidAmount,
          escrowBalance: 0.0,
          status: 'AWAITING_DEPOSIT',
        },
      });

      // Create sequential milestones
      for (let i = 0; i < input.milestones.length; i++) {
        const m = input.milestones[i];
        await tx.milestone.create({
          data: {
            contractId: contract.id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            sequenceOrder: i + 1,
            status: 'PENDING',
            dueDate: m.dueDate,
          },
        });
      }

      // Update proposal statuses
      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.proposal.updateMany({
        where: {
          projectId: proposal.projectId,
          id: { not: proposal.id },
        },
        data: { status: 'REJECTED' },
      });

      // Update project status
      await tx.project.update({
        where: { id: proposal.projectId },
        data: { status: 'IN_PROGRESS' },
      });

      // Append audit log
      await this.auditLogger.logAction(
        {
          actorId: input.actorId,
          entityName: 'Contract',
          entityId: contract.id,
          action: 'CONTRACT_FORMED',
          previousState: null,
          newState: 'AWAITING_DEPOSIT',
        },
        tx
      );

      return await tx.contract.findUnique({
        where: { id: contract.id },
        include: { milestones: true, client: true, freelancer: true, project: true },
      });
    });
  }

  /**
   * Retrieves a contract with all milestones, deliverable details, and transaction history.
   */
  async getContract(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        milestones: {
          include: {
            deliverable: true,
            dispute: {
              include: { evidenceItems: true },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        client: true,
        freelancer: true,
        project: true,
        escrowTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundError('Contract', contractId);
    }

    return contract;
  }

  /**
   * Freelancer starts work on a funded milestone.
   */
  async startMilestoneWork(milestoneId: string, freelancerId: string) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId);
    }

    if (milestone.contract.freelancerId !== freelancerId) {
      throw new AuthorizationError('Only the assigned freelancer can start work on this milestone.');
    }

    if (milestone.status !== 'FUNDED') {
      throw new InvalidStateTransitionError(
        milestone.status,
        'START_WORK',
        `Milestone must be in FUNDED state to begin work.`
      );
    }

    // Milestone sequencing guard (FR-12): Preceding milestones must be RELEASED or REFUNDED
    const priorIncomplete = await prisma.milestone.findFirst({
      where: {
        contractId: milestone.contractId,
        sequenceOrder: { lt: milestone.sequenceOrder },
        status: { notIn: ['RELEASED', 'REFUNDED'] },
      },
    });

    if (priorIncomplete) {
      throw new InvalidStateTransitionError(
        milestone.status,
        'START_WORK',
        `Preceding milestone #${priorIncomplete.sequenceOrder} is '${priorIncomplete.status}'. All prior milestones must be RELEASED or REFUNDED before starting milestone #${milestone.sequenceOrder}.`
      );
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'IN_PROGRESS' },
    });

    await this.auditLogger.logAction({
      actorId: freelancerId,
      entityName: 'Milestone',
      entityId: milestoneId,
      action: 'START_WORK',
      previousState: 'FUNDED',
      newState: 'IN_PROGRESS',
    });

    return updated;
  }

  /**
   * Freelancer submits a deliverable with cryptographic SHA-256 checksum.
   * Enforces 7-calendar-day review window timer.
   */
  async submitMilestoneDeliverable(input: SubmitDeliverableInput) {
    return await prisma.$transaction(async (tx) => {
      const milestone = await tx.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { contract: true },
      });

      if (!milestone) {
        throw new NotFoundError('Milestone', input.milestoneId);
      }

      if (milestone.contract.freelancerId !== input.freelancerId) {
        throw new AuthorizationError('Only the assigned freelancer can submit deliverables for this milestone.');
      }

      if (milestone.status !== 'IN_PROGRESS' && milestone.status !== 'FUNDED') {
        throw new InvalidStateTransitionError(
          milestone.status,
          'SUBMIT_DELIVERABLE',
          `Cannot submit deliverable for milestone with status '${milestone.status}'.`
        );
      }

      // Review window: 7 calendar days per Decision D-02
      const reviewDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create deliverable
      await tx.deliverable.upsert({
        where: { milestoneId: input.milestoneId },
        update: {
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          sha256Checksum: input.sha256Checksum,
          submissionNotes: input.submissionNotes ?? null,
          submittedAt: new Date(),
        },
        create: {
          milestoneId: input.milestoneId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          sha256Checksum: input.sha256Checksum,
          submissionNotes: input.submissionNotes ?? null,
        },
      });

      // Update milestone
      const updatedMilestone = await tx.milestone.update({
        where: { id: input.milestoneId },
        data: {
          status: 'SUBMITTED',
          reviewDeadline,
        },
      });

      await this.auditLogger.logAction(
        {
          actorId: input.freelancerId,
          entityName: 'Milestone',
          entityId: input.milestoneId,
          action: 'SUBMIT_DELIVERABLE',
          previousState: milestone.status,
          newState: 'SUBMITTED',
        },
        tx
      );

      return updatedMilestone;
    });
  }

  /**
   * Client reviews and approves a submitted deliverable.
   */
  async approveMilestone(input: ApproveMilestoneInput) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: input.milestoneId },
      include: { contract: true },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone', input.milestoneId);
    }

    if (milestone.contract.clientId !== input.clientId) {
      throw new AuthorizationError('Only the client can approve this milestone.');
    }

    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'UNDER_REVIEW') {
      throw new InvalidStateTransitionError(
        milestone.status,
        'APPROVE_MILESTONE',
        `Cannot approve milestone with status '${milestone.status}'.`
      );
    }

    const updated = await prisma.milestone.update({
      where: { id: input.milestoneId },
      data: { status: 'APPROVED' },
    });

    // Provision SettlementTransfer for administrative manual payout
    const grossPaise = milestone.amountPaise > 0 ? milestone.amountPaise : Math.round(milestone.amount * 100);
    const platformFeePaise = Math.round(grossPaise * 0.05);
    const netDisbursedPaise = grossPaise - platformFeePaise;
    const idempotencyKey = `SETTLE_${milestone.id}`;

    await prisma.settlementTransfer.upsert({
      where: { idempotencyKey },
      create: {
        id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        contractId: milestone.contractId,
        milestoneId: milestone.id,
        freelancerId: milestone.contract.freelancerId,
        beneficiaryId: `BEN_${milestone.contract.freelancerId}`,
        idempotencyKey,
        grossAmountPaise: grossPaise,
        platformFeePaise,
        netDisbursedPaise,
        payoutMode: 'MANUAL_UPI',
        status: 'PENDING',
      },
      update: {
        grossAmountPaise: grossPaise,
        platformFeePaise,
        netDisbursedPaise,
      },
    });

    await this.auditLogger.logAction({
      actorId: input.clientId,
      entityName: 'Milestone',
      entityId: input.milestoneId,
      action: 'APPROVE_MILESTONE',
      previousState: milestone.status,
      newState: 'APPROVED',
    });

    return updated;
  }

  /**
   * Raises a formal dispute on a milestone, freezing escrow.
   */
  async raiseMilestoneDispute(input: RaiseDisputeInput) {
    return await prisma.$transaction(async (tx) => {
      const milestone = await tx.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { contract: true },
      });

      if (!milestone) {
        throw new NotFoundError('Milestone', input.milestoneId);
      }

      const isParty =
        milestone.contract.clientId === input.raisedById ||
        milestone.contract.freelancerId === input.raisedById;

      if (!isParty) {
        throw new AuthorizationError('Only contracted parties can raise a dispute.');
      }

      if (
        milestone.status === 'RELEASED' ||
        milestone.status === 'REFUNDED' ||
        milestone.status === 'DISPUTED' ||
        milestone.status === 'PENDING'
      ) {
        throw new InvalidStateTransitionError(
          milestone.status,
          'RAISE_DISPUTE',
          `Cannot raise dispute on milestone with status '${milestone.status}'.`
        );
      }

      const dispute = await tx.dispute.create({
        data: {
          milestoneId: input.milestoneId,
          raisedById: input.raisedById,
          reason: input.reason,
          status: 'OPEN',
        },
      });

      await tx.milestone.update({
        where: { id: input.milestoneId },
        data: { status: 'DISPUTED' },
      });

      await tx.contract.update({
        where: { id: milestone.contractId },
        data: { status: 'DISPUTED' },
      });

      await this.auditLogger.logAction(
        {
          actorId: input.raisedById,
          entityName: 'Dispute',
          entityId: dispute.id,
          action: 'RAISE_DISPUTE',
          previousState: milestone.status,
          newState: 'DISPUTED',
        },
        tx
      );

      return dispute;
    });
  }

  /**
   * Independent reviewer executes a binding dispute ruling, directing escrow release or refund.
   */
  async resolveDispute(input: ResolveDisputeInput) {
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
        input.ruling,
        'Dispute is already resolved with a binding ruling.'
      );
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: input.reviewerId },
    });

    if (!reviewer || (reviewer.role !== 'REVIEWER' && reviewer.role !== 'ADMIN')) {
      throw new AuthorizationError('Only an authorized reviewer or administrator can issue dispute rulings.');
    }

    // Mark dispute resolved
    await prisma.dispute.update({
      where: { id: input.disputeId },
      data: {
        status: 'RESOLVED',
        reviewerId: input.reviewerId,
        ruling: input.ruling,
        rulingNotes: input.rulingNotes,
        resolvedAt: new Date(),
      },
    });

    await this.auditLogger.logAction({
      actorId: input.reviewerId,
      entityName: 'Dispute',
      entityId: dispute.id,
      action: input.ruling,
      previousState: dispute.status,
      newState: 'RESOLVED',
    });

    // Execute financial transfer
    if (input.ruling === 'RELEASE_TO_FREELANCER') {
      return await this.ledger.releaseMilestoneEscrow({
        contractId: dispute.milestone.contractId,
        milestoneId: dispute.milestoneId,
        freelancerId: dispute.milestone.contract.freelancerId,
        amount: dispute.milestone.amount,
        actorId: input.reviewerId,
      });
    } else {
      return await this.ledger.refundMilestoneEscrow({
        contractId: dispute.milestone.contractId,
        milestoneId: dispute.milestoneId,
        clientId: dispute.milestone.contract.clientId,
        amount: dispute.milestone.amount,
        actorId: input.reviewerId,
        reason: input.rulingNotes,
      });
    }
  }

  /**
   * Adds counter-evidence or supporting artifacts to an active dispute.
   */
  async addDisputeEvidence(input: {
    disputeId: string;
    submittedById: string;
    fileUrl: string;
    sha256Checksum: string;
    description: string;
  }) {
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
        'ADD_EVIDENCE',
        'Cannot submit evidence to an already resolved dispute.'
      );
    }

    const isParty =
      dispute.milestone.contract.clientId === input.submittedById ||
      dispute.milestone.contract.freelancerId === input.submittedById;

    const user = await prisma.user.findUnique({ where: { id: input.submittedById } });
    if (!isParty && user?.role !== 'ADMIN') {
      throw new AuthorizationError('Only contracted parties or administrators can submit dispute evidence.');
    }

    if (!/^[a-f0-9]{64}$/i.test(input.sha256Checksum)) {
      throw new ValidationError('sha256Checksum must be a valid 64-character hexadecimal digest.');
    }

    const evidence = await prisma.disputeEvidence.create({
      data: {
        disputeId: input.disputeId,
        submittedById: input.submittedById,
        fileUrl: input.fileUrl,
        sha256Checksum: input.sha256Checksum.toLowerCase(),
        description: input.description,
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await this.auditLogger.logAction({
      actorId: input.submittedById,
      entityName: 'DisputeEvidence',
      entityId: evidence.id,
      action: 'ADD_DISPUTE_EVIDENCE',
      previousState: dispute.status,
      newState: dispute.status,
    });

    return evidence;
  }

  /**
   * Constructs an in-memory N-ary EvidenceTree (Engine 02 · Darshan Kittur)
   * for a dispute and verifies Merkle hash integrity.
   */
  async getDisputeWithEvidenceTree(disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        raisedBy: { select: { id: true, name: true, role: true } },
        reviewer: { select: { id: true, name: true } },
        milestone: {
          include: {
            deliverable: true,
            contract: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                escrowBalance: true,
                client: { select: { id: true, name: true } },
                freelancer: { select: { id: true, name: true } },
              },
            },
          },
        },
        evidenceItems: {
          include: {
            submittedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute', disputeId);
    }

    // Construct in-memory N-ary EvidenceTree (Engine 02)
    const tree = globalEvidenceTreeManager.createRoot(
      dispute.id,
      `Dispute for Milestone: ${dispute.milestone.title}`
    );

    // Add deliverable as child node if present
    if (dispute.milestone.deliverable) {
      globalEvidenceTreeManager.addNode(tree, {
        id: dispute.milestone.deliverable.id,
        type: EvidenceNodeType.DELIVERABLE,
        title: `Deliverable: ${dispute.milestone.deliverable.fileName}`,
        metadata: {
          fileUrl: dispute.milestone.deliverable.fileUrl,
          submittedAt: dispute.milestone.deliverable.submittedAt.toISOString(),
        },
        payload: dispute.milestone.deliverable.sha256Checksum,
      });
    }

    // Add each evidence item as a child node
    for (const item of dispute.evidenceItems) {
      globalEvidenceTreeManager.addNode(tree, {
        id: item.id,
        type: EvidenceNodeType.COMMUNICATION,
        title: item.description,
        metadata: {
          submittedBy: item.submittedBy.name,
          role: item.submittedBy.role,
          fileUrl: item.fileUrl,
          submittedAt: item.submittedAt.toISOString(),
        },
        payload: item.sha256Checksum,
      });
    }

    // Compute Merkle root hash and verify tree integrity
    const rootHash = globalEvidenceTreeManager.computeMerkleHashes(tree);
    const verification = globalEvidenceTreeManager.verifyTreeIntegrity(tree);

    return {
      dispute,
      evidenceTree: tree,
      rootHash,
      isTampered: !verification.isValid,
      tamperedNodeIds: verification.tamperedNodeIds,
    };
  }
}

export const globalContractManager = new ContractManager();
