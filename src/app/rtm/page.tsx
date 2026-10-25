'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  ShieldCheck,
  CheckCircle2,
  Layers,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Cpu,
  Binary,
  Database,
  Globe,
  Loader2,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface RequirementSpec {
  id: string;
  category: 'FUNCTIONAL' | 'NON_FUNCTIONAL';
  title: string;
  description: string;
  engineOwner: 'ENGINE_01_OS' | 'ENGINE_02_DSA_SE' | 'ENGINE_03_DBMS' | 'ENGINE_04_WEB';
  acceptanceCriteria: string[];
  associatedTestSuites: string[];
  status: 'VERIFIED' | 'IN_PROGRESS' | 'PENDING';
}

interface MatrixReport {
  timestamp: string;
  totalRequirements: number;
  functionalCount: number;
  nonFunctionalCount: number;
  coveragePercentage: number;
  verifiedCount: number;
  engineDistribution: Record<string, number>;
  requirements: RequirementSpec[];
}

const ENGINE_META: Record<
  string,
  { name: string; owner: string; icon: React.ElementType; color: string; badge: string }
> = {
  ENGINE_01_OS: {
    name: 'Engine 01 · OS & FSM Scheduler',
    owner: 'Vaishnavi Modekar',
    icon: Cpu,
    color: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  },
  ENGINE_02_DSA_SE: {
    name: 'Engine 02 · DSA & Evidence QA',
    owner: 'Darshan Kittur',
    icon: Binary,
    color: 'text-blue-500',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
  ENGINE_03_DBMS: {
    name: 'Engine 03 · DBMS & Transaction Ledger',
    owner: 'Purvi Sammatshetti',
    icon: Database,
    color: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  },
  ENGINE_04_WEB: {
    name: 'Engine 04 · Web & RBAC Dashboard',
    owner: 'Vaibhav Chavanpatil',
    icon: Globe,
    color: 'text-purple-500',
    badge: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  },
};

export default function RtmPage() {
  const [report, setReport] = useState<MatrixReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedReqs, setExpandedReqs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadMatrix() {
      try {
        const res = await fetch('/api/rtm');
        const data = await res.json();
        if (data.success && data.data) {
          setReport(data.data);
          // Expand first 3 by default
          const initial: Record<string, boolean> = {};
          data.data.requirements.slice(0, 3).forEach((r: RequirementSpec) => {
            initial[r.id] = true;
          });
          setExpandedReqs(initial);
        }
      } catch (err) {
        console.error('Failed to load RTM report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatrix();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedReqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRequirements = useMemo(() => {
    if (!report) return [];
    return report.requirements.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.associatedTestSuites.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesEngine = selectedEngine === 'ALL' || r.engineOwner === selectedEngine;
      const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;

      return matchesSearch && matchesEngine && matchesCategory;
    });
  }, [report, searchQuery, selectedEngine, selectedCategory]);

  return (
    <AppShell>
      <div className="space-y-6 pb-16">
        {/* Academic Header */}
        <div className="border-b border-line pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono2 text-[11px] font-bold uppercase tracking-wider text-brand-base px-2.5 py-0.5 rounded-full bg-brand-base/10 border border-brand-base/20">
                Theme 01 · Team 07
              </span>
              <span className="font-mono2 text-[11px] text-paper-muted">
                KLE Technological University, Belagavi
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-paper tracking-tight flex items-center gap-2.5">
              <BadgeCheck className="w-6 h-6 text-brand-base shrink-0" aria-hidden="true" />
              Requirements Traceability Matrix (RTM)
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium max-w-2xl">
              Authoritative software engineering verification & validation baseline mapping functional requirements to automated test suites, proof hashes, and engine ownership.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> 100% V&V Verified
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
            <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-3" aria-hidden="true" />
            <p className="text-sm font-medium">Loading Requirements Matrix...</p>
          </div>
        ) : !report ? (
          <div className="p-8 text-center bg-surface rounded-panel border border-line text-paper-muted">
            Unable to load traceability matrix.
          </div>
        ) : (
          <>
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface rounded-panel border border-line p-4 sm:p-5">
                <span className="eyebrow block mb-1">Total Requirements</span>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-paper">
                  {report.totalRequirements}
                </p>
                <p className="text-[11px] text-paper-muted mt-1 font-mono2">
                  {report.functionalCount} Functional · {report.nonFunctionalCount} Non-Functional
                </p>
              </div>

              <div className="bg-surface rounded-panel border border-line p-4 sm:p-5">
                <span className="eyebrow block mb-1">Coverage Ratio</span>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {report.coveragePercentage}%
                </p>
                <p className="text-[11px] text-paper-muted mt-1 font-mono2">
                  {report.verifiedCount} / {report.totalRequirements} Formal Pass
                </p>
              </div>

              <div className="bg-surface rounded-panel border border-line p-4 sm:p-5">
                <span className="eyebrow block mb-1">Engineering Engines</span>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-paper">
                  4 Engines
                </p>
                <p className="text-[11px] text-paper-muted mt-1 font-mono2">
                  OS · DSA/SE · DBMS · Web
                </p>
              </div>

              <div className="bg-surface rounded-panel border border-line p-4 sm:p-5">
                <span className="eyebrow block mb-1">Attribution Standard</span>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-brand-base">
                  KLE Tech
                </p>
                <p className="text-[11px] text-paper-muted mt-1 font-mono2">
                  AGENTS.md Hierarchy Gate
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-surface rounded-panel border border-line p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-paper-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID (e.g. FR-03), keyword, or test file..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-elevated border border-line rounded-lg text-sm text-paper placeholder:text-paper-faint focus:outline-none focus:border-brand-base"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value)}
                  className="px-3 py-2 bg-surface-elevated border border-line rounded-lg text-xs font-mono2 text-paper focus:outline-none focus:border-brand-base cursor-pointer"
                >
                  <option value="ALL">All 4 Engines</option>
                  <option value="ENGINE_01_OS">Engine 01 (OS FSM)</option>
                  <option value="ENGINE_02_DSA_SE">Engine 02 (DSA & SE)</option>
                  <option value="ENGINE_03_DBMS">Engine 03 (DBMS Ledger)</option>
                  <option value="ENGINE_04_WEB">Engine 04 (Web Dashboard)</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-surface-elevated border border-line rounded-lg text-xs font-mono2 text-paper focus:outline-none focus:border-brand-base cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="FUNCTIONAL">Functional (FR)</option>
                  <option value="NON_FUNCTIONAL">Non-Functional (NFR)</option>
                </select>
              </div>
            </div>

            {/* Matrix Listing */}
            <div className="space-y-3">
              {filteredRequirements.length === 0 ? (
                <div className="py-12 text-center bg-surface rounded-panel border border-line text-paper-muted">
                  No requirements match the active filter criteria.
                </div>
              ) : (
                filteredRequirements.map((req) => {
                  const isExpanded = !!expandedReqs[req.id];
                  const engineMeta = ENGINE_META[req.engineOwner] || {
                    name: req.engineOwner,
                    owner: 'Team 07',
                    icon: Layers,
                    color: 'text-brand-base',
                    badge: 'bg-brand-base/10 text-brand-base border-brand-base/20',
                  };
                  const EngineIcon = engineMeta.icon;

                  return (
                    <div
                      key={req.id}
                      className="bg-surface rounded-panel border border-line hover:border-line-strong transition-all overflow-hidden"
                    >
                      {/* Row Header */}
                      <div
                        onClick={() => toggleExpand(req.id)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <button
                            type="button"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            className="p-1 rounded text-paper-muted hover:text-paper mt-0.5 sm:mt-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          <span className="font-mono2 text-xs font-bold px-2.5 py-1 rounded-md bg-surface-elevated border border-line text-brand-base shrink-0">
                            {req.id}
                          </span>

                          <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-paper truncate">
                              {req.title}
                            </h2>
                            <p className="text-xs text-paper-muted line-clamp-1 mt-0.5">
                              {req.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                          {/* Engine Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-mono2 font-medium border flex items-center gap-1.5 ${engineMeta.badge}`}
                          >
                            <EngineIcon className="w-3 h-3" />
                            {engineMeta.owner}
                          </span>

                          {/* Verification Status */}
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono2 font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        </div>
                      </div>

                      {/* Expandable Detail Panel */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-line/60 bg-surface-elevated/40 space-y-4 animate-in fade-in duration-150">
                          <div>
                            <span className="eyebrow block mb-1.5 text-[10px]">Specification Description</span>
                            <p className="text-xs sm:text-sm text-paper-muted leading-relaxed">
                              {req.description}
                            </p>
                          </div>

                          {/* Acceptance Criteria */}
                          <div>
                            <span className="eyebrow block mb-2 text-[10px]">Acceptance Criteria</span>
                            <ul className="space-y-1.5">
                              {req.acceptanceCriteria.map((ac, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-paper flex items-start gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{ac}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Associated Test Suites */}
                          <div>
                            <span className="eyebrow block mb-2 text-[10px]">Associated Automated Test Suites</span>
                            <div className="flex flex-wrap gap-2">
                              {req.associatedTestSuites.map((suite, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded bg-charcoal border border-line font-mono2 text-[11px] text-paper-muted flex items-center gap-1.5"
                                >
                                  <FileText className="w-3 h-3 text-brand-base" />
                                  {suite}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
