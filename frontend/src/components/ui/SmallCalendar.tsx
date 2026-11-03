import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Plus,
  Clock,
  Trash2,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Card } from './Card';
import { Card3D } from './Card3D';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from '../../services/calendarService';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { CalendarEvent, CalendarEventType } from '../../types/calendar';

interface SmallCalendarProps {
  role?: string;
}

export function SmallCalendar({ role }: SmallCalendarProps) {
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // New Event Form Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('study_block');
  const [eventDateStr, setEventDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [eventDescription, setEventDescription] = useState('');
  const [activeEventDetail, setActiveEventDetail] = useState<CalendarEvent | null>(null);

  // Query events
  const { data: events = [] } = useQuery({
    queryKey: ['calendar', role || 'all'],
    queryFn: () => fetchCalendarEvents(role ? { role } : undefined),
  });

  // Create Event Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const startAt = new Date(`${eventDateStr}T${startTime}:00`).toISOString();
      const endAt = new Date(`${eventDateStr}T${endTime}:00`).toISOString();
      return createCalendarEvent({
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        event_type: eventType,
        start_at: startAt,
        end_at: endAt,
        role: role || 'developer',
      });
    },
    onSuccess: () => {
      setIsAddOpen(false);
      setEventTitle('');
      setEventDescription('');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Event added to schedule!', 'success');
    },
    onError: () => {
      showToast('Could not create event', 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteCalendarEvent(id),
    onSuccess: () => {
      setActiveEventDetail(null);
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Event removed', 'info');
    },
  });

  // Month Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekdayShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Map events to day numbers in current month
  const eventsByDay: { [day: number]: CalendarEvent[] } = {};
  events.forEach((ev) => {
    const d = new Date(ev.start_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push(ev);
    }
  });

  // Today's events
  const todayEvents = events.filter((ev) => {
    const d = new Date(ev.start_at);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  return (
    <>
      {/* ─── Compact Mini Calendar Card on Dashboard ─────────────────────────── */}
      <Card3D
        maxTilt={5}
        depth={30}
        variant="default"
        className="p-4 sm:p-5 border border-border-base hover:border-solar-500/40 transition-all shadow-card backdrop-blur-md"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-base">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-solar-500/20 to-orange-500/10 text-solar-500 border border-solar-500/25 shadow-sm">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                My Schedule
              </h3>
              <p className="text-3xs text-text-muted">
                Click anywhere to open full screen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors active:translate-y-[1px]"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-2xs font-semibold text-text-primary px-1">
              {monthNames[month].slice(0, 3)} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors active:translate-y-[1px]"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(true)}
              className="ml-1 p-1.5 rounded-lg bg-solar-500/10 text-solar-500 hover:bg-solar-500/20 border border-solar-500/25 transition-all active:translate-y-[1px]"
              title="Open Full Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini Grid (Clickable to open full screen) */}
        <div
          onClick={() => setIsFullScreen(true)}
          className="mt-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsFullScreen(true);
          }}
          title="Click to view full calendar"
        >
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekdayShort.map((day) => (
              <span key={day} className="text-3xs font-semibold text-text-faint">
                {day}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-6" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const hasEvents = !!eventsByDay[day];

              return (
                <div
                  key={day}
                  className={`h-6 rounded-md flex flex-col items-center justify-center text-3xs font-medium relative transition-all duration-150 active:translate-y-[1px] ${
                    isToday
                      ? 'bg-gradient-to-br from-solar-400 to-solar-600 text-stone-950 font-bold shadow-glow-solar ring-2 ring-solar-400/40 translate-y-[1px]'
                      : 'text-text-secondary hover:bg-amber-500/15 hover:text-amber-300'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvents && !isToday && (
                    <span className="w-1 h-1 rounded-full bg-solar-500 absolute bottom-0.5 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's upcoming item preview */}
        <div className="mt-3.5 pt-3 border-t border-border-base flex items-center justify-between text-2xs">
          <div className="flex items-center gap-1.5 text-text-muted truncate max-w-[200px]">
            <Clock className="w-3 h-3 text-solar-500 shrink-0" />
            {todayEvents.length > 0 ? (
              <span className="truncate text-text-primary font-medium">
                {new Date(todayEvents[0].start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {todayEvents[0].title}
              </span>
            ) : (
              <span>No more events scheduled today</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="text-solar-500 hover:text-solar-400 font-bold text-3xs flex items-center gap-1 shrink-0 ml-2 hover:underline"
          >
            <span>Full Screen</span>
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </Card3D>

      {/* ─── FULL-SCREEN CALENDAR MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title=""
        size="fullscreen"
      >
        <div className="flex flex-col h-full space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-base shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-solar-500/15 border border-solar-500/35 flex items-center justify-center text-solar-500 shadow-glow-solar">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-text-primary">
                    Calendar &amp; Schedule
                  </h2>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  View scheduled sessions, milestones, and deadlines across your projects.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Month Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-bg-elevated border border-border-base">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors active:translate-y-[1px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-text-primary px-3">
                  {monthNames[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors active:translate-y-[1px]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Today Button */}
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base transition-colors active:translate-y-[1px]"
              >
                Today
              </button>

              {/* View Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-bg-elevated border border-border-base text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all active:translate-y-[1px] ${
                    viewMode === 'month'
                      ? 'bg-solar-500 text-white shadow-glow-solar translate-y-[1px]'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('agenda')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all active:translate-y-[1px] ${
                    viewMode === 'agenda'
                      ? 'bg-solar-500 text-white shadow-glow-solar translate-y-[1px]'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Agenda List
                </button>
              </div>

              {/* Add Event Button */}
              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="bg-solar-500 hover:bg-solar-600 text-white font-bold h-8 px-3"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Event
              </Button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent hover:border-border-base transition-colors ml-1 active:translate-y-[1px]"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Screen Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {viewMode === 'month' ? (
              <div className="h-full flex flex-col border border-border-base rounded-2xl overflow-hidden bg-bg-surface">
                {/* 7 Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-border-base bg-bg-elevated text-center py-2.5">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                    (d) => (
                      <span
                        key={d}
                        className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                      >
                        {d.slice(0, 3)}
                      </span>
                    )
                  )}
                </div>

                {/* Month Grid Cells */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-border-base">
                  {/* Empty Offset Days */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`fs-empty-${idx}`} className="bg-bg-base/30 p-2 min-h-[90px]" />
                  ))}

                  {/* Day Cells */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const isToday =
                      day === today.getDate() &&
                      month === today.getMonth() &&
                      year === today.getFullYear();
                    const dayEvents = eventsByDay[day] || [];

                    return (
                      <div
                        key={`fs-day-${day}`}
                        className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                          isToday ? 'bg-solar-500/5' : 'bg-bg-surface hover:bg-bg-elevated/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                              isToday
                                ? 'bg-solar-500 text-white shadow-glow-solar'
                                : 'text-text-primary'
                            }`}
                          >
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-3xs font-mono text-solar-500 font-bold">
                              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                            </span>
                          )}
                        </div>

                        {/* Event Pills */}
                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                          {dayEvents.map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => setActiveEventDetail(ev)}
                              className="w-full text-left p-1 rounded-md bg-solar-500/15 border border-solar-500/30 text-solar-400 hover:bg-solar-500/25 transition-colors truncate block"
                            >
                              <div className="text-3xs font-bold truncate">
                                {new Date(ev.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                                {ev.title}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Agenda List View */
              <div className="max-w-4xl mx-auto space-y-3 py-2">
                {events.length === 0 ? (
                  <div className="p-12 text-center text-text-muted space-y-3">
                    <CalendarDays className="w-10 h-10 mx-auto text-text-faint" />
                    <p className="text-sm">No scheduled events found.</p>
                    <Button size="sm" onClick={() => setIsAddOpen(true)}>
                      Create First Event
                    </Button>
                  </div>
                ) : (
                  events.map((ev) => {
                    const start = new Date(ev.start_at);
                    const end = new Date(ev.end_at);
                    return (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl bg-bg-surface border border-border-base hover:border-solar-500/40 transition-all flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-3xs uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/25">
                              {ev.event_type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {start.toLocaleDateString()} • {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-text-primary">{ev.title}</h4>
                          {ev.description && (
                            <p className="text-xs text-text-muted">{ev.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(ev.id)}
                            className="p-2 text-text-muted hover:text-red-400 hover:bg-bg-elevated rounded-xl transition-colors"
                            title="Remove event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ─── Add Event Sub-Modal ────────────────────────────────────────── */}
      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add New Event"
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!eventTitle.trim()) return;
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Event Title
              </label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., 'Milestone 2 Review' or 'Final Exam Prep'..."
                className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Event Category
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
                >
                  <option value="study_block">Study / Build Session</option>
                  <option value="milestone_target">Milestone Deadline</option>
                  <option value="lecture">Meeting / Review</option>
                  <option value="assignment_due">Deliverable Due</option>
                  <option value="exam">Exam / Release</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={eventDateStr}
                  onChange={(e) => setEventDateStr(e.target.value)}
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
                >
                </input>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Description (optional)
              </label>
              <textarea
                rows={2}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Notes or agenda for this session..."
                className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-base">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!eventTitle.trim() || createMutation.isPending}
                className="bg-solar-500 hover:bg-solar-600 text-white font-bold"
              >
                Save Event
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Event Detail Sub-Modal ─────────────────────────────────────── */}
      {activeEventDetail && (
        <Modal
          isOpen={!!activeEventDetail}
          onClose={() => setActiveEventDetail(null)}
          title="Event Details"
          size="sm"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-3xs uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/25">
                {activeEventDetail.event_type.replace('_', ' ')}
              </span>
              <span className="text-xs text-text-muted font-mono">
                {new Date(activeEventDetail.start_at).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-base font-bold text-text-primary">
              {activeEventDetail.title}
            </h3>

            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-solar-500" />
              {new Date(activeEventDetail.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(activeEventDetail.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            {activeEventDetail.description && (
              <div className="p-3 rounded-xl bg-bg-elevated border border-border-base text-xs text-text-secondary">
                {activeEventDetail.description}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border-base">
              <button
                type="button"
                onClick={() => deleteMutation.mutate(activeEventDetail.id)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => setActiveEventDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export default SmallCalendar;
