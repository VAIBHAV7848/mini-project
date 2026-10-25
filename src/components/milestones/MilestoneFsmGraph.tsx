'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Lock,
  Play,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

export type FsmState =
  | 'AWAITING_DEPOSIT'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED';

interface MilestoneFsmGraphProps {
  currentState: FsmState | string;
  milestoneTitle?: string;
  reviewDeadline?: string | null;
  userRole?: 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';
  onActionClick?: (action: string) => void;
}

interface StateStep {
  id: FsmState;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  actor: 'Client' | 'Freelancer' | 'Arbitrator' | 'System';
}

const LINEAR_STEPS: StateStep[] = [
  {
    id: 'AWAITING_DEPOSIT',
    label: 'Deposit',
    sublabel: 'Funds Pending',
    icon: Lock,
    actor: 'Client',
  },
  {
    id: 'FUNDED',
    label: 'Funded',
    sublabel: 'Escrow Locked',
    icon: ShieldCheck,
    actor: 'System',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    sublabel: 'Commenced',
    icon: Play,
    actor: 'Freelancer',
  },
  {
    id: 'UNDER_REVIEW',
    label: 'Under Review',
    sublabel: 'SHA-256 Submitted',
    icon: FileCheck2,
    actor: 'Client',
  },
  {
    id: 'RELEASED',
    label: 'Released',
    sublabel: 'Disbursed',
    icon: CheckCircle2,
    actor: 'System',
  },
];

export function MilestoneFsmGraph({
  currentState,
  milestoneTitle,
  reviewDeadline,
  userRole = 'CLIENT',
  onActionClick,
}: MilestoneFsmGraphProps) {
  // Normalize submitted or timeout to under_review for pipeline display
  const normalizedState =
    currentState === 'SUBMITTED' || currentState === 'APPROVED' || currentState === 'REVIEW_TIMEOUT'
      ? 'UNDER_REVIEW'
      : currentState;

  // Compute step indices
  const activeIndex = useMemo(() => {
    if (normalizedState === 'DISPUTED' || normalizedState === 'REFUNDED') return -1;
    const found = LINEAR_STEPS.findIndex((s) => s.id === normalizedState);
    return found !== -1 ? found : 0;
  }, [normalizedState]);

  // Review Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!reviewDeadline) return;

    const deadline = new Date(reviewDeadline).getTime();
    if (isNaN(deadline)) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [reviewDeadline]);

  return (
    <div className="card p-0 border border-line bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-line bg-surface-highlight/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono2 text-[10px] font-bold uppercase tracking-wider text-brand-base px-2 py-0.5 rounded bg-brand-base/10 border border-brand-base/20">
            Engine 01 · OS FSM
          </span>
          <span className="text-xs text-white font-bold truncate max-w-xs">{milestoneTitle || 'Milestone State Lifecycle'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono2 text-paper-faint">FSM Status:</span>
          <span
            className={`font-mono2 text-xs font-bold px-2 py-0.5 rounded ${
              currentState === 'DISPUTED'
                ? 'bg-danger-tint text-danger-light border border-danger/30'
                : currentState === 'RELEASED'
                  ? 'bg-success-tint text-success-light border border-success/30'
                  : 'bg-brand-base/15 text-brand-light border border-brand-base/30'
            }`}
          >
            {currentState}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Branch Alert if Disputed or Refunded */}
        {currentState === 'DISPUTED' && (
          <div className="p-3.5 rounded-xl bg-danger-tint/30 border border-danger/50 text-danger-light flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">FSM Branch: ESCROW FROZEN IN ARBITRATION</p>
              <p className="text-paper-muted">
                Normal linear progression halted. Funds locked until an assigned Dispute Reviewer issues a binding ruling
                via Engine 03 atomic ledger transaction.
              </p>
            </div>
          </div>
        )}

        {currentState === 'REFUNDED' && (
          <div className="p-3.5 rounded-xl bg-warning-tint/30 border border-warning/50 text-warning-light flex items-start gap-3">
            <RotateCcw className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">FSM Terminal State: ESCROW REFUNDED TO CLIENT</p>
              <p className="text-paper-muted">
                Arbitrator ruled in favor of client refund or contract cancellation occurred. Escrow balance returned to
                client wallet.
              </p>
            </div>
          </div>
        )}

        {/* 5-State Linear FSM Progress Track */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {LINEAR_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = activeIndex > idx && currentState !== 'DISPUTED';
              const isCurrent = activeIndex === idx && currentState !== 'DISPUTED';
              const isUpcoming = activeIndex < idx || currentState === 'DISPUTED';

              return (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-xl border transition-all text-center relative flex flex-col items-center justify-between min-h-[110px] ${
                    isCurrent
                      ? 'bg-surface-elevated border-brand-base ring-2 ring-brand-base/30 shadow-md'
                      : isPast
                        ? 'bg-surface-elevated/70 border-success/40 text-paper-muted'
                        : 'bg-surface-elevated/30 border-line/60 opacity-60'
                  }`}
                >
                  {/* Step Actor Tag */}
                  <span className="text-[9px] font-mono2 uppercase tracking-wider text-paper-faint mb-1">
                    {step.actor}
                  </span>

                  {/* Icon with glowing pulse if active */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors my-1 ${
                      isCurrent
                        ? 'bg-brand-base text-charcoal font-bold animate-pulse'
                        : isPast
                          ? 'bg-success/20 text-success-light'
                          : 'bg-charcoal border border-line text-paper-faint'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Labels */}
                  <div className="w-full">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent ? 'text-white' : isPast ? 'text-paper' : 'text-paper-muted'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] font-mono2 text-paper-faint truncate mt-0.5">{step.sublabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Timeout Section (Engine 01 Timeout Mechanics) */}
        {(currentState === 'SUBMITTED' || currentState === 'UNDER_REVIEW') && reviewDeadline && (
          <div className="p-4 rounded-xl bg-charcoal border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-base/15 border border-brand-base/30 flex items-center justify-center text-brand-base shrink-0">
                <Clock className="w-4 h-4 animate-spin text-brand-base" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Engine 01 Review Timeout Scheduler</p>
                <p className="text-paper-muted">
                  Client has a strict 7-day review window. If no dispute is filed before timeout, freelancer can
                  unilaterally claim escrow release.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              {timeLeft.isExpired ? (
                <div className="px-3 py-1.5 rounded-lg bg-warning-tint border border-warning/40 text-warning-light text-xs font-bold font-mono2">
                  TIMEOUT EXPIRED · AUTO-RELEASE UNLOCKED
                </div>
              ) : (
                <div className="font-mono2 text-xs">
                  <span className="text-paper-faint text-[10px] block uppercase">Time Remaining</span>
                  <span className="text-brand-light font-bold text-sm">
                    {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FSM Invariants & Properties Note */}
        <div className="flex items-center gap-2 text-[11px] font-mono2 text-paper-faint pt-1">
          <Info className="w-3.5 h-3.5 text-brand-base shrink-0" />
          <span>Formally verified FSM: atomic lock on deposit, zero unbacked transitions, strict role guards.</span>
        </div>
      </div>
    </div>
  );
}
