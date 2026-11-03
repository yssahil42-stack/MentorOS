import type { CalendarEvent } from '../types/calendar';

/**
 * Format a Date or ISO string into an iCal UTC date-time string (YYYYMMDDTHHMMSSZ)
 */
function formatToICSDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  }
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Escape text for iCalendar RFC 5545 specifications
 */
function escapeICSText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate RFC 5545 standard .ics file content from CalendarEvent array
 */
export function generateICSContent(
  events: CalendarEvent[],
  calendarTitle = 'MentorOS Schedule'
): string {
  const nowICS = formatToICSDate(new Date().toISOString());

  const eventBlocks = events.map((event) => {
    const uid = `mentoros-${event.id || Math.random().toString(36).substring(2, 9)}-${Date.now()}@mentoros.dev`;
    const dtStart = formatToICSDate(event.start_at);
    const dtEnd = formatToICSDate(event.end_at);
    const summary = escapeICSText(event.title);
    const description = escapeICSText(
      `${event.description || ''}\n\nCategory: ${event.event_type?.replace('_', ' ') || 'Session'}\nWorkspace: MentorOS`
    );

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowICS}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MentorOS//Productivity & Learning Suite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarTitle)}`,
    ...eventBlocks,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Trigger browser download for an .ics file with given events
 */
export function downloadICSFile(
  events: CalendarEvent[],
  filename = 'mentoros-schedule.ics',
  calendarTitle?: string
): void {
  if (!events || events.length === 0) return;

  const icsData = generateICSContent(events, calendarTitle);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a direct "Add to Google Calendar" web URL
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const start = formatToICSDate(event.start_at);
  const end = formatToICSDate(event.end_at);
  const title = encodeURIComponent(event.title || 'MentorOS Session');
  const details = encodeURIComponent(
    `${event.description || ''}\n\nType: ${event.event_type?.replace('_', ' ') || 'Session'}\nSynced from MentorOS`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=MentorOS`;
}
