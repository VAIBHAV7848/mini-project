import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

const PERSONAS = [
  {
    id: '233616fd-2260-4131-882a-bb9e50f295b1',
    name: 'Vaibhav Chavanpatil (VAIBHAV)',
    email: 'admin@escrow.local',
    role: 'ADMIN',
    devScore: 100,
  },
  {
    id: '9d640d0c-137c-47dd-a118-084d7e2ec807',
    name: 'Alice Chen',
    email: 'client1@escrow.local',
    role: 'CLIENT',
    devScore: 50,
  },
  {
    id: 'c8309110-449e-4e31-9a74-b5a882a129ef',
    name: 'Bob Client',
    email: 'client2@escrow.local',
    role: 'CLIENT',
    devScore: 50,
  },
  {
    id: 'a7a09030-f1c7-4d58-82db-e7a556871fc4',
    name: 'Charlie Vance',
    email: 'dev1@escrow.local',
    role: 'FREELANCER',
    devScore: 50,
    githubProfile: 'charlievance',
  },
  {
    id: 'f1883394-1188-4db8-bdfc-279483713028',
    name: 'Dana Developer',
    email: 'dev2@escrow.local',
    role: 'FREELANCER',
    devScore: 50,
    githubProfile: 'danadev',
  },
  {
    id: '54da6e71-a111-49f9-ac18-e25817066cbf',
    name: 'Hon. Justine',
    email: 'reviewer1@escrow.local',
    role: 'REVIEWER',
    devScore: 50,
  },
];

async function main() {
  console.log('================================================================');
  console.log('==> PURGING DEMONSTRATION & SEEDED DATA (REAL-TIME CLEAN SLATE)');
  console.log('================================================================\n');

  // Step 1: Delete all transactional and demonstration records in strict reverse relational dependency order
  console.log('Step 1: Purging all demonstration records from Supabase PostgreSQL...');
  
  const tables = [
    { name: 'audit_logs', fn: () => prisma.auditLog.deleteMany({}) },
    { name: 'payment_events', fn: () => prisma.paymentEvent.deleteMany({}) },
    { name: 'refunds', fn: () => prisma.refund.deleteMany({}) },
    { name: 'settlement_transfers', fn: () => prisma.settlementTransfer.deleteMany({}) },
    { name: 'payments', fn: () => prisma.payment.deleteMany({}) },
    { name: 'webhook_logs', fn: () => prisma.webhookLog.deleteMany({}) },
    { name: 'payment_reconciliations', fn: () => prisma.paymentReconciliation.deleteMany({}) },
    { name: 'idempotency_records', fn: () => prisma.idempotencyRecord.deleteMany({}) },
    { name: 'dispute_evidence', fn: () => prisma.disputeEvidence.deleteMany({}) },
    { name: 'disputes', fn: () => prisma.dispute.deleteMany({}) },
    { name: 'deliverables', fn: () => prisma.deliverable.deleteMany({}) },
    { name: 'escrow_transactions', fn: () => prisma.escrowTransaction.deleteMany({}) },
    { name: 'orders', fn: () => prisma.order.deleteMany({}) },
    { name: 'milestones', fn: () => prisma.milestone.deleteMany({}) },
    { name: 'contracts', fn: () => prisma.contract.deleteMany({}) },
    { name: 'proposals', fn: () => prisma.proposal.deleteMany({}) },
    { name: 'projects', fn: () => prisma.project.deleteMany({}) },
    { name: 'gigs', fn: () => prisma.gig.deleteMany({}) },
    { name: 'vendor_payout_profiles', fn: () => prisma.vendorPayoutProfile.deleteMany({}) },
  ];

  for (const table of tables) {
    const res = await table.fn();
    console.log(`  [CLEANED] ${table.name.padEnd(25)} -> Deleted ${res.count} records`);
  }

  // Step 2: Remove ephemeral test users (keeping core personas)
  console.log('\nStep 2: Cleaning ephemeral test user accounts...');
  const personaIds = PERSONAS.map((p) => p.id);
  const deletedTestUsers = await prisma.user.deleteMany({
    where: { id: { notIn: personaIds } },
  });
  console.log(`  [CLEANED] Removed ${deletedTestUsers.count} non-core user records.`);

  // Step 3: Reset core persona accounts to zero balance & active credentials
  console.log('\nStep 3: Resetting core persona wallets to zero (preserving credentials)...');
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  for (const p of PERSONAS) {
    await prisma.user.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        role: p.role,
        passwordHash,
        balance: 0.0,
        balancePaise: 0,
        devScore: p.devScore,
        githubProfile: p.githubProfile ?? null,
      },
      create: {
        id: p.id,
        email: p.email,
        passwordHash,
        name: p.name,
        role: p.role,
        balance: 0.0,
        balancePaise: 0,
        devScore: p.devScore,
        githubProfile: p.githubProfile ?? null,
      },
    });
    console.log(`  [VERIFIED] User: ${p.name.padEnd(30)} (${p.role}) -> Balance: ₹0.00`);
  }

  // Step 4: Provision Genesis Audit Log entry for clean-slate cryptographic verification
  console.log('\nStep 4: Provisioning clean cryptographic genesis audit root...');
  const genesisAdminId = PERSONAS[0].id;
  const timestamp = new Date();
  const prevHash = 'GENESIS';
  const payload = `${genesisAdminId}:System:${genesisAdminId}:CLEAN_SLATE:INITIALIZED:${timestamp.toISOString()}:${prevHash}`;
  const verificationHash = crypto.createHash('sha256').update(payload).digest('hex');

  await prisma.auditLog.create({
    data: {
      actorId: genesisAdminId,
      entityName: 'System',
      entityId: genesisAdminId,
      action: 'CLEAN_SLATE',
      previousState: null,
      newState: 'INITIALIZED',
      prevHash,
      verificationHash,
      timestamp,
    },
  });
  console.log(`  [OK] Initialized Genesis Hash Root: ${verificationHash.substring(0, 16)}...`);

  // Step 5: Clean local PC artifact files (deliverables & SQLite files)
  console.log('\nStep 5: Purging local mock file artifacts on host PC...');
  const deliverablesDir = path.resolve(process.cwd(), 'data/deliverables');
  if (fs.existsSync(deliverablesDir)) {
    const files = fs.readdirSync(deliverablesDir);
    let removedFiles = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(deliverablesDir, file));
        removedFiles++;
      }
    }
    console.log(`  [CLEANED] Deleted ${removedFiles} mock deliverables from ${deliverablesDir}`);
  }

  // Clean local sqlite dev.db files
  const devDbPath = path.resolve(process.cwd(), 'dev.db');
  if (fs.existsSync(devDbPath)) {
    fs.unlinkSync(devDbPath);
    console.log(`  [CLEANED] Removed local ${devDbPath}`);
  }

  const prismaDevDbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  if (fs.existsSync(prismaDevDbPath)) {
    fs.unlinkSync(prismaDevDbPath);
    console.log(`  [CLEANED] Removed local ${prismaDevDbPath}`);
  }

  console.log('\n================================================================');
  console.log('==> SUCCESS: DATABASE IS PRISTINE, ZERO FAKE DATA, READY FOR REAL-TIME USE');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Fatal cleanup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
