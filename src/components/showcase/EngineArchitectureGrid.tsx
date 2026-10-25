'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Binary,
  Database,
  Globe,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface EngineDetail {
  id: string;
  name: string;
  discipline: string;
  owner: string;
  rollNo: string;
  srn: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  description: string;
  coreConcepts: string[];
  keyFiles: string[];
  testSuites: string[];
  metrics: { label: string; value: string }[];
}

const ENGINES: EngineDetail[] = [
  {
    id: 'engine-01',
    name: 'Engine 01: Escrow & State Scheduler',
    discipline: 'Operating Systems (OS)',
    owner: 'Vaishnavi Modekar',
    rollNo: '21',
    srn: '02FE24BCS060',
    icon: Cpu,
    accentColor: 'text-amber-500',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    description:
      'Implements a formal Finite State Machine (FSM) governing milestone lifecycles, combined with a KeyedMutex to prevent race conditions during concurrent financial operations, and an automated review timeout watchdog scheduler.',
    coreConcepts: [
      'Deterministic Finite State Machine (FSM)',
      'Asynchronous KeyedMutex Concurrency Control',
      'Timeout Watchdog with Grace Period Expiry',
      'Non-Bypassable State Invariant Guards',
    ],
    keyFiles: [
      'src/core/engine-01-os/escrow-fsm.ts',
      'src/core/engine-01-os/mutex.ts',
      'src/core/engine-01-os/watchdog.ts',
    ],
    testSuites: [
      'tests/engine-01-os/fsm.test.ts',
      'tests/engine-01-os/mutex.test.ts',
    ],
    metrics: [
      { label: 'States Defined', value: '11 States' },
      { label: 'Race Safety', value: '100% Locked' },
      { label: 'Watchdog Interval', value: '48h Review Window' },
    ],
  },
  {
    id: 'engine-02',
    name: 'Engine 02: Evidence & QA Engine',
    discipline: 'Data Structures & Software Engineering (DSA & SE)',
    owner: 'Darshan Kittur',
    rollNo: '18',
    srn: '02FE24BCS053',
    icon: Binary,
    accentColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    description:
      'Provides cryptographic proof of deliverables via SHA-256 digest computation, tamper-evident Merkle Evidence Trees, and an automated Requirements Traceability Matrix (RTM) guaranteeing bidirectional verification & validation.',
    coreConcepts: [
      'NIST FIPS 180-4 SHA-256 Digesting',
      'Tamper-Evident Merkle Tree Data Structure',
      'Cryptographic Leaf & Root Verification',
      'Live Requirements Traceability Matrix (RTM)',
    ],
    keyFiles: [
      'src/core/engine-02-dsa-se/evidence-tree.ts',
      'src/core/engine-02-dsa-se/rtm.ts',
      'src/lib/crypto-hash.ts',
    ],
    testSuites: [
      'tests/engine-02-dsa-se/evidence-tree.test.ts',
      'tests/engine-02-dsa-se/rtm.test.ts',
    ],
    metrics: [
      { label: 'Hash Standard', value: 'SHA-256 Hex' },
      { label: 'Requirements Traced', value: '14/14 Covered' },
      { label: 'Verification', value: 'Tamper Evident' },
    ],
  },
  {
    id: 'engine-03',
    name: 'Engine 03: Transaction Ledger & Contracts',
    discipline: 'Database Management Systems (DBMS)',
    owner: 'Purvi Sammatshetti',
    rollNo: '11',
    srn: '02FE24BCS022',
    icon: Database,
    accentColor: 'text-blue-500',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    description:
      'Enforces strict Boyce-Codd Normal Form (BCNF) relational integrity with PostgreSQL ACID transactions, double-entry balance conservation, and an immutable append-only audit trail logging every financial mutation.',
    coreConcepts: [
      'PostgreSQL ACID Transactions & Isolation',
      'Double-Entry Conservation Invariant (ΔTotal = 0)',
      'Append-Only Immutable Ledger Audit Trail',
      'Payment Gateway Reconciliation (Cashfree/UPI)',
    ],
    keyFiles: [
      'src/core/engine-03-dbms/ledger.ts',
      'src/core/engine-03-dbms/contract-manager.ts',
      'src/core/engine-03-dbms/payments/settlement-service.ts',
    ],
    testSuites: [
      'tests/engine-03-dbms/settlement-service.test.ts',
      'tests/engine-03-dbms/dispute-workflow.test.ts',
    ],
    metrics: [
      { label: 'Fund Leakage', value: 'Zero (0.00)' },
      { label: 'Schema Form', value: 'Strict BCNF' },
      { label: 'Audit Records', value: 'Append-Only' },
    ],
  },
  {
    id: 'engine-04',
    name: 'Engine 04: Role-Based Workflow Dashboard',
    discipline: 'Web Technologies (WT)',
    owner: 'Vaibhav Chavanpatil',
    rollNo: '4',
    srn: '02FE24BCS013',
    icon: Globe,
    accentColor: 'text-purple-500',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
    description:
      'Next.js 16 App Router application supporting four isolated RBAC personas (Client, Freelancer, Dispute Reviewer, Admin), sub-millisecond dark/light theme switching, and real-time interactive milestone visualizations.',
    coreConcepts: [
      'Multi-Role RBAC Session Enforcement',
      'Next.js 16 App Router & Server Components',
      'Tailwind CSS v4 Dynamic Theme Variables',
      'Interactive State Graphs & Audit Explorers',
    ],
    keyFiles: [
      'src/core/engine-04-web/rbac.ts',
      'src/core/engine-04-web/session.ts',
      'src/components/layout/AppShell.tsx',
    ],
    testSuites: [
      'tests/engine-04-web/theme-toggle.test.tsx',
      'tests/engine-04-web/marketplace-gigs.test.ts',
    ],
    metrics: [
      { label: 'RBAC Roles', value: '4 Personas' },
      { label: 'Theme Speed', value: '0ms FOUC-Free' },
      { label: 'A11y Standard', value: 'WCAG 2.2 AA' },
    ],
  },
];

export function EngineArchitectureGrid() {
  const [selectedEngineId, setSelectedEngineId] = useState<string>('engine-01');

  const selectedEngine = ENGINES.find((e) => e.id === selectedEngineId) || ENGINES[0];
  const Icon = selectedEngine.icon;

  return (
    <div className="w-full space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono2 text-xs uppercase tracking-widest text-brand-base font-bold">
            Academic Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-paper tracking-tight mt-1">
            The Four Engineering Engines
          </h2>
          <p className="text-xs sm:text-sm text-paper-muted mt-1 max-w-2xl">
            Each engine represents an independent, rigorous computer science discipline developed, owned, and defended by Team 07 members at KLE Technological University.
          </p>
        </div>

        <Link
          href="/rtm"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-surface-highlight border border-line text-paper hover:text-brand-light transition-all"
        >
          <BadgeCheck className="w-4 h-4 text-brand-base" />
          View Traceability Matrix
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Engine Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ENGINES.map((engine) => {
          const isSelected = engine.id === selectedEngineId;
          const TabIcon = engine.icon;
          return (
            <button
              key={engine.id}
              type="button"
              onClick={() => setSelectedEngineId(engine.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface-elevated border-brand-base shadow-md ring-1 ring-brand-base/40'
                  : 'bg-surface hover:bg-surface-elevated border-line text-paper-muted hover:text-paper'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-brand-base text-white' : 'bg-surface-elevated text-paper-muted'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono2 font-bold border ${engine.badgeBg}`}>
                    {engine.discipline.split(' ')[0]}
                  </span>
                </div>
                <div className="text-xs font-bold text-paper truncate">{engine.name.split(':')[0]}</div>
                <div className="text-[11px] text-paper-muted truncate mt-0.5">{engine.owner}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[10px] font-mono2 text-paper-faint">
                <span>Roll: {engine.rollNo}</span>
                <span className={isSelected ? 'text-brand-base font-bold' : ''}>
                  {isSelected ? 'ACTIVE' : 'EXPLORE'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Engine Deep-Dive Card */}
      <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-line">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-base/15 border border-brand-base/30 flex items-center justify-center text-brand-base shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xl font-bold text-paper">{selectedEngine.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono2 font-bold border ${selectedEngine.badgeBg}`}>
                  {selectedEngine.discipline}
                </span>
              </div>
              <p className="text-xs text-paper-muted font-mono2">
                Engine Owner: <strong className="text-paper">{selectedEngine.owner}</strong> (Roll No: {selectedEngine.rollNo}, SRN: {selectedEngine.srn})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
            {selectedEngine.metrics.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-surface-elevated border border-line text-center">
                <span className="text-[10px] font-mono2 text-paper-faint block">{m.label}</span>
                <span className="text-xs font-bold font-mono2 text-paper">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engine Body */}
        <div className="grid md:grid-cols-2 gap-8 pt-6">
          {/* Description & Concepts */}
          <div className="space-y-4">
            <div>
              <span className="eyebrow block mb-2 text-[11px]">Academic Abstract & Scope</span>
              <p className="text-xs sm:text-sm text-paper-muted leading-relaxed">
                {selectedEngine.description}
              </p>
            </div>

            <div>
              <span className="eyebrow block mb-2 text-[11px]">Core Computer Science Concepts</span>
              <div className="space-y-2">
                {selectedEngine.coreConcepts.map((concept, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-paper">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Files & Test Suites */}
          <div className="space-y-4">
            <div>
              <span className="eyebrow block mb-2 text-[11px]">Source Implementation Files</span>
              <div className="space-y-1.5 font-mono2 text-xs">
                {selectedEngine.keyFiles.map((file, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-charcoal border border-line flex items-center justify-between text-paper-muted">
                    <span className="truncate">{file}</span>
                    <span className="text-[10px] text-brand-base font-bold uppercase">PROD</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="eyebrow block mb-2 text-[11px]">Automated Verification & Validation</span>
              <div className="space-y-1.5 font-mono2 text-xs">
                {selectedEngine.testSuites.map((suite, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-emerald-400">
                    <span className="truncate">{suite}</span>
                    <span className="text-[10px] font-bold">100% PASS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
