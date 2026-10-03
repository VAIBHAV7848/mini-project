'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { Layers, Loader2, FolderOpen, ExternalLink, Star } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  freelancer: { name: string; devScore: number };
  _count: { orders: number };
}

export default function GigsPage() {
  const { currentPersona } = useRole();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await fetch('/api/gigs', { headers: { 'x-user-id': currentPersona.id } });
        const data = await res.json();
        if (data.success) setGigs(data.data.items || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [currentPersona.id]);

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        <div className="border-b border-[var(--color-border-subtle)] pb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary-light)]" />
            Available Gigs
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Browse marketplace gigs offered by top freelancers.</p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-base)] mb-4" />
            <p className="text-sm font-medium">Loading gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-[var(--color-border-strong)] rounded-xl bg-[var(--color-surface-1)]/50">
            <FolderOpen className="w-12 h-12 text-[var(--color-border-strong)] mb-4" />
            <h3 className="text-base font-medium text-white">No Gigs Available</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 text-center">There are currently no active gigs in the marketplace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <div key={gig.id} className="card p-6 flex flex-col justify-between gap-4 hover:border-[var(--color-border-strong)] transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]">
                      {gig.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {gig.freelancer?.devScore.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white leading-tight">{gig.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">{gig.description}</p>
                </div>

                <div className="pt-4 mt-auto border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">Freelancer</span>
                    <span className="text-sm font-medium text-slate-200">{gig.freelancer?.name}</span>
                  </div>
                  <button className="btn btn-sm btn-secondary">
                    View <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
