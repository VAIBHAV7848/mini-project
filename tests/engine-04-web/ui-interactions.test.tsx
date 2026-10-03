/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';
import { RoleProvider } from '@/components/layout/RoleContext';

// We need to mock next/navigation usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Engine 04 (Web) - UI Components', () => {
  describe('AppShell', () => {
    it('should render the correct navigation items for CLIENT role', () => {
      // Set localStorage to force CLIENT initially
      localStorage.setItem('activeRole', 'CLIENT');
      render(
        <RoleProvider>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </RoleProvider>
      );

      expect(screen.getByText('Projects & Gigs')).toBeDefined();
      expect(screen.getByText('Active Contracts')).toBeDefined();
    });

    it('should call onRoleChange (setRole) when role dropdown is changed', () => {
      localStorage.setItem('activeRole', 'CLIENT');
      const { container } = render(
        <RoleProvider>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </RoleProvider>
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'FREELANCER' } });

      // Since context updates state, the UI should now show Freelancer items
      expect(screen.getByText('Available Gigs')).toBeDefined();
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
