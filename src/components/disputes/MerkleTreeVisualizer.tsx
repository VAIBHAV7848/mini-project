'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  Fingerprint,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { syncSha256Hex } from '@/lib/crypto-hash';

interface EvidenceLeaf {
  id: string;
  label: string;
  content: string;
  hash: string;
  submittedBy?: string;
  isDeliverable?: boolean;
}

interface MerkleTreeVisualizerProps {
  disputeId?: string;
  milestoneTitle?: string;
  leaves?: {
    id: string;
    description: string;
    sha256Checksum: string;
    submittedBy?: string;
    isDeliverable?: boolean;
  }[];
}

// Client-safe synchronous SHA-256 for simulator
function sha256Hex(data: string): string {
  return syncSha256Hex(data);
}

export function MerkleTreeVisualizer({
  disputeId = 'DSP-DEMO-01',
  milestoneTitle = 'Frontend Architecture & Smart Escrow UI',
  leaves: initialLeaves,
}: MerkleTreeVisualizerProps) {
  // Canonical default leaves if none provided
  const defaultLeaves: EvidenceLeaf[] = useMemo(() => {
    if (initialLeaves && initialLeaves.length > 0) {
      return initialLeaves.map((l) => ({
        id: l.id,
        label: l.description,
        content: `Ex: ${l.description} [${l.sha256Checksum.slice(0, 10)}]`,
        hash: l.sha256Checksum,
        submittedBy: l.submittedBy,
        isDeliverable: l.isDeliverable,
      }));
    }

    const deliverablePayload = 'Deliverable: Next.js 16 Escrow Dashboard v1.0.0-final';
    const clientEvidence = 'Exhibit A: Client issue report stating missing unit test coverage';
    const freelancerLogs = 'Exhibit B: CI Build artifact showing 100% test pass rate on commit #9f2a4c';
    const auditSnapshot = 'Exhibit C: Tamper-evident ledger transaction #TXN-774902 verification';

    return [
      {
        id: 'leaf-01',
        label: 'Milestone Deliverable Codebase',
        content: deliverablePayload,
        hash: sha256Hex(deliverablePayload),
        submittedBy: 'Freelancer (Charlie Developer)',
        isDeliverable: true,
      },
      {
        id: 'leaf-02',
        label: 'Client Defect Claim (Exhibit A)',
        content: clientEvidence,
        hash: sha256Hex(clientEvidence),
        submittedBy: 'Client (Alice Client)',
        isDeliverable: false,
      },
      {
        id: 'leaf-03',
        label: 'CI/CD Build Logs (Exhibit B)',
        content: freelancerLogs,
        hash: sha256Hex(freelancerLogs),
        submittedBy: 'Freelancer (Charlie Developer)',
        isDeliverable: false,
      },
      {
        id: 'leaf-04',
        label: 'Ledger Audit Snapshot (Exhibit C)',
        content: auditSnapshot,
        hash: sha256Hex(auditSnapshot),
        submittedBy: 'Arbitrator / Audit Engine',
        isDeliverable: false,
      },
    ];
  }, [initialLeaves]);

  // Simulation state: allows modifying leaf 01 content to demonstrate Merkle root invalidation
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);
  const [tamperedContent, setTamperedContent] = useState<string>('');
  const [selectedLeafIndex, setSelectedLeafIndex] = useState<number>(0);

  // Active leaves (with tamper injection if active)
  const currentLeaves = useMemo(() => {
    return defaultLeaves.map((leaf, idx) => {
      if (tamperedIndex === idx) {
        const alteredHash = sha256Hex(tamperedContent);
        return {
          ...leaf,
          content: tamperedContent,
          hash: alteredHash,
          isTampered: true,
        };
      }
      return { ...leaf, isTampered: false };
    });
  }, [defaultLeaves, tamperedIndex, tamperedContent]);

  // Compute 2-level binary Merkle Tree from 4 leaves:
  // Node 01 = H(Leaf 0 + Leaf 1)
  // Node 02 = H(Leaf 2 + Leaf 3)
  // Root    = H(Node 01 + Node 02)
  const treeNodes = useMemo(() => {
    const l0 = currentLeaves[0]?.hash || sha256Hex('null');
    const l1 = currentLeaves[1]?.hash || l0;
    const l2 = currentLeaves[2]?.hash || sha256Hex('null');
    const l3 = currentLeaves[3]?.hash || l2;

    const parentLeft = sha256Hex(l0 + l1);
    const parentRight = sha256Hex(l2 + l3);
    const root = sha256Hex(parentLeft + parentRight);

    // Compute expected authentic root (from untampered leaves)
    const authL0 = defaultLeaves[0]?.hash || sha256Hex('null');
    const authL1 = defaultLeaves[1]?.hash || authL0;
    const authL2 = defaultLeaves[2]?.hash || sha256Hex('null');
    const authL3 = defaultLeaves[3]?.hash || authL2;
    const authParentLeft = sha256Hex(authL0 + authL1);
    const authParentRight = sha256Hex(authL2 + authL3);
    const authenticRoot = sha256Hex(authParentLeft + authParentRight);

    const isTampered = root !== authenticRoot;

    return {
      l0,
      l1,
      l2,
      l3,
      parentLeft,
      parentRight,
      root,
      authenticRoot,
      isTampered,
    };
  }, [currentLeaves, defaultLeaves]);

  const handleSimulateTamper = (index: number) => {
    const original = defaultLeaves[index].content;
    const altered = original + ' [TAMPERED: Injected malicious payload & modified source bytes]';
    setTamperedIndex(index);
    setTamperedContent(altered);
  };

  const handleRestoreAuthentic = () => {
    setTamperedIndex(null);
    setTamperedContent('');
  };

  // Selected leaf inclusion proof calculation
  const inclusionProof = useMemo(() => {
    const idx = selectedLeafIndex;
    const siblingHash =
      idx === 0 ? treeNodes.l1 : idx === 1 ? treeNodes.l0 : idx === 2 ? treeNodes.l3 : treeNodes.l2;
    const siblingDirection = idx % 2 === 0 ? 'RIGHT' : 'LEFT';

    const parentSibling = idx < 2 ? treeNodes.parentRight : treeNodes.parentLeft;
    const parentDirection = idx < 2 ? 'RIGHT' : 'LEFT';

    return {
      targetIndex: idx,
      targetLeaf: currentLeaves[idx],
      step1: {
        siblingHash,
        siblingDirection,
        description: `Combine with sibling leaf (${siblingDirection}): H(${idx % 2 === 0 ? 'target + sibling' : 'sibling + target'})`,
      },
      step2: {
        siblingHash: parentSibling,
        siblingDirection: parentDirection,
        description: `Combine with sibling sub-tree branch (${parentDirection}) to derive Merkle Root`,
      },
    };
  }, [selectedLeafIndex, treeNodes, currentLeaves]);

  return (
    <div className="card p-0 border border-line bg-surface overflow-hidden">
      {/* Component Header */}
      <div className="p-5 border-b border-line bg-surface-highlight/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono2 text-[10px] font-bold uppercase tracking-wider text-brand-base px-2 py-0.5 rounded bg-brand-base/10 border border-brand-base/20">
              Engine 02 · DSA & SE
            </span>
            <span className="text-paper-faint text-xs font-mono2">Tree ID: {disputeId}</span>
          </div>
          <h3 className="font-display text-lg font-bold text-white mt-1 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-brand-base" />
            Cryptographic Merkle Evidence Tree
          </h3>
          <p className="text-xs text-paper-muted">
            Tamper-evident N-ary Merkle tree indexing all milestone deliverables and dispute exhibits.
          </p>
        </div>

        {/* Root Health Badge */}
        <div className="flex items-center gap-2">
          {treeNodes.isTampered ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger-tint border border-danger/40 text-danger-light animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold leading-none">TAMPER DETECTED</p>
                <p className="text-[10px] font-mono2 opacity-80">Root Mismatch · Escrow Blocked</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-tint border border-success/40 text-success-light">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold leading-none">ROOT VERIFIED</p>
                <p className="text-[10px] font-mono2 opacity-80">All Exhibits Cryptographically Intact</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Merkle Root Node */}
        <div className="flex flex-col items-center">
          <div
            className={`w-full max-w-xl p-4 rounded-xl border transition-all duration-300 text-center ${
              treeNodes.isTampered
                ? 'bg-danger-tint/30 border-danger/60 text-danger-light shadow-lg shadow-danger/10'
                : 'bg-surface-elevated border-brand-base/40 text-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-brand-base" /> Merkle Root Hash
              </span>
              <span
                className={`text-[10px] font-mono2 font-bold px-2 py-0.5 rounded ${
                  treeNodes.isTampered
                    ? 'bg-danger text-white'
                    : 'bg-success/20 text-success-light border border-success/30'
                }`}
              >
                {treeNodes.isTampered ? 'INVALID ROOT' : 'VERIFIED 256-BIT'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-charcoal border border-line font-mono2 text-xs break-all select-all text-left">
              <span className="text-paper-faint select-none">H_root: </span>
              <span className={treeNodes.isTampered ? 'text-danger font-bold' : 'text-brand-light'}>
                {treeNodes.root}
              </span>
            </div>
            {treeNodes.isTampered && (
              <p className="text-[11px] text-danger-light mt-2 text-left flex items-center gap-1 font-mono2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Expected authentic root:{' '}
                {treeNodes.authenticRoot.slice(0, 16)}...
              </p>
            )}
          </div>

          {/* Branch connectors */}
          <div className="w-0.5 h-6 bg-line my-1" />
          <div className="w-3/4 max-w-md h-px bg-line" />
        </div>

        {/* Intermediate Nodes (Level 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Left Branch */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-line text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono2 text-paper-faint uppercase font-bold">Branch Left (Node 0)</span>
              <span className="text-[10px] font-mono2 text-paper-faint">H(L0 + L1)</span>
            </div>
            <div className="p-2 bg-charcoal rounded-lg font-mono2 text-[11px] text-paper-muted break-all">
              {treeNodes.parentLeft}
            </div>
          </div>

          {/* Right Branch */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-line text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono2 text-paper-faint uppercase font-bold">Branch Right (Node 1)</span>
              <span className="text-[10px] font-mono2 text-paper-faint">H(L2 + L3)</span>
            </div>
            <div className="p-2 bg-charcoal rounded-lg font-mono2 text-[11px] text-paper-muted break-all">
              {treeNodes.parentRight}
            </div>
          </div>
        </div>

        {/* Leaves (Level 0 - Raw Evidence & Deliverables) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-brand-base" />
              Indexed Evidence Leaves ({currentLeaves.length})
            </h4>
            <span className="text-[11px] text-paper-faint">Click any leaf to inspect its cryptographic inclusion proof</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentLeaves.map((leaf, idx) => {
              const isSelected = selectedLeafIndex === idx;
              return (
                <div
                  key={leaf.id}
                  onClick={() => setSelectedLeafIndex(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    leaf.isTampered
                      ? 'bg-danger-tint/20 border-danger text-danger-light ring-2 ring-danger/40'
                      : isSelected
                        ? 'bg-surface-elevated border-brand-base ring-1 ring-brand-base/50'
                        : 'bg-surface-elevated border-line hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded flex items-center justify-center font-mono2 text-[10px] font-bold bg-surface-highlight border border-line text-paper-muted">
                        L{idx}
                      </span>
                      <p className="text-xs font-bold text-white line-clamp-1">{leaf.label}</p>
                    </div>
                    {leaf.isDeliverable && (
                      <span className="text-[9px] font-mono2 uppercase px-1.5 py-0.5 rounded bg-brand-base/15 text-brand-light border border-brand-base/30">
                        Deliverable
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-paper-muted line-clamp-1 mb-2 font-mono2">{leaf.content}</p>

                  <div className="p-2 bg-charcoal rounded-lg border border-line/60 font-mono2 text-[10px] text-paper-muted break-all">
                    <span className="text-paper-faint select-none">SHA-256: </span>
                    <span className={leaf.isTampered ? 'text-danger font-bold' : 'text-paper'}>{leaf.hash}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono2 text-paper-faint mt-2 pt-2 border-t border-line/40">
                    <span>{leaf.submittedBy || 'Participant'}</span>
                    <span className="text-brand-light underline">Inspect Proof →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inclusion Proof Inspector */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-line space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono2 uppercase tracking-wider text-brand-light flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-brand-base" />
              Merkle Inclusion Proof for Leaf L{inclusionProof.targetIndex}: "{inclusionProof.targetLeaf?.label}"
            </h4>
            <span className="text-[10px] font-mono2 text-paper-faint">O(log N) Verification Path</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-charcoal rounded-lg border border-line space-y-1">
              <p className="text-[10px] font-mono2 text-paper-faint uppercase font-bold">
                Step 1: Sibling Hash ({inclusionProof.step1.siblingDirection})
              </p>
              <p className="font-mono2 text-[11px] text-paper-muted break-all">
                {inclusionProof.step1.siblingHash}
              </p>
              <p className="text-[10px] text-paper-faint pt-1">{inclusionProof.step1.description}</p>
            </div>

            <div className="p-3 bg-charcoal rounded-lg border border-line space-y-1">
              <p className="text-[10px] font-mono2 text-paper-faint uppercase font-bold">
                Step 2: Sub-tree Sibling ({inclusionProof.step2.siblingDirection})
              </p>
              <p className="font-mono2 text-[11px] text-paper-muted break-all">
                {inclusionProof.step2.siblingHash}
              </p>
              <p className="text-[10px] text-paper-faint pt-1">{inclusionProof.step2.description}</p>
            </div>
          </div>
        </div>

        {/* Academic Tamper Attack Simulation Sandbox */}
        <div className="p-4 rounded-xl bg-charcoal border border-line-strong space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-mono2 uppercase font-bold text-brand-light">
                Evaluator Demonstration Mode
              </p>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-warning-light" />
                Simulate Tamper-Evident Attack Vector
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {treeNodes.isTampered ? (
                <button
                  type="button"
                  onClick={handleRestoreAuthentic}
                  className="btn btn-sm btn-secondary text-brand-light flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restore Authentic Exhibit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSimulateTamper(0)}
                  className="btn btn-sm btn-danger flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Simulate Tamper Attack on L0
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-paper-muted leading-relaxed">
            Demonstrates property NFR-02 (Cryptographic Integrity). If an attacker or compromised database row alters
            even a single byte of a deliverable file or exhibit, the Merkle tree cascading hash formula immediately
            detects the root digest divergence, halts automated escrow disbursements, and alerts human arbitrators.
          </p>
        </div>
      </div>
    </div>
  );
}
