import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createProjectSchema } from '@/lib/validation';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: {
          select: { proposals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(formatSuccessResponse(projects));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);

    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        clientId: session!.userId,
        title: validated.title,
        description: validated.description,
        budget: validated.budget,
        skillTags: JSON.stringify(validated.skillTags),
        status: 'OPEN',
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(formatSuccessResponse(project), { status: 201 });
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
