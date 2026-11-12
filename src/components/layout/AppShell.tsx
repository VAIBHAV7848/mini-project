'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Bell,
  UserCheck,
  ChevronDown,
  Check,
  LogOut,
  User,
  Landmark,
  Wallet,
  Menu,
  X,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRole, Role } from './RoleContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const WORKSPACE_OPTIONS: { role: Role; label: string; sublabel: string; initial: string; badgeColor: string }[] = [
  { role: 'CLIENT', label: 'Client Workspace', sublabel: 'Alice Client', initial: 'C', badgeColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  { role: 'FREELANCER', label: 'Engineer Workspace', sublabel: 'Charlie Developer', initial: 'E', badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { role: 'REVIEWER', label: 'Reviewer Workspace', sublabel: 'Judge Reviewer', initial: 'R', badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { role: 'ADMIN', label: 'Admin Console', sublabel: 'Vaibhav Chavanpatil (VAIBHAV)', initial: 'V', badgeColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
];

function UserProfileDropdown() {
  const { role, currentPersona } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      localStorage.removeItem('activeRole');
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const roleBadgeStyles: Record<Role, string> = {
    CLIENT: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    FREELANCER: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    REVIEWER: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    ADMIN: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
        className="flex items-center gap-2.5 p-1 rounded-full md:rounded-lg hover:bg-surface-elevated transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-base cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-brand-base/20 border border-brand-base/40 flex items-center justify-center text-xs font-bold text-brand-light">
          {getInitials(currentPersona.name)}
        </div>
        <div className="hidden lg:flex flex-col text-left">
          <span className="text-xs font-semibold text-paper leading-tight truncate max-w-[120px]">
            {currentPersona.name}
          </span>
          <span className="text-[10px] text-paper-muted font-mono2 uppercase">
            {role}
          </span>
        </div>
        <ChevronDown
          className={`hidden lg:block w-3.5 h-3.5 text-paper-muted transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-brand-base' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User profile options"
          className="absolute right-0 mt-2 w-64 bg-surface-elevated border border-line-strong rounded-xl shadow-2xl z-50 p-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Identity Header */}
          <div className="px-3 py-2.5 border-b border-line/40">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono2 font-bold px-1.5 py-0.5 rounded border ${roleBadgeStyles[role]}`}>
                {role}
              </span>
            </div>
            <p className="text-sm font-bold text-paper truncate">{currentPersona.name}</p>
            <p className="text-xs text-paper-muted truncate font-mono2">{currentPersona.email}</p>
          </div>

          {/* Quick Actions */}
          <div className="py-1">
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-paper-muted hover:text-paper hover:bg-surface-highlight transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-paper-muted" aria-hidden="true" />
              Workspace Dashboard
            </Link>
            <Link
              href="/rtm"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-paper-muted hover:text-paper hover:bg-surface-highlight transition-colors"
            >
              <BadgeCheck className="w-4 h-4 text-brand-base" aria-hidden="true" />
              Traceability Matrix
            </Link>
            {role === 'ADMIN' && (
              <Link
                href="/audit"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-paper-muted hover:text-paper hover:bg-surface-highlight transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-paper-muted" aria-hidden="true" />
                Audit Logs
              </Link>
            )}
          </div>

          <div role="separator" aria-orientation="horizontal" className="border-t border-line/40 my-1" />

          {/* Sign Out Action */}
          <button
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:text-danger-light hover:bg-danger-tint transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-danger" aria-hidden="true" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, setRole, currentPersona } = useRole();
  const pathname = usePathname();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsRoleDropdownOpen(false);
      }
    }
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRoleDropdownOpen]);

  const getNavItems = () => {
    switch (role) {
      case 'CLIENT':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: Layers, label: 'Projects', href: '/projects' },
          { icon: ShieldCheck, label: 'Contracts', href: '/contracts' },
          { icon: AlertTriangle, label: 'Disputes', href: '/disputes' },
          { icon: BadgeCheck, label: 'Traceability Matrix', href: '/rtm' },
        ];
      case 'FREELANCER':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: Layers, label: 'Gigs', href: '/gigs' },
          { icon: ShieldCheck, label: 'My Contracts', href: '/contracts' },
          { icon: AlertTriangle, label: 'Disputes', href: '/disputes' },
          { icon: BadgeCheck, label: 'Traceability Matrix', href: '/rtm' },
        ];
      case 'REVIEWER':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: AlertTriangle, label: 'Dispute Cases', href: '/disputes' },
          { icon: ShieldCheck, label: 'Contracts', href: '/contracts' },
          { icon: BadgeCheck, label: 'Traceability Matrix', href: '/rtm' },
        ];
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
          { icon: Landmark, label: 'Finance & Settlements', href: '/admin/finance' },
          { icon: ShieldCheck, label: 'Ledger Audit', href: '/audit' },
          { icon: Layers, label: 'All Projects', href: '/projects' },
          { icon: AlertTriangle, label: 'All Disputes', href: '/disputes' },
          { icon: BadgeCheck, label: 'Traceability Matrix', href: '/rtm' },
          { icon: Settings, label: 'System', href: '/settings' },
        ];
      default:
        return [];
    }
  };

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  };

  const navItems = getNavItems();
  const currentOption = WORKSPACE_OPTIONS.find((opt) => opt.role === role) || WORKSPACE_OPTIONS[0];

  return (
    <div className="min-h-screen bg-charcoal text-paper flex">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-line bg-charcoal flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo & Workspace Selector */}
          <div className="p-6 border-b border-line">
            <Link href="/" className="flex items-center space-x-3 mb-6 outline-none focus-visible:ring-2 focus-visible:ring-brand-base rounded p-1">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-surface-elevated border border-line shrink-0">
                <Image
                  src="/assets/gigaflow-mark.png"
                  alt="GigaFlow Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(252,108,0,0.35)]"
                  priority
                />
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight text-paper block leading-none">
                  GigaFlow
                </span>
                <span className="font-mono2 text-[10px] text-paper-faint uppercase tracking-wider">
                  Escrow System
                </span>
              </div>
            </Link>

            {/* Custom Workspace Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                aria-expanded={isRoleDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Switch workspace role"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-line hover:border-line-strong transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-base cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-mono2 text-xs font-bold shrink-0 border ${currentOption.badgeColor}`}>
                    {currentOption.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-paper truncate leading-snug">{currentOption.label}</p>
                    <p className="text-[10px] text-paper-faint truncate font-mono2">{currentOption.sublabel}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-paper-muted shrink-0 transition-transform duration-150 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isRoleDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Available workspace roles"
                  className="absolute left-0 right-0 mt-1.5 bg-surface-elevated border border-line-strong rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  {WORKSPACE_OPTIONS.map((opt) => {
                    const isSelected = opt.role === role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setRole(opt.role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-highlight transition-colors cursor-pointer ${
                          isSelected ? 'bg-surface-highlight/70' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-5 h-5 rounded flex items-center justify-center font-mono2 text-[10px] font-bold shrink-0 border ${opt.badgeColor}`}>
                            {opt.initial}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-brand-light' : 'text-paper'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-paper-faint truncate font-mono2">{opt.sublabel}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-base shrink-0 ml-2" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Sidebar Navigation" className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-highlight text-paper font-semibold shadow-xs'
                      : 'text-paper-muted hover:text-paper hover:bg-surface-elevated'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-base' : ''}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Health / Footer */}
        <div className="p-4 border-t border-line text-xs text-paper-faint font-mono2">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-paper-muted text-[11px]">Audit Engine Active</span>
          </div>
          <p className="text-[10px] text-paper-faint">Team 07 · KLE Tech</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-surface">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-line bg-surface/90 backdrop-blur z-40 sticky top-0">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="p-1.5 rounded-lg bg-surface-elevated border border-line text-paper hover:text-paper"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-surface-elevated border border-line shrink-0">
                <Image
                  src="/assets/gigaflow-mark.png"
                  alt="GigaFlow Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-paper text-sm">GigaFlow</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <div className="flex items-center gap-2 relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                aria-label="Switch workspace role"
                className="bg-surface-elevated border border-line text-xs font-mono2 rounded-lg pl-2 pr-7 py-1.5 text-paper appearance-none focus:outline-none focus:ring-1 focus:ring-brand-base cursor-pointer"
              >
                <option value="CLIENT" className="bg-surface-elevated text-paper">Client</option>
                <option value="FREELANCER" className="bg-surface-elevated text-paper">Engineer</option>
                <option value="REVIEWER" className="bg-surface-elevated text-paper">Reviewer</option>
                <option value="ADMIN" className="bg-surface-elevated text-paper">Admin</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-paper-faint absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            </div>
            <UserProfileDropdown />
          </div>
        </header>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer Panel */}
            <div className="relative w-72 max-w-full bg-surface border-r border-line p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-surface-elevated border border-line shrink-0">
                      <Image
                        src="/assets/gigaflow-mark.png"
                        alt="GigaFlow Logo"
                        width={28}
                        height={28}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="font-display font-bold text-paper text-sm block leading-none">GigaFlow</span>
                      <span className="text-[10px] font-mono2 text-paper-faint uppercase">Escrow Protocol</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-1 rounded-md text-paper-muted hover:text-paper"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Workspace Indicator */}
                <div className="p-3 rounded-lg bg-surface-elevated border border-line">
                  <span className="text-[10px] font-mono2 uppercase text-paper-faint block mb-1">Active Role</span>
                  <p className="text-xs font-bold text-paper flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-base animate-pulse" />
                    {currentOption.label}
                  </p>
                  <p className="text-[11px] text-paper-muted font-mono2 truncate">{currentPersona.name}</p>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1" aria-label="Mobile Navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-surface-highlight text-paper font-semibold shadow-xs'
                            : 'text-paper-muted hover:text-paper hover:bg-surface-elevated'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-base' : ''}`} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-line pt-4 text-xs font-mono2 text-paper-faint">
                <p>Team 07 · KLE Tech Belagavi</p>
                <p className="text-[10px] text-paper-faint mt-0.5">Engine 01 · 02 · 03 · 04 Active</p>
              </div>
            </div>
          </div>
        )}

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
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <button type="button" aria-label="Notifications" className="text-paper-muted hover:text-paper transition-colors relative focus:outline-none focus:ring-2 focus:ring-brand-base rounded-md p-1">
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-base rounded-full border border-charcoal" aria-hidden="true"></span>
            </button>
            <div className="h-5 w-px bg-line/60 mx-1" />
            <UserProfileDropdown />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-10 pb-24 md:pb-10 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto w-full animate-in fade-in duration-300 ease-out">
            {children}
          </div>
        </div>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav
          aria-label="Mobile Bottom Bar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-line px-3 py-2 flex items-center justify-around shadow-lg"
        >
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                  isActive ? 'text-brand-light font-bold' : 'text-paper-muted hover:text-paper'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-base' : ''}`} />
                <span className="text-[10px] font-mono2 mt-1 truncate max-w-[65px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
