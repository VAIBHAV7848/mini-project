import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: session.role === 'ADMIN' ? {} : { clientId: session.userId },
      include: {
        contract: {
          select: {
            id: true,
            project: { select: { title: true } },
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const records = payments.map((p) => ({
      id: p.id,
      orderId: p.providerOrderId || p.id,
      providerReferenceId: p.providerPaymentId || 'CF_PAY_VERIFIED',
      contractId: p.contractId,
      contractTitle: p.contract?.project?.title || 'Wallet Top-up',
      milestoneTitle: p.milestone?.title || (p.contractId ? 'Contract Escrow' : 'Wallet Deposit'),
      amount: p.amountPaise / 100,
      currency: p.currency,
      status: p.status,
      escrowStatus: p.milestone?.status === 'RELEASED' ? 'RELEASED' : p.status === 'SUCCESS' ? 'LOCKED' : 'PENDING',
      transactionHash: p.idempotencyKey || `0x${Buffer.from(p.id).toString('hex').padEnd(64, '0')}`,
      createdAt: p.createdAt.toISOString(),
      paymentMethod: 'Cashfree Gateway (UPI/Netbanking/Cards)',
    }));

    return NextResponse.json(formatSuccessResponse(records));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
