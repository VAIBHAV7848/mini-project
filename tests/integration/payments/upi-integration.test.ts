import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/db';
import { UpiPaymentService, DuplicateUtrError } from '@/core/engine-03-dbms/payments/upi-payment-service';
import {
  AuthorizationError,
  ValidationError,
  NotFoundError,
  InvalidStateTransitionError,
} from '@/lib/errors';

describe('Engine 02 (DSA/QA) & Engine 03 (DBMS) — UPI Integration Suite', { timeout: 60000 }, () => {
  let adminUser: any;
  let clientUser: any;
  let attackerUser: any;
  let freelancerUser: any;
  let contract: any;
  let milestone: any;

  beforeAll(async () => {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 6);

    adminUser = await prisma.user.create({
      data: {
        email: `upi_admin_${ts}_${rand}@gigaflow.local`,
        name: 'System Admin',
        passwordHash: 'hash',
        role: 'ADMIN',
        balance: 0,
        balancePaise: 0,
      },
    });

    clientUser = await prisma.user.create({
      data: {
        email: `upi_client_${ts}_${rand}@gigaflow.local`,
        name: 'Escrow Client',
        passwordHash: 'hash',
        role: 'CLIENT',
        balance: 0,
        balancePaise: 0,
      },
    });

    attackerUser = await prisma.user.create({
      data: {
        email: `upi_attacker_${ts}_${rand}@gigaflow.local`,
        name: 'Attacker User',
        passwordHash: 'hash',
        role: 'CLIENT',
        balance: 0,
        balancePaise: 0,
      },
    });

    freelancerUser = await prisma.user.create({
      data: {
        email: `upi_dev_${ts}_${rand}@gigaflow.local`,
        name: 'Lead Developer',
        passwordHash: 'hash',
        role: 'FREELANCER',
        balance: 0,
        balancePaise: 0,
        vendorPayoutProfile: {
          create: {
            vpa: 'freelancer@okhdfcbank',
            status: 'VERIFIED',
          },
        },
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: clientUser.id,
        title: 'UPI Integration Verification Project',
        description: 'End to end payment flow testing',
        budget: 1000,
        budgetPaise: 100000,
        skillTags: '["typescript", "upi"]',
        status: 'OPEN',
      },
    });

    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        clientId: clientUser.id,
        freelancerId: freelancerUser.id,
        totalAmount: 1000,
        totalAmountPaise: 100000,
        escrowBalance: 1000,
        escrowBalancePaise: 100000,
        status: 'FUNDED',
      },
    });

    milestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: 'Milestone 1 — Alpha Release',
        description: 'First deliverable package',
        amount: 1000,
        amountPaise: 100000,
        sequenceOrder: 1,
        status: 'APPROVED',
        dueDate: new Date(Date.now() + 86400000),
      },
    });
  }, 60000);

  describe('1. UPI Order Creation & Local QR Generation', () => {
    it('should create order in DB with genuine QR data URL and PENDING status', async () => {
      const order = await UpiPaymentService.createOrder({
        clientId: clientUser.id,
        amountInr: 50.0,
      });

      expect(order.orderId).toContain('upi_ord_');
      expect(order.amountInr).toBe(50.0);
      expect(order.amountPaise).toBe(5000);
      expect(order.status).toBe('PENDING');
      expect(order.upiUri).toContain('upi://pay?');
      expect(order.upiUri).toContain('am=50.00');
      expect(order.qrDataUrl).toMatch(/^data:image\/png;base64,/);

      // Verify DB record
      const dbPayment = await prisma.payment.findUnique({
        where: { upiOrderId: order.orderId },
      });
      expect(dbPayment).toBeDefined();
      expect(dbPayment?.status).toBe('PENDING');
      expect(dbPayment?.amountPaise).toBe(5000);
      expect(dbPayment?.paymentType).toBe('WALLET_TOPUP');
      expect(dbPayment?.contractId).toBeNull();
    });
  });

  describe('2. Client UTR Submission (Anti-Fraud: Detection Signal Only)', () => {
    it('should transition payment to PENDING_REVIEW and NEVER credit wallet balance', async () => {
      const order = await UpiPaymentService.createOrder({
        clientId: clientUser.id,
        amountInr: 100.0,
      });

      const utr = '42981' + Date.now().toString().slice(-7);
      const claimResult = await UpiPaymentService.submitClientUtr({
        orderId: order.orderId,
        clientId: clientUser.id,
        utr,
      });

      expect(claimResult.status).toBe('PENDING_REVIEW');
      expect(claimResult.utr).toBe(utr);

      // Verify client balance remains zero!
      const userAfterClaim = await prisma.user.findUnique({ where: { id: clientUser.id } });
      expect(userAfterClaim?.balance).toBe(0.0);
      expect(userAfterClaim?.balancePaise).toBe(0);

      // Verify no EscrowTransaction was created
      const txCount = await prisma.escrowTransaction.count({
        where: { toUserId: clientUser.id },
      });
      expect(txCount).toBe(0);
    });

    it('should reject IDOR: attacker attempting to claim another clients payment order', async () => {
      const order = await UpiPaymentService.createOrder({
        clientId: clientUser.id,
        amountInr: 500.0,
      });

      await expect(
        UpiPaymentService.submitClientUtr({
          orderId: order.orderId,
          clientId: attackerUser.id,
          utr: '429810543219',
        })
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('3. Administrative Verification & Atomic Wallet Credit', () => {
    it('should allow ADMIN to approve payment, atomically crediting balance and logging audit', async () => {
      const order = await UpiPaymentService.createOrder({
        clientId: clientUser.id,
        amountInr: 250.0,
      });

      const utr = 'UTR' + Date.now().toString().slice(-9);

      // Client submits UTR
      await UpiPaymentService.submitClientUtr({
        orderId: order.orderId,
        clientId: clientUser.id,
        utr,
      });

      // Admin approves incoming deposit
      const result = await UpiPaymentService.approveDepositVerification({
        orderId: order.orderId,
        adminId: adminUser.id,
        adminRole: 'ADMIN',
        bankUtr: utr,
      });

      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(false);
      expect(result.amountInr).toBe(250.0);
      expect(result.amountPaise).toBe(25000);
      expect(result.newBalanceInr).toBe(250.0);
      expect(result.newBalancePaise).toBe(25000);

      // Verify database mutations
      const updatedUser = await prisma.user.findUnique({ where: { id: clientUser.id } });
      expect(updatedUser?.balance).toBe(250.0);
      expect(updatedUser?.balancePaise).toBe(25000);

      const dbPayment = await prisma.payment.findUnique({ where: { upiOrderId: order.orderId } });
      expect(dbPayment?.status).toBe('SUCCESS');
      expect(dbPayment?.upiUtr).toBe(utr);
      expect(dbPayment?.verifiedByAdminId).toBe(adminUser.id);

      const ledgerTx = await prisma.escrowTransaction.findFirst({
        where: { toUserId: clientUser.id, type: 'DEPOSIT' },
      });
      expect(ledgerTx).toBeDefined();
      expect(ledgerTx?.amount).toBe(250.0);
      expect(ledgerTx?.amountPaise).toBe(25000);
    });

    it('should reject non-admin roles (CLIENT, FREELANCER) from approving deposits', async () => {
      const order = await UpiPaymentService.createOrder({
        clientId: clientUser.id,
        amountInr: 100.0,
      });

      await expect(
        UpiPaymentService.approveDepositVerification({
          orderId: order.orderId,
          adminId: clientUser.id,
          adminRole: 'CLIENT',
          bankUtr: '123456789012',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should reject reuse of an already consumed UTR across different orders', async () => {
      const sharedUtr = 'DUPUTR' + Date.now().toString().slice(-6);

      const order1 = await UpiPaymentService.createOrder({
        clientId: clientUser.id,
        amountInr: 50.0,
      });

      await UpiPaymentService.approveDepositVerification({
        orderId: order1.orderId,
        adminId: adminUser.id,
        adminRole: 'ADMIN',
        bankUtr: sharedUtr,
      });

      // Attacker creates second order with identical UTR
      const order2 = await UpiPaymentService.createOrder({
        clientId: attackerUser.id,
        amountInr: 50.0,
      });

      await expect(
        UpiPaymentService.approveDepositVerification({
          orderId: order2.orderId,
          adminId: adminUser.id,
          adminRole: 'ADMIN',
          bankUtr: sharedUtr,
        })
      ).rejects.toThrow(DuplicateUtrError);

      // Verify attacker balance is strictly 0
      const attacker = await prisma.user.findUnique({ where: { id: attackerUser.id } });
      expect(attacker?.balance).toBe(0.0);
      expect(attacker?.balancePaise).toBe(0);
    });
  });

  describe('4. Administrative Manual Freelancer Settlement', () => {
    it('should allow ADMIN to record genuine transfer reference and disburse milestone', async () => {
      // Create pending SettlementTransfer
      const settlement = await prisma.settlementTransfer.create({
        data: {
          id: `set_test_${Date.now()}`,
          contractId: contract.id,
          milestoneId: milestone.id,
          freelancerId: freelancerUser.id,
          beneficiaryId: `BEN_${freelancerUser.id}`,
          idempotencyKey: `SETTLE_${milestone.id}`,
          grossAmountPaise: 100000,
          platformFeePaise: 5000,
          netDisbursedPaise: 95000,
          payoutMode: 'MANUAL_UPI',
          status: 'PENDING',
        },
      });

      const transferRef = 'BANKIMPS' + Date.now().toString().slice(-8);

      const result = await UpiPaymentService.recordManualSettlement({
        settlementId: settlement.id,
        adminId: adminUser.id,
        adminRole: 'ADMIN',
        bankTransferReference: transferRef,
        payoutRail: 'MANUAL_UPI',
      });

      expect(result.success).toBe(true);
      expect(result.transferReference).toBe(transferRef);
      expect(result.grossAmountInr).toBe(1000.0);
      expect(result.netDisbursedInr).toBe(950.0);

      // Verify database state: milestone RELEASED, escrow debited
      const updatedMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
      expect(updatedMilestone?.status).toBe('RELEASED');

      const updatedContract = await prisma.contract.findUnique({ where: { id: contract.id } });
      expect(updatedContract?.escrowBalance).toBe(0.0);
      expect(updatedContract?.escrowBalancePaise).toBe(0);

      const updatedSettlement = await prisma.settlementTransfer.findUnique({ where: { id: settlement.id } });
      expect(updatedSettlement?.status).toBe('SUCCESS');
      expect(updatedSettlement?.gatewayTransferId).toBe(transferRef);
    });

    it('should block settlement if milestone is under active dispute', async () => {
      // Mark milestone as DISPUTED
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'DISPUTED' },
      });

      const settlement = await prisma.settlementTransfer.create({
        data: {
          id: `set_dispute_${Date.now()}`,
          contractId: contract.id,
          milestoneId: milestone.id,
          freelancerId: freelancerUser.id,
          beneficiaryId: `BEN_${freelancerUser.id}`,
          idempotencyKey: `SETTLE_DISP_${milestone.id}`,
          grossAmountPaise: 100000,
          platformFeePaise: 5000,
          netDisbursedPaise: 95000,
          status: 'PENDING',
        },
      });

      await expect(
        UpiPaymentService.recordManualSettlement({
          settlementId: settlement.id,
          adminId: adminUser.id,
          adminRole: 'ADMIN',
          bankTransferReference: 'REF123456789',
        })
      ).rejects.toThrow(InvalidStateTransitionError);
    });
  });
});
