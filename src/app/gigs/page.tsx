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

interface GigDetail {
  category: string;
  devScore: number;
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
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Marketplace</p>
            <h2 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-base" />
              Available Gigs
            </h2>
            <p className="text-sm text-paper-muted mt-1 font-medium">Browse marketplace gigs offered by top freelancers.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
            <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" />
            <p className="text-sm font-medium">Loading gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6 text-paper-faint" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">No Gigs Available</h3>
            <p className="text-sm text-paper-muted mt-1.5 text-center">There are currently no active gigs in the marketplace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <div key={gig.id} className="card p-0 overflow-hidden flex flex-col group relative transition-all duration-[200ms] hover:border-brand-base/50">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-base opacity-0 group-hover:opacity-100 transition-opacity duration-[200ms]" aria-hidden />
                <div className="p-6 flex flex-col flex-1 gap-4 group-hover:bg-surface-highlight/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-mono2 px-2 py-1 rounded-md bg-surface-elevated text-paper-faint border border-line">
                      {gig.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-mono2 text-brand-light">
                      <Star className="w-4 h-4 fill-brand-base text-brand-base" />
                      {gig.freelancer?.devScore.toFixed(1)}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-white leading-snug group-hover:text-brand-light transition-colors">{gig.title}</h3>
                  <p className="text-[14px] text-paper-muted line-clamp-3 leading-relaxed flex-1">{gig.description}</p>
                </div>

                <div className="px-6 py-4 border-t border-line flex items-center justify-between bg-surface-elevated/30">
                  <div className="flex flex-col">
                    <span className="eyebrow block mb-0.5">Freelancer</span>
                    <span className="text-[13px] font-bold text-white">{gig.freelancer?.name}</span>
                  </div>
                  <button className="btn btn-sm btn-secondary">
                    View <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
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