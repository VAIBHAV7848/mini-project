'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { AlertTriangle, Loader2, FolderOpen, ShieldAlert, Clock as ClockIcon, ExternalLink } from 'lucide-react';

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
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Arbitration</p>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-danger-light" />
              Dispute Cases
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">Manage active escrow disputes and evidence review.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
            <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" />
            <p className="text-sm font-medium">Loading dispute cases...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6 text-paper-faint" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">No Active Disputes</h3>
            <p className="text-sm text-paper-muted mt-1.5 text-center max-w-sm leading-relaxed">There are currently no dispute cases requiring attention or arbitration.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="card p-0 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-line bg-surface-highlight/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-danger-tint border border-danger/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-danger-light" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">Case <span className="text-paper-muted uppercase text-base">#{dispute.id.slice(0,8)}</span></h3>
                      <div className="flex items-center gap-2 text-xs font-mono2 text-paper-muted mt-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Opened {new Date(dispute.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">{getStatusBadge(dispute.status)}</div>
                </div>

                <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line rounded-xl overflow-hidden border border-line">
                      <div className="bg-surface p-4">
                        <span className="eyebrow block mb-1.5">Milestone</span>
                        <span className="font-medium text-white">{dispute.milestone.title}</span>
                      </div>
                      <div className="bg-surface p-4">
                        <span className="eyebrow block mb-1.5">Disputed Amount</span>
                        <span className="font-mono2 text-lg font-bold text-danger-light">₹{dispute.milestone.amount.toFixed(2)}</span>
                      </div>
                      <div className="bg-surface p-4 sm:col-span-2">
                        <span className="eyebrow block mb-1.5">Reason for Dispute</span>
                        <p className="text-paper-muted leading-relaxed italic border-l-2 border-danger-light/30 pl-3 py-0.5">“{dispute.reason}”</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-[13px] text-paper-muted font-medium bg-surface-elevated/50 p-3 rounded-lg border border-line">
                      <div className="flex items-center gap-2">
                        <span className="font-mono2 text-xs">CLIENT</span>
                        <span className="text-white">{dispute.milestone.contract.client.name}</span>
                      </div>
                      <div className="w-px h-4 bg-line hidden sm:block" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono2 text-xs">FREELANCER</span>
                        <span className="text-white">{dispute.milestone.contract.freelancer.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end lg:justify-center shrink-0 min-w-[160px]">
                    <button className="btn btn-secondary w-full lg:w-auto">
                      <ExternalLink className="w-4 h-4" /> View Case File
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