'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, description, children, footer }: DialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/30 rounded-b-xl flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
