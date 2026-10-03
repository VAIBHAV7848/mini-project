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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-black text-xs">
              GF
            </div>
            <div>
              <h2 id="receipt-title" className="font-bold text-white text-base">
                Cryptographic Payment Receipt
              </h2>
              <p className="text-[11px] font-mono text-neutral-400">GigaFlow Non-Custodial Escrow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Badge & Total */}
          <div className="text-center py-4 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Escrow Protected & Locked
            </div>
            <p className="font-bold text-3xl text-white">
              ₹{receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-mono text-orange-300">
              Equivalent to {receipt.amount.toFixed(2)} GF Tokens
            </p>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Cashfree Order ID</span>
              <span className="text-white font-bold">{receipt.orderId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Provider Reference</span>
              <span className="text-white">{receipt.providerReferenceId || 'CF_ACKNOWLEDGED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Payment Method</span>
              <span className="text-white">{receipt.paymentMethod || 'UPI / Gateway'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Timestamp</span>
              <span className="text-white">{new Date(receipt.timestamp).toUTCString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Contract ID</span>
              <span className="text-white truncate max-w-[200px]">{receipt.contractId}</span>
            </div>

            {/* SHA-256 Ledger Hash */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider text-neutral-500 block mb-1">SHA-256 Verification Hash</span>
              <div className="p-3 bg-black rounded-lg border border-neutral-800 break-all select-all text-[11px] text-neutral-400 font-mono">
                {receipt.transactionHash}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2 px-3 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-3 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
