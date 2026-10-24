import crypto from 'node:crypto';
import QRCode from 'qrcode';
import prisma from '@/lib/db';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  InvalidStateTransitionError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface CreateUpiOrderInput {
  clientId: string;
  amountInr: number;
  contractId?: string;
  milestoneId?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface UpiOrderResponse {
  orderId: string;
  amountInr: number;
  amountPaise: number;
  currency: string;
  upiUri: string;
  qrDataUrl: string;
  payeeVpa: string;
  payeeName: string;
  expiresAt: string;
  status: string;
}

export interface UpiDecodedQr {
  payeeVpa: string;
  payeeName: string;
  amount: string;
  currency: string;
  transactionRef: string;
  transactionNote?: string;
}

export class DuplicateUtrError extends ValidationError {
  constructor(utr: string, existingId: string) {
    super(`Bank reference / UTR '${utr}' has already been credited (Record: ${existingId}). Replay / duplicate payment prevented.`);
    this.name = 'DuplicateUtrError';
  }
}

export class UpiPaymentService {
  public static readonly MIN_AMOUNT_INR = 10.0;
  public static readonly MAX_AMOUNT_INR = 100000.0; // ₹1,00,000 regulatory NPCI P2P ceiling
  public static readonly ORDER_TTL_MS = 10 * 60 * 1000; // 10 minutes

  public static getRecipientVpa(): string {
    const vpa = process.env.UPI_RECIPIENT_VPA || 'chavanpatilvaibhav395@okaxis';
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
      throw new ValidationError(`Configured UPI_RECIPIENT_VPA '${vpa}' is malformed.`);
    }
    return vpa;
  }

  public static getPayeeName(): string {
    return process.env.UPI_PAYEE_NAME || 'VAIBHAV';
  }

  public static getMerchantMobile(): string {
    return process.env.UPI_MERCHANT_MOBILE || '7349417848';
  }

  public static getWebhookSecret(): string {
    return process.env.UPI_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || 'development_upi_webhook_secret_key_32_chars';
  }

  /**
   * Validates deposit amount server-side.
   * Enforces finite positive number, precision limit, and bounds.
   */
  public static validateAmount(amount: number): { amountInr: number; amountPaise: number } {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      throw new ValidationError('Amount must be a valid finite number.');
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than zero.');
    }

    if (amount < this.MIN_AMOUNT_INR) {
      throw new ValidationError(`Minimum deposit amount is ₹${this.MIN_AMOUNT_INR.toFixed(2)}.`);
    }

    if (amount > this.MAX_AMOUNT_INR) {
      throw new ValidationError(`Amount exceeds regulatory maximum limit of ₹${this.MAX_AMOUNT_INR.toLocaleString('en-IN')}.`);
    }

    // Check for fractional sub-paise (more than 2 decimal places)
    const rounded = Math.round(amount * 100) / 100;
    if (Math.abs(amount - rounded) > 0.0001) {
      throw new ValidationError('Amount cannot have fractional sub-paise precision (maximum 2 decimal places).');
    }

    const amountPaise = Math.round(amount * 100);
    return { amountInr: rounded, amountPaise };
  }

  /**
   * Generates a unique UPI payment order, NPCI-standard URI, and genuine local QR code.
   */
  public static async createOrder(input: CreateUpiOrderInput): Promise<UpiOrderResponse> {
    const { amountInr, amountPaise } = this.validateAmount(input.amountInr);

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: { id: input.clientId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!client) {
      throw new NotFoundError('User', input.clientId);
    }

    const payeeVpa = this.getRecipientVpa();
    const payeeName = this.getPayeeName();
    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const orderId = `upi_ord_${Date.now()}_${uniqueSuffix}`;

    // Canonical NPCI UPI URI construction
    const params = new URLSearchParams();
    params.set('pa', payeeVpa);
    params.set('pn', payeeName);
    params.set('am', amountInr.toFixed(2));
    params.set('cu', 'INR');
    params.set('tr', orderId);
    params.set('tn', `GF Wallet TopUp ${orderId}`);

    const upiUri = `upi://pay?${params.toString()}`;

    // Generate genuine QR code data URL locally using 'qrcode'
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const expiresAt = new Date(Date.now() + this.ORDER_TTL_MS);

    // Persist Payment record in database
    await prisma.payment.create({
      data: {
        id: `pay_${Date.now()}_${uniqueSuffix}`,
        paymentType: input.contractId ? 'CONTRACT_ESCROW' : 'WALLET_TOPUP',
        contractId: input.contractId || null,
        milestoneId: input.milestoneId || null,
        clientId: client.id,
        amountPaise,
        currency: 'INR',
        provider: 'UPI',
        providerOrderId: orderId,
        upiOrderId: orderId,
        upiVpa: payeeVpa,
        upiUri,
        qrPayload: qrDataUrl,
        status: 'PENDING',
      },
    });

    return {
      orderId,
      amountInr,
      amountPaise,
      currency: 'INR',
      upiUri,
      qrDataUrl,
      payeeVpa,
      payeeName,
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
    };
  }

  /**
   * Decodes a UPI URI or QR string into its standard constituent parameters.
   */
  public static decodeUpiQr(qrString: string): UpiDecodedQr {
    if (!qrString.startsWith('upi://pay?')) {
      throw new ValidationError('MALFORMED_QR: QR payload is not a valid UPI URI.');
    }

    const queryString = qrString.substring('upi://pay?'.length);
    const searchParams = new URLSearchParams(queryString);

    const pa = searchParams.get('pa');
    const pn = searchParams.get('pn');
    const am = searchParams.get('am');
    const cu = searchParams.get('cu');
    const tr = searchParams.get('tr');
    const tn = searchParams.get('tn') || undefined;

    if (!pa || !pn || !am || !cu || !tr) {
      throw new ValidationError('MALFORMED_QR: Missing mandatory UPI query parameters (pa, pn, am, cu, tr).');
    }

    if (cu !== 'INR') {
      throw new ValidationError('MALFORMED_QR: Currency must be INR.');
    }

    return {
      payeeVpa: pa,
      payeeName: pn,
      amount: am,
      currency: cu,
      transactionRef: tr,
      transactionNote: tn,
    };
  }

  /**
   * Client claims payment by submitting bank UTR.
   * INVARIANT: Sets status to PENDING_REVIEW; DOES NOT credit spendable balance.
   */
  public static async submitClientUtr(params: {
    orderId: string;
    clientId: string;
    utr: string;
  }) {
    const sanitizedUtr = params.utr.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,22}$/.test(sanitizedUtr)) {
      throw new ValidationError('Invalid Bank UTR: Reference must be 8-22 alphanumeric characters.');
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { upiOrderId: params.orderId },
          { providerOrderId: params.orderId },
          { id: params.orderId },
        ],
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment', params.orderId);
    }

    if (payment.clientId !== params.clientId) {
      throw new AuthorizationError('You can only submit payment claims for your own orders.');
    }

    if (payment.status === 'SUCCESS') {
      return { status: 'SUCCESS', message: 'Payment is already confirmed and credited.' };
    }

    if (payment.status !== 'PENDING' && payment.status !== 'PENDING_REVIEW') {
      throw new InvalidStateTransitionError(
        payment.status,
        'SUBMIT_UTR',
        `Cannot submit UTR for payment in status '${payment.status}'.`
      );
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING_REVIEW',
        upiUtr: sanitizedUtr,
        providerPaymentId: sanitizedUtr,
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: 'CLIENT_SUBMITTED_UTR',
        providerEventId: sanitizedUtr,
        rawPayload: JSON.stringify({ utr: sanitizedUtr, submittedAt: new Date().toISOString() }),
        status: 'PENDING_REVIEW',
      },
    });

    await globalAuditLogger.logAction({
      actorId: params.clientId,
      entityName: 'Payment',
      entityId: payment.id,
      action: 'CLIENT_DEPOSIT_CLAIM_SUBMITTED',
      previousState: payment.status,
      newState: 'PENDING_REVIEW',
    });

    return {
      status: 'PENDING_REVIEW',
      orderId: payment.upiOrderId || payment.providerOrderId || payment.id,
      utr: sanitizedUtr,
      message: 'Bank UTR submitted. Awaiting administrative confirmation of incoming credit.',
    };
  }

  /**
   * Admin approves incoming bank deposit and atomically credits client wallet.
   * Enforces:
   * 1. ADMIN role authorization.
   * 2. Single-use UTR consumption across all successful payments & ledger records.
   * 3. Atomic increment of user.balance and user.balancePaise.
   * 4. Double-entry EscrowTransaction creation.
   * 5. Cryptographic AuditLog record.
   */
  public static async approveDepositVerification(params: {
    orderId: string;
    adminId: string;
    adminRole: string;
    bankUtr: string;
    adminNotes?: string;
  }) {
    if (params.adminRole !== 'ADMIN') {
      throw new AuthorizationError('Only authorized administrators can verify and approve deposits.');
    }

    const sanitizedUtr = params.bankUtr.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,22}$/.test(sanitizedUtr)) {
      throw new ValidationError('Invalid Bank UTR format. Expected 8-22 alphanumeric characters.');
    }

    const lockKey = `payment_verify_${params.orderId}`;
    const releaseLock = await globalKeyedMutex.acquire(lockKey);

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Fetch payment record
        const payment = await tx.payment.findFirst({
          where: {
            OR: [
              { upiOrderId: params.orderId },
              { providerOrderId: params.orderId },
              { id: params.orderId },
            ],
          },
          include: { client: true },
        });

        if (!payment) {
          throw new NotFoundError('Payment', params.orderId);
        }

        if (payment.status === 'SUCCESS') {
          return {
            idempotent: true,
            success: true,
            orderId: payment.upiOrderId || payment.id,
            message: 'Payment has already been credited.',
            newBalanceInr: payment.client.balance,
          };
        }

        if (payment.status !== 'PENDING' && payment.status !== 'PENDING_REVIEW') {
          throw new InvalidStateTransitionError(
            payment.status,
            'APPROVE_DEPOSIT',
            `Cannot approve payment in status '${payment.status}'.`
          );
        }

        // 2. Strict UTR uniqueness: ensure this bank UTR was not used by any other completed payment
        const existingSuccessPayment = await tx.payment.findFirst({
          where: {
            upiUtr: sanitizedUtr,
            id: { not: payment.id },
            status: 'SUCCESS',
          },
        });

        if (existingSuccessPayment) {
          throw new DuplicateUtrError(sanitizedUtr, existingSuccessPayment.id);
        }

        const existingLedgerWithUtr = await tx.escrowTransaction.findFirst({
          where: { providerPaymentId: sanitizedUtr },
        });

        if (existingLedgerWithUtr) {
          throw new DuplicateUtrError(sanitizedUtr, existingLedgerWithUtr.id);
        }

        const creditRupees = payment.amountPaise / 100;
        const now = new Date();

        // 3. Atomic wallet balance increment (Dual-Sync Invariant: balance + balancePaise)
        const updatedUser = await tx.user.update({
          where: { id: payment.clientId },
          data: {
            balance: { increment: creditRupees },
            balancePaise: { increment: payment.amountPaise },
          },
        });

        // 4. Update Payment to SUCCESS
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            upiUtr: sanitizedUtr,
            providerPaymentId: sanitizedUtr,
            verifiedByAdminId: params.adminId,
            adminNotes: params.adminNotes || 'Confirmed incoming bank credit.',
            settledAt: now,
          },
        });

        // 5. Create immutable EscrowTransaction ledger entry
        const ledgerTx = await tx.escrowTransaction.create({
          data: {
            contractId: payment.contractId || null,
            milestoneId: payment.milestoneId || null,
            fromUserId: null, // External bank deposit
            toUserId: payment.clientId,
            amount: creditRupees,
            amountPaise: payment.amountPaise,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            providerPaymentId: sanitizedUtr,
          },
        });

        // 6. Chained AuditLog record
        await globalAuditLogger.logAction(
          {
            actorId: params.adminId,
            entityName: 'Payment',
            entityId: payment.id,
            action: 'ADMIN_DEPOSIT_APPROVED',
            previousState: payment.status,
            newState: 'SUCCESS',
          },
          tx
        );

        logger.info('Deposit approved and wallet credited', {
          orderId: payment.upiOrderId,
          clientId: payment.clientId,
          amountPaise: payment.amountPaise,
          utr: sanitizedUtr,
        });

        return {
          idempotent: false,
          success: true,
          orderId: payment.upiOrderId || payment.id,
          amountInr: creditRupees,
          amountPaise: payment.amountPaise,
          newBalanceInr: updatedUser.balance,
          newBalancePaise: updatedUser.balancePaise,
          ledgerTransactionId: ledgerTx.id,
          settledAt: now.toISOString(),
        };
      }, { maxWait: 15000, timeout: 60000 });
    } finally {
      releaseLock();
    }
  }

  /**
   * Admin rejects a fraudulent or non-matching deposit claim.
   */
  public static async rejectDepositVerification(params: {
    orderId: string;
    adminId: string;
    adminRole: string;
    reason: string;
  }) {
    if (params.adminRole !== 'ADMIN') {
      throw new AuthorizationError('Only authorized administrators can reject deposits.');
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { upiOrderId: params.orderId },
          { providerOrderId: params.orderId },
          { id: params.orderId },
        ],
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment', params.orderId);
    }

    if (payment.status === 'SUCCESS') {
      throw new InvalidStateTransitionError(
        payment.status,
        'REJECT_DEPOSIT',
        'Cannot reject a payment that has already been verified and credited.'
      );
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        adminNotes: params.reason,
      },
    });

    await globalAuditLogger.logAction({
      actorId: params.adminId,
      entityName: 'Payment',
      entityId: payment.id,
      action: 'ADMIN_DEPOSIT_REJECTED',
      previousState: payment.status,
      newState: 'FAILED',
    });

    return {
      success: true,
      orderId: payment.upiOrderId || payment.id,
      status: 'FAILED',
      reason: params.reason,
    };
  }

  /**
   * Admin records genuine manual transfer for an approved milestone settlement.
   * Atomically debits contract escrow balance and marks milestone RELEASED.
   */
  public static async recordManualSettlement(params: {
    settlementId: string;
    adminId: string;
    adminRole: string;
    bankTransferReference: string;
    payoutRail?: string;
    adminNotes?: string;
  }) {
    if (params.adminRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can confirm manual settlements.');
    }

    const sanitizedRef = params.bankTransferReference.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,22}$/.test(sanitizedRef)) {
      throw new ValidationError('Invalid Bank Transfer Reference. Expected 8-22 alphanumeric characters.');
    }

    const lockKey = `settle_${params.settlementId}`;
    const releaseLock = await globalKeyedMutex.acquire(lockKey);

    try {
      return await prisma.$transaction(async (tx) => {
        const settlement = await tx.settlementTransfer.findUnique({
          where: { id: params.settlementId },
          include: {
            contract: true,
            milestone: true,
            freelancer: {
              include: { vendorPayoutProfile: true },
            },
          },
        });

        if (!settlement) {
          throw new NotFoundError('SettlementTransfer', params.settlementId);
        }

        if (settlement.status === 'SUCCESS') {
          return {
            idempotent: true,
            success: true,
            settlementId: settlement.id,
            message: 'Settlement has already been processed and finalized.',
          };
        }

        // Milestone dispute guard: NEVER settle disputed milestones
        if (settlement.milestone.status === 'DISPUTED') {
          throw new InvalidStateTransitionError(
            settlement.milestone.status,
            'MANUAL_SETTLEMENT',
            'Cannot settle milestone under active dispute.'
          );
        }

        // Check transfer reference uniqueness
        const duplicateTransfer = await tx.settlementTransfer.findFirst({
          where: {
            gatewayTransferId: sanitizedRef,
            id: { not: settlement.id },
            status: 'SUCCESS',
          },
        });

        if (duplicateTransfer) {
          throw new DuplicateUtrError(sanitizedRef, duplicateTransfer.id);
        }

        // Check freelancer payout profile
        const payoutProfile = settlement.freelancer.vendorPayoutProfile;
        if (!payoutProfile || (!payoutProfile.vpa && !payoutProfile.accountNumberMasked)) {
          throw new ValidationError(
            `Freelancer (${settlement.freelancer.name}) does not have an active UPI VPA or Bank Account linked.`
          );
        }

        const grossPaise = settlement.grossAmountPaise;
        const grossFloat = grossPaise / 100;

        if (settlement.contract.escrowBalancePaise < grossPaise) {
          throw new ValidationError(
            `Insufficient escrow balance (Available: ₹${(settlement.contract.escrowBalancePaise / 100).toFixed(2)}, Required: ₹${grossFloat.toFixed(2)}).`
          );
        }

        const now = new Date();

        // 1. Debit contract escrow vault
        const updatedContract = await tx.contract.update({
          where: { id: settlement.contractId },
          data: {
            escrowBalancePaise: { decrement: grossPaise },
            escrowBalance: { decrement: grossFloat },
          },
        });

        // 2. Transition milestone to RELEASED
        await tx.milestone.update({
          where: { id: settlement.milestoneId },
          data: { status: 'RELEASED' },
        });

        // 3. Check if all contract milestones resolved
        const remainingMilestones = await tx.milestone.count({
          where: {
            contractId: settlement.contractId,
            status: { notIn: ['RELEASED', 'REFUNDED'] },
          },
        });

        if (remainingMilestones === 0) {
          await tx.contract.update({
            where: { id: settlement.contractId },
            data: { status: 'RELEASED' },
          });
        }

        // 4. Update SettlementTransfer to SUCCESS
        const updatedSettlement = await tx.settlementTransfer.update({
          where: { id: settlement.id },
          data: {
            status: 'SUCCESS',
            gatewayTransferId: sanitizedRef,
            payoutMode: params.payoutRail || 'MANUAL_UPI',
            processedByAdminId: params.adminId,
            adminNotes: params.adminNotes || 'Confirmed manual bank disbursement.',
            settledAt: now,
          },
        });

        // 5. Append EscrowTransaction record
        await tx.escrowTransaction.create({
          data: {
            contractId: settlement.contractId,
            milestoneId: settlement.milestoneId,
            fromUserId: null, // Escrow vault
            toUserId: settlement.freelancerId,
            amount: grossFloat,
            amountPaise: grossPaise,
            type: 'RELEASE',
            status: 'COMPLETED',
            providerPaymentId: sanitizedRef,
          },
        });

        // 6. Chained AuditLog
        await globalAuditLogger.logAction(
          {
            actorId: params.adminId,
            entityName: 'SettlementTransfer',
            entityId: settlement.id,
            action: 'MANUAL_PAYOUT_SETTLED',
            previousState: settlement.status,
            newState: 'SUCCESS',
          },
          tx
        );

        return {
          idempotent: false,
          success: true,
          settlementId: updatedSettlement.id,
          contractId: settlement.contractId,
          milestoneId: settlement.milestoneId,
          grossAmountInr: grossFloat,
          netDisbursedInr: settlement.netDisbursedPaise / 100,
          transferReference: sanitizedRef,
          settledAt: now.toISOString(),
        };
      }, { maxWait: 15000, timeout: 60000 });
    } finally {
      releaseLock();
    }
  }

  /**
   * Cryptographic HMAC-SHA256 signature verifier with timing-safe comparison and replay protection.
   */
  public static verifyWebhookSignature(
    rawBody: string,
    timestamp: string,
    signature: string,
    secret: string,
    allowedDriftSec = 300
  ): boolean {
    if (!rawBody || !timestamp || !signature || !secret) {
      return false;
    }

    const tsNum = parseInt(timestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(tsNum) || Math.abs(nowSec - tsNum) > allowedDriftSec) {
      return false;
    }

    const payload = `${timestamp}.${rawBody}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }
}
