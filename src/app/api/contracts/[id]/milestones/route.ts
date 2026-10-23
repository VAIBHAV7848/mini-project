import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { StatePoller } from '@/core/engine-04-web/poller';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { globalEscrowFsm } from '@/core/engine-01-os/escrow-fsm';
import { globalLedgerCoordinator } from '@/core/engine-03-dbms/ledger';
import { globalContractManager } from '@/core/engine-03-dbms/contract-manager';
import { formatSuccessResponse, formatErrorResponse, NotFoundError, ValidationError, AuthorizationError } from '@/lib/errors';
import { contractActionSchema } from '@/lib/validation';
import { ContractAction, EscrowStatus } from '@/types';

export async function GET(
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

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundError('Contract', contractId);
    }

    RbacEnforcer.enforceContractAccess(session, contract);

    const snapshot = await StatePoller.pollContractState(contractId);
    return NextResponse.json(formatSuccessResponse(snapshot));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

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

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundError('Contract', contractId);
    }

    RbacEnforcer.enforceContractAccess(session, contract);

    const rawBody = await request.json();
    const validated = contractActionSchema.parse(rawBody);
    const action = validated.action as ContractAction;
    const milestoneId = validated.milestoneId;

    if (milestoneId) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        select: { id: true, contractId: true },
      });
      if (!milestone) throw new NotFoundError('Milestone', milestoneId);
      if (milestone.contractId !== contractId) {
        throw new ValidationError(`Milestone '${milestoneId}' does not belong to contract '${contractId}'.`);
      }
    }

    // Mutex locking on milestone or contract
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
          RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);
          if (session.role === 'CLIENT' && session.userId !== contract.clientId) {
            throw new AuthorizationError('Only the contracted client can authorize escrow release.');
          }
          const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
          if (!milestone) throw new NotFoundError('Milestone', milestoneId);

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
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
