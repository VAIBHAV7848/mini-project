import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { formatSuccessResponse, formatErrorResponse, NotFoundError, AuthorizationError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'orderId parameter is required.' } },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { upiOrderId: orderId },
          { providerOrderId: orderId },
          { id: orderId },
        ],
      },
      include: {
        client: {
          select: { id: true, balance: true, balancePaise: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment', orderId);
    }

    if (session.role !== 'ADMIN' && payment.clientId !== session.userId) {
      throw new AuthorizationError('You do not have permission to view this payment order.');
    }

    // Check expiry if still PENDING
    const isExpired = payment.status === 'PENDING' && (Date.now() - payment.createdAt.getTime() > 10 * 60 * 1000);
    const effectiveStatus = isExpired ? 'EXPIRED' : payment.status;

    return NextResponse.json(
      formatSuccessResponse({
        orderId: payment.upiOrderId || payment.providerOrderId || payment.id,
        status: effectiveStatus,
        amountInr: payment.amountPaise / 100,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        utr: payment.upiUtr || payment.providerPaymentId || null,
        newBalance: payment.client.balance,
        newBalancePaise: payment.client.balancePaise,
        adminNotes: payment.adminNotes || null,
        settledAt: payment.settledAt?.toISOString() || null,
        createdAt: payment.createdAt.toISOString(),
      })
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
