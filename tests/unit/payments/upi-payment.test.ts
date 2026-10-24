import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { UpiPaymentService } from '@/core/engine-03-dbms/payments/upi-payment-service';

describe('Engine 02 (DSA/QA) — Unit Test Suite: UPI Payment Integration', () => {
  const SECRET_KEY = 'UPI_HMAC_SECRET_KEY_FOR_TESTING_EXACT_32';

  describe('1. Valid UPI Amount & Paise Validation (SPEC-UPI-01)', () => {
    it('should validate and convert valid INR amount into integer paise', () => {
      const { amountInr, amountPaise } = UpiPaymentService.validateAmount(2500.5);
      expect(amountInr).toBe(2500.5);
      expect(amountPaise).toBe(250050);
    });

    it('should accurately handle whole rupee amounts', () => {
      const { amountInr, amountPaise } = UpiPaymentService.validateAmount(50);
      expect(amountInr).toBe(50);
      expect(amountPaise).toBe(5000);
    });

    it('should accurately handle fractional amounts with 2 decimal places', () => {
      const { amountInr, amountPaise } = UpiPaymentService.validateAmount(99.99);
      expect(amountInr).toBe(99.99);
      expect(amountPaise).toBe(9999);
    });
  });

  describe('2. Rejection of Invalid Amounts (SPEC-UPI-02)', () => {
    it('should reject zero amount', () => {
      expect(() => UpiPaymentService.validateAmount(0)).toThrow(/Amount must be greater than zero/);
    });

    it('should reject negative amount', () => {
      expect(() => UpiPaymentService.validateAmount(-50.0)).toThrow(/Amount must be greater than zero/);
    });

    it('should reject non-numeric and NaN values', () => {
      expect(() => UpiPaymentService.validateAmount(NaN)).toThrow(/Amount must be a valid finite number/);
      expect(() => UpiPaymentService.validateAmount(Infinity)).toThrow(/Amount must be a valid finite number/);
    });

    it('should reject amount below minimum threshold (< ₹10)', () => {
      expect(() => UpiPaymentService.validateAmount(5.0)).toThrow(/Minimum deposit amount is ₹10.00/);
    });

    it('should reject amount exceeding NPCI limit (> ₹1,00,000)', () => {
      expect(() => UpiPaymentService.validateAmount(100000.01)).toThrow(/Amount exceeds regulatory maximum limit/);
    });

    it('should reject fractional sub-paise amounts (e.g. 10.555)', () => {
      expect(() => UpiPaymentService.validateAmount(10.555)).toThrow(/fractional sub-paise/);
    });
  });

  describe('3. Genuine QR Code Payload & Decodability (SPEC-UPI-03)', () => {
    it('should decode a valid NPCI UPI URI string into parameters', () => {
      const upiUri = 'upi://pay?pa=escrow.gigaflow%40icici&pn=GigaFlow+Escrow&am=50.00&cu=INR&tr=upi_ord_test123&tn=Test+Deposit';
      const decoded = UpiPaymentService.decodeUpiQr(upiUri);

      expect(decoded.payeeVpa).toBe('escrow.gigaflow@icici');
      expect(decoded.payeeName).toBe('GigaFlow Escrow');
      expect(decoded.amount).toBe('50.00');
      expect(decoded.currency).toBe('INR');
      expect(decoded.transactionRef).toBe('upi_ord_test123');
      expect(decoded.transactionNote).toBe('Test Deposit');
    });

    it('should reject malformed QR payloads without upi://pay? scheme', () => {
      expect(() => UpiPaymentService.decodeUpiQr('https://example.com/payment')).toThrow(/MALFORMED_QR/);
    });

    it('should reject QR payloads missing required parameters', () => {
      expect(() => UpiPaymentService.decodeUpiQr('upi://pay?pa=test@bank&pn=Test')).toThrow(/Missing mandatory UPI query parameters/);
    });

    it('should reject QR payloads with non-INR currency', () => {
      expect(() => UpiPaymentService.decodeUpiQr('upi://pay?pa=test@bank&pn=Test&am=10.00&cu=USD&tr=ord_123')).toThrow(/Currency must be INR/);
    });
  });

  describe('4. Webhook Signature Validation (HMAC-SHA256) (SPEC-UPI-05)', () => {
    it('should verify genuine signed webhook payload within freshness window', () => {
      const rawBody = JSON.stringify({
        event: 'UPI_PAYMENT_SUCCESS',
        tr: 'upi_ord_1001',
        utr: '429810543219',
        amount: 50.0,
      });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const validSig = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      const isValid = UpiPaymentService.verifyWebhookSignature(rawBody, timestamp, validSig, SECRET_KEY);
      expect(isValid).toBe(true);
    });

    it('should reject tampered payload with altered amount or reference', () => {
      const originalBody = JSON.stringify({ event: 'UPI_PAYMENT_SUCCESS', amount: 500.0 });
      const tamperedBody = JSON.stringify({ event: 'UPI_PAYMENT_SUCCESS', amount: 50.0 });
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${timestamp}.${originalBody}`)
        .digest('hex');

      const isValid = UpiPaymentService.verifyWebhookSignature(tamperedBody, timestamp, signature, SECRET_KEY);
      expect(isValid).toBe(false);
    });

    it('should reject signature generated with incorrect secret key', () => {
      const rawBody = JSON.stringify({ event: 'UPI_PAYMENT_SUCCESS', amount: 100 });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const forgedSig = crypto
        .createHmac('sha256', 'ATTACKER_INCORRECT_KEY_32_CHARS_L')
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      const isValid = UpiPaymentService.verifyWebhookSignature(rawBody, timestamp, forgedSig, SECRET_KEY);
      expect(isValid).toBe(false);
    });

    it('should reject replay attacks with timestamps older than 300 seconds', () => {
      const rawBody = JSON.stringify({ event: 'UPI_PAYMENT_SUCCESS', amount: 500 });
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
      const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${expiredTimestamp}.${rawBody}`)
        .digest('hex');

      const isValid = UpiPaymentService.verifyWebhookSignature(rawBody, expiredTimestamp, signature, SECRET_KEY);
      expect(isValid).toBe(false);
    });

    it('should reject empty or missing signature', () => {
      const rawBody = JSON.stringify({ event: 'TEST' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      expect(UpiPaymentService.verifyWebhookSignature(rawBody, timestamp, '', SECRET_KEY)).toBe(false);
    });
  });
});
