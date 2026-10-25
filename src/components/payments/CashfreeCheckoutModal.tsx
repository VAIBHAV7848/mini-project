'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  CreditCard,
  Building,
  ArrowRight,
} from 'lucide-react';
import { useCashfreeCheckout, CheckoutParams, PaymentReceipt } from '@/hooks/useCashfreeCheckout';

interface CashfreeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CheckoutParams;
  onPaymentSuccess?: (receipt: PaymentReceipt) => void;
  onViewReceipt?: (receipt: PaymentReceipt) => void;
}

export function CashfreeCheckoutModal({
  isOpen,
  onClose,
  params,
  onPaymentSuccess,
  onViewReceipt,
}: CashfreeCheckoutModalProps) {
  const { status, error, receipt, startCheckout, retry, reset } = useCashfreeCheckout();

  if (!isOpen) return null;

  const inrAmount = params.amount;
  // 1 GF = ₹1.00 INR
  const gfAmount = inrAmount.toFixed(2);

  const handleStart = async () => {
    await startCheckout(params);
  };

  const handleClose = () => {
    if (status === 'verifying') return; // Prevent closing while funds are being confirmed on ledger
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cf-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-base/15 border border-brand-base/30 flex items-center justify-center text-brand-base font-bold">
              ₹
            </div>
            <div>
              <h2 id="cf-modal-title" className="font-bold text-lg text-paper leading-tight">
                Cashfree Gateway Deposit
              </h2>
              <p className="text-xs font-mono2 text-paper-muted">GigaFlow Real Escrow Funding</p>
            </div>
          </div>
          {status !== 'verifying' && (
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg text-paper-muted hover:text-paper hover:bg-surface-elevated transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Milestone & Amount Summary Card */}
          <div className="p-5 rounded-xl bg-surface-elevated border border-line space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-paper-muted">Milestone Target</span>
                <p className="font-bold text-paper text-base mt-0.5">
                  {params.milestoneTitle || params.contractTitle || 'Contract Milestone'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-paper-muted">Deposit Amount</span>
                <p className="font-bold text-2xl text-paper">
                  ₹{inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs font-mono2 text-brand-base font-bold mt-0.5">
                  = {gfAmount} GF
                </p>
              </div>
            </div>

            {/* Escrow Badge */}
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-brand-tint border border-brand-base/20 text-xs text-brand-light font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-base shrink-0" aria-hidden="true" />
              <span>Funds are locked into non-custodial Escrow until deliverable approval.</span>
            </div>
          </div>

          {/* Dynamic State Views */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-paper-muted">
                <p className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-base" /> Supported: UPI (GPay, PhonePe, Paytm), NetBanking, Cards.
                </p>
                <p className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-base" /> Regulated: Cashfree Payments India Pvt. Ltd. (RBI Authorized).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full btn btn-primary py-3 px-4 rounded-xl flex items-center justify-center font-bold shadow-md cursor-pointer"
                >
                  <Lock className="w-4 h-4 mr-2" /> Pay ₹{inrAmount.toLocaleString('en-IN')} via Cashfree
                </button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-3" role="status" aria-live="polite">
              <Loader2 className="w-9 h-9 text-brand-base animate-spin" aria-hidden="true" />
              <p className="font-medium text-paper text-sm">Initializing Cashfree Checkout Session…</p>
              <p className="text-xs text-paper-muted">Connecting to Cashfree Secure API</p>
            </div>
          )}

          {status === 'gateway_active' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center" role="status" aria-live="polite">
              <div className="w-12 h-12 rounded-full bg-brand-tint border border-brand-base/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-brand-base animate-pulse" />
              </div>
              <p className="font-medium text-paper text-base">Cashfree Gateway Active</p>
              <p className="text-xs text-paper-muted max-w-xs">
                Complete your payment in the Cashfree modal window.
              </p>
            </div>
          )}

          {status === 'verifying' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center" role="status" aria-live="assertive">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-brand-tint flex items-center justify-center border border-brand-base/40">
                  <RefreshCw className="w-7 h-7 text-brand-base animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-brand-base animate-ping opacity-25" />
              </div>
              <div>
                <p className="font-bold text-lg text-paper">Verifying with payment gateway…</p>
                <p className="text-xs text-paper-muted max-w-sm mt-1">
                  Communicating with Cashfree Webhook & Ledger Engine. Do not refresh or close this window.
                </p>
              </div>
              <div className="inline-flex px-2.5 py-1 rounded-full bg-brand-tint border border-brand-base/30 text-brand-light font-mono2 text-xs">
                ACID Verification in Progress
              </div>
            </div>
          )}

          {status === 'success' && receipt && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center" role="alert" aria-live="assertive">
              <div className="w-16 h-16 rounded-full bg-success-tint border border-success/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="font-bold text-xl text-paper">Escrow Funded & Locked</p>
                <p className="text-sm text-paper-muted mt-1">
                  Cashfree payment of <span className="text-paper font-mono2 font-bold">₹{receipt.amount}</span> was verified and locked.
                </p>
              </div>

              <div className="w-full p-4 bg-surface-elevated rounded-xl border border-line text-left text-xs font-mono2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-paper-muted">Order ID:</span>
                  <span className="text-paper">{receipt.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-muted">Gateway Ref:</span>
                  <span className="text-paper">{receipt.providerReferenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-muted">Ledger Hash:</span>
                  <span className="text-brand-light truncate max-w-[200px]">{receipt.transactionHash}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                {onViewReceipt && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewReceipt(receipt);
                      handleClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-surface-elevated hover:bg-surface-highlight text-paper font-medium text-sm transition-colors cursor-pointer"
                  >
                    View Receipt
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onPaymentSuccess) onPaymentSuccess(receipt);
                    handleClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl btn btn-primary text-sm flex items-center justify-center transition-colors cursor-pointer"
                >
                  Continue to Contract <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'cancelled') && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center" role="alert" aria-live="assertive">
              <div className="w-14 h-14 rounded-full bg-danger-tint border border-danger/30 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-danger" />
              </div>
              <div>
                <p className="font-bold text-lg text-paper">Payment Unsuccessful</p>
                <p className="text-sm text-danger mt-1 max-w-sm">{error || 'Gateway transaction could not be completed.'}</p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-surface-elevated hover:bg-surface-highlight text-paper font-medium text-sm transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={retry}
                  className="flex-1 py-2.5 px-4 rounded-xl btn btn-primary text-sm flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
