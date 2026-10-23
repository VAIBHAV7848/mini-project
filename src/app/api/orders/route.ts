import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { placeOrderSchema } from '@/lib/validation';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { formatSuccessResponse, formatErrorResponse, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      throw new AuthenticationError('Authentication required.');
    }
    RbacEnforcer.enforceRole(session, ['CLIENT', 'FREELANCER', 'ADMIN']);

    const where: any = {};
    if (session.role === 'CLIENT') {
      where.clientId = session.userId;
    } else if (session.role === 'FREELANCER') {
      where.gig = { freelancerId: session.userId };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        gig: {
          select: { id: true, title: true, category: true, freelancer: { select: { id: true, name: true } } },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(formatSuccessResponse(orders));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      throw new AuthenticationError('Authentication required.');
    }
    RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);

    const body = await request.json();
    const validated = placeOrderSchema.parse(body);

    const gig = await prisma.gig.findUnique({
      where: { id: validated.gigId },
    });

    if (!gig) {
      throw new NotFoundError('Gig', validated.gigId);
    }

    let parsedTiers: Array<{ name: string; price: number }> = [];
    try {
      parsedTiers = JSON.parse(gig.tiers);
    } catch {
      parsedTiers = [];
    }

    const matchedTier = parsedTiers.find(
      (t) => t.name.toLowerCase() === validated.tierName.toLowerCase()
    );

    if (!matchedTier) {
      throw new ValidationError(`Tier '${validated.tierName}' is not offered for this gig.`);
    }

    if (Math.abs(validated.amount - matchedTier.price) > 0.001) {
      throw new ValidationError(
        `Submitted amount (₹${validated.amount}) does not match authoritative tier price (₹${matchedTier.price}).`
      );
    }

    const order = await prisma.order.create({
      data: {
        gigId: validated.gigId,
        clientId: session.userId,
        tierName: matchedTier.name,
        amount: matchedTier.price,
        status: 'PENDING',
      },
      include: {
        gig: { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
      },
    });

    await globalAuditLogger.logAction({
      actorId: session.userId,
      entityName: 'Order',
      entityId: order.id,
      action: 'PLACE_ORDER',
      previousState: null,
      newState: 'PENDING',
    });

    return NextResponse.json(formatSuccessResponse(order), { status: 201 });
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
