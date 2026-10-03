import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import crypto from 'node:crypto';
import { SettlementService } from '@/core/engine-03-dbms/payments/settlement-service';
import { CashfreeGateway } from '@/core/engine-03-dbms/payments/cashfree-gateway';
import { ValidationError, AuthorizationError, InvalidStateTransitionError } from '@/lib/errors';

describe('Engine 03 (DBMS) & Engine 01 (OS) — Provider-Supported Settlement Service', () => {
  let settlementService: SettlementService;
  let testClient: any;
  let testFreelancer: any;
  let testContract: any;
  let testMilestone: any;

  beforeEach(async () => {
    settlementService = new SettlementService();
    try {
      await prisma.$executeRawUnsafe('DELETE FROM user_payout_methods');
      await prisma.$executeRawUnsafe('DELETE FROM settlement_transfers');
    } catch (e) {
      // ignore if tables not yet created
    }

    testClient = await prisma.user.create({
      data: {
        email: `settle-client-${Date.now()}-${Math.random()}@test.local`,
        passwordHash: 'hashed',
        name: 'Settle Client',
        role: 'CLIENT',
        balance: 1000.0,
      },
    });

    testFreelancer = await prisma.user.create({
      data: {
        email: `settle-free-${Date.now()}-${Math.random()}@test.local`,
        passwordHash: 'hashed',
        name: 'Settle Freelancer',
        role: 'FREELANCER',
        balance: 0.0,
      },
    });

    const testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        title: 'Settlement Test Project',
        description: 'Testing Cashfree Provider Payout Settlement',
        budget: 200.0,
        skillTags: JSON.stringify(['typescript', 'cashfree']),
      },
    });

    testContract = await prisma.contract.create({
      data: {
        projectId: testProject.id,
        clientId: testClient.id,
        freelancerId: testFreelancer.id,
        totalAmount: 200.0,
        escrowBalance: 200.0, // Pre-funded escrow
        status: 'FUNDED',
      },
    });

    testMilestone = await prisma.milestone.create({
      data: {
        contractId: testContract.id,
        title: 'Phase 1 Deliverable',
        description: 'Initial API design',
        amount: 100.0, // ₹100.00 = 10,000 paise
        sequenceOrder: 1,
        status: 'APPROVED',
        dueDate: new Date(Date.now() + 86400000),
      },
    });
  });

  it('should reject settlement if freelancer does not have a verified Cashfree payout method', async () => {
    await expect(
      settlementService.initiateSettlement({
        contractId: testContract.id,
        milestoneId: testMilestone.id,
        clientId: testClient.id,
        actorRole: 'CLIENT',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should register and verify a freelancer Cashfree payout method', async () => {
    const payoutMethod = await settlementService.registerPayoutMethod({
      userId: testFreelancer.id,
      vendorId: 'CF_BENE_FREE_01',
      accountType: 'UPI',
      accountIdentifier: 'freelancer@upi',
      isVerified: true,
    });

    expect(payoutMethod.verificationStatus).toBe('VERIFIED');
    expect(payoutMethod.vendorId).toBe('CF_BENE_FREE_01');

    const fetched = await settlementService.getPayoutMethod(testFreelancer.id);
    expect(fetched?.vendorId).toBe('CF_BENE_FREE_01');
  });

  it('should execute full happy path settlement with platform fee deduction and escrow release', async () => {
    // 1. Register verified beneficiary
    await settlementService.registerPayoutMethod({
      userId: testFreelancer.id,
      vendorId: 'CF_BENE_HAPPY_01',
      accountType: 'BANK_ACCOUNT',
      accountIdentifier: '••••9876',
      ifsc: 'HDFC0000123',
      isVerified: true,
    });

    // 2. Client initiates settlement on APPROVED milestone
    const receipt = await settlementService.initiateSettlement({
      contractId: testContract.id,
      milestoneId: testMilestone.id,
      clientId: testClient.id,
      actorRole: 'CLIENT',
    });

    expect(receipt.success).toBe(true);
    expect(receipt.status).toBe('SUCCESS');
    expect(receipt.grossAmountPaise).toBe(10000); // ₹100.00
    expect(receipt.platformFeePaise).toBe(500); // 5% fee = ₹5.00
    expect(receipt.netDisbursedPaise).toBe(9500); // Net ₹95.00 to freelancer

    // 3. Verify DB state updates
    const updatedMilestone = await prisma.milestone.findUnique({
      where: { id: testMilestone.id },
    });
    expect(updatedMilestone?.status).toBe('RELEASED');

    const updatedContract = await prisma.contract.findUnique({
      where: { id: testContract.id },
    });
    // Escrow balance should be decremented by gross amount (100.0)
    expect(updatedContract?.escrowBalance).toBe(100.0);

    const updatedFreelancer = await prisma.user.findUnique({
      where: { id: testFreelancer.id },
    });
    // Freelancer received net payout (95.0)
    expect(updatedFreelancer?.balance).toBe(95.0);

    // 4. Verify EscrowTransaction record created
    const txRecord = await prisma.escrowTransaction.findFirst({
      where: {
        contractId: testContract.id,
        milestoneId: testMilestone.id,
        type: 'RELEASE',
      },
    });
    expect(txRecord).toBeDefined();
    expect(txRecord?.amount).toBe(100.0);
    expect(txRecord?.status).toBe('COMPLETED');
  });

  it('should protect escrow funds and alert admin if gateway transfer fails', async () => {
    // Register beneficiary that triggers simulated gateway failure
    await settlementService.registerPayoutMethod({
      userId: testFreelancer.id,
      vendorId: 'CF_BENE_FAIL_TRIGGER',
      accountType: 'BANK_ACCOUNT',
      accountIdentifier: '••••0000',
      isVerified: true,
    });

    const receipt = await settlementService.initiateSettlement({
      contractId: testContract.id,
      milestoneId: testMilestone.id,
      clientId: testClient.id,
      actorRole: 'CLIENT',
    });

    expect(receipt.success).toBe(false);
    expect(receipt.status).toBe('FAILED');

    // Escrow funds must remain 100% intact!
    const contract = await prisma.contract.findUnique({
      where: { id: testContract.id },
    });
    expect(contract?.escrowBalance).toBe(200.0);

    // Milestone reverts to APPROVED to permit remediation / retry
    const milestone = await prisma.milestone.findUnique({
      where: { id: testMilestone.id },
    });
    expect(milestone?.status).toBe('APPROVED');

    // Admin alert logged
    const alerts = await settlementService.getAdminAlerts();
    expect(alerts.some((a) => a.level === 'WARNING')).toBe(true);
  });

  it('should enqueue transfer and raise CRITICAL alert if Cashfree Payout float is insufficient', async () => {
    // Register beneficiary that triggers simulated insufficient float
    await settlementService.registerPayoutMethod({
      userId: testFreelancer.id,
      vendorId: 'CF_BENE_LOW_BALANCE_TRIGGER',
      accountType: 'UPI',
      accountIdentifier: 'lowbalance@upi',
      isVerified: true,
    });

    const receipt = await settlementService.initiateSettlement({
      contractId: testContract.id,
      milestoneId: testMilestone.id,
      clientId: testClient.id,
      actorRole: 'CLIENT',
    });

    expect(receipt.success).toBe(false);
    expect(receipt.status).toBe('QUEUED_INSUFFICIENT_FUNDS');

    // Escrow balance remains locked and safe
    const contract = await prisma.contract.findUnique({
      where: { id: testContract.id },
    });
    expect(contract?.escrowBalance).toBe(200.0);

    // Milestone stays in SETTLING
    const milestone = await prisma.milestone.findUnique({
      where: { id: testMilestone.id },
    });
    expect(milestone?.status).toBe('SETTLING');

    // Transfer status recorded as queued
    const transfer = await settlementService.getTransfer(receipt.settlementTransferId);
    expect(transfer?.status).toBe('QUEUED_INSUFFICIENT_FUNDS');

    // CRITICAL Admin alert emitted
    const alerts = await settlementService.getAdminAlerts();
    expect(alerts.some((a) => a.level === 'CRITICAL')).toBe(true);
  });

  it('should verify Cashfree webhook HMAC-SHA256 signature and prevent replay', () => {
    const gateway = new CashfreeGateway({
      webhookSecret: 'top_secret_key_32_characters_min',
    });

    const rawBody = JSON.stringify({ event: 'TRANSFER_SUCCESS', transferId: 'st_123' });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = timestamp + rawBody;
    const signature = crypto
      .createHmac('sha256', 'top_secret_key_32_characters_min')
      .update(payload)
      .digest('base64');

    // Valid signature within 300s window
    expect(gateway.verifyWebhookSignature(rawBody, timestamp, signature)).toBe(true);

    // Invalid signature
    expect(gateway.verifyWebhookSignature(rawBody, timestamp, 'invalid_sig')).toBe(false);

    // Replay attack: timestamp older than 300s
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
    const oldPayload = oldTimestamp + rawBody;
    const oldSignature = crypto
      .createHmac('sha256', 'top_secret_key_32_characters_min')
      .update(oldPayload)
      .digest('base64');

    expect(gateway.verifyWebhookSignature(rawBody, oldTimestamp, oldSignature)).toBe(false);
  });
});
