import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Pinned Personas matching src/components/layout/RoleContext.tsx
const PERSONAS = {
  CLIENT: {
    id: '9d640d0c-137c-47dd-a118-084d7e2ec807',
    name: 'Alice Chen',
    email: 'client1@escrow.local',
    role: 'CLIENT',
  },
  FREELANCER: {
    id: 'a7a09030-f1c7-4d58-82db-e7a556871fc4',
    name: 'Charlie Vance',
    email: 'dev1@escrow.local',
    role: 'FREELANCER',
  },
  REVIEWER: {
    id: '54da6e71-a111-49f9-ac18-e25817066cbf',
    name: 'Hon. Justine',
    email: 'reviewer1@escrow.local',
    role: 'REVIEWER',
  },
  ADMIN: {
    id: '233616fd-2260-4131-882a-bb9e50f295b1',
    name: 'System Auditor',
    email: 'admin@escrow.local',
    role: 'ADMIN',
  },
};

let auditPrevHash = 'GENESIS';

async function logAuditAction(
  actorId: string,
  entityName: string,
  entityId: string,
  action: string,
  previousState: string | null,
  newState: string
) {
  const timestamp = new Date();
  const payload = `${actorId}:${entityName}:${entityId}:${action}:${newState}:${timestamp.toISOString()}:${auditPrevHash}`;
  const verificationHash = crypto.createHash('sha256').update(payload).digest('hex');

  await prisma.auditLog.create({
    data: {
      actorId,
      entityName,
      entityId,
      action,
      previousState,
      newState,
      prevHash: auditPrevHash,
      verificationHash,
      timestamp,
    },
  });

  auditPrevHash = verificationHash;
}

async function main() {
  console.log('================================================================================');
  console.log('==> Seeding database with baseline demonstration & evaluation dataset...');
  console.log('================================================================================\n');

  // Step 1: Clean slate in strict reverse relational order to guarantee zero foreign-key deadlocks
  console.log('Step 1: Cleaning existing demonstration records...');
  await prisma.auditLog.deleteMany({});
  await prisma.paymentEvent.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.settlementTransfer.deleteMany({});
  await prisma.webhookLog.deleteMany({});
  await prisma.paymentReconciliation.deleteMany({});
  await prisma.idempotencyRecord.deleteMany({});
  await prisma.escrowTransaction.deleteMany({});
  await prisma.disputeEvidence.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.deliverable.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.gig.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.vendorPayoutProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  [OK] Cleaned existing records.\n');

  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // Step 2: Seed Pinned Personas
  console.log('Step 2: Provisioning pinned persona identities (matching RoleContext.tsx)...');
  const admin = await prisma.user.create({
    data: {
      id: PERSONAS.ADMIN.id,
      email: PERSONAS.ADMIN.email,
      passwordHash,
      name: PERSONAS.ADMIN.name,
      role: 'ADMIN',
      balance: 0.0,
      balancePaise: 0,
      devScore: 100,
    },
  });

  const clientAlice = await prisma.user.create({
    data: {
      id: PERSONAS.CLIENT.id,
      email: PERSONAS.CLIENT.email,
      passwordHash,
      name: PERSONAS.CLIENT.name,
      role: 'CLIENT',
      balance: 10000.0,
      balancePaise: 1000000,
      devScore: 50,
    },
  });

  await prisma.user.create({
    data: {
      id: 'c8309110-449e-4e31-9a74-b5a882a129ef',
      email: 'client2@escrow.local',
      passwordHash,
      name: 'Bob Client',
      role: 'CLIENT',
      balance: 3000.0,
      balancePaise: 300000,
      devScore: 50,
    },
  });

  const devCharlie = await prisma.user.create({
    data: {
      id: PERSONAS.FREELANCER.id,
      email: PERSONAS.FREELANCER.email,
      passwordHash,
      name: PERSONAS.FREELANCER.name,
      role: 'FREELANCER',
      balance: 2500.0,
      balancePaise: 250000,
      devScore: 92,
      githubProfile: 'charlievance',
    },
  });

  await prisma.user.create({
    data: {
      id: 'f1883394-1188-4db8-bdfc-279483713028',
      email: 'dev2@escrow.local',
      passwordHash,
      name: 'Dana Developer',
      role: 'FREELANCER',
      balance: 500.0,
      balancePaise: 50000,
      devScore: 78,
      githubProfile: 'danadev',
    },
  });

  const reviewerJustine = await prisma.user.create({
    data: {
      id: PERSONAS.REVIEWER.id,
      email: PERSONAS.REVIEWER.email,
      passwordHash,
      name: PERSONAS.REVIEWER.name,
      role: 'REVIEWER',
      balance: 0.0,
      balancePaise: 0,
      devScore: 98,
    },
  });

  console.log(`  [OK] Seeded 6 personas with pinned UUIDs:`);
  console.log(`       - Client Alice Chen:   ${clientAlice.id}`);
  console.log(`       - Freelancer Charlie:  ${devCharlie.id}`);
  console.log(`       - Reviewer Justine:    ${reviewerJustine.id}`);
  console.log(`       - Admin Auditor:       ${admin.id}\n`);

  await logAuditAction(admin.id, 'System', admin.id, 'SYSTEM_INITIALIZED', null, 'READY');

  // Step 3: Seed 4 Rich Demonstration Contracts Covering Major Lifecycle States
  console.log('Step 3: Creating 4 rich contracts covering all major lifecycle states...');

  // ---------------------------------------------------------------------------
  // Contract 1: ACTIVE / IN PROGRESS
  // State: Milestone 1 released ($1,000), Milestone 2 funded & in progress ($1,000)
  // ---------------------------------------------------------------------------
  const project1 = await prisma.project.create({
    data: {
      id: 'p1000000-0000-4000-8000-000000000001',
      clientId: clientAlice.id,
      title: 'Decentralized Identity & Role-Based Access Engine',
      description: 'Implement Zero-Knowledge RBAC session management and cryptographic token exchange.',
      budget: 2000.0,
      budgetPaise: 200000,
      skillTags: JSON.stringify(['typescript', 'rbac', 'security', 'crypto']),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.proposal.create({
    data: {
      id: 'pr100000-0000-4000-8000-000000000001',
      projectId: project1.id,
      freelancerId: devCharlie.id,
      bidAmount: 2000.0,
      bidAmountPaise: 200000,
      coverLetter: 'Expert in Zero-Knowledge and cryptographic session management with 5+ years experience.',
      aiMatchScore: 94.5,
      status: 'ACCEPTED',
    },
  });

  const contract1 = await prisma.contract.create({
    data: {
      id: 'c1000000-0000-4000-8000-000000000001',
      projectId: project1.id,
      clientId: clientAlice.id,
      freelancerId: devCharlie.id,
      totalAmount: 2000.0,
      totalAmountPaise: 200000,
      escrowBalance: 1000.0,
      escrowBalancePaise: 100000,
      status: 'IN_PROGRESS',
    },
  });

  const m1_1 = await prisma.milestone.create({
    data: {
      id: 'm1000000-0000-4000-8000-000000000001',
      contractId: contract1.id,
      title: 'Phase 1: Architecture Specification & Core RBAC Models',
      description: 'Establish foundational RBAC data models and session lifecycle hooks.',
      amount: 1000.0,
      amountPaise: 100000,
      sequenceOrder: 1,
      status: 'RELEASED',
      dueDate: new Date(Date.now() - 14 * 86400000),
      reviewDeadline: new Date(Date.now() - 7 * 86400000),
    },
  });

  const m1_1_checksum = crypto.createHash('sha256').update('rbac-architecture-deliverable-data').digest('hex');
  await prisma.deliverable.create({
    data: {
      id: 'del10000-0000-4000-8000-000000000001',
      milestoneId: m1_1.id,
      fileName: 'rbac-architecture-v1.zip',
      fileUrl: 'https://storage.escrow.local/deliverables/rbac-architecture-v1.zip',
      sha256Checksum: m1_1_checksum,
      submissionNotes: 'Phase 1 architecture deliverables, test specifications, and verified schemas.',
      submittedAt: new Date(Date.now() - 8 * 86400000),
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract1.id,
      milestoneId: m1_1.id,
      fromUserId: clientAlice.id,
      toUserId: devCharlie.id,
      amount: 1000.0,
      amountPaise: 100000,
      type: 'RELEASE',
      status: 'COMPLETED',
    },
  });

  const m1_2 = await prisma.milestone.create({
    data: {
      id: 'm1000000-0000-4000-8000-000000000002',
      contractId: contract1.id,
      title: 'Phase 2: Cryptographic Token Service & Middleware',
      description: 'Build high-performance token issuance and verification interceptors.',
      amount: 1000.0,
      amountPaise: 100000,
      sequenceOrder: 2,
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 7 * 86400000),
      reviewDeadline: null,
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract1.id,
      milestoneId: m1_2.id,
      fromUserId: clientAlice.id,
      toUserId: null,
      amount: 1000.0,
      amountPaise: 100000,
      type: 'LOCK',
      status: 'COMPLETED',
    },
  });

  await logAuditAction(devCharlie.id, 'Milestone', m1_2.id, 'START_WORK', 'FUNDED', 'IN_PROGRESS');
  console.log(`  [OK] Contract 1 (IN_PROGRESS): M1 RELEASED ($1000), M2 IN_PROGRESS ($1000 locked)`);

  // ---------------------------------------------------------------------------
  // Contract 2: UNDER REVIEW / DELIVERABLE SUBMITTED
  // State: Milestone with SHA-256 deliverable submitted by Charlie awaiting Alice approval
  // ---------------------------------------------------------------------------
  const project2 = await prisma.project.create({
    data: {
      id: 'p2000000-0000-4000-8000-000000000002',
      clientId: clientAlice.id,
      title: 'Real-Time WebSocket Transaction Stream',
      description: 'Build resilient WebSocket broadcaster for double-entry ledger settlement events.',
      budget: 1500.0,
      budgetPaise: 150000,
      skillTags: JSON.stringify(['websocket', 'nodejs', 'redis', 'typescript']),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.proposal.create({
    data: {
      id: 'pr200000-0000-4000-8000-000000000002',
      projectId: project2.id,
      freelancerId: devCharlie.id,
      bidAmount: 1500.0,
      bidAmountPaise: 150000,
      coverLetter: 'Specialist in streaming architectures and high-throughput event buses.',
      aiMatchScore: 91.0,
      status: 'ACCEPTED',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      id: 'c2000000-0000-4000-8000-000000000002',
      projectId: project2.id,
      clientId: clientAlice.id,
      freelancerId: devCharlie.id,
      totalAmount: 1500.0,
      totalAmountPaise: 150000,
      escrowBalance: 1500.0,
      escrowBalancePaise: 150000,
      status: 'UNDER_REVIEW',
    },
  });

  const m2_1 = await prisma.milestone.create({
    data: {
      id: 'm2000000-0000-4000-8000-000000000001',
      contractId: contract2.id,
      title: 'Milestone 1: WebSocket Gateway & Deliverable',
      description: 'End-to-end WebSocket stream implementation with reconnect backoff and heartbeats.',
      amount: 1500.0,
      amountPaise: 150000,
      sequenceOrder: 1,
      status: 'SUBMITTED',
      dueDate: new Date(Date.now() - 1 * 86400000),
      reviewDeadline: new Date(Date.now() + 6 * 86400000), // 7-day review window
    },
  });

  const m2_1_checksum = crypto.createHash('sha256').update('websocket-gateway-deliverable-payload').digest('hex');
  await prisma.deliverable.create({
    data: {
      id: 'del20000-0000-4000-8000-000000000002',
      milestoneId: m2_1.id,
      fileName: 'websocket-gateway-release.tar.gz',
      fileUrl: 'https://storage.escrow.local/deliverables/websocket-gateway-release.tar.gz',
      sha256Checksum: m2_1_checksum,
      submissionNotes: 'Full implementation submitted awaiting Alice review. 95% test coverage.',
      submittedAt: new Date(Date.now() - 1 * 86400000),
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract2.id,
      milestoneId: m2_1.id,
      fromUserId: clientAlice.id,
      toUserId: null,
      amount: 1500.0,
      amountPaise: 150000,
      type: 'LOCK',
      status: 'COMPLETED',
    },
  });

  await logAuditAction(devCharlie.id, 'Milestone', m2_1.id, 'SUBMIT_DELIVERABLE', 'IN_PROGRESS', 'SUBMITTED');
  console.log(`  [OK] Contract 2 (UNDER_REVIEW): Deliverable submitted by Charlie with SHA-256 awaiting Alice review`);

  // ---------------------------------------------------------------------------
  // Contract 3: DISPUTED
  // State: Milestone in DISPUTED state with active Dispute record, evidence items with SHA-256 hashes
  // ---------------------------------------------------------------------------
  const project3 = await prisma.project.create({
    data: {
      id: 'p3000000-0000-4000-8000-000000000003',
      clientId: clientAlice.id,
      title: 'Automated Smart Contract Auditor Service',
      description: 'Develop AST parser and static vulnerability scanner for Solidity smart contracts.',
      budget: 2500.0,
      budgetPaise: 250000,
      skillTags: JSON.stringify(['solidity', 'ast', 'security', 'parser']),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.proposal.create({
    data: {
      id: 'pr300000-0000-4000-8000-000000000003',
      projectId: project3.id,
      freelancerId: devCharlie.id,
      bidAmount: 2500.0,
      bidAmountPaise: 250000,
      coverLetter: 'AST parser expert with static security analysis tooling experience.',
      aiMatchScore: 88.0,
      status: 'ACCEPTED',
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      id: 'c3000000-0000-4000-8000-000000000003',
      projectId: project3.id,
      clientId: clientAlice.id,
      freelancerId: devCharlie.id,
      totalAmount: 2500.0,
      totalAmountPaise: 250000,
      escrowBalance: 2500.0,
      escrowBalancePaise: 250000,
      status: 'DISPUTED',
    },
  });

  const m3_1 = await prisma.milestone.create({
    data: {
      id: 'm3000000-0000-4000-8000-000000000001',
      contractId: contract3.id,
      title: 'Milestone 1: AST Parser & Reentrancy Vulnerability Detection',
      description: 'Parser engine with formal verification of reentrancy vectors.',
      amount: 2500.0,
      amountPaise: 250000,
      sequenceOrder: 1,
      status: 'DISPUTED',
      dueDate: new Date(Date.now() - 3 * 86400000),
      reviewDeadline: new Date(Date.now() - 1 * 86400000),
    },
  });

  const m3_1_checksum = crypto.createHash('sha256').update('ast-parser-deliverable-data').digest('hex');
  await prisma.deliverable.create({
    data: {
      id: 'del30000-0000-4000-8000-000000000003',
      milestoneId: m3_1.id,
      fileName: 'ast-parser-v0.9.zip',
      fileUrl: 'https://storage.escrow.local/deliverables/ast-parser-v0.9.zip',
      sha256Checksum: m3_1_checksum,
      submissionNotes: 'Parser v0.9 source code and CLI executable.',
      submittedAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  const dispute3 = await prisma.dispute.create({
    data: {
      id: 'd3000000-0000-4000-8000-000000000001',
      milestoneId: m3_1.id,
      raisedById: clientAlice.id,
      reviewerId: reviewerJustine.id,
      reason: 'The delivered parser fails on nested reentrancy patterns and crashes on complex contract inheritance.',
      status: 'OPEN',
      ruling: null,
      rulingNotes: null,
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  const evClientChecksum = crypto.createHash('sha256').update('client-reentrancy-failure-report-log-proof').digest('hex');
  await prisma.disputeEvidence.create({
    data: {
      id: 'ev300000-0000-4000-8000-000000000001',
      disputeId: dispute3.id,
      submittedById: clientAlice.id,
      fileUrl: 'https://storage.escrow.local/evidence/client-reentrancy-failure-report.log',
      sha256Checksum: evClientChecksum,
      description: 'Terminal output showing 14 failed reentrancy tests on OpenZeppelin contracts.',
      submittedAt: new Date(Date.now() - 36 * 3600000),
    },
  });

  const evDevChecksum = crypto.createHash('sha256').update('freelancer-specification-annex-content-proof').digest('hex');
  await prisma.disputeEvidence.create({
    data: {
      id: 'ev300000-0000-4000-8000-000000000002',
      disputeId: dispute3.id,
      submittedById: devCharlie.id,
      fileUrl: 'https://storage.escrow.local/evidence/freelancer-specification-annex.pdf',
      sha256Checksum: evDevChecksum,
      description: 'Signed technical specification sheet showing complex inheritance was designated as Phase 2.',
      submittedAt: new Date(Date.now() - 24 * 3600000),
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract3.id,
      milestoneId: m3_1.id,
      fromUserId: clientAlice.id,
      toUserId: null,
      amount: 2500.0,
      amountPaise: 250000,
      type: 'LOCK',
      status: 'COMPLETED',
    },
  });

  await logAuditAction(clientAlice.id, 'Dispute', dispute3.id, 'RAISE_DISPUTE', 'UNDER_REVIEW', 'DISPUTED');
  console.log(`  [OK] Contract 3 (DISPUTED): Milestone in DISPUTED state with SHA-256 evidence ready for Judge Justine`);

  // ---------------------------------------------------------------------------
  // Contract 4: COMPLETED
  // State: All milestones released, total escrow disbursed ($3,000)
  // ---------------------------------------------------------------------------
  const project4 = await prisma.project.create({
    data: {
      id: 'p4000000-0000-4000-8000-000000000004',
      clientId: clientAlice.id,
      title: 'Responsive Multi-Role Workflow Dashboard',
      description: 'Build responsive Next.js 16 frontend with Tailwind CSS 4 and Lucide icons.',
      budget: 3000.0,
      budgetPaise: 300000,
      skillTags: JSON.stringify(['nextjs', 'react', 'tailwind', 'typescript']),
      status: 'COMPLETED',
    },
  });

  await prisma.proposal.create({
    data: {
      id: 'pr400000-0000-4000-8000-000000000004',
      projectId: project4.id,
      freelancerId: devCharlie.id,
      bidAmount: 3000.0,
      bidAmountPaise: 300000,
      coverLetter: 'UI/UX engineer with deep expertise in Next.js App Router and responsive layouts.',
      aiMatchScore: 98.0,
      status: 'ACCEPTED',
    },
  });

  const contract4 = await prisma.contract.create({
    data: {
      id: 'c4000000-0000-4000-8000-000000000004',
      projectId: project4.id,
      clientId: clientAlice.id,
      freelancerId: devCharlie.id,
      totalAmount: 3000.0,
      totalAmountPaise: 300000,
      escrowBalance: 0.0,
      escrowBalancePaise: 0,
      status: 'RELEASED',
    },
  });

  const m4_1 = await prisma.milestone.create({
    data: {
      id: 'm4000000-0000-4000-8000-000000000001',
      contractId: contract4.id,
      title: 'Sprint 1: UI Wireframes & Layout Shell',
      description: 'Accessible navigation, role context selector, and dashboard layout.',
      amount: 1500.0,
      amountPaise: 150000,
      sequenceOrder: 1,
      status: 'RELEASED',
      dueDate: new Date(Date.now() - 30 * 86400000),
      reviewDeadline: new Date(Date.now() - 23 * 86400000),
    },
  });

  const m4_1_checksum = crypto.createHash('sha256').update('ui-wireframes-v1-content-payload').digest('hex');
  await prisma.deliverable.create({
    data: {
      id: 'del40000-0000-4000-8000-000000000001',
      milestoneId: m4_1.id,
      fileName: 'ui-wireframes-v1.zip',
      fileUrl: 'https://storage.escrow.local/deliverables/ui-wireframes-v1.zip',
      sha256Checksum: m4_1_checksum,
      submissionNotes: 'Approved wireframes and component foundation.',
      submittedAt: new Date(Date.now() - 24 * 86400000),
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract4.id,
      milestoneId: m4_1.id,
      fromUserId: clientAlice.id,
      toUserId: devCharlie.id,
      amount: 1500.0,
      amountPaise: 150000,
      type: 'RELEASE',
      status: 'COMPLETED',
    },
  });

  const m4_2 = await prisma.milestone.create({
    data: {
      id: 'm4000000-0000-4000-8000-000000000002',
      contractId: contract4.id,
      title: 'Sprint 2: Real-Time Charts & Polling Integration',
      description: 'State poller client hook and live milestone visualization.',
      amount: 1500.0,
      amountPaise: 150000,
      sequenceOrder: 2,
      status: 'RELEASED',
      dueDate: new Date(Date.now() - 15 * 86400000),
      reviewDeadline: new Date(Date.now() - 8 * 86400000),
    },
  });

  const m4_2_checksum = crypto.createHash('sha256').update('ui-production-build-content-payload').digest('hex');
  await prisma.deliverable.create({
    data: {
      id: 'del40000-0000-4000-8000-000000000002',
      milestoneId: m4_2.id,
      fileName: 'ui-production-build.tar.gz',
      fileUrl: 'https://storage.escrow.local/deliverables/ui-production-build.tar.gz',
      sha256Checksum: m4_2_checksum,
      submissionNotes: 'Complete dashboard verified against 360px-1920px viewports.',
      submittedAt: new Date(Date.now() - 9 * 86400000),
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract4.id,
      milestoneId: m4_2.id,
      fromUserId: clientAlice.id,
      toUserId: devCharlie.id,
      amount: 1500.0,
      amountPaise: 150000,
      type: 'RELEASE',
      status: 'COMPLETED',
    },
  });

  await logAuditAction(clientAlice.id, 'Contract', contract4.id, 'RELEASE_ESCROW', 'APPROVED', 'RELEASED');
  console.log(`  [OK] Contract 4 (COMPLETED): All milestones released, total $3,000 escrow disbursed`);

  // Step 4: Pre-seed Sample Marketplace Gigs (owned by Charlie Vance)
  console.log('\nStep 4: Provisioning tiered service gigs owned by Charlie Vance...');
  await prisma.gig.create({
    data: {
      id: 'g1000000-0000-4000-8000-000000000001',
      freelancerId: devCharlie.id,
      title: 'Full Stack Next.js & TypeScript Engineering',
      description: 'Production-ready web application development with responsive layouts and strict typing.',
      category: 'WEB_DEV',
      tiers: JSON.stringify([
        { name: 'Basic', price: 250, deliveryDays: 3, description: 'Component implementation & bugfixes' },
        { name: 'Standard', price: 750, deliveryDays: 7, description: 'Full feature vertical slice with automated tests' },
        { name: 'Premium', price: 1500, deliveryDays: 14, description: 'End-to-end platform deployment with CI/CD' },
      ]),
    },
  });

  await prisma.gig.create({
    data: {
      id: 'g2000000-0000-4000-8000-000000000002',
      freelancerId: devCharlie.id,
      title: 'Cryptographic Security & Smart Contract Auditing',
      description: 'Comprehensive code reviews, threat modeling, and formal verification.',
      category: 'SECURITY',
      tiers: JSON.stringify([
        { name: 'Basic', price: 400, deliveryDays: 2, description: 'Static analysis & vulnerability triage' },
        { name: 'Standard', price: 1200, deliveryDays: 5, description: 'Manual code audit with formal report' },
        { name: 'Premium', price: 2400, deliveryDays: 10, description: 'Comprehensive protocol audit + invariant fuzzing' },
      ]),
    },
  });
  console.log('  [OK] Seeded 2 tiered gigs owned by Charlie Vance.');

  // Step 5: Pre-seed Sample Open Projects (posted by Alice Chen)
  console.log('\nStep 5: Provisioning sample open projects posted by Alice Chen...');
  const openProject1 = await prisma.project.create({
    data: {
      id: 'p5000000-0000-4000-8000-000000000005',
      clientId: clientAlice.id,
      title: 'Distributed Mutex & Deadlock Detection Engine',
      description: 'Build an in-memory KeyedMutex coordinator with timeout watchdog and cycle detection.',
      budget: 1800.0,
      budgetPaise: 180000,
      skillTags: JSON.stringify(['typescript', 'concurrency', 'algorithms', 'os']),
      status: 'OPEN',
    },
  });

  const openProject2 = await prisma.project.create({
    data: {
      id: 'p6000000-0000-4000-8000-000000000006',
      clientId: clientAlice.id,
      title: 'Merkle Evidence Tree & Tamper Verification Pipeline',
      description: 'Design N-ary cryptographic tree structure for immutable dispute evidence chain verification.',
      budget: 2200.0,
      budgetPaise: 220000,
      skillTags: JSON.stringify(['merkle-tree', 'sha256', 'cryptography', 'data-structures']),
      status: 'OPEN',
    },
  });
  console.log(`  [OK] Seeded 2 open projects: "${openProject1.title}", "${openProject2.title}"`);

  console.log('\n================================================================================');
  console.log('==> Database seed completed successfully with zero errors.');
  console.log('================================================================================');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
