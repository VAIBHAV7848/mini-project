'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  BadgeCheck,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function TeamShowcaseHeader() {
  return (
    <header className="w-full border-b border-line bg-charcoal/90 backdrop-blur sticky top-0 z-50 transition-colors duration-200">
      {/* Top Academic Ribbon */}
      <div className="bg-surface-elevated border-b border-line px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono2">
        <div className="flex items-center gap-2 text-paper-muted">
          <GraduationCap className="w-4 h-4 text-brand-base shrink-0" />
          <span className="font-semibold text-paper">KLE Technological University</span>
          <span className="text-paper-faint hidden md:inline">· Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi</span>
          <span className="text-paper-faint hidden lg:inline">· Department of Computer Science & Engineering</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded font-bold bg-brand-tint border border-brand-base/30 text-brand-light">
            Capstone 2026 · Theme 01 · Team 07
          </span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-bold">Evaluation Ready</span>
          </div>
        </div>
      </div>

      {/* Main Showcase Navigation Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-base rounded-lg p-1">
          <div className="w-8 h-8 rounded-lg bg-brand-base flex items-center justify-center font-display font-bold text-charcoal shadow-sm">
            GF
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-tight text-paper leading-none">
              GigaFlow
            </span>
            <span className="text-[10px] font-mono2 uppercase tracking-widest text-paper-muted">
              Escrow & Dispute Protocol
            </span>
          </div>
        </Link>

        {/* Section Jump Anchors */}
        <nav aria-label="Page Sections" className="hidden lg:flex items-center gap-6 text-xs font-semibold text-paper-muted">
          <a href="#playground" className="hover:text-brand-light transition-colors">
            Interactive Playground
          </a>
          <a href="#engines" className="hover:text-brand-light transition-colors">
            Four CS Engines
          </a>
          <a href="#personas" className="hover:text-brand-light transition-colors">
            Persona Launchpad
          </a>
          <Link href="/rtm" className="flex items-center gap-1.5 hover:text-brand-light transition-colors">
            <BadgeCheck className="w-3.5 h-3.5 text-brand-base" />
            Traceability Matrix (RTM)
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-bold px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-line text-paper hover:text-brand-light transition-all"
          >
            Vault Sign In
          </Link>
          <a
            href="#personas"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-base hover:bg-brand-light text-charcoal transition-all shadow-md"
          >
            Launch Persona <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
