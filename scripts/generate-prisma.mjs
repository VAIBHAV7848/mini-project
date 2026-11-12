import { execSync } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres =
  dbUrl.startsWith('postgres://') ||
  dbUrl.startsWith('postgresql://') ||
  process.env.VERCEL === '1' ||
  process.env.POSTGRES_PRISMA_URL !== undefined;

const schemaPath = isPostgres
  ? 'prisma/schema.postgresql.prisma'
  : 'prisma/schema.prisma';

console.log(`==> [Prisma] Generating client using schema: ${schemaPath} (isPostgres=${isPostgres})`);
execSync(`npx prisma generate --schema=${schemaPath}`, { stdio: 'inherit' });
