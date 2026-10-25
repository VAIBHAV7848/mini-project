import prisma from '@/lib/db';
import { NotFoundError } from '@/lib/errors';

export interface MilestonePollItem {
  id: string;
  sequenceOrder: number;
  title: string;
  amount: number;
  status: string;
  reviewDeadline: string | null;
  hasDeliverable: boolean;
  hasDispute: boolean;
  deliverable?: {
    id: string;
    fileName: string;
    fileUrl: string;
    sha256Checksum: string;
    submissionNotes?: string | null;
    submittedAt?: string;
  } | null;
}

export interface ContractPollSnapshot {
  contractId: string;
  status: string;
  escrowBalance: number;
  totalAmount: number;
  updatedAt: string;
  milestones: MilestonePollItem[];
}

export class StatePoller {
  /**
   * Generates a lightweight, indexed state snapshot for 5-second UI polling loops (FR-10).
   */
  static async pollContractState(contractId: string): Promise<ContractPollSnapshot> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        status: true,
        escrowBalance: true,
        totalAmount: true,
        updatedAt: true,
        milestones: {
          select: {
            id: true,
            sequenceOrder: true,
            title: true,
            amount: true,
            status: true,
            reviewDeadline: true,
            deliverable: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                sha256Checksum: true,
                submissionNotes: true,
                submittedAt: true,
              },
            },
            dispute: { select: { id: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundError('Contract', contractId);
    }

    return {
      contractId: contract.id,
      status: contract.status,
      escrowBalance: contract.escrowBalance,
      totalAmount: contract.totalAmount,
      updatedAt: contract.updatedAt.toISOString(),
      milestones: contract.milestones.map((m) => ({
        id: m.id,
        sequenceOrder: m.sequenceOrder,
        title: m.title,
        amount: m.amount,
        status: m.status,
        reviewDeadline: m.reviewDeadline ? m.reviewDeadline.toISOString() : null,
        hasDeliverable: !!m.deliverable,
        hasDispute: !!m.dispute,
        deliverable: m.deliverable
          ? {
              id: m.deliverable.id,
              fileName: m.deliverable.fileName,
              fileUrl: m.deliverable.fileUrl,
              sha256Checksum: m.deliverable.sha256Checksum,
              submissionNotes: m.deliverable.submissionNotes,
              submittedAt: m.deliverable.submittedAt.toISOString(),
            }
          : null,
      })),
    };
  }
}
