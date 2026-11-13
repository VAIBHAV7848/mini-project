import { describe, it, expect, beforeEach } from 'vitest';
import {
  VectorSpaceRetriever,
  tokenizeText,
  MILESTONE_KNOWLEDGE_CORPUS,
} from '@/core/engine-02-dsa-se/rag-knowledge-base';
import { RagContractGenerator } from '@/core/engine-02-dsa-se/rag-contract-generator';

describe('Engine 02 (DSA & SE) — RAG Knowledge Base & Vector Space Retriever', () => {
  it('correctly tokenizes and filters common stop words', () => {
    const raw = 'The quick brown fox and a very fast React developer with TypeScript!';
    const tokens = tokenizeText(raw);

    expect(tokens).toContain('quick');
    expect(tokens).toContain('brown');
    expect(tokens).toContain('fox');
    expect(tokens).toContain('fast');
    expect(tokens).toContain('react');
    expect(tokens).toContain('developer');
    expect(tokens).toContain('typescript');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('and');
    expect(tokens).not.toContain('a');
    expect(tokens).not.toContain('very');
    expect(tokens).not.toContain('with');
  });

  it('retrieves web fullstack template for React/Next.js queries with highest cosine similarity', () => {
    const retriever = new VectorSpaceRetriever(MILESTONE_KNOWLEDGE_CORPUS);
    const results = retriever.search('We need a fullstack Next.js web application with Tailwind and React UI', 2);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.id).toBe('kb-web-fullstack');
    expect(results[0].similarityScore).toBeGreaterThan(0.2);
    expect(results[0].matchedTokens).toContain('nextjs');
  });

  it('retrieves mobile app template for Flutter / React Native queries', () => {
    const retriever = new VectorSpaceRetriever(MILESTONE_KNOWLEDGE_CORPUS);
    const results = retriever.search('Build cross platform mobile app for Android and iOS in React Native', 2);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.id).toBe('kb-mobile-app');
    expect(results[0].similarityScore).toBeGreaterThan(0.2);
  });

  it('retrieves backend microservice template for database and SQL queries', () => {
    const retriever = new VectorSpaceRetriever(MILESTONE_KNOWLEDGE_CORPUS);
    const results = retriever.search('Design BCNF relational schema and normalized database with Prisma API', 2);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.id).toBe('kb-backend-microservice');
  });
});

describe('Engine 02 (DSA & SE) — RAG Milestone Contract Generator', () => {
  const sampleProject = {
    id: 'proj-101',
    title: 'E-Commerce Marketplace with Next.js & Escrow Payment',
    description: 'Build responsive frontend marketplace with user authentication and checkout flow.',
    budget: 30000,
    skillTags: ['nextjs', 'react', 'typescript', 'tailwind'],
  };

  const sampleProposal = {
    id: 'prop-202',
    freelancerId: 'free-303',
    freelancerName: 'Darshan Kittur',
    bidAmount: 25000,
    coverLetter: 'I have 3 years of production Next.js experience. Can build this with high test coverage.',
  };

  const sampleChat = `Client: Can we do 2 milestones? Phase 1 for UI and Auth (₹10,000), Phase 2 for Checkout and Testing (₹15,000)?\nFreelancer: Yes, agreed!`;

  it('generates schema-compliant milestones that exactly balance to the agreed bid amount', async () => {
    const result = await RagContractGenerator.generateMilestones({
      project: sampleProject,
      proposal: sampleProposal,
      chatTranscript: sampleChat,
    });

    expect(result).toBeDefined();
    expect(result.milestones.length).toBeGreaterThanOrEqual(2);
    expect(result.totalAmount).toBe(25000);

    // Assert exact sum equality
    const sum = result.milestones.reduce((acc, m) => acc + m.amount, 0);
    expect(Math.abs(sum - 25000)).toBeLessThan(0.01);

    // Verify milestones format
    for (const m of result.milestones) {
      expect(m.title.length).toBeGreaterThanOrEqual(3);
      expect(m.description.length).toBeGreaterThanOrEqual(5);
      expect(m.amount).toBeGreaterThan(0);
      expect(new Date(m.dueDate).getTime()).toBeGreaterThan(Date.now());
      expect(Array.isArray(m.acceptanceChecklist)).toBe(true);
    }

    // Verify RAG context attribution
    expect(result.retrievedContext.matchedDocuments.length).toBeGreaterThan(0);
    expect(result.retrievedContext.appliedClauses.length).toBeGreaterThan(0);
  });

  it('handles empty chat transcripts by falling back to project specification synthesis', async () => {
    const result = await RagContractGenerator.generateMilestones({
      project: sampleProject,
      proposal: sampleProposal,
      chatTranscript: '',
    });

    expect(result.milestones.length).toBeGreaterThanOrEqual(2);
    const sum = result.milestones.reduce((acc, m) => acc + m.amount, 0);
    expect(Math.abs(sum - 25000)).toBeLessThan(0.01);
  });
});

import { POST as ragGenerateHandler } from '@/app/api/contracts/rag-generate/route';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Engine 04 (Web) & Engine 02 (DSA) — POST /api/contracts/rag-generate API Route', () => {
  let clientUser: any;
  let devUser: any;
  let intruderUser: any;
  let project: any;
  let proposal: any;

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync('Password123!', 8);
    const rand = Math.random().toString(36).substring(7);

    clientUser = await prisma.user.create({
      data: {
        email: `rag-client-${rand}@test.local`,
        passwordHash,
        name: 'RAG Client',
        role: 'CLIENT',
        balance: 10000,
      },
    });

    devUser = await prisma.user.create({
      data: {
        email: `rag-dev-${rand}@test.local`,
        passwordHash,
        name: 'RAG Freelancer',
        role: 'FREELANCER',
        balance: 500,
      },
    });

    intruderUser = await prisma.user.create({
      data: {
        email: `rag-intruder-${rand}@test.local`,
        passwordHash,
        name: 'Intruder',
        role: 'CLIENT',
        balance: 100,
      },
    });

    project = await prisma.project.create({
      data: {
        clientId: clientUser.id,
        title: 'Full-Stack Next.js Web App',
        description: 'Complete modern platform with Next.js, Prisma, and escrow.',
        budget: 40000,
        budgetPaise: 4000000,
        skillTags: JSON.stringify(['nextjs', 'react', 'prisma', 'typescript']),
      },
    });

    proposal = await prisma.proposal.create({
      data: {
        projectId: project.id,
        freelancerId: devUser.id,
        bidAmount: 35000,
        bidAmountPaise: 3500000,
        coverLetter: 'I am ready to build this project with full unit test coverage.',
      },
    });
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:3000/api/contracts/rag-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: proposal.id }),
    });

    const res = await ragGenerateHandler(req);
    expect(res.status).toBe(401);
  });

  it('rejects unauthorized third-party user with 403', async () => {
    const req = new Request('http://localhost:3000/api/contracts/rag-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': intruderUser.id,
      },
      body: JSON.stringify({ proposalId: proposal.id }),
    });

    const res = await ragGenerateHandler(req);
    expect(res.status).toBe(403);
  });

  it('successfully generates balanced milestones for authorized client', async () => {
    const req = new Request('http://localhost:3000/api/contracts/rag-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': clientUser.id,
      },
      body: JSON.stringify({
        proposalId: proposal.id,
        chatTranscript: 'Client: We want 2 milestones, 50% each.\nFreelancer: Confirmed!',
      }),
    });

    const res = await ragGenerateHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.milestones.length).toBeGreaterThanOrEqual(2);
    expect(body.data.totalAmount).toBe(35000);

    const sum = body.data.milestones.reduce((acc: number, m: any) => acc + m.amount, 0);
    expect(Math.abs(sum - 35000)).toBeLessThan(0.01);
  });
});
