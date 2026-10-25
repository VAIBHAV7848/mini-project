'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';
import { useRole } from '@/components/layout/RoleContext';
import {
  Layers,
  Loader2,
  FolderOpen,
  ExternalLink,
  Star,
  Plus,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface GigTier {
  name: string;
  price: number;
  deliveryDays: number;
  description: string;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  tiers?: string | GigTier[];
  freelancer: { id?: string; name: string; devScore: number };
  _count: { orders: number };
}

export default function GigsPage() {
  const { role, currentPersona } = useRole();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create gig form state
  const [gigTitle, setGigTitle] = useState('');
  const [gigDescription, setGigDescription] = useState('');
  const [gigCategory, setGigCategory] = useState('WEB_DEV');
  const [basicPrice, setBasicPrice] = useState('250');
  const [basicDays, setBasicDays] = useState('3');
  const [standardPrice, setStandardPrice] = useState('750');
  const [standardDays, setStandardDays] = useState('7');
  const [premiumPrice, setPremiumPrice] = useState('1500');
  const [premiumDays, setPremiumDays] = useState('14');

  // Order & form status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchGigs = async () => {
    try {
      const res = await fetch('/api/gigs', { headers: { 'x-user-id': currentPersona.id } });
      const data = await res.json();
      if (data.success) {
        setGigs(data.data.items || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona.id]);

  const parseTiers = (rawTiers?: string | GigTier[]): GigTier[] => {
    if (!rawTiers) return [];
    if (Array.isArray(rawTiers)) return rawTiers;
    try {
      const parsed = JSON.parse(rawTiers);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleOpenGig = (gig: Gig) => {
    setSelectedGig(gig);
    setSelectedTierIndex(0);
    setActionError(null);
    setActionSuccess(null);
    setIsViewModalOpen(true);
  };

  // Place Order (CLIENT)
  const handlePlaceOrder = async () => {
    if (!selectedGig) return;
    const tiers = parseTiers(selectedGig.tiers);
    const chosenTier = tiers[selectedTierIndex] || {
      name: 'Standard',
      price: 500,
      deliveryDays: 7,
      description: 'Standard delivery',
    };

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          gigId: selectedGig.id,
          tierName: chosenTier.name,
          amount: chosenTier.price,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Order placed for ${chosenTier.name} tier! Escrow terms established.`);
        fetchGigs();
        setTimeout(() => {
          setIsViewModalOpen(false);
          setActionSuccess(null);
        }, 1200);
      } else {
        setActionError(data.error?.message || 'Failed to place order.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Gig (FREELANCER)
  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (gigTitle.length < 5) {
      setActionError('Gig title must be at least 5 characters.');
      return;
    }
    if (gigDescription.length < 20) {
      setActionError('Gig description must be at least 20 characters.');
      return;
    }

    const tiers: GigTier[] = [
      {
        name: 'Basic',
        price: parseFloat(basicPrice) || 250,
        deliveryDays: parseInt(basicDays, 10) || 3,
        description: 'Starter tier with core implementation deliverables.',
      },
      {
        name: 'Standard',
        price: parseFloat(standardPrice) || 750,
        deliveryDays: parseInt(standardDays, 10) || 7,
        description: 'Complete production-grade feature slice with tests.',
      },
      {
        name: 'Premium',
        price: parseFloat(premiumPrice) || 1500,
        deliveryDays: parseInt(premiumDays, 10) || 14,
        description: 'Full stack architecture with CI/CD deployment.',
      },
    ];

    setActionLoading(true);
    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          title: gigTitle,
          description: gigDescription,
          category: gigCategory,
          tiers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess('Gig created successfully and published to marketplace!');
        setGigTitle('');
        setGigDescription('');
        fetchGigs();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setActionSuccess(null);
        }, 1200);
      } else {
        setActionError(data.error?.message || 'Failed to create gig.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Marketplace</p>
            <h1 className="font-display text-2xl font-bold text-paper tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-base" aria-hidden="true" />
              Available Gigs
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">
              Browse packaged services offered by verified freelancers with milestone escrow guarantees.
            </p>
          </div>

          {(role === 'FREELANCER' || role === 'ADMIN') && (
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setActionSuccess(null);
                setIsCreateModalOpen(true);
              }}
              className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-[#ff8522] via-[#fc6c00] to-[#e65500] hover:from-[#ff9438] hover:via-[#ff7914] hover:to-[#f05e00] border border-orange-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.1),0_6px_20px_rgba(252,108,0,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_26px_rgba(252,108,0,0.48)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden select-none"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-white/20 text-white shadow-xs transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              </span>
              <span className="tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">Create Gig</span>
            </button>
          )}
        </div>

        {/* Listings */}
        <div aria-live="polite" aria-atomic="true">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line" role="status">
              <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" aria-hidden="true" />
              <p className="text-sm font-medium">Loading gigs...</p>
            </div>
          ) : gigs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
              <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-6 h-6 text-paper-faint" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-paper">No Gigs Available</h3>
              <p className="text-sm text-paper-muted mt-1.5 text-center">There are currently no active gigs in the marketplace.</p>
            </div>
          ) : (
            <div className="card overflow-hidden p-0 border border-line bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" aria-label="Available marketplace gigs">
                  <thead>
                    <tr className="border-b border-line bg-surface-elevated text-paper-faint">
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Gig Details</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Category</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold">Freelancer</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">DevScore</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Tiers</th>
                      <th scope="col" className="py-3 px-4 font-mono2 text-[11px] uppercase tracking-wider font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {gigs.map((gig) => {
                      const tiers = parseTiers(gig.tiers);
                      const minPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : 0;
                      return (
                        <tr key={gig.id} className="group hover:bg-surface-elevated/50 transition-colors relative">
                          <td className="py-4 px-4 align-top">
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-base opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col gap-1 max-w-xl">
                              <span className="font-display font-bold text-paper group-hover:text-brand-light transition-colors">{gig.title}</span>
                              <span className="text-sm text-paper-muted line-clamp-2">{gig.description}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-highlight text-xs font-mono2 text-paper-muted border border-line">
                              {gig.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 align-top text-sm font-medium text-paper">
                            {gig.freelancer?.name}
                          </td>
                          <td className="py-4 px-4 align-top text-right">
                            <span className="inline-flex items-center gap-1 font-mono2 font-bold text-brand-light">
                              <Star className="w-3.5 h-3.5 fill-brand-base text-brand-base" aria-hidden="true" />
                              {gig.freelancer?.devScore.toFixed(0)}
                            </span>
                          </td>
                          <td className="py-4 px-4 align-top text-right">
                            <span className="font-mono2 text-xs text-paper-muted">
                              From <span className="font-bold text-paper">₹{minPrice.toFixed(0)}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 align-top text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenGig(gig)}
                              aria-label={`View details for ${gig.title}`}
                              className="btn btn-sm btn-secondary"
                            >
                              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Gig & Order Dialog */}
      <Dialog
        isOpen={isViewModalOpen}
        onClose={() => !actionLoading && setIsViewModalOpen(false)}
        title={selectedGig?.title || 'Service Details'}
        description="Select a tier and place an order. Escrow protection automatically secures funds upon order acceptance."
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setIsViewModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Close
            </button>
            {(role === 'CLIENT' || role === 'ADMIN') && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePlaceOrder}
                className="btn btn-md btn-primary"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Ordering...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1.5" /> Order Selected Tier
                  </>
                )}
              </button>
            )}
          </div>
        }
      >
        {selectedGig && (
          <div className="space-y-5 text-sm py-2">
            {actionError && (
              <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-surface-elevated border border-line flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block">Freelancer</span>
                <span className="text-paper font-bold">{selectedGig.freelancer?.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block">DevScore</span>
                <span className="inline-flex items-center gap-1 font-mono2 font-bold text-brand-light">
                  <Star className="w-3.5 h-3.5 fill-brand-base text-brand-base" />
                  {selectedGig.freelancer?.devScore.toFixed(0)} / 100
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint mb-1.5">Description</h4>
              <p className="text-paper-muted leading-relaxed">{selectedGig.description}</p>
            </div>

            {/* Package Tiers Selector */}
            <div>
              <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint mb-2">Service Package Tiers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {parseTiers(selectedGig.tiers).map((tier, idx) => {
                  const isSelected = selectedTierIndex === idx;
                  return (
                    <div
                      key={tier.name}
                      onClick={() => setSelectedTierIndex(idx)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-tint/15 border-brand-base ring-1 ring-brand-base'
                          : 'bg-surface-elevated border-line hover:border-brand-base/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-paper text-xs uppercase tracking-wider">{tier.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-base" />}
                      </div>
                      <div className="font-display text-lg font-bold text-brand-light mb-1">
                        ₹{tier.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono2 text-paper-muted mb-2">
                        <Clock className="w-3 h-3 text-paper-faint" />
                        <span>{tier.deliveryDays} days delivery</span>
                      </div>
                      <p className="text-xs text-paper-muted line-clamp-2 leading-snug">{tier.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create Gig Modal (FREELANCER) */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => !actionLoading && setIsCreateModalOpen(false)}
        title="Create New Service Gig"
        description="Define your freelance service offering across Basic, Standard, and Premium tiers."
        footer={
          <>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-gig-form"
              disabled={actionLoading}
              className="btn btn-md btn-primary"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Publishing...
                </>
              ) : (
                'Publish Gig'
              )}
            </button>
          </>
        }
      >
        <form id="create-gig-form" onSubmit={handleCreateGig} className="space-y-4 py-2">
          {actionError && (
            <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-paper mb-1.5">Gig Title</label>
            <input
              type="text"
              required
              value={gigTitle}
              onChange={(e) => setGigTitle(e.target.value)}
              placeholder="e.g. Smart Contract Security Audit & Formal Verification"
              className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-paper mb-1.5">Category</label>
              <select
                value={gigCategory}
                onChange={(e) => setGigCategory(e.target.value)}
                className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base"
              >
                <option value="WEB_DEV">Web Development</option>
                <option value="SECURITY">Security & Audit</option>
                <option value="SYSTEMS">Systems Architecture</option>
                <option value="DATABASE">Database & Ledger</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-paper mb-1.5">Standard Price (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={standardPrice}
                onChange={(e) => setStandardPrice(e.target.value)}
                className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base font-mono2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-paper mb-1.5">Description (min 20 characters)</label>
            <textarea
              required
              rows={3}
              value={gigDescription}
              onChange={(e) => setGigDescription(e.target.value)}
              placeholder="Detail what is included, your methodology, and delivery milestones..."
              className="w-full bg-surface-elevated border border-line rounded-xl p-3 text-sm text-paper focus:outline-none focus:border-brand-base resize-none"
            />
          </div>

          {/* Tier breakdown preview */}
          <div className="p-3 bg-surface-elevated border border-line rounded-xl space-y-2 text-xs">
            <span className="font-bold text-paper uppercase text-[10px] tracking-wider block">Default Tier Configuration</span>
            <div className="grid grid-cols-3 gap-2 font-mono2 text-paper-muted">
              <div>Basic: ₹{basicPrice} ({basicDays}d)</div>
              <div>Standard: ₹{standardPrice} ({standardDays}d)</div>
              <div>Premium: ₹{premiumPrice} ({premiumDays}d)</div>
            </div>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
