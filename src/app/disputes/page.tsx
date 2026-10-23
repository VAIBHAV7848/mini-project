'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';
import { useRole } from '@/components/layout/RoleContext';
import { calculateFileSha256, formatBytes } from '@/lib/crypto-hash';
import {
  AlertTriangle,
  Loader2,
  FolderOpen,
  ShieldAlert,
  Clock as ClockIcon,
  ExternalLink,
  ShieldCheck,
  Gavel,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Hash,
  Scale,
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  fileUrl: string;
  sha256Checksum: string;
  description: string;
  submittedAt: string;
  submittedBy?: { id?: string; name: string };
}

interface DisputeItem {
  id: string;
  status: string;
  reason: string;
  ruling?: string | null;
  rulingNotes?: string | null;
  createdAt: string;
  raisedBy: { id?: string; name: string; role: string };
  reviewer: { id?: string; name: string } | null;
  evidenceItems?: EvidenceItem[];
  milestone: {
    id?: string;
    title: string;
    amount: number;
    contract: {
      id?: string;
      client: { id?: string; name: string };
      freelancer: { id?: string; name: string };
    };
  };
}

export default function DisputesPage() {
  const { role, currentPersona } = useRole();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRulingModalOpen, setIsRulingModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  // Ruling form state
  const [rulingChoice, setRulingChoice] = useState<'RELEASE_TO_FREELANCER' | 'REFUND_TO_CLIENT'>('RELEASE_TO_FREELANCER');
  const [rulingNotes, setRulingNotes] = useState('');

  // Evidence upload form state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceHash, setEvidenceHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState('');

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/disputes', { headers: { 'x-user-id': currentPersona.id } });
      const data = await res.json();
      if (data.success) setDisputes(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona.id]);

  const handleOpenDispute = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setActionError(null);
    setActionSuccess(null);
    setIsViewModalOpen(true);
  };

  const handleOpenRuling = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setRulingChoice('RELEASE_TO_FREELANCER');
    setRulingNotes('');
    setActionError(null);
    setActionSuccess(null);
    setIsViewModalOpen(false);
    setIsRulingModalOpen(true);
  };

  const handleOpenEvidence = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setEvidenceFile(null);
    setEvidenceHash('');
    setIsHashing(false);
    setEvidenceDescription('');
    setActionError(null);
    setActionSuccess(null);
    setIsViewModalOpen(false);
    setIsEvidenceModalOpen(true);
  };

  const handleEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    setIsHashing(true);
    try {
      const hash = await calculateFileSha256(file);
      setEvidenceHash(hash);
    } catch (err) {
      console.error('Hashing error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  // Submit Binding Ruling (REVIEWER / ADMIN)
  const handleSubmitRuling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (rulingNotes.trim().length < 20) {
      setActionError('Ruling justification must be at least 20 characters.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id}/ruling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          ruling: rulingChoice,
          rulingNotes: rulingNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess('Dispute resolved! Escrow funds have been executed per ruling.');
        fetchDisputes();
        setTimeout(() => {
          setIsRulingModalOpen(false);
          setActionSuccess(null);
        }, 1200);
      } else {
        setActionError(data.error?.message || 'Failed to submit ruling.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Counter-Evidence (CLIENT / FREELANCER)
  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!evidenceHash) {
      setActionError('Please select a file to compute SHA-256 evidence proof.');
      return;
    }
    if (evidenceDescription.trim().length < 5) {
      setActionError('Evidence description must be at least 5 characters.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const fileName = evidenceFile?.name || 'evidence.log';
      const res = await fetch(`/api/disputes/${selectedDispute.id}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          fileUrl: `https://storage.escrow.local/evidence/${selectedDispute.id}/${encodeURIComponent(fileName)}`,
          sha256Checksum: evidenceHash,
          description: evidenceDescription.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess('Evidence uploaded & cryptographically indexed into Merkle Tree!');
        fetchDisputes();
        setTimeout(() => {
          setIsEvidenceModalOpen(false);
          setActionSuccess(null);
        }, 1200);
      } else {
        setActionError(data.error?.message || 'Failed to upload evidence.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="badge badge-warning">Open · Pending Review</span>;
      case 'UNDER_REVIEW':
        return <span className="badge badge-brand">Under Review</span>;
      case 'RESOLVED':
        return <span className="badge badge-success">Resolved</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Arbitration & Evidence</p>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-danger-light" aria-hidden="true" />
              Dispute Cases
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">
              Manage active escrow disputes, inspect Merkle evidence trees, and execute binding rulings.
            </p>
          </div>
        </div>

        {/* Disputes Table */}
        <div aria-live="polite" aria-atomic="true">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line" role="status">
              <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" aria-hidden="true" />
              <p className="text-sm font-medium">Loading dispute cases...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="flex items-center gap-4 p-6 rounded-panel bg-surface border border-line">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-line flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-success-light" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">No active disputes</h3>
                <p className="text-sm text-paper-muted">All active escrow contracts are progressing normally without an open dispute case.</p>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden p-0 border border-line bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" aria-label="Active dispute cases">
                  <thead>
                    <tr className="border-b border-line bg-surface-elevated text-paper-faint">
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Case ID</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Milestone & Reason</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Parties</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Escrow Frozen</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Status</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {disputes.map((dispute) => (
                      <tr key={dispute.id} className="group hover:bg-surface-elevated/50 transition-colors relative">
                        <td className="py-4 px-4 align-top">
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-danger-light opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-mono2 text-sm text-paper-muted">#{dispute.id.slice(0, 8)}</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-1 max-w-md">
                            <span className="font-display font-bold text-white line-clamp-1">{dispute.milestone.title}</span>
                            <span className="text-sm text-paper-muted line-clamp-1">"{dispute.reason}"</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-0.5 text-xs text-paper-muted font-mono2">
                            <span className="truncate max-w-[140px]"><span className="text-paper-faint">Client:</span> {dispute.milestone.contract.client.name}</span>
                            <span className="truncate max-w-[140px]"><span className="text-paper-faint">Dev:</span> {dispute.milestone.contract.freelancer.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top text-right">
                          <span className="font-mono2 font-bold text-danger-light">₹{dispute.milestone.amount.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4 align-top text-right">
                          {getStatusBadge(dispute.status)}
                        </td>
                        <td className="py-4 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDispute(dispute)}
                              className="btn btn-sm btn-secondary"
                            >
                              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> View Case
                            </button>
                            {(role === 'REVIEWER' || role === 'ADMIN') && dispute.status !== 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenRuling(dispute)}
                                className="btn btn-sm btn-primary"
                              >
                                <Gavel className="w-3.5 h-3.5" aria-hidden="true" /> Rule
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Details & Evidence Tree Modal */}
      <Dialog
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedDispute ? `Dispute Case #${selectedDispute.id.slice(0, 8)}` : 'Dispute Details'}
        description="Engine 02 Merkle evidence tree index and cryptographically verified exhibits."
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              {selectedDispute && selectedDispute.status !== 'RESOLVED' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEvidence(selectedDispute)}
                    className="btn btn-md btn-secondary"
                  >
                    <Upload className="w-4 h-4 mr-1.5" /> Submit Evidence
                  </button>
                  {(role === 'REVIEWER' || role === 'ADMIN') && (
                    <button
                      type="button"
                      onClick={() => handleOpenRuling(selectedDispute)}
                      className="btn btn-md btn-primary"
                    >
                      <Gavel className="w-4 h-4 mr-1.5" /> Rule on Dispute
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedDispute && (
          <div className="space-y-5 text-sm py-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-elevated border border-line">
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block">Frozen Escrow</span>
                <span className="font-display text-xl font-bold text-danger-light">₹{selectedDispute.milestone.amount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block">Status</span>
                {getStatusBadge(selectedDispute.status)}
              </div>
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block">Raised By</span>
                <span className="text-white font-medium">{selectedDispute.raisedBy.name} ({selectedDispute.raisedBy.role})</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint mb-1.5">Claim Reason</h4>
              <div className="p-3 bg-surface-elevated border border-line rounded-xl text-paper-muted leading-relaxed">
                "{selectedDispute.reason}"
              </div>
            </div>

            {selectedDispute.ruling && (
              <div>
                <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint mb-1.5">Binding Arbitrator Ruling</h4>
                <div className="p-3 bg-success-tint/20 border border-success/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-success-light" />
                    <span className="font-bold text-white">{selectedDispute.ruling.replace(/_/g, ' ')}</span>
                  </div>
                  {selectedDispute.rulingNotes && (
                    <p className="text-xs text-paper-muted pt-1">{selectedDispute.rulingNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Evidence Items Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-base" /> Evidence Exhibits (SHA-256 Verified)
                </h4>
                <span className="text-[11px] font-mono2 text-paper-faint">
                  {selectedDispute.evidenceItems?.length || 0} exhibit(s)
                </span>
              </div>

              {!selectedDispute.evidenceItems || selectedDispute.evidenceItems.length === 0 ? (
                <div className="p-4 bg-surface-elevated border border-line rounded-xl text-center text-xs text-paper-muted">
                  No counter-evidence submitted yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedDispute.evidenceItems.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-surface-elevated border border-line rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">Exhibit #{idx + 1}: {item.description}</span>
                        {item.submittedBy && (
                          <span className="text-[11px] text-paper-faint">By: {item.submittedBy.name}</span>
                        )}
                      </div>
                      <div className="p-2 bg-charcoal border border-line-strong rounded-lg font-mono2 text-[11px] text-paper-muted break-all">
                        <span className="text-paper-faint select-none">SHA-256: </span>
                        {item.sha256Checksum}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Ruling Modal (REVIEWER / ADMIN) */}
      <Dialog
        isOpen={isRulingModalOpen}
        onClose={() => !actionLoading && setIsRulingModalOpen(false)}
        title="Execute Binding Dispute Ruling"
        description="As an assigned arbitrator, your ruling is final and executes an immediate atomic ledger transfer."
        footer={
          <>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setIsRulingModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="ruling-form"
              disabled={actionLoading}
              className="btn btn-md btn-primary"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Executing Transfer...
                </>
              ) : (
                'Commit Ruling & Disburse Escrow'
              )}
            </button>
          </>
        }
      >
        <form id="ruling-form" onSubmit={handleSubmitRuling} className="space-y-4 py-2">
          {actionError && (
            <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white mb-2">Ruling Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  rulingChoice === 'RELEASE_TO_FREELANCER'
                    ? 'bg-brand-tint/20 border-brand-base ring-1 ring-brand-base'
                    : 'bg-surface-elevated border-line'
                }`}
              >
                <input
                  type="radio"
                  name="rulingChoice"
                  checked={rulingChoice === 'RELEASE_TO_FREELANCER'}
                  onChange={() => setRulingChoice('RELEASE_TO_FREELANCER')}
                  className="hidden"
                />
                <span className="font-bold text-white text-xs">Release to Freelancer</span>
                <span className="text-[11px] text-paper-muted">Deliverable fulfilled contract specification</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  rulingChoice === 'REFUND_TO_CLIENT'
                    ? 'bg-danger-tint/20 border-danger/50 ring-1 ring-danger'
                    : 'bg-surface-elevated border-line'
                }`}
              >
                <input
                  type="radio"
                  name="rulingChoice"
                  checked={rulingChoice === 'REFUND_TO_CLIENT'}
                  onChange={() => setRulingChoice('REFUND_TO_CLIENT')}
                  className="hidden"
                />
                <span className="font-bold text-white text-xs">Refund to Client</span>
                <span className="text-[11px] text-paper-muted">Critical defects or missing core requirements</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-1.5">Arbitration Analysis & Legal Rationale (min 20 chars)</label>
            <textarea
              required
              rows={4}
              value={rulingNotes}
              onChange={(e) => setRulingNotes(e.target.value)}
              placeholder="Detail evidence items reviewed, Merkle tree root verification, and basis for decision..."
              className="w-full bg-surface-elevated border border-line rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-base resize-none"
            />
            <p className="text-[11px] text-paper-faint mt-1">
              {rulingNotes.length}/20 characters minimum
            </p>
          </div>
        </form>
      </Dialog>

      {/* Upload Counter-Evidence Modal (CLIENT / FREELANCER) */}
      <Dialog
        isOpen={isEvidenceModalOpen}
        onClose={() => !actionLoading && setIsEvidenceModalOpen(false)}
        title="Submit Counter-Evidence Exhibit"
        description="All evidence files are hashed in-browser using SHA-256 and appended to the Merkle tree."
        footer={
          <>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setIsEvidenceModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="evidence-form"
              disabled={actionLoading || !evidenceHash || isHashing}
              className="btn btn-md btn-primary"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Uploading Exhibit...
                </>
              ) : (
                'Submit Evidence Exhibit'
              )}
            </button>
          </>
        }
      >
        <form id="evidence-form" onSubmit={handleSubmitEvidence} className="space-y-4 py-2">
          {actionError && (
            <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Evidence Document / Log / Proof File
            </label>
            <div className="relative border-2 border-dashed border-line hover:border-brand-base rounded-xl p-4 text-center transition-colors">
              <input
                type="file"
                onChange={handleEvidenceFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <Upload className="w-5 h-5 text-brand-base" />
                <p className="text-xs text-paper-muted font-medium">
                  {evidenceFile ? evidenceFile.name : 'Click to select evidence file'}
                </p>
                {evidenceFile && (
                  <p className="text-[11px] font-mono2 text-paper-faint">
                    {formatBytes(evidenceFile.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isHashing && (
            <div className="flex items-center gap-2 p-2 bg-charcoal border border-line rounded-xl text-xs text-brand-light">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Computing SHA-256 checksum locally...</span>
            </div>
          )}

          {evidenceHash && !isHashing && (
            <div className="p-3 bg-charcoal border border-line-strong rounded-xl space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-paper-faint flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Evidence SHA-256 Checksum
              </span>
              <p className="text-xs font-mono2 text-success break-all select-all">
                {evidenceHash}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white mb-1.5">Description of Exhibit (min 5 chars)</label>
            <textarea
              required
              rows={3}
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              placeholder="Describe what this exhibit proves (e.g. test logs, specification agreement)..."
              className="w-full bg-surface-elevated border border-line rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-base resize-none"
            />
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
