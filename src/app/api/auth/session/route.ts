import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { PINNED_PERSONAS } from '@/lib/auth-service';
import { formatSuccessResponse, formatErrorResponse, AuthenticationError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      throw new AuthenticationError('Active session required.');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        devScore: true,
        githubProfile: true,
        createdAt: true,
      },
    });

    if (!user) {
      const persona = PINNED_PERSONAS[session.email];
      if (persona) {
        return NextResponse.json(
          formatSuccessResponse({
            id: persona.id,
            email: persona.email,
            name: persona.name,
            role: persona.role,
            balance: persona.balance,
            devScore: persona.devScore,
            githubProfile: persona.githubProfile ?? null,
            createdAt: new Date(),
          })
        );
      }
      throw new AuthenticationError('User account not found.');
    }

    return NextResponse.json(formatSuccessResponse(user));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
