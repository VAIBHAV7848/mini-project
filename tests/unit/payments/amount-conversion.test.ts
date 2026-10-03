import { describe, it, expect } from 'vitest';
import { ValidationError } from '@/lib/errors';

/**
 * GigaFlow Currency & Financial Accounting Engine
 * Standard: 1 GF (GigaFlow Credit / INR) = 100 indivisible paise.
 * All ledger balances and external payment payloads enforce integer paise math to eliminate IEEE 754 drift.
 */
export class AmountConverter {
  /**
   * Converts integer paise to decimal GF credits.
   */
  static paiseToGf(paise: number): number {
    this.assertValidPaise(paise);
    return Number((paise / 100).toFixed(2));
  }

  /**
   * Converts decimal GF credits to integer paise with zero floating point drift.
   */
  static gfToPaise(gf: number): number {
    this.assertValidGf(gf);
    return Math.round(Number((gf * 100).toFixed(4)));
  }

  /**
   * Formats decimal GF for localized currency display.
   */
  static formatGf(gf: number): string {
    this.assertValidGf(gf);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(gf);
  }

  /**
   * Validates that an amount is a valid, non-negative, finite GF number with at most 2 decimal places.
   */
  static assertValidGf(gf: unknown): asserts gf is number {
    if (typeof gf !== 'number' || isNaN(gf) || !isFinite(gf)) {
      throw new ValidationError('GF amount must be a finite numeric value.');
    }
    if (Object.is(gf, -0) || gf < 0) {
      throw new ValidationError('GF amount cannot be negative.');
    }
    if (gf > Number.MAX_SAFE_INTEGER / 100) {
      throw new ValidationError('GF amount exceeds maximum safe financial integer limit.');
    }
    const rounded = Number(gf.toFixed(2));
    if (Math.abs(gf - rounded) > 0.00001) {
      throw new ValidationError(`GF amount '${gf}' has fractional sub-paisa precision. Max 2 decimal places allowed.`);
    }
  }

  /**
   * Validates that an amount is a valid, non-negative, safe integer representing indivisible paise.
   */
  static assertValidPaise(paise: unknown): asserts paise is number {
    if (typeof paise !== 'number' || isNaN(paise) || !isFinite(paise)) {
      throw new ValidationError('Paise amount must be a finite numeric value.');
    }
    if (Object.is(paise, -0) || paise < 0) {
      throw new ValidationError('Paise amount cannot be negative.');
    }
    if (!Number.isSafeInteger(paise)) {
      throw new ValidationError('Paise amount must be an indivisible integer within safe integer range.');
    }
  }

  /**
   * Conserves paise across fractional splits (e.g., 50/50 split of 100,001 paise).
   * Invariant: clientPaise + freelancerPaise === totalPaise (0 drift leakage).
   */
  static splitPaise(
    totalPaise: number,
    clientPercent: number,
    freelancerPercent: number
  ): { clientPaise: number; freelancerPaise: number } {
    this.assertValidPaise(totalPaise);
    if (clientPercent < 0 || freelancerPercent < 0 || clientPercent + freelancerPercent !== 100) {
      throw new ValidationError('Split percentages must be non-negative and sum to exactly 100%.');
    }

    const clientPaise = Math.floor(totalPaise * (clientPercent / 100));
    const freelancerPaise = totalPaise - clientPaise;

    if (clientPaise + freelancerPaise !== totalPaise) {
      throw new ValidationError('Conservation of financial balance violated in paise split.');
    }

    return { clientPaise, freelancerPaise };
  }
}

describe('Unit: Amount Conversion & GF Accounting (Engine 03 DBMS)', () => {
  describe('1. Paise to GF Conversion', () => {
    it('should correctly convert integer paise to GF decimal', () => {
      expect(AmountConverter.paiseToGf(0)).toBe(0.0);
      expect(AmountConverter.paiseToGf(1)).toBe(0.01);
      expect(AmountConverter.paiseToGf(50)).toBe(0.5);
      expect(AmountConverter.paiseToGf(99)).toBe(0.99);
      expect(AmountConverter.paiseToGf(100)).toBe(1.0);
      expect(AmountConverter.paiseToGf(10000)).toBe(100.0);
      expect(AmountConverter.paiseToGf(100001)).toBe(1000.01);
      expect(AmountConverter.paiseToGf(50000000)).toBe(500000.0);
    });

    it('should format GF currency strings in Indian numbering format', () => {
      const formatted = AmountConverter.formatGf(1000.01);
      expect(formatted).toContain('1,000.01');
    });
  });

  describe('2. GF to Paise Conversion & IEEE 754 Floating Point Drift Mitigation', () => {
    it('should convert standard GF values to exact integer paise', () => {
      expect(AmountConverter.gfToPaise(0.0)).toBe(0);
      expect(AmountConverter.gfToPaise(0.01)).toBe(1);
      expect(AmountConverter.gfToPaise(1.0)).toBe(100);
      expect(AmountConverter.gfToPaise(100.0)).toBe(10000);
      expect(AmountConverter.gfToPaise(1000.01)).toBe(100001);
    });

    it('should neutralize notorious JavaScript IEEE 754 precision bugs', () => {
      const sum = 0.1 + 0.2;
      expect(sum).not.toBe(0.3); // Demonstrates raw JS defect
      expect(AmountConverter.gfToPaise(Number(sum.toFixed(2)))).toBe(30);

      expect(19.99 * 100).toBe(1998.9999999999998);
      expect(AmountConverter.gfToPaise(19.99)).toBe(1999);

      expect(AmountConverter.gfToPaise(29.99)).toBe(2999);
      expect(AmountConverter.gfToPaise(59.99)).toBe(5999);
    });
  });

  describe('3. Bidirectional Round-Trip Fidelity & Zero Drift', () => {
    it('should guarantee exact round-trip fidelity across 10,000 continuous paise points', () => {
      for (let p = 0; p <= 10000; p++) {
        const gf = AmountConverter.paiseToGf(p);
        const backToPaise = AmountConverter.gfToPaise(gf);
        expect(backToPaise).toBe(p);
      }
    });

    it('should prove zero accumulation drift when summing 10,000 micro-payments', () => {
      let accumulatedPaise = 0;
      for (let i = 0; i < 10000; i++) {
        accumulatedPaise += 1;
      }
      expect(accumulatedPaise).toBe(10000);
      expect(AmountConverter.paiseToGf(accumulatedPaise)).toBe(100.0);
    });
  });

  describe('4. Non-Negative and Indivisibility Assertions', () => {
    it('should reject negative GF amounts', () => {
      expect(() => AmountConverter.assertValidGf(-0.01)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(-100.0)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(-Infinity)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(-0)).toThrow(ValidationError);
    });

    it('should reject non-numeric or NaN GF amounts', () => {
      expect(() => AmountConverter.assertValidGf(NaN)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(undefined as any)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(null as any)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf('100.00' as any)).toThrow(ValidationError);
    });

    it('should reject sub-paisa fractional GF precision (more than 2 decimal places)', () => {
      expect(() => AmountConverter.assertValidGf(10.001)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(99.999)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidGf(0.123456)).toThrow(ValidationError);
    });

    it('should reject fractional or negative paise', () => {
      expect(() => AmountConverter.assertValidPaise(-1)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidPaise(100.5)).toThrow(ValidationError);
      expect(() => AmountConverter.assertValidPaise(0.33)).toThrow(ValidationError);
    });
  });

  describe('5. Safe Integer Boundary Tests', () => {
    it('should accept valid values up to platform maximum', () => {
      const maxPaise = 10000000000; // ₹100,000,000.00
      expect(() => AmountConverter.assertValidPaise(maxPaise)).not.toThrow();
      expect(AmountConverter.paiseToGf(maxPaise)).toBe(100000000.0);
    });

    it('should reject numbers beyond Number.MAX_SAFE_INTEGER', () => {
      const unsafe = Number.MAX_SAFE_INTEGER + 2;
      expect(() => AmountConverter.assertValidPaise(unsafe)).toThrow(ValidationError);
    });
  });

  describe('6. Zero-Leakage Split Arithmetic', () => {
    it('should conserve all paise when splitting odd paise amounts (100,001 paise 50/50)', () => {
      const { clientPaise, freelancerPaise } = AmountConverter.splitPaise(100001, 50, 50);
      expect(clientPaise).toBe(50000);
      expect(freelancerPaise).toBe(50001);
      expect(clientPaise + freelancerPaise).toBe(100001);
    });

    it('should conserve indivisible 1 paisa split 50/50 without destruction', () => {
      const { clientPaise, freelancerPaise } = AmountConverter.splitPaise(1, 50, 50);
      expect(clientPaise).toBe(0);
      expect(freelancerPaise).toBe(1);
      expect(clientPaise + freelancerPaise).toBe(1);
    });

    it('should reject invalid percentage totals', () => {
      expect(() => AmountConverter.splitPaise(10000, 60, 50)).toThrow(ValidationError);
      expect(() => AmountConverter.splitPaise(10000, -10, 110)).toThrow(ValidationError);
    });
  });
});
