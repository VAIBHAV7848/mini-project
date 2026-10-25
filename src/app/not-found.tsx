import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6 text-paper">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto text-brand-base">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <p className="font-mono2 text-xs uppercase tracking-widest text-brand-base font-bold">
            HTTP 404 — Not Found
          </p>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Destination Uncharted
          </h1>
          <p className="text-sm text-paper-muted leading-relaxed">
            The requested contract, milestone, or workspace endpoint does not exist or has been archived.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-brand-base text-charcoal hover:bg-brand-light transition-colors shadow-lg shadow-brand-base/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
