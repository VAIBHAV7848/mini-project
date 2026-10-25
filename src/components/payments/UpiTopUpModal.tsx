'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useRole } from '@/components/layout/RoleContext';

export interface UpiTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

interface OrderData {
  orderId: string;
  amountPaise: number;
  amountInr: number;
  upiUri: string;
  qrDataUrl: string;
  payeeVpa: string;
  payeeName: string;
  expiresAt: string;
}

type ModalStep = 'INPUT' | 'PAYMENT' | 'VERIFICATION' | 'SUCCESS';

const PRESET_AMOUNTS = [50, 100, 500, 1000, 5000];

export function UpiTopUpModal({ isOpen, onClose, onSuccess }: UpiTopUpModalProps) {
  const { currentPersona } = useRole();
  const [amount, setAmount] = useState<string>('50');
  const [step, setStep] = useState<ModalStep>('INPUT');
  const [loading, setLoading] = useState<boolean>(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [clientUtr, setClientUtr] = useState<string>('');
  const [utrSubmitting, setUtrSubmitting] = useState<boolean>(false);
  const [pollStatus, setPollStatus] = useState<string>('WAITING');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 min

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetState = useCallback(() => {
    setStep('INPUT');
    setLoading(false);
    setOrder(null);
    setErrorMessage(null);
    setCopied(false);
    setClientUtr('');
    setUtrSubmitting(false);
    setPollStatus('WAITING');
    setSecondsRemaining(600);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Timer countdown
  useEffect(() => {
    if (step === 'PAYMENT' || step === 'VERIFICATION') {
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMessage('Payment session timed out. Please generate a new QR code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Polling backend status
  useEffect(() => {
    if ((step === 'PAYMENT' || step === 'VERIFICATION') && order?.orderId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/upi/status?orderId=${encodeURIComponent(order.orderId)}`, {
            headers: { 'x-user-id': currentPersona.id },
          });
          const result = await res.json();
          if (result.success && result.data) {
            const status = result.data.status;
            setPollStatus(status);
            if (status === 'SUCCESS') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setStep('SUCCESS');
              if (onSuccess) onSuccess(result.data.newBalance);
            } else if (status === 'PENDING_REVIEW') {
              setStep('VERIFICATION');
            } else if (status === 'FAILED') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setErrorMessage(result.data.adminNotes || 'Payment verification was rejected.');
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2500);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [step, order?.orderId, currentPersona.id, onSuccess]);

  if (!isOpen) return null;

  // 1. Create UPI Order
  const handleGenerateQR = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      setErrorMessage('Minimum top-up amount is ₹10.00');
      return;
    }
    if (numAmount > 100000) {
      setErrorMessage('Maximum single top-up amount is ₹1,00,000.00');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/payments/upi/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          amountInr: numAmount,
          customerName: currentPersona.name,
          customerEmail: currentPersona.email,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to initiate UPI deposit.');
      }
      setOrder(data.data);
      setSecondsRemaining(600);
      setStep('PAYMENT');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create UPI payment session';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Manual UTR
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.orderId || clientUtr.trim().length < 8) {
      setErrorMessage('Please provide a valid 8 to 22 character Bank UTR / Reference number.');
      return;
    }

    setUtrSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/payments/upi/submit-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          orderId: order.orderId,
          utr: clientUtr.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to register UTR.');
      }
      setStep('VERIFICATION');
      setPollStatus('PENDING_REVIEW');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'UTR registration failed';
      setErrorMessage(msg);
    } finally {
      setUtrSubmitting(false);
    }
  };

  // Copy payment link
  const handleCopyLink = () => {
    if (!order?.upiUri) return;
    navigator.clipboard.writeText(order.upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-topup-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-surface border border-line-strong rounded-panel shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-surface-highlight/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-tint border border-brand-base/40 flex items-center justify-center text-brand-base font-bold">
              ₹
            </div>
            <div>
              <h2 id="upi-topup-title" className="font-display font-bold text-lg text-paper leading-tight">
                Add Balance (UPI Top-Up)
              </h2>
              <p className="text-xs font-mono2 text-paper-muted">GigaFlow Non-Custodial Escrow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-paper-muted hover:text-paper hover:bg-surface-elevated transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-danger-tint border border-danger/30 rounded-xl flex items-start gap-3 text-xs text-danger-light" role="alert">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: Amount Selection */}
          {step === 'INPUT' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="topup-amount" className="block text-xs font-semibold text-paper-muted uppercase tracking-wider mb-2">
                  Enter Deposit Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-brand-base font-mono2">
                    ₹
                  </span>
                  <input
                    id="topup-amount"
                    type="number"
                    min="10"
                    max="100000"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
                    className="w-full bg-surface-elevated border border-line focus:border-brand-base rounded-2xl pl-10 pr-4 py-3.5 text-2xl font-bold font-mono2 text-paper placeholder-paper-faint focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-paper-faint mt-1.5 font-mono2">
                  = {parseFloat(amount || '0').toFixed(2)} GF Tokens (1 GF = ₹1.00 INR)
                </p>
              </div>

              {/* Presets */}
              <div>
                <span className="block text-[11px] font-mono2 uppercase tracking-wider text-paper-faint mb-2">
                  Quick Presets
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className={`py-2 px-2 rounded-xl text-xs font-mono2 font-bold transition-all border ${
                        amount === preset.toString()
                          ? 'bg-brand-base text-charcoal border-brand-base shadow-xs'
                          : 'bg-surface-elevated hover:bg-surface-highlight text-paper border-line'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escrow Policy Callout */}
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-line flex items-center gap-3 text-xs text-paper-muted">
                <ShieldCheck className="w-5 h-5 text-brand-base shrink-0" aria-hidden="true" />
                <span>Deposited funds are credited to your marketplace balance and can be used to fund milestones.</span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={loading || !amount || parseFloat(amount) < 10}
                onClick={handleGenerateQR}
                className="w-full btn btn-lg btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Secure UPI QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate UPI Payment QR</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Payment Display & QR */}
          {(step === 'PAYMENT' || step === 'VERIFICATION') && order && (
            <div className="space-y-6 text-center">
              {/* Order Summary Pill */}
              <div className="p-3.5 bg-surface-elevated rounded-2xl border border-line flex items-center justify-between text-left">
                <div>
                  <span className="text-[10px] font-mono2 text-paper-faint uppercase">Payable Total</span>
                  <p className="text-xl font-bold font-mono2 text-paper">₹{order.amountInr.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono2 text-paper-faint uppercase">Order ID</span>
                  <p className="text-xs font-mono2 text-paper truncate max-w-[160px]">{order.orderId}</p>
                </div>
              </div>

              {/* High Contrast Genuine QR Code Display */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-brand-base/40 inline-block">
                  {order.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.qrDataUrl}
                      alt={`UPI QR Code to pay ₹${order.amountInr.toFixed(2)}`}
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex flex-col items-center justify-center text-black">
                      <QrCode className="w-16 h-16 animate-pulse" />
                      <p className="text-xs font-mono mt-2 font-bold">Loading QR...</p>
                    </div>
                  )}
                </div>

                {/* Expiry & Countdown */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated border border-line text-xs font-mono2 text-brand-light">
                  <Clock className="w-3.5 h-3.5 text-brand-base" />
                  <span>Session expires in {formatTimer(secondsRemaining)}</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="py-2">
                {step === 'VERIFICATION' ? (
                  <div className="p-3.5 rounded-xl bg-warning-tint border border-warning/30 flex items-center justify-center gap-2.5 text-xs font-medium text-warning-light">
                    <RefreshCw className="w-4 h-4 animate-spin text-warning-light shrink-0" />
                    <span>Payment Detected — Awaiting administrator bank credit confirmation...</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-surface-elevated border border-line flex items-center justify-center gap-2.5 text-xs text-paper-muted">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-base animate-ping" />
                    <span>Scan with Google Pay, PhonePe, Paytm, or BHIM...</span>
                  </div>
                )}
              </div>

              {/* Direct UPI App Launch Buttons (Mobile Intent Links) */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint">
                  Pay directly on Mobile
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`tez://upi/pay?pa=${encodeURIComponent(order.payeeVpa)}&pn=${encodeURIComponent(order.payeeName)}&am=${order.amountInr.toFixed(2)}&cu=INR&tr=${order.orderId}`}
                    className="py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-line flex items-center justify-center gap-1.5 text-xs font-bold text-paper transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-brand-base" /> Google Pay
                  </a>
                  <a
                    href={`phonepe://pay?pa=${encodeURIComponent(order.payeeVpa)}&pn=${encodeURIComponent(order.payeeName)}&am=${order.amountInr.toFixed(2)}&cu=INR&tr=${order.orderId}`}
                    className="py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-line flex items-center justify-center gap-1.5 text-xs font-bold text-paper transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-brand-base" /> PhonePe
                  </a>
                  <a
                    href={`paytmmp://pay?pa=${encodeURIComponent(order.payeeVpa)}&pn=${encodeURIComponent(order.payeeName)}&am=${order.amountInr.toFixed(2)}&cu=INR&tr=${order.orderId}`}
                    className="py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-line flex items-center justify-center gap-1.5 text-xs font-bold text-paper transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-brand-base" /> Paytm
                  </a>
                </div>
              </div>

              {/* Copy UPI URI & Generic App fallback */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-line flex items-center justify-center gap-2 text-xs font-medium text-paper transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-brand-base" />}
                  <span>{copied ? 'Copied Payment Link!' : 'Copy UPI Link'}</span>
                </button>
                <a
                  href={order.upiUri}
                  className="btn btn-sm btn-secondary flex items-center gap-1.5"
                >
                  <span>Open UPI App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Fallback Instructions & Manual UTR Submission Form */}
              <div className="pt-2 border-t border-line text-left space-y-3">
                <details className="group text-xs text-paper-muted cursor-pointer">
                  <summary className="font-semibold text-paper flex items-center justify-between list-none py-1">
                    <span>How to scan from another device?</span>
                    <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                  </summary>
                  <ol className="list-decimal pl-4 pt-2 space-y-1 text-paper-faint">
                    <li>Open any UPI app on your smartphone (GPay, PhonePe, Paytm, BHIM).</li>
                    <li>Select "Scan QR" and point camera at the screen above.</li>
                    <li>Confirm payment of ₹{order.amountInr.toFixed(2)}.</li>
                    <li>Enter your 12-digit Bank UTR below to speed up verification.</li>
                  </ol>
                </details>

                {/* Manual UTR Input */}
                <form onSubmit={handleSubmitUtr} className="p-3 bg-surface-elevated rounded-xl border border-line space-y-2">
                  <label htmlFor="utr-input" className="block text-[11px] font-semibold text-paper">
                    Already paid? Enter 12-digit Bank UTR / Reference
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="utr-input"
                      type="text"
                      maxLength={22}
                      value={clientUtr}
                      onChange={(e) => setClientUtr(e.target.value.toUpperCase())}
                      placeholder="e.g. 428190382910"
                      className="flex-1 bg-surface border border-line focus:border-brand-base rounded-lg px-3 py-1.5 text-xs font-mono2 text-paper placeholder-paper-faint focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={utrSubmitting || clientUtr.trim().length < 8}
                      className="btn btn-sm btn-primary shrink-0 cursor-pointer"
                    >
                      {utrSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3: Success State */}
          {step === 'SUCCESS' && order && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center" role="alert">
              <div className="w-16 h-16 rounded-full bg-success-tint border border-success/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success-light" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-paper">Payment Verified & Balance Credited!</p>
                <p className="text-sm text-paper-muted mt-1">
                  ₹{order.amountInr.toFixed(2)} has been added to your marketplace wallet balance.
                </p>
              </div>

              <div className="w-full p-4 bg-surface-elevated rounded-xl border border-line text-left text-xs font-mono2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-paper-faint">Order ID:</span>
                  <span className="text-paper">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-faint">Status:</span>
                  <span className="text-success-light font-bold">SUCCESS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-faint">Credited At:</span>
                  <span className="text-paper">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full btn btn-md btn-primary cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
