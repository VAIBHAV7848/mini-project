import { NextResponse } from 'next/server';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { UpiPaymentService } from '@/core/engine-03-dbms/payments/upi-payment-service';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';
import { z } from 'zod';

const approveDepositSchema = z.object({
  orderId: z.string().min(1),
  bankUtr: z.string().min(8).max(22),
  adminNotes: z.string().optional(),
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
    const validated = approveDepositSchema.parse(rawBody);

    const result = await UpiPaymentService.approveDepositVerification({
      orderId: validated.orderId,
      adminId: session.userId,
      adminRole: session.role,
      bankUtr: validated.bankUtr,
      adminNotes: validated.adminNotes,
    });

    return NextResponse.json(formatSuccessResponse(result));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
