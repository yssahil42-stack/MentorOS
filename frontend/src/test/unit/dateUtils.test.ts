import { describe, it, expect, vi } from 'vitest';
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
} from '../../utils/dateUtils';

describe('dateUtils', () => {
  const fixedDate = new Date('2026-11-02T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      expect(formatDate(new Date('2026-11-02'))).toBe('Nov 2, 2026');
    });

    it('handles string dates', () => {
      expect(formatDate('2026-11-02')).toBe('Nov 2, 2026');
    });

    it('handles timestamps', () => {
      expect(formatDate(1762084800000)).toBe('Nov 2, 2026');
    });
  });

  describe('formatTime', () => {
    it('formats time correctly', () => {
      expect(formatTime(new Date('2026-11-02T14:30:00'))).toBe('2:30 PM');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time', () => {
      expect(formatDateTime(new Date('2026-11-02T14:30:00'))).toBe('Nov 2, 2026 at 2:30 PM');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date('2026-11-02'))).toBe(true);
    });

    it('returns false for other days', () => {
      expect(isToday(new Date('2026-11-01'))).toBe(false);
      expect(isToday(new Date('2026-11-03'))).toBe(false);
    });
  });

  describe('isTomorrow', () => {
    it('returns true for tomorrow', () => {
      expect(isTomorrow(new Date('2026-11-03'))).toBe(true);
    });

    it('returns false for other days', () => {
      expect(isTomorrow(new Date('2026-11-02'))).toBe(false);
      expect(isTomorrow(new Date('2026-11-04'))).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('returns true for yesterday', () => {
      expect(isYesterday(new Date('2026-11-01'))).toBe(true);
    });

    it('returns false for other days', () => {
      expect(isYesterday(new Date('2026-11-02'))).toBe(false);
      expect(isYesterday(new Date('2026-10-31'))).toBe(false);
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast(new Date('2026-11-01'))).toBe(true);
    });

    it('returns false for future dates', () => {
      expect(isPast(new Date('2026-11-03'))).toBe(false);
    });

    it('returns false for today', () => {
      expect(isPast(new Date('2026-11-02'))).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      expect(isFuture(new Date('2026-11-03'))).toBe(true);
    });

    it('returns false for past dates', () => {
      expect(isFuture(new Date('2026-11-01'))).toBe(false);
    });

    it('returns false for today', () => {
      expect(isFuture(new Date('2026-11-02'))).toBe(false);
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      expect(addDays(new Date('2026-11-02'), 5)).toEqual(new Date('2026-11-07'));
    });

    it('subtracts days with negative values', () => {
      expect(addDays(new Date('2026-11-02'), -5)).toEqual(new Date('2026-10-28'));
    });
  });

  describe('startOfDay', () => {
    it('returns start of day', () => {
      const date = new Date('2026-11-02T14:30:00');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('returns end of day', () => {
      const date = new Date('2026-11-02T14:30:00');
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('getWeekStart', () => {
    it('returns start of week (Monday)', () => {
      const weekStart = getWeekStart(new Date('2026-11-02')); // Monday
      expect(weekStart.getDay()).toBe(1); // Monday
    });
  });

  describe('getWeekEnd', () => {
    it('returns end of week (Sunday)', () => {
      const weekEnd = getWeekEnd(new Date('2026-11-02'));
      expect(weekEnd.getDay()).toBe(0); // Sunday
    });
  });

  describe('getMonthStart', () => {
    it('returns start of month', () => {
      const monthStart = getMonthStart(new Date('2026-11-15'));
      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getHours()).toBe(0);
    });
  });

  describe('getMonthEnd', () => {
    it('returns end of month', () => {
      const monthEnd = getMonthEnd(new Date('2026-11-15'));
      expect(monthEnd.getDate()).toBe(30); // November has 30 days
      expect(monthEnd.getHours()).toBe(23);
    });
  });

  describe('daysBetween', () => {
    it('calculates days between dates', () => {
      expect(daysBetween(new Date('2026-11-01'), new Date('2026-11-05'))).toBe(4);
    });

    it('handles same date', () => {
      expect(daysBetween(new Date('2026-11-02'), new Date('2026-11-02'))).toBe(0);
    });

    it('handles reverse order', () => {
      expect(daysBetween(new Date('2026-11-05'), new Date('2026-11-01'))).toBe(4);
    });
  });

  describe('formatRelative', () => {
    it('returns "Today" for today', () => {
      expect(formatRelative(new Date('2026-11-02'))).toBe('Today');
    });

    it('returns "Tomorrow" for tomorrow', () => {
      expect(formatRelative(new Date('2026-11-03'))).toBe('Tomorrow');
    });

    it('returns "Yesterday" for yesterday', () => {
      expect(formatRelative(new Date('2026-11-01'))).toBe('Yesterday');
    });

    it('returns formatted date for other days', () => {
      expect(formatRelative(new Date('2026-11-10'))).toBe('Nov 10, 2026');
      expect(formatRelative(new Date('2026-10-25'))).toBe('Oct 25, 2026');
    });
  });
});
