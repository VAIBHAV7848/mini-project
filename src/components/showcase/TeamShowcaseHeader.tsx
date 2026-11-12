'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function TeamShowcaseHeader() {
  return (
    <header className="h-14 sm:h-16 flex-none w-full border-b border-line bg-charcoal/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-200">
      <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-10 flex items-center justify-between">
        {/* Brand Lockup with Real GigaFlow Mark */}
        <Link
          href="/"
          className="group flex items-center space-x-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-base rounded-xl p-1 transition-transform duration-150 active:scale-95"
          aria-label="GigaFlow Home"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center p-0.5 bg-surface-elevated border border-line group-hover:border-brand-base transition-colors shadow-sm">
            <Image
              src="/assets/gigaflow-mark.png"
              alt="GigaFlow Mark"
              width={36}
              height={36}
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(252,108,0,0.35)]"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-paper leading-none">
                GigaFlow
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono2 font-semibold bg-surface-elevated border border-line text-paper-muted">
                v2.4
              </span>
            </div>
            <span className="text-[10px] font-mono2 uppercase tracking-widest text-paper-muted">
              Escrow &amp; Dispute Protocol
            </span>
          </div>
        </Link>

        {/* Center Live Status Badge (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/70 border border-line text-[11px] font-mono2 text-paper-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-Engine RBAC</span>
          <span className="text-line-strong">•</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Operational
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand-base text-charcoal hover:bg-brand-light transition-all duration-200 shadow-[0_0_15px_rgba(252,108,0,0.3)] hover:shadow-[0_0_22px_rgba(252,108,0,0.5)] active:scale-95 cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
