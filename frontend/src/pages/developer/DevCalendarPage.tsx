import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Flag,
  Code2,
  Rocket,
  Download,
} from 'lucide-react';
import { downloadICSFile } from '../../utils/icsExport';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from '../../services/calendarService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { CalendarEvent, CalendarEventType, CalendarView } from '../../types/calendar';

export default function DevCalendarPage() {
  const { openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('build_block');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', 'developer'],
    queryFn: () => fetchCalendarEvents({ role: 'developer' }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const start = new Date(`${startDate}T${startTime}:00`).toISOString();
      const end = new Date(`${startDate}T${endTime}:00`).toISOString();
      return createCalendarEvent({
        title,
        event_type: eventType,
        start_at: start,
        end_at: end,
        role: 'developer',
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Event scheduled on sprint calendar!', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteCalendarEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      showToast('Event removed', 'info');
    },
  });

  const getEventBadge = (type: CalendarEventType) => {
    switch (type) {
      case 'build_block':
        return (
          <Badge variant="info" size="sm">
            Build Block
          </Badge>
        );
      case 'milestone_target':
        return (
          <Badge variant="warning" size="sm">
            Milestone Target
          </Badge>
        );
      case 'release':
        return (
          <Badge variant="primary" size="sm">
            Release Gate
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Meeting
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  // Days in month calculation for simple month view grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-purple-400">
              SCHEDULE &amp; RELEASES
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Sprint Calendar
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            Track milestone deadlines, scheduled deep-work build blocks, and release windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (events.length === 0) {
                showToast('No sprint events to export', 'info');
                return;
              }
              downloadICSFile(
                events,
                'dev-sprint-calendar.ics',
                'MentorOS Developer Sprint Calendar'
              );
              showToast(`Exported ${events.length} sprint events to .ics file!`, 'success');
            }}
            icon={<Download className="w-4 h-4 text-purple-400" />}
          >
            Export (.ics)
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="!bg-purple-600 hover:!bg-purple-700 text-white"
            onClick={() => {
              setStartDate(new Date().toISOString().split('T')[0]);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Schedule Block
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-surface border border-border-base">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-text-primary min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-bg-base p-1 rounded-xl border border-border-base text-xs">
          {(['month', 'agenda'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                view === v
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month View Grid */}
      {view === 'month' ? (
        <Card className="p-4 border border-border-base overflow-hidden">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-faint pb-2 border-b border-border-base">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Blank slots for previous month offset */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[85px] p-1.5 rounded-xl bg-bg-base/20 border border-transparent"
              />
            ))}

            {/* Month days */}
            {days.map((d) => {
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.start_at.startsWith(dayStr));
              const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

              return (
                <div
                  key={d}
                  className={`min-h-[85px] p-1.5 rounded-xl border transition-colors flex flex-col justify-between ${
                    isToday
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-bg-surface/50 border-border-base/50 hover:border-border-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday ? 'text-purple-400' : 'text-text-muted'
                      }`}
                    >
                      {d}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] font-semibold text-text-primary truncate px-1.5 py-0.5 rounded bg-bg-elevated border border-border-base"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-text-faint pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* Agenda View */
        <div className="space-y-3">
          {events.map((e) => (
            <Card
              key={e.id}
              className="p-4 border border-border-base hover:border-border-hover transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-bg-elevated border border-border-base text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-text-primary truncate">{e.title}</h3>
                    {getEventBadge(e.event_type)}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(e.start_at).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(e.end_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteMutation.mutate(e.id)}
                className="p-2 text-text-faint hover:text-danger rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Remove event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Calendar Event"
        description="Book a dedicated build block, milestone target, or release gate"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Work: AI Proposal Pipeline Integration"
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as CalendarEventType)}
              className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              <option value="build_block">Deep Work Build Block</option>
              <option value="milestone_target">Milestone Target</option>
              <option value="release">Release Window</option>
              <option value="meeting">Architecture Sync / Meeting</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border-base">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-purple-600 hover:!bg-purple-700 font-semibold"
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Event'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
