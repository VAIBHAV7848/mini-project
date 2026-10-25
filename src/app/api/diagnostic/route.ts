import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (key !== 'gigaflow_diag_2026') {
    return NextResponse.json({ error: 'Unauthorized diagnostic probe' }, { status: 401 });
  }

  const diagnostics: Record<string, unknown> = {
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlMasked: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://[REDACTED]:[REDACTED]@')
      : null,
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    directUrlMasked: process.env.DIRECT_URL
      ? process.env.DIRECT_URL.replace(/:\/\/[^:]+:[^@]+@/, '://[REDACTED]:[REDACTED]@')
      : null,
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    timestamp: new Date().toISOString(),
  };

  try {
    const rawResult = await prisma.$queryRaw`SELECT current_database(), current_schema(), now();`;
    diagnostics.rawQuery = rawResult;
    diagnostics.dbConnected = true;
  } catch (err: unknown) {
    diagnostics.dbConnected = false;
    diagnostics.dbError = err instanceof Error ? { message: err.message, stack: err.stack } : String(err);
  }

  try {
    const projectCount = await prisma.project.count();
    diagnostics.projectCount = projectCount;
  } catch (err: unknown) {
    diagnostics.projectCountError = err instanceof Error ? { message: err.message, stack: err.stack } : String(err);
  }

  return NextResponse.json(diagnostics);
}
