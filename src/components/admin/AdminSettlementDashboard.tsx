'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { useRole } from '@/components/layout/RoleContext';

export interface PendingSettlement {
  id: string;
  contractId: string;
  milestoneId: string;
  projectTitle: string;
  milestoneTitle: string;
  milestoneStatus: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  beneficiaryVpa?: string;
  beneficiaryAccountMasked?: string;
  beneficiaryIfsc?: string;
  grossAmount: number;
  platformFee: number;
  netDisbursed: number;
  status: string;
  createdAt: string;
}

export function AdminSettlementDashboard() {
  const { currentPersona } = useRole();
  const [settlements, setSettlements] = useState<PendingSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bankUtrInputs, setBankUtrInputs] = useState<Record<string, string>>({});
  const [railInputs, setRailInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settlements', {
        headers: { 'x-user-id': currentPersona.id },
      });
      const data = await res.json();
      if (data.success) {
        setSettlements(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleUtrChange = (id: string, val: string) => {
    setBankUtrInputs((prev) => ({ ...prev, [id]: val.toUpperCase() }));
  };

  const handleRailChange = (id: string, val: string) => {
    setRailInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleConfirmPayout = async (settlement: PendingSettlement) => {
    const utr = bankUtrInputs[settlement.id];
    const rail = railInputs[settlement.id] || 'MANUAL_UPI';

    if (!utr || utr.trim().length < 8) {
      setFeedback({ message: 'Please input a valid Bank UTR / IMPS reference before confirming payout.', type: 'error' });
      return;
    }

    setProcessingId(settlement.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settlements/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          settlementId: settlement.id,
          bankUtr: utr.trim(),
          payoutRail: rail,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Payout confirmation failed.');
      }
      setFeedback({
        message: `Payout of ₹${settlement.netDisbursed.toFixed(2)} confirmed for ${settlement.freelancerName} (Ref: ${utr}).`,
        type: 'success',
      });
      fetchSettlements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payout confirmation error';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-paper flex items-center gap-2">
            <Landmark className="w-5 h-5 text-brand-base" /> Freelancer Manual Payout Settlements
          </h2>
          <p className="text-xs text-paper-muted">Confirm external bank disbursements for released milestone deliverables.</p>
        </div>
        <button
          type="button"
          onClick={fetchSettlements}
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

      {loading && settlements.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
          <Loader2 className="w-7 h-7 animate-spin text-brand-base mb-2" />
          <p className="text-sm font-medium">Scanning pending settlement requests...</p>
        </div>
      ) : settlements.length === 0 ? (
        <div className="py-12 px-6 bg-surface border border-dashed border-line rounded-panel text-center">
          <CheckCircle2 className="w-8 h-8 text-paper-faint mx-auto mb-2" />
          <p className="text-sm font-bold text-paper">No Pending Settlements</p>
          <p className="text-xs text-paper-muted mt-0.5">All approved freelancer milestones are fully settled.</p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-elevated text-[11px] font-mono2 uppercase tracking-wider text-paper-faint">
                  <th className="p-4">Milestone / Project</th>
                  <th className="p-4">Freelancer Beneficiary</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4">Payout Rail</th>
                  <th className="p-4">Bank UTR / Reference</th>
                  <th className="p-4 text-right">Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs font-mono2">
                {settlements.map((s) => {
                  const currentUtr = bankUtrInputs[s.id] ?? '';
                  const currentRail = railInputs[s.id] ?? 'MANUAL_UPI';
                  const isProcessing = processingId === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-paper font-sans">{s.milestoneTitle}</p>
                        <p className="text-paper-muted text-[11px] mt-0.5 font-sans">{s.projectTitle}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-paper font-sans">{s.freelancerName}</p>
                        {s.beneficiaryVpa ? (
                          <span className="badge badge-brand mt-1 inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> {s.beneficiaryVpa}
                          </span>
                        ) : s.beneficiaryAccountMasked ? (
                          <span className="badge badge-neutral mt-1 inline-flex items-center gap-1">
                            <CreditCard className="w-3 h-3" /> A/C: {s.beneficiaryAccountMasked} ({s.beneficiaryIfsc})
                          </span>
                        ) : (
                          <span className="text-warning-light text-[11px]">No Payout Method Set</span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-base font-bold text-paper">₹{s.netDisbursed.toFixed(2)}</p>
                        <p className="text-[10px] text-paper-faint">Fee: ₹{s.platformFee.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        <select
                          value={currentRail}
                          onChange={(e) => handleRailChange(s.id, e.target.value)}
                          className="bg-surface-elevated border border-line focus:border-brand-base rounded-lg px-2.5 py-1 text-xs text-paper focus:outline-none"
                        >
                          <option value="MANUAL_UPI">UPI Transfer</option>
                          <option value="MANUAL_IMPS">IMPS</option>
                          <option value="MANUAL_NEFT">NEFT</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          maxLength={22}
                          value={currentUtr}
                          onChange={(e) => handleUtrChange(s.id, e.target.value)}
                          placeholder="e.g. 428190382910"
                          className="w-48 bg-surface-elevated border border-line focus:border-brand-base rounded-lg px-2.5 py-1 text-xs text-paper placeholder-paper-faint focus:outline-none"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          disabled={isProcessing || !currentUtr.trim()}
                          onClick={() => handleConfirmPayout(s)}
                          className="btn btn-sm btn-primary inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Confirm Disbursed</span>
                        </button>
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
