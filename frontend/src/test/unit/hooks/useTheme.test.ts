import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { useTheme } from '../../../hooks/useTheme';

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('throws error when used outside ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    consoleError.mockRestore();
  });

  it('initializes with default light theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => React.createElement(ThemeProvider, null, children),
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('switches to dark theme and applies classes to document.documentElement', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => React.createElement(ThemeProvider, null, children),
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('mentoros-theme')).toBe('dark');
  });

  it('toggles theme between dark and light', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => React.createElement(ThemeProvider, null, children),
    });

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.resolvedTheme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.resolvedTheme).toBe('light');
  });
});
