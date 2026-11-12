import crypto from 'node:crypto';
import prisma from '@/lib/db';

export interface AuditEntryInput {
  actorId: string;
  entityName: string;
  entityId: string;
  action: string;
  previousState?: string | null;
  newState: string;
}

export interface AuditVerificationResult {
  isValid: boolean;
  totalVerified: number;
  tamperedRecordIds: string[];
}

export class AuditLogger {
  private computeChainedHash(
    actorId: string,
    entityName: string,
    entityId: string,
    action: string,
    newState: string,
    timestamp: Date,
    prevHash: string
  ): string {
    const payload = `${actorId}:${entityName}:${entityId}:${action}:${newState}:${timestamp.toISOString()}:${prevHash}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async logAction(entry: AuditEntryInput, tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
    const client = tx || prisma;
    // Get the latest audit log to chain hashes
    const lastRecord = await client.auditLog.findFirst({
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
    });

    const prevHash = lastRecord ? lastRecord.verificationHash : 'GENESIS';
    const now = new Date();
    const timestamp =
      lastRecord && lastRecord.timestamp.getTime() >= now.getTime()
        ? new Date(lastRecord.timestamp.getTime() + 1)
        : now;

    const verificationHash = this.computeChainedHash(
      entry.actorId,
      entry.entityName,
      entry.entityId,
      entry.action,
      entry.newState,
      timestamp,
      prevHash
    );

    return await client.auditLog.create({
      data: {
        actorId: entry.actorId,
        entityName: entry.entityName,
        entityId: entry.entityId,
        action: entry.action,
        previousState: entry.previousState ?? null,
        newState: entry.newState,
        prevHash,
        verificationHash,
        timestamp,
      },
    });
  }

  async verifyAuditChain(): Promise<AuditVerificationResult> {
    const allRecords = await prisma.auditLog.findMany();
    if (allRecords.length === 0) {
      return {
        isValid: true,
        totalVerified: 0,
        tamperedRecordIds: [],
      };
    }

    // Topologically traverse records by following prevHash -> verificationHash chain
    const byPrevHash = new Map<string, (typeof allRecords)[0]>();
    for (const record of allRecords) {
      byPrevHash.set(record.prevHash, record);
    }

    const orderedRecords: typeof allRecords = [];
    let currentPrev = 'GENESIS';
    while (byPrevHash.has(currentPrev)) {
      const rec = byPrevHash.get(currentPrev)!;
      orderedRecords.push(rec);
      currentPrev = rec.verificationHash;
    }

    // If topological traversal resolved all records, use that order; otherwise fallback to timestamp sort
    const recordsToVerify =
      orderedRecords.length === allRecords.length
        ? orderedRecords
        : await prisma.auditLog.findMany({
            orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
          });

    const tamperedRecordIds: string[] = [];
    let expectedPrevHash = 'GENESIS';

    for (let i = 0; i < recordsToVerify.length; i++) {
      const record = recordsToVerify[i];

      // Check chaining link
      if (i > 0 && record.prevHash !== expectedPrevHash) {
        tamperedRecordIds.push(record.id);
      }

      // Recompute hash
      const recalculatedHash = this.computeChainedHash(
        record.actorId,
        record.entityName,
        record.entityId,
        record.action,
        record.newState,
        record.timestamp,
        record.prevHash
      );

      if (record.verificationHash !== recalculatedHash) {
        if (!tamperedRecordIds.includes(record.id)) {
          tamperedRecordIds.push(record.id);
        }
      }

      expectedPrevHash = record.verificationHash;
    }

    return {
      isValid: tamperedRecordIds.length === 0,
      totalVerified: recordsToVerify.length,
      tamperedRecordIds,
    };
  }
}

export const globalAuditLogger = new AuditLogger();
