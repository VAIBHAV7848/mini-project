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

interface AppShellProps {
  children: React.ReactNode;
  role: 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';
  onRoleChange: (role: 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN') => void;
  currentPersona: { name: string; email: string };
}

export function AppShell({ children, role, onRoleChange, currentPersona }: AppShellProps) {
  const getNavItems = () => {
    switch (role) {
      case 'CLIENT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
          { icon: Layers, label: 'Projects & Gigs', href: '#' },
          { icon: FileCheck2, label: 'Active Contracts', href: '#' },
          { icon: AlertTriangle, label: 'Disputes', href: '#' },
        ];
      case 'FREELANCER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
          { icon: Layers, label: 'Available Work', href: '#' },
          { icon: FileCheck2, label: 'My Contracts', href: '#' },
        ];
      case 'REVIEWER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
          { icon: AlertTriangle, label: 'Pending Cases', href: '#' },
        ];
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'System Overview', href: '#' },
          { icon: ShieldCheck, label: 'Audit Logs', href: '#' },
          { icon: Settings, label: 'Settings', href: '#' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-base)] text-[var(--color-text-primary)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              07
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight leading-none block">EscrowProtocol</span>
              <span className="text-[10px] font-mono text-indigo-400">Engine v1.0</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Active Role</div>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-sm rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${idx === 0 ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserCheck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentPersona.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentPersona.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-40 sticky top-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              07
            </div>
            <span className="font-semibold text-white text-sm">EscrowProtocol</span>
          </div>
          <div className="flex items-center gap-3">
             <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs rounded px-2 py-1 text-slate-300"
            >
              <option value="CLIENT">Client</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </header>

        {/* Top bar (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
