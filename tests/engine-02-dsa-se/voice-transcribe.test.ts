import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { POST as transcribeHandler } from '@/app/api/contracts/transcribe/route';
import { VectorSpaceRetriever } from '@/core/engine-02-dsa-se/rag-knowledge-base';
import { RagContractGenerator } from '@/core/engine-02-dsa-se/rag-contract-generator';
import { ContractManager } from '@/core/engine-03-dbms/contract-manager';
import * as groqLib from '@/lib/groq';

describe('Voice Negotiation Transcription & Upgraded RAG Architect (Engine 02 + Engine 03)', () => {
  let clientUser: any;
  let freelancerUser: any;
  let intruderUser: any;
  let project: any;
  let proposal: any;

  beforeEach(async () => {
    vi.restoreAllMocks();
    const passwordHash = bcrypt.hashSync('Password123!', 8);
    const rand = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    clientUser = await prisma.user.create({
      data: {
        email: `voice-client-${rand}@test.local`,
        passwordHash,
        name: 'Voice Client',
        role: 'CLIENT',
        balance: 5000,
        balancePaise: 500000,
      },
    });

    freelancerUser = await prisma.user.create({
      data: {
        email: `voice-dev-${rand}@test.local`,
        passwordHash,
        name: 'Voice Dev',
        role: 'FREELANCER',
        balance: 500,
        balancePaise: 50000,
      },
    });

    intruderUser = await prisma.user.create({
      data: {
        email: `voice-intruder-${rand}@test.local`,
        passwordHash,
        name: 'Voice Intruder',
        role: 'CLIENT',
        balance: 100,
        balancePaise: 10000,
      },
    });

    project = await prisma.project.create({
      data: {
        clientId: clientUser.id,
        title: 'Merkle Evidence Tree & Tamper Verification Pipeline',
        description: 'Design N-ary cryptographic tree structure for immutable audit proof chain verification.',
        budget: 2500,
        budgetPaise: 250000,
        skillTags: JSON.stringify(['merkle-tree', 'sha256', 'cryptography', 'data-structures']),
      },
    });

    proposal = await prisma.proposal.create({
      data: {
        projectId: project.id,
        freelancerId: freelancerUser.id,
        bidAmount: 2100,
        bidAmountPaise: 210000,
        coverLetter: 'Engineered SHA-256 Merkle proofs and tamper-evident audit pipelines.',
      },
    });
  });

  it('retrieves security-crypto template instead of ui-ux-design and excludes escrow-policy slots', () => {
    const retriever = new VectorSpaceRetriever();
    const results = retriever.search(
      'Merkle Evidence Tree & Tamper Verification Pipeline Design N-ary cryptographic tree sha256 cryptography',
      2,
      { excludeCategories: ['escrow-policy'], minSimilarity: 0.14 }
    );

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].document.id).toBe('kb-security-crypto');
    expect(results.some((r) => r.document.category === 'escrow-policy')).toBe(false);
    expect(results.some((r) => r.document.id === 'kb-ui-ux-design')).toBe(false);
  });

  it('retrieves os-concurrency template for distributed mutex & deadlock engine queries', () => {
    const retriever = new VectorSpaceRetriever();
    const results = retriever.search(
      'Distributed Mutex Deadlock Detection Engine typescript concurrency algorithms os',
      2,
      { excludeCategories: ['escrow-policy'], minSimilarity: 0.14 }
    );

    expect(results[0].document.id).toBe('kb-os-concurrency');
  });

  it('scrubs PII, strips <think> tags, normalizes ISO due dates, and returns transcriptHash in RagContractGenerator', async () => {
    const groqSpy = vi.spyOn(groqLib, 'callGroqChat').mockResolvedValueOnce({
      model: 'qwen/qwen3.8-27b',
      content: `<think>Internal reasoning about milestones</think>
\`\`\`json
{
  "summaryExplanation": "Split by voice agreement.",
  "milestones": [
    {
      "title": "M1: Merkle Leaf Hashing",
      "description": "Implement core SHA-256 hashing",
      "amount": 1000,
      "dueDate": "2026-12-05",
      "acceptanceChecklist": ["Deterministic hash verified"]
    },
    {
      "title": "M2: Proof Verifier",
      "description": "Verify inclusion proofs",
      "amount": 1100,
      "dueDate": "2026-12-12",
      "acceptanceChecklist": ["Tamper detection tests green"]
    }
  ]
}
\`\`\``,
    });

    const transcript = '[14:02 UTC] [Client]: Call me at 9876543210 or user@example.com for M1 ₹1000 and M2 ₹1100.';
    const res = await RagContractGenerator.generateMilestones({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        budget: project.budget,
        skillTags: ['merkle-tree', 'sha256', 'cryptography'],
      },
      proposal: {
        id: proposal.id,
        freelancerId: freelancerUser.id,
        freelancerName: freelancerUser.name,
        bidAmount: 2100,
        coverLetter: proposal.coverLetter,
      },
      chatTranscript: transcript,
    });

    expect(groqSpy).toHaveBeenCalledTimes(1);
    const sentPrompt = groqSpy.mock.calls[0][0][1].content;
    expect(sentPrompt).not.toContain('9876543210');
    expect(sentPrompt).not.toContain('user@example.com');
    expect(sentPrompt).toContain('[REDACTED_PHONE]');
    expect(sentPrompt).toContain('[REDACTED_EMAIL]');

    expect(res.generationMode).toBe('GROQ_RAG');
    expect(res.transcriptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(res.milestones).toHaveLength(2);
    expect(res.milestones[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(res.retrievedContext.matchedDocuments[0].id).toBe('kb-security-crypto');
  });

  it('rejects unauthenticated and third-party requests to POST /api/contracts/transcribe', async () => {
    const fdUnauth = new FormData();
    fdUnauth.append('proposalId', proposal.id);
    fdUnauth.append('audio', new Blob(['fake-audio'], { type: 'audio/webm' }), 'clip.webm');

    const unauthRes = await transcribeHandler(
      new Request('http://localhost:3000/api/contracts/transcribe', {
        method: 'POST',
        body: fdUnauth,
      })
    );
    expect(unauthRes.status).toBe(401);

    const fdIntruder = new FormData();
    fdIntruder.append('proposalId', proposal.id);
    fdIntruder.append('audio', new Blob(['fake-audio'], { type: 'audio/webm' }), 'clip.webm');

    const intruderRes = await transcribeHandler(
      new Request('http://localhost:3000/api/contracts/transcribe', {
        method: 'POST',
        headers: { 'x-user-id': intruderUser.id },
        body: fdIntruder,
      })
    );
    expect(intruderRes.status).toBe(403);
  });

  it('transcribes authorized client/freelancer audio clip with Groq Whisper and returns speaker-tagged turn + SHA-256', async () => {
    const whisperSpy = vi.spyOn(groqLib, 'transcribeAudioWithGroq').mockResolvedValueOnce({
      text: 'Let us split milestone one at one thousand rupees and milestone two at eleven hundred rupees.',
      model: 'whisper-large-v3-turbo',
      durationSec: 4.8,
    });

    const fd = new FormData();
    fd.append('proposalId', proposal.id);
    fd.append('speakerRole', 'FREELANCER');
    fd.append('audio', new Blob(['RIFF-fake-wav-bytes'], { type: 'audio/webm' }), 'agreement.webm');

    const res = await transcribeHandler(
      new Request('http://localhost:3000/api/contracts/transcribe', {
        method: 'POST',
        headers: { 'x-user-id': clientUser.id },
        body: fd,
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.model).toBe('whisper-large-v3-turbo');
    expect(json.data.formattedLine).toContain('[Freelancer (Voice Dev)]:');
    expect(json.data.clipSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(whisperSpy).toHaveBeenCalledTimes(1);
  });

  it('persists milestone acceptanceChecklist, integer paise amounts, and transcriptHash into AuditLog', async () => {
    const contractManager = new ContractManager();
    const transcriptHash = 'a'.repeat(64);
    const contract = await contractManager.createContractFromProposal({
      proposalId: proposal.id,
      actorId: clientUser.id,
      transcriptHash,
      milestones: [
        {
          title: 'Phase 1',
          description: 'Core hashing',
          amount: 1000,
          dueDate: new Date(Date.now() + 7 * 86400000),
          acceptanceChecklist: ['SHA-256 root matches spec'],
        },
        {
          title: 'Phase 2',
          description: 'Verification suite',
          amount: 1100,
          dueDate: new Date(Date.now() + 14 * 86400000),
          acceptanceChecklist: ['All tamper tests pass'],
        },
      ],
    });

    expect(contract!.totalAmountPaise).toBe(210000);
    expect(contract!.milestones[0].amountPaise).toBe(100000);
    expect(contract!.milestones[0].description).toContain('Acceptance Criteria:');
    expect(contract!.milestones[0].description).toContain('SHA-256 root matches spec');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { entityId: contract!.id, action: 'CONTRACT_FORMED' },
    });
    expect(auditEntry?.previousState).toBe(`TRANSCRIPT_SHA256:${transcriptHash}`);

    // Prevent duplicate contract formation for the same proposal
    await expect(
      contractManager.createContractFromProposal({
        proposalId: proposal.id,
        actorId: clientUser.id,
        milestones: [
          {
            title: 'Dup',
            description: 'Duplicate attempt',
            amount: 2100,
            dueDate: new Date(Date.now() + 7 * 86400000),
          },
        ],
      })
    ).rejects.toThrow();
  });
});
