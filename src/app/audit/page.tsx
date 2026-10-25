'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, Clock, Database, Hash } from 'lucide-react';

interface AuditLog {
  id: string;
  actorId: string;
  entityName: string;
  entityId: string;
  action: string;
  previousState: string | null;
  newState: string | null;
  prevHash: string;
  verificationHash: string;
  timestamp: string;
}

interface IntegrityInfo {
  isValid?: boolean;
  valid?: boolean;
  totalVerified?: number;
  totalChecked?: number;
  tamperedRecordIds?: string[];
  brokenAt?: number;
}

interface AuditData {
  integrity: IntegrityInfo;
  totalRecords: number;
  logs: AuditLog[];
}

export default function AuditPage() {
  const { role, currentPersona } = useRole();
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/audit-logs', {
          headers: { 'x-user-id': currentPersona.id }
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPersona.id]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const truncate = (str: string, len: number) => {
    if (!str) return '';
    return str.substring(0, len) + (str.length > len ? '...' : '');
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">System Administration</p>
            <h1 className="font-display text-2xl font-bold text-paper tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-base" aria-hidden="true" />
              Audit Trail
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">System wide immutable action logs.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line" role="status">
            <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" aria-hidden="true" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        ) : !data ? (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-line">
            <div className="w-8 h-8 rounded-md bg-surface-elevated border border-line flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-paper-faint" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-paper">No items found</h3>
              <p className="text-[13px] text-paper-muted">Failed to load audit logs.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Integrity Banner */}
            {(data.integrity.isValid ?? data.integrity.valid) ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  Chain Integrity: VERIFIED ✓ — {data.integrity.totalVerified ?? data.integrity.totalChecked ?? data.logs.length} records verified, zero tampering detected
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  Chain Integrity: BROKEN — Tampered records detected ({data.integrity.tamperedRecordIds?.length || 1} issues)
                </p>
              </div>
            )}

            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2 text-paper-muted">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Records</span>
                </div>
                <div className="font-display text-2xl font-bold text-paper font-mono2">
                  {data.totalRecords}
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2 text-paper-muted">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-medium">Chain Status</span>
                </div>
                <div className={`font-display text-2xl font-bold ${(data.integrity.isValid ?? data.integrity.valid) ? 'text-green-400' : 'text-red-400'}`}>
                  {(data.integrity.isValid ?? data.integrity.valid) ? 'Valid' : 'Broken'}
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2 text-paper-muted">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Latest Entry</span>
                </div>
                <div className="font-display text-base font-bold text-paper font-mono2">
                  {data.logs.length > 0 ? formatDate(data.logs[0].timestamp) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Table */}
            {data.logs.length === 0 ? (
               <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-line">
                 <div className="w-8 h-8 rounded-md bg-surface-elevated border border-line flex items-center justify-center shrink-0">
                   <ShieldCheck className="w-4 h-4 text-paper-faint" aria-hidden="true" />
                 </div>
                 <div>
                   <h3 className="font-display text-sm font-bold text-paper">No logs found</h3>
                   <p className="text-[13px] text-paper-muted">The audit trail is currently empty.</p>
                 </div>
               </div>
            ) : (
              <div className="rounded-panel border border-line overflow-hidden bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse divide-y divide-line text-left">
                    <thead>
                      <tr>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">#</th>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">Timestamp</th>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">Actor ID</th>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">Entity</th>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">Action</th>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">State Transition</th>
                        <th scope="col" className="px-4 py-3 bg-surface-elevated text-paper-faint font-mono2 text-[11px] uppercase tracking-wider font-semibold">Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.logs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-surface-elevated transition-colors">
                          <td className="px-4 py-3 text-sm text-paper-muted font-mono2">{data.totalRecords - index}</td>
                          <td className="px-4 py-3 text-sm text-paper-muted font-mono2 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                          <td className="px-4 py-3 text-sm text-paper-muted font-mono2" title={log.actorId}>{truncate(log.actorId, 8)}</td>
                          <td className="px-4 py-3 text-sm text-paper-muted">
                            {log.entityName} <span className="font-mono2 text-paper-faint">({truncate(log.entityId, 8)})</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-paper font-medium">{log.action}</td>
                          <td className="px-4 py-3 text-sm text-paper-muted">
                            {log.previousState ? (
                              <div className="flex items-center gap-2">
                                <span className="line-through opacity-70">{log.previousState}</span>
                                <span>&rarr;</span>
                                <span className="text-paper">{log.newState}</span>
                              </div>
                            ) : (
                              <span className="text-paper">{log.newState || '—'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-paper-muted font-mono2">
                            <span title={log.verificationHash}>{truncate(log.verificationHash, 12)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
