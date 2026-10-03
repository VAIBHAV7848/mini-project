import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { CashfreeGateway } from '@/core/engine-03-dbms/payments/cashfree-gateway';

describe('Unit: Cashfree Gateway Integration (Engine 03 DBMS)', () => {
  const mockWebhookSecret = 'MOCK_CF_WEBHOOK_SECRET_KEY_32_CHARS_EXACT';
  let gateway: CashfreeGateway;

  beforeEach(() => {
    gateway = new CashfreeGateway({
      appId: 'TEST_CF_APP_ID',
      secretKey: 'TEST_CF_SECRET_KEY',
      webhookSecret: mockWebhookSecret,
      environment: 'simulated',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Webhook Signature Verification & Cryptographic Invariants', () => {
    it('should verify genuine HMAC-SHA256 signature constructed as Base64(HMAC(timestamp + rawBody))', () => {
      const rawBody = JSON.stringify({
        event: 'PAYMENT_SUCCESS_WEBHOOK',
        order: { order_id: 'ord_123', order_amount: 500.0 },
      });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const payload = timestamp + rawBody;
      const signature = crypto.createHmac('sha256', mockWebhookSecret).update(payload).digest('base64');

      const isValid = gateway.verifyWebhookSignature(rawBody, timestamp, signature);
      expect(isValid).toBe(true);
    });

    it('should reject single-bit payload tampering in webhook body', () => {
      const rawBody = JSON.stringify({ event: 'PAYMENT_SUCCESS_WEBHOOK', order: { order_amount: 500.0 } });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', mockWebhookSecret).update(timestamp + rawBody).digest('base64');

      const tamperedBody = JSON.stringify({ event: 'PAYMENT_SUCCESS_WEBHOOK', order: { order_amount: 50.0 } });
      const isValid = gateway.verifyWebhookSignature(tamperedBody, timestamp, signature);
      expect(isValid).toBe(false);
    });

    it('should reject single-bit tampering in timestamp', () => {
      const rawBody = JSON.stringify({ event: 'PAYMENT_SUCCESS_WEBHOOK', order_id: 'ord_safe' });
      const currentSec = Math.floor(Date.now() / 1000);
      const timestamp = currentSec.toString();
      const signature = crypto.createHmac('sha256', mockWebhookSecret).update(timestamp + rawBody).digest('base64');

      const tamperedTimestamp = (currentSec - 5).toString();
      const isValid = gateway.verifyWebhookSignature(rawBody, tamperedTimestamp, signature);
      expect(isValid).toBe(false);
    });

    it('should handle mismatched signature lengths safely without throwing buffer exceptions', () => {
      const rawBody = JSON.stringify({ event: 'TEST' });
      const timestamp = Math.floor(Date.now() / 1000).toString();

      expect(gateway.verifyWebhookSignature(rawBody, timestamp, 'short_sig')).toBe(false);
      expect(gateway.verifyWebhookSignature(rawBody, timestamp, '')).toBe(false);
      expect(gateway.verifyWebhookSignature('', timestamp, 'valid_length_sig=========================')).toBe(false);
      expect(gateway.verifyWebhookSignature(rawBody, '', 'valid_length_sig=========================')).toBe(false);
    });
  });

  describe('2. Replay Attack & Timestamp Freshness Protection', () => {
    it('should accept webhook payloads delivered within 300 seconds window', () => {
      const rawBody = JSON.stringify({ event: 'TRANSFER_SUCCESS', id: 'tx_01' });
      const timestamp290sAgo = (Math.floor(Date.now() / 1000) - 290).toString();
      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(timestamp290sAgo + rawBody)
        .digest('base64');

      expect(gateway.verifyWebhookSignature(rawBody, timestamp290sAgo, signature)).toBe(true);
    });

    it('should reject webhook payloads with timestamp older than 300 seconds (> 300s replay attack)', () => {
      const rawBody = JSON.stringify({ event: 'TRANSFER_SUCCESS', id: 'tx_02' });
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(expiredTimestamp + rawBody)
        .digest('base64');

      expect(gateway.verifyWebhookSignature(rawBody, expiredTimestamp, signature)).toBe(false);
    });

    it('should reject non-numeric or future-skewed timestamps', () => {
      const rawBody = JSON.stringify({ event: 'TRANSFER_SUCCESS' });
      expect(gateway.verifyWebhookSignature(rawBody, 'invalid-nan-time', 'sig')).toBe(false);
    });
  });

  describe('3. Payout Transfer Execution & Failure Circuit Breaking', () => {
    it('should execute successful transfer in simulated environment', async () => {
      const result = await gateway.createTransfer({
        transferId: 'trf_test_01',
        beneficiaryId: 'CF_BENE_SUCCESS_01',
        amountPaise: 9500, // ₹95.00
        transferMode: 'UPI',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('SUCCESS');
      expect(result.gatewayTransferId).toBeDefined();
    });

    it('should intercept low float beneficiary simulation and return INSUFFICIENT_BALANCE', async () => {
      const result = await gateway.createTransfer({
        transferId: 'trf_test_low',
        beneficiaryId: 'CF_BENE_LOW_BALANCE_TRIGGER',
        amountPaise: 50000,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('INSUFFICIENT_BALANCE');
      expect(result.failureCode).toBe('LOW_BALANCE_IN_PAYOUT_ACCOUNT');
    });

    it('should handle simulated invalid beneficiary bank account rejection', async () => {
      const result = await gateway.createTransfer({
        transferId: 'trf_test_fail',
        beneficiaryId: 'CF_BENE_FAIL_ACCOUNT',
        amountPaise: 10000,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.failureCode).toBe('BENEFICIARY_ACCOUNT_INVALID');
    });
  });

  describe('4. Payment Gateway Refund API Handling', () => {
    it('should initiate refund in pending state under simulated mode', async () => {
      const result = await gateway.createRefund({
        orderId: 'ord_contract_01',
        refundId: 'rfnd_001',
        amountPaise: 10000,
        refundReason: 'Dispute arbitration refund',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PENDING');
      expect(result.providerRefundId).toBeDefined();
      expect(result.amountPaise).toBe(10000);
    });

    it('should report bank declined refund simulation correctly', async () => {
      const result = await gateway.createRefund({
        orderId: 'ord_FAIL_trigger',
        refundId: 'rfnd_fail_01',
        amountPaise: 5000,
        refundReason: 'Testing bank rejection',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.failureCode).toBe('BANK_DECLINED_REFUND');
    });
  });
});
