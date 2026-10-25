'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  BadgeCheck,
  Cpu,
  Binary,
  Database,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export function AcademicFooter() {
  return (
    <footer className="w-full border-t border-line bg-charcoal text-paper transition-colors duration-200 pt-16 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 space-y-12">
        {/* Top Grid: Institution & Team Attribution */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-line">
          {/* Col 1: Project Identity */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-brand-base flex items-center justify-center font-display font-bold text-charcoal text-xs">
                GF
              </div>
              <span className="font-display font-bold text-paper text-base">GigaFlow Escrow</span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed">
              Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow. Built for verifiable freelance engineering transactions.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Full Verification Pass Gate S2</span>
            </div>
          </div>

          {/* Col 2: Academic Institution */}
          <div className="space-y-2">
            <span className="eyebrow block text-[11px]">Academic Institution</span>
            <div className="text-xs text-paper space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-base" />
                KLE Technological University
              </p>
              <p className="text-paper-muted">
                Dr. M. S. Sheshgiri College of Engineering and Technology, Belagavi
              </p>
              <p className="text-paper-muted">
                Department of Computer Science & Engineering
              </p>
              <p className="text-[11px] font-mono2 text-brand-light font-semibold pt-1">
                Capstone 2026 · Theme 01 · Team 07
              </p>
            </div>
          </div>

          {/* Col 3: Team 07 Student Ownership */}
          <div className="space-y-2">
            <span className="eyebrow block text-[11px]">Engine Ownership & Authors</span>
            <div className="space-y-1.5 text-xs font-mono2">
              <div className="flex items-center justify-between text-paper-muted">
                <span>Vaishnavi Modekar (R21)</span>
                <span className="text-amber-400 text-[10px]">Engine 01 (OS)</span>
              </div>
              <div className="flex items-center justify-between text-paper-muted">
                <span>Darshan Kittur (R18)</span>
                <span className="text-emerald-400 text-[10px]">Engine 02 (DSA)</span>
              </div>
              <div className="flex items-center justify-between text-paper-muted">
                <span>Purvi Sammatshetti (R11)</span>
                <span className="text-blue-400 text-[10px]">Engine 03 (DBMS)</span>
              </div>
              <div className="flex items-center justify-between text-paper-muted">
                <span>Vaibhav Chavanpatil (R4)</span>
                <span className="text-purple-400 text-[10px]">Engine 04 (Web)</span>
              </div>
            </div>
          </div>

          {/* Col 4: Verification Links */}
          <div className="space-y-2">
            <span className="eyebrow block text-[11px]">Verification Artifacts</span>
            <div className="space-y-2 text-xs">
              <Link
                href="/rtm"
                className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated hover:bg-surface-highlight border border-line text-paper transition-colors"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <BadgeCheck className="w-4 h-4 text-brand-base" />
                  Traceability Matrix
                </span>
                <span className="font-mono2 text-[10px] text-emerald-400">14/14 Req</span>
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
            © 2026 Team 07 · KLE Technological University Belagavi. All rights reserved.
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
