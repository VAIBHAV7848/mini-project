import { describe, it, expect } from 'vitest';
import { Sha256Hasher } from '@/core/engine-02-dsa-se/hasher';
import { EvidenceTreeManager, EvidenceNodeType } from '@/core/engine-02-dsa-se/evidence-tree';
import { RequirementsTraceabilityMatrix } from '@/core/engine-02-dsa-se/rtm';

describe('Engine 02 (DSA & SE) — Enhanced Cryptographic Proofs & RTM Verification', () => {
  const hasher = new Sha256Hasher();
  const treeManager = new EvidenceTreeManager(hasher);

  describe('1. Sha256Hasher Boundary & Robustness (RangeError Mitigation)', () => {
    it('should return false cleanly on empty, null, or malformed expectedHash length without throwing RangeError', () => {
      const data = Buffer.from('test data payload');

      // Invalid lengths
      expect(hasher.verifyDigest(data, '')).toBe(false);
      expect(hasher.verifyDigest(data, 'short')).toBe(false);
      expect(hasher.verifyDigest(data, 'a'.repeat(63))).toBe(false);
      expect(hasher.verifyDigest(data, 'a'.repeat(65))).toBe(false);
      expect(hasher.verifyDigest(data, null as any)).toBe(false);
      expect(hasher.verifyDigest(data, undefined as any)).toBe(false);
    });

    it('should correctly verify valid 64-character hex digests', () => {
      const data = 'important contract specification deliverable';
      const digest = hasher.computeDigest(data);
      expect(hasher.verifyDigest(data, digest)).toBe(true);
      expect(hasher.verifyDigest(data, digest.replace('a', 'b'))).toBe(false);
    });
  });

  describe('2. N-Ary Merkle Evidence Tree Inclusion Proofs (O(log N))', () => {
    it('should generate and verify Merkle inclusion audit path for arbitrary leaf node', () => {
      const root = treeManager.createRoot('dispute-101', 'Arbitration: Milestone 2 Deliverable Quality');

      const claim = treeManager.addNode(root, {
        id: 'claim-1',
        type: EvidenceNodeType.CLAIM,
        title: 'Non-conformance to requirements',
        metadata: { author: 'Alice' },
        payload: 'Client claim notes: Unit test failure on login module.',
      });

      const exhibitA = treeManager.addNode(claim, {
        id: 'exhibit-test-log',
        type: EvidenceNodeType.TEST_LOG,
        title: 'CI test log showing 4 failed tests',
        metadata: { buildId: 'ci-9941' },
        payload: 'FAIL: login with session token expected 200 received 500',
      });

      const exhibitB = treeManager.addNode(claim, {
        id: 'exhibit-spec-doc',
        type: EvidenceNodeType.DELIVERABLE,
        title: 'Original spec requirements PDF',
        metadata: { section: '4.2' },
        payload: 'Section 4.2 states session must be stored in secure HTTP-only cookie.',
      });

      // Compute Merkle Root
      const rootHash = treeManager.computeMerkleHashes(root);
      expect(rootHash).toHaveLength(64);

      // Generate Inclusion Proof for exhibit-test-log
      const proof = treeManager.generateInclusionProof(root, 'exhibit-test-log');
      expect(proof).not.toBeNull();
      expect(proof!.targetNodeId).toBe('exhibit-test-log');
      expect(proof!.rootHash).toBe(rootHash);
      expect(proof!.auditPath.length).toBeGreaterThan(0);

      // Verify Inclusion Proof independently
      const isValidProof = treeManager.verifyInclusionProof(proof!);
      expect(isValidProof).toBe(true);
    });

    it('should detect cycles and throw descriptive error rather than infinite recursion', () => {
      const root = treeManager.createRoot('dispute-cycle', 'Cyclic Graph Test');
      const nodeA = treeManager.addNode(root, {
        id: 'node-A',
        type: EvidenceNodeType.CLAIM,
        title: 'Node A',
        metadata: {},
        payload: 'payload A',
      });

      // Introduce an intentional cycle: nodeA -> root
      nodeA.children.push(root);

      expect(() => {
        treeManager.computeMerkleHashes(root);
      }).toThrow(/Cycle detected in EvidenceTree/);
    });
  });

  describe('3. Requirements Traceability Matrix (RTM) Programmatic Verification', () => {
    it('should catalog all 12 Functional Requirements (FR-01 to FR-12) and verified NFRs', () => {
      const reqs = RequirementsTraceabilityMatrix.getRequirements();
      expect(reqs.length).toBeGreaterThanOrEqual(17);

      for (let i = 1; i <= 12; i++) {
        const id = `FR-${String(i).padStart(2, '0')}`;
        const req = RequirementsTraceabilityMatrix.getRequirementById(id);
        expect(req).toBeDefined();
        expect(req!.status).toBe('VERIFIED');
        expect(req!.associatedTestSuites.length).toBeGreaterThan(0);
      }
    });

    it('should generate authoritative compliance matrix report with 100% coverage', () => {
      const report = RequirementsTraceabilityMatrix.generateMatrixReport();
      expect(report.totalRequirements).toBeGreaterThanOrEqual(17);
      expect(report.coveragePercentage).toBe(100);
      expect(report.functionalCount).toBe(12);
      expect(report.nonFunctionalCount).toBeGreaterThanOrEqual(5);

      // Verify distribution across all 4 course engines
      expect(report.engineDistribution['ENGINE_01_OS']).toBeGreaterThan(0);
      expect(report.engineDistribution['ENGINE_02_DSA_SE']).toBeGreaterThan(0);
      expect(report.engineDistribution['ENGINE_03_DBMS']).toBeGreaterThan(0);
      expect(report.engineDistribution['ENGINE_04_WEB']).toBeGreaterThan(0);

      expect(RequirementsTraceabilityMatrix.assertAllVerified()).toBe(true);
    });
  });
});
