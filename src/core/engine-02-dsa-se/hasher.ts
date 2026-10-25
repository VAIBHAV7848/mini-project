import crypto from 'node:crypto';

export class Sha256Hasher {
  computeDigest(data: Buffer | string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  verifyDigest(data: Buffer | string, expectedHash: string): boolean {
    if (!expectedHash || typeof expectedHash !== 'string') return false;
    const computed = this.computeDigest(data);
    const bufComputed = Buffer.from(computed, 'utf-8');
    const bufExpected = Buffer.from(expectedHash, 'utf-8');
    if (bufComputed.byteLength !== bufExpected.byteLength) {
      return false;
    }
    return crypto.timingSafeEqual(bufComputed, bufExpected);
  }
}

export const globalSha256Hasher = new Sha256Hasher();
