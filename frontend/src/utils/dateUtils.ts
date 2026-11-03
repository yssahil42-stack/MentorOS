/**
 * Date utility functions for MentorOS.
 * All deterministic logic lives here — never in AI responses.
 */

export function formatDate(date: string | Date, style: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  if (style === 'relative') return toRelative(d);

  const opts: Intl.DateTimeFormatOptions =
    style === 'short'  ? { month: 'short', day: 'numeric' } :
    style === 'medium' ? { year: 'numeric', month: 'short', day: 'numeric' } :
                         { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return new Intl.DateTimeFormat('en-US', opts).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
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

export function isOverdue(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function isDueToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
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
