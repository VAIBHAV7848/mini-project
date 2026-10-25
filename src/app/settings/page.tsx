'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { Settings, Server, Shield, Activity } from 'lucide-react';

export default function SettingsPage() {
  const { role, currentPersona } = useRole();

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">System Administration</p>
            <h1 className="font-display text-2xl font-bold text-paper tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-base" aria-hidden="true" />
              Platform Settings
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">System configuration and engine status.</p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: System Info */}
          <div className="bg-surface rounded-panel border border-line p-5">
            <h2 className="font-display text-sm font-bold text-paper mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-base" aria-hidden="true" />
              Runtime Environment
            </h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Framework</dt>
                <dd className="text-[13px] font-mono2 text-paper">Next.js 16</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Runtime</dt>
                <dd className="text-[13px] font-mono2 text-paper">Node.js</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Database</dt>
                <dd className="text-[13px] font-mono2 text-paper">SQLite (WAL Mode)</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">ORM</dt>
                <dd className="text-[13px] font-mono2 text-paper">Prisma 5.22</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Auth</dt>
                <dd className="text-[13px] font-mono2 text-paper">HMAC-SHA256 Sessions</dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Security Configuration */}
          <div className="bg-surface rounded-panel border border-line p-5">
            <h2 className="font-display text-sm font-bold text-paper mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-base" aria-hidden="true" />
              Security Policies
            </h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">RBAC Enforcement</dt>
                <dd className="text-[13px] font-mono2 text-paper">Active</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Session Validation</dt>
                <dd className="text-[13px] font-mono2 text-paper">Server-Side</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Input Validation</dt>
                <dd className="text-[13px] font-mono2 text-paper">Zod Schema</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Audit Chain</dt>
                <dd className="text-[13px] font-mono2 text-paper">Cryptographic SHA-256</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Timing-Safe Comparison</dt>
                <dd className="text-[13px] font-mono2 text-paper">Enabled</dd>
              </div>
            </dl>
          </div>

          {/* Card 3: Engine Status */}
          <div className="bg-surface rounded-panel border border-line p-5">
            <h2 className="font-display text-sm font-bold text-paper mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-base" aria-hidden="true" />
              Engine Health
            </h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Engine 01 (OS)</dt>
                <dd className="text-[13px] font-mono2 text-paper flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  Online
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Engine 02 (DSA/SE)</dt>
                <dd className="text-[13px] font-mono2 text-paper flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  Online
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Engine 03 (DBMS)</dt>
                <dd className="text-[13px] font-mono2 text-paper flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  Online
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[13px] text-paper-muted">Engine 04 (Web)</dt>
                <dd className="text-[13px] font-mono2 text-paper flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  Online
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
