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
        <div className="border-b border-[var(--color-border-subtle)] pb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary-light)]" />
            Active Projects & Opportunities
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Browse available client projects and submit proposals.</p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-base)] mb-4" />
            <p className="text-sm font-medium">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-[var(--color-border-strong)] rounded-xl bg-[var(--color-surface-1)]/50">
            <FolderOpen className="w-12 h-12 text-[var(--color-border-strong)] mb-4" />
            <h3 className="text-base font-medium text-white">No Projects Available</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 text-center">There are currently no open projects in the marketplace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card p-6 flex flex-col sm:flex-row justify-between gap-6 hover:border-[var(--color-border-strong)] transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                    <span className="badge bg-[var(--color-surface-2)] border-[var(--color-border-strong)] text-[var(--color-text-secondary)]">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl">{project.description}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-text-muted)]">
                    <span>Posted by: <span className="text-slate-300">{project.client?.name}</span></span>
                    <span>Proposals: <span className="text-slate-300">{project._count?.proposals || 0}</span></span>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end justify-between min-w-[120px] gap-4">
                  <div className="text-xl font-bold font-mono text-white tracking-tight">
                    ${project.budget.toFixed(2)}
                  </div>
                  <button className="btn btn-sm btn-secondary w-full sm:w-auto">
                    <ExternalLink className="w-3.5 h-3.5" /> View Details
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
