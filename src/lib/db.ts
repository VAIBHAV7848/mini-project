import { PrismaClient } from '@prisma/client';

const FALLBACK_SUPABASE_DATABASE_URL =
  'postgresql://postgres.aktpmfmienqimltzaoyq:VAIBHAV2667@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&schema=gigaflow';

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  // Fall back to canonical Supabase pooler if DATABASE_URL is missing or set to unprovisioned placeholder
  if (!envUrl || envUrl.includes('db.prisma.io') || envUrl.startsWith('file:') || !envUrl.includes('@')) {
    return FALLBACK_SUPABASE_DATABASE_URL;
  }
  return envUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;

