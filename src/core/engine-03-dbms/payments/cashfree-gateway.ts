import crypto from 'node:crypto';
import {
  CashfreeTransferInput,
  CashfreeTransferResult,
  CashfreeBalanceResult,
  CashfreeRefundInput,
  CashfreeRefundResult,
} from './types';

export interface PaymentGatewayConfig {
  appId: string;
  secretKey: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production' | 'simulated';
  baseUrl?: string;
  pgBaseUrl?: string;
}

export class CashfreeGateway {
  private config: PaymentGatewayConfig;

  constructor(config?: Partial<PaymentGatewayConfig>) {
    const env =
      config?.environment ||
      (process.env.CASHFREE_ENV as 'sandbox' | 'production') ||
      'sandbox';

    this.config = {
      appId: config?.appId || process.env.CASHFREE_APP_ID || 'TEST_APP_ID',
      secretKey: config?.secretKey || process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY',
      webhookSecret:
        config?.webhookSecret ||
        process.env.CASHFREE_WEBHOOK_SECRET ||
        'TEST_WEBHOOK_SECRET_32_CHARS_MIN',
      environment: env,
      baseUrl:
        config?.baseUrl ||
        (env === 'production'
          ? 'https://payout-api.cashfree.com/payout/v1'
          : 'https://payout-gamma.cashfree.com/payout/v1'),
      pgBaseUrl:
        config?.pgBaseUrl ||
        (env === 'production'
          ? 'https://api.cashfree.com/pg'
          : 'https://sandbox.cashfree.com/pg'),
    };
  }

  /**
   * Cryptographically verifies incoming Cashfree webhook signature using HMAC-SHA256
   * and timing-safe comparison to prevent replay and timing attacks.
   */
  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    if (!signature || !timestamp || !rawBody) {
      return false;
    }

    // Verify timestamp freshness: within 300 seconds window
    const tsNum = parseInt(timestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(tsNum) || Math.abs(nowSec - tsNum) > 300) {
      return false;
    }

    const payload = timestamp + rawBody;
    const computedHmac = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('base64');

    const expectedBuffer = Buffer.from(computedHmac);
    const receivedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  /**
   * Executes outbound payout transfer to freelancer bank or UPI account.
   */
  async createTransfer(input: CashfreeTransferInput): Promise<CashfreeTransferResult> {
    // In simulated/sandbox mode without real credentials, return deterministic response
    if (this.config.environment === 'simulated' || !process.env.CASHFREE_SECRET_KEY) {
      return this.simulateGatewayTransfer(input);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/requestTransfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': this.config.appId,
          'X-Client-Secret': this.config.secretKey,
          'X-Idempotency-Key': input.transferId,
        },
        body: JSON.stringify({
          beneId: input.beneficiaryId,
          amount: (input.amountPaise / 100).toFixed(2),
          transferId: input.transferId,
          transferMode: input.transferMode || 'UPI',
          remarks: input.remarks || `Milestone settlement: ${input.transferId}`,
        }),
      });

      const data = await response.json();

      if (response.status === 200 && data.subCode === '200') {
        return {
          success: true,
          status: 'SUCCESS',
          gatewayTransferId: data.data?.referenceId || `cf_ref_${Date.now()}`,
          rawResponse: data,
        };
      }

      if (data.subCode === '400' && data.message?.toLowerCase().includes('insufficient balance')) {
        return {
          success: false,
          status: 'INSUFFICIENT_BALANCE',
          failureCode: 'LOW_BALANCE',
          failureReason: 'Cashfree master payout account balance is insufficient.',
          rawResponse: data,
        };
      }

      return {
        success: false,
        status: data.status === 'PENDING' ? 'PENDING' : 'FAILED',
        gatewayTransferId: data.data?.referenceId,
        failureCode: data.subCode || 'TRANSFER_ERROR',
        failureReason: data.message || 'Gateway transfer failed.',
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        failureCode: 'NETWORK_TIMEOUT',
        failureReason: err?.message || 'Network error communicating with Cashfree.',
      };
    }
  }

  /**
   * Retrieves operational payout account balance.
   */
  async getPayoutBalance(): Promise<CashfreeBalanceResult> {
    if (this.config.environment === 'simulated' || !process.env.CASHFREE_SECRET_KEY) {
      return {
        availableBalancePaise: 50000000, // ₹500,000 in paise
        currency: 'INR',
        asOf: new Date(),
      };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/getBalance`, {
        method: 'GET',
        headers: {
          'X-Client-Id': this.config.appId,
          'X-Client-Secret': this.config.secretKey,
        },
      });

      const data = await response.json();
      const balanceRupees = parseFloat(data.data?.availableBalance || '0');
      return {
        availableBalancePaise: Math.round(balanceRupees * 100),
        currency: 'INR',
        asOf: new Date(),
      };
    } catch {
      return {
        availableBalancePaise: 0,
        currency: 'INR',
        asOf: new Date(),
      };
    }
  }

  /**
   * Deterministic test simulation for automated integration verification.
   */
  private simulateGatewayTransfer(input: CashfreeTransferInput): CashfreeTransferResult {
    // Special test harness beneficiary triggers
    if (input.beneficiaryId.includes('LOW_BALANCE')) {
      return {
        success: false,
        status: 'INSUFFICIENT_BALANCE',
        failureCode: 'LOW_BALANCE_IN_PAYOUT_ACCOUNT',
        failureReason: 'Platform Cashfree Payout float depleted. Required balance unavailable.',
      };
    }

    if (input.beneficiaryId.includes('FAIL')) {
      return {
        success: false,
        status: 'FAILED',
        failureCode: 'BENEFICIARY_ACCOUNT_INVALID',
        failureReason: 'Beneficiary bank rejected transaction: Invalid IFSC / Account.',
      };
    }

    // Default happy path
    return {
      success: true,
      status: 'SUCCESS',
      gatewayTransferId: `cf_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      rawResponse: { simulated: true },
    };
  }

  /**
   * Dispatches a payment refund to client via Cashfree Payment Gateway Refund API.
   * Endpoint: POST /pg/orders/{order_id}/refunds
   */
  async createRefund(input: CashfreeRefundInput): Promise<CashfreeRefundResult> {
    if (this.config.environment === 'simulated' || !process.env.CASHFREE_SECRET_KEY) {
      return this.simulateGatewayRefund(input);
    }

    try {
      const response = await fetch(`${this.config.pgBaseUrl}/orders/${input.orderId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.config.appId,
          'x-client-secret': this.config.secretKey,
          'x-api-version': '2023-08-01',
          'x-idempotency-key': input.refundId,
        },
        body: JSON.stringify({
          refund_id: input.refundId,
          refund_amount: Number((input.amountPaise / 100).toFixed(2)),
          refund_note: input.refundReason || `Dispute refund: ${input.refundId}`,
          refund_speed: input.refundSpeed || 'STANDARD',
        }),
      });

      const data = await response.json();

      if (response.ok && (response.status === 200 || response.status === 201)) {
        return {
          success: true,
          status: data.refund_status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
          providerRefundId: data.cf_refund_id || `cf_ref_${Date.now()}`,
          orderId: input.orderId,
          refundId: input.refundId,
          amountPaise: input.amountPaise,
          rawResponse: data,
        };
      }

      return {
        success: false,
        status: 'FAILED',
        orderId: input.orderId,
        refundId: input.refundId,
        amountPaise: input.amountPaise,
        failureCode: data.code || `HTTP_${response.status}`,
        failureReason: data.message || 'Cashfree refund API call failed.',
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        orderId: input.orderId,
        refundId: input.refundId,
        amountPaise: input.amountPaise,
        failureCode: 'NETWORK_TIMEOUT',
        failureReason: err?.message || 'Network error communicating with Cashfree PG.',
      };
    }
  }

  /**
   * Deterministic test simulation for refund operations.
   */
  private simulateGatewayRefund(input: CashfreeRefundInput): CashfreeRefundResult {
    if (input.refundReason.includes('GATEWAY_FAIL') || input.orderId.includes('FAIL')) {
      return {
        success: false,
        status: 'FAILED',
        orderId: input.orderId,
        refundId: input.refundId,
        amountPaise: input.amountPaise,
        failureCode: 'BANK_DECLINED_REFUND',
        failureReason: 'Issuing bank declined refund request for original payment instrument.',
      };
    }

    return {
      success: true,
      status: 'PENDING',
      providerRefundId: `cf_ref_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      orderId: input.orderId,
      refundId: input.refundId,
      amountPaise: input.amountPaise,
      rawResponse: { simulated: true },
    };
  }
}


export const globalCashfreeGateway = new CashfreeGateway();
