import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { submitProposalSchema } from '@/lib/validation';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { HeuristicSemanticMatcher } from '@/core/engine-02-dsa-se/matcher';
import { formatSuccessResponse, formatErrorResponse, NotFoundError } from '@/lib/errors';

const matcher = new HeuristicSemanticMatcher();

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
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'PARAM_REQUIRED', message: 'projectId query parameter is required.' } },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const whereClause: any = { projectId };
    if (session.role === 'FREELANCER') {
      whereClause.freelancerId = session.userId;
    } else if (session.role === 'CLIENT' && project.clientId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to view proposals for this project.' } },
        { status: 403 }
      );
    }

    const proposals = await prisma.proposal.findMany({
      where: whereClause,
      include: {
        freelancer: {
          select: { id: true, name: true, devScore: true, githubProfile: true },
        },
      },
      orderBy: { aiMatchScore: 'desc' },
    });

    return NextResponse.json(formatSuccessResponse(proposals));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    RbacEnforcer.enforceRole(session, ['FREELANCER', 'ADMIN']);

    const body = await request.json();
    const validated = submitProposalSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project', validated.projectId);
    }

    const freelancer = await prisma.user.findUnique({
      where: { id: session!.userId },
    });

    if (!freelancer) {
      throw new NotFoundError('User', session!.userId);
    }

    // Parse project skill tags
    let projectSkills: string[] = [];
    try {
      projectSkills = JSON.parse(project.skillTags);
    } catch {
      projectSkills = [project.skillTags];
    }

    // Calculate deterministic heuristic AI match score (Engine 02 · FR-11)
    const matchAnalysis = matcher.calculateMatchScore(
      {
        budget: project.budget,
        skillTags: projectSkills,
      },
      {
        bidAmount: validated.bidAmount,
        freelancerSkills: projectSkills.slice(0, 3), // Freelancer skill tags match sample
        devScore: freelancer.devScore,
      }
    );

    const proposal = await prisma.proposal.upsert({
      where: {
        projectId_freelancerId: {
          projectId: validated.projectId,
          freelancerId: session!.userId,
        },
      },
      update: {
        bidAmount: validated.bidAmount,
        coverLetter: validated.coverLetter,
        aiMatchScore: matchAnalysis.compositeScore,
      },
      create: {
        projectId: validated.projectId,
        freelancerId: session!.userId,
        bidAmount: validated.bidAmount,
        coverLetter: validated.coverLetter,
        aiMatchScore: matchAnalysis.compositeScore,
        status: 'PENDING',
      },
      include: {
        freelancer: { select: { id: true, name: true, devScore: true } },
      },
    });

    return NextResponse.json(
      formatSuccessResponse({
        proposal,
        matchAnalysis,
      }),
      { status: 201 }
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
