import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatSuccessResponse, formatErrorResponse, NotFoundError } from '@/lib/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: {
          select: { proposals: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    let parsedSkills = [];
    try {
      parsedSkills = JSON.parse(project.skillTags);
    } catch {
      parsedSkills = [project.skillTags];
    }

    return NextResponse.json(
      formatSuccessResponse({
        ...project,
        skillTags: parsedSkills,
      })
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
