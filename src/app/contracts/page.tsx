'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { ShieldCheck, Loader2, FolderOpen, ExternalLink, Wallet, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: string;
  sequenceOrder: number;
  reviewDeadline: string | null;
}

interface Contract {
  id: string;
  status: string;
  totalAmount: number;
  escrowBalance: number;
  createdAt: string;
  project: { title: string; budget: number };
  client: { id: string; name: string };
  freelancer: { id: string; name: string };
  milestones: Milestone[];
}

export default function ContractsPage() {
  const { role, currentPersona } = useRole();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/contracts', {
          headers: { 'x-user-id': currentPersona.id },
        });
        const data = await res.json();
        if (data.success) {
          setContracts(data.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentPersona?.id) {
      fetchData();
    }
  }, [currentPersona.id]);

  const totalContracts = contracts.length;
  const totalEscrowLocked = contracts.reduce((sum, c) => sum + (c.escrowBalance || 0), 0);
  const activeContracts = contracts.filter(
    (c) => !['RELEASED', 'REFUNDED'].includes(c.status)
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AWAITING_DEPOSIT':
        return <span className="badge badge-warning">Awaiting Deposit</span>;
      case 'FUNDED':
        return <span className="badge badge-brand">Funded</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-brand">In Progress</span>;
      case 'UNDER_REVIEW':
        return <span className="badge badge-warning">Under Review</span>;
      case 'RELEASED':
        return <span className="badge badge-success">Released</span>;
      case 'REFUNDED':
        return <span className="badge">Refunded</span>;
      case 'DISPUTED':
        return (
          <span
            className="badge"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
          >
            Disputed
          </span>
        );
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
            <p className="eyebrow mb-2">Escrow Management</p>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-base" aria-hidden="true" />
              Contracts
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">
              Manage your active contracts and escrow balances.
            </p>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-panel border border-line p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-line flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-paper-muted" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] text-paper-muted font-medium mb-1">Total Contracts</p>
              <p className="font-display text-lg font-bold text-white">{totalContracts}</p>
            </div>
          </div>
          <div className="bg-surface rounded-panel border border-line p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-line flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-brand-base" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] text-paper-muted font-medium mb-1">Total Escrow Locked</p>
              <p className="font-mono2 text-lg font-bold text-white">
                ₹{totalEscrowLocked.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-surface rounded-panel border border-line p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-line flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-paper-muted" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] text-paper-muted font-medium mb-1">Active Contracts</p>
              <p className="font-display text-lg font-bold text-white">{activeContracts}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div aria-live="polite">
          {loading ? (
            <div
              className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line"
              role="status"
            >
              <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" aria-hidden="true" />
              <p className="text-sm font-medium">Loading...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-line">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-line flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-paper-faint" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">No contracts found</h3>
                <p className="text-[13px] text-paper-muted">You do not have any contracts yet.</p>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-panel border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse divide-y divide-line">
                  <thead>
                    <tr>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-left p-4">Contract ID</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-left p-4">Project</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-left p-4">Counterparty</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right p-4">Total / Escrow</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-center p-4">Milestones</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-center p-4">Status</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-left p-4">Created</th>
                      <th scope="col" className="bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {contracts.map((contract) => {
                      const counterparty =
                        role === 'CLIENT' ? contract.freelancer : contract.client;

                      const completedMilestones = contract.milestones?.filter(
                        (m) => m.status === 'RELEASED' || m.status === 'COMPLETED'
                      ).length || 0;
                      const totalMilestones = contract.milestones?.length || 0;

                      return (
                        <tr key={contract.id} className="hover:bg-surface-elevated/50 transition-colors">
                          <td className="p-4 align-middle">
                            <span className="font-mono2 text-[13px] text-paper-muted">
                              {contract.id.substring(0, 8)}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <p className="text-sm font-medium text-white line-clamp-1">{contract.project?.title}</p>
                          </td>
                          <td className="p-4 align-middle">
                            <p className="text-[13px] text-paper-muted">{counterparty?.name}</p>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <p className="font-mono2 text-[13px] text-white">₹{(contract.totalAmount || 0).toFixed(2)}</p>
                            <p className="font-mono2 text-[12px] text-brand-base">₹{(contract.escrowBalance || 0).toFixed(2)}</p>
                          </td>
                          <td className="p-4 align-middle text-center">
                            <span className="text-[13px] text-paper-muted font-mono2">
                              {completedMilestones} / {totalMilestones}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-center">
                            {getStatusBadge(contract.status)}
                          </td>
                          <td className="p-4 align-middle">
                            <span className="text-[13px] text-paper-muted">
                              {new Date(contract.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <a
                              href="/dashboard"
                              className="btn btn-sm btn-secondary inline-flex items-center gap-1.5"
                            >
                              View <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
