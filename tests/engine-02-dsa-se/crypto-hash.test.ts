import { describe, it, expect } from 'vitest';
import { calculateTextSha256, calculateFileSha256, formatBytes } from '@/lib/crypto-hash';
import crypto from 'node:crypto';

describe('Engine 02 (DSA/SE) & Engine 04 (Web) — Web Crypto Hash Utility', () => {
  it('should compute exact SHA-256 hash of a string matching node:crypto digest', async () => {
    const text = 'milestone-deliverable-sample-text';
    const expected = crypto.createHash('sha256').update(text).digest('hex');

    const result = await calculateTextSha256(text);
    expect(result).toHaveLength(64);
    expect(result).toBe(expected);
  });

  it('should compute exact SHA-256 hash of a File object', async () => {
    const fileContent = 'sample binary deliverable source code content';
    const expected = crypto.createHash('sha256').update(fileContent).digest('hex');

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const file = new File([blob], 'deliverable.txt', { type: 'text/plain' });

    const result = await calculateFileSha256(file);
    expect(result).toHaveLength(64);
    expect(result).toBe(expected);
  });

  it('should format file sizes accurately with formatBytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(512)).toBe('512 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(2621440, 1)).toBe('2.5 MB');
  });
});
