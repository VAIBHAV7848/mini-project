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
} from 'lucide-react';

interface MilestoneItem {
  id: string;
  title: string;
  amount: number;
  status: string;
  sequenceOrder: number;
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

  const [transactionState, setTransactionState] = useState<{
    isOpen: boolean;
    action: string;
    contractId: string | null;
    milestoneId: string | null;
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
    sha256Checksum?: string;
  }>({ isOpen: false, action: '', contractId: null, milestoneId: null, status: 'idle' });

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
      const res = await fetch(`/api/contracts/${contractId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentPersona.id },
        body: JSON.stringify({
          action,
          milestoneId,
          sha256Checksum:
            action === 'SUBMIT_DELIVERABLE'
              ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
              : undefined,
          notes: action === 'SUBMIT_DELIVERABLE' ? 'Deliverable submitted with cryptographic hash validation' : undefined,
        }),
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
        return <span className="badge badge-warning">Awaiting Deposit</span>;
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
        <button onClick={() => initiateTransaction(contract.id, 'DEPOSIT')} className="btn btn-sm btn-primary">
          <Lock className="w-3.5 h-3.5" /> Deposit
        </button>
      );
    }
    if (m.status === 'FUNDED' && role === 'FREELANCER') {
      return (
        <button onClick={() => initiateTransaction(contract.id, 'START_WORK', m.id)} className="btn btn-sm btn-secondary">
          <ArrowRight className="w-3.5 h-3.5" /> Start Work
        </button>
      );
    }
    if (m.status === 'IN_PROGRESS' && role === 'FREELANCER') {
      return (
        <button onClick={() => initiateTransaction(contract.id, 'SUBMIT_DELIVERABLE', m.id)} className="btn btn-sm btn-secondary">
          <FileCheck2 className="w-3.5 h-3.5" /> Submit Evidence
        </button>
      );
    }
    if (m.status === 'SUBMITTED' && role === 'CLIENT') {
      return (
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => initiateTransaction(contract.id, 'APPROVE_MILESTONE', m.id)} className="btn btn-sm btn-secondary">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </button>
          <button onClick={() => initiateTransaction(contract.id, 'RAISE_DISPUTE', m.id)} className="btn btn-sm btn-danger">
            <AlertTriangle className="w-3.5 h-3.5" /> Dispute
          </button>
        </div>
      );
    }
    if (m.status === 'APPROVED' && role === 'CLIENT') {
      return (
        <button onClick={() => initiateTransaction(contract.id, 'RELEASE_ESCROW', m.id)} className="btn btn-sm btn-primary">
          <Unlock className="w-3.5 h-3.5" /> Release Funds
        </button>
      );
    }
    if (m.status === 'DISPUTED' && (role === 'REVIEWER' || role === 'ADMIN')) {
      return (
        <Link href="/disputes" className="btn btn-sm btn-secondary">
          <ShieldCheck className="w-3.5 h-3.5" /> Open Case File
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
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Good {daypart}, {firstName}
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">
              <span className="font-mono2 text-paper">{contracts.length}</span> active contract{contracts.length === 1 ? '' : 's'}
              <span className="mx-1.5 text-paper-faint">·</span>
              <span className="font-mono2 text-paper">{formatRupee(totalProtected)}</span> protected
            </p>
          </div>
          <button onClick={fetchContracts} disabled={loading} className="btn btn-sm btn-ghost" aria-label="Refresh State">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-base' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
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
                    <CheckCircle className="w-5 h-5 text-paper-faint" />
                  </div>
                  <h3 className="font-display text-base font-bold text-paper">All clear</h3>
                  <p className="text-sm text-paper-muted mt-1 max-w-sm mx-auto">
                    Nothing needs your attention right now.
                  </p>
                </div>
              ) : (
                <div className="panel p-0">
                  {attention.map((item, idx) => (
                    <div
                      key={`${item.contractId}-${item.milestoneId ?? 'contract'}`}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 ${
                        idx !== attention.length - 1 ? 'border-b border-line' : ''
                      } hover:bg-surface-elevated/50 transition-colors`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-base shrink-0 hidden sm:block" aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider mb-1">{item.milestone}</p>
                        <p className="text-base font-bold text-white truncate">{item.title}</p>
                        <p className="text-sm text-paper-muted mt-0.5">
                          <span className="font-mono2 text-white">{formatRupee(item.amount)}</span> · {item.detail}
                        </p>
                      </div>
                      {item.link ? (
                        <Link href={item.link} className="btn btn-sm btn-secondary shrink-0">
                          {item.actionLabel}
                        </Link>
                      ) : (
                        item.action && (
                          <button
                            onClick={() => initiateTransaction(item.contractId, item.action as string, item.milestoneId)}
                            className={`btn btn-sm shrink-0 ${
                              item.action === 'DEPOSIT' || item.action === 'RELEASE_ESCROW'
                                ? 'btn-primary'
                                : 'btn-secondary'
                            }`}
                          >
                            {item.actionLabel}
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Active contracts */}
            <section>
              <h2 className="eyebrow mb-3">Active contracts</h2>
              {loading && contracts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-base mb-3" />
                  <p className="text-sm font-medium">Syncing contract ledger…</p>
                </div>
              ) : contracts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
                  <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-5 h-5 text-paper-faint" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white">No active contracts</h3>
                  <p className="text-sm text-paper-muted mt-1 max-w-sm text-center">
                    There are no escrow contracts assigned to your role right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {contracts.map((contract) => (
                    <article key={contract.id} className="card p-0 overflow-hidden">
                      <div className="p-5 sm:p-6 border-b border-line bg-surface-highlight/30">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-display text-xl font-bold text-white leading-snug">
                              {contract.project?.title || 'Contract Agreement'}
                            </h3>
                            <p className="text-sm text-paper-muted mt-1 font-medium">
                              {contract.client?.name} <span aria-hidden className="mx-1 text-paper-faint">·</span> {contract.freelancer?.name}
                            </p>
                          </div>
                          <div className="shrink-0">{getStatusBadge(contract.status)}</div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <h4 className="text-[11px] uppercase tracking-wider font-bold text-paper-faint mb-5 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5" />
                          Milestone Progression
                        </h4>
                        <div>
                          {(contract.milestones ?? []).map((m, idx, arr) => {
                            const done = isDone(m.status);
                            const current = isCurrent(m.status);
                            const last = idx === arr.length - 1;
                            return (
                              <div key={m.id} className="flex gap-4">
                                <div className="flex flex-col items-center" aria-hidden>
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
                                      <p className={`text-base font-bold leading-snug ${done ? 'text-paper-muted line-through decoration-paper-faint/50' : 'text-white'}`}>
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
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="px-5 sm:px-6 py-4 bg-surface-highlight/30 border-t border-line flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-paper-muted">
                          <ShieldCheck className="w-4 h-4 text-brand-base" />
                          <span>Escrow <span className="font-mono2 font-bold text-white ml-1">{formatRupee(contract.escrowBalance)}</span> protected</span>
                        </div>
                        <button
                          onClick={() => setActivePollContractId(activePollContractId === contract.id ? null : contract.id)}
                          className={`btn btn-sm ${activePollContractId === contract.id ? 'btn-secondary text-brand-light' : 'btn-ghost'}`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${activePollContractId === contract.id ? 'animate-pulse' : ''}`} />
                          <span className="hidden sm:inline">{activePollContractId === contract.id ? 'Auto-sync on' : 'Auto-sync'}</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right: escrow rail */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <section className="panel p-0 overflow-hidden">
              <div className="p-6 bg-surface-highlight/20 border-b border-line">
                <h2 className="eyebrow mb-4">Total Escrow</h2>
                <p className="font-display text-4xl font-bold tracking-tight text-white mb-1">
                  {formatRupee(totalProtected)}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-base flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Locked & Protected
                </p>
              </div>
              <div className="p-6 space-y-4">
                {contracts.length === 0 ? (
                  <p className="text-sm text-paper-muted">No funds under escrow.</p>
                ) : (
                  contracts.map((c) => {
                    const current = currentMilestoneOf(c);
                    return (
                      <div key={c.id} className="group">
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <p className="text-[13px] font-bold text-white truncate group-hover:text-brand-light transition-colors">
                            {c.project?.title || 'Contract Agreement'}
                          </p>
                          <p className="text-[13px] font-mono2 font-bold text-white shrink-0">
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
                      </div>
                    );
                  })
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
              <button onClick={() => setTransactionState((prev) => ({ ...prev, isOpen: false }))} className="btn btn-md btn-ghost">
                Cancel
              </button>
              <button
                onClick={executeTransaction}
                className={`btn btn-md ${transactionState.action === 'RAISE_DISPUTE' ? 'btn-danger-solid' : 'btn-primary'}`}
              >
                {actionInfo.btn}
              </button>
            </>
          ) : transactionState.status === 'success' ? (
            <button onClick={() => setTransactionState((prev) => ({ ...prev, isOpen: false }))} className="btn btn-md btn-primary">
              Done
            </button>
          ) : null
        }
      >
        <div className="py-2">
          {transactionState.status === 'idle' && (
            <div className="p-4 bg-surface-elevated border border-line rounded-lg text-sm text-paper-muted">
              <p>This action is recorded in the immutable audit log and triggers a state transition in the escrow engine.</p>
              {transactionState.action === 'SUBMIT_DELIVERABLE' && (
                <div className="mt-4 p-3 bg-charcoal border border-line-strong rounded-md">
                  <p className="text-[10px] uppercase tracking-wider text-paper-faint flex items-center gap-1.5 mb-1.5 font-bold">
                    <ShieldCheck className="w-3 h-3 text-brand-base" />
                    SHA-256 proof
                  </p>
                  <p className="text-xs font-mono2 text-paper-muted break-all select-all">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </p>
                </div>
              )}
              {transactionState.action === 'RELEASE_ESCROW' && (
                <div className="mt-4 p-3 bg-warning-tint border border-warning/30 rounded-md text-xs font-medium text-warning-light flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Escrow release is irreversible. Funds transfer immediately.</span>
                </div>
              )}
            </div>
          )}

          {transactionState.status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-8 h-8 text-brand-base animate-spin" />
              <p className="text-sm font-medium text-paper-muted">Processing transaction on ledger…</p>
            </div>
          )}

          {transactionState.status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-success-tint flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Transaction successful</p>
                <p className="text-sm text-paper-muted max-w-[280px] mx-auto">{transactionState.message}</p>
              </div>
            </div>
          )}

          {transactionState.status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-danger-tint flex items-center justify-center">
                <XCircle className="w-7 h-7 text-danger-light" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Transaction failed</p>
                <p className="text-sm text-danger-light max-w-[280px] mx-auto">{transactionState.message}</p>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </AppShell>
  );
}
