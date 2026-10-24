'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function ThemeToggle({ size = 'md', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  const isDark = theme === 'dark';
  const sizeClasses = size === 'sm' ? 'w-8 h-8 p-1.5' : 'w-9 h-9 p-2';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label="Toggle light or dark theme"
      aria-pressed={isMounted ? !isDark : undefined}
      title={isMounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Toggle theme'}
      className={`relative inline-flex items-center justify-center rounded-xl border border-line bg-surface-elevated text-paper-muted hover:text-paper hover:border-brand-base/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base cursor-pointer ${sizeClasses} ${className}`}
    >
      {!isMounted ? (
        <span className={`${iconSize} block rounded-full bg-paper-faint/20 animate-pulse`} aria-hidden="true" />
      ) : isDark ? (
        <Sun
          className={`${iconSize} text-amber-400 transition-transform duration-300 hover:rotate-45`}
          aria-hidden="true"
        />
      ) : (
        <Moon
          className={`${iconSize} text-brand-base transition-transform duration-300 hover:-rotate-12`}
          aria-hidden="true"
        />
      )}
      <span className="sr-only">Toggle light or dark theme</span>
    </button>
  );
}
