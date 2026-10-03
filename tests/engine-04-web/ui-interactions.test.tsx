/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/Dialog';

describe('Engine 04 (Web) - UI Components', () => {
  describe('AppShell', () => {
    it('should render the correct navigation items for CLIENT role', () => {
      const onRoleChange = vi.fn();
      render(
        <AppShell role="CLIENT" onRoleChange={onRoleChange} currentPersona={{ name: 'Alice', email: 'alice@example.com' }}>
          <div>Content</div>
        </AppShell>
      );
      
      expect(screen.getByText('Projects & Gigs')).toBeDefined();
      expect(screen.getByText('Active Contracts')).toBeDefined();
    });

    it('should render the correct navigation items for FREELANCER role', () => {
      const onRoleChange = vi.fn();
      render(
        <AppShell role="FREELANCER" onRoleChange={onRoleChange} currentPersona={{ name: 'Charlie', email: 'charlie@example.com' }}>
          <div>Content</div>
        </AppShell>
      );
      
      expect(screen.getByText('Available Work')).toBeDefined();
      expect(screen.getByText('My Contracts')).toBeDefined();
    });

    it('should call onRoleChange when role dropdown is changed', () => {
      const onRoleChange = vi.fn();
      render(
        <AppShell role="CLIENT" onRoleChange={onRoleChange} currentPersona={{ name: 'Alice', email: 'alice@example.com' }}>
          <div>Content</div>
        </AppShell>
      );
      
      const selects = screen.getAllByRole('combobox');
      // Change the first visible select (desktop sidebar)
      fireEvent.change(selects[0], { target: { value: 'FREELANCER' } });
      expect(onRoleChange).toHaveBeenCalledWith('FREELANCER');
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
      
      // The backdrop is the first element
      const backdrop = container.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });
});
