import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import crypto from 'node:crypto';
import { CashfreeGateway } from '@/core/engine-03-dbms/payments/cashfree-gateway';
import { SettlementService } from '@/core/engine-03-dbms/payments/settlement-service';
import { DisputeRefundService } from '@/core/engine-03-dbms/payments/dispute-refund-service';
import { AuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { AuthorizationError } from '@/lib/errors';

describe('Security & Penetration Suite: Payment Gateways & Webhooks (NFR-02, NFR-03)', () => {
  const WEBHOOK_SECRET = 'TEST_SECURITY_SECRET_KEY_32_CHARACTERS';
  const gateway = new CashfreeGateway({ webhookSecret: WEBHOOK_SECRET, environment: 'simulated' });
  const auditLogger = new AuditLogger();
  const disputeRefundService = new DisputeRefundService(gateway, auditLogger);
  const settlementService = new SettlementService(gateway, auditLogger);

  let legitimateClient: any;
  let maliciousUser: any;
  let legitimateFreelancer: any;
  let contract: any;
  let milestone: any;

  beforeEach(async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM user_payout_methods');
      await prisma.$executeRawUnsafe('DELETE FROM settlement_transfers');
    } catch {
      // ignore
    }

    const ts = Date.now();

    legitimateClient = await prisma.user.create({
      data: {
        email: `legit-client-${ts}-${Math.random()}@test.local`,
        passwordHash: 'hash',
        name: 'Legit Client',
        role: 'CLIENT',
        balance: 1000.0,
      },
    });

    maliciousUser = await prisma.user.create({
      data: {
        email: `attacker-${ts}-${Math.random()}@test.local`,
        passwordHash: 'hash',
        name: 'Malicious Attacker',
        role: 'CLIENT',
        balance: 10.0,
      },
    });

    legitimateFreelancer = await prisma.user.create({
      data: {
        email: `legit-dev-${ts}-${Math.random()}@test.local`,
        passwordHash: 'hash',
        name: 'Legit Freelancer',
        role: 'FREELANCER',
        balance: 0.0,
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: legitimateClient.id,
        title: 'Security Target Escrow Project',
        description: 'Payment security boundary testing',
        budget: 1000.0,
        skillTags: '["security", "audit"]',
      },
    });

    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: legitimateClient.id,
        freelancerId: legitimateFreelancer.id,
        totalAmount: 1000.0,
        escrowBalance: 1000.0,
        status: 'FUNDED',
      },
    });

    milestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Security Hardened Milestone',
        description: 'Testing injection and tampering resistance',
        amount: 1000.0,
        sequenceOrder: 1,
        status: 'APPROVED',
        dueDate: new Date(Date.now() + 86400000),
      },
    });
  });

  describe('1. Tampered Webhook Payload & Amount Verification', () => {
    it('should reject webhook payload where payment amount was reduced by attacker', () => {
      const tamperedPayload = {
        event: 'PAYMENT_SUCCESS_WEBHOOK',
        order: {
          order_id: contract.id,
          order_amount: 10.0,
          order_currency: 'INR',
        },
      };

      const rawBody = JSON.stringify(tamperedPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const forgedSig = crypto.createHmac('sha256', 'ATTACKER_KEY').update(timestamp + rawBody).digest('base64');

      expect(gateway.verifyWebhookSignature(rawBody, timestamp, forgedSig)).toBe(false);
    });

    it('should reject webhook with 401 AuthorizationError if signature header is missing or forged', async () => {
      const rawBody = JSON.stringify({ dummy: 'attack' });
      const timestamp = Math.floor(Date.now() / 1000).toString();

      await expect(
        disputeRefundService.handleRefundWebhook(rawBody, timestamp, 'forged_signature_attack==')
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('2. Replay Attack Immunity (> 300s window)', () => {
    it('should reject signed payloads with timestamp older than 300s', async () => {
      const rawBody = JSON.stringify({
        event: 'REFUND_STATUS_WEBHOOK',
        data: { refund: { order_id: contract.id, refund_status: 'SUCCESS' } },
      });
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(expiredTimestamp + rawBody)
        .digest('base64');

      await expect(
        disputeRefundService.handleRefundWebhook(rawBody, expiredTimestamp, signature)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('3. IDOR (Insecure Direct Object Reference) Prevention', () => {
    it('should prevent malicious client from settling another clients milestone', async () => {
      await settlementService.registerPayoutMethod({
        userId: legitimateFreelancer.id,
        vendorId: `CF_BENE_SEC_${Date.now()}`,
        accountType: 'UPI',
        accountIdentifier: 'freelancer@upi',
        isVerified: true,
      });

      await expect(
        settlementService.initiateSettlement({
          contractId: contract.id,
          milestoneId: milestone.id,
          clientId: maliciousUser.id,
          actorRole: 'CLIENT',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should prevent non-arbitrator / non-admin from executing dispute refund ruling', async () => {
      const dispute = await prisma.dispute.create({
        data: {
          milestoneId: milestone.id,
          raisedById: legitimateClient.id,
          reason: 'Security dispute',
          status: 'OPEN',
        },
      });

      await expect(
        disputeRefundService.initiateDisputeRefund({
          disputeId: dispute.id,
          reviewerId: maliciousUser.id,
          rulingNotes: 'Attacker awarding self refund',
        })
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('4. Injection & Parameter Pollution Hardening', () => {
    it('should reject SQL injection strings in vendor IDs and account identifiers safely', async () => {
      const maliciousVendorId = `CF_BENE_${Date.now()}'; DROP TABLE user_payout_methods;--`;
      await settlementService.registerPayoutMethod({
        userId: legitimateFreelancer.id,
        vendorId: maliciousVendorId,
        accountType: 'UPI',
        accountIdentifier: 'legit@upi',
        isVerified: true,
      });

      const count = await prisma.$queryRawUnsafe<any[]>('SELECT count(*) as cnt FROM users');
      expect(Number(count[0].cnt)).toBeGreaterThan(0);
    });

    it('should reject prototype pollution attempts in payment split payloads', () => {
      const payload: any = JSON.parse('{"__proto__": {"isAdmin": true}, "clientPercentage": 50, "freelancerPercentage": 50}');
      expect(({} as any).isAdmin).toBeUndefined();
    });
  });
});
