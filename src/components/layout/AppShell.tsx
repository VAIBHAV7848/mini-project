'use client';

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Bell,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from './RoleContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, setRole, currentPersona } = useRole();
  const pathname = usePathname();

  const getNavItems = () => {
    switch (role) {
      case 'CLIENT':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: Layers, label: 'Projects', href: '/projects' },
          { icon: ShieldCheck, label: 'Contracts', href: '/contracts' },
          { icon: AlertTriangle, label: 'Disputes', href: '/disputes' },
        ];
      case 'FREELANCER':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: Layers, label: 'Gigs', href: '/gigs' },
          { icon: ShieldCheck, label: 'My Contracts', href: '/contracts' },
          { icon: AlertTriangle, label: 'Disputes', href: '/disputes' },
        ];
      case 'REVIEWER':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: AlertTriangle, label: 'Pending Cases', href: '/disputes' },
        ];
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'System Overview', href: '/dashboard' },
          { icon: ShieldCheck, label: 'Audit Logs', href: '/audit' },
          { icon: Settings, label: 'Settings', href: '/settings' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-charcoal text-paper selection:bg-brand-base/30 selection:text-white">
      <aside className="hidden md:flex flex-col w-[260px] border-r border-line bg-charcoal sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex flex-col gap-6">
          <Link href="/dashboard" className="flex items-center space-x-3 group outline-none focus-visible:ring-2 focus-visible:ring-brand-base rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-brand-base flex items-center justify-center font-display font-bold text-charcoal transition-transform duration-[160ms] ease-[var(--ease-forge)] group-hover:scale-105">
              GF
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">GigaFlow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="mb-4 px-3">
            <p className="eyebrow">Main Navigation</p>
          </div>
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-[14px] font-medium transition-all duration-[160ms] ease-[var(--ease-forge)] outline-none focus-visible:ring-2 focus-visible:ring-brand-base ${
                  isActive
                    ? 'bg-surface-elevated text-white font-semibold'
                    : 'text-paper-muted hover:text-paper hover:bg-surface border border-transparent'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand-base rounded-r-[1px]" />}
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-base' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-line relative group cursor-pointer hover:bg-surface-elevated transition-colors">
          <select
            id="workspace-select"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Switch workspace role"
          >
            <option value="CLIENT">Client Workspace</option>
            <option value="FREELANCER">Engineer Workspace</option>
            <option value="REVIEWER">Reviewer Workspace</option>
            <option value="ADMIN">Admin Console</option>
          </select>
          <div className="flex items-center gap-3 px-2 pointer-events-none">
            <div className="w-9 h-9 rounded-full bg-brand-tint flex items-center justify-center border border-brand-base/30 text-brand-light">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white truncate">{currentPersona.name}</p>
              <p className="text-[12px] text-paper-muted truncate capitalize">{role.toLowerCase()} Workspace</p>
            </div>
            <ChevronDown className="w-4 h-4 text-paper-faint group-hover:text-paper-muted transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-surface">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-line bg-surface/80 backdrop-blur z-40 sticky top-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-brand-base flex items-center justify-center font-display font-bold text-charcoal text-xs">
              GF
            </div>
            <span className="font-display font-bold text-white text-sm">GigaFlow</span>
          </div>
          <div className="flex items-center gap-3 relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              aria-label="Switch workspace role"
              className="bg-surface-elevated border border-line text-xs font-mono2 rounded-lg pl-3 pr-8 py-1.5 text-paper appearance-none focus:outline-none focus:ring-1 focus:ring-brand-base"
            >
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Engineer</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown className="w-3 h-3 text-paper-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </header>

        {/* Top bar (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-10 py-5 border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <span className="font-mono2 text-[11px] text-paper-muted uppercase tracking-wider">
               {role} Workspace
             </span>
             <span className="w-1 h-1 rounded-full bg-line-strong" />
             <span className="text-[13px] text-paper-muted">
               {currentPersona.name}
             </span>
          </div>
          <div className="flex items-center gap-4">
            <button aria-label="Notifications" className="text-paper-muted hover:text-white transition-colors relative focus:outline-none focus:ring-2 focus:ring-brand-base rounded-md p-1">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-base rounded-full border border-charcoal"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto w-full animate-in fade-in duration-300 ease-out">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}