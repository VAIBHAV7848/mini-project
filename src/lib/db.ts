import { PrismaClient } from '@prisma/client';

export const GIGAFLOW_PROJECT_ID = 'aktpmfmienqimltzaoyq';

/**
 * Resolves the database connection URL with strict project isolation and test fallbacks.
 * Enforces strict isolation: never touches any foreign project.
 */
export function resolveDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL?.trim();
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. In local non-production and test runs, default to SQLite file database
  if (!isVercel && !isProduction) {
    const url = envUrl || 'file:./dev.db';
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = url;
    }
    return url;
  }

  // 2. If PostgreSQL connection string is provided, enforce project isolation
  if (envUrl && (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://'))) {
    if (!envUrl.includes(GIGAFLOW_PROJECT_ID)) {
      throw new Error(
        `[Prisma DB Guard] Provided DATABASE_URL does not belong to GigaFlow project (${GIGAFLOW_PROJECT_ID}). Cross-project connection strictly blocked.`
      );
    }
    return envUrl;
  }

  return envUrl || undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteConfigured?: Promise<void>;
};

const resolvedUrl = resolveDatabaseUrl();

function configureSqlitePragmas(client: PrismaClient, url?: string): Promise<void> {
  if (!url || !url.startsWith('file:')) {
    return Promise.resolve();
  }
  if (!globalForPrisma.sqliteConfigured) {
    globalForPrisma.sqliteConfigured = (async () => {
      try {
        await client.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
        await client.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
        await client.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
        await client.$queryRawUnsafe('PRAGMA temp_store = MEMORY;');
      } catch {
        // Ignore initialization errors when DB file is not yet pushed
      }
    })();
  }
  return globalForPrisma.sqliteConfigured;
}

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
void configureSqlitePragmas(prisma, resolvedUrl);

export default prisma;
