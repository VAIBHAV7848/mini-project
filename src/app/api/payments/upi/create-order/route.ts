import { NextResponse } from 'next/server';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { UpiPaymentService } from '@/core/engine-03-dbms/payments/upi-payment-service';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';
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
