import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { globalEscrowFsm } from '@/core/engine-01-os/escrow-fsm';
import { globalLedgerCoordinator } from '@/core/engine-03-dbms/ledger';
import { globalContractManager } from '@/core/engine-03-dbms/contract-manager';
import {
  formatSuccessResponse,
  formatErrorResponse,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '@/lib/errors';
import { contractActionSchema } from '@/lib/validation';
import { ContractAction, EscrowStatus } from '@/types';

const formContractSchema = z.object({
  proposalId: z.string().uuid(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().min(5),
        amount: z.number().positive(),
        dueDate: z.string().datetime(),
      })
    )
    .min(1),
});

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const whereClause: any = {};
    if (session.role === 'CLIENT') {
      whereClause.clientId = session.userId;
    } else if (session.role === 'FREELANCER') {
      whereClause.freelancerId = session.userId;
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        project: { select: { title: true, budget: true } },
        client: { select: { id: true, name: true } },
        freelancer: { select: { id: true, name: true } },
        milestones: {
          orderBy: { sequenceOrder: 'asc' },
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            sequenceOrder: true,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(formatSuccessResponse(contracts));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Core Contract Action Protocol (Slide 17, api-design.md Section 4)
    if (body.action) {
      const validated = contractActionSchema.parse(body);
      const action = validated.action as ContractAction;
      const contractId = validated.contractId;
      if (!contractId) {
        throw new ValidationError('contractId is required for contract actions.');
      }

      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundError('Contract', contractId);
      }

      RbacEnforcer.enforceContractAccess(session, contract);

      const milestoneId = validated.milestoneId;
      if (milestoneId) {
        const milestoneCheck = await prisma.milestone.findUnique({ where: { id: milestoneId } });
        if (!milestoneCheck) throw new NotFoundError('Milestone', milestoneId);
        if (milestoneCheck.contractId !== contract.id) {
          throw new ValidationError('Milestone does not belong to the specified contract.');
        }
      }

      const lockKey = milestoneId || contractId;
      const releaseLock = await globalKeyedMutex.acquire(lockKey);

      try {
        switch (action) {
          case 'DEPOSIT': {
            RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);
            if (session.role === 'CLIENT' && session.userId !== contract.clientId) {
              throw new AuthorizationError('Only the contracted client can deposit escrow funds.');
            }
            globalEscrowFsm.assertValidTransition(
              contract.status as EscrowStatus,
              'DEPOSIT',
              session.role
            );
            const receipt = await globalLedgerCoordinator.depositEscrow({
              contractId,
              clientId: contract.clientId,
              amount: contract.totalAmount,
            });
            return NextResponse.json(formatSuccessResponse(receipt));
          }

          case 'START_WORK': {
            if (!milestoneId) throw new ValidationError('milestoneId is required to start work.');
            RbacEnforcer.enforceRole(session, ['FREELANCER', 'ADMIN']);
            const updated = await globalContractManager.startMilestoneWork(milestoneId, session.userId);
            return NextResponse.json(formatSuccessResponse(updated));
          }

          case 'SUBMIT_DELIVERABLE': {
            if (!milestoneId) throw new ValidationError('milestoneId is required to submit deliverable.');
            if (!validated.sha256Checksum) {
              throw new ValidationError('sha256Checksum is required for deliverable submission.');
            }
            RbacEnforcer.enforceRole(session, ['FREELANCER', 'ADMIN']);
            const updated = await globalContractManager.submitMilestoneDeliverable({
              milestoneId,
              freelancerId: session.userId,
              fileName: validated.fileName || 'deliverable-archive.zip',
              fileUrl: validated.fileUrl || 'https://storage.local/deliverable.zip',
              sha256Checksum: validated.sha256Checksum,
              submissionNotes: validated.notes || validated.submissionNotes,
            });
            return NextResponse.json(formatSuccessResponse(updated));
          }

          case 'APPROVE_MILESTONE': {
            if (!milestoneId) throw new ValidationError('milestoneId is required.');
            RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);
            const updated = await globalContractManager.approveMilestone({
              milestoneId,
              clientId: session.userId,
            });
            return NextResponse.json(formatSuccessResponse(updated));
          }

          case 'RELEASE_ESCROW': {
            if (!milestoneId) throw new ValidationError('milestoneId is required.');
            const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
            if (!milestone) throw new NotFoundError('Milestone', milestoneId);

            if (milestone.status === 'REVIEW_TIMEOUT') {
              RbacEnforcer.enforceRole(session, ['CLIENT', 'FREELANCER', 'ADMIN']);
              if (session.role === 'FREELANCER' && session.userId !== contract.freelancerId) {
                throw new AuthorizationError('Only the assigned freelancer can claim funds on review timeout.');
              }
            } else {
              RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);
              if (session.role === 'CLIENT' && session.userId !== contract.clientId) {
                throw new AuthorizationError('Only the contracted client can authorize escrow release.');
              }
            }

            const receipt = await globalLedgerCoordinator.releaseMilestoneEscrow({
              contractId,
              milestoneId,
              freelancerId: contract.freelancerId,
              amount: milestone.amount,
              actorId: session.userId,
            });
            return NextResponse.json(formatSuccessResponse(receipt));
          }

          case 'RAISE_DISPUTE': {
            if (!milestoneId) throw new ValidationError('milestoneId is required.');
            const dispute = await globalContractManager.raiseMilestoneDispute({
              milestoneId,
              raisedById: session.userId,
              reason: validated.reason || 'Deliverable failed to fulfill acceptance criteria.',
            });
            return NextResponse.json(formatSuccessResponse(dispute), { status: 201 });
          }

          default:
            throw new ValidationError(`Unsupported contract action: '${action}'.`);
        }
      } finally {
        releaseLock();
      }
    }

    // Default: Contract creation from proposal
    RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);
    const validated = formContractSchema.parse(body);

    const contract = await globalContractManager.createContractFromProposal({
      proposalId: validated.proposalId,
      actorId: session.userId,
      milestones: validated.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        amount: m.amount,
        dueDate: new Date(m.dueDate),
      })),
    });

    return NextResponse.json(formatSuccessResponse(contract), { status: 201 });
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
