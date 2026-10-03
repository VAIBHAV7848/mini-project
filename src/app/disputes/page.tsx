'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { AlertTriangle, Loader2, FolderOpen, ExternalLink, ShieldAlert, Clock } from 'lucide-react';

interface DisputeItem {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  raisedBy: { name: string; role: string };
  reviewer: { name: string } | null;
  milestone: {
    title: string;
    amount: number;
    contract: {
      client: { name: string };
      freelancer: { name: string };
    }
  };
}

export default function DisputesPage() {
  const { currentPersona } = useRole();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchDisputes();
  }, [currentPersona.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="badge bg-amber-500/10 text-amber-400 border-amber-500/20">Open (Pending Review)</span>;
      case 'UNDER_REVIEW':
        return <span className="badge bg-[var(--color-primary-base)]/10 text-[var(--color-primary-light)] border-[var(--color-primary-base)]/20">Under Review</span>;
      case 'RESOLVED':
        return <span className="badge bg-[var(--color-success-base)]/10 text-[var(--color-success-base)] border-[var(--color-success-base)]/20">Resolved</span>;
      default:
        return <span className="badge bg-slate-800 text-slate-300 border-slate-700">{status}</span>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        <div className="border-b border-[var(--color-border-subtle)] pb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--color-danger-base)]" />
            Dispute Cases
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage active escrow disputes and evidence review.</p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-base)] mb-4" />
            <p className="text-sm font-medium">Loading dispute cases...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-[var(--color-border-strong)] rounded-xl bg-[var(--color-surface-1)]/50">
            <FolderOpen className="w-12 h-12 text-[var(--color-border-strong)] mb-4" />
            <h3 className="text-base font-medium text-white">No Active Disputes</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 text-center">There are currently no dispute cases requiring attention.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="card p-0 flex flex-col hover:border-[var(--color-border-strong)] transition-colors overflow-hidden">
                <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <h3 className="text-base font-medium text-white">Case: {dispute.id.slice(0,8).toUpperCase()}</h3>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    Opened: {new Date(dispute.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-[var(--color-surface-1)] p-4 rounded-lg border border-[var(--color-border-default)]">
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs mb-1 uppercase tracking-wider">Milestone</span>
                        <span className="font-medium text-slate-200">{dispute.milestone.title}</span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs mb-1 uppercase tracking-wider">Disputed Amount</span>
                        <span className="font-medium text-rose-400 font-mono">${dispute.milestone.amount.toFixed(2)}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[var(--color-text-muted)] block text-xs mb-1 uppercase tracking-wider">Reason for Dispute</span>
                        <span className="text-slate-300 italic">"{dispute.reason}"</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-text-muted)]">
                      <span>Client: <span className="text-slate-300">{dispute.milestone.contract.client.name}</span></span>
                      <span>Freelancer: <span className="text-slate-300">{dispute.milestone.contract.freelancer.name}</span></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-end gap-3 min-w-[120px]">
                    <button className="btn btn-sm btn-secondary w-full md:w-auto">
                      <ExternalLink className="w-3.5 h-3.5" /> View Case File
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
