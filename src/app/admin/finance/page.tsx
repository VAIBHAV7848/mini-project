'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { AdminDepositVerification } from '@/components/admin/AdminDepositVerification';
import { AdminSettlementDashboard } from '@/components/admin/AdminSettlementDashboard';
import { Landmark, QrCode, ShieldAlert } from 'lucide-react';

export default function AdminFinancePage() {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<'deposits' | 'settlements'>('deposits');

  if (role !== 'ADMIN') {
    return (
      <AppShell>
        <div className="py-24 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-danger-tint border border-danger/30 flex items-center justify-center text-danger mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-display font-bold text-xl text-paper">Access Restricted</h1>
          <p className="text-sm text-paper-muted mt-2">
            The Financial Verification & Settlement portal is strictly restricted to authorized Administrators.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-line pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-tint border border-brand-base/40 flex items-center justify-center text-brand-base font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-paper">Financial Ledger & Settlement Operations</h1>
              <p className="text-xs text-paper-muted font-mono2">
                Engine 03 (DBMS) & Engine 04 (Web) — Dual-Entry Bank Verification & Payout Rail
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={() => setActiveTab('deposits')}
              className={`py-2 px-4 rounded-xl text-xs font-bold font-mono2 transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === 'deposits'
                  ? 'bg-brand-base text-black font-extrabold border-brand-base shadow-sm'
                  : 'bg-surface hover:bg-surface-elevated text-paper-muted border-line'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Incoming UPI Deposits</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settlements')}
              className={`py-2 px-4 rounded-xl text-xs font-bold font-mono2 transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === 'settlements'
                  ? 'bg-brand-base text-black font-extrabold border-brand-base shadow-sm'
                  : 'bg-surface hover:bg-surface-elevated text-paper-muted border-line'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Freelancer Payout Settlements</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'deposits' ? (
          <AdminDepositVerification />
        ) : (
          <AdminSettlementDashboard />
        )}
      </div>
    </AppShell>
  );
}
