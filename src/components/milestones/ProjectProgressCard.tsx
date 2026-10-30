'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Layers,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import {
  calculateProjectProgress,
  MilestoneProgressInput,
} from '@/core/engine-04-web/project-progress';

export interface MilestoneProgressItem extends MilestoneProgressInput {}

export interface ProjectProgressCardProps {
  contractId: string;
  projectTitle: string;
  totalAmount: number;
  escrowBalance: number;
  milestones: MilestoneProgressItem[];
  userRole: 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';
  onAction?: (action: string, milestoneId?: string) => void;
}

export function ProjectProgressCard({
  contractId,
  projectTitle,
  totalAmount,
  escrowBalance,
  milestones,
  userRole,
  onAction,
}: ProjectProgressCardProps) {
  const summary = calculateProjectProgress(milestones, totalAmount, escrowBalance);
  const {
    totalMilestones,
    completedMilestones,
    progressPercentage,
    releasedAmount,
    currentMilestone,
  } = summary;

  const formatRupee = (val: number) =>
    `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Countdown Timer for Engine 01 Review Window
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!currentMilestone?.reviewDeadline) return;
    const deadline = new Date(currentMilestone.reviewDeadline).getTime();
    if (isNaN(deadline)) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentMilestone?.reviewDeadline]);

  return (
    <section
      aria-label="Project execution progress and active milestone"
      className="bg-surface-elevated/40 border border-line rounded-xl p-5 mb-6 space-y-5"
    >
      {/* 1. Header Metrics: Completion & Financial Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-base animate-pulse" aria-hidden="true" />
            <h4 className="text-xs font-mono2 font-bold uppercase tracking-wider text-paper-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-base" aria-hidden="true" /> Project Progress
            </h4>
          </div>
          <p className="text-xl font-display font-bold text-zinc-900 dark:text-white mt-1">
            {completedMilestones} of {totalMilestones} Milestones Completed{' '}
            <span className="text-brand-base font-mono2 text-lg">({progressPercentage}%)</span>
          </p>
        </div>

        {/* Financial Escrow Breakdown */}
        <div className="flex items-center gap-3 bg-surface border border-line px-4 py-2.5 rounded-lg text-right">
          <div>
            <span className="text-[11px] font-mono2 text-paper-faint block uppercase">
              Settled / Total
            </span>
            <span className="font-mono2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupee(releasedAmount)}{' '}
              <span className="text-paper-muted font-normal">/ {formatRupee(totalAmount)}</span>
            </span>
          </div>
          <div className="w-px h-7 bg-line" aria-hidden="true" />
          <div>
            <span className="text-[11px] font-mono2 text-paper-faint block uppercase">
              In Escrow
            </span>
            <span className="font-mono2 text-xs font-bold text-brand-dark dark:text-brand-light flex items-center gap-1 justify-end">
              <Lock className="w-3 h-3 text-brand-base" aria-hidden="true" /> {formatRupee(escrowBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Segmented Multi-State Progress Bar */}
      <div>
        <div
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Project milestone progress: ${progressPercentage}%`}
          className="w-full h-3 bg-surface border border-line rounded-full overflow-hidden flex gap-1 p-0.5"
        >
          {milestones.map((m) => {
            const isReleased = m.status === 'RELEASED' || m.status === 'COMPLETED';
            const isApproved = m.status === 'APPROVED';
            const isActive = currentMilestone?.id === m.id && !isReleased;
            return (
              <div
                key={m.id}
                title={`M-${m.sequenceOrder}: ${m.title} (${m.status})`}
                className={`h-full rounded-full transition-all duration-500 ${
                  isReleased
                    ? 'bg-emerald-500 flex-1'
                    : isApproved
                    ? 'bg-emerald-400 ring-2 ring-emerald-300 flex-1'
                    : isActive
                    ? 'bg-brand-base flex-1 ring-2 ring-brand-tint animate-pulse'
                    : 'bg-line/40 flex-1'
                }`}
              />
            );
          })}
        </div>

        {/* Segment Labels */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {milestones.map((m) => {
            const isReleased = m.status === 'RELEASED' || m.status === 'COMPLETED';
            const isApproved = m.status === 'APPROVED';
            const isActive = currentMilestone?.id === m.id && !isReleased;
            return (
              <div
                key={m.id}
                className="text-[11px] font-mono2 flex items-center gap-1.5 truncate"
              >
                {isReleased ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" aria-hidden="true" />
                ) : isApproved ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-brand-base shrink-0 animate-ping" aria-hidden="true" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-line shrink-0" aria-hidden="true" />
                )}
                <span className="sr-only">
                  ({isReleased ? 'Completed' : isApproved ? 'Approved' : isActive ? 'Active' : 'Upcoming'})
                </span>
                <span
                  className={`truncate ${
                    isActive
                      ? 'font-bold text-brand-dark dark:text-brand-light'
                      : isReleased || isApproved
                      ? 'text-paper-muted line-through'
                      : 'text-paper-faint'
                  }`}
                >
                  M-{String(m.sequenceOrder).padStart(2, '0')}: {m.title.substring(0, 18)}…
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CURRENT ACTIVE MILESTONE SPOTLIGHT BANNER */}
      {currentMilestone && (
        <div
          className={`rounded-xl border p-4 transition-all ${
            currentMilestone.status === 'DISPUTED'
              ? 'bg-rose-500/10 border-rose-500/30'
              : currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW'
              ? 'bg-brand-tint/25 border-brand-base/40 shadow-sm'
              : currentMilestone.status === 'APPROVED'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-surface border-line'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono2 text-[10px] font-bold uppercase tracking-wider text-charcoal bg-brand-base px-2 py-0.5 rounded shadow-xs">
                  Current Milestone: M-{String(currentMilestone.sequenceOrder).padStart(2, '0')}
                </span>
                <span className="text-[12px] font-mono2 text-paper-faint">
                  Amount:{' '}
                  <strong className="text-zinc-900 dark:text-white">
                    {formatRupee(currentMilestone.amount)}
                  </strong>
                </span>
                <span
                  className={`badge text-[10px] font-mono2 uppercase ${
                    currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW'
                      ? 'badge-brand'
                      : currentMilestone.status === 'APPROVED'
                      ? 'badge-success'
                      : currentMilestone.status === 'DISPUTED'
                      ? 'badge-danger'
                      : ''
                  }`}
                >
                  {currentMilestone.status}
                </span>
              </div>

              <h5 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                {currentMilestone.title}
              </h5>

              {/* Status context description */}
              <div className="text-xs text-paper-muted">
                {(currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW') &&
                  userRole === 'CLIENT' && (
                    <span className="text-brand-dark dark:text-brand-light font-medium flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-base inline" aria-hidden="true" />
                      Deliverable submitted with SHA-256 cryptographic proof. Review required.
                    </span>
                  )}
                {(currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW') &&
                  userRole === 'FREELANCER' && (
                    <span>Deliverable submitted. Waiting for client verification and approval.</span>
                  )}
                {currentMilestone.status === 'IN_PROGRESS' && userRole === 'FREELANCER' && (
                  <span>
                    Funds locked in escrow. Milestone commenced — submit verified deliverables when ready.
                  </span>
                )}
                {currentMilestone.status === 'IN_PROGRESS' && userRole === 'CLIENT' && (
                  <span>
                    Freelancer is actively working on this milestone. Escrow funds remain safely protected.
                  </span>
                )}
                {currentMilestone.status === 'FUNDED' && userRole === 'FREELANCER' && (
                  <span className="text-brand-dark dark:text-brand-light font-medium">
                    Escrow deposit confirmed. Ready to start development.
                  </span>
                )}
                {currentMilestone.status === 'AWAITING_DEPOSIT' && userRole === 'CLIENT' && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Escrow deposit required to unlock milestone work.
                  </span>
                )}
                {currentMilestone.status === 'APPROVED' && userRole === 'CLIENT' && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Deliverable approved! Release escrow funds to disburse payment to freelancer.
                  </span>
                )}
                {currentMilestone.status === 'DISPUTED' && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    Escrow frozen. Dispute reviewer arbitration currently in progress.
                  </span>
                )}
              </div>

              {/* Review Window Countdown */}
              {(currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW') &&
                currentMilestone.reviewDeadline && (
                  <div className="flex items-center gap-2 pt-1 font-mono2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-brand-base motion-safe:animate-pulse" aria-hidden="true" />
                    <span className="text-paper-faint">Review Window:</span>
                    {timeLeft.isExpired ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        EXPIRED · AUTO-RELEASE READY
                      </span>
                    ) : (
                      <span className="text-brand-dark dark:text-brand-light font-bold">
                        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                        {String(timeLeft.hours).padStart(2, '0')}h :{' '}
                        {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
                        {String(timeLeft.seconds).padStart(2, '0')}s
                      </span>
                    )}
                  </div>
                )}
            </div>

            {/* Direct Action Trigger Buttons */}
            <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0">
              {(currentMilestone.status === 'SUBMITTED' || currentMilestone.status === 'UNDER_REVIEW') &&
                userRole === 'CLIENT' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction?.('APPROVE_MILESTONE', currentMilestone.id)}
                      className="btn btn-sm btn-primary"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Approve Work
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction?.('RAISE_DISPUTE', currentMilestone.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Dispute
                    </button>
                  </>
                )}
              {currentMilestone.status === 'APPROVED' && userRole === 'CLIENT' && (
                <button
                  type="button"
                  onClick={() => onAction?.('RELEASE_ESCROW', currentMilestone.id)}
                  className="btn btn-sm btn-primary"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Release Escrow
                </button>
              )}
              {currentMilestone.status === 'AWAITING_DEPOSIT' && userRole === 'CLIENT' && (
                <button
                  type="button"
                  onClick={() => onAction?.('DEPOSIT', currentMilestone.id)}
                  className="btn btn-sm btn-primary"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Deposit Escrow
                </button>
              )}
              {currentMilestone.status === 'FUNDED' && userRole === 'FREELANCER' && (
                <button
                  type="button"
                  onClick={() => onAction?.('START_WORK', currentMilestone.id)}
                  className="btn btn-sm btn-secondary"
                >
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /> Start Work
                </button>
              )}
              {currentMilestone.status === 'IN_PROGRESS' && userRole === 'FREELANCER' && (
                <button
                  type="button"
                  onClick={() => onAction?.('SUBMIT_DELIVERABLE', currentMilestone.id)}
                  className="btn btn-sm btn-secondary"
                >
                  <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" /> Submit Evidence
                </button>
              )}
              {currentMilestone.status === 'DISPUTED' &&
                (userRole === 'REVIEWER' || userRole === 'ADMIN') && (
                  <a href="/disputes" className="btn btn-sm btn-secondary">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Open Dispute File
                  </a>
                )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
