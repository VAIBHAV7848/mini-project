'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Briefcase,
  Code2,
  Scale,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Role } from '@/components/layout/RoleContext';

interface PersonaCard {
  role: Role;
  name: string;
  email: string;
  password: string;
  title: string;
  balance: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeColor: string;
  description: string;
  capabilities: string[];
}

const PERSONAS: PersonaCard[] = [
  {
    role: 'CLIENT',
    name: 'Alice Client',
    email: 'client1@escrow.local',
    password: 'Password123!',
    title: 'Project Owner & Depositor',
    balance: '₹1,00,000 Balance',
    icon: Briefcase,
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    badgeColor: 'text-blue-400',
    description: 'Posts gigs, funds milestone escrow vaults, inspects cryptographic proofs, and releases payments.',
    capabilities: ['Deposit Escrow Funds', 'Review Deliverables', 'Approve Settlements', 'Raise Disputes'],
  },
  {
    role: 'FREELANCER',
    name: 'Charlie Developer',
    email: 'dev1@escrow.local',
    password: 'Password123!',
    title: 'Full-Stack Software Engineer',
    balance: '98 DevScore · ₹24,500',
    icon: Code2,
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeColor: 'text-emerald-400',
    description: 'Submits bids, performs software milestones, generates SHA-256 deliverable checksums, and claims payouts.',
    capabilities: ['Submit Proposals', 'Upload SHA-256 Evidence', 'Track Milestone FSM', 'Receive Settlements'],
  },
  {
    role: 'REVIEWER',
    name: 'Judge Reviewer',
    email: 'reviewer1@escrow.local',
    password: 'Password123!',
    title: 'Impartial Dispute Arbitrator',
    balance: 'Verified Arbitrator',
    icon: Scale,
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeColor: 'text-amber-400',
    description: 'Inspects Merkle Evidence Trees, examines cryptographic checksums, and resolves disputed milestones.',
    capabilities: ['Audit Merkle Trees', 'Verify Hash Integrity', 'Arbitrate Contracts', 'Resolve Release/Refund'],
  },
  {
    role: 'ADMIN',
    name: 'Admin (Platform Operations)',
    email: 'admin@escrow.local',
    password: 'Password123!',
    title: 'System Operations & Ledger Admin',
    balance: 'Full Authority',
    icon: ShieldCheck,
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    badgeColor: 'text-purple-400',
    description: 'Oversees simulated settlements, inspects the append-only ledger audit trail, and manages engine health.',
    capabilities: ['Ledger Reconciliation', 'Append-Only Audit Trail', 'Timeout Watchdog Control', 'System Administration'],
  },
];

export function PersonaQuickLaunchpad() {
  const router = useRouter();
  const [loggingInRole, setLoggingInRole] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLaunchPersona = async (persona: PersonaCard) => {
    setLoggingInRole(persona.role);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: persona.email, password: persona.password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Persist active role
      localStorage.setItem('activeRole', persona.role);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to launch persona';
      setErrorMessage(message);
      setLoggingInRole(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono2 text-xs uppercase tracking-widest text-brand-base font-bold">
            Interactive Workspaces
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-paper tracking-tight mt-1">
            Role-Based Demo Launchpad
          </h2>
          <p className="text-xs sm:text-sm text-paper-muted mt-1 max-w-2xl">
            Select any role below to explore GigaFlow across its full permission matrix with live pre-configured accounts.
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-danger-tint border border-danger/40 text-danger-light text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Grid of Personas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon;
          const isLoading = loggingInRole === persona.role;

          return (
            <div
              key={persona.role}
              className="bg-surface border border-line hover:border-brand-base/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Persona Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-line flex items-center justify-center text-paper group-hover:text-brand-base transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono2 font-bold border ${persona.badgeBg} ${persona.badgeColor}`}>
                    {persona.role}
                  </span>
                </div>

                {/* Identity */}
                <h3 className="text-base font-bold text-paper truncate">{persona.name}</h3>
                <p className="text-xs text-brand-light font-mono2 mb-2">{persona.title}</p>
                <p className="text-xs text-paper-muted leading-relaxed mb-4 line-clamp-2">
                  {persona.description}
                </p>

                {/* Capabilities list */}
                <div className="space-y-1.5 mb-5 pt-3 border-t border-line/60">
                  <span className="text-[10px] font-mono2 text-paper-faint uppercase block">Key Capabilities:</span>
                  {persona.capabilities.map((cap, idx) => (
                    <div key={idx} className="text-[11px] text-paper-muted flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-brand-base shrink-0" />
                      <span className="truncate">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  disabled={loggingInRole !== null}
                  onClick={() => handleLaunchPersona(persona)}
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isLoading
                      ? 'bg-brand-base text-charcoal opacity-80'
                      : 'bg-surface-elevated hover:bg-brand-base text-paper hover:text-charcoal border border-line hover:border-brand-base shadow-sm'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch as {persona.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
