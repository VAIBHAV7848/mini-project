'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { CashfreeCheckoutModal } from './CashfreeCheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { PaymentReceipt } from '@/hooks/useCashfreeCheckout';

export interface DepositButtonProps {
  contractId: string;
  milestoneId?: string;
  amount: number;
  contractTitle?: string;
  milestoneTitle?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onSuccess?: (receipt: PaymentReceipt) => void;
}

export function DepositButton({
  contractId,
  milestoneId,
  amount,
  contractTitle,
  milestoneTitle,
  customerPhone,
  customerEmail,
  customerName,
  label,
  variant = 'primary',
  className = '',
  disabled = false,
  onSuccess,
}: DepositButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);

  const getButtonClasses = () => {
    let base = 'inline-flex items-center justify-center font-bold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ';
    if (variant === 'sm') base += 'py-1.5 px-3 text-xs bg-orange-500 hover:bg-orange-400 text-black ';
    else if (variant === 'lg') base += 'py-3.5 px-6 text-base bg-orange-500 hover:bg-orange-400 text-black shadow-lg ';
    else if (variant === 'secondary') base += 'py-2 px-4 text-sm bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 ';
    else base += 'py-2.5 px-4 text-sm bg-orange-500 hover:bg-orange-400 text-black shadow-md ';
    return `${base} ${className}`.trim();
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsModalOpen(true)}
        className={getButtonClasses()}
        aria-label={label || `Fund Escrow ₹${amount.toLocaleString('en-IN')}`}
      >
        <Lock className="w-4 h-4 mr-1.5" aria-hidden="true" />
        <span>{label || `Deposit ₹${amount.toLocaleString('en-IN')}`}</span>
      </button>

      {/* Cashfree Payment Modal */}
      <CashfreeCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        params={{
          contractId,
          milestoneId,
          amount,
          contractTitle,
          milestoneTitle,
          customerPhone,
          customerEmail,
          customerName,
        }}
        onPaymentSuccess={(rec) => {
          if (onSuccess) onSuccess(rec);
        }}
        onViewReceipt={(rec) => {
          setActiveReceipt(rec);
        }}
      />

      {/* Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          receipt={activeReceipt}
        />
      )}
    </>
  );
}
