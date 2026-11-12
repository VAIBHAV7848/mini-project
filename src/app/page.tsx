'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  Code2,
  Scale,
  Activity
} from 'lucide-react';
import { TeamShowcaseHeader } from '@/components/showcase/TeamShowcaseHeader';

export default function LandingPage() {
  const router = useRouter();
  const [latency, setLatency] = useState('0.8');
  const [hashTick, setHashTick] = useState('0x9f7a..3c2e');

  // Physical keyboard "↵ RETURN" key listener for authentic terminal experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      // Only fire when nothing is focused: never hijack Enter from links,
      // buttons, inputs, or an open dialog.
      if (document.activeElement !== document.body) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      router.push('/login');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Subtle live protocol telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = (0.7 + Math.random() * 0.2).toFixed(1);
      setLatency(jitter);

      const hashes = [
        '0x9f7a..3c2e',
        '0x4d12..8b91',
        '0xe28f..65a4',
        '0x7c30..19f8'
      ];
      setHashTick(hashes[Math.floor(Math.random() * hashes.length)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-dvh max-h-dvh w-full flex flex-col justify-between overflow-hidden bg-[#07080a] text-white relative select-none font-sans">

      {/* 1. Cinematic Background Layer: Filmic Neutral Density & Architectural Dot Grid */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          src="/assets/desktop-header.webm"
          poster="/assets/hero-poster.jpg"
          width={1920}
          height={1080}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover scale-[1.02] filter brightness-[0.58] contrast-[1.16] saturate-[0.84]"
          aria-hidden="true"
        />
        {/* Neutral-density optical scrim — deep carbon, zero mud */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/50 to-[#07080a]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_80%_at_50%_40%,transparent_30%,rgba(7,8,10,0.92)_100%)]" />
        {/* CNC Milled Architectural Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* 2. Top Header Navigation (Integrated with Real GigaFlow Mark) */}
      <div className="relative z-30 flex-none">
        <TeamShowcaseHeader />
      </div>

      {/* 3. Center Stage: Pure Editorial Typographic Tension + Industrial Command Dock */}
      <main className="relative z-20 flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center py-2 sm:py-3">

        {/* Institutional Specification Coordinate Eyebrow */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.09] text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-400 uppercase mb-3 sm:mb-5 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="text-white font-semibold">0xESCROW</span>
          <span className="text-neutral-600">/</span>
          <span>SPEC_4.2.0</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300 font-medium">HIGH_ASSURANCE</span>
        </div>

        {/* Exact Required Headline — Crisp, monumental, monochromatic editorial authority */}
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[68px] font-black text-white tracking-[-0.04em] leading-[0.98] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] max-w-4xl text-center">
          <span className="inline-block sm:whitespace-nowrap">Milestone-Based Escrow &amp;</span>
          <br className="hidden sm:inline" />
          <span className="inline-block text-[#F4F4F5]">
            Evidence-Based Dispute Resolution.
          </span>
        </h1>

        {/* Exact Required Subtitle — Human cadence, balanced line length */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-[16.5px] text-neutral-300/85 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-normal text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          A high-assurance engineering workspace for freelance talent. Protect milestone disbursements with atomic concurrency locks, cryptographic SHA-256 evidence trees, relational double-entry ledgers, and impartial dispute arbitration.
        </p>

        {/* 4. THE INDUSTRIAL MINIMAL DOCK (Museum-Grade Machined Hardware Centerpiece) */}
        <div className="mt-7 sm:mt-9 w-full max-w-5xl px-2 sm:px-4">
          <div
            role="toolbar"
            aria-label="Workspace Access & Protocol Telemetry Dock"
            className="group relative rounded-2xl bg-[#0C0D11]/95 backdrop-blur-2xl border border-white/[0.13] shadow-[0_32px_80px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(0,0,0,0.8)] p-2 sm:p-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]"
          >
            {/* Machined Fastener Rivets & Engraved Hardware Serial (Industrial detailing) */}
            <div className="absolute top-1.5 left-2.5 hidden xl:block text-[8px] font-mono text-neutral-600 select-none tracking-tighter">
              ✛ SPEC.42 // SER-2026-GF07
            </div>
            <div className="absolute top-1.5 right-2.5 hidden xl:block text-[8px] font-mono text-neutral-600 select-none tracking-tighter">
              CHASSIS_CNC_MILL // BCNF-OK ✛
            </div>

            {/* ZONE 1: Physical Tactile Keycap Button ("Enter Workspace") */}
            <div className="flex items-center justify-between sm:justify-start gap-3.5 p-1 lg:pr-5">
              <Link
                href="/login"
                className="group/key relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-sans text-sm font-extrabold text-neutral-950 bg-gradient-to-b from-[#ff8732] via-[#fc6c00] to-[#e65c00] border-t border-white/50 border-b-2 border-[#9a3412] shadow-[0_4px_0_0_#9a3412,0_8px_20px_rgba(252,108,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.6)] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_0_#9a3412,0_4px_10px_rgba(252,108,0,0.3)] transition-all duration-100 cursor-pointer select-none"
              >
                {/* Subtle Orange Key Edge Illumination Underglow */}
                <span className="absolute -inset-0.5 rounded-xl bg-orange-500/25 blur-sm -z-10 group-hover/key:bg-orange-500/40 transition-colors" />

                <span className="tracking-tight text-[13.5px]">Enter Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover/key:translate-x-1 text-neutral-950" />
              </Link>

              {/* Physical Keycap Monospace Prompt */}
              <div className="flex flex-col items-start text-left font-mono text-[10px] leading-tight text-neutral-400 pl-1">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/[0.14] text-[9.5px] font-bold text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
                    ↵ RETURN
                  </kbd>
                </div>
                <span className="text-neutral-500 text-[9px] mt-0.5 tracking-wider uppercase">
                  DIRECT RBAC PASS
                </span>
              </div>
            </div>

            {/* ZONE 2: Segmented Machined Role Selectors */}
            <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 py-2 lg:py-0 lg:px-5">
              <div className="inline-flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.07] gap-1 shadow-inner">
                {/* Client Switch */}
                <Link
                  href="/login?role=client"
                  className="group/role flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-all text-neutral-300 hover:text-white"
                  title="Client Escrow Portal"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 group-hover/role:scale-110 transition-transform" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-mono font-semibold leading-none">Client</span>
                    <span className="text-[9px] font-mono text-neutral-500 group-hover/role:text-amber-300 uppercase tracking-tighter mt-0.5">
                      LOCK ESCROW
                    </span>
                  </div>
                </Link>

                <div className="h-6 w-[1px] bg-white/[0.08]" />

                {/* Freelancer Switch */}
                <Link
                  href="/login?role=freelancer"
                  className="group/role flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-all text-neutral-300 hover:text-white"
                  title="Freelancer Evidence Portal"
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400 group-hover/role:scale-110 transition-transform" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-mono font-semibold leading-none">Freelancer</span>
                    <span className="text-[9px] font-mono text-neutral-500 group-hover/role:text-cyan-300 uppercase tracking-tighter mt-0.5">
                      MERKLE PROOF
                    </span>
                  </div>
                </Link>

                <div className="h-6 w-[1px] bg-white/[0.08]" />

                {/* Arbiter Switch */}
                <Link
                  href="/login?role=arbitrator"
                  className="group/role flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-all text-neutral-300 hover:text-white"
                  title="Arbiter Dispute Tribunal"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-400 group-hover/role:scale-110 transition-transform" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-mono font-semibold leading-none">Arbiter</span>
                    <span className="text-[9px] font-mono text-neutral-500 group-hover/role:text-emerald-300 uppercase tracking-tighter mt-0.5">
                      TRIBUNAL
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* ZONE 3: Live Protocol Telemetry Readout (VFD/OLED Display) */}
            <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 lg:pl-5 font-mono text-[11px]">
              <div className="flex items-center gap-2.5 bg-black/60 px-3 py-1.5 rounded-xl border border-white/[0.07] shadow-inner">
                {/* Protocol FSM Status */}
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <span className="text-neutral-500 text-[10px]">FSM</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LOCKED</span>
                  </div>
                </div>

                <span className="text-neutral-700">|</span>

                {/* SHA-256 Proof Telemetry */}
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <span className="text-neutral-500 text-[10px]">SHA-256</span>
                  <span className="text-neutral-200 text-[10px] font-semibold tracking-tight">
                    {hashTick}
                  </span>
                </div>

                <span className="text-neutral-700">|</span>

                {/* Micro-Latency Jitter */}
                <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
                  <Activity className="w-3 h-3 text-orange-400" />
                  <span className="text-neutral-300 text-[10px] font-bold tabular-nums">
                    {latency}ms
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* 5. Minimal Institutional Engineering Footer */}
      <footer className="relative z-30 h-11 flex-none border-t border-white/[0.08] px-6 sm:px-8 text-[11px] font-mono text-neutral-400 flex items-center justify-between bg-[#07080a]/85 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-neutral-300 font-medium">GigaFlow Protocol v2.4</span>
            </span>
            <span className="hidden md:inline text-neutral-600">/</span>
            <span className="hidden md:inline text-neutral-500">
              Autonomous Milestone Assurance &amp; Double-Entry Ledgers
            </span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-brand-base transition-colors font-medium"
          >
            <span>Operator Terminal</span>
            <span className="text-brand-base">→</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}
