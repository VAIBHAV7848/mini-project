import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// Isolate all Vitest suites from localhost dev.db using dedicated test.db
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./dev.db') {
  process.env.DATABASE_URL = 'file:./test.db';
}

// Safely load local .env if available without committing secrets
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key !== 'DATABASE_URL' && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// Auto-push SQLite schema if prisma/test.db does not exist yet
const dbPath = path.resolve(process.cwd(), 'prisma/test.db');
if (!fs.existsSync(dbPath)) {
  try {
    execSync('npx prisma db push --skip-generate', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    });
  } catch {
    // Non-fatal if schema is already prepared
  }
}

// Suppress React 19 test runner introspection warning (Chai/Loupe inspecting element.ref getter)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    args.some(
      (arg) =>
        typeof arg === 'string' &&
        arg.includes('Accessing element.ref was removed in React 19')
    )
  ) {
    return;
  }
  Reflect.apply(originalConsoleError, console, args);
};


