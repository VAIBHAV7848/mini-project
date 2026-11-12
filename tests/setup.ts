import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// Guarantee DATABASE_URL is defined for all tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

// Auto-push SQLite schema if dev.db does not exist yet
const dbPath = path.resolve(process.cwd(), 'dev.db');
if (!fs.existsSync(dbPath)) {
  try {
    execSync('npx prisma db push --skip-generate', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./dev.db' },
    });
  } catch (err) {
    // Non-fatal if schema is already prepared
  }
}
