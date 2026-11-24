import { describe, it, expect, vi, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { CashfreeGateway } from '@/lib/cashfree';
import { LedgerCoordinator } from '@/core/engine-03-dbms/ledger';
import { SessionService } from '@/core/engine-04-web/session';
import { GET as verifyGetHandler } from '@/app/api/payments/verify/route';
import { entityIdSchema } from '@/lib/validation';
import { middleware } from '@/middleware';

describe('Security Hardening & Ledger Paise Conservation Regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('rejects unverified JWT payloads in AuthService.getSupabaseUserFromToken when Supabase rejects', async () => {
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const fakePayload = Buffer.from(
      JSON.stringify({ sub: 'forged-sub', email: 'attacker@escrow.local' })
    ).toString('base64url');
    const forgedJwt = `${fakeHeader}.${fakePayload}.`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid token' }), { status: 401 })
    );

    const verified = await AuthService.getSupabaseUserFromToken(forgedJwt);
    expect(verified).toBeNull();
  });

  it('disables Tier 1 demo bypass passwords when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid grant' }), { status: 400 })
    );

    await expect(
      AuthService.authenticate({
        email: 'client1@escrow.local',
        password: 'VAIBHAV2667',
      })
    ).rejects.toThrow();
  });

  it('enforces authentication and ownership on GET /api/payments/verify', async () => {
    const ts = Date.now();
    const owner = await prisma.user.create({
      data: {
        email: `verify-owner-${ts}@test.local`,
        passwordHash: bcrypt.hashSync('Password123!', 8),
        name: 'Verify Owner',
        role: 'CLIENT',
        balance: 5000,
        balancePaise: 500000,
      },
    });
    const attacker = await prisma.user.create({
      data: {
        email: `verify-attacker-${ts}@test.local`,
        passwordHash: bcrypt.hashSync('Password123!', 8),
        name: 'Verify Attacker',
        role: 'CLIENT',
        balance: 5000,
        balancePaise: 500000,
      },
    });
    const dev = await prisma.user.create({
      data: {
        email: `verify-dev-${ts}@test.local`,
        passwordHash: bcrypt.hashSync('Password123!', 8),
        name: 'Verify Dev',
        role: 'FREELANCER',
        balance: 0,
        balancePaise: 0,
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: owner.id,
        title: 'Payment Ownership Project',
        description: 'Testing strict ownership check on payment status lookup',
        budget: 1000,
        skillTags: '["security"]',
      },
    });

    const contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: owner.id,
        freelancerId: dev.id,
        totalAmount: 1000,
        escrowBalance: 0,
        status: 'AWAITING_DEPOSIT',
      },
    });

    const orderId = `cf_sec_${ts}`;
    await prisma.payment.create({
      data: {
        id: `pay_sec_${ts}`,
        contractId: contract.id,
        clientId: owner.id,
        amountPaise: 100000,
        currency: 'INR',
        provider: 'CASHFREE',
        providerOrderId: orderId,
        status: 'PENDING',
      },
    });

    const unauthReq = new Request(`http://localhost:3000/api/payments/verify?orderId=${orderId}`);
    const unauthRes = await verifyGetHandler(unauthReq);
    expect(unauthRes.status).toBe(401);

    const attackerToken = SessionService.createToken({
      id: attacker.id,
      email: attacker.email,
      role: 'CLIENT',
      name: attacker.name,
    });
    const idorReq = new Request(`http://localhost:3000/api/payments/verify?orderId=${orderId}`, {
      headers: { Cookie: `escrow_session=${attackerToken}` },
    });
    const idorRes = await verifyGetHandler(idorReq);
    expect(idorRes.status).toBe(403);
  });

  it('fails closed in CashfreeGateway.verifyWebhookSignature when secret key is unconfigured', () => {
    const rawBody = JSON.stringify({ event: 'PAYMENT_SUCCESS_WEBHOOK', order_id: 'ord_1' });
    const ts = Math.floor(Date.now() / 1000).toString();
    expect(CashfreeGateway.verifyWebhookSignature(rawBody, 'forged', ts, 300)).toBe(false);
  });

  it('protects /admin and /admin/finance routes in middleware', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/admin/finance'));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login?redirect=%2Fadmin%2Ffinance');
  });

  it('conserves both float and integer paise balances across depositEscrow and releaseMilestoneEscrow', async () => {
    const ts = Date.now();
    const client = await prisma.user.create({
      data: {
        email: `paise-client-${ts}@test.local`,
        passwordHash: 'hash',
        name: 'Paise Client',
        role: 'CLIENT',
        balance: 2000.0,
        balancePaise: 200000,
      },
    });
    const freelancer = await prisma.user.create({
      data: {
        email: `paise-dev-${ts}@test.local`,
        passwordHash: 'hash',
        name: 'Paise Dev',
        role: 'FREELANCER',
        balance: 500.0,
        balancePaise: 50000,
      },
    });
    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        title: 'Paise Conservation Project',
        description: 'Ensures integer paise and float INR balances never drift',
        budget: 750.5,
        skillTags: '["ledger"]',
      },
    });
    const contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        freelancerId: freelancer.id,
        totalAmount: 750.5,
        escrowBalance: 0,
        escrowBalancePaise: 0,
        status: 'AWAITING_DEPOSIT',
      },
    });
    const milestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'M1 Paise Sync',
        description: 'Verify exact paise math',
        amount: 750.5,
        amountPaise: 75050,
        sequenceOrder: 1,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 86400000),
      },
    });

    const ledger = new LedgerCoordinator();
    await ledger.depositEscrow({
      contractId: contract.id,
      clientId: client.id,
      amount: 750.5,
    });

    const afterDepositClient = await prisma.user.findUnique({ where: { id: client.id } });
    const afterDepositContract = await prisma.contract.findUnique({ where: { id: contract.id } });
    expect(afterDepositClient!.balancePaise).toBe(124950);
    expect(afterDepositContract!.escrowBalancePaise).toBe(75050);

    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'APPROVED' },
    });

    await ledger.releaseMilestoneEscrow({
      contractId: contract.id,
      milestoneId: milestone.id,
      freelancerId: freelancer.id,
      amount: 750.5,
      actorId: client.id,
    });

    const afterReleaseContract = await prisma.contract.findUnique({ where: { id: contract.id } });
    const afterReleaseDev = await prisma.user.findUnique({ where: { id: freelancer.id } });
    expect(afterReleaseContract!.escrowBalancePaise).toBe(0);
    expect(afterReleaseDev!.balancePaise).toBe(125050);
  });

  it('accepts RFC UUIDs and seeded non-hex IDs while rejecting malformed IDs in entityIdSchema', () => {
    expect(entityIdSchema.safeParse('9d640d0c-137c-47dd-a118-084d7e2ec807').success).toBe(true);
    expect(entityIdSchema.safeParse('pr600000-0000-4000-8000-000000000007').success).toBe(true);
    expect(entityIdSchema.safeParse('p6000000-0000-4000-8000-000000000006').success).toBe(true);
    expect(entityIdSchema.safeParse('bad').success).toBe(false);
    expect(entityIdSchema.safeParse('id; DROP TABLE users;--').success).toBe(false);
  });
});
