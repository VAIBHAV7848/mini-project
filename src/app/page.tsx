import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal text-paper flex flex-col selection:bg-brand-base/30 selection:text-white">
      {/* Top Navigation */}
      <header className="px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-sm bg-brand-base flex items-center justify-center font-display font-bold text-charcoal">
            GF
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">GigaFlow</span>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-paper-muted hover:text-white transition-colors">
          Sign In
        </Link>
      </header>

      {/* Main Content - Asymmetric Workspace Layout */}
      <main className="flex-1 flex items-center w-full px-6 py-12 lg:py-0">
        <div className="max-w-[1600px] w-full mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">

          {/* LEFT: Text & CTA */}
          <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-8 duration-700 ease-out">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-sm bg-brand-base animate-pulse" />
              <span className="font-mono2 text-[11px] uppercase tracking-widest text-paper-muted">
                Freelance OS // Live Environment
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-[72px] font-extrabold text-white tracking-tight leading-[1.05] mb-8">
              Milestone<br />
              Escrow &<br />
              Cryptographic<br />
              Evidence.
            </h1>

            <p className="text-lg text-paper-muted max-w-md leading-relaxed mb-10">
              A deterministic state machine for creative talent. Secure your workflow with verifiable deliverables and instantly arbitrated contracts.
            </p>

            <Link href="/dashboard" className="inline-flex items-center justify-center px-8 py-4 rounded-sm text-sm font-bold bg-brand-base text-charcoal hover:bg-brand-light transition-colors focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:outline-none shadow-[0_0_20px_rgba(255,107,0,0.1)]">
              Enter Workspace <ArrowRight className="w-4 h-4 ml-2" />
            </Link>

            {/* Technical Strip replacement for generic cards */}
            <div className="mt-20 flex flex-wrap items-center gap-x-4 gap-y-3 font-mono2 text-[10px] text-paper-faint uppercase tracking-widest">
              <span>Escrow</span>
              <span className="w-1 h-1 bg-line rounded-full hidden sm:block" />
              <span>Milestones</span>
              <span className="w-1 h-1 bg-line rounded-full hidden sm:block" />
              <span>Evidence</span>
              <span className="w-1 h-1 bg-line rounded-full hidden sm:block" />
              <span>Disputes</span>
            </div>
          </div>

          {/* RIGHT: Video Panel */}
          <div className="w-full relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200 ease-out fill-mode-both">
            <div className="relative rounded-[4px] overflow-hidden border border-line shadow-2xl bg-surface aspect-[4/3] lg:aspect-[16/10]">
              <video
                src="/assets/desktop-header.webm"
                poster="/assets/hero-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
              {/* Subtle metadata overlay referencing Groq/Claude Code aesthetic */}
              <div className="absolute bottom-4 right-4">
                <div className="font-mono2 text-[10px] text-white/50 uppercase tracking-widest bg-charcoal/80 px-2 py-1 rounded-sm backdrop-blur-sm border border-white/10">
                  SECURE.FSM.ACTIVE
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
