import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { SessionService } from '@/core/engine-04-web/session';
import { RagContractGenerator } from '@/core/engine-02-dsa-se/rag-contract-generator';
import {
  formatSuccessResponse,
  formatErrorResponse,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors';

import { entityIdSchema } from '@/lib/validation';

const generateRagSchema = z.object({
  proposalId: entityIdSchema,
  chatTranscript: z.string().optional().default(''),
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

    const body = await request.json();
    const validated = generateRagSchema.parse(body);

    // Retrieve proposal and associated project
    const proposal = await prisma.proposal.findUnique({
      where: { id: validated.proposalId },
      include: {
        project: true,
        freelancer: {
          select: { id: true, name: true, devScore: true },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundError(`Proposal with id ${validated.proposalId} not found.`);
    }

    // RBAC: Client who owns the project, the freelancer, or an admin can trigger RAG milestone drafting
    if (
      session.role !== 'ADMIN' &&
      session.userId !== proposal.project.clientId &&
      session.userId !== proposal.freelancerId
    ) {
      throw new AuthorizationError('You are not authorized to draft contract milestones for this project.');
    }

    // Parse project skill tags
    let skillTags: string[] = [];
    try {
      skillTags = JSON.parse(proposal.project.skillTags || '[]');
    } catch {
      skillTags = (proposal.project.skillTags || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Retrieve successful historical contracts as dynamic RAG examples (non-PII project/milestone structure only)
    const pastContracts = await prisma.contract.findMany({
      where: { status: { in: ['RELEASED', 'COMPLETED'] } },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { title: true, description: true, skillTags: true } },
        milestones: { orderBy: { sequenceOrder: 'asc' }, select: { title: true, description: true, amount: true } },
      },
    });

    const historicalTemplates = pastContracts
      .filter((c) => c.totalAmount > 0 && c.milestones.length >= 2)
      .map((c) => {
        let pastTags: string[] = [];
        try {
          pastTags = JSON.parse(c.project.skillTags || '[]');
        } catch {
          pastTags = [];
        }
        return {
          id: `hist-${c.id.slice(0, 8)}`,
          category: 'systems' as const,
          title: `Precedent: ${c.project.title}`,
          summary: c.project.description,
          tags: pastTags,
          suggestedMilestones: c.milestones.map((m, idx) => ({
            title: m.title,
            description: m.description,
            relativeBudgetPercent: Math.max(1, Math.round((m.amount / c.totalAmount) * 100)),
            estimatedDays: (idx + 1) * 6,
            acceptanceChecklist: ['Verified deliverable matching historical completed escrow milestone'],
          })),
        };
      });

    // Execute RAG Generation Pipeline
    const ragResult = await RagContractGenerator.generateMilestones({
      project: {
        id: proposal.project.id,
        title: proposal.project.title,
        description: proposal.project.description,
        budget: proposal.project.budget,
        skillTags,
      },
      proposal: {
        id: proposal.id,
        freelancerId: proposal.freelancerId,
        freelancerName: proposal.freelancer.name,
        bidAmount: proposal.bidAmount,
        coverLetter: proposal.coverLetter,
      },
      chatTranscript: validated.chatTranscript,
      historicalTemplates,
    });

    return NextResponse.json(
      formatSuccessResponse({
        proposalId: proposal.id,
        projectId: proposal.projectId,
        ...ragResult,
      })
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
