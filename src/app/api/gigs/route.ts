import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createGigSchema } from '@/lib/validation';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { formatSuccessResponse, formatErrorResponse, AuthenticationError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 ? Math.min(100, parsedLimit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [gigs, total] = await Promise.all([
      prisma.gig.findMany({
        where,
        include: {
          freelancer: {
            select: { id: true, name: true, devScore: true, githubProfile: true },
          },
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gig.count({ where }),
    ]);

    const formattedGigs = gigs.map((g) => {
      let parsedTiers = [];
      try {
        parsedTiers = JSON.parse(g.tiers);
      } catch {
        parsedTiers = [];
      }
      return {
        ...g,
        tiers: parsedTiers,
      };
    });

    return NextResponse.json(
      formatSuccessResponse({
        items: formattedGigs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
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
    RbacEnforcer.enforceRole(session, ['FREELANCER', 'ADMIN']);

    const body = await request.json();
    const validated = createGigSchema.parse(body);

    const gig = await prisma.gig.create({
      data: {
        freelancerId: session.userId,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        tiers: JSON.stringify(validated.tiers),
      },
      include: {
        freelancer: {
          select: { id: true, name: true, devScore: true },
        },
      },
    });

    await globalAuditLogger.logAction({
      actorId: session.userId,
      entityName: 'Gig',
      entityId: gig.id,
      action: 'CREATE_GIG',
      previousState: null,
      newState: 'ACTIVE',
    });

    return NextResponse.json(
      formatSuccessResponse({
        ...gig,
        tiers: validated.tiers,
      }),
      { status: 201 }
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
