import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../../hooks/useDebounce';

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes according to specified delay', () => {
    const { result, rerender } = renderHook(({ val, delay }) => useDebounce(val, delay), {
      initialProps: { val: 'first', delay: 300 },
    });

    expect(result.current).toBe('first');

    // Update prop
    rerender({ val: 'second', delay: 300 });

    // Value should not change immediately
    expect(result.current).toBe('first');

    // Advance 150ms (halfway)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('first');

    // Advance remaining 150ms
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('second');
  });

  it('cancels previous timer on rapid value updates', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'start' },
    });

    rerender({ val: 'update-1' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ val: 'update-2' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ val: 'final' });
    expect(result.current).toBe('start');

    // Fast-forward past delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('final');
  });
});
