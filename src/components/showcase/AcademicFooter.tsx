'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  Lock,
  Layers,
  Scale,
} from 'lucide-react';

export function AcademicFooter() {
  return (
    <footer className="w-full border-t border-line bg-charcoal text-paper transition-colors duration-200 pt-16 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 space-y-12">
        {/* Top Grid: Product Identity, Capabilities, Workspaces, Specifications */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-line">
          {/* Col 1: Platform Identity */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-brand-base flex items-center justify-center font-display font-bold text-charcoal text-xs">
                GF
              </div>
              <span className="font-display font-bold text-paper text-base">GigaFlow Protocol</span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed">
              High-assurance milestone escrow and evidence-based dispute resolution platform for verifiable freelance engineering agreements.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cryptographic Invariant Isolation Active</span>
            </div>
          </div>

          {/* Col 2: Platform Architecture */}
          <div className="space-y-2">
            <span className="eyebrow block text-[11px]">Core Subsystems</span>
            <ul className="space-y-1.5 text-xs text-paper-muted">
              <li>
                <a href="#playground" className="hover:text-paper transition-colors">
                  Finite State Machine Scheduler
                </a>
              </li>
              <li>
                <a href="#playground" className="hover:text-paper transition-colors">
                  SHA-256 Evidence Merkle Tree
                </a>
              </li>
              <li>
                <a href="#engines" className="hover:text-paper transition-colors">
                  Double-Entry Conservation Ledger
                </a>
              </li>
              <li>
                <a href="#engines" className="hover:text-paper transition-colors">
                  Multi-Role Session Authorization
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Workspaces */}
          <div className="space-y-2">
            <span className="eyebrow block text-[11px]">Stakeholder Workspaces</span>
            <ul className="space-y-1.5 text-xs text-paper-muted">
              <li>
                <Link href="/dashboard" className="hover:text-paper transition-colors">
                  Client Project & Escrow Hub
                </Link>
              </li>
              <li>
                <Link href="/gigs" className="hover:text-paper transition-colors">
                  Freelancer Services Marketplace
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-paper transition-colors">
                  Independent Dispute Arbitration
                </Link>
              </li>
              <li>
                <Link href="/contracts" className="hover:text-paper transition-colors">
                  Milestone Contracts Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Verification Artifacts */}
          <div className="space-y-2">
            <span className="eyebrow block text-[11px]">Security & Specifications</span>
            <div className="space-y-2 text-xs">
              <Link
                href="/rtm"
                className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated hover:bg-surface-highlight border border-line text-paper transition-colors"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <BadgeCheck className="w-4 h-4 text-brand-base" />
                  Traceability Matrix
                </span>
                <span className="font-mono2 text-[10px] text-emerald-400">14/14 Verified</span>
              </Link>
              <Link
                href="/audit"
                className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated hover:bg-surface-highlight border border-line text-paper transition-colors"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-brand-base" />
                  Ledger Audit Log
                </span>
                <span className="font-mono2 text-[10px] text-blue-400">Append-Only</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono2 text-paper-faint">
          <div>
            © 2026 GigaFlow Protocol. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Next.js 16 App Router</span>
            <span>•</span>
            <span>React 19 Concurrent</span>
            <span>•</span>
            <span>FIPS 180-4 SHA-256</span>
            <span>•</span>
            <span>Strict BCNF PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const ProductFooter = AcademicFooter;
