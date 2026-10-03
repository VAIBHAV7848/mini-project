import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import crypto from 'node:crypto';
import { CashfreeGateway } from '@/core/engine-03-dbms/payments/cashfree-gateway';
import { globalEscrowFsm } from '@/core/engine-01-os/escrow-fsm';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';

class PaymentWebhookProcessor {
  constructor(
    private gateway: CashfreeGateway,
    private webhookSecret: string
  ) {}

  async processPaymentWebhook(rawBody: string, timestamp: string, signature: string): Promise<{ status: number; body: Record<string, unknown> }> {
    const isValid = this.gateway.verifyWebhookSignature(rawBody, timestamp, signature);
    if (!isValid) {
      return { status: 401, body: { error: 'Invalid webhook signature or stale timestamp.' } };
    }

    const payload = JSON.parse(rawBody);
    const orderId = payload.data?.order?.order_id || payload.order?.order_id;
    const paidAmount = Number(payload.data?.order?.order_amount || payload.order?.order_amount);

    return await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: orderId },
        include: { milestones: { orderBy: { sequenceOrder: 'asc' } } },
      });

      if (!contract) {
        return { status: 404, body: { error: 'Contract not found.' } };
      }

      // Strict Idempotency Check
      if (contract.status === 'FUNDED' && contract.escrowBalance >= contract.totalAmount) {
        return {
          status: 200,
          body: { success: true, action: 'ALREADY_PROCESSED_IDEMPOTENT', contractId: contract.id },
        };
      }

      // Amount Matching Check
      if (Math.abs(paidAmount - contract.totalAmount) > 0.01) {
        return {
          status: 422,
          body: { error: `Amount mismatch: expected ₹${contract.totalAmount}, received ₹${paidAmount}` },
        };
      }

      // FSM State Transition Assertion (AWAITING_DEPOSIT -> FUNDED)
      const transitionResult = globalEscrowFsm.validateTransition(
        contract.status as any,
        'DEPOSIT',
        'SYSTEM'
      );
      if (!transitionResult.allowed) {
        return { status: 400, body: { error: `Illegal transition: ${transitionResult.errorCode}` } };
      }

      // Update Contract & Milestone
      await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: 'FUNDED',
          escrowBalance: contract.totalAmount,
        },
      });

      const escrowTx = await tx.escrowTransaction.create({
        data: {
          contractId: contract.id,
          amount: contract.totalAmount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          fromUserId: contract.clientId,
        },
      });

      await globalAuditLogger.logAction(
        {
          actorId: 'SYSTEM_CASHFREE_WEBHOOK',
          entityName: 'CONTRACT',
          entityId: contract.id,
          action: 'CASHFREE_DEPOSIT_CONFIRMED',
          previousState: contract.status,
          newState: 'FUNDED',
        },
        tx
      );

      return {
        status: 200,
        body: {
          success: true,
          action: 'CONTRACT_FUNDED',
          contractId: contract.id,
          transactionId: escrowTx.id,
        },
      };
    });
  }
}

describe('Integration: Cashfree Webhook -> DB State -> FSM FUNDED -> Idempotency', () => {
  const WEBHOOK_SECRET = 'INTEGRATION_TEST_SECRET_KEY_EXACT_32_CH';
  let gateway: CashfreeGateway;
  let processor: PaymentWebhookProcessor;
  let testClient: any;
  let testFreelancer: any;
  let contract: any;

  beforeEach(async () => {
    gateway = new CashfreeGateway({ webhookSecret: WEBHOOK_SECRET, environment: 'simulated' });
    processor = new PaymentWebhookProcessor(gateway, WEBHOOK_SECRET);

    const ts = Date.now();
    testClient = await prisma.user.create({
      data: {
        email: `wh-client-${ts}-${Math.random()}@test.local`,
        passwordHash: 'hash',
        name: 'Webhook Client',
        role: 'CLIENT',
        balance: 500.0,
      },
    });

    testFreelancer = await prisma.user.create({
      data: {
        email: `wh-dev-${ts}-${Math.random()}@test.local`,
        passwordHash: 'hash',
        name: 'Webhook Dev',
        role: 'FREELANCER',
        balance: 0.0,
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: testClient.id,
        title: 'Webhook Escrow Project',
        description: 'Testing real payment gateway webhook integration',
        budget: 500.0,
        skillTags: '["typescript", "nextjs"]',
      },
    });

    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: testClient.id,
        freelancerId: testFreelancer.id,
        totalAmount: 500.0,
        escrowBalance: 0.0,
        status: 'AWAITING_DEPOSIT',
      },
    });

    await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Milestone 1',
        description: 'First phase',
        amount: 500.0,
        sequenceOrder: 1,
        status: 'AWAITING_DEPOSIT',
        dueDate: new Date(Date.now() + 86400000),
      },
    });
  });

  it('should successfully verify Cashfree webhook, fund contract in DB, and advance FSM', async () => {
    const payload = {
      event: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: contract.id,
          order_amount: 500.0,
          order_currency: 'INR',
          order_status: 'PAID',
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(timestamp + rawBody)
      .digest('base64');

    const res = await processor.processPaymentWebhook(rawBody, timestamp, signature);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.action).toBe('CONTRACT_FUNDED');

    const updatedContract = await prisma.contract.findUnique({ where: { id: contract.id } });
    expect(updatedContract?.status).toBe('FUNDED');
    expect(updatedContract?.escrowBalance).toBe(500.0);

    const tx = await prisma.escrowTransaction.findFirst({
      where: { contractId: contract.id, type: 'DEPOSIT' },
    });
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(500.0);
    expect(tx?.status).toBe('COMPLETED');
  });

  it('should guarantee strict idempotency when the same webhook is re-delivered 3 times', async () => {
    const payload = {
      event: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: contract.id,
          order_amount: 500.0,
          order_currency: 'INR',
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(timestamp + rawBody)
      .digest('base64');

    // Delivery 1
    const res1 = await processor.processPaymentWebhook(rawBody, timestamp, signature);
    expect(res1.status).toBe(200);
    expect(res1.body.action).toBe('CONTRACT_FUNDED');

    // Delivery 2
    const res2 = await processor.processPaymentWebhook(rawBody, timestamp, signature);
    expect(res2.status).toBe(200);
    expect(res2.body.action).toBe('ALREADY_PROCESSED_IDEMPOTENT');

    // Delivery 3
    const res3 = await processor.processPaymentWebhook(rawBody, timestamp, signature);
    expect(res3.status).toBe(200);
    expect(res3.body.action).toBe('ALREADY_PROCESSED_IDEMPOTENT');

    const txCount = await prisma.escrowTransaction.count({
      where: { contractId: contract.id, type: 'DEPOSIT' },
    });
    expect(txCount).toBe(1);

    const finalContract = await prisma.contract.findUnique({ where: { id: contract.id } });
    expect(finalContract?.escrowBalance).toBe(500.0);
  });

  it('should reject webhook if amount is inconsistent with contract requirements', async () => {
    const payload = {
      event: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: contract.id,
          order_amount: 100.0,
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(timestamp + rawBody).digest('base64');

    const res = await processor.processPaymentWebhook(rawBody, timestamp, signature);
    expect(res.status).toBe(422);

    const intactContract = await prisma.contract.findUnique({ where: { id: contract.id } });
    expect(intactContract?.status).toBe('AWAITING_DEPOSIT');
    expect(intactContract?.escrowBalance).toBe(0.0);
  });
});
