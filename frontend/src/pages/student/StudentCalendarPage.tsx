import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Trash2,
  List,
  Grid,
  Download,
  ExternalLink,
} from 'lucide-react';
import { downloadICSFile, getGoogleCalendarUrl } from '../../utils/icsExport';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from '../../services/calendarService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { CalendarEvent, CalendarEventType } from '../../types/calendar';

export default function StudentCalendarPage() {
  const { openAIDrawer, openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('lecture');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [description, setDescription] = useState('');

  // Fetch strictly role: 'student' events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', 'student'],
    queryFn: () => fetchCalendarEvents({ role: 'student' }),
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const startAt = new Date(`${eventDate}T${startTime}:00`).toISOString();
      const endAt = new Date(`${eventDate}T${endTime}:00`).toISOString();
      return createCalendarEvent({
        title,
        description,
        event_type: eventType,
        start_at: startAt,
        end_at: endAt,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Academic event scheduled! 📅', 'success');
    },
    onError: () => {
      showToast('Failed to schedule event', 'error');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => deleteCalendarEvent(id),
    onSuccess: () => {
      setSelectedEvent(null);
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Event removed', 'info');
    },
  });

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const today = () => {
    setCurrentDate(new Date());
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

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calendar matrix calculation
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    days.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, isCurrentMonth: true, dateStr });
  }
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
    const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
    days.push({
      day: i,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    });
  }

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.event_type === filterType;
  });

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'assignment_deadline':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'lecture':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'study_block':
        return 'bg-student-500/15 text-student-300 border-student-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getEventBadgeDot = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-500';
      case 'assignment_deadline':
        return 'bg-amber-500';
      case 'lecture':
        return 'bg-indigo-500';
      case 'study_block':
        return 'bg-student-500';
      default:
        return 'bg-slate-500';
    }
  };

  const upcomingExams = events.filter((e) => e.event_type === 'exam');
  const assignmentDeadlines = events.filter((e) => e.event_type === 'assignment_deadline');

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-student-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-student-500/15 border border-student-500/25 text-student-400">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-student-500/10 text-student-300 border border-student-500/20">
                ACADEMIC TIMETABLE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Student Schedule &amp; Timetable
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Coordinate class lectures, project deadlines, exam days, and AI-scheduled study
              revision blocks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (events.length === 0) {
                  showToast('No events to export', 'info');
                  return;
                }
                downloadICSFile(events, 'student-timetable.ics', 'MentorOS Student Schedule');
                showToast(`Exported ${events.length} timetable events to .ics file!`, 'success');
              }}
              className="border-border-base text-xs flex items-center gap-1.5"
              icon={<Download className="w-3.5 h-3.5 text-solar-500" />}
            >
              Export (.ics)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="!bg-solar-500 hover:!bg-solar-600 shadow-glow-solar"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Event
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Upcoming Exams</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {upcomingExams.length}
          </div>
          <p className="text-2xs text-red-400 mt-1">Requires active revision</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Assignment Deadlines</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {assignmentDeadlines.length}
          </div>
          <p className="text-2xs text-amber-400 mt-1">Scheduled on calendar</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-student-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Scheduled Study Blocks</span>
            <Clock className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {events.filter((e) => e.event_type === 'study_block').length}
          </div>
          <p className="text-2xs text-student-400 mt-1">Pomodoro sessions</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Weekly Lectures</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {events.filter((e) => e.event_type === 'lecture').length}
          </div>
          <p className="text-2xs text-indigo-400 mt-1">Enrolled modules</p>
        </Card>
      </div>

      {/* Controls Bar: Month Nav + Filter Types + View Mode */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-base">
        {/* Month Navigation */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-border-base bg-bg-base text-text-muted hover:text-text-primary hover:border-student-500/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-border-base bg-bg-base text-text-muted hover:text-text-primary transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-border-base bg-bg-base text-text-muted hover:text-text-primary hover:border-student-500/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-extrabold text-text-primary">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'lecture', label: 'Lectures' },
            { id: 'exam', label: 'Exams' },
            { id: 'assignment_deadline', label: 'Deadlines' },
            { id: 'study_block', label: 'Study Blocks' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === type.id
                  ? 'bg-student-500/20 text-student-300 border border-student-500/30'
                  : 'bg-bg-base text-text-muted hover:text-text-primary border border-border-base'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-bg-base p-1 rounded-xl border border-border-base">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'month'
                ? 'bg-student-500/20 text-student-300'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Month
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'agenda'
                ? 'bg-student-500/20 text-student-300'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Agenda
          </button>
        </div>
      </div>

      {/* Main Calendar Area */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : viewMode === 'month' ? (
        <Card className="p-4 overflow-hidden border border-border-base">
          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center font-bold text-xs text-text-muted pb-3 border-b border-border-base">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-[110px] gap-px bg-border-base/50 mt-1 rounded-lg overflow-hidden border border-border-base/50">
            {days.map((item, idx) => {
              const dayEvents = filteredEvents.filter((e) => e.start_at.startsWith(item.dateStr));
              const isToday = new Date().toISOString().split('T')[0] === item.dateStr;

              return (
                <div
                  key={idx}
                  className={`bg-bg-surface p-2 flex flex-col justify-between transition-colors overflow-hidden ${
                    !item.isCurrentMonth ? 'opacity-35 bg-bg-base/50' : 'hover:bg-bg-elevated'
                  } ${isToday ? 'ring-1 ring-student-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-student-500 text-black shadow-glow-solar'
                          : 'text-text-secondary'
                      }`}
                    >
                      {item.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-text-faint font-mono">
                        {dayEvents.length} ev
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[70px] pr-0.5">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left text-2xs px-1.5 py-0.5 rounded border truncate flex items-center gap-1 font-medium transition-transform hover:scale-[1.02] ${getEventBadgeClass(
                          ev.event_type
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getEventBadgeDot(
                            ev.event_type
                          )}`}
                        />
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* Agenda View */
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary pb-3 border-b border-border-base">
            Upcoming Schedule &amp; Agenda ({filteredEvents.length} events)
          </h3>

          {filteredEvents.length === 0 ? (
            <p className="text-xs text-text-muted py-8 text-center">
              No events scheduled under this filter.
            </p>
          ) : (
            <div className="space-y-2.5">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-bg-surface border border-border-base hover:border-student-500/40 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getEventBadgeClass(
                        ev.event_type
                      )}`}
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-text-primary">{ev.title}</h4>
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded-md border capitalize ${getEventBadgeClass(
                            ev.event_type
                          )}`}
                        >
                          {ev.event_type.replace('_', ' ')}
                        </span>
                      </div>
                      {ev.description && (
                        <p className="text-xs text-text-muted mt-0.5">{ev.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-2xs text-text-faint mt-1.5">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-student-400" />
                          {new Date(ev.start_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ev.start_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(ev.end_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEventMutation.mutate(ev.id)}
                      className="text-text-muted hover:text-red-400 text-xs"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Academic Event / Lecture"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createEventMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CS-401 Lecture: Distributed Consensus"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              >
                <option value="lecture">Lecture / Class</option>
                <option value="exam">Exam / Midterm / Quiz</option>
                <option value="assignment_deadline">Assignment Deadline</option>
                <option value="study_block">Study / Revision Block</option>
                <option value="meeting">Lab / Study Group</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Description / Room / Course Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Room 304 Hall B. Bring laptop with Docker pre-configured."
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
              disabled={!title.trim() || createEventMutation.isPending}
            >
              {createEventMutation.isPending ? 'Scheduling...' : 'Save Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getEventBadgeClass(
                  selectedEvent.event_type
                )}`}
              >
                {selectedEvent.event_type.replace('_', ' ')}
              </span>
              <span className="text-2xs text-text-faint">Role: Student Workspace</span>
            </div>

            {selectedEvent.description && (
              <p className="text-xs text-text-secondary bg-bg-surface p-3 rounded-xl border border-border-base">
                {selectedEvent.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-bg-base p-3 rounded-xl border border-border-base">
              <div>
                <span className="text-text-muted block text-2xs">Date</span>
                <span className="font-semibold text-text-primary">
                  {new Date(selectedEvent.start_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-2xs">Time Range</span>
                <span className="font-semibold text-text-primary">
                  {new Date(selectedEvent.start_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(selectedEvent.end_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Calendar Export & Google Sync Options */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 rounded-xl bg-student-500/10 hover:bg-student-500/20 text-student-300 border border-student-500/25 text-2xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Add directly to Google Calendar"
              >
                <span>Add to Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  downloadICSFile(
                    [selectedEvent],
                    `${selectedEvent.title.slice(0, 20)}.ics`,
                    selectedEvent.title
                  );
                  showToast('Downloaded .ics event file!', 'success');
                }}
                className="py-1.5 px-3 rounded-xl bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base text-2xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download single .ics file"
              >
                <Download className="w-3 h-3 text-solar-500" />
                <span>Export .ics</span>
              </button>
            </div>

            <div className="pt-2 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Event
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
