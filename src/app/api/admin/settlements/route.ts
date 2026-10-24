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

    const settlements = await prisma.settlementTransfer.findMany({
      where: {
        status: { in: ['PENDING', 'IN_FLIGHT'] },
      },
      include: {
        contract: {
          include: {
            project: { select: { title: true } },
          },
        },
        milestone: {
          select: { id: true, title: true, status: true },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            vendorPayoutProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = settlements.map((s) => ({
      id: s.id,
      contractId: s.contractId,
      milestoneId: s.milestoneId,
      projectTitle: s.contract.project.title,
      milestoneTitle: s.milestone.title,
      milestoneStatus: s.milestone.status,
      freelancerId: s.freelancerId,
      freelancerName: s.freelancer.name,
      freelancerEmail: s.freelancer.email,
      beneficiaryVpa: s.freelancer.vendorPayoutProfile?.vpa || undefined,
      beneficiaryAccountMasked: s.freelancer.vendorPayoutProfile?.accountNumberMasked || undefined,
      beneficiaryIfsc: s.freelancer.vendorPayoutProfile?.ifsc || undefined,
      grossAmount: s.grossAmountPaise / 100,
      platformFee: s.platformFeePaise / 100,
      netDisbursed: s.netDisbursedPaise / 100,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json(formatSuccessResponse(formatted));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
