import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6 text-paper">
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient Glow */}
        <div className="absolute w-20 h-20 bg-brand-base/20 rounded-full blur-xl animate-pulse" />
        {/* Mechanical Spinner */}
        <div className="w-12 h-12 rounded-full border-2 border-line border-t-brand-base animate-spin" />
        <div className="absolute font-mono2 text-[10px] font-bold text-brand-base">GF</div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-display font-bold text-base text-paper tracking-tight">
          Synchronizing Workspace
        </h3>
        <p className="font-mono2 text-xs text-paper-muted uppercase tracking-widest">
          Verifying dual-rail cryptographic state...
        </p>
      </div>
    </div>
  );
}
