import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { UpiPaymentService } from '@/core/engine-03-dbms/payments/upi-payment-service';
import { formatSuccessResponse, formatErrorResponse, AuthorizationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const createUpiOrderBodySchema = z.object({
  amountInr: z.number().positive(),
  contractId: z.string().optional(),
  milestoneId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);

    const rawBody = await request.json();
    const validated = createUpiOrderBodySchema.parse(rawBody);

    if (validated.contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: validated.contractId },
        select: { id: true, clientId: true },
      });
      if (!contract) {
        throw new NotFoundError('Contract', validated.contractId);
      }
      if (session.role === 'CLIENT' && contract.clientId !== session.userId) {
        throw new AuthorizationError('You are not authorized to fund this contract.');
      }
    }

    if (validated.milestoneId) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: validated.milestoneId },
        include: { contract: { select: { clientId: true } } },
      });
      if (!milestone) {
        throw new NotFoundError('Milestone', validated.milestoneId);
      }
      if (validated.contractId && milestone.contractId !== validated.contractId) {
        throw new AuthorizationError('Milestone does not belong to the specified contract.');
      }
      if (session.role === 'CLIENT' && milestone.contract.clientId !== session.userId) {
        throw new AuthorizationError('You are not authorized to fund this milestone.');
      }
    }

    const order = await UpiPaymentService.createOrder({
      clientId: session.userId,
      amountInr: validated.amountInr,
      contractId: validated.contractId,
      milestoneId: validated.milestoneId,
      customerName: validated.customerName || session.name,
      customerEmail: validated.customerEmail || session.email,
    });

    return NextResponse.json(formatSuccessResponse(order), { status: 201 });
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
