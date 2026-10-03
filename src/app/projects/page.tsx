'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRole } from '@/components/layout/RoleContext';
import { Layers, Loader2, FolderOpen, ExternalLink } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  client: { name: string };
  _count: { proposals: number };
}

interface ProjectDetail {
  key: string;
  label: string;
  value: string | number;
}

export default function ProjectsPage() {
  const { currentPersona } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchProjects();
  }, [currentPersona.id]);

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Marketplace</p>
            <h2 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-base" />
              Active Projects
            </h2>
            <p className="text-sm text-paper-muted mt-1 font-medium">Browse available client projects and submit proposals.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-paper-muted bg-surface rounded-panel border border-line">
            <Loader2 className="w-8 h-8 animate-spin text-brand-base mb-4" />
            <p className="text-sm font-medium">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-line rounded-panel bg-surface">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-line flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6 text-paper-faint" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">No Projects Available</h3>
            <p className="text-sm text-paper-muted mt-1.5 text-center">There are currently no open projects in the marketplace.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card p-0 overflow-hidden group">
                <div className="p-6 flex flex-col sm:flex-row justify-between gap-6 hover:bg-surface-highlight/30 transition-colors">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl font-bold text-white group-hover:text-brand-light transition-colors">{project.title}</h3>
                      <span className="badge badge-brand">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-[14px] text-paper-muted max-w-2xl leading-relaxed">{project.description}</p>
                    <div className="flex items-center gap-6 text-[13px] text-paper-muted font-medium pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider">Posted By</span>
                        <span className="text-white">{project.client?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono2 text-[11px] text-paper-faint uppercase tracking-wider">Proposals</span>
                        <span className="font-mono2 font-bold text-white">{project._count?.proposals || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between min-w-[140px] gap-4 sm:gap-0">
                    <div className="text-right">
                      <span className="eyebrow block mb-1">Budget</span>
                      <div className="font-display text-2xl font-bold text-white">
                        ₹{project.budget.toFixed(2)}
                      </div>
                    </div>
                    <button className="btn btn-secondary w-full sm:w-auto">
                      <ExternalLink className="w-4 h-4" /> Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}