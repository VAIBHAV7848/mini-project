'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string, duration?: number) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, description, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast('success', title, description),
    [showToast]
  );
  const error = useCallback(
    (title: string, description?: string) => showToast('error', title, description, 6000),
    [showToast]
  );
  const info = useCallback(
    (title: string, description?: string) => showToast('info', title, description),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              toast.type === 'success'
                ? 'bg-surface border-green-500/30 text-paper'
                : toast.type === 'error'
                ? 'bg-surface border-red-500/30 text-paper'
                : 'bg-surface border-brand-base/30 text-paper'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-brand-base" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-sm font-bold tracking-tight text-paper">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-paper-muted mt-0.5 leading-relaxed break-words">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-paper-muted hover:text-paper transition-colors p-1 rounded-md"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
