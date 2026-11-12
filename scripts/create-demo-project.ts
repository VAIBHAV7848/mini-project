import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CLIENT_ID = '9d640d0c-137c-47dd-a118-084d7e2ec807'; // Alice Chen
const FREELANCER_ID = 'a7a09030-f1c7-4d58-82db-e7a556871fc4'; // Charlie Vance
const REVIEWER_ID = '54da6e71-a111-49f9-ac18-e25817066cbf'; // Hon. Justine
const ADMIN_ID = '233616fd-2260-4131-882a-bb9e50f295b1'; // Vaibhav Admin

const DEMO_PROJECT_ID = 'p0000000-demo-4000-8000-000000000001';
const DEMO_CONTRACT_ID = 'c0000000-demo-4000-8000-000000000001';
const DEMO_PROPOSAL_ID = 'pr000000-demo-4000-8000-000000000001';

const M1_ID = 'm0000000-demo-4000-8000-000000000001';
const M2_ID = 'm0000000-demo-4000-8000-000000000002';
const M3_ID = 'm0000000-demo-4000-8000-000000000003';

async function logAudit(
  actorId: string,
  entityName: string,
  entityId: string,
  action: string,
  previousState: string | null,
  newState: string
) {
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
  });
  const prevHash = lastLog?.verificationHash || 'GENESIS';
  const timestamp = new Date();
  const payload = `${actorId}:${entityName}:${entityId}:${action}:${newState}:${timestamp.toISOString()}:${prevHash}`;
  const verificationHash = crypto.createHash('sha256').update(payload).digest('hex');

  await prisma.auditLog.create({
    data: {
      actorId,
      entityName,
      entityId,
      action,
      previousState,
      newState,
      prevHash,
      verificationHash,
      timestamp,
    },
  });
}

export async function createDemoProject() {
  console.log('==> Ensuring pinned personas exist...');
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  await prisma.user.upsert({
    where: { id: CLIENT_ID },
    update: { name: 'Alice Chen', role: 'CLIENT' },
    create: {
      id: CLIENT_ID,
      email: 'client1@escrow.local',
      passwordHash,
      name: 'Alice Chen',
      role: 'CLIENT',
      balance: 50000.0,
      balancePaise: 5000000,
      devScore: 85,
    },
  });

  await prisma.user.upsert({
    where: { id: FREELANCER_ID },
    update: { name: 'Charlie Vance', role: 'FREELANCER' },
    create: {
      id: FREELANCER_ID,
      email: 'dev1@escrow.local',
      passwordHash,
      name: 'Charlie Vance',
      role: 'FREELANCER',
      balance: 15000.0,
      balancePaise: 1500000,
      devScore: 94,
      githubProfile: 'charlievance',
    },
  });

  console.log('==> Cleaning any existing demo project records...');
  // Delete existing records with demo IDs if any
  await prisma.escrowTransaction.deleteMany({ where: { contractId: DEMO_CONTRACT_ID } });
  await prisma.deliverable.deleteMany({ where: { milestoneId: { in: [M1_ID, M2_ID, M3_ID] } } });
  await prisma.milestone.deleteMany({ where: { contractId: DEMO_CONTRACT_ID } });
  await prisma.contract.deleteMany({ where: { id: DEMO_CONTRACT_ID } });
  await prisma.proposal.deleteMany({ where: { id: DEMO_PROPOSAL_ID } });
  await prisma.project.deleteMany({ where: { id: DEMO_PROJECT_ID } });

  console.log('==> Creating Demo Project for Alice Chen...');
  const project = await prisma.project.create({
    data: {
      id: DEMO_PROJECT_ID,
      clientId: CLIENT_ID,
      title: 'Next-Gen AI Healthcare Analytics Portal',
      description:
        'Enterprise HIPAA-compliant healthcare predictive intelligence dashboard featuring real-time FHIR clinical record telemetry, patient risk stratification models, and automated milestone-based escrow settlement.',
      budget: 75000.0,
      budgetPaise: 7500000,
      skillTags: JSON.stringify(['react', 'nextjs', 'typescript', 'hipaa', 'fhir', 'ai-analytics', 'postgresql']),
      status: 'IN_PROGRESS',
    },
  });

  console.log('==> Creating Accepted Proposal from Charlie Vance...');
  await prisma.proposal.create({
    data: {
      id: DEMO_PROPOSAL_ID,
      projectId: project.id,
      freelancerId: FREELANCER_ID,
      bidAmount: 75000.0,
      bidAmountPaise: 7500000,
      coverLetter:
        'Experienced full-stack healthcare systems architect with proven FHIR API integration and HIPAA cryptographic security compliance. Ready to execute across 3 structured milestones.',
      aiMatchScore: 97.4,
      status: 'ACCEPTED',
    },
  });

  console.log('==> Provisioning Contract in IN_PROGRESS state...');
  // Total 75,000 INR:
  // Milestone 1 (25,000 INR) is RELEASED -> paid to Charlie.
  // Milestone 2 (25,000 INR) is SUBMITTED -> in escrow (locked).
  // Milestone 3 (25,000 INR) is FUNDED -> in escrow (locked).
  // Escrow balance currently locked: 50,000 INR.
  const contract = await prisma.contract.create({
    data: {
      id: DEMO_CONTRACT_ID,
      projectId: project.id,
      clientId: CLIENT_ID,
      freelancerId: FREELANCER_ID,
      totalAmount: 75000.0,
      totalAmountPaise: 7500000,
      escrowBalance: 50000.0,
      escrowBalancePaise: 5000000,
      status: 'IN_PROGRESS',
    },
  });

  console.log('==> Provisioning 3-stage Milestones demonstrating project progress...');

  // ---------------------------------------------------------------------------
  // Milestone 1: RELEASED (Completed, 33% of project delivered & paid)
  // ---------------------------------------------------------------------------
  const m1 = await prisma.milestone.create({
    data: {
      id: M1_ID,
      contractId: contract.id,
      title: 'M-01: HIPAA Architecture, BCNF Schema & Auth Engine',
      description:
        'Deliver verified architectural blueprints, Zero-Trust RBAC access controls, and encrypted PostgreSQL schema migrations for patient health records.',
      amount: 25000.0,
      amountPaise: 2500000,
      sequenceOrder: 1,
      status: 'RELEASED',
      dueDate: new Date(Date.now() - 10 * 86400000),
      reviewDeadline: new Date(Date.now() - 5 * 86400000),
    },
  });

  const m1DeliverableHash = crypto
    .createHash('sha256')
    .update('hipaa-architecture-deliverable-verified-evidence-2026')
    .digest('hex');

  await prisma.deliverable.create({
    data: {
      milestoneId: m1.id,
      fileName: 'hipaa-core-architecture-v1.tar.gz',
      fileUrl: 'https://storage.escrow.local/deliverables/m1/hipaa-core-architecture-v1.tar.gz',
      sha256Checksum: m1DeliverableHash,
      submissionNotes:
        'Completed full RBAC matrix, encryption-at-rest keys, and automated BCNF schema migration tests.',
      submittedAt: new Date(Date.now() - 7 * 86400000),
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract.id,
      milestoneId: m1.id,
      fromUserId: CLIENT_ID,
      toUserId: FREELANCER_ID,
      amount: 25000.0,
      amountPaise: 2500000,
      type: 'RELEASE',
      status: 'COMPLETED',
    },
  });

  // ---------------------------------------------------------------------------
  // Milestone 2: SUBMITTED (CURRENT ACTIVE MILESTONE - Awaiting Alice's Review!)
  // ---------------------------------------------------------------------------
  const m2ReviewDeadline = new Date(Date.now() + 6 * 86400000 + 14 * 3600000); // 6 days 14 hours remaining
  const m2 = await prisma.milestone.create({
    data: {
      id: M2_ID,
      contractId: contract.id,
      title: 'M-02: FHIR Real-Time Clinical Ingestion & AI Telemetry',
      description:
        'Build HL7/FHIR streaming microservices, patient risk clustering algorithm, and automated webhook ingestion pipeline.',
      amount: 25000.0,
      amountPaise: 2500000,
      sequenceOrder: 2,
      status: 'SUBMITTED',
      dueDate: new Date(Date.now() + 7 * 86400000),
      reviewDeadline: m2ReviewDeadline,
    },
  });

  const m2DeliverableHash = crypto
    .createHash('sha256')
    .update('fhir-streaming-microservices-ai-telemetry-bundle-sha256')
    .digest('hex');

  await prisma.deliverable.create({
    data: {
      milestoneId: m2.id,
      fileName: 'fhir-ai-telemetry-build-v2.zip',
      fileUrl: 'https://storage.escrow.local/deliverables/m2/fhir-ai-telemetry-build-v2.zip',
      sha256Checksum: m2DeliverableHash,
      submissionNotes:
        'Charlie Vance has submitted the completed FHIR telemetry ingestor with 100% unit test coverage. Ready for Client review & milestone release.',
      submittedAt: new Date(Date.now() - 6 * 3600000), // submitted 6 hours ago
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract.id,
      milestoneId: m2.id,
      fromUserId: CLIENT_ID,
      toUserId: null,
      amount: 25000.0,
      amountPaise: 2500000,
      type: 'LOCK',
      status: 'COMPLETED',
    },
  });

  // ---------------------------------------------------------------------------
  // Milestone 3: FUNDED (Upcoming Milestone - Escrow Locked)
  // ---------------------------------------------------------------------------
  const m3 = await prisma.milestone.create({
    data: {
      id: M3_ID,
      contractId: contract.id,
      title: 'M-03: Interactive 4K Clinical Dashboard & Load Testing',
      description:
        'High-density physician dashboard with Dark/Light mode, automated alert dispatch, and 10,000 req/sec stress test report.',
      amount: 25000.0,
      amountPaise: 2500000,
      sequenceOrder: 3,
      status: 'FUNDED',
      dueDate: new Date(Date.now() + 21 * 86400000),
      reviewDeadline: null,
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      contractId: contract.id,
      milestoneId: m3.id,
      fromUserId: CLIENT_ID,
      toUserId: null,
      amount: 25000.0,
      amountPaise: 2500000,
      type: 'LOCK',
      status: 'COMPLETED',
    },
  });

  // Log Audit trail
  await logAudit(CLIENT_ID, 'Project', project.id, 'PROJECT_CREATED', null, 'IN_PROGRESS');
  await logAudit(CLIENT_ID, 'Contract', contract.id, 'CONTRACT_CREATED', null, 'IN_PROGRESS');
  await logAudit(CLIENT_ID, 'Milestone', m1.id, 'MILESTONE_RELEASED', 'APPROVED', 'RELEASED');
  await logAudit(FREELANCER_ID, 'Milestone', m2.id, 'DELIVERABLE_SUBMITTED', 'IN_PROGRESS', 'SUBMITTED');

  console.log('\n================================================================================');
  console.log('==> DEMO PROJECT SUCCESSFULLY CREATED FOR ALICE CHEN:');
  console.log(`    Project:    ${project.title} (${project.id})`);
  console.log(`    Budget:     ₹75,000.00 (7,500,000 paise)`);
  console.log(`    Contract:   ${contract.id} (Status: IN_PROGRESS)`);
  console.log(`    Escrow:     ₹50,000.00 Locked | ₹25,000.00 Released`);
  console.log(`    Milestones:`);
  console.log(`      1. M-01: ${m1.title} -> [RELEASED] (₹25,000.00 Paid)`);
  console.log(`      2. M-02: ${m2.title} -> [SUBMITTED] (CURRENT ACTIVE - Under Review)`);
  console.log(`      3. M-03: ${m3.title} -> [FUNDED] (₹25,000.00 Locked)`);
  console.log('================================================================================\n');

  return { project, contract, milestones: [m1, m2, m3] };
}

if (require.main === module || process.argv[1]?.endsWith('create-demo-project.ts')) {
  createDemoProject()
    .catch((err) => {
      console.error('Failed to create demo project:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
