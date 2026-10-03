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
          <div className="card overflow-hidden p-0 border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-elevated text-paper-faint">
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Gig Details</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Category</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Freelancer</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Score</th>
                    <th className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {gigs.map((gig) => (
                    <tr key={gig.id} className="group hover:bg-surface-elevated/50 transition-colors relative">
                      <td className="py-4 px-4 align-top">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-base opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex flex-col gap-1 max-w-xl">
                          <span className="font-display font-bold text-white group-hover:text-brand-light transition-colors">{gig.title}</span>
                          <span className="text-sm text-paper-muted line-clamp-2">{gig.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-highlight text-xs font-mono2 text-paper-muted">
                          {gig.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-top text-sm font-medium text-white">
                        {gig.freelancer?.name}
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <span className="inline-flex items-center gap-1 font-mono2 font-bold text-brand-light">
                          <Star className="w-3.5 h-3.5 fill-brand-base text-brand-base" />
                          {gig.freelancer?.devScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <button className="btn btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
