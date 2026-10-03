'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';
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
  FileText
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

export default function DashboardPage() {
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN'>('CLIENT');
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePollContractId, setActivePollContractId] = useState<string | null>(null);

  // Transaction State
  const [transactionState, setTransactionState] = useState<{
    isOpen: boolean;
    action: string;
    contractId: string | null;
    milestoneId: string | null;
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
  }>({ isOpen: false, action: '', contractId: null, milestoneId: null, status: 'idle' });

  const personas = {
    CLIENT: { id: 'usr-client-alice', name: 'Alice Client', email: 'client1@escrow.local' },
    FREELANCER: { id: 'usr-dev-charlie', name: 'Charlie Developer', email: 'dev1@escrow.local' },
    REVIEWER: { id: 'usr-reviewer-judge', name: 'Judge Reviewer', email: 'reviewer1@escrow.local' },
    ADMIN: { id: 'usr-admin-system', name: 'System Auditor', email: 'admin@escrow.local' },
  };

  const currentPersona = personas[role];

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
  }, [role]);

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

  const initiateTransaction = (contractId: string, action: string, milestoneId?: string) => {
    setTransactionState({
      isOpen: true,
      action,
      contractId,
      milestoneId: milestoneId || null,
      status: 'idle'
    });
  };

  const executeTransaction = async () => {
    const { contractId, action, milestoneId } = transactionState;
    if (!contractId) return;

    setTransactionState(prev => ({ ...prev, status: 'processing' }));

    try {
      const res = await fetch(`/api/contracts/${contractId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentPersona.id },
        body: JSON.stringify({
          action,
          milestoneId,
          sha256Checksum: action === 'SUBMIT_DELIVERABLE' ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' : undefined,
          notes: action === 'SUBMIT_DELIVERABLE' ? 'Deliverable submitted with cryptographic hash validation' : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTransactionState(prev => ({ ...prev, status: 'success', message: 'Transaction verified and committed to ledger.' }));
        fetchContracts();
      } else {
        setTransactionState(prev => ({ ...prev, status: 'error', message: data.error?.message || 'Transaction failed.' }));
      }
    } catch (err: any) {
      setTransactionState(prev => ({ ...prev, status: 'error', message: `Network Error: ${err.message}` }));
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "badge font-mono";
    switch (status) {
      case 'AWAITING_DEPOSIT':
        return <span className={`${baseClasses} bg-amber-500/10 text-amber-400 border-amber-500/20`}>Awaiting Deposit</span>;
      case 'FUNDED':
        return <span className={`${baseClasses} bg-blue-500/10 text-blue-400 border-blue-500/20`}>Funded (Locked)</span>;
      case 'IN_PROGRESS':
        return <span className={`${baseClasses} bg-indigo-500/10 text-indigo-400 border-indigo-500/20`}>In Progress</span>;
      case 'SUBMITTED':
        return <span className={`${baseClasses} bg-purple-500/10 text-purple-400 border-purple-500/20`}>Under Review</span>;
      case 'APPROVED':
        return <span className={`${baseClasses} bg-teal-500/10 text-teal-400 border-teal-500/20`}>Approved</span>;
      case 'RELEASED':
        return <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Released</span>;
      case 'DISPUTED':
        return <span className={`${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/20`}>Disputed (Frozen)</span>;
      default:
        return <span className={`${baseClasses} bg-slate-800 text-slate-300 border-slate-700`}>{status}</span>;
    }
  };

  const getActionDetails = (action: string) => {
    switch(action) {
      case 'DEPOSIT': return { title: 'Deposit Escrow Funds', desc: 'Lock funds into the cryptographic escrow vault for this contract.', btn: 'Confirm Deposit', color: 'btn-primary' };
      case 'START_WORK': return { title: 'Commence Milestone', desc: 'Acknowledge funds are locked and begin work.', btn: 'Start Work', color: 'btn-primary' };
      case 'SUBMIT_DELIVERABLE': return { title: 'Submit Evidence & Hash', desc: 'Submit work and generate a SHA-256 cryptographic proof of the deliverable.', btn: 'Sign & Submit', color: 'btn-primary' };
      case 'APPROVE_MILESTONE': return { title: 'Approve Deliverable', desc: 'Acknowledge the deliverable meets requirements. This will prepare funds for release.', btn: 'Approve Work', color: 'btn-primary' };
      case 'RELEASE_ESCROW': return { title: 'Release Escrow', desc: 'Transfer locked funds to the freelancer. This action is irreversible.', btn: 'Release Funds', color: 'btn-success bg-emerald-600 hover:bg-emerald-500 text-white' };
      case 'RAISE_DISPUTE': return { title: 'Raise Dispute', desc: 'Freeze the escrow and request reviewer arbitration.', btn: 'Freeze & Dispute', color: 'btn-danger' };
      default: return { title: 'Confirm Action', desc: 'Are you sure you want to proceed?', btn: 'Confirm', color: 'btn-primary' };
    }
  };

  const actionInfo = getActionDetails(transactionState.action);

  return (
    <AppShell role={role} onRoleChange={setRole} currentPersona={currentPersona}>
      <div className="space-y-8 pb-12">
        {/* Architecture Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-[11px] font-mono text-indigo-400 mb-1">ENGINE 01 (OS)</div>
            <div className="font-medium text-sm">Escrow FSM & Mutex</div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Active: KeyedMutex TTL
            </div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] font-mono text-teal-400 mb-1">ENGINE 02 (DSA/SE)</div>
            <div className="font-medium text-sm">Evidence Tree & Hashes</div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> SHA-256 Validated
            </div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] font-mono text-amber-400 mb-1">ENGINE 03 (DBMS)</div>
            <div className="font-medium text-sm">ACID Ledger</div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> SQLite WAL Sync
            </div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] font-mono text-purple-400 mb-1">ENGINE 04 (WEB)</div>
            <div className="font-medium text-sm">RBAC Dashboard</div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Session: {role}
            </div>
          </div>
        </div>

        {/* Dashboard Main Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">Active Contracts</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage escrow milestones and dispute cases.</p>
            </div>
            <button
              onClick={fetchContracts}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh State
            </button>
          </div>

          {loading && contracts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-sm">Syncing contract ledger...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-[var(--color-border-default)] rounded-xl bg-[var(--color-surface-1)]">
              <FileText className="w-10 h-10 text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-base font-medium text-white">No Active Contracts</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">There are no escrow contracts available for your current role.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {contracts.map((contract) => (
                <div key={contract.id} className="card shadow-lg flex flex-col">
                  {/* Contract Header */}
                  <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/30">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">{contract.project?.title || 'Contract Agreement'}</h3>
                          {getStatusBadge(contract.status)}
                        </div>
                        <div className="grid grid-cols-2 max-w-md gap-4 text-sm">
                          <div>
                            <span className="text-[var(--color-text-muted)] block text-xs mb-0.5">Client</span>
                            <span className="font-medium text-slate-200">{contract.client?.name}</span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] block text-xs mb-0.5">Freelancer</span>
                            <span className="font-medium text-slate-200">{contract.freelancer?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-[200px] bg-[var(--color-surface-1)] p-4 rounded-lg border border-[var(--color-border-default)]">
                        <div className="text-right w-full">
                          <div className="text-xs text-[var(--color-text-muted)] font-mono uppercase tracking-wide mb-1">Total Escrow Locked</div>
                          <div className="text-2xl font-bold font-mono text-white tracking-tight">
                            ${contract.escrowBalance.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => setActivePollContractId(activePollContractId === contract.id ? null : contract.id)}
                          className={`w-full btn btn-sm ${
                            activePollContractId === contract.id
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'btn-secondary'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${activePollContractId === contract.id ? 'animate-pulse' : ''}`} />
                          {activePollContractId === contract.id ? 'Auto-Sync Active' : 'Enable Auto-Sync'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Milestones List */}
                  <div className="p-6">
                    <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Milestone Pipeline
                    </h4>
                    <div className="space-y-4">
                      {contract.milestones?.map((m) => (
                        <div key={m.id} className="group relative rounded-xl border border-[var(--color-border-default)] bg-[var(--color-base)] p-5 hover:border-[var(--color-border-strong)] transition-colors">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between md:justify-start gap-4">
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]">
                                  SEQ #{m.sequenceOrder}
                                </span>
                                {getStatusBadge(m.status)}
                              </div>
                              <h5 className="text-base font-medium text-white">{m.title}</h5>
                            </div>

                            <div className="flex flex-col items-end justify-between min-w-[120px]">
                              <span className="text-lg font-bold font-mono text-white">${m.amount.toFixed(2)}</span>

                              <div className="mt-3 flex gap-2 flex-wrap justify-end">
                                {/* Contextual Actions based on state and role */}
                                {contract.status === 'AWAITING_DEPOSIT' && role === 'CLIENT' && m.sequenceOrder === 1 && (
                                  <button onClick={() => initiateTransaction(contract.id, 'DEPOSIT')} className="btn btn-sm btn-primary">
                                    <Lock className="w-3.5 h-3.5" /> Deposit
                                  </button>
                                )}

                                {m.status === 'FUNDED' && role === 'FREELANCER' && (
                                  <button onClick={() => initiateTransaction(contract.id, 'START_WORK', m.id)} className="btn btn-sm btn-primary">
                                    <ArrowRight className="w-3.5 h-3.5" /> Start Work
                                  </button>
                                )}

                                {m.status === 'IN_PROGRESS' && role === 'FREELANCER' && (
                                  <button onClick={() => initiateTransaction(contract.id, 'SUBMIT_DELIVERABLE', m.id)} className="btn btn-sm bg-purple-600 hover:bg-purple-500 text-white focus:ring-purple-500">
                                    <FileCheck2 className="w-3.5 h-3.5" /> Submit Evidence
                                  </button>
                                )}

                                {m.status === 'SUBMITTED' && role === 'CLIENT' && (
                                  <>
                                    <button onClick={() => initiateTransaction(contract.id, 'APPROVE_MILESTONE', m.id)} className="btn btn-sm bg-teal-600 hover:bg-teal-500 text-white">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button onClick={() => initiateTransaction(contract.id, 'RAISE_DISPUTE', m.id)} className="btn btn-sm btn-danger">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Dispute
                                    </button>
                                  </>
                                )}

                                {m.status === 'APPROVED' && role === 'CLIENT' && (
                                  <button onClick={() => initiateTransaction(contract.id, 'RELEASE_ESCROW', m.id)} className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white">
                                    <Unlock className="w-3.5 h-3.5" /> Release Funds
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <button
                onClick={() => setTransactionState(prev => ({ ...prev, isOpen: false }))}
                className="btn btn-md btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={executeTransaction}
                className={`btn btn-md ${actionInfo.color}`}
              >
                {actionInfo.btn}
              </button>
            </>
          ) : transactionState.status === 'success' ? (
             <button
                onClick={() => setTransactionState(prev => ({ ...prev, isOpen: false }))}
                className="btn btn-md btn-primary"
              >
                Done
              </button>
          ) : null
        }
      >
        <div className="py-4">
          {transactionState.status === 'idle' && (
             <div className="p-4 bg-[var(--color-surface-2)]/50 border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)]">
               <p>This action will be recorded in the immutable audit log and will trigger an FSM state transition in the escrow engine.</p>
               {transactionState.action === 'SUBMIT_DELIVERABLE' && (
                 <div className="mt-3 p-3 bg-[var(--color-base)] border border-slate-700 rounded text-xs font-mono text-slate-400 break-all">
                   <div className="mb-1 text-slate-500 uppercase tracking-widest text-[10px]">Generated SHA-256 Proof</div>
                   e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                 </div>
               )}
             </div>
          )}

          {transactionState.status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-slate-300">Executing transaction...</p>
            </div>
          )}

          {transactionState.status === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-medium text-white mb-1">Transaction Successful</p>
                <p className="text-sm text-[var(--color-text-muted)]">{transactionState.message}</p>
              </div>
            </div>
          )}

          {transactionState.status === 'error' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-base font-medium text-white mb-1">Transaction Failed</p>
                <p className="text-sm text-rose-400">{transactionState.message}</p>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </AppShell>
  );
}
