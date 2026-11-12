import { PrismaClient } from '@prisma/client';

export const GIGAFLOW_PROJECT_ID = 'aktpmfmienqimltzaoyq';

/**
 * Authoritative GigaFlow Supabase PostgreSQL pooler connection URL.
 * Configured for Transaction Mode (PgBouncer on port 6543) for serverless environments.
 * Strictly bound to project 'aktpmfmienqimltzaoyq'.
 */
export const GIGAFLOW_SUPABASE_DATABASE_URL =
  'postgresql://postgres.aktpmfmienqimltzaoyq:Vaibhav%402005@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

/**
 * Resolves the database connection URL with strict project isolation and Vercel fallbacks.
 * Enforces strict isolation: never touches any foreign project.
 */
export function resolveDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL?.trim();
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. In local non-production runs, allow SQLite file database
  if (!isVercel && !isProduction && envUrl && (envUrl.startsWith('file:') || envUrl.startsWith('sqlite:'))) {
    return envUrl;
  }

  // 2. If PostgreSQL connection string is provided, enforce project isolation
  if (envUrl && (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://'))) {
    if (!envUrl.includes(GIGAFLOW_PROJECT_ID)) {
      console.warn(
        `[Prisma DB Guard] Provided DATABASE_URL does not belong to GigaFlow project (${GIGAFLOW_PROJECT_ID}). Overriding with verified GigaFlow pooler URL.`
      );
      return GIGAFLOW_SUPABASE_DATABASE_URL;
    }
    return envUrl;
  }

  // 3. Fallback on Vercel or Production when DATABASE_URL is not set
  if (isVercel || isProduction) {
    return GIGAFLOW_SUPABASE_DATABASE_URL;
  }

  return envUrl || undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedUrl
      ? {
          db: {
            url: resolvedUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
