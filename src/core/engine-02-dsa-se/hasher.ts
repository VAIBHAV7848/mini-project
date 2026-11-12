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

  verifyHashesEqual(hashA: string, hashB: string): boolean {
    if (!hashA || !hashB || typeof hashA !== 'string' || typeof hashB !== 'string') return false;
    const bufA = Buffer.from(hashA, 'utf-8');
    const bufB = Buffer.from(hashB, 'utf-8');
    if (bufA.byteLength !== bufB.byteLength) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}

export const globalSha256Hasher = new Sha256Hasher();
