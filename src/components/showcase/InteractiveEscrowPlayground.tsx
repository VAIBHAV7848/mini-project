'use client';

import React, { useState, useId } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  FileCode,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Cpu,
  Coins,
} from 'lucide-react';
import { syncSha256Hex } from '@/lib/crypto-hash';

export type SimState =
  | 'AWAITING_DEPOSIT'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'RELEASED'
  | 'DISPUTED';

const FSM_STEPS: { state: SimState; label: string; desc: string; icon: React.ElementType }[] = [
  { state: 'AWAITING_DEPOSIT', label: '1. Awaiting Deposit', desc: 'Contract drafted, awaiting fund lock', icon: Lock },
  { state: 'FUNDED', label: '2. Escrow Funded', desc: 'Funds atomically locked in mutex', icon: Shield },
  { state: 'IN_PROGRESS', label: '3. Work In Progress', desc: 'Freelancer active on milestone', icon: FileCode },
  { state: 'UNDER_REVIEW', label: '4. Deliverable Review', desc: 'SHA-256 evidence submitted', icon: FileCheck },
  { state: 'RELEASED', label: '5. Funds Released', desc: 'ACID ledger settlement complete', icon: ShieldCheck },
];

export function InteractiveEscrowPlayground() {
  const amountSliderId = useId();
  const deliverableInputId = useId();
  const [milestoneAmount, setMilestoneAmount] = useState<number>(25000);
  const [currentState, setCurrentState] = useState<SimState>('AWAITING_DEPOSIT');
  const [deliverableFile, setDeliverableFile] = useState<string>('production-auth-service.ts');
  const [deliverableContent, setDeliverableContent] = useState<string>(
    'export const sessionToken = "ecc-ed25519-v4-hmac";\nexport function verifySignature(msg, sig) { return true; }'
  );
  const [auditLog, setAuditLog] = useState<{ time: string; action: string; fsmState: string }[]>([
    { time: '00:00:00', action: 'Simulation Initialized', fsmState: 'AWAITING_DEPOSIT' },
  ]);

  // Compute live SHA-256 of the deliverable
  const computedHash = React.useMemo(() => {
    return syncSha256Hex(`${deliverableFile}::${deliverableContent}`);
  }, [deliverableFile, deliverableContent]);

  // Double-entry accounting balances
  const initialClientReserve = 100000;
  let clientBalance = initialClientReserve;
  let escrowLocked = 0;
  let freelancerBalance = 0;

  if (currentState === 'FUNDED' || currentState === 'IN_PROGRESS' || currentState === 'UNDER_REVIEW') {
    clientBalance = initialClientReserve - milestoneAmount;
    escrowLocked = milestoneAmount;
    freelancerBalance = 0;
  } else if (currentState === 'RELEASED') {
    clientBalance = initialClientReserve - milestoneAmount;
    escrowLocked = 0;
    freelancerBalance = milestoneAmount;
  } else if (currentState === 'DISPUTED') {
    clientBalance = initialClientReserve - milestoneAmount;
    escrowLocked = milestoneAmount;
    freelancerBalance = 0;
  }

  const addLog = (action: string, nextState: SimState) => {
    const now = new Date().toLocaleTimeString();
    setAuditLog((prev) => [{ time: now, action, fsmState: nextState }, ...prev.slice(0, 5)]);
    setCurrentState(nextState);
  };

  const handleDeposit = () => {
    addLog(`[Escrow Concurrency] Locked ₹${milestoneAmount.toLocaleString('en-IN')} in Escrow Vault`, 'FUNDED');
  };

  const handleStartWork = () => {
    addLog('[Milestone Lifecycle] Freelancer initiated milestone (IN_PROGRESS)', 'IN_PROGRESS');
  };

  const handleSubmitDeliverable = () => {
    addLog(`[Evidence Engine] Generated SHA-256 deliverable checksum [${computedHash.substring(0, 10)}...]`, 'UNDER_REVIEW');
  };

  const handleApprove = () => {
    addLog(`[Ledger Settlement] Executed double-entry transfer of ₹${milestoneAmount.toLocaleString('en-IN')}`, 'RELEASED');
  };

  const handleDispute = () => {
    addLog('[Dispute Workflow] Arbitration triggered. Case escalated to Reviewer.', 'DISPUTED');
  };

  const handleReset = () => {
    setCurrentState('AWAITING_DEPOSIT');
    setAuditLog([{ time: new Date().toLocaleTimeString(), action: 'Simulation Reset', fsmState: 'AWAITING_DEPOSIT' }]);
  };

  const currentStepIndex = FSM_STEPS.findIndex((s) => s.state === currentState);

  return (
    <div className="w-full bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-base/15 border border-brand-base/30 flex items-center justify-center text-brand-base">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-paper">In-Browser Escrow & Evidence Playground</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono2 font-bold bg-brand-tint border border-brand-base/30 text-brand-light">
                LIVE SIMULATOR
              </span>
            </div>
            <p className="text-xs text-paper-muted">
              Interactive client-side simulation of Deterministic FSM Lifecycles, Cryptographic SHA-256 Checksums, and Mathematical Balance Conservation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-paper-muted hover:text-paper bg-surface-elevated hover:bg-surface-highlight border border-line transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Simulation
        </button>
      </div>

      {/* Main Grid: Controls & Visualizer */}
      <div className="grid lg:grid-cols-12 gap-6 pt-6">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Milestone Amount Slider */}
          <div className="bg-surface-elevated p-4 rounded-xl border border-line">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={amountSliderId} className="text-xs font-semibold text-paper flex items-center gap-1.5 cursor-pointer">
                <Coins className="w-4 h-4 text-brand-base" />
                Escrow Milestone Value
              </label>
              <span className="font-mono2 text-sm font-bold text-brand-light">
                ₹{milestoneAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              id={amountSliderId}
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={milestoneAmount}
              disabled={currentState !== 'AWAITING_DEPOSIT'}
              onChange={(e) => setMilestoneAmount(Number(e.target.value))}
              className="w-full accent-brand-base cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] font-mono2 text-paper-faint mt-1">
              <span>₹5,000</span>
              <span>₹50,000</span>
              <span>₹100,000</span>
            </div>
          </div>

          {/* Deliverable & Live SHA-256 Hasher */}
          <div className="bg-surface-elevated p-4 rounded-xl border border-line space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor={deliverableInputId} className="text-xs font-semibold text-paper flex items-center gap-1.5 cursor-pointer">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Deliverable Code & Live SHA-256 Hasher
              </label>
              <span className="text-[10px] font-mono2 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                FIPS 180-4 NIST
              </span>
            </div>

            <div>
              <span className="text-[11px] text-paper-muted block mb-1">Target File Name:</span>
              <input
                id={deliverableInputId}
                type="text"
                value={deliverableFile}
                onChange={(e) => setDeliverableFile(e.target.value)}
                disabled={currentState === 'RELEASED'}
                className="w-full px-3 py-1.5 text-xs font-mono2 bg-charcoal border border-line rounded-lg text-paper focus:border-brand-base focus:outline-none"
                placeholder="e.g. deliverable-v1.zip"
              />
            </div>

            <div>
              <span className="text-[11px] text-paper-muted block mb-1">Source Payload (modify to observe checksum update):</span>
              <textarea
                value={deliverableContent}
                onChange={(e) => setDeliverableContent(e.target.value)}
                disabled={currentState === 'RELEASED'}
                rows={2}
                className="w-full px-3 py-1.5 text-[11px] font-mono2 bg-charcoal border border-line rounded-lg text-paper focus:border-brand-base focus:outline-none resize-none"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-charcoal border border-line font-mono2 text-[11px]">
              <span className="text-paper-faint text-[10px] block uppercase tracking-wider mb-0.5">
                Computed SHA-256 Digest:
              </span>
              <span className="text-brand-light break-all select-all font-bold">
                {computedHash}
              </span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-paper block">Available FSM Action:</span>

            {currentState === 'AWAITING_DEPOSIT' && (
              <button
                type="button"
                onClick={handleDeposit}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-brand-base hover:bg-brand-light transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Deposit ₹{milestoneAmount.toLocaleString('en-IN')} (Client Action)
              </button>
            )}

            {currentState === 'FUNDED' && (
              <button
                type="button"
                onClick={handleStartWork}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                Start Work (Freelancer Action)
              </button>
            )}

            {currentState === 'IN_PROGRESS' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSubmitDeliverable}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  Submit Evidence
                </button>
                <button
                  type="button"
                  onClick={handleDispute}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs text-danger-light bg-danger-tint hover:bg-danger/25 border border-danger/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Raise Dispute
                </button>
              </div>
            )}

            {currentState === 'UNDER_REVIEW' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Approve & Release
                </button>
                <button
                  type="button"
                  onClick={handleDispute}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs text-danger-light bg-danger-tint hover:bg-danger/25 border border-danger/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Raise Dispute
                </button>
              </div>
            )}

            {currentState === 'RELEASED' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Milestone successfully completed! Funds credited to Freelancer.</span>
              </div>
            )}

            {currentState === 'DISPUTED' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Escrow locked. Merkle evidence tree submitted to Judge Reviewer.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: FSM Visualizer & Balance Conservation */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          {/* FSM Step Timeline */}
          <div className="bg-surface-elevated p-5 rounded-xl border border-line">
            <span className="text-xs font-semibold text-paper block mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-base" />
              Milestone Lifecycle: Finite State Machine (FSM)
            </span>

            <div className="space-y-3">
              {FSM_STEPS.map((step, idx) => {
                const isCurrent = step.state === currentState;
                const isPassed = currentStepIndex > idx && currentState !== 'DISPUTED';
                const Icon = step.icon;

                return (
                  <div
                    key={step.state}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-brand-tint border-brand-base/50 text-paper shadow-sm'
                        : isPassed
                        ? 'bg-charcoal/60 border-emerald-500/30 text-paper-muted'
                        : 'bg-charcoal/30 border-line text-paper-faint'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isCurrent
                            ? 'bg-brand-base text-white'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-surface text-paper-faint'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono2">{step.label}</div>
                        <div className="text-[11px] text-paper-muted">{step.desc}</div>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono2 font-bold bg-brand-base text-charcoal">
                        ACTIVE STATE
                      </span>
                    )}
                  </div>
                );
              })}

              {currentState === 'DISPUTED' && (
                <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/40 text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-charcoal flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono2">DISPUTED (Alternative Branch)</div>
                      <div className="text-[11px] text-paper-muted">Arbitration workflow activated</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono2 font-bold bg-amber-400 text-charcoal">
                    UNDER ARBITRATION
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ACID Balance Conservation Matrix */}
          <div className="bg-surface-elevated p-5 rounded-xl border border-line">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-paper flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Double-Entry Accounting: Fund Conservation Invariant
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono2 font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                ΔTotal = 0 (INVARIANT SATISFIED)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-charcoal border border-line">
                <span className="text-[10px] font-mono2 text-paper-muted uppercase block mb-1">Client Reserve</span>
                <span className="text-sm font-bold font-mono2 text-blue-400">
                  ₹{clientBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal border border-line">
                <span className="text-[10px] font-mono2 text-paper-muted uppercase block mb-1">Escrow Vault</span>
                <span className="text-sm font-bold font-mono2 text-amber-400">
                  ₹{escrowLocked.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal border border-line">
                <span className="text-[10px] font-mono2 text-paper-muted uppercase block mb-1">Freelancer Account</span>
                <span className="text-sm font-bold font-mono2 text-emerald-400">
                  ₹{freelancerBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Invariant proof */}
            <div className="mt-3 p-2 rounded bg-charcoal/60 border border-line font-mono2 text-[10px] text-paper-faint flex items-center justify-between">
              <span>Conservation Invariant:</span>
              <span className="text-paper">
                ₹{clientBalance.toLocaleString()} + ₹{escrowLocked.toLocaleString()} + ₹{freelancerBalance.toLocaleString()} = ₹1,00,000
              </span>
            </div>
          </div>

          {/* Live Action Audit Trail */}
          <div className="bg-charcoal p-4 rounded-xl border border-line font-mono2 text-[11px]">
            <span className="text-[10px] text-paper-muted uppercase tracking-wider block mb-2">
              Tamper-Resistant Simulation Audit Log:
            </span>
            <div className="space-y-1">
              {auditLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-paper-muted text-[11px]">
                  <span className="text-paper-faint">[{log.time}]</span>
                  <span className="text-brand-light font-bold">[{log.fsmState}]</span>
                  <span className="text-paper truncate">{log.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
