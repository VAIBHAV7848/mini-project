import { NextResponse } from 'next/server';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { UpiPaymentService } from '@/core/engine-03-dbms/payments/upi-payment-service';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';
import { z } from 'zod';

const rejectDepositSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3),
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

    RbacEnforcer.enforceRole(session, ['ADMIN']);

    const rawBody = await request.json();
    const validated = rejectDepositSchema.parse(rawBody);

    const result = await UpiPaymentService.rejectDepositVerification({
      orderId: validated.orderId,
      adminId: session.userId,
      adminRole: session.role,
      reason: validated.reason,
    });

    return NextResponse.json(formatSuccessResponse(result));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
