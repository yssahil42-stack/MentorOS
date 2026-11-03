import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink,
  Download,
} from 'lucide-react';
import { downloadICSFile, getGoogleCalendarUrl } from '../../utils/icsExport';
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

function getEventTypeBadge(type: CalendarEventType) {
  switch (type) {
    case 'exam':
    case 'release':
    case 'delivery_deadline':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/30',
        label: type.replace(/_/g, ' '),
      };
    case 'assignment_deadline':
    case 'application_deadline':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: type.replace(/_/g, ' '),
      };
    case 'interview':
    case 'client_review':
    case 'meeting':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: type.replace(/_/g, ' '),
      };
    case 'study_block':
    case 'build_block':
    case 'work_block':
    case 'prep_session':
      return {
        bg: 'bg-orange-500/15',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/30',
        label: type.replace(/_/g, ' '),
      };
    case 'lecture':
      return {
        bg: 'bg-indigo-500/15',
        text: 'text-indigo-400',
        border: 'border-indigo-500/30',
        label: 'lecture',
      };
    default:
      return {
        bg: 'bg-solar-500/15',
        text: 'text-solar-400',
        border: 'border-solar-500/30',
        label: type.replace(/_/g, ' '),
      };
  }
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
    queryFn: ({ signal }) => fetchCalendarEvents(role ? { role } : undefined, signal),
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
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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

  // Selected day's events for active agenda list
  const activeSelectedDate = selectedDay || today;
  const selectedDayEvents = events
    .filter((ev) => {
      const d = new Date(ev.start_at);
      return (
        d.getFullYear() === activeSelectedDate.getFullYear() &&
        d.getMonth() === activeSelectedDate.getMonth() &&
        d.getDate() === activeSelectedDate.getDate()
      );
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  return (
    <>
      {/* ─── Compact Mini Calendar Card on Dashboard ─────────────────────────── */}
      <Card3D
        maxTilt={3}
        depth={25}
        variant="secondary"
        className="p-4 sm:p-5 border border-border-base hover:border-solar-500/40 transition-all shadow-card backdrop-blur-md select-none flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-base">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-solar-500/20 to-orange-500/10 text-solar-500 border border-solar-500/25 shadow-sm">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text-primary">My Schedule</h3>
              <p className="text-3xs text-text-muted">
                {selectedDay ? 'Date selected' : 'Click a date to view agenda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors active:translate-y-[1px]"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-2xs font-semibold text-text-primary px-1 cursor-default">
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

        {/* Mini Grid (Click date to view Agenda) */}
        <div className="mt-3">
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
              const isSelected = selectedDay
                ? day === selectedDay.getDate() &&
                  month === selectedDay.getMonth() &&
                  year === selectedDay.getFullYear()
                : false;
              const hasEvents = !!eventsByDay[day];

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const picked = new Date(year, month, day);
                    setSelectedDay(isSelected ? null : picked);
                  }}
                  className={`h-7 rounded-lg flex flex-col items-center justify-center text-3xs font-medium relative transition-all duration-150 active:translate-y-[1px] cursor-pointer ${
                    isSelected
                      ? 'bg-solar-500 text-stone-950 font-bold ring-2 ring-solar-400 shadow-glow-solar scale-105 z-10'
                      : isToday
                        ? 'bg-gradient-to-br from-solar-400/30 to-solar-600/20 text-solar-400 font-bold border border-solar-500/40'
                        : 'text-text-secondary hover:bg-amber-500/15 hover:text-amber-300'
                  }`}
                  title={`${monthNames[month]} ${day}${hasEvents ? ` (${eventsByDay[day].length} events)` : ''}`}
                >
                  <span>{day}</span>
                  {hasEvents && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-solar-500 absolute bottom-0.5 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Agenda List View Inside the Calendar Card ─── */}
        <div className="mt-3.5 pt-3 border-t border-border-base flex-1 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-solar-500" />
              <h4 className="text-xs font-bold text-text-primary">
                {selectedDay
                  ? `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()} Agenda`
                  : "Today's Agenda"}
              </h4>
              <span className="text-3xs font-mono font-bold px-1.5 py-0.2 rounded-full bg-solar-500/15 text-solar-500 border border-solar-500/25">
                {selectedDayEvents.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-3xs text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded transition-colors"
                >
                  Show Today
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const target = selectedDay || today;
                  const y = target.getFullYear();
                  const m = String(target.getMonth() + 1).padStart(2, '0');
                  const d = String(target.getDate()).padStart(2, '0');
                  setEventDateStr(`${y}-${m}-${d}`);
                  setIsAddOpen(true);
                }}
                className="text-3xs font-bold text-solar-500 hover:text-solar-400 bg-solar-500/10 hover:bg-solar-500/20 px-2 py-0.5 rounded-lg border border-solar-500/25 flex items-center gap-1 transition-all"
                title="Add Event"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Agenda List Items Container */}
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 no-scrollbar flex-1">
            {selectedDayEvents.length === 0 ? (
              <div className="py-3 px-2 rounded-xl bg-bg-surface/60 border border-dashed border-border-base text-center">
                <p className="text-2xs text-text-muted">
                  {selectedDay
                    ? `No events scheduled for ${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}.`
                    : 'No events scheduled for today.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedDay || today;
                    const y = target.getFullYear();
                    const m = String(target.getMonth() + 1).padStart(2, '0');
                    const d = String(target.getDate()).padStart(2, '0');
                    setEventDateStr(`${y}-${m}-${d}`);
                    setIsAddOpen(true);
                  }}
                  className="mt-1 text-3xs font-semibold text-solar-500 hover:underline block mx-auto"
                >
                  + Add an event for this date
                </button>
              </div>
            ) : (
              selectedDayEvents.map((ev) => {
                const badge = getEventTypeBadge(ev.event_type);
                const start = new Date(ev.start_at);
                const end = new Date(ev.end_at);
                return (
                  <div
                    key={ev.id}
                    onClick={() => setActiveEventDetail(ev)}
                    className="p-2 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border-base hover:border-solar-500/35 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {start.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-text-primary truncate group-hover:text-solar-500 transition-colors mt-0.5">
                        {ev.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(ev.id);
                        }}
                        className="p-1 text-text-muted hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete event"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

              {/* Export ICS Button */}
              <button
                type="button"
                onClick={() => {
                  if (events.length === 0) {
                    showToast('No events to export', 'info');
                    return;
                  }
                  downloadICSFile(
                    events,
                    `${role || 'workspace'}-schedule.ics`,
                    `MentorOS ${role || 'Workspace'} Calendar`
                  );
                  showToast(`Exported ${events.length} events to .ics file!`, 'success');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base transition-colors flex items-center gap-1.5 active:translate-y-[1px]"
                title="Download .ics Calendar File"
              >
                <Download className="w-3.5 h-3.5 text-solar-500" />
                <span>Export (.ics)</span>
              </button>

              {/* Add Event Button */}
              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="bg-solar-500 hover:bg-solar-600 text-white font-bold h-8 px-3"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Event
              </Button>

              {/* Open Dedicated Calendar Page Link */}
              <Link
                to={`/app/${role || 'student'}/calendar`}
                onClick={() => setIsFullScreen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base transition-colors flex items-center gap-1.5"
                title="Open Dedicated Calendar Page"
              >
                <span>Full Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

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
              <div className="h-full flex flex-col lg:flex-row gap-4">
                {/* Left: Full Month Grid */}
                <div className="h-full flex-1 flex flex-col border border-border-base rounded-2xl overflow-x-auto bg-bg-surface">
                  <div className="min-w-[560px] sm:min-w-0 flex-1 flex flex-col">
                    {/* 7 Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-border-base bg-bg-elevated text-center py-2.5">
                      {[
                        'Sunday',
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                      ].map((d) => (
                        <span
                          key={d}
                          className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                        >
                          {d.slice(0, 3)}
                        </span>
                      ))}
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
                        const isSelected = selectedDay
                          ? day === selectedDay.getDate() &&
                            month === selectedDay.getMonth() &&
                            year === selectedDay.getFullYear()
                          : false;
                        const dayEvents = eventsByDay[day] || [];

                        return (
                          <div
                            key={`fs-day-${day}`}
                            onClick={() => setSelectedDay(new Date(year, month, day))}
                            className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-solar-500/15 ring-2 ring-solar-500 z-10'
                                : isToday
                                  ? 'bg-solar-500/5 hover:bg-solar-500/10'
                                  : 'bg-bg-surface hover:bg-bg-elevated/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                  isSelected
                                    ? 'bg-solar-500 text-stone-950 shadow-glow-solar'
                                    : isToday
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveEventDetail(ev);
                                  }}
                                  className="w-full text-left p-1 rounded-md bg-solar-500/15 border border-solar-500/30 text-solar-400 hover:bg-solar-500/25 transition-colors truncate block"
                                >
                                  <div className="text-3xs font-bold truncate">
                                    {new Date(ev.start_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}{' '}
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
                </div>

                {/* Right: Integrated Agenda List Panel Inside Calendar Modal */}
                <div className="w-full lg:w-80 shrink-0 border border-border-base rounded-2xl bg-bg-elevated p-4 flex flex-col space-y-3 overflow-y-auto shadow-sm">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border-base shrink-0">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-solar-500" />
                        <span>
                          {selectedDay
                            ? `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()} Agenda`
                            : "Today's Agenda"}
                        </span>
                      </h4>
                      <p className="text-3xs text-text-muted mt-0.5">
                        {selectedDayEvents.length} scheduled{' '}
                        {selectedDayEvents.length === 1 ? 'event' : 'events'}
                      </p>
                    </div>

                    <Button
                      size="xs"
                      onClick={() => {
                        const target = selectedDay || today;
                        const y = target.getFullYear();
                        const m = String(target.getMonth() + 1).padStart(2, '0');
                        const d = String(target.getDate()).padStart(2, '0');
                        setEventDateStr(`${y}-${m}-${d}`);
                        setIsAddOpen(true);
                      }}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Day Agenda List Items */}
                  <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                    {selectedDayEvents.length === 0 ? (
                      <div className="py-8 px-3 text-center space-y-2.5 rounded-xl border border-dashed border-border-base bg-bg-surface/50">
                        <CalendarDays className="w-8 h-8 text-text-faint mx-auto" />
                        <p className="text-xs text-text-muted">
                          {selectedDay
                            ? `No events on ${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}`
                            : 'No events scheduled for today.'}
                        </p>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            const target = selectedDay || today;
                            const y = target.getFullYear();
                            const m = String(target.getMonth() + 1).padStart(2, '0');
                            const d = String(target.getDate()).padStart(2, '0');
                            setEventDateStr(`${y}-${m}-${d}`);
                            setIsAddOpen(true);
                          }}
                        >
                          + New Event
                        </Button>
                      </div>
                    ) : (
                      selectedDayEvents.map((ev) => {
                        const badge = getEventTypeBadge(ev.event_type);
                        const start = new Date(ev.start_at);
                        const end = new Date(ev.end_at);
                        return (
                          <div
                            key={ev.id}
                            className="p-3 rounded-xl bg-bg-surface border border-border-base hover:border-solar-500/40 transition-all flex flex-col space-y-1.5 group shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} border ${badge.border}`}
                              >
                                {badge.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(ev.id)}
                                className="p-1 text-text-muted hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h5 className="text-xs font-bold text-text-primary leading-snug">
                              {ev.title}
                            </h5>
                            <span className="text-3xs text-text-muted font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-solar-500" />
                              {start.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {ev.description && (
                              <p className="text-3xs text-text-muted line-clamp-2 mt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
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
                              {start.toLocaleDateString()} •{' '}
                              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                              - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={eventDateStr}
                  onChange={(e) => setEventDateStr(e.target.value)}
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-solar-500"
                ></input>
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

            <h3 className="text-base font-bold text-text-primary">{activeEventDetail.title}</h3>

            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-solar-500" />
              {new Date(activeEventDetail.start_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {new Date(activeEventDetail.end_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {activeEventDetail.description && (
              <div className="p-3 rounded-xl bg-bg-elevated border border-border-base text-xs text-text-secondary">
                {activeEventDetail.description}
              </div>
            )}

            {/* Calendar Export & Sync Options */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={getGoogleCalendarUrl(activeEventDetail)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 rounded-xl bg-solar-500/10 hover:bg-solar-500/20 text-solar-500 border border-solar-500/25 text-2xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Add to Google Calendar"
              >
                <span>Add to Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  downloadICSFile(
                    [activeEventDetail],
                    `${activeEventDetail.title.slice(0, 20)}.ics`,
                    activeEventDetail.title
                  );
                  showToast('Downloaded .ics event file!', 'success');
                }}
                className="py-1.5 px-3 rounded-xl bg-bg-elevated hover:bg-bg-surface text-text-secondary hover:text-text-primary border border-border-base text-2xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download single .ics"
              >
                <Download className="w-3 h-3 text-solar-500" />
                <span>Export .ics</span>
              </button>
            </div>

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
