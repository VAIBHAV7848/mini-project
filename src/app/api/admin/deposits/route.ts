import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    RbacEnforcer.enforceRole(session, ['ADMIN']);

    const deposits = await prisma.payment.findMany({
      where: {
        provider: 'UPI',
        status: { in: ['PENDING', 'PENDING_REVIEW'] },
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = deposits.map((d) => ({
      id: d.id,
      orderId: d.upiOrderId || d.providerOrderId || d.id,
      clientId: d.clientId,
      clientName: d.client.name,
      clientEmail: d.client.email,
      amount: d.amountPaise / 100,
      amountPaise: d.amountPaise,
      currency: d.currency,
      status: d.status,
      clientUtr: d.upiUtr || d.providerPaymentId || null,
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json(formatSuccessResponse(formatted));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
