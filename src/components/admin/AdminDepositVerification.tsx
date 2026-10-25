'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useRole } from '@/components/layout/RoleContext';

export interface PendingDeposit {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  amountPaise: number;
  status: string;
  clientUtr?: string;
  createdAt: string;
}

export function AdminDepositVerification() {
  const { currentPersona } = useRole();
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bankUtrInputs, setBankUtrInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        headers: { 'x-user-id': currentPersona.id },
      });
      const data = await res.json();
      if (data.success) {
        setDeposits(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleUtrChange = (orderId: string, value: string) => {
    setBankUtrInputs((prev) => ({ ...prev, [orderId]: value.toUpperCase() }));
  };

  const handleApprove = async (deposit: PendingDeposit) => {
    const utr = bankUtrInputs[deposit.orderId] || deposit.clientUtr;
    if (!utr || utr.trim().length < 8) {
      setFeedback({ message: `Please enter a valid Bank UTR for order ${deposit.orderId}.`, type: 'error' });
      return;
    }

    setProcessingId(deposit.orderId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/deposits/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          orderId: deposit.orderId,
          bankUtr: utr.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Approval failed.');
      }
      setFeedback({ message: `Order ${deposit.orderId} approved and ₹${deposit.amount.toFixed(2)} credited!`, type: 'success' });
      fetchDeposits();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving deposit';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (deposit: PendingDeposit) => {
    const reason = prompt(`Enter reason for rejecting order ${deposit.orderId}:`, 'UTR not found in receiving bank account statement');
    if (!reason) return;

    setProcessingId(deposit.orderId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/deposits/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          orderId: deposit.orderId,
          reason,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Rejection failed.');
      }
      setFeedback({ message: `Order ${deposit.orderId} marked as rejected.`, type: 'success' });
      fetchDeposits();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rejecting deposit';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-paper flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-base" /> Pending UPI Deposit Approvals
          </h2>
          <p className="text-xs text-paper-muted">Verify incoming client UPI transactions and credit platform marketplace balance.</p>
        </div>
        <button
          type="button"
          onClick={fetchDeposits}
          disabled={loading}
          className="btn btn-sm btn-ghost cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-base' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-success-tint border-success/30 text-success-light'
              : 'bg-danger-tint border-danger/30 text-danger-light'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Deposits List */}
      {loading && deposits.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
          <Loader2 className="w-7 h-7 animate-spin text-brand-base mb-2" />
          <p className="text-sm font-medium">Scanning pending UPI orders...</p>
        </div>
      ) : deposits.length === 0 ? (
        <div className="py-12 px-6 bg-surface border border-dashed border-line rounded-panel text-center">
          <CheckCircle2 className="w-8 h-8 text-paper-faint mx-auto mb-2" />
          <p className="text-sm font-bold text-paper">No Pending UPI Deposits</p>
          <p className="text-xs text-paper-muted mt-0.5">All incoming client deposits have been reviewed and credited.</p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-elevated text-[11px] font-mono2 uppercase tracking-wider text-paper-faint">
                  <th className="p-4">Order ID & Client</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Client UTR</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Bank Verification UTR</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs font-mono2">
                {deposits.map((dep) => {
                  const currentUtr = bankUtrInputs[dep.orderId] ?? dep.clientUtr ?? '';
                  const isProcessing = processingId === dep.orderId;

                  return (
                    <tr key={dep.orderId} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-paper">{dep.orderId}</p>
                        <p className="text-paper-muted font-sans text-xs mt-0.5">{dep.clientName} ({dep.clientEmail})</p>
                      </td>

                      <td className="p-4">
                        <p className="text-base font-bold text-paper">₹{dep.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-brand-light">{dep.amountPaise} paise</p>
                      </td>

                      <td className="p-4">
                        {dep.clientUtr ? (
                          <span className="badge badge-brand">{dep.clientUtr}</span>
                        ) : (
                          <span className="text-paper-faint italic font-sans">Awaiting Client UTR</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`badge ${dep.status === 'PENDING_REVIEW' ? 'badge-warning' : 'badge-neutral'}`}>
                          {dep.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <input
                          type="text"
                          maxLength={22}
                          value={currentUtr}
                          onChange={(e) => handleUtrChange(dep.orderId, e.target.value)}
                          placeholder="Confirm 12-digit UTR"
                          className="w-48 bg-surface-elevated border border-line focus:border-brand-base rounded-lg px-2.5 py-1 text-xs text-paper placeholder-paper-faint focus:outline-none"
                        />
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isProcessing || !currentUtr.trim()}
                            onClick={() => handleApprove(dep)}
                            className="btn btn-sm btn-primary inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Approve & Credit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReject(dep)}
                            className="btn btn-sm btn-danger inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
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
  );
}
