import prisma from '@/lib/db';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { globalAuditLogger, AuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { CashfreeGateway, globalCashfreeGateway } from './cashfree-gateway';
import {
  UserPayoutMethod,
  SettlementTransferRecord,
  SettlementTransferStatus,
  CashfreeWebhookPayload,
  InitiateSettlementInput,
  SettlementReceipt,
} from './types';
import {
  NotFoundError,
  InsufficientFundsError,
  InvalidStateTransitionError,
  ValidationError,
  AuthorizationError,
} from '@/lib/errors';

export class SettlementService {
  private gateway: CashfreeGateway;
  private auditLogger: AuditLogger;
  private static initialized: boolean = false;

  constructor(
    gateway: CashfreeGateway = globalCashfreeGateway,
    auditLogger: AuditLogger = globalAuditLogger
  ) {
    this.gateway = gateway;
    this.auditLogger = auditLogger;
    this.ensureTablesExist();
  }

  /**
   * Initializes persistent SQLite tables for payout methods, settlement transfers, and alerts.
   */
  private async ensureTablesExist(): Promise<void> {
    if (SettlementService.initialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS user_payout_methods (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          vendor_id TEXT UNIQUE NOT NULL,
          account_type TEXT NOT NULL,
          account_identifier TEXT NOT NULL,
          ifsc TEXT,
          bank_name TEXT,
          verification_status TEXT NOT NULL DEFAULT 'PENDING',
          verified_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS settlement_transfers (
          id TEXT PRIMARY KEY,
          contract_id TEXT NOT NULL,
          milestone_id TEXT NOT NULL,
          freelancer_id TEXT NOT NULL,
          beneficiary_id TEXT NOT NULL,
          gateway_transfer_id TEXT UNIQUE,
          idempotency_key TEXT UNIQUE NOT NULL,
          gross_amount_paise INTEGER NOT NULL,
          platform_fee_paise INTEGER NOT NULL,
          net_disbursed_paise INTEGER NOT NULL,
          currency TEXT DEFAULT 'INR',
          status TEXT NOT NULL DEFAULT 'PENDING',
          failure_code TEXT,
          failure_reason TEXT,
          retry_count INTEGER DEFAULT 0,
          next_retry_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          settled_at DATETIME
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS settlement_admin_alerts (
          id TEXT PRIMARY KEY,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      SettlementService.initialized = true;
    } catch (err) {
      console.error('Failed to initialize settlement SQLite tables:', err);
    }
  }

  // =========================================================================
  // 1. FREELANCER PAYOUT METHOD MANAGEMENT
  // =========================================================================

  /**
   * Registers or updates a verified Cashfree beneficiary/vendor payout method for a freelancer.
   */
  async registerPayoutMethod(input: {
    userId: string;
    vendorId: string;
    accountType: 'BANK_ACCOUNT' | 'UPI';
    accountIdentifier: string;
    ifsc?: string;
    bankName?: string;
    isVerified?: boolean;
  }): Promise<UserPayoutMethod> {
    await this.ensureTablesExist();

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new NotFoundError('User', input.userId);
    }

    if (user.role !== 'FREELANCER' && user.role !== 'ADMIN') {
      throw new ValidationError('Payout methods can only be configured for freelancer accounts.');
    }

    const verificationStatus = input.isVerified !== false ? 'VERIFIED' : 'PENDING';
    const verifiedAt = input.isVerified !== false ? new Date().toISOString() : null;
    const id = `payout_m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // Persist to SQLite table using UPSERT
    await prisma.$executeRawUnsafe(
      `INSERT INTO user_payout_methods 
       (id, user_id, vendor_id, account_type, account_identifier, ifsc, bank_name, verification_status, verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
       vendor_id=excluded.vendor_id,
       account_type=excluded.account_type,
       account_identifier=excluded.account_identifier,
       ifsc=excluded.ifsc,
       bank_name=excluded.bank_name,
       verification_status=excluded.verification_status,
       verified_at=excluded.verified_at,
       updated_at=excluded.updated_at`,
      id,
      input.userId,
      input.vendorId,
      input.accountType,
      input.accountIdentifier,
      input.ifsc ?? null,
      input.bankName ?? null,
      verificationStatus,
      verifiedAt,
      nowIso,
      nowIso
    );

    const record: UserPayoutMethod = {
      id,
      userId: input.userId,
      vendorId: input.vendorId,
      accountType: input.accountType,
      accountIdentifier: input.accountIdentifier,
      ifsc: input.ifsc ?? null,
      bankName: input.bankName ?? null,
      verificationStatus,
      verifiedAt: verifiedAt ? new Date(verifiedAt) : null,
      createdAt: new Date(nowIso),
      updatedAt: new Date(nowIso),
    };

    await this.auditLogger.logAction({
      actorId: input.userId,
      entityName: 'UserPayoutMethod',
      entityId: record.id,
      action: 'REGISTER_PAYOUT_METHOD',
      previousState: null,
      newState: record.verificationStatus,
    });

    return record;
  }

  /**
   * Retrieves verified payout method for a given user from SQLite database.
   */
  async getPayoutMethod(userId: string): Promise<UserPayoutMethod | null> {
    await this.ensureTablesExist();

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM user_payout_methods WHERE user_id = ? LIMIT 1`,
      userId
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      vendorId: row.vendor_id,
      accountType: row.account_type,
      accountIdentifier: row.account_identifier,
      ifsc: row.ifsc,
      bankName: row.bank_name,
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // =========================================================================
  // 2. MILESTONE SETTLEMENT INITIATION
  // =========================================================================

  /**
   * Initiates provider-supported milestone release and payout transfer:
   * 1. Validates client authorization and milestone state (APPROVED / UNDER_REVIEW / REVIEW_TIMEOUT).
   * 2. Verifies freelancer's linked Cashfree Beneficiary / Vendor profile.
   * 3. Calculates 64-bit integer paise amounts and platform fee.
   * 4. Transitions milestone to SETTLING and logs PENDING SettlementTransfer in DB.
   * 5. Dispatches transfer via CashfreeGateway.createTransfer().
   * 6. Finalizes upon instant success, sets IN_FLIGHT, or queues upon insufficient float.
   */
  async initiateSettlement(input: InitiateSettlementInput): Promise<SettlementReceipt> {
    await this.ensureTablesExist();

    const lockKey = `settle:${input.milestoneId}`;
    const releaseLock = await globalKeyedMutex.acquire(lockKey);

    try {
      // 1. Fetch contract and milestone
      const contract = await prisma.contract.findUnique({
        where: { id: input.contractId },
        include: { freelancer: true },
      });

      if (!contract) {
        throw new NotFoundError('Contract', input.contractId);
      }

      if (input.actorRole === 'CLIENT' && contract.clientId !== input.clientId) {
        throw new AuthorizationError('Only the contracted client can authorize milestone settlement.');
      }

      const milestone = await prisma.milestone.findUnique({
        where: { id: input.milestoneId },
      });

      if (!milestone) {
        throw new NotFoundError('Milestone', input.milestoneId);
      }

      // Allowed pre-settlement states per spec
      const allowedStates = ['APPROVED', 'UNDER_REVIEW', 'SUBMITTED', 'REVIEW_TIMEOUT'];
      if (!allowedStates.includes(milestone.status)) {
        throw new InvalidStateTransitionError(
          milestone.status,
          'RELEASE_ESCROW',
          `Cannot settle milestone with status '${milestone.status}'. Must be in [${allowedStates.join(', ')}].`
        );
      }

      // Check escrow balance
      if (contract.escrowBalance < milestone.amount) {
        throw new InsufficientFundsError(contract.escrowBalance, milestone.amount);
      }

      // 2. Verify freelancer payout method
      const payoutMethod = await this.getPayoutMethod(contract.freelancerId);
      if (!payoutMethod || payoutMethod.verificationStatus !== 'VERIFIED') {
        throw new ValidationError(
          `Freelancer (${contract.freelancer.name}) does not have a verified Cashfree payout beneficiary linked to their profile.`
        );
      }

      // 3. Mathematical precision: calculate integer paise & 5% platform fee
      const grossAmountPaise = Math.round(milestone.amount * 100);
      const platformFeePaise = Math.round(grossAmountPaise * 0.05); // 5% fee
      const netDisbursedPaise = grossAmountPaise - platformFeePaise;

      const transferId = `st_${contract.id.substring(0, 8)}_${milestone.id.substring(0, 8)}_${Date.now()}`;
      const idempotencyKey = `idemp_${transferId}`;

      // 4. Phase 1: Local State Transition inside Prisma Interactive Transaction
      const transferRecord: SettlementTransferRecord = await prisma.$transaction(
        async (tx) => {
          // Transition milestone to SETTLING
          await tx.milestone.update({
            where: { id: input.milestoneId },
            data: { status: 'SETTLING' },
          });

          const nowIso = new Date().toISOString();

          // Persist to SQLite settlement_transfers table
          await tx.$executeRawUnsafe(
            `INSERT INTO settlement_transfers 
             (id, contract_id, milestone_id, freelancer_id, beneficiary_id, gateway_transfer_id, idempotency_key, gross_amount_paise, platform_fee_paise, net_disbursed_paise, currency, status, retry_count, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            transferId,
            input.contractId,
            input.milestoneId,
            contract.freelancerId,
            payoutMethod.vendorId,
            null,
            idempotencyKey,
            grossAmountPaise,
            platformFeePaise,
            netDisbursedPaise,
            'INR',
            'PENDING',
            0,
            nowIso
          );

          const rec: SettlementTransferRecord = {
            id: transferId,
            contractId: input.contractId,
            milestoneId: input.milestoneId,
            freelancerId: contract.freelancerId,
            beneficiaryId: payoutMethod.vendorId,
            gatewayTransferId: null,
            idempotencyKey,
            grossAmountPaise,
            platformFeePaise,
            netDisbursedPaise,
            currency: 'INR',
            status: 'PENDING',
            retryCount: 0,
            createdAt: new Date(nowIso),
          };

          // Append chained SHA-256 AuditLog entry
          await this.auditLogger.logAction(
            {
              actorId: input.clientId,
              entityName: 'Milestone',
              entityId: input.milestoneId,
              action: 'INITIATE_SETTLEMENT',
              previousState: milestone.status,
              newState: 'SETTLING',
            },
            tx
          );

          return rec;
        }
      );

      // 5. Phase 2: Gateway API Call (Executed outside SQL transaction lock)
      const gatewayResponse = await this.gateway.createTransfer({
        transferId,
        beneficiaryId: payoutMethod.vendorId,
        amountPaise: netDisbursedPaise,
        currency: 'INR',
        transferMode: payoutMethod.accountType === 'UPI' ? 'UPI' : 'IMPS',
        remarks: `Milestone release: ${milestone.title}`,
      });

      // 6. Phase 3: Evaluate Gateway Response
      if (gatewayResponse.status === 'INSUFFICIENT_BALANCE') {
        // Platform payout float exhausted -> Queue transfer & alert admin
        await this.handleInsufficientPayoutBalance(transferId, input.milestoneId, gatewayResponse);

        return {
          success: false,
          settlementTransferId: transferId,
          milestoneId: input.milestoneId,
          contractId: input.contractId,
          grossAmountPaise,
          platformFeePaise,
          netDisbursedPaise,
          status: 'QUEUED_INSUFFICIENT_FUNDS',
          gatewayTransferId: null,
          message:
            'Settlement queued: Cashfree platform payout float is depleted. Payout will automatically execute upon float top-up.',
        };
      }

      if (gatewayResponse.status === 'SUCCESS') {
        // Immediate synchronous confirmation
        await this.finalizeSettlementSuccess(
          transferId,
          gatewayResponse.gatewayTransferId || `cf_sync_${Date.now()}`,
          input.clientId
        );

        return {
          success: true,
          settlementTransferId: transferId,
          milestoneId: input.milestoneId,
          contractId: input.contractId,
          grossAmountPaise,
          platformFeePaise,
          netDisbursedPaise,
          status: 'SUCCESS',
          gatewayTransferId: gatewayResponse.gatewayTransferId,
          message: 'Milestone successfully settled and released to freelancer bank account.',
        };
      }

      if (gatewayResponse.status === 'PENDING') {
        // Asynchronous processing (bank clearing in progress)
        await prisma.$executeRawUnsafe(
          `UPDATE settlement_transfers SET status = 'IN_FLIGHT', gateway_transfer_id = ? WHERE id = ?`,
          gatewayResponse.gatewayTransferId ?? null,
          transferId
        );

        return {
          success: true,
          settlementTransferId: transferId,
          milestoneId: input.milestoneId,
          contractId: input.contractId,
          grossAmountPaise,
          platformFeePaise,
          netDisbursedPaise,
          status: 'IN_FLIGHT',
          gatewayTransferId: gatewayResponse.gatewayTransferId,
          message: 'Settlement transfer initiated in flight. Awaiting Cashfree webhook confirmation.',
        };
      }

      // If gateway returned FAILED
      await this.finalizeSettlementFailure(
        transferId,
        gatewayResponse.failureCode || 'GATEWAY_ERROR',
        gatewayResponse.failureReason || 'Transfer rejected by payment rail.',
        input.clientId
      );

      return {
        success: false,
        settlementTransferId: transferId,
        milestoneId: input.milestoneId,
        contractId: input.contractId,
        grossAmountPaise,
        platformFeePaise,
        netDisbursedPaise,
        status: 'FAILED',
        gatewayTransferId: null,
        message: `Settlement failed: ${gatewayResponse.failureReason}. Escrow balance remains protected.`,
      };
    } finally {
      releaseLock();
    }
  }

  // =========================================================================
  // 3. SETTLEMENT FINALIZATION (SUCCESS / FAILURE)
  // =========================================================================

  /**
   * Finalizes successful settlement transfer upon webhook or synchronous confirmation.
   * Executes atomic database mutations:
   * - Milestone transitions to RELEASED.
   * - Contract escrow balance is decremented.
   * - Freelancer balance is incremented (net disbursed).
   * - Activates next sequential milestone if eligible.
   * - Records EscrowTransaction (RELEASE) and chained AuditLog.
   */
  async finalizeSettlementSuccess(
    transferId: string,
    gatewayTransferId: string,
    actorId: string = 'SYSTEM'
  ): Promise<void> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new NotFoundError('SettlementTransfer', transferId);
    }

    if (transfer.status === 'SUCCESS') {
      return; // Idempotent no-op
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decrement contract escrow balance
      const updatedContract = await tx.contract.update({
        where: { id: transfer.contractId },
        data: {
          escrowBalance: { decrement: transfer.grossAmountPaise / 100 },
        },
      });

      // 2. Increment freelancer balance with net proceeds
      await tx.user.update({
        where: { id: transfer.freelancerId },
        data: {
          balance: { increment: transfer.netDisbursedPaise / 100 },
        },
      });

      // 3. Milestone status to RELEASED
      await tx.milestone.update({
        where: { id: transfer.milestoneId },
        data: { status: 'RELEASED' },
      });

      // 4. Update next sequential milestone if covered
      const allMilestones = await tx.milestone.findMany({
        where: { contractId: transfer.contractId },
        orderBy: { sequenceOrder: 'asc' },
      });

      const currentMilestone = allMilestones.find((m) => m.id === transfer.milestoneId);
      if (currentMilestone) {
        const nextMilestone = allMilestones.find(
          (m) => m.sequenceOrder === currentMilestone.sequenceOrder + 1 && m.status === 'PENDING'
        );

        if (nextMilestone && updatedContract.escrowBalance >= nextMilestone.amount) {
          await tx.milestone.update({
            where: { id: nextMilestone.id },
            data: { status: 'FUNDED' },
          });
        }
      }

      // Check if all milestones resolved
      const allResolved = allMilestones.every(
        (m) => m.id === transfer.milestoneId || m.status === 'RELEASED' || m.status === 'REFUNDED'
      );

      if (allResolved) {
        await tx.contract.update({
          where: { id: transfer.contractId },
          data: { status: 'RELEASED' },
        });
      }

      // 5. Create immutable EscrowTransaction record
      await tx.escrowTransaction.create({
        data: {
          contractId: transfer.contractId,
          milestoneId: transfer.milestoneId,
          fromUserId: null,
          toUserId: transfer.freelancerId,
          amount: transfer.grossAmountPaise / 100,
          type: 'RELEASE',
          status: 'COMPLETED',
        },
      });

      // 6. Update transfer record in SQLite table
      const nowIso = new Date().toISOString();
      await tx.$executeRawUnsafe(
        `UPDATE settlement_transfers 
         SET status = 'SUCCESS', gateway_transfer_id = ?, settled_at = ? 
         WHERE id = ?`,
        gatewayTransferId,
        nowIso,
        transferId
      );

      // 7. Append chained SHA-256 AuditLog entry
      await this.auditLogger.logAction(
        {
          actorId,
          entityName: 'Milestone',
          entityId: transfer.milestoneId,
          action: 'RELEASE_ESCROW',
          previousState: 'SETTLING',
          newState: 'RELEASED',
        },
        tx
      );
    });
  }

  /**
   * Handles settlement transfer failure (TRANSFER_FAILED):
   * - Escrow funds stay safe in Contract.escrowBalance.
   * - Milestone transitions back to APPROVED (or SETTLEMENT_FAILED) to allow retry.
   * - Notifies system administrators.
   */
  async finalizeSettlementFailure(
    transferId: string,
    failureCode: string,
    failureReason: string,
    actorId: string = 'SYSTEM'
  ): Promise<void> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new NotFoundError('SettlementTransfer', transferId);
    }

    await prisma.$transaction(async (tx) => {
      // Update SQLite transfer record
      await tx.$executeRawUnsafe(
        `UPDATE settlement_transfers 
         SET status = 'FAILED', failure_code = ?, failure_reason = ? 
         WHERE id = ?`,
        failureCode,
        failureReason,
        transferId
      );

      // Revert milestone back to APPROVED so client/admin can review or retry
      await tx.milestone.update({
        where: { id: transfer.milestoneId },
        data: { status: 'APPROVED' },
      });

      // Append AuditLog
      await this.auditLogger.logAction(
        {
          actorId,
          entityName: 'Milestone',
          entityId: transfer.milestoneId,
          action: 'SETTLEMENT_FAILED',
          previousState: 'SETTLING',
          newState: 'APPROVED',
        },
        tx
      );
    });

    // Alert Admin
    await this.createAdminAlert('WARNING', `Settlement transfer ${transferId} failed on gateway.`, {
      transferId,
      milestoneId: transfer.milestoneId,
      contractId: transfer.contractId,
      failureCode,
      failureReason,
    });
  }

  // =========================================================================
  // 4. INSUFFICIENT PAYOUT BALANCE QUEUING & ALERTING
  // =========================================================================

  /**
   * Handles scenario where Cashfree master payout float has depleted:
   * 1. Escrow funds stay completely intact and protected.
   * 2. Transfer status moves to QUEUED_INSUFFICIENT_FUNDS.
   * 3. Sets exponential backoff nextRetryAt.
   * 4. Dispatches CRITICAL administrator alert.
   */
  private async handleInsufficientPayoutBalance(
    transferId: string,
    milestoneId: string,
    gatewayResponse: any
  ): Promise<void> {
    const nextRetry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE settlement_transfers 
       SET status = 'QUEUED_INSUFFICIENT_FUNDS', failure_code = ?, failure_reason = ?, next_retry_at = ? 
       WHERE id = ?`,
      gatewayResponse.failureCode || 'LOW_BALANCE',
      gatewayResponse.failureReason || 'Platform payout float depleted.',
      nextRetry,
      transferId
    );

    // Keep milestone in SETTLING
    await this.auditLogger.logAction({
      actorId: 'SYSTEM',
      entityName: 'SettlementTransfer',
      entityId: transferId,
      action: 'QUEUE_INSUFFICIENT_FLOAT',
      previousState: 'PENDING',
      newState: 'QUEUED_INSUFFICIENT_FUNDS',
    });

    await this.createAdminAlert(
      'CRITICAL',
      'Cashfree Payout account balance depleted! Transfers enqueued.',
      {
        transferId,
        milestoneId,
        failureCode: gatewayResponse.failureCode,
      }
    );
  }

  /**
   * Recurring worker / cron task to dequeue transfers once float is replenished.
   */
  async processQueuedSettlements(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    remainingQueued: number;
  }> {
    const balance = await this.gateway.getPayoutBalance();
    let remainingFloat = balance.availableBalancePaise;

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    const queuedRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM settlement_transfers 
       WHERE status = 'QUEUED_INSUFFICIENT_FUNDS' 
       ORDER BY created_at ASC`
    );

    for (const row of queuedRows) {
      const netPaise = row.net_disbursed_paise;
      if (netPaise > remainingFloat) {
        // Cannot process next item without sufficient float
        break;
      }

      processed++;
      const nextRetryCount = row.retry_count + 1;

      const gatewayResult = await this.gateway.createTransfer({
        transferId: `${row.id}_retry_${nextRetryCount}`,
        beneficiaryId: row.beneficiary_id,
        amountPaise: netPaise,
        currency: 'INR',
      });

      if (gatewayResult.status === 'SUCCESS') {
        remainingFloat -= netPaise;
        await this.finalizeSettlementSuccess(
          row.id,
          gatewayResult.gatewayTransferId || `cf_dequeued_${Date.now()}`,
          'SYSTEM_SCHEDULER'
        );
        succeeded++;
      } else if (gatewayResult.status === 'INSUFFICIENT_BALANCE') {
        const nextRetry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await prisma.$executeRawUnsafe(
          `UPDATE settlement_transfers SET retry_count = ?, next_retry_at = ? WHERE id = ?`,
          nextRetryCount,
          nextRetry,
          row.id
        );
        break;
      } else {
        await this.finalizeSettlementFailure(
          row.id,
          gatewayResult.failureCode || 'DEQUEUE_ERROR',
          gatewayResult.failureReason || 'Failed during retry dequeue.',
          'SYSTEM_SCHEDULER'
        );
        failed++;
      }
    }

    const remainingRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT count(*) as count FROM settlement_transfers WHERE status = 'QUEUED_INSUFFICIENT_FUNDS'`
    );

    return {
      processed,
      succeeded,
      failed,
      remainingQueued: remainingRows[0]?.count ?? 0,
    };
  }

  // =========================================================================
  // 5. WEBHOOK HANDLER
  // =========================================================================

  /**
   * Processes incoming asynchronous webhook notification from Cashfree.
   */
  async handleWebhook(
    payload: CashfreeWebhookPayload,
    signature: string,
    timestamp: string,
    rawBody: string
  ): Promise<{ acknowledged: boolean; event: string }> {
    const isValid = this.gateway.verifyWebhookSignature(rawBody, timestamp, signature);
    if (!isValid) {
      throw new ValidationError('Invalid Cashfree webhook cryptographic HMAC signature.');
    }

    switch (payload.event) {
      case 'TRANSFER_SUCCESS': {
        await this.finalizeSettlementSuccess(
          payload.transferId,
          payload.gatewayTransferId,
          'CASHFREE_WEBHOOK'
        );
        break;
      }

      case 'TRANSFER_FAILED': {
        await this.finalizeSettlementFailure(
          payload.transferId,
          payload.failureCode || 'WEBHOOK_TRANSFER_FAILED',
          payload.reason || 'Cashfree reported transfer failed.',
          'CASHFREE_WEBHOOK'
        );
        break;
      }

      case 'TRANSFER_REJECTED': {
        if (payload.reason?.toLowerCase().includes('balance')) {
          await this.handleInsufficientPayoutBalance(payload.transferId, '', payload);
        } else {
          await this.finalizeSettlementFailure(
            payload.transferId,
            'TRANSFER_REJECTED',
            payload.reason || 'Transfer rejected by banking rail.',
            'CASHFREE_WEBHOOK'
          );
        }
        break;
      }
    }

    return { acknowledged: true, event: payload.event };
  }

  // =========================================================================
  // 6. SYSTEM ALERTS & AUDITING
  // =========================================================================

  private async createAdminAlert(
    level: 'CRITICAL' | 'WARNING' | 'INFO',
    message: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO settlement_admin_alerts (id, level, message, details, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        id,
        level,
        message,
        JSON.stringify(details),
        nowIso
      );
    } catch (err) {
      console.error('Failed to log admin alert to SQLite:', err);
    }

    console.warn(`[ADMIN ALERT - ${level}] ${message}`, details);
  }

  async getAdminAlerts(): Promise<Array<{
    id: string;
    level: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    details: Record<string, unknown>;
    createdAt: Date;
  }>> {
    await this.ensureTablesExist();

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM settlement_admin_alerts ORDER BY created_at DESC LIMIT 50`
    );

    return rows.map((r) => ({
      id: r.id,
      level: r.level as 'CRITICAL' | 'WARNING' | 'INFO',
      message: r.message,
      details: r.details ? JSON.parse(r.details) : {},
      createdAt: new Date(r.created_at),
    }));
  }

  async getTransfer(transferId: string): Promise<SettlementTransferRecord | null> {
    await this.ensureTablesExist();

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM settlement_transfers WHERE id = ? LIMIT 1`,
      transferId
    );

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      contractId: r.contract_id,
      milestoneId: r.milestone_id,
      freelancerId: r.freelancer_id,
      beneficiaryId: r.beneficiary_id,
      gatewayTransferId: r.gateway_transfer_id,
      idempotencyKey: r.idempotency_key,
      grossAmountPaise: r.gross_amount_paise,
      platformFeePaise: r.platform_fee_paise,
      netDisbursedPaise: r.net_disbursed_paise,
      currency: r.currency,
      status: r.status as SettlementTransferStatus,
      failureCode: r.failure_code,
      failureReason: r.failure_reason,
      retryCount: r.retry_count,
      nextRetryAt: r.next_retry_at ? new Date(r.next_retry_at) : null,
      createdAt: new Date(r.created_at),
      settledAt: r.settled_at ? new Date(r.settled_at) : null,
    };
  }
}

export const globalSettlementService = new SettlementService();
