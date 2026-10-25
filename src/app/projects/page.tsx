'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Send,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  skillTags?: string;
  client: { id?: string; name: string; email?: string };
  _count: { proposals: number };
}

interface ProposalItem {
  id: string;
  projectId: string;
  bidAmount: number;
  coverLetter: string;
  aiMatchScore: number;
  status: string;
  createdAt: string;
  freelancer: { id: string; name: string; email?: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { role, currentPersona } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Form states
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postBudget, setPostBudget] = useState('');
  const [postTags, setPostTags] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  // Proposals for selected project
  const [projectProposals, setProjectProposals] = useState<ProposalItem[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: { 'x-user-id': currentPersona.id } });
      const data = await res.json();
      if (data.success) setProjects(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona.id]);

  const parseTags = (raw?: string): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  };

  // Open details modal
  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
    setFormError(null);
    setFormSuccess(null);

    // Fetch proposals for this project if Client or Admin
    if (role === 'CLIENT' || role === 'ADMIN') {
      setLoadingProposals(true);
      fetch(`/api/proposals?projectId=${project.id}`, {
        headers: { 'x-user-id': currentPersona.id },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProjectProposals(data.data || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingProposals(false));
    }
  };

  // Handle Accept Proposal (CLIENT / ADMIN) -> Forms Contract in AWAITING_DEPOSIT
  const handleAcceptProposal = async (proposal: ProposalItem) => {
    if (!selectedProject) return;
    setAcceptingProposalId(proposal.id);
    setFormError(null);
    setFormSuccess(null);
    try {
      const halfAmount = Math.round((proposal.bidAmount / 2) * 100) / 100;
      const remainder = Math.round((proposal.bidAmount - halfAmount) * 100) / 100;
      const now = new Date();
      const due1 = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
      const due2 = new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString();

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          milestones: [
            {
              title: 'Milestone 01: Core Architecture & Checksum Pipeline',
              description: 'Implement initial system foundation, data models, and deliverable checksums.',
              amount: halfAmount,
              dueDate: due1,
            },
            {
              title: 'Milestone 02: End-to-End Verification & Final Acceptance',
              description: 'Complete final deliverables, test suites, and cryptographic evidence verification.',
              amount: remainder,
              dueDate: due2,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess('Proposal accepted! Contract created in Awaiting Deposit state.');
        fetchProjects();
        setTimeout(() => {
          setIsDetailsOpen(false);
          setFormSuccess(null);
          router.push('/dashboard');
        }, 1500);
      } else {
        setFormError(data.error?.message || 'Failed to form contract.');
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setAcceptingProposalId(null);
    }
  };

  // Open proposal modal
  const handleOpenProposal = (project: Project) => {
    setSelectedProject(project);
    setBidAmount(project.budget.toString());
    setCoverLetter('');
    setFormError(null);
    setFormSuccess(null);
    setIsDetailsOpen(false);
    setIsProposalModalOpen(true);
  };

  // Handle Post Project submit (CLIENT)
  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const budgetNum = parseFloat(postBudget);
    if (!postTitle || postTitle.length < 5) {
      setFormError('Project title must be at least 5 characters.');
      return;
    }
    if (!postDescription || postDescription.length < 20) {
      setFormError('Project description must be at least 20 characters.');
      return;
    }
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setFormError('Please enter a valid positive budget amount.');
      return;
    }

    const tagsArray = postTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tagsArray.length === 0) {
      setFormError('Provide at least one skill tag (e.g. React, Next.js).');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          title: postTitle,
          description: postDescription,
          budget: budgetNum,
          skillTags: tagsArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess('Project posted successfully!');
        setPostTitle('');
        setPostDescription('');
        setPostBudget('');
        setPostTags('');
        fetchProjects();
        setTimeout(() => {
          setIsPostModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        setFormError(data.error?.message || 'Failed to post project.');
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Submit Proposal (FREELANCER)
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setFormError(null);
    setFormSuccess(null);

    const bidNum = parseFloat(bidAmount);
    if (isNaN(bidNum) || bidNum <= 0) {
      setFormError('Please provide a valid positive bid amount.');
      return;
    }
    if (!coverLetter || coverLetter.length < 20) {
      setFormError('Cover letter must be at least 20 characters.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentPersona.id,
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          bidAmount: bidNum,
          coverLetter,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess('Proposal submitted! AI semantic match score calculated.');
        fetchProjects();
        setTimeout(() => {
          setIsProposalModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        setFormError(data.error?.message || 'Failed to submit proposal.');
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setFormSubmitting(false);
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
              Active Projects
            </h1>
            <p className="text-sm text-paper-muted mt-1 font-medium">
              Browse available client projects, explore deliverables, and submit proposals.
            </p>
          </div>

          {(role === 'CLIENT' || role === 'ADMIN') && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsPostModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Post Project
            </button>
          )}
        </div>

        {/* Project Listings */}
        <div aria-live="polite" aria-atomic="true">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line" role="status">
              <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" aria-hidden="true" />
              <p className="text-sm font-medium">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
              <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-6 h-6 text-paper-faint" aria-hidden="true" />
              </div>
              <h2 className="font-display text-lg font-bold text-paper">No Projects Available</h2>
              <p className="text-sm text-paper-muted mt-1.5 text-center">There are currently no open projects in the marketplace.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* High Value Section */}
              {projects.filter((p) => p.budget >= 2000).length > 0 && (
                <section>
                  <h2 className="eyebrow mb-4 text-brand-base flex items-center gap-2">
                    <Star className="w-3 h-3 fill-brand-base text-brand-base" aria-hidden="true" /> Featured & High Value Projects
                  </h2>
                  <ul className="grid gap-4 list-none p-0 m-0">
                    {projects
                      .filter((p) => p.budget >= 2000)
                      .map((project) => (
                        <li key={project.id} className="card p-0 overflow-hidden group">
                          <div className="p-6 flex flex-col sm:flex-row justify-between gap-6 hover:bg-surface-highlight/30 transition-colors">
                            <div className="space-y-4 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-display text-xl font-bold text-paper group-hover:text-brand-light transition-colors">
                                  {project.title}
                                </h3>
                                <span className="badge badge-brand">{project.status}</span>
                              </div>
                              <p className="text-[14px] text-paper-muted max-w-2xl leading-relaxed">
                                {project.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {parseTags(project.skillTags).map((tag) => (
                                  <span key={tag} className="badge bg-surface-elevated border-line text-paper-muted text-[11px] font-mono2">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-6 text-[13px] text-paper-muted font-medium pt-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider">Posted By</span>
                                  <span className="text-paper">{project.client?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider">Proposals</span>
                                  <span className="font-mono2 font-bold text-paper">{project._count?.proposals || 0}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end justify-between min-w-[150px] gap-4 sm:gap-0">
                              <div className="text-left sm:text-right">
                                <span className="eyebrow block mb-1">Budget</span>
                                <div className="font-display text-2xl font-bold text-paper">
                                  ₹{project.budget.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetails(project)}
                                  className="btn btn-secondary w-full sm:w-auto"
                                >
                                  <ExternalLink className="w-4 h-4" aria-hidden="true" /> Details
                                </button>
                                {role === 'FREELANCER' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProposal(project)}
                                    className="btn btn-primary w-full sm:w-auto"
                                  >
                                    <Send className="w-3.5 h-3.5" aria-hidden="true" /> Bid
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </section>
              )}

              {/* Standard Projects */}
              {projects.filter((p) => p.budget < 2000).length > 0 && (
                <section>
                  <h2 className="eyebrow mb-4">Standard Projects</h2>
                  <ul className="grid gap-4 list-none p-0 m-0">
                    {projects
                      .filter((p) => p.budget < 2000)
                      .map((project) => (
                        <li key={project.id} className="card p-0 overflow-hidden group">
                          <div className="p-6 flex flex-col sm:flex-row justify-between gap-6 hover:bg-surface-highlight/30 transition-colors">
                            <div className="space-y-4 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-display text-xl font-bold text-paper group-hover:text-brand-light transition-colors">
                                  {project.title}
                                </h3>
                                <span className="badge badge-brand">{project.status}</span>
                              </div>
                              <p className="text-[14px] text-paper-muted max-w-2xl leading-relaxed">
                                {project.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {parseTags(project.skillTags).map((tag) => (
                                  <span key={tag} className="badge bg-surface-elevated border-line text-paper-muted text-[11px] font-mono2">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-6 text-[13px] text-paper-muted font-medium pt-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider">Posted By</span>
                                  <span className="text-paper">{project.client?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider">Proposals</span>
                                  <span className="font-mono2 font-bold text-paper">{project._count?.proposals || 0}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end justify-between min-w-[150px] gap-4 sm:gap-0">
                              <div className="text-left sm:text-right">
                                <span className="eyebrow block mb-1">Budget</span>
                                <div className="font-display text-2xl font-bold text-paper">
                                  ₹{project.budget.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetails(project)}
                                  className="btn btn-secondary w-full sm:w-auto"
                                >
                                  <ExternalLink className="w-4 h-4" aria-hidden="true" /> Details
                                </button>
                                {role === 'FREELANCER' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProposal(project)}
                                    className="btn btn-primary w-full sm:w-auto"
                                  >
                                    <Send className="w-3.5 h-3.5" aria-hidden="true" /> Bid
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      <Dialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedProject?.title || 'Project Details'}
        description="Review project specifications, required skills, and budget parameters."
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Close
            </button>
            {role === 'FREELANCER' && selectedProject && (
              <button
                type="button"
                onClick={() => handleOpenProposal(selectedProject)}
                className="btn btn-md btn-primary"
              >
                <Send className="w-4 h-4 mr-1.5" /> Submit Proposal
              </button>
            )}
          </div>
        }
      >
        {selectedProject && (
          <div className="space-y-5 text-sm py-2">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-elevated border border-line">
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block mb-1">Budget</span>
                <span className="font-display text-xl font-bold text-brand-light">₹{selectedProject.budget.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block mb-1">Status</span>
                <span className="badge badge-brand">{selectedProject.status}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block mb-1">Client</span>
                <span className="text-paper font-medium">{selectedProject.client?.name}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono2 uppercase tracking-wider text-paper-faint block mb-1">Proposals Submitted</span>
                <span className="font-mono2 text-paper font-bold">{selectedProject._count?.proposals || 0}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint mb-2">Description</h4>
              <p className="text-paper-muted leading-relaxed whitespace-pre-wrap">{selectedProject.description}</p>
            </div>

            <div>
              <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {parseTags(selectedProject.skillTags).map((tag) => (
                  <span key={tag} className="badge bg-surface-elevated border-line text-brand-light font-mono2 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Proposals Section (CLIENT / ADMIN) */}
            {(role === 'CLIENT' || role === 'ADMIN') && (
              <div className="pt-3 border-t border-line space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono2 uppercase tracking-wider text-paper-faint flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-brand-base" />
                    Bids & AI Match Rankings ({projectProposals.length})
                  </h4>
                  {loadingProposals && (
                    <div className="flex items-center gap-1.5 text-xs text-brand-light font-mono2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading bids...</span>
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="p-2.5 rounded-lg bg-danger-tint text-danger-light text-xs font-medium">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-2.5 rounded-lg bg-success-tint text-success-light text-xs font-medium">
                    {formSuccess}
                  </div>
                )}

                {projectProposals.length === 0 && !loadingProposals ? (
                  <div className="p-4 rounded-xl bg-surface-elevated border border-line text-center text-xs text-paper-muted">
                    No proposals submitted for this project yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {projectProposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-xl bg-surface-elevated border border-line hover:border-line-strong transition-colors space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-paper text-sm">{prop.freelancer?.name}</span>
                              <span
                                className={`text-[10px] font-mono2 px-1.5 py-0.5 rounded font-bold ${
                                  prop.status === 'ACCEPTED'
                                    ? 'bg-success/20 text-success-light border border-success/30'
                                    : 'bg-surface-highlight text-paper-muted'
                                }`}
                              >
                                {prop.status}
                              </span>
                            </div>
                            <p className="text-xs text-paper-muted font-mono2 mt-0.5">
                              Bid: <span className="text-paper font-bold">₹{prop.bidAmount.toFixed(2)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] font-mono2 text-paper-faint uppercase block">
                                AI Match
                              </span>
                              <span className="font-mono2 text-xs font-bold text-brand-light flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-brand-base" />
                                {(prop.aiMatchScore * 100).toFixed(0)}% Fit
                              </span>
                            </div>

                            {prop.status === 'PENDING' && (
                              <button
                                type="button"
                                disabled={acceptingProposalId === prop.id}
                                onClick={() => handleAcceptProposal(prop)}
                                className="btn btn-sm btn-primary shrink-0"
                              >
                                {acceptingProposalId === prop.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Forming Contract...
                                  </>
                                ) : (
                                  'Accept & Form Escrow'
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-paper-muted italic line-clamp-2 bg-charcoal p-2 rounded-lg border border-line/60">
                          "{prop.coverLetter}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Post Project Modal (CLIENT) */}
      <Dialog
        isOpen={isPostModalOpen}
        onClose={() => !formSubmitting && setIsPostModalOpen(false)}
        title="Post New Client Project"
        description="Publish a project scope to the marketplace. Escrow will be allocated upon milestone acceptance."
        footer={
          <>
            <button
              type="button"
              disabled={formSubmitting}
              onClick={() => setIsPostModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="post-project-form"
              disabled={formSubmitting}
              className="btn btn-md btn-primary"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Posting...
                </>
              ) : (
                'Publish Project'
              )}
            </button>
          </>
        }
      >
        <form id="post-project-form" onSubmit={handlePostProject} className="space-y-4 py-2">
          {formError && (
            <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-paper mb-1.5">Project Title</label>
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="e.g. Next.js Escrow Management Dashboard"
              className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-paper mb-1.5">Total Budget (₹)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={postBudget}
                onChange={(e) => setPostBudget(e.target.value)}
                placeholder="2000.00"
                className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base font-mono2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-paper mb-1.5">Skill Tags (comma-separated)</label>
              <input
                type="text"
                required
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                placeholder="react, typescript, nextjs"
                className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-paper mb-1.5">Detailed Scope & Requirements (min 20 chars)</label>
            <textarea
              required
              rows={4}
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              placeholder="Describe deliverables, technical constraints, milestones, and testing expectations..."
              className="w-full bg-surface-elevated border border-line rounded-xl p-3 text-sm text-paper focus:outline-none focus:border-brand-base resize-none"
            />
            <p className="text-[11px] text-paper-faint mt-1">
              {postDescription.length}/20 characters minimum
            </p>
          </div>
        </form>
      </Dialog>

      {/* Submit Proposal Modal (FREELANCER) */}
      <Dialog
        isOpen={isProposalModalOpen}
        onClose={() => !formSubmitting && setIsProposalModalOpen(false)}
        title={`Submit Proposal: ${selectedProject?.title}`}
        description="Engine 02 will calculate an AI semantic match score based on your DevScore, skills, and bid ratio."
        footer={
          <>
            <button
              type="button"
              disabled={formSubmitting}
              onClick={() => setIsProposalModalOpen(false)}
              className="btn btn-md btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="submit-proposal-form"
              disabled={formSubmitting}
              className="btn btn-md btn-primary"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Submitting...
                </>
              ) : (
                'Send Proposal'
              )}
            </button>
          </>
        }
      >
        <form id="submit-proposal-form" onSubmit={handleSubmitProposal} className="space-y-4 py-2">
          {formError && (
            <div className="p-3 bg-danger-tint border border-danger/40 rounded-xl text-xs text-danger-light flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-success-tint border border-success/40 rounded-xl text-xs text-success-light flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-paper mb-1.5">Proposed Bid Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full bg-surface-elevated border border-line rounded-xl px-3.5 py-2.5 text-sm text-paper focus:outline-none focus:border-brand-base font-mono2"
            />
            {selectedProject && (
              <p className="text-[11px] text-paper-faint mt-1">
                Client Budget: ₹{selectedProject.budget.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-paper mb-1.5">Cover Letter & Approach (min 20 chars)</label>
            <textarea
              required
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Outline your engineering approach, previous experience, and timeline..."
              className="w-full bg-surface-elevated border border-line rounded-xl p-3 text-sm text-paper focus:outline-none focus:border-brand-base resize-none"
            />
            <p className="text-[11px] text-paper-faint mt-1">
              {coverLetter.length}/20 characters minimum
            </p>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
