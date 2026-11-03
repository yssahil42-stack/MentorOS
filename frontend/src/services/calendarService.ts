import { api } from './api';
import type {
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '../types/calendar';

export function fetchCalendarEvents(
  params?: { start?: string; end?: string; role?: string },
  signal?: AbortSignal
): Promise<CalendarEvent[]> {
  return api.get<CalendarEvent[]>('/calendar/events', { params, signal });
}

export function createCalendarEvent(data: CreateCalendarEventRequest): Promise<CalendarEvent> {
  return api.post<CalendarEvent>('/calendar/events', data);
}

export function updateCalendarEvent(
  id: number,
  data: UpdateCalendarEventRequest
): Promise<CalendarEvent> {
  return api.patch<CalendarEvent>(`/calendar/events/${id}`, data);
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await api.delete(`/calendar/events/${id}`);
}
