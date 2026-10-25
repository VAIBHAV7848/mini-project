'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Printer,
  X,
} from 'lucide-react';
import { PaymentReceipt } from '@/hooks/useCashfreeCheckout';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceipt;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-base flex items-center justify-center font-bold text-white text-xs shadow-xs">
              GF
            </div>
            <div>
              <h2 id="receipt-title" className="font-bold text-paper text-base">
                Cryptographic Payment Receipt
              </h2>
              <p className="text-[11px] font-mono2 text-paper-muted">GigaFlow Non-Custodial Escrow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-muted hover:text-paper hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Badge & Total */}
          <div className="text-center py-4 bg-surface-elevated rounded-2xl border border-line space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-tint border border-brand-base/30 text-brand-light font-mono2 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-base" /> Escrow Protected & Locked
            </div>
            <p className="font-bold text-3xl text-paper">
              ₹{receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-mono2 text-brand-light">
              Equivalent to {receipt.amount.toFixed(2)} GF Tokens
            </p>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-3 text-xs font-mono2">
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-paper-muted">Cashfree Order ID</span>
              <span className="text-paper font-bold">{receipt.orderId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-paper-muted">Provider Reference</span>
              <span className="text-paper">{receipt.providerReferenceId || 'CF_ACKNOWLEDGED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-paper-muted">Payment Method</span>
              <span className="text-paper">{receipt.paymentMethod || 'UPI / Gateway'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-paper-muted">Timestamp</span>
              <span className="text-paper">{new Date(receipt.timestamp).toUTCString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-paper-muted">Contract ID</span>
              <span className="text-paper truncate max-w-[200px]">{receipt.contractId}</span>
            </div>

            {/* SHA-256 Ledger Hash */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider text-paper-faint block mb-1">SHA-256 Verification Hash</span>
              <div className="p-3 bg-surface-highlight rounded-lg border border-line break-all select-all text-[11px] text-paper-muted font-mono2">
                {receipt.transactionHash}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line bg-surface-elevated/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2 px-3 rounded-lg border border-line bg-surface-elevated hover:bg-surface-highlight text-paper text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-3 rounded-lg border border-line bg-surface-elevated hover:bg-surface-highlight text-paper text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
