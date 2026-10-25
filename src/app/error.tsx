'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Application Runtime Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6 text-paper">
      <div className="max-w-md w-full bg-surface border border-red-500/30 rounded-xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-paper tracking-tight">
            Unexpected Workspace Exception
          </h2>
          <p className="text-sm text-paper-muted leading-relaxed">
            The domain engine encountered an unhandled exception. The transaction state has been rolled back safely to prevent state corruption.
          </p>
          {error.message && (
            <div className="mt-4 p-3 rounded-lg bg-surface-elevated border border-line text-left">
              <p className="font-mono2 text-xs text-red-400 break-words">
                {error.message}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-base text-white hover:bg-brand-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Action
          </button>
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-elevated border border-line hover:border-line-strong text-paper transition-colors"
          >
            <Home className="w-4 h-4 text-paper-muted" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
