'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Binary,
  Database,
  Globe,
  BadgeCheck,
  Lock,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { TeamShowcaseHeader } from '@/components/showcase/TeamShowcaseHeader';
import { InteractiveEscrowPlayground } from '@/components/showcase/InteractiveEscrowPlayground';
import { EngineArchitectureGrid } from '@/components/showcase/EngineArchitectureGrid';
import { PersonaQuickLaunchpad } from '@/components/showcase/PersonaQuickLaunchpad';
import { AcademicFooter } from '@/components/showcase/AcademicFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal text-paper flex flex-col selection:bg-brand-base/30 selection:text-white transition-colors duration-200">
      {/* 1. Header with KLE Tech Academic Banner & Navigation */}
      <TeamShowcaseHeader />

      {/* 2. Hero Section */}
      <main className="flex-1 w-full flex flex-col items-center">
        <section className="w-full max-w-[1600px] px-4 sm:px-8 py-12 lg:py-20 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission, Invariants, CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-8 animate-in fade-in duration-500">
            {/* Academic Track Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-line text-xs font-mono2">
              <span className="w-2 h-2 rounded-full bg-brand-base" />
              <span className="font-semibold text-paper">Theme 01</span>
              <span className="text-paper-faint">·</span>
              <span className="text-paper-muted">KLE Technological University Capstone</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-paper tracking-tight leading-[1.1]">
              Milestone-Based Escrow & <br />
              <span className="text-brand-base">Evidence-Based</span> Dispute Resolution.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-paper-muted max-w-2xl leading-relaxed">
              A high-assurance engineering workspace for freelance talent. Protect milestone disbursements with operating-system mutex locks, SHA-256 deliverable checksums, relational BCNF double-entry ledgers, and impartial dispute arbitration.
            </p>

            {/* Key Invariant Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
              <div className="p-3 rounded-xl bg-surface border border-line">
                <span className="text-[10px] font-mono2 text-paper-faint uppercase block">OS Scheduler</span>
                <span className="text-xs font-bold text-amber-400">KeyedMutex Locked</span>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <span className="text-[10px] font-mono2 text-paper-faint uppercase block">DSA Evidence</span>
                <span className="text-xs font-bold text-emerald-400">SHA-256 Trees</span>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <span className="text-[10px] font-mono2 text-paper-faint uppercase block">DBMS Invariant</span>
                <span className="text-xs font-bold text-blue-400">ΔBalance ≡ 0</span>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <span className="text-[10px] font-mono2 text-paper-faint uppercase block">Web RBAC</span>
                <span className="text-xs font-bold text-purple-400">4 Secure Roles</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#playground"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-bold bg-brand-base text-charcoal hover:bg-brand-light transition-all shadow-lg hover:shadow-brand-base/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Launch Live Simulator
              </a>
              <a
                href="#personas"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-bold bg-surface-elevated hover:bg-surface-highlight border border-line text-paper hover:text-brand-light transition-all"
              >
                1-Click Persona Launchpad
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <Link
                href="/rtm"
                className="inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-sm font-bold text-paper-muted hover:text-paper transition-colors"
              >
                <BadgeCheck className="w-4 h-4 mr-1.5 text-brand-base" />
                Traceability Matrix
              </Link>
            </div>
          </div>

          {/* Right Column: Video Panel with Architectural Overlay */}
          <div className="lg:col-span-5 w-full relative">
            <div className="relative rounded-2xl overflow-hidden border border-line shadow-2xl bg-surface aspect-[4/3] lg:aspect-[16/11]">
              <video
                src="/assets/desktop-header.webm"
                poster="/assets/hero-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
                aria-hidden="true"
              />

              {/* Floating Status Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-charcoal/90 backdrop-blur border border-line text-xs font-mono2 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-paper block">Escrow Protocol Active</span>
                    <span className="text-[10px] text-paper-muted">PostgreSQL ACID Transaction Isolation</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Interactive In-Browser Escrow Playground */}
        <section id="playground" className="w-full max-w-[1600px] px-4 sm:px-8 py-16 border-t border-line">
          <div className="mb-8">
            <span className="font-mono2 text-xs uppercase tracking-widest text-brand-base font-bold">
              Real-Time Verification Sandbox
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-paper tracking-tight mt-1">
              Interactive Escrow & Evidence Simulator
            </h2>
            <p className="text-xs sm:text-sm text-paper-muted mt-1 max-w-2xl">
              Test milestone creation, state transitions, client-side SHA-256 evidence hashing, and mathematical fund conservation right in your browser.
            </p>
          </div>

          <InteractiveEscrowPlayground />
        </section>

        {/* Section: The Four CS Engineering Engines */}
        <section id="engines" className="w-full max-w-[1600px] px-4 sm:px-8 py-16 border-t border-line">
          <EngineArchitectureGrid />
        </section>

        {/* Section: 1-Click Persona Launchpad */}
        <section id="personas" className="w-full max-w-[1600px] px-4 sm:px-8 py-16 border-t border-line">
          <PersonaQuickLaunchpad />
        </section>

        {/* Academic Defense & Capstone Thesis Card */}
        <section className="w-full max-w-[1600px] px-4 sm:px-8 py-16 border-t border-line">
          <div className="p-8 rounded-2xl bg-surface border border-line shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-mono2 text-brand-light font-bold">
                <GraduationCap className="w-4 h-4" />
                <span>KLE Technological University · Team 07 Defense Thesis</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-paper">
                Bridging Theoretical Computer Science into Verifiable Software
              </h3>
              <p className="text-xs sm:text-sm text-paper-muted leading-relaxed">
                By partitioning the system into four autonomous engines—Operating Systems concurrency (Engine 01), Data Structures Merkle trees (Engine 02), Database ACID transactions (Engine 03), and Web Systems RBAC (Engine 04)—Team 07 eliminates both financial double-spending and deliverable tampering in modern freelance agreements.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
              <Link
                href="/rtm"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-bold bg-brand-base text-charcoal hover:bg-brand-light transition-all shadow-md text-center"
              >
                <BadgeCheck className="w-4 h-4 mr-2" />
                Inspect Traceability Matrix
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-surface-highlight border border-line text-paper hover:text-brand-light transition-all text-center"
              >
                Enter Mechanical Vault
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Academic Footer */}
      <AcademicFooter />
    </div>
  );
}
