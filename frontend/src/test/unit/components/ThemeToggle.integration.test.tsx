import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { ThemeProvider } from '../../../contexts/ThemeContext';

describe('ThemeToggle Integration Tests', () => {
  const THEME_KEY = 'mentoros-theme';

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  describe('Context Requirement', () => {
    it('throws error when rendered outside ThemeProvider', () => {
      // Suppress console.error for expected thrown error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ThemeToggle />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Default Icon Variant Integration', () => {
    it('initializes in light mode, updates HTML class and toggles theme on click', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(toggleBtn).toBeInTheDocument();
      expect(document.documentElement.classList.contains('light')).toBe(true);

      // Click to toggle to dark mode
      fireEvent.click(toggleBtn);

      expect(localStorage.getItem(THEME_KEY)).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');

      // Click again to toggle back to light mode
      fireEvent.click(toggleBtn);

      expect(localStorage.getItem(THEME_KEY)).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('respects initial theme preset in localStorage', () => {
      localStorage.setItem(THEME_KEY, 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const toggleBtn = screen.getByRole('button', { name: /switch to light mode/i });
      expect(toggleBtn).toBeInTheDocument();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies correct size classes for sm, md, and lg', () => {
      const { rerender } = render(
        <ThemeProvider>
          <ThemeToggle size="sm" />
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('w-8', 'h-8');

      rerender(
        <ThemeProvider>
          <ThemeToggle size="md" />
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('w-9', 'h-9');

      rerender(
        <ThemeProvider>
          <ThemeToggle size="lg" />
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('w-10', 'h-10');
    });
  });

  describe('Pill & Badge Variants Integration', () => {
    it('renders badge variant with descriptive label and updates text when clicked', () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="badge" />
        </ThemeProvider>
      );

      expect(screen.getByText('Light Mode')).toBeInTheDocument();
      const badgeBtn = screen.getByRole('button', {
        name: /current mode: light\. click to switch\./i,
      });

      fireEvent.click(badgeBtn);

      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(badgeBtn).toHaveAttribute('aria-label', 'Current mode: Dark. Click to switch.');
    });

    it('renders pill variant with descriptive aria-label', () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="pill" />
        </ThemeProvider>
      );

      expect(screen.getByText('Light Mode')).toBeInTheDocument();
      const pillBtn = screen.getByRole('button');
      fireEvent.click(pillBtn);
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
  });

  describe('Expanded & ShowLabel Integration', () => {
    it('renders expanded variant with full-width style and label text', () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="expanded" />
        </ThemeProvider>
      );

      const expandedBtn = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(expandedBtn).toHaveClass('w-full');
      expect(screen.getByText('Light Mode')).toBeInTheDocument();

      fireEvent.click(expandedBtn);
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(expandedBtn).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('renders expanded layout when showLabel=true regardless of default variant', () => {
      render(
        <ThemeProvider>
          <ThemeToggle showLabel={true} />
        </ThemeProvider>
      );

      expect(screen.getByText('Light Mode')).toBeInTheDocument();
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
  });

  describe('Custom Attributes & Classes', () => {
    it('passes custom className down to toggle button element', () => {
      render(
        <ThemeProvider>
          <ThemeToggle className="custom-theme-class" />
        </ThemeProvider>
      );

      expect(screen.getByRole('button')).toHaveClass('custom-theme-class');
    });
  });
});
