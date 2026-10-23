#!/usr/bin/env npx tsx
/**
 * scripts/run-watchdog.ts
 *
 * Standalone CLI runner for Engine 01 (OS) WatchdogScheduler.
 * Automates review timeout evaluation (FR-02, D-02) and monitors active dispute escalations.
 *
 * Supported Flags:
 *   --once             Execute a single pass and exit immediately.
 *   --daemon           Run continuously as a background daemon (default).
 *   --interval <ms>    Set polling interval in milliseconds (default: 30000ms / 30s).
 */

import { WatchdogScheduler } from '../src/core/engine-01-os/watchdog';
import prisma from '../src/lib/db';
import { logger } from '../src/lib/logger';

interface CliConfig {
  once: boolean;
  intervalMs: number;
}

function parseArgs(): CliConfig {
  const args = process.argv.slice(2);
  let once = false;
  let intervalMs = 30000;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--once') {
      once = true;
    } else if (arg === '--interval' && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!isNaN(parsed) && parsed > 0) {
        intervalMs = parsed;
      }
    }
  }

  return { once, intervalMs };
}

async function runPass(scheduler: WatchdogScheduler): Promise<void> {
  const now = new Date();
  logger.info(`[Watchdog] [${now.toISOString()}] --- Starting evaluation pass ---`);

  // 1. Process overdue submitted milestones
  const results = await scheduler.processOverdueMilestones(now);
  if (results.length === 0) {
    logger.info('[Watchdog] 0 overdue milestones found.');
  } else {
    for (const r of results) {
      if (r.timedOut) {
        logger.info(`[Watchdog] Timed out milestone ${r.milestoneId} (Contract ${r.contractId}) -> ${r.status}`);
      } else if (r.error) {
        logger.error(`[Watchdog] Error evaluating milestone ${r.milestoneId}: ${r.error}`);
      }
    }
  }

  // 2. Monitor active disputes requiring arbitration
  const activeDisputes = await prisma.dispute.findMany({
    where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    include: {
      milestone: { select: { id: true, title: true, contractId: true } },
      raisedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (activeDisputes.length > 0) {
    logger.info(`[Watchdog] Active dispute escalations requiring review: ${activeDisputes.length}`);
    for (const d of activeDisputes) {
      logger.info(`  -> Dispute #${d.id.slice(0, 8)} on "${d.milestone.title}" (Contract ${d.milestone.contractId}) raised by ${d.raisedBy.name} (${d.raisedBy.role})`);
    }
  }
}

async function main() {
  const config = parseArgs();
  const scheduler = new WatchdogScheduler();

  console.log('================================================================================');
  console.log('Engine 01 (OS) — Automated Watchdog Scheduler Daemon Initialized');
  console.log(`Mode: ${config.once ? 'Single Pass (--once)' : `Daemon (interval: ${config.intervalMs}ms)`}`);
  console.log(`Process PID: ${process.pid}`);
  console.log('================================================================================\n');

  if (config.once) {
    await runPass(scheduler);
    await prisma.$disconnect();
    process.exit(0);
  }

  let isShuttingDown = false;
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Watchdog] Received ${signal}. Initiating graceful shutdown...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  await runPass(scheduler);

  const timer = setInterval(async () => {
    if (isShuttingDown) {
      clearInterval(timer);
      return;
    }
    await runPass(scheduler);
  }, config.intervalMs);
}

main().catch(async (e) => {
  console.error('[Watchdog Fatal Error]:', e);
  await prisma.$disconnect();
  process.exit(1);
});
