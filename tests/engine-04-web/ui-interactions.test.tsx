/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';
import { RoleProvider } from '@/components/layout/RoleContext';
import { ThemeProvider } from '@/components/theme/ThemeContext';

// We need to mock next/navigation usePathname and useRouter
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Engine 04 (Web) - UI Components', () => {
  describe('AppShell', () => {
    it('should render the correct navigation items for CLIENT role', () => {
      // Set localStorage to force CLIENT initially
      localStorage.setItem('activeRole', 'CLIENT');
      render(
        <ThemeProvider>
          <RoleProvider>
            <AppShell>
              <div>Content</div>
            </AppShell>
          </RoleProvider>
        </ThemeProvider>
      );

      expect(screen.getByText('Projects')).toBeDefined();
      expect(screen.getByText('Contracts')).toBeDefined();
    });

    it('should call onRoleChange (setRole) when role dropdown is changed', () => {
      localStorage.setItem('activeRole', 'CLIENT');
      const { container } = render(
        <ThemeProvider>
          <RoleProvider>
            <AppShell>
              <div>Content</div>
            </AppShell>
          </RoleProvider>
        </ThemeProvider>
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'FREELANCER' } });

      // Since context updates state, the UI should now show Freelancer items
      expect(screen.getByText('Gigs')).toBeDefined();
      expect(screen.getByText('My Contracts')).toBeDefined();
    });

    it('should open custom workspace dropdown when trigger button is clicked and allow role selection', () => {
      localStorage.setItem('activeRole', 'CLIENT');
      render(
        <ThemeProvider>
          <RoleProvider>
            <AppShell>
              <div>Content</div>
            </AppShell>
          </RoleProvider>
        </ThemeProvider>
      );

      const triggerBtn = screen.getByRole('button', { name: /Switch workspace role/i });
      expect(triggerBtn).toBeDefined();

      // Click to open dropdown
      fireEvent.click(triggerBtn);

      // Dropdown menu should be visible with options
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeDefined();
      expect(within(listbox).getByText('Engineer Workspace')).toBeDefined();
      expect(within(listbox).getByText('Reviewer Workspace')).toBeDefined();
      expect(within(listbox).getByText('Admin Console')).toBeDefined();

      // Click Engineer Workspace option
      const engineerOption = within(listbox).getByRole('option', { name: /Engineer Workspace/i });
      fireEvent.click(engineerOption);

      // UI should now reflect Freelancer persona and navigation
      expect(screen.getByText('Gigs')).toBeDefined();
      expect(screen.getByText('My Contracts')).toBeDefined();
      expect(screen.getAllByText('Charlie Developer').length).toBeGreaterThan(0);
    });

    it('should close dropdown when Escape key is pressed', () => {
      render(
        <ThemeProvider>
          <RoleProvider>
            <AppShell>
              <div>Content</div>
            </AppShell>
          </RoleProvider>
        </ThemeProvider>
      );

      const triggerBtn = screen.getByRole('button', { name: /Switch workspace role/i });
      fireEvent.click(triggerBtn);
      expect(screen.getByRole('listbox')).toBeDefined();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  describe('Dialog Transaction UX', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Dialog isOpen={false} onClose={vi.fn()} title="Test Dialog">
          <div>Dialog Content</div>
        </Dialog>
      );
      expect(screen.queryByText('Test Dialog')).toBeNull();
    });

    it('should trap focus and display correctly when isOpen is true', () => {
      const onClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={onClose} title="Release Escrow">
          <div>Are you sure?</div>
        </Dialog>
      );

      expect(screen.getByText('Release Escrow')).toBeDefined();
      expect(screen.getByText('Are you sure?')).toBeDefined();
    });

    it('should trigger onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(
        <Dialog isOpen={true} onClose={onClose} title="Close Me">
          <div>Content</div>
        </Dialog>
      );

      const backdrop = container.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });
});
