import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal flex flex-col">
      {/* Top Navigation */}
      <header className="px-6 py-4 border-b border-line flex items-center justify-between bg-charcoal/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brand-base flex items-center justify-center font-display font-bold text-charcoal">
            GF
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">GigaFlow</span>
        </div>
        <Link href="/dashboard" className="btn btn-sm btn-primary">
          Enter Workspace <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 sm:px-6">
        <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
          
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <span className="eyebrow bg-surface-elevated text-brand-base px-3 py-1 rounded-full mb-6 inline-block border border-line">
              Escrow-backed Freelance OS
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Milestone Escrow &<br className="hidden sm:block" /> Evidence-based Contracts.
            </h1>
            <p className="text-lg text-paper-muted max-w-2xl mx-auto leading-relaxed">
              Secure your workflow with cryptographic deliverable hashing and FSM-driven milestone releases. GigaFlow ensures fairness without compromise.
            </p>
          </div>

          {/* Cinematic Brand Video Component */}
          <div className="w-full max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 ease-out fill-mode-both">
            <div className="relative rounded-2xl overflow-hidden border border-line shadow-2xl bg-surface aspect-[2.1/1]">
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent z-10 pointer-events-none" />
              <video 
                src="/assets/desktop-header.webm"
                poster="/assets/hero-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <p className="font-mono2 text-xs uppercase tracking-wider text-brand-light mb-1">Live Environment</p>
                <p className="font-display text-white text-lg font-bold">Creative talent, secured globally.</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ease-out fill-mode-both">
            <div className="p-6 rounded-xl bg-surface border border-line">
              <ShieldCheck className="w-6 h-6 text-brand-base mb-4" />
              <h3 className="font-display font-bold text-white mb-2">FSM-Driven Escrow</h3>
              <p className="text-sm text-paper-muted">Deterministic state machines govern all financial allocations and milestone progression.</p>
            </div>
            <div className="p-6 rounded-xl bg-surface border border-line">
              <Layers className="w-6 h-6 text-brand-base mb-4" />
              <h3 className="font-display font-bold text-white mb-2">Cryptographic Evidence</h3>
              <p className="text-sm text-paper-muted">SHA-256 deliverable checksums lock the state of work for immutable verification.</p>
            </div>
            <div className="p-6 rounded-xl bg-surface border border-line">
              <Zap className="w-6 h-6 text-brand-base mb-4" />
              <h3 className="font-display font-bold text-white mb-2">Instant Arbitration</h3>
              <p className="text-sm text-paper-muted">Role-based reviewers resolve disputes using the immutable contract ledger history.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
