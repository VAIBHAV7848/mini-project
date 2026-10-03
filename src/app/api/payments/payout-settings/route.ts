import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';
import { SettlementService } from '@/core/engine-03-dbms/payments/settlement-service';

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    RbacEnforcer.enforceRole(session, ['FREELANCER', 'ADMIN']);

    const body = await request.json();
    const settlementService = new SettlementService();

    const vendorId = `CF_BENE_${session.userId.replace(/-/g, '').slice(0, 10)}`;
    const payoutMethod = await settlementService.registerPayoutMethod({
      userId: session.userId,
      vendorId,
      accountType: body.method === 'UPI' ? 'UPI' : 'BANK_ACCOUNT',
      accountIdentifier: body.method === 'UPI' ? body.upiId : body.bankAccount?.accountNumber,
      ifsc: body.bankAccount?.ifsc,
      bankName: body.bankAccount?.beneficiaryName,
      isVerified: true,
    });

    return NextResponse.json(formatSuccessResponse(payoutMethod));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const settlementService = new SettlementService();
    const method = await settlementService.getPayoutMethod(session.userId);

    return NextResponse.json(formatSuccessResponse(method));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
