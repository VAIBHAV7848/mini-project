'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';
import { useRole } from '@/components/layout/RoleContext';
import {
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle2,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  Wallet,
  PlusCircle,
} from 'lucide-react';
import { UpiTopUpModal } from '@/components/payments/UpiTopUpModal';
import { calculateFileSha256, formatBytes } from '@/lib/crypto-hash';
import { MilestoneFsmGraph } from '@/components/milestones/MilestoneFsmGraph';
import { DeliverableInspector } from '@/components/evidence/DeliverableInspector';

interface MilestoneItem {
  id: string;
  title: string;
  amount: number;
  status: string;
  sequenceOrder: number;
  reviewDeadline?: string | null;
  deliverable?: {
    id: string;
    fileName: string;
    fileUrl: string;
    sha256Checksum: string;
    submissionNotes?: string | null;
    submittedAt?: string;
  } | null;
}

interface ContractItem {
  id: string;
  project: { title: string; budget: number };
  client: { name: string };
  freelancer: { name: string };
  totalAmount: number;
  escrowBalance: number;
  status: string;
  milestones: MilestoneItem[];
}

interface AttentionItem {
  contractId: string;
  milestoneId?: string;
  title: string;
  milestone: string;
  amount: number;
  detail: string;
  action?: string;
  actionLabel?: string;
  link?: string;
}

const WAITING_TEXT: Record<string, string> = {
  AWAITING_DEPOSIT: 'Waiting for deposit',
  FUNDED: 'Funds locked — ready to start',
  IN_PROGRESS: 'Work in progress',
  SUBMITTED: 'Waiting for client review',
  APPROVED: 'Approved — ready to release',
  RELEASED: 'Released',
  DISPUTED: 'Frozen — under dispute',
};

const TERMINAL = new Set(['RELEASED', 'REFUNDED']);

function isDone(status: string) {
  return status === 'APPROVED' || status === 'RELEASED' || status === 'REFUNDED';
}

function isCurrent(status: string) {
  return status === 'IN_PROGRESS' || status === 'SUBMITTED' || status === 'FUNDED';
}

export default function DashboardPage() {
  const { role, currentPersona } = useRole();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePollContractId, setActivePollContractId] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const fetchWalletBalance = React.useCallback(async () => {
    if (!currentPersona?.id) return;
    try {
      const res = await fetch('/api/auth/session', {
        headers: { 'x-user-id': currentPersona.id },
      });
      const data = await res.json();
      if (data.success && data.data?.balance !== undefined) {
        setWalletBalance(data.data.balance);
      }
    } catch {
      // fallback
    }
  }, [currentPersona?.id]);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  const [transactionState, setTransactionState] = useState<{
    isOpen: boolean;
    action: string;
    contractId: string | null;
    milestoneId: string | null;
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
    sha256Checksum?: string;
  }>({ isOpen: false, action: '', contractId: null, milestoneId: null, status: 'idle' });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileChecksum, setFileChecksum] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsHashing(true);
    try {
      const hash = await calculateFileSha256(file);
      setFileChecksum(hash);
    } catch (err) {
      console.error('Hashing failed:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts', { headers: { 'x-user-id': currentPersona.id } });
      const data = await res.json();
      if (data.success) setContracts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, currentPersona.id]);

  useEffect(() => {
    if (!activePollContractId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/contracts/${activePollContractId}/milestones`);
        const result = await res.json();
        if (result.success) {
          setContracts((prev) =>
            prev.map((c) =>
              c.id === activePollContractId
                ? { ...c, status: result.data.status, escrowBalance: result.data.escrowBalance, milestones: result.data.milestones }
                : c
            )
          );
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activePollContractId]);

  const attention: AttentionItem[] = useMemo(() => {
    const items: AttentionItem[] = [];
    for (const c of contracts) {
      const projectTitle = c.project?.title || 'Contract Agreement';
      if (role === 'CLIENT') {
        if (c.status === 'AWAITING_DEPOSIT') {
          items.push({
            contractId: c.id,
            title: projectTitle,
            milestone: 'Deposit required',
            amount: c.totalAmount,
            detail: 'Fund escrow to unlock milestone work.',
            action: 'DEPOSIT',
            actionLabel: 'Deposit escrow',
          });
        }
        for (const m of c.milestones ?? []) {
          if (m.status === 'SUBMITTED') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Deliverable submitted — review required.',
              action: 'APPROVE_MILESTONE',
              actionLabel: 'Review submission',
            });
          } else if (m.status === 'APPROVED') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Milestone approved — ready for release.',
              action: 'RELEASE_ESCROW',
              actionLabel: 'Release funds',
            });
          } else if (m.status === 'DISPUTED') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Dispute active — under reviewer arbitration.',
              link: '/disputes',
              actionLabel: 'View dispute',
            });
          }
        }
      } else if (role === 'FREELANCER') {
        for (const m of c.milestones ?? []) {
          if (m.status === 'FUNDED') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Funds locked — work can begin.',
              action: 'START_WORK',
              actionLabel: 'Start work',
            });
          } else if (m.status === 'IN_PROGRESS') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Work in progress — submit evidence for review.',
              action: 'SUBMIT_DELIVERABLE',
              actionLabel: 'Submit deliverable',
            });
          } else if (m.status === 'DISPUTED') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Dispute active — under reviewer arbitration.',
              link: '/disputes',
              actionLabel: 'View dispute',
            });
          }
        }
      } else if (role === 'REVIEWER') {
        for (const m of c.milestones ?? []) {
          if (m.status === 'DISPUTED') {
            items.push({
              contractId: c.id,
              milestoneId: m.id,
              title: projectTitle,
              milestone: `Milestone ${String(m.sequenceOrder).padStart(2, '0')} · ${m.title}`,
              amount: m.amount,
              detail: 'Dispute frozen — ruling required.',
              link: '/disputes',
              actionLabel: 'Open case file',
            });
          }
        }
      }
    }
    return items;
  }, [contracts, role]);

  const initiateTransaction = (contractId: string, action: string, milestoneId?: string) => {
    setSelectedFile(null);
    setFileChecksum('');
    setIsHashing(false);
    setSubmissionNotes('');
    setDisputeReason('');
    setTransactionState({
      isOpen: true,
      action,
      contractId,
      milestoneId: milestoneId || null,
      status: 'idle',
    });
  };

  const executeTransaction = async () => {
    const { contractId, action, milestoneId } = transactionState;
    if (!contractId) return;

    setTransactionState((prev) => ({ ...prev, status: 'processing' }));

    try {
      const payload: Record<string, unknown> = {
        action,
        milestoneId,
      };

      if (action === 'SUBMIT_DELIVERABLE') {
        payload.fileName = selectedFile?.name || 'deliverable-archive.zip';
        payload.fileUrl = `https://storage.escrow.local/deliverables/${milestoneId}/${selectedFile?.name || 'deliverable-archive.zip'}`;
        payload.sha256Checksum = fileChecksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        payload.submissionNotes = submissionNotes || 'Deliverable source and artifacts submitted for review.';
      } else if (action === 'RAISE_DISPUTE') {
        payload.reason = disputeReason || 'Deliverable does not meet documented acceptance criteria.';
      }

      const res = await fetch(`/api/contracts/${contractId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentPersona.id },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setTransactionState((prev) => ({ ...prev, status: 'success', message: 'Transaction verified and committed to ledger.' }));
        fetchContracts();
      } else {
        setTransactionState((prev) => ({ ...prev, status: 'error', message: data.error?.message || 'Transaction failed.' }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setTransactionState((prev) => ({ ...prev, status: 'error', message: `Network Error: ${message}` }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AWAITING_DEPOSIT':
        return <span className="badge bg-brand-base text-charcoal border-transparent font-bold">Awaiting Deposit</span>;
      case 'FUNDED':
        return <span className="badge badge-brand">Funded · Locked</span>;
      case 'IN_PROGRESS':
        return <span className="badge">In Progress</span>;
      case 'SUBMITTED':
        return <span className="badge badge-brand">Under Review</span>;
      case 'APPROVED':
        return <span className="badge badge-success">Approved</span>;
      case 'RELEASED':
        return <span className="badge">Released</span>;
      case 'DISPUTED':
        return <span className="badge badge-danger">Disputed · Frozen</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'DEPOSIT':
        return { title: 'Deposit Escrow Funds', desc: 'Lock funds into escrow for this contract.', btn: 'Confirm Deposit' };
      case 'START_WORK':
        return { title: 'Commence Milestone', desc: 'Acknowledge funds are locked and begin work.', btn: 'Start Work' };
      case 'SUBMIT_DELIVERABLE':
        return { title: 'Submit Evidence & Hash', desc: 'Submit work with a SHA-256 cryptographic proof of the deliverable.', btn: 'Sign & Submit' };
      case 'APPROVE_MILESTONE':
        return { title: 'Approve Deliverable', desc: 'Accept the deliverable. This prepares funds for release.', btn: 'Approve Work' };
      case 'RELEASE_ESCROW':
        return { title: 'Release Escrow', desc: 'Transfer locked funds to the freelancer. This action is irreversible.', btn: 'Release Funds' };
      case 'RAISE_DISPUTE':
        return { title: 'Raise Dispute', desc: 'Freeze the escrow and request reviewer arbitration.', btn: 'Freeze & Dispute' };
      default:
        return { title: 'Confirm Action', desc: 'Are you sure you want to proceed?', btn: 'Confirm' };
    }
  };

  const renderMilestoneActions = (contract: ContractItem, m: MilestoneItem) => {
    if (contract.status === 'AWAITING_DEPOSIT' && role === 'CLIENT' && m.sequenceOrder === 1) {
      return (
        <button type="button" onClick={() => initiateTransaction(contract.id, 'DEPOSIT')} className="btn btn-sm btn-primary">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Deposit
        </button>
      );
    }
    if (m.status === 'FUNDED' && role === 'FREELANCER') {
      return (
        <button type="button" onClick={() => initiateTransaction(contract.id, 'START_WORK', m.id)} className="btn btn-sm btn-secondary">
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /> Start Work
        </button>
      );
    }
    if (m.status === 'IN_PROGRESS' && role === 'FREELANCER') {
      return (
        <button type="button" onClick={() => initiateTransaction(contract.id, 'SUBMIT_DELIVERABLE', m.id)} className="btn btn-sm btn-secondary">
          <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" /> Submit Evidence
        </button>
      );
    }
    if (m.status === 'SUBMITTED' && role === 'CLIENT') {
      return (
        <div className="flex gap-2 flex-wrap justify-end">
          <button type="button" onClick={() => initiateTransaction(contract.id, 'APPROVE_MILESTONE', m.id)} className="btn btn-sm btn-secondary">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Approve
          </button>
          <button type="button" onClick={() => initiateTransaction(contract.id, 'RAISE_DISPUTE', m.id)} className="btn btn-sm btn-danger">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Dispute
          </button>
        </div>
      );
    }
    if (m.status === 'APPROVED' && role === 'CLIENT') {
      return (
        <button type="button" onClick={() => initiateTransaction(contract.id, 'RELEASE_ESCROW', m.id)} className="btn btn-sm btn-primary">
          <Unlock className="w-3.5 h-3.5" aria-hidden="true" /> Release Funds
        </button>
      );
    }
    if (m.status === 'DISPUTED' && (role === 'REVIEWER' || role === 'ADMIN')) {
      return (
        <Link href="/disputes" className="btn btn-sm btn-secondary">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Open Case File
        </Link>
      );
    }
    return null;
  };

  const actionInfo = getActionDetails(transactionState.action);
  const formatRupee = (amount: number) => `₹${amount.toFixed(2)}`;
  const totalProtected = contracts.reduce((sum, c) => sum + c.escrowBalance, 0);

  const hour = new Date().getHours();
  const daypart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const firstName = currentPersona.name.split(' ')[0];

  const currentMilestoneOf = (c: ContractItem) =>
    (c.milestones ?? []).find((m) => !TERMINAL.has(m.status)) ?? (c.milestones ?? [])[(c.milestones ?? []).length - 1];

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Overview */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Overview</p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-paper">
              Good {daypart}, {firstName}
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">
              <span className="font-mono2 text-paper">{contracts.length}</span> active contract{contracts.length === 1 ? '' : 's'}
              <span className="mx-1.5 text-paper-faint">·</span>
              <span className="font-mono2 text-paper">{formatRupee(totalProtected)}</span> protected
            </p>
          </div>
          <button type="button" onClick={fetchContracts} disabled={loading} className="btn btn-sm btn-ghost">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-base' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sr-only sm:hidden">Refresh data</span>
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Left: attention + contracts */}
          <div className="space-y-8 min-w-0">
            {/* Needs attention */}
            <section>
              <h2 className="eyebrow mb-3">Needs your attention</h2>
              {attention.length === 0 ? (
                <div className="text-center py-12 px-6 bg-surface border border-dashed border-line rounded-panel">
                  <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-5 h-5 text-paper-faint" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base font-bold text-paper">All clear</h3>
                  <p className="text-sm text-paper-muted mt-1 max-w-sm mx-auto">
                    Nothing needs your attention right now.
                  </p>
                </div>
              ) : (
                <ul className="panel p-0 list-none m-0">
                  {attention.map((item, idx) => (
                    <li
                      key={`${item.contractId}-${item.milestoneId ?? 'contract'}`}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 ${
                        idx !== attention.length - 1 ? 'border-b border-line' : ''
                      } hover:bg-surface-elevated/50 transition-colors`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-base shrink-0 hidden sm:block" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        {item.action === 'DEPOSIT' ? (
                          <p className="font-mono2 text-[11px] text-brand-base uppercase tracking-wider mb-1 font-bold">Awaiting deposit</p>
                        ) : (
                          <p className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider mb-1">{item.milestone}</p>
                        )}
                        <p className="text-base font-bold text-paper truncate">{item.title}</p>
                        <p className="text-sm text-paper-muted mt-0.5">
                          <span className="font-mono2 text-paper">{formatRupee(item.amount)}</span> · {item.action === 'DEPOSIT' ? 'Escrow is not yet funded.' : item.detail}
                        </p>
                      </div>
                      {item.link ? (
                        <Link href={item.link} className="btn btn-sm btn-secondary shrink-0" aria-label={`${item.actionLabel} for ${item.title}`}>
                          {item.actionLabel}
                        </Link>
                      ) : (
                        item.action && (
                          <button
                            type="button"
                            onClick={() => initiateTransaction(item.contractId, item.action as string, item.milestoneId)}
                            className={`btn btn-sm shrink-0 ${
                              item.action === 'DEPOSIT' || item.action === 'RELEASE_ESCROW'
                                ? 'btn-primary'
                                : 'btn-secondary'
                            }`}
                            aria-label={`${item.actionLabel} for ${item.title}`}
                          >
                            {item.actionLabel}
                          </button>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Active contracts */}
            <section>
              <h2 className="eyebrow mb-3">Active contracts</h2>
              {loading && contracts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line" role="status" aria-live="polite">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-base mb-3" aria-hidden="true" />
                  <p className="text-sm font-medium">Syncing contract ledger…</p>
                </div>
              ) : contracts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
                  <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-5 h-5 text-paper-faint" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base font-bold text-paper">No active contracts</h3>
                  <p className="text-sm text-paper-muted mt-1 max-w-sm text-center">
                    There are no escrow contracts assigned to your role right now.
                  </p>
                </div>
              ) : (
                <ul className="space-y-6 list-none p-0 m-0">
                  {contracts.map((contract) => (
                    <li key={contract.id}>
                      <article className="card p-0 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-line bg-surface-highlight/30">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-display text-xl font-bold text-paper leading-snug">
                                {contract.project?.title || 'Contract Agreement'}
                              </h3>
                              <p className="text-sm text-paper-muted mt-1 font-medium">
                                {contract.client?.name} <span aria-hidden="true" className="mx-1 text-paper-faint">·</span> {contract.freelancer?.name}
                              </p>
                            </div>
                            <div className="shrink-0">{getStatusBadge(contract.status)}</div>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6">
                          <h4 className="text-[11px] uppercase tracking-wider font-bold text-paper-faint mb-5 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                            Milestone Progression
                          </h4>
                          <ol className="list-none p-0 m-0">
                            {(contract.milestones ?? []).map((m, idx, arr) => {
                              const done = isDone(m.status);
                              const current = isCurrent(m.status);
                              const last = idx === arr.length - 1;
                              return (
                                <li key={m.id} className="flex gap-4">
                                  <div className="flex flex-col items-center" aria-hidden="true">
                                    <span
                                      className={`w-3 h-3 rounded-full mt-1.5 shrink-0 transition-colors ${
                                        done
                                          ? 'bg-success'
                                          : current
                                            ? 'bg-brand-base ring-4 ring-brand-tint'
                                            : 'border-2 border-line bg-surface'
                                      }`}
                                    />
                                    {!last && <span className={`w-0.5 flex-1 my-1.5 min-h-6 ${done ? 'bg-success/30' : 'bg-line'}`} />}
                                  </div>
                                  <div className={`flex-1 min-w-0 ${last ? '' : 'pb-6'}`}>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-mono2 text-[11px] text-paper-muted mb-1">
                                          M-{String(m.sequenceOrder).padStart(2, '0')}
                                        </p>
                                        <p className={`text-base font-bold leading-snug ${done ? 'text-paper-muted line-through decoration-paper-faint/50' : 'text-paper'}`}>
                                          <span className={done ? 'sr-only' : 'hidden'}>Completed: </span>
                                          {m.title}
                                        </p>
                                        <p className="text-[13px] text-paper-muted mt-1">
                                          <span className="font-mono2 text-paper">{formatRupee(m.amount)}</span>
                                          <span className="mx-1.5 text-paper-faint">·</span>
                                          {WAITING_TEXT[m.status] ?? m.status}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {getStatusBadge(m.status)}
                                        {renderMilestoneActions(contract, m)}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>

                          {(() => {
                            const activeM = currentMilestoneOf(contract);
                            return activeM ? (
                              <div className="mt-6 pt-5 border-t border-line">
                                <MilestoneFsmGraph
                                  currentState={activeM.status}
                                  milestoneTitle={`Milestone ${String(activeM.sequenceOrder).padStart(2, '0')}: ${activeM.title}`}
                                  reviewDeadline={activeM.reviewDeadline}
                                  userRole={role}
                                />
                              </div>
                            ) : null;
                          })()}
                        </div>

                        <div className="px-5 sm:px-6 py-4 bg-surface-highlight/30 border-t border-line flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-sm text-paper-muted">
                            <ShieldCheck className="w-4 h-4 text-brand-base" aria-hidden="true" />
                            <span>Escrow <span className="font-mono2 font-bold text-paper ml-1">{formatRupee(contract.escrowBalance)}</span> protected</span>
                          </div>
                          <button
                            type="button"
                            aria-label={activePollContractId === contract.id ? 'Disable auto-sync' : 'Enable auto-sync'}
                            aria-pressed={activePollContractId === contract.id}
                            onClick={() => setActivePollContractId(activePollContractId === contract.id ? null : contract.id)}
                            className={`btn btn-sm ${activePollContractId === contract.id ? 'btn-secondary text-brand-light' : 'btn-ghost'}`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${activePollContractId === contract.id ? 'animate-pulse' : ''}`} aria-hidden="true" />
                            <span className="hidden sm:inline">{activePollContractId === contract.id ? 'Auto-sync on' : 'Auto-sync'}</span>
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right: escrow rail */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            {role === 'CLIENT' && (
              <section className="panel p-0 overflow-hidden border border-brand-base/30 shadow-md">
                <div className="p-6 bg-brand-tint/20 border-b border-line">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="eyebrow flex items-center gap-1.5 text-brand-base">
                      <Wallet className="w-3.5 h-3.5" /> Marketplace Wallet
                    </h2>
                    <span className="badge badge-brand text-[10px]">Liquid</span>
                  </div>
                  <p className="font-display text-4xl font-bold tracking-tight text-paper mb-2">
                    {formatRupee(walletBalance)}
                  </p>
                  <p className="text-xs text-paper-muted">
                    Available to fund project milestones.
                  </p>
                </div>
                <div className="p-4 bg-surface-elevated">
                  <button
                    type="button"
                    onClick={() => setIsTopUpOpen(true)}
                    className="w-full btn btn-sm btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Balance (UPI QR)</span>
                  </button>
                </div>
              </section>
            )}

            <section className="panel p-0 overflow-hidden">
              <div className="p-6 bg-surface-highlight/20 border-b border-line">
                <h2 className="eyebrow mb-4">Total Escrow</h2>
                <p className="font-display text-4xl font-bold tracking-tight text-paper mb-1">
                  {formatRupee(totalProtected)}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-base flex items-center gap-1.5">
                  <Lock className="w-3 h-3" aria-hidden="true" /> Locked & Protected
                </p>
              </div>
              <div className="p-6 space-y-4">
                {contracts.length === 0 ? (
                  <p className="text-sm text-paper-muted">No funds under escrow.</p>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-4">
                    {contracts.map((c) => {
                      const current = currentMilestoneOf(c);
                      return (
                        <li key={c.id} className="group">
                          <div className="flex items-baseline justify-between gap-3 mb-1">
                            <p className="text-[13px] font-bold text-paper truncate group-hover:text-brand-light transition-colors">
                              {c.project?.title || 'Contract Agreement'}
                            </p>
                            <p className="text-[13px] font-mono2 font-bold text-paper shrink-0">
                              {formatRupee(c.escrowBalance)}
                            </p>
                          </div>
                          {current && (
                            <p className="text-[11px] text-paper-muted leading-relaxed">
                              M-{String(current.sequenceOrder).padStart(2, '0')} · {current.title}
                              <br />
                              <span className="text-paper-faint">{(WAITING_TEXT[current.status] ?? current.status)}</span>
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Transaction Dialog */}
      <Dialog
        isOpen={transactionState.isOpen}
        onClose={() => {
          if (transactionState.status !== 'processing') {
            setTransactionState({ isOpen: false, action: '', contractId: null, milestoneId: null, status: 'idle' });
          }
        }}
        title={actionInfo.title}
        description={actionInfo.desc}
        footer={
          transactionState.status === 'idle' || transactionState.status === 'error' ? (
            <>
              <button type="button" onClick={() => setTransactionState((prev) => ({ ...prev, isOpen: false }))} className="btn btn-md btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={executeTransaction}
                disabled={
                  (transactionState.action === 'SUBMIT_DELIVERABLE' && (!fileChecksum || isHashing)) ||
                  (transactionState.action === 'RAISE_DISPUTE' && disputeReason.trim().length < 15)
                }
                className={`btn btn-md ${
                  transactionState.action === 'RAISE_DISPUTE' ? 'btn-danger-solid' : 'btn-primary'
                } ${
                  (transactionState.action === 'SUBMIT_DELIVERABLE' && (!fileChecksum || isHashing)) ||
                  (transactionState.action === 'RAISE_DISPUTE' && disputeReason.trim().length < 15)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {actionInfo.btn}
              </button>
            </>
          ) : transactionState.status === 'success' ? (
            <button type="button" onClick={() => setTransactionState((prev) => ({ ...prev, isOpen: false }))} className="btn btn-md btn-primary">
              Done
            </button>
          ) : null
        }
      >
        <div className="py-2" aria-live="polite">
          {transactionState.status === 'idle' && (
            <div className="p-4 bg-surface-elevated border border-line rounded-lg text-sm text-paper-muted">
              <p>This action is recorded in the immutable audit log and triggers a state transition in the escrow engine.</p>

              {transactionState.action === 'SUBMIT_DELIVERABLE' && (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-paper">
                    Deliverable File (SHA-256 Calculated Locally)
                  </label>
                  <div className="relative border-2 border-dashed border-line hover:border-brand-base rounded-lg p-4 text-center transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <Upload className="w-5 h-5 text-brand-base" />
                      <p className="text-xs text-paper-muted font-medium">
                        {selectedFile ? selectedFile.name : 'Click or drag deliverable file here'}
                      </p>
                      {selectedFile && (
                        <p className="text-[11px] font-mono2 text-paper-faint">
                          {formatBytes(selectedFile.size)}
                        </p>
                      )}
                    </div>
                  </div>

                  {isHashing && (
                    <div className="flex items-center gap-2 p-2 bg-charcoal border border-line rounded text-xs text-brand-light">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Computing SHA-256 checksum in browser memory...</span>
                    </div>
                  )}

                  {fileChecksum && !isHashing && (
                    <div className="p-3 bg-charcoal border border-line-strong rounded-md space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-paper-faint flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                        Verified SHA-256 Proof (Engine 02)
                      </p>
                      <p className="text-xs font-mono2 text-success break-all select-all">
                        {fileChecksum}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-paper-muted mb-1">
                      Submission Notes (Optional)
                    </label>
                    <textarea
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="e.g. Completed initial design deliverables with test suite pass."
                      rows={2}
                      className="w-full bg-surface-elevated border border-line rounded px-3 py-1.5 text-xs text-paper placeholder-paper-faint focus:outline-none focus:border-brand-base"
                    />
                  </div>
                </div>
              )}

              {transactionState.action === 'APPROVE_MILESTONE' && (() => {
                const targetC = contracts.find((c) => c.id === transactionState.contractId);
                const targetM = targetC?.milestones.find((m) => m.id === transactionState.milestoneId);
                return (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-charcoal border border-line rounded-lg space-y-1 text-xs">
                      <span className="text-[10px] font-mono2 uppercase tracking-wider text-paper-faint block">
                        Submitted Deliverable Artifact
                      </span>
                      <p className="font-bold text-paper text-sm">
                        {targetM?.deliverable?.fileName || 'milestone-deliverable-v1.zip'}
                      </p>
                      {targetM?.deliverable?.submissionNotes && (
                        <p className="text-paper-muted text-xs italic pt-1">
                          "{targetM.deliverable.submissionNotes}"
                        </p>
                      )}
                    </div>

                    {targetM?.deliverable?.sha256Checksum ? (
                      <DeliverableInspector
                        expectedChecksum={targetM.deliverable.sha256Checksum}
                        milestoneTitle={targetM.title}
                        fileName={targetM.deliverable.fileName}
                      />
                    ) : (
                      <div className="p-3 bg-charcoal border border-line rounded-lg text-xs text-paper-muted">
                        Reviewing deliverable artifacts before triggering fund release.
                      </div>
                    )}
                  </div>
                );
              })()}

              {transactionState.action === 'RAISE_DISPUTE' && (
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold text-paper">
                    Reason for Dispute (Minimum 15 characters)
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe specific acceptance criteria defects, missing artifacts, or deadline breaches..."
                    rows={3}
                    className="w-full bg-surface-elevated border border-line rounded p-2.5 text-xs text-paper placeholder-paper-faint focus:outline-none focus:border-danger"
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={disputeReason.trim().length >= 15 ? 'text-success' : 'text-paper-faint'}>
                      {disputeReason.trim().length}/15 chars required
                    </span>
                    {disputeReason.trim().length < 15 && (
                      <span className="text-danger-light">Must describe reason to freeze escrow</span>
                    )}
                  </div>
                </div>
              )}

              {transactionState.action === 'RELEASE_ESCROW' && (
                <div className="mt-4 p-3 bg-warning-tint border border-warning/30 rounded-md text-xs font-medium text-warning-light flex items-start gap-2" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Escrow release is irreversible. Funds transfer immediately.</span>
                </div>
              )}
            </div>
          )}

          {transactionState.status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4" role="status" aria-live="polite">
              <Loader2 className="w-8 h-8 text-brand-base animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium text-paper-muted">Processing transaction on ledger…</p>
            </div>
          )}

          {transactionState.status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center" role="alert" aria-live="assertive">
              <div className="w-14 h-14 rounded-full bg-success-tint flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-bold text-paper mb-1">Transaction successful</p>
                <p className="text-sm text-paper-muted max-w-[280px] mx-auto">{transactionState.message}</p>
              </div>
            </div>
          )}

          {transactionState.status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center" role="alert" aria-live="assertive">
              <div className="w-14 h-14 rounded-full bg-danger-tint flex items-center justify-center">
                <XCircle className="w-7 h-7 text-danger-light" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-bold text-paper mb-1">Transaction failed</p>
                <p className="text-sm text-danger-light max-w-[280px] mx-auto">{transactionState.message}</p>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      <UpiTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={(newBal) => {
          setWalletBalance(newBal);
          fetchContracts();
        }}
      />
    </AppShell>
  );
}

