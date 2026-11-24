'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import {
  Sparkles,
  MessageSquare,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  ListChecks,
  Mic,
  Square,
  Upload,
  Send,
  Hash,
  Volume2,
  Briefcase,
  Code2,
} from 'lucide-react';
import {
  useVoiceNegotiation,
  SpeakerRole,
  VoiceTranscriptionTurn,
} from '@/hooks/useVoiceNegotiation';

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
  transcriptHash: string;
  retrievedContext: {
    matchedDocuments: Array<{
      id: string;
      title: string;
      category: string;
      similarityScore: number;
      matchedTokens?: string[];
    }>;
    appliedClauses: string[];
  };
  modelUsed: string;
  generationMode: 'GROQ_RAG' | 'DETERMINISTIC_FALLBACK';
  summaryExplanation: string;
}

function toDateInputValue(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function RagContractNegotiatorModal({
  isOpen,
  onClose,
  project,
  proposal,
  currentUserId,
  onContractCreated,
}: RagNegotiatorProps) {
  const defaultTranscript = `Client: We liked your proposal. Can we split this into 2 milestones? Phase 1 for core architecture and hashing setup, and Phase 2 for full verification tests and final hand-off?\nFreelancer (${proposal.freelancerName}): Agreed! Let's structure both phases cleanly for the total agreed bid of ₹${proposal.bidAmount}.`;

  const [chatTranscript, setChatTranscript] = useState(defaultTranscript);
  const [speakerRole, setSpeakerRole] = useState<SpeakerRole>('CLIENT');
  const [quickMessage, setQuickMessage] = useState('');
  const [autoDraftAfterVoice, setAutoDraftAfterVoice] = useState(true);
  const [voiceHistory, setVoiceHistory] = useState<VoiceTranscriptionTurn[]>([]);
  const [dualSignOff, setDualSignOff] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ragData, setRagData] = useState<RagApiResponse | null>(null);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setChatTranscript(
      `Client: We liked your proposal. Can we split this into 2 milestones? Phase 1 for core architecture and hashing setup, and Phase 2 for full verification tests and final hand-off?\nFreelancer (${proposal.freelancerName}): Agreed! Let's structure both phases cleanly for the total agreed bid of ₹${proposal.bidAmount}.`
    );
    setVoiceHistory([]);
    setQuickMessage('');
    setDualSignOff(false);
    setRagData(null);
    setMilestones([]);
    setError(null);
    setSuccessMsg(null);
  }, [proposal.id, proposal.bidAmount, proposal.freelancerName]);

  const runRagGeneration = async (transcriptOverride?: string) => {
    const activeTranscript = transcriptOverride ?? chatTranscript;
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
          chatTranscript: activeTranscript,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to generate milestones via RAG.');
      }

      setRagData(data.data);
      setMilestones(data.data.milestones || []);
      setDualSignOff(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during RAG generation.');
    } finally {
      setLoading(false);
    }
  };

  const {
    isRecording,
    isTranscribing,
    recordingSeconds,
    liveCaptions,
    audioLevels,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    transcribeUploadedFile,
  } = useVoiceNegotiation({
    proposalId: proposal.id,
    currentUserId,
    onTranscribed: (turn) => {
      setVoiceHistory((prev) => [...prev, turn]);
      const updatedTranscript = chatTranscript.trim()
        ? `${chatTranscript.trim()}\n${turn.formattedLine}`
        : turn.formattedLine;
      setChatTranscript(updatedTranscript);
      if (autoDraftAfterVoice) {
        void runRagGeneration(updatedTranscript);
      }
    },
    onError: (msg) => setError(msg),
  });

  const handleClose = () => {
    if (isRecording) {
      cancelRecording();
    }
    onClose();
  };

  const handleAppendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = quickMessage.trim();
    if (!trimmed) return;
    const label = speakerRole === 'CLIENT' ? 'Client' : `Freelancer (${proposal.freelancerName})`;
    const timeTag = new Date().toISOString().slice(11, 16);
    const line = `[${timeTag} UTC] [${label}]: ${trimmed}`;
    setChatTranscript((prev) => (prev.trim() ? `${prev.trim()}\n${line}` : line));
    setQuickMessage('');
  };

  const handleUploadAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const speakerName = speakerRole === 'FREELANCER' ? proposal.freelancerName : undefined;
    void transcribeUploadedFile(file, speakerRole, speakerName);
  };

  const presets = [
    {
      label: '2-Stage Agile Delivery',
      text: `Client: Let's split this project into two sprints. Sprint 1 covers architecture and UI layout. Sprint 2 covers core APIs, SHA-256 checksums, and automated testing for ₹${proposal.bidAmount}.`,
    },
    {
      label: '3-Phase Enterprise',
      text: `Client: We agreed on 3 phases: 1) Architecture & schemas (30%), 2) Core implementation & security (40%), 3) Testing suite & verification hand-off (30%).\nFreelancer (${proposal.freelancerName}): Confirmed for ₹${proposal.bidAmount} total.`,
    },
    {
      label: 'Clear Log',
      text: '',
    },
  ];

  const handleCreateContract = async () => {
    if (milestones.length === 0) {
      setError('Please generate milestones before forming the contract.');
      return;
    }
    if (!dualSignOff) {
      setError('Confirm both Client & Freelancer agreement on the drafted milestones before locking escrow.');
      return;
    }

    setSubmittingContract(true);
    setError(null);
    try {
      const payload = {
        proposalId: proposal.id,
        transcriptHash: ragData?.transcriptHash,
        milestones: milestones.map((m) => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          dueDate: new Date(m.dueDate).toISOString(),
          acceptanceChecklist: m.acceptanceChecklist,
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

      setSuccessMsg('Escrow contract formed with verified milestones and transcript audit hash.');
      setTimeout(() => {
        onContractCreated();
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to form escrow contract.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const totalCalculatedAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const isBalanced = Math.abs(totalCalculatedAmount - proposal.bidAmount) < 0.05;
  const formatTimer = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      maxWidthClass="max-w-4xl"
      title="Voice, Chat & RAG Contract Architect"
      description="Record live audio negotiations via Groq Whisper (whisper-large-v3-turbo) or chat directly, then synthesize verified escrow milestones with Engine 02 RAG."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 text-xs font-mono2 text-paper-muted">
            {milestones.length > 0 && (
              <span className={isBalanced ? 'text-success-light font-semibold' : 'text-danger-light font-semibold'}>
                Total: ₹{totalCalculatedAmount.toFixed(2)} / ₹{proposal.bidAmount.toFixed(2)}{' '}
                {isBalanced ? '✓ Balanced' : '⚠ Adjust amounts to match bid'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={loading || submittingContract || isTranscribing}
              onClick={handleClose}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
            {milestones.length > 0 && (
              <button
                type="button"
                disabled={loading || submittingContract || !isBalanced || !dualSignOff}
                onClick={handleCreateContract}
                className="btn btn-sm btn-primary flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingContract ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Forming Contract...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Approve &amp; Create Contract
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Scope Strip */}
        <div className="p-3 bg-charcoal-muted/60 border border-line rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-mono2 text-paper-faint uppercase block">Project Scope</span>
            <p className="font-semibold text-paper truncate">{project.title}</p>
            <span className="text-[11px] text-paper-muted font-mono2">
              Budget: ₹{project.budget.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono2 text-paper-faint uppercase block">Selected Engineer &amp; Bid</span>
            <p className="font-semibold text-paper truncate">{proposal.freelancerName}</p>
            <span className="text-[11px] text-success-light font-mono2 font-bold">
              Agreed Bid: ₹{proposal.bidAmount.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono2 text-paper-faint uppercase block">Evidence Seal</span>
            {ragData?.transcriptHash ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono2 text-brand-light">
                <Hash className="w-3 h-3 text-brand-base" />
                {ragData.transcriptHash.slice(0, 14)}…
              </span>
            ) : (
              <span className="text-[11px] font-mono2 text-paper-muted">Generated on draft</span>
            )}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div role="alert" className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div role="status" className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Two-Column Negotiation Studio + Contract Architect */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Audio/Voice & Chat Negotiation Room (5 cols) */}
          <div className="lg:col-span-5 space-y-3 p-3.5 rounded-xl bg-charcoal border border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-paper flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-brand-base" />
                Live Voice &amp; Chat Room
              </h3>
              <span className="text-[10px] font-mono2 text-brand-light px-1.5 py-0.5 rounded bg-brand-base/10 border border-brand-base/30">
                Whisper v3 Turbo
              </span>
            </div>

            {/* Active Speaker Switcher */}
            <div>
              <span className="text-[10px] font-mono2 uppercase text-paper-faint block mb-1">
                Active Speaker Attribution
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-charcoal-muted border border-line">
                <button
                  type="button"
                  disabled={isRecording || isTranscribing}
                  onClick={() => setSpeakerRole('CLIENT')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono2 font-semibold transition-all cursor-pointer ${
                    speakerRole === 'CLIENT'
                      ? 'bg-brand-base text-charcoal shadow-sm'
                      : 'text-paper-muted hover:text-paper'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Client
                </button>
                <button
                  type="button"
                  disabled={isRecording || isTranscribing}
                  onClick={() => setSpeakerRole('FREELANCER')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono2 font-semibold transition-all cursor-pointer ${
                    speakerRole === 'FREELANCER'
                      ? 'bg-emerald-500 text-charcoal shadow-sm'
                      : 'text-paper-muted hover:text-paper'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Freelancer
                </button>
              </div>
            </div>

            {/* Voice Capture Card */}
            <div className="p-3 rounded-xl bg-charcoal-muted/70 border border-line space-y-2.5">
              {isRecording ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono2 text-rose-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      REC {formatTimer(recordingSeconds)} · {speakerRole}
                    </span>
                    <div className="flex items-end gap-1 h-5" aria-hidden="true">
                      {audioLevels.map((lvl, idx) => (
                        <span
                          key={idx}
                          style={{ height: `${Math.max(20, lvl)}%` }}
                          className="w-1 rounded-full bg-brand-base transition-all duration-75"
                        />
                      ))}
                    </div>
                  </div>
                  {liveCaptions && (
                    <p className="text-[11px] font-mono2 text-paper-muted italic bg-charcoal/80 p-2 rounded border border-line/60">
                      Live preview: {liveCaptions}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={stopAndTranscribe}
                      className="flex-1 btn btn-sm btn-primary flex items-center justify-center gap-1.5"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      Stop &amp; Transcribe
                    </button>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="btn btn-sm btn-ghost text-xs"
                    >
                      Discard
                    </button>
                  </div>
                </>
              ) : isTranscribing ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono2 text-brand-light">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-base" />
                  Transcribing speaker audio with Groq Whisper...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || submittingContract}
                    onClick={() =>
                      startRecording(
                        speakerRole,
                        speakerRole === 'FREELANCER' ? proposal.freelancerName : undefined
                      )
                    }
                    className="flex-1 btn btn-sm btn-secondary flex items-center justify-center gap-1.5 border border-brand-base/40 text-brand-light hover:border-brand-base"
                  >
                    <Mic className="w-3.5 h-3.5 text-brand-base" />
                    Record {speakerRole === 'CLIENT' ? 'Client' : 'Freelancer'} Voice
                  </button>
                  <button
                    type="button"
                    disabled={loading || submittingContract}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload pre-recorded audio clip (webm, wav, mp3, m4a)"
                    className="btn btn-sm btn-ghost border border-line flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Audio
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/webm"
                    onChange={handleUploadAudioChange}
                    className="hidden"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-[11px] font-mono2 text-paper-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoDraftAfterVoice}
                  onChange={(e) => setAutoDraftAfterVoice(e.target.checked)}
                  className="accent-brand-base rounded"
                />
                Auto-draft contract milestones after voice turn
              </label>

              {voiceHistory.length > 0 && (
                <div className="pt-1 border-t border-line/50 text-[10px] font-mono2 text-success-light">
                  ✓ {voiceHistory.length} verified voice clip{voiceHistory.length > 1 ? 's' : ''} hashed &amp; transcribed
                </div>
              )}
            </div>

            {/* Quick Text Chat Turn Input */}
            <form onSubmit={handleAppendMessage} className="flex items-center gap-1.5">
              <input
                type="text"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder={`Type message as ${speakerRole.toLowerCase()}...`}
                className="flex-1 text-xs font-mono2 px-2.5 py-2 rounded-lg bg-charcoal-muted border border-line text-paper placeholder-paper-faint focus:outline-none focus:border-brand-base"
              />
              <button
                type="submit"
                disabled={!quickMessage.trim()}
                aria-label="Append negotiation message"
                className="btn btn-sm btn-secondary px-2.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Full Editable Negotiation Transcript */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="rag-chat-transcript"
                  className="text-[11px] font-medium text-paper flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3 h-3 text-brand-base" /> Combined Negotiation Log
                </label>
                <span className="text-[10px] font-mono2 text-paper-faint">RAG Context</span>
              </div>
              <textarea
                id="rag-chat-transcript"
                rows={5}
                value={chatTranscript}
                onChange={(e) => setChatTranscript(e.target.value)}
                className="w-full text-[11px] font-mono2 p-2.5 bg-charcoal-muted border border-line rounded-xl text-paper placeholder-paper-faint focus:outline-none focus:border-brand-base resize-y"
                placeholder="Voice transcriptions and negotiated chat messages appear here..."
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setChatTranscript(preset.text)}
                    className="text-[10px] font-mono2 px-2 py-0.5 rounded-md bg-charcoal-muted border border-line hover:border-brand-base text-paper-muted hover:text-paper transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={loading || submittingContract || isRecording || isTranscribing}
              onClick={() => runRagGeneration()}
              className="w-full btn btn-md btn-primary flex items-center justify-center gap-2 shadow-lg shadow-brand-base/15"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Retrieving Patterns &amp; Drafting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{milestones.length > 0 ? 'Re-Draft Milestones via RAG' : 'Draft Contract Milestones via RAG'}</span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: Retrieved Context & Editable Contract Milestones (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {!ragData && milestones.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-line bg-charcoal/50 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-brand-base mx-auto" />
                <p className="text-sm font-semibold text-paper">Ready to Synthesize Escrow Contract</p>
                <p className="text-xs text-paper-muted max-w-md mx-auto">
                  Record a voice agreement on the left or refine the chat log, then click{' '}
                  <strong className="text-paper">Draft Contract Milestones via RAG</strong> to retrieve engineering
                  templates and build an editable contract draft.
                </p>
              </div>
            )}

            {ragData && (
              <div className="p-3 bg-charcoal border border-brand-base/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-brand-light flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-brand-base" /> Retrieved Knowledge Context
                  </span>
                  <span className="text-[10px] font-mono2 px-2 py-0.5 rounded bg-brand-base/20 text-brand-light border border-brand-base/30">
                    {ragData.generationMode === 'GROQ_RAG' ? `Groq: ${ragData.modelUsed}` : 'Deterministic Fallback'}
                  </span>
                </div>

                <p className="text-xs text-paper-muted italic">{ragData.summaryExplanation}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ragData.retrievedContext.matchedDocuments.map((doc) => (
                    <div key={doc.id} className="p-2 bg-charcoal-muted rounded-lg border border-line text-[11px]">
                      <div className="flex items-center justify-between font-semibold text-paper gap-2">
                        <span className="truncate">{doc.title}</span>
                        <span className="text-[10px] font-mono2 text-success-light shrink-0">
                          {(doc.similarityScore * 100).toFixed(0)}% fit
                        </span>
                      </div>
                      <p className="text-[10px] font-mono2 text-paper-faint mt-0.5 truncate">
                        {doc.category}
                        {doc.matchedTokens && doc.matchedTokens.length > 0
                          ? ` · matched: ${doc.matchedTokens.slice(0, 4).join(', ')}`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-start gap-1.5 text-[10px] font-mono2 text-paper-faint">
                  <ShieldCheck className="w-3.5 h-3.5 text-success-base shrink-0 mt-0.5" />
                  <span>
                    Escrow Policies Applied: SHA-256 deliverable checksum, 7-day watchdog window, dispute Merkle arbitration.
                  </span>
                </div>
              </div>
            )}

            {milestones.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-paper uppercase tracking-wider font-mono2">
                    Editable Draft Milestones ({milestones.length})
                  </h4>
                  <span className="text-[10px] font-mono2 text-paper-faint">
                    Review amounts &amp; criteria before escrow lock
                  </span>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-charcoal border border-line hover:border-brand-base/50 rounded-xl space-y-2 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setMilestones(updated);
                          }}
                          className="flex-1 text-xs font-semibold text-paper bg-transparent border-b border-line focus:border-brand-base focus:outline-none pb-0.5"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-mono2 text-paper-muted">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={m.amount}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[idx] = { ...updated[idx], amount: Number(e.target.value) };
                              setMilestones(updated);
                            }}
                            className="w-24 text-xs font-mono2 font-bold text-paper bg-charcoal-muted px-2 py-0.5 rounded border border-line text-right focus:outline-none focus:border-brand-base"
                          />
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={m.description}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setMilestones(updated);
                        }}
                        className="w-full text-xs text-paper-muted bg-charcoal-muted/50 border border-line/60 rounded-lg p-2 focus:outline-none focus:border-brand-base resize-none"
                      />

                      <div className="flex items-center justify-between pt-1 border-t border-line/50 text-[10px] font-mono2 text-paper-faint">
                        <label className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-brand-base" />
                          <span>Due:</span>
                          <input
                            type="date"
                            value={toDateInputValue(m.dueDate)}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const updated = [...milestones];
                              updated[idx] = {
                                ...updated[idx],
                                dueDate: new Date(`${e.target.value}T00:00:00.000Z`).toISOString(),
                              };
                              setMilestones(updated);
                            }}
                            className="bg-charcoal-muted border border-line rounded px-1.5 py-0.5 text-paper focus:outline-none focus:border-brand-base"
                          />
                        </label>
                        <span className="flex items-center gap-1 text-paper-muted">
                          <ListChecks className="w-3 h-3 text-success-base" />{' '}
                          {m.acceptanceChecklist.length} criteria persisted
                        </span>
                      </div>

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

                {/* Explicit Dual-Party Safeguard before locking escrow */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-tint/20 border border-brand-base/30 text-xs text-paper cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dualSignOff}
                    onChange={(e) => setDualSignOff(e.target.checked)}
                    className="mt-0.5 accent-brand-base"
                  />
                  <span>
                    <strong className="text-brand-light">Two-Party Verification Sign-Off:</strong> Client and{' '}
                    <strong>{proposal.freelancerName}</strong> reviewed the drafted milestone amounts, deadlines, and
                    acceptance checklists (sealed with SHA-256 transcript digest).
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
