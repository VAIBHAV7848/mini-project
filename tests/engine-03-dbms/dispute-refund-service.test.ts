import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '@/lib/db';
import crypto from 'node:crypto';
import { DisputeRefundService } from '@/core/engine-03-dbms/payments/dispute-refund-service';
import { CashfreeGateway } from '@/core/engine-03-dbms/payments/cashfree-gateway';
import { AuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { AuthorizationError, InvalidStateTransitionError, ValidationError } from '@/lib/errors';

describe('Engine 03 (DBMS) — Dispute Refund & Reversal Financial Flows', () => {
  const auditLogger = new AuditLogger();
  let gateway: CashfreeGateway;
  let service: DisputeRefundService;

  let client: any;
  let freelancer: any;
  let reviewer: any;
  let unauthorizedUser: any;
  let contract: any;
  let milestone: any;
  let dispute: any;

  beforeEach(async () => {
    vi.restoreAllMocks();
    const timestamp = Date.now();

    gateway = new CashfreeGateway({
      appId: 'TEST_APP_ID',
      secretKey: 'TEST_SECRET_KEY_123',
      webhookSecret: 'TEST_WEBHOOK_SECRET_KEY_EXACT_32_CH',
      environment: 'simulated',
    });

    service = new DisputeRefundService(gateway, auditLogger);

    client = await prisma.user.create({
      data: {
        email: `client-${timestamp}@test.local`,
        passwordHash: 'hash',
        name: 'Refund Client',
        role: 'CLIENT',
        balance: 5000.0,
      },
    });

    freelancer = await prisma.user.create({
      data: {
        email: `dev-${timestamp}@test.local`,
        passwordHash: 'hash',
        name: 'Refund Freelancer',
        role: 'FREELANCER',
        balance: 250.0,
      },
    });

    reviewer = await prisma.user.create({
      data: {
        email: `arbitrator-${timestamp}@test.local`,
        passwordHash: 'hash',
        name: 'Lead Arbitrator',
        role: 'REVIEWER',
        balance: 0.0,
      },
    });

    unauthorizedUser = await prisma.user.create({
      data: {
        email: `unauthorized-${timestamp}@test.local`,
        passwordHash: 'hash',
        name: 'Sneaky Client',
        role: 'CLIENT',
        balance: 100.0,
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        title: 'Mission Critical FinTech Escrow',
        description: 'Payment flows and dispute resolution',
        budget: 1000.01,
        skillTags: '["typescript", "cashfree"]',
      },
    });

    // Milestone amount is ₹1,000.01 = 100,001 paise (boundary condition with odd paise)
    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        freelancerId: freelancer.id,
        totalAmount: 1000.01,
        escrowBalance: 1000.01,
        status: 'DISPUTED',
      },
    });

    milestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Deliverable 1 with Dispute',
        description: 'Gateway integration deliverable',
        amount: 1000.01,
        sequenceOrder: 1,
        status: 'DISPUTED',
        dueDate: new Date(Date.now() + 86400000),
      },
    });

    dispute = await prisma.dispute.create({
      data: {
        milestoneId: milestone.id,
        raisedById: client.id,
        reason: 'Deliverable does not meet specification requirements.',
        status: 'OPEN',
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 1. Authorization & Validation
  // ---------------------------------------------------------------------------
  describe('1. Dispute Resolution Authorization & Preconditions', () => {
    it('should reject non-reviewer / non-admin attempts to resolve dispute and issue refund', async () => {
      await expect(
        service.initiateDisputeRefund({
          disputeId: dispute.id,
          reviewerId: unauthorizedUser.id,
          rulingNotes: 'Attempting unauthorized ruling',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should reject refund if milestone is not in DISPUTED state', async () => {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'IN_PROGRESS' },
      });

      await expect(
        service.initiateDisputeRefund({
          disputeId: dispute.id,
          reviewerId: reviewer.id,
          rulingNotes: 'Attempting premature refund',
        })
      ).rejects.toThrow(InvalidStateTransitionError);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Full Refund Flow & Webhook Confirmation
  // ---------------------------------------------------------------------------
  describe('2. Real Payment Full Refund Flow', () => {
    it('should execute full refund initiation: DISPUTED -> REFUND_PENDING, save PENDING refund record, and call Cashfree Gateway', async () => {
      const createRefundSpy = vi.spyOn(gateway, 'createRefund');

      const result = await service.initiateDisputeRefund({
        disputeId: dispute.id,
        reviewerId: reviewer.id,
        rulingNotes: 'Deliverable totally unacceptable. Full refund awarded to client.',
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('FULL_REFUND');
      expect(result.totalMilestonePaise).toBe(100001);
      expect(result.clientRefund.amountPaise).toBe(100001);
      expect(result.clientRefund.status).toBe('PENDING');
      expect(result.clientRefund.providerRefundId).toBeDefined();

      // Verify Cashfree gateway was called with exact orderId and paise amount
      expect(createRefundSpy).toHaveBeenCalledTimes(1);
      expect(createRefundSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: contract.id,
          amountPaise: 100001,
          refundReason: 'Deliverable totally unacceptable. Full refund awarded to client.',
        })
      );

      // Verify Milestone state transitioned to REFUND_PENDING
      const updatedMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
      expect(updatedMilestone!.status).toBe('REFUND_PENDING');

      // Verify Dispute updated to RESOLVED with ruling REFUND_TO_CLIENT
      const updatedDispute = await prisma.dispute.findUnique({ where: { id: dispute.id } });
      expect(updatedDispute!.status).toBe('RESOLVED');
      expect(updatedDispute!.ruling).toBe('REFUND_TO_CLIENT');

      // Verify in-memory tracked record has status PENDING
      const tracked = service.getRefundRecord(result.clientRefund.refundId);
      expect(tracked).toBeDefined();
      expect(tracked!.status).toBe('PENDING');

      // Verify pending EscrowTransaction exists in database
      const pendingTx = await prisma.escrowTransaction.findFirst({
        where: { contractId: contract.id, type: 'REFUND', status: 'PENDING' },
      });
      expect(pendingTx).toBeDefined();
      expect(pendingTx!.amount).toBe(1000.01);
    });

    it('should complete refund on Cashfree REFUND_SUCCESS webhook callback', async () => {
      // 1. Initiate refund
      const initiation = await service.initiateDisputeRefund({
        disputeId: dispute.id,
        reviewerId: reviewer.id,
        rulingNotes: 'Full refund ruling',
      });

      // 2. Prepare Cashfree webhook payload
      const webhookPayload = {
        event: 'REFUND_STATUS_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          refund: {
            cf_refund_id: initiation.clientRefund.providerRefundId!,
            refund_id: initiation.clientRefund.refundId,
            order_id: contract.id,
            refund_amount: 1000.01,
            refund_currency: 'INR',
            refund_status: 'SUCCESS',
            refund_arn: 'ARN_123456789012',
            status_description: 'Refund credited to client source instrument.',
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const payloadToSign = timestamp + rawBody;
      const signature = crypto
        .createHmac('sha256', 'TEST_WEBHOOK_SECRET_KEY_EXACT_32_CH')
        .update(payloadToSign)
        .digest('base64');

      // 3. Process webhook
      const webhookRes = await service.handleRefundWebhook(rawBody, timestamp, signature);
      expect(webhookRes.success).toBe(true);
      expect(webhookRes.action).toBe('REFUND_SETTLED');

      // 4. Verify DB state after webhook confirmation
      const finalMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
      expect(finalMilestone!.status).toBe('REFUNDED');

      const finalContract = await prisma.contract.findUnique({ where: { id: contract.id } });
      expect(finalContract!.escrowBalance).toBe(0.0);
      expect(finalContract!.status).toBe('REFUNDED');

      const finalClient = await prisma.user.findUnique({ where: { id: client.id } });
      expect(finalClient!.balance).toBe(6000.01); // 5000 + 1000.01 refund

      // Verify EscrowTransaction updated to COMPLETED
      const finalTx = await prisma.escrowTransaction.findUnique({
        where: { id: webhookRes.transactionId },
      });
      expect(finalTx!.status).toBe('COMPLETED');

      // 5. Verify cryptographic audit records created for this milestone and dispute
      const disputeAudit = await prisma.auditLog.findFirst({
        where: { entityId: dispute.id, action: 'DISPUTE_REFUND_TO_CLIENT_INITIATED' },
      });
      expect(disputeAudit).toBeDefined();
      expect(disputeAudit!.verificationHash).toHaveLength(64);

      const webhookAudit = await prisma.auditLog.findFirst({
        where: { entityId: milestone.id, action: 'CASHFREE_REFUND_SUCCESS' },
      });
      expect(webhookAudit).toBeDefined();
      expect(webhookAudit!.verificationHash).toHaveLength(64);
      expect(webhookAudit!.prevHash).toBe(disputeAudit!.verificationHash);
    });

    it('should handle duplicate webhook delivery idempotently without double-crediting client balance', async () => {
      const initiation = await service.initiateDisputeRefund({
        disputeId: dispute.id,
        reviewerId: reviewer.id,
        rulingNotes: 'Full refund ruling for idempotency check',
      });

      const webhookPayload = {
        event: 'REFUND_STATUS_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          refund: {
            cf_refund_id: initiation.clientRefund.providerRefundId!,
            refund_id: initiation.clientRefund.refundId,
            order_id: contract.id,
            refund_amount: 1000.01,
            refund_currency: 'INR',
            refund_status: 'SUCCESS',
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto
        .createHmac('sha256', 'TEST_WEBHOOK_SECRET_KEY_EXACT_32_CH')
        .update(timestamp + rawBody)
        .digest('base64');

      // First webhook
      const res1 = await service.handleRefundWebhook(rawBody, timestamp, signature);
      expect(res1.action).toBe('REFUND_SETTLED');

      const balanceAfterFirst = (await prisma.user.findUnique({ where: { id: client.id } }))!.balance;

      // Duplicate webhook replay
      const res2 = await service.handleRefundWebhook(rawBody, timestamp, signature);
      expect(res2.action).toBe('ALREADY_PROCESSED_IDEMPOTENT');

      const balanceAfterSecond = (await prisma.user.findUnique({ where: { id: client.id } }))!.balance;
      expect(balanceAfterSecond).toBe(balanceAfterFirst); // Zero double-crediting!
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Partial Refund & Split Settlements (Exact Integer Paise)
  // ---------------------------------------------------------------------------
  describe('3. Partial Refund & Split Settlement with Exact Integer Paise Arithmetic', () => {
    it('should split 100,001 paise (₹1,000.01) 50/50 with zero paise rounding drift', async () => {
      const createRefundSpy = vi.spyOn(gateway, 'createRefund');
      const createTransferSpy = vi.spyOn(gateway, 'createTransfer');

      // Act: Arbitrator awards 50% refund to client, 50% settlement to freelancer
      const result = await service.initiateDisputeRefund({
        disputeId: dispute.id,
        reviewerId: reviewer.id,
        rulingNotes: '50/50 fair compromise: deliverable partially functional.',
        splitRatio: {
          clientPercentage: 50,
          freelancerPercentage: 50,
        },
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('PARTIAL_SPLIT');

      // Milestone total = 100,001 paise
      // Floor(100,001 * 0.50) = 50,000 paise (or 50,000 to client, 50,001 to dev)
      const clientPaise = result.clientRefund.amountPaise;
      const devPaise = result.freelancerTransfer!.amountPaise;

      // Strict mathematical invariant
      expect(clientPaise + devPaise).toBe(100001);
      expect(clientPaise).toBe(50000);
      expect(devPaise).toBe(50001);

      // Verify Cashfree Refund API called for client
      expect(createRefundSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: contract.id,
          amountPaise: 50000,
        })
      );

      // Verify Cashfree Transfer API called for freelancer
      expect(createTransferSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          beneficiaryId: freelancer.id,
          amountPaise: 50001,
        })
      );

      // Verify Milestone transitioned to PARTIALLY_REFUNDED_PENDING
      const updatedMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
      expect(updatedMilestone!.status).toBe('PARTIALLY_REFUNDED_PENDING');

      // Verify two pending ledger records created
      const pendingTxs = await prisma.escrowTransaction.findMany({
        where: { contractId: contract.id, status: 'PENDING' },
      });
      expect(pendingTxs).toHaveLength(2);
      const refundTx = pendingTxs.find((t) => t.type === 'REFUND');
      const releaseTx = pendingTxs.find((t) => t.type === 'RELEASE');
      expect(refundTx!.amount).toBe(500.0);
      expect(releaseTx!.amount).toBe(500.01);
      expect(refundTx!.amount + releaseTx!.amount).toBe(1000.01);
    });

    it('should reject invalid split percentage configurations that do not sum to 100', async () => {
      await expect(
        service.initiateDisputeRefund({
          disputeId: dispute.id,
          reviewerId: reviewer.id,
          rulingNotes: 'Invalid split percentages test',
          splitRatio: {
            clientPercentage: 60,
            freelancerPercentage: 50, // Sums to 110%
          },
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Webhook Failure Handling & Escrow Conservation
  // ---------------------------------------------------------------------------
  describe('4. Webhook REFUND_FAILED Handling & Escrow Conservation', () => {
    it('should handle REFUND_FAILED by marking transaction FAILED and preserving escrow balance without fund loss', async () => {
      const initiation = await service.initiateDisputeRefund({
        disputeId: dispute.id,
        reviewerId: reviewer.id,
        rulingNotes: 'Full refund to test gateway failure callback',
      });

      const webhookPayload = {
        event: 'REFUND_STATUS_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          refund: {
            cf_refund_id: initiation.clientRefund.providerRefundId!,
            refund_id: initiation.clientRefund.refundId,
            order_id: contract.id,
            refund_amount: 1000.01,
            refund_currency: 'INR',
            refund_status: 'FAILED',
            status_description: 'Client bank account closed or frozen.',
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto
        .createHmac('sha256', 'TEST_WEBHOOK_SECRET_KEY_EXACT_32_CH')
        .update(timestamp + rawBody)
        .digest('base64');

      const webhookRes = await service.handleRefundWebhook(rawBody, timestamp, signature);
      expect(webhookRes.success).toBe(false);
      expect(webhookRes.action).toBe('REFUND_FAILED_NOTIFIED');

      // Milestone flagged as REFUND_FAILED for manual admin intervention
      const updatedMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
      expect(updatedMilestone!.status).toBe('REFUND_FAILED');

      // Critical Invariant: Escrow funds MUST remain intact in the escrow pool
      const intactContract = await prisma.contract.findUnique({ where: { id: contract.id } });
      expect(intactContract!.escrowBalance).toBe(1000.01);

      // Client balance did NOT receive unbacked funds
      const intactClient = await prisma.user.findUnique({ where: { id: client.id } });
      expect(intactClient!.balance).toBe(5000.0);
    });

    it('should reject webhook with forged signature (AuthorizationError)', async () => {
      const rawBody = JSON.stringify({ dummy: 'payload' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const forgedSig = 'invalid_forged_signature_value==';

      await expect(
        service.handleRefundWebhook(rawBody, timestamp, forgedSig)
      ).rejects.toThrow(AuthorizationError);
    });
  });
});
