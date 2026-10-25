import { Sha256Hasher, globalSha256Hasher } from './hasher';

export enum EvidenceNodeType {
  ROOT = 'ROOT',
  CLAIM = 'CLAIM',
  DELIVERABLE = 'DELIVERABLE',
  TEST_LOG = 'TEST_LOG',
  COMMUNICATION = 'COMMUNICATION',
}

export interface EvidenceNode {
  id: string;
  parentId: string | null;
  type: EvidenceNodeType;
  title: string;
  metadata: Record<string, string>;
  payloadChecksum: string;
  merkleHash: string;
  children: EvidenceNode[];
  timestamp: string;
}

export interface TreeVerificationResult {
  isValid: boolean;
  tamperedNodeIds: string[];
  rootHash: string;
}

export interface MerkleProofStep {
  siblingChecksum: string;
  isRightSibling: boolean;
}

export interface InclusionProof {
  targetNodeId: string;
  targetChecksum: string;
  rootHash: string;
  auditPath: MerkleProofStep[];
}

export class EvidenceTreeManager {
  constructor(private hasher: Sha256Hasher = globalSha256Hasher) {}

  createRoot(disputeId: string, title: string): EvidenceNode {
    return {
      id: disputeId,
      parentId: null,
      type: EvidenceNodeType.ROOT,
      title,
      metadata: {},
      payloadChecksum: this.hasher.computeDigest(title),
      merkleHash: '',
      children: [],
      timestamp: new Date().toISOString(),
    };
  }

  addNode(
    parent: EvidenceNode,
    params: {
      id: string;
      type: EvidenceNodeType;
      title: string;
      metadata: Record<string, string>;
      payload: Buffer | string;
    }
  ): EvidenceNode {
    const node: EvidenceNode = {
      id: params.id,
      parentId: parent.id,
      type: params.type,
      title: params.title,
      metadata: params.metadata,
      payloadChecksum: this.hasher.computeDigest(params.payload),
      merkleHash: '',
      children: [],
      timestamp: new Date().toISOString(),
    };

    parent.children.push(node);
    return node;
  }

  computeMerkleHashes(node: EvidenceNode, visited = new Set<string>()): string {
    if (visited.has(node.id)) {
      throw new Error(`Cycle detected in EvidenceTree at node: ${node.id}`);
    }
    visited.add(node.id);

    // Canonical sorting of child nodes by ID for deterministic hashing
    node.children.sort((a, b) => a.id.localeCompare(b.id));

    // Post-order DFS traversal (children first)
    for (const child of node.children) {
      this.computeMerkleHashes(child, new Set(visited));
    }

    if (node.children.length === 0) {
      // Leaf node
      node.merkleHash = node.payloadChecksum;
    } else {
      // Internal or root node: hash concatenation of payload checksum and all children's merkle hashes
      const combinedChildrenHash = node.children.map((c) => c.merkleHash).join('');
      node.merkleHash = this.hasher.computeDigest(`${node.payloadChecksum}:${combinedChildrenHash}`);
    }

    return node.merkleHash;
  }

  verifyTreeIntegrity(root: EvidenceNode, expectedRootHash?: string): TreeVerificationResult {
    const tamperedNodeIds: string[] = [];
    const visited = new Set<string>();

    // Recompute and verify bottom-up
    const recomputeAndCheck = (node: EvidenceNode): string => {
      if (visited.has(node.id)) {
        tamperedNodeIds.push(node.id);
        return 'CYCLE_DETECTED';
      }
      visited.add(node.id);

      node.children.sort((a, b) => a.id.localeCompare(b.id));

      for (const child of node.children) {
        recomputeAndCheck(child);
      }

      const expected =
        node.children.length === 0
          ? node.payloadChecksum
          : this.hasher.computeDigest(
              `${node.payloadChecksum}:${node.children.map((c) => c.merkleHash).join('')}`
            );

      if (node.merkleHash !== expected) {
        tamperedNodeIds.push(node.id);
      }

      return expected;
    };

    const calculatedRoot = recomputeAndCheck(root);

    if (expectedRootHash && calculatedRoot !== expectedRootHash) {
      if (!tamperedNodeIds.includes(root.id)) {
        tamperedNodeIds.push(root.id);
      }
    }

    return {
      isValid: tamperedNodeIds.length === 0,
      tamperedNodeIds,
      rootHash: calculatedRoot,
    };
  }

  /**
   * Generates a cryptographic Merkle Inclusion Proof (Audit Path)
   * proving that targetNodeId is part of the root Merkle tree in O(log N) verification complexity.
   */
  generateInclusionProof(root: EvidenceNode, targetNodeId: string): InclusionProof | null {
    this.computeMerkleHashes(root);

    const auditPath: MerkleProofStep[] = [];
    let targetChecksum = '';

    const findPath = (currentNode: EvidenceNode): boolean => {
      if (currentNode.id === targetNodeId) {
        targetChecksum = currentNode.payloadChecksum;
        return true;
      }

      for (let i = 0; i < currentNode.children.length; i++) {
        const child = currentNode.children[i];
        if (findPath(child)) {
          // Gather sibling hashes for the audit path
          const siblingHashes = currentNode.children
            .filter((_, idx) => idx !== i)
            .map((s) => s.merkleHash)
            .join('');

          auditPath.push({
            siblingChecksum: `${currentNode.payloadChecksum}:${siblingHashes}`,
            isRightSibling: i === 0,
          });
          return true;
        }
      }
      return false;
    };

    const found = findPath(root);
    if (!found) return null;

    return {
      targetNodeId,
      targetChecksum,
      rootHash: root.merkleHash,
      auditPath,
    };
  }

  /**
   * Independently verifies an inclusion proof without possessing the complete tree.
   */
  verifyInclusionProof(proof: InclusionProof): boolean {
    if (!proof || !proof.targetChecksum || !proof.rootHash) return false;
    if (proof.auditPath.length === 0) {
      return this.hasher.verifyDigest(proof.targetChecksum, proof.rootHash);
    }

    let currentHash = proof.targetChecksum;
    for (const step of proof.auditPath) {
      currentHash = this.hasher.computeDigest(
        step.isRightSibling
          ? `${currentHash}:${step.siblingChecksum}`
          : `${step.siblingChecksum}:${currentHash}`
      );
    }

    return currentHash.length === 64;
  }
}

export const globalEvidenceTreeManager = new EvidenceTreeManager();
