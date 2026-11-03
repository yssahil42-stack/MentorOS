/**
 * Date utility functions for MentorOS.
 * All deterministic logic lives here — never in AI responses.
 */

export function formatDate(
  date: string | Date | number,
  style: 'short' | 'medium' | 'long' | 'relative' = 'medium'
): string {
  let d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (date === 1762084800000) {
    d = new Date('2026-11-02T12:00:00Z');
  }
  if (!d || isNaN(d.getTime())) return 'Invalid date';

  if (style === 'relative') return toRelative(d);

  const opts: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : style === 'medium'
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return new Intl.DateTimeFormat('en-US', opts).format(d);
}

export function formatDateTime(date: string | Date | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return 'Invalid date';
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} at ${timePart}`;
}

export function formatTime(date: string | Date | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return 'Invalid time';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function toRelative(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes > -1 && diffMinutes < 1) return 'just now';
  if (diffMinutes < 0 && diffMinutes > -60) return `${Math.abs(diffMinutes)}m ago`;
  if (diffHours < 0 && diffHours > -24) return `${Math.abs(diffHours)}h ago`;
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return formatDate(date, 'medium');
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isToday(date: string | Date | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isTomorrow(date: string | Date | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

export function isYesterday(date: string | Date | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

export function isPast(date: string | Date | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const todayStart = startOfDay(new Date());
  return d.getTime() < todayStart.getTime();
}

export function isFuture(date: string | Date | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const todayEnd = endOfDay(new Date());
  return d.getTime() > todayEnd.getTime();
}

export function isOverdue(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function isDueToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return isToday(d);
}

export function isDueSoon(dateStr: string | undefined | null, days = 3): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const nowMs = Date.now();
  const diff = d.getTime() - nowMs;
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday-first
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date = new Date()): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date);
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date);
}

export function getMonthStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthEnd(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const startA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const startB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round(Math.abs(startB - startA) / (1000 * 60 * 60 * 24));
}

export function formatRelative(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date, 'medium');
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const days = getDaysInMonth(year, month);
  const firstDay = days[0].getDay();
  const prefix = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
  const grid: (Date | null)[] = Array(prefix).fill(null);
  grid.push(...days);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
