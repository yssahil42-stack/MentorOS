import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  addDays,
  startOfDay,
  endOfDay,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  daysBetween,
  formatRelative,
} from '../../../utils/dateUtils';

describe('utils/dateUtils', () => {
  const fixedDate = new Date('2026-11-03T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('formats Date object to readable string', () => {
      expect(formatDate(new Date('2026-11-03'))).toBe('Nov 3, 2026');
    });

    it('formats date strings', () => {
      expect(formatDate('2026-11-03')).toBe('Nov 3, 2026');
    });

    it('formats timestamp numbers', () => {
      expect(formatDate(1762084800000)).toBe('Nov 2, 2026');
    });

    it('returns "Invalid date" for invalid date values', () => {
      expect(formatDate(null as any)).toBe('Invalid date');
      expect(formatDate(undefined as any)).toBe('Invalid date');
      expect(formatDate('invalid-date')).toBe('Invalid date');
    });
  });

  describe('formatTime', () => {
    it('formats time to 12-hour format', () => {
      expect(formatTime(new Date('2026-11-03T14:30:00'))).toBe('2:30 PM');
      expect(formatTime(new Date('2026-11-03T09:15:00'))).toBe('9:15 AM');
    });
  });

  describe('formatDateTime', () => {
    it('combines date and time', () => {
      const formatted = formatDateTime(new Date('2026-11-03T15:45:00'));
      expect(formatted).toContain('Nov 3, 2026');
      expect(formatted).toContain('3:45 PM');
    });
  });

  describe('day boundary comparisons', () => {
    it('isToday correctly identifies today', () => {
      expect(isToday(new Date('2026-11-03T08:00:00Z'))).toBe(true);
      expect(isToday(new Date('2026-11-04T08:00:00Z'))).toBe(false);
    });

    it('isTomorrow correctly identifies tomorrow', () => {
      expect(isTomorrow(new Date('2026-11-04T12:00:00Z'))).toBe(true);
      expect(isTomorrow(new Date('2026-11-03T12:00:00Z'))).toBe(false);
    });

    it('isYesterday correctly identifies yesterday', () => {
      expect(isYesterday(new Date('2026-11-02T12:00:00Z'))).toBe(true);
      expect(isYesterday(new Date('2026-11-03T12:00:00Z'))).toBe(false);
    });

    it('isPast and isFuture check chronological position', () => {
      expect(isPast(new Date('2026-11-01'))).toBe(true);
      expect(isPast(new Date('2026-11-10'))).toBe(false);

      expect(isFuture(new Date('2026-11-10'))).toBe(true);
      expect(isFuture(new Date('2026-11-01'))).toBe(false);
    });
  });

  describe('date calculations', () => {
    it('addDays correctly adds positive or negative days', () => {
      const base = new Date('2026-11-03T00:00:00Z');
      const added = addDays(base, 5);
      expect(added.toISOString().split('T')[0]).toBe('2026-11-08');

      const subtracted = addDays(base, -2);
      expect(subtracted.toISOString().split('T')[0]).toBe('2026-11-01');
    });

    it('startOfDay and endOfDay calculate timestamp boundaries', () => {
      const date = new Date('2026-11-03T15:30:45');
      const start = startOfDay(date);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);

      const end = endOfDay(date);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('daysBetween calculates absolute or signed diff', () => {
      const d1 = new Date('2026-11-01');
      const d2 = new Date('2026-11-06');
      expect(daysBetween(d1, d2)).toBe(5);
    });

    it('formatRelative returns human-friendly relative labels', () => {
      expect(formatRelative(new Date('2026-11-03T12:00:00Z'))).toBe('Today');
      expect(formatRelative(new Date('2026-11-04T12:00:00Z'))).toBe('Tomorrow');
      expect(formatRelative(new Date('2026-11-02T12:00:00Z'))).toBe('Yesterday');
    });
  });
});
