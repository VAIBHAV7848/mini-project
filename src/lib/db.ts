import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }
  return undefined;
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
