'use client';

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  FileCheck2,
  Settings,
  Bell,
  ShieldCheck,
  UserCheck
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
          { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
          { icon: Layers, label: 'Projects & Gigs', href: '/projects' },
          { icon: FileCheck2, label: 'Active Contracts', href: '/' },
          { icon: AlertTriangle, label: 'Disputes', href: '/disputes' },
        ];
      case 'FREELANCER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
          { icon: Layers, label: 'Available Gigs', href: '/gigs' },
          { icon: FileCheck2, label: 'My Contracts', href: '/' },
          { icon: AlertTriangle, label: 'Disputes', href: '/disputes' },
        ];
      case 'REVIEWER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
          { icon: AlertTriangle, label: 'Pending Cases', href: '/disputes' },
        ];
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'System Overview', href: '/' },
          { icon: ShieldCheck, label: 'Audit Logs', href: '/audit' },
          { icon: Settings, label: 'Settings', href: '/settings' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-base)] text-[var(--color-text-primary)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--color-border-default)] bg-[var(--color-surface-1)]/50 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <Link href="/" className="flex items-center space-x-3 mb-6 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dark)] flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              07
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight leading-none block">EscrowProtocol</span>
              <span className="text-[10px] font-mono text-[var(--color-primary-light)]">Engine v1.0</span>
            </div>
          </Link>

          <div className="space-y-1">
            <div className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Active Role</div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-[var(--color-base)] border border-[var(--color-border-default)] text-sm rounded-md px-3 py-2 text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] transition-shadow duration-150"
            >
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--color-primary-base)]/10 text-[var(--color-primary-light)] shadow-[inset_2px_0_0_0_var(--color-primary-base)]'
                    : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-2)]/50 hover:translate-x-1'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center border border-[var(--color-border-default)]">
              <UserCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentPersona.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{currentPersona.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border-default)] bg-[var(--color-surface-1)]/80 backdrop-blur z-40 sticky top-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-dark)] flex items-center justify-center font-bold text-white text-xs">
              07
            </div>
            <span className="font-semibold text-white text-sm">EscrowProtocol</span>
          </div>
          <div className="flex items-center gap-3">
             <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-[var(--color-base)] border border-[var(--color-border-default)] text-xs rounded px-2 py-1 text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-base)]"
            >
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </header>

        {/* Top bar (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-base)]/50 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-[var(--color-success-base)]/10 text-[var(--color-success-base)] px-2 py-1 rounded-md border border-[var(--color-success-base)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success-base)] animate-pulse"></span>
              System Operational
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[var(--color-text-muted)] hover:text-white transition-colors relative focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] rounded-md p-1">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-danger-base)] rounded-full border border-[var(--color-base)]"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
