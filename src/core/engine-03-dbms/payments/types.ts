import { UserRole } from '@/types';

export type PayoutAccountType = 'BANK_ACCOUNT' | 'UPI';

export type PayoutVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export interface UserPayoutMethod {
  id: string;
  userId: string;
  vendorId: string; // Cashfree Beneficiary / Vendor ID (e.g., 'CF_BEN_019283')
  accountType: PayoutAccountType;
  accountIdentifier: string; // Masked account (e.g., '••••4321') or VPA (e.g., 'user@okaxis')
  ifsc?: string | null;
  bankName?: string | null;
  verificationStatus: PayoutVerificationStatus;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SettlementTransferStatus =
  | 'PENDING'
  | 'IN_FLIGHT'
  | 'SUCCESS'
  | 'FAILED'
  | 'QUEUED_INSUFFICIENT_FUNDS';

export interface SettlementTransferRecord {
  id: string;
  contractId: string;
  milestoneId: string;
  freelancerId: string;
  beneficiaryId: string;
  gatewayTransferId?: string | null;
  idempotencyKey: string;
  grossAmountPaise: number;
  platformFeePaise: number;
  netDisbursedPaise: number;
  currency: string;
  status: SettlementTransferStatus;
  failureCode?: string | null;
  failureReason?: string | null;
  retryCount: number;
  nextRetryAt?: Date | null;
  createdAt: Date;
  settledAt?: Date | null;
}

export interface CashfreeTransferInput {
  transferId: string;
  beneficiaryId: string;
  amountPaise: number;
  currency?: string;
  transferMode?: 'UPI' | 'IMPS' | 'NEFT';
  remarks?: string;
}

export interface CashfreeTransferResult {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'INSUFFICIENT_BALANCE';
  gatewayTransferId?: string;
  failureCode?: string;
  failureReason?: string;
  rawResponse?: Record<string, unknown>;
}

export interface CashfreeBalanceResult {
  availableBalancePaise: number;
  currency: string;
  asOf: Date;
}

export interface CashfreeWebhookPayload {
  event: 'TRANSFER_SUCCESS' | 'TRANSFER_FAILED' | 'TRANSFER_REJECTED';
  transferId: string;
  gatewayTransferId: string;
  amountPaise: number;
  status: string;
  reason?: string;
  failureCode?: string;
  timestamp: string;
}

export interface InitiateSettlementInput {
  contractId: string;
  milestoneId: string;
  clientId: string;
  actorRole: UserRole | 'SYSTEM';
}

export interface SettlementReceipt {
  success: boolean;
  settlementTransferId: string;
  milestoneId: string;
  contractId: string;
  grossAmountPaise: number;
  platformFeePaise: number;
  netDisbursedPaise: number;
  status: SettlementTransferStatus;
  gatewayTransferId?: string | null;
  message: string;
}

// -----------------------------------------------------------------------------
// DISPUTE REFUND & REVERSAL FLOW TYPES
// -----------------------------------------------------------------------------

export type RefundStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface CashfreeRefundInput {
  orderId: string;
  refundId: string;
  amountPaise: number;
  refundReason: string;
  refundSpeed?: 'STANDARD' | 'INSTANT';
}

export interface CashfreeRefundResult {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  providerRefundId?: string;
  orderId: string;
  refundId: string;
  amountPaise: number;
  failureCode?: string;
  failureReason?: string;
  rawResponse?: Record<string, unknown>;
}

export interface RefundRecord {
  id: string;
  disputeId: string;
  milestoneId: string;
  contractId: string;
  clientId: string;
  orderId: string;
  providerRefundId?: string | null;
  idempotencyKey: string;
  amountPaise: number;
  status: RefundStatus;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date | null;
}

export interface CashfreeRefundWebhookPayload {
  event: 'REFUND_STATUS_WEBHOOK';
  event_time: string;
  data: {
    refund: {
      cf_refund_id: string;
      refund_id: string;
      order_id: string;
      refund_amount: number; // Float in INR
      refund_currency: string;
      refund_status: 'SUCCESS' | 'FAILED' | 'PENDING';
      refund_arn?: string;
      status_description?: string;
    };
  };
}

export interface InitiateDisputeRefundInput {
  disputeId: string;
  reviewerId: string;
  rulingNotes: string;
  // If partial refund is desired:
  splitRatio?: {
    clientPercentage: number;     // e.g. 50 (0-100)
    freelancerPercentage: number; // e.g. 50 (0-100)
  };
}

export interface DisputeRefundResult {
  success: boolean;
  disputeId: string;
  milestoneId: string;
  contractId: string;
  type: 'FULL_REFUND' | 'PARTIAL_SPLIT';
  clientRefund: {
    refundId: string;
    providerRefundId?: string;
    amountPaise: number;
    status: RefundStatus;
  };
  freelancerTransfer?: {
    transferId: string;
    gatewayTransferId?: string;
    amountPaise: number;
    status: SettlementTransferStatus;
  };
  totalMilestonePaise: number;
  message: string;
}

