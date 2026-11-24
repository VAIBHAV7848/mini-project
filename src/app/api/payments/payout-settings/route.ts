import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';
import { SettlementService } from '@/core/engine-03-dbms/payments/settlement-service';

const payoutSettingsSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('UPI'),
    upiId: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI VPA format (e.g., handle@okaxis).'),
  }),
  z.object({
    method: z.enum(['BANK_ACCOUNT', 'BANK']),
    bankAccount: z.object({
      accountNumber: z
        .string()
        .trim()
        .regex(/^\d{9,18}$/, 'Account number must be 9-18 digits.'),
      ifsc: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (11 characters, e.g., HDFC0001234).'),
      beneficiaryName: z.string().trim().min(2, 'Beneficiary name is required.').max(100),
    }),
  }),
]);

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

    const rawBody = await request.json();
    const validated = payoutSettingsSchema.parse(rawBody);
    const settlementService = new SettlementService();

    const vendorId = `CF_BENE_${session.userId.replace(/-/g, '').slice(0, 10)}`;
    const payoutMethod = await settlementService.registerPayoutMethod({
      userId: session.userId,
      vendorId,
      accountType: validated.method === 'UPI' ? 'UPI' : 'BANK_ACCOUNT',
      accountIdentifier:
        validated.method === 'UPI' ? validated.upiId : validated.bankAccount.accountNumber,
      ifsc: validated.method !== 'UPI' ? validated.bankAccount.ifsc : undefined,
      bankName: validated.method !== 'UPI' ? validated.bankAccount.beneficiaryName : undefined,
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
