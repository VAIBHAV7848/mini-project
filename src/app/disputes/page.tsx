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
          <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-line">
            <div className="w-8 h-8 rounded-md bg-surface-elevated border border-line flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-paper-faint" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">No active disputes</h3>
              <p className="text-[13px] text-paper-muted">All current escrow contracts are progressing without an open dispute.</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden p-0 border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-elevated text-paper-faint">
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Case ID</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Milestone & Reason</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Parties</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Status</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="group hover:bg-surface-elevated/50 transition-colors relative">
                      <td className="py-4 px-4 align-top">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-danger-light opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="font-mono2 text-sm text-paper-muted">#{dispute.id.slice(0,8)}</span>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1 max-w-md">
                          <span className="font-display font-bold text-white line-clamp-1">{dispute.milestone.title}</span>
                          <span className="text-sm text-paper-muted line-clamp-1">"{dispute.reason}"</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-0.5 text-xs text-paper-muted font-mono2">
                          <span className="truncate max-w-[120px]"><span className="text-paper-faint">C:</span> {dispute.milestone.contract.client.name}</span>
                          <span className="truncate max-w-[120px]"><span className="text-paper-faint">F:</span> {dispute.milestone.contract.freelancer.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <span className="font-mono2 font-bold text-danger-light">₹{dispute.milestone.amount.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <button className="btn btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
