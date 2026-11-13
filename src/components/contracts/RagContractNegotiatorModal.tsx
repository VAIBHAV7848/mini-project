'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import {
  Sparkles,
  Bot,
  MessageSquare,
  FileText,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  ChevronRight,
  ListChecks,
} from 'lucide-react';

export interface RagNegotiatorProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    budget: number;
    skillTags: string[];
    description?: string;
  };
  proposal: {
    id: string;
    freelancerId: string;
    freelancerName: string;
    bidAmount: number;
    coverLetter: string;
  };
  currentUserId: string;
  onContractCreated: () => void;
}

interface MilestoneDraft {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  acceptanceChecklist: string[];
}

interface RagApiResponse {
  milestones: MilestoneDraft[];
  totalAmount: number;
  retrievedContext: {
    matchedDocuments: Array<{
      id: string;
      title: string;
      category: string;
      similarityScore: number;
    }>;
    appliedClauses: string[];
  };
  modelUsed: string;
  generationMode: 'GROQ_RAG' | 'DETERMINISTIC_FALLBACK';
  summaryExplanation: string;
}

export function RagContractNegotiatorModal({
  isOpen,
  onClose,
  project,
  proposal,
  currentUserId,
  onContractCreated,
}: RagNegotiatorProps) {
  const [chatTranscript, setChatTranscript] = useState(
    `Client: We liked your proposal. Can we break this down into 2 phases? Phase 1 for core UI and authentication in 5 days, and Phase 2 for complete backend APIs and tests in 10 days?\nFreelancer: Absolutely! I agree to that timeline for the total agreed bid of ₹${proposal.bidAmount}.`
  );
  const [loading, setLoading] = useState(false);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ragData, setRagData] = useState<RagApiResponse | null>(null);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);

  // Preset quick chat snippets
  const presets = [
    {
      label: '⚡ 2-Stage Agile Delivery',
      text: `Client: Let's split this project into two sprints. Sprint 1 covers UI layout and mockups. Sprint 2 covers backend integration, crypto evidence checksums, and testing for the total bid of ₹${proposal.bidAmount}.`,
    },
    {
      label: '🚀 3-Phase Enterprise Pipeline',
      text: `Client: We need 3 clear milestones: 1) Initial architecture & RBAC (30%), 2) Business logic & state transitions (40%), 3) Security audit, test suites, and final hand-off (30%).\nFreelancer: Agreed, I will deliver with 100% test pass rate for ₹${proposal.bidAmount}.`,
    },
    {
      label: '📱 Mobile Cross-Platform Flow',
      text: `Client: We agreed on cross-platform screens first in 7 days, native camera/storage integration in 8 days, and final store release build in 5 days for the total ₹${proposal.bidAmount}.`,
    },
  ];

  const handleGenerateRag = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contracts/rag-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          chatTranscript,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to generate milestones via RAG.');
      }

      setRagData(data.data);
      setMilestones(data.data.milestones || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during RAG generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (milestones.length === 0) {
      setError('Please generate milestones before forming the contract.');
      return;
    }

    setSubmittingContract(true);
    setError(null);
    try {
      const payload = {
        proposalId: proposal.id,
        milestones: milestones.map((m) => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          dueDate: m.dueDate,
        })),
      };

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to form escrow contract.');
      }

      setSuccessMsg('Escrow contract formed successfully! Redirecting to dashboard...');
      setTimeout(() => {
        onContractCreated();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to form escrow contract.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const totalCalculatedAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const isBalanced = Math.abs(totalCalculatedAmount - proposal.bidAmount) < 0.05;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="RAG Milestone Contract Architect"
      description="Synthesize structured, verified escrow milestones from negotiation chat using Groq LLM and retrieved software engineering templates."
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-mono2 text-paper-muted">
            {milestones.length > 0 && (
              <span className={isBalanced ? 'text-success-light' : 'text-danger-light'}>
                Total: ₹{totalCalculatedAmount.toFixed(2)} / ₹{proposal.bidAmount.toFixed(2)}{' '}
                {isBalanced ? '✓ Balanced' : '⚠️ Discrepancy'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || submittingContract}
              onClick={onClose}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
            {milestones.length > 0 && (
              <button
                type="button"
                disabled={loading || submittingContract || !isBalanced}
                onClick={handleCreateContract}
                className="btn btn-sm btn-primary flex items-center gap-1.5"
              >
                {submittingContract ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Forming Contract...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Accept & Lock Escrow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Project & Freelancer Scope Card */}
        <div className="p-3 bg-charcoal-muted/60 border border-line rounded-xl grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-mono2 text-paper-faint uppercase block">Project</span>
            <p className="font-semibold text-paper line-clamp-1">{project.title}</p>
            <span className="text-xs text-brand-light font-mono2 font-bold">
              Budget: ₹{project.budget.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono2 text-paper-faint uppercase block">
              Freelancer & Bid
            </span>
            <p className="font-semibold text-paper line-clamp-1">{proposal.freelancerName}</p>
            <span className="text-xs text-success-light font-mono2 font-bold">
              Agreed Bid: ₹{proposal.bidAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Negotiation Chat Transcript Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-paper flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-base" /> Client-Freelancer Negotiation
              Transcript
            </label>
            <span className="text-[10px] font-mono2 text-paper-faint">RAG Input</span>
          </div>
          <textarea
            rows={3}
            value={chatTranscript}
            onChange={(e) => setChatTranscript(e.target.value)}
            className="w-full text-xs font-mono2 p-2.5 bg-charcoal border border-line rounded-xl text-paper placeholder-paper-faint focus:outline-none focus:border-brand-base resize-none"
            placeholder="Paste or type negotiation chat between client and freelancer..."
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] font-mono2 text-paper-faint self-center">Presets:</span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatTranscript(preset.text)}
                className="text-[10px] font-mono2 px-2 py-0.5 rounded-lg bg-charcoal border border-line hover:border-brand-base text-paper-muted hover:text-paper transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <button
            type="button"
            disabled={loading || submittingContract}
            onClick={handleGenerateRag}
            className="w-full btn btn-md btn-primary flex items-center justify-center gap-2 shadow-lg shadow-brand-base/15"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Retrieving Templates & Calling Groq LLM...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Generate Smart Milestones via RAG</span>
              </>
            )}
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* RAG Retrieved Context & Citations Card */}
        {ragData && (
          <div className="p-3 bg-charcoal border border-brand-base/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-light flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-brand-base" /> Retrieved Engineering Knowledge (RAG)
              </span>
              <span className="text-[10px] font-mono2 px-2 py-0.5 rounded bg-brand-base/20 text-brand-light border border-brand-base/30">
                {ragData.generationMode === 'GROQ_RAG' ? `Groq: ${ragData.modelUsed}` : 'Deterministic Heuristic'}
              </span>
            </div>

            <p className="text-xs text-paper-muted italic">{ragData.summaryExplanation}</p>

            {/* Matched Documents */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono2 text-paper-faint uppercase block">
                Top-K Matched Templates:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ragData.retrievedContext.matchedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 bg-charcoal-muted rounded-lg border border-line text-[11px]"
                  >
                    <div className="flex items-center justify-between font-semibold text-paper">
                      <span className="truncate">{doc.title}</span>
                      <span className="text-[10px] font-mono2 text-success-light shrink-0 ml-1">
                        {(doc.similarityScore * 100).toFixed(0)}% fit
                      </span>
                    </div>
                    <span className="text-[10px] font-mono2 text-paper-faint capitalize">
                      Category: {doc.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow Enforcement Notice */}
            <div className="pt-1 flex items-start gap-1.5 text-[10px] font-mono2 text-paper-faint">
              <ShieldCheck className="w-3.5 h-3.5 text-success-base shrink-0 mt-0.5" />
              <span>
                Mandatory Policy Injected: SHA-256 evidence hashing, 7-day watchdog auto-approval.
              </span>
            </div>
          </div>
        )}

        {/* Generated Milestones List */}
        {milestones.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-paper uppercase tracking-wider font-mono2">
                Generated Escrow Milestones ({milestones.length})
              </h4>
              <span className="text-[10px] font-mono2 text-paper-faint">
                Editable before contract creation
              </span>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-charcoal border border-line hover:border-brand-base/50 rounded-xl space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].title = e.target.value;
                          setMilestones(updated);
                        }}
                        className="w-full text-xs font-semibold text-paper bg-transparent border-b border-line focus:border-brand-base focus:outline-none pb-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs font-mono2 text-paper-muted">₹</span>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].amount = Number(e.target.value);
                          setMilestones(updated);
                        }}
                        className="w-20 text-xs font-mono2 font-bold text-paper bg-charcoal-muted px-1.5 py-0.5 rounded border border-line text-right focus:outline-none focus:border-brand-base"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-paper-muted">{m.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-line/50 text-[10px] font-mono2 text-paper-faint">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-brand-base" /> Due:{' '}
                      {new Date(m.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-paper-muted">
                      <ListChecks className="w-3 h-3 text-success-base" />{' '}
                      {m.acceptanceChecklist.length} checklist items
                    </span>
                  </div>

                  {/* Checklist items */}
                  {m.acceptanceChecklist.length > 0 && (
                    <div className="bg-charcoal-muted/50 p-2 rounded-lg space-y-1">
                      {m.acceptanceChecklist.map((item, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center gap-1.5 text-[10px] text-paper-muted font-mono2"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-success-base shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
