import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sunrise,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Check,
  Plus,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { DailyStandupData } from '../../types/dashboard';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface DailyStandupWidgetProps {
  role?: string;
  standupData?: DailyStandupData;
}

export function DailyStandupWidget({ role = 'student', standupData }: DailyStandupWidgetProps) {
  const { openCaptureModal } = useWorkspace();
  const [isExpanded, setIsExpanded] = useState(false);

  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const yesterdayItems = standupData?.yesterday_completed || [];
  const scheduledItems = standupData?.today_scheduled || [];
  const tasksDueToday = standupData?.tasks_due_today || [];
  const nextMilestone = standupData?.next_milestone;

  const totalTodayItems = scheduledItems.length + tasksDueToday.length;
  const isYesterdayWins = yesterdayItems.some((item) => item.is_yesterday);

  // Format event time (e.g. 10:00 AM - 11:30 AM)
  const formatEventTime = (startAt: string, endAt: string) => {
    try {
      const s = new Date(startAt);
      const e = new Date(endAt);
      const startTime = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${startTime} – ${endTime}`;
    } catch {
      return 'Scheduled Block';
    }
  };

  const roleLabel =
    role === 'developer'
      ? 'Daily Standup'
      : role === 'freelancer'
        ? 'Task Statistics'
        : role === 'job_seeker'
          ? 'Career Briefing'
          : 'Daily Focus';

  return (
    <div className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 relative overflow-hidden backdrop-blur-xl">
      {/* ─── Subtle Top Accent Sheen ─────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-solar-500/40 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* ─── Header Banner ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-base/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar-500/15 to-solar-500/5 border border-solar-500/25 flex items-center justify-center text-solar-500 shadow-2xs shrink-0">
            <Sunrise className="w-5 h-5 text-solar-500" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                {roleLabel}
              </h2>
              <span className="text-[11px] font-semibold text-text-secondary bg-slate-100 dark:bg-bg-elevated px-2.5 py-0.5 rounded-full border border-border-subtle/80 uppercase tracking-wide">
                {todayDateStr}
              </span>
            </div>
            <p className="text-xs text-text-muted truncate mt-0.5 font-normal">
              Recent progress, today&apos;s agenda, and upcoming milestone.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-slate-100 dark:hover:bg-bg-elevated border border-transparent hover:border-border-subtle/80 transition-all shrink-0 cursor-pointer"
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── 3 Pillar Columns ──────────────────────────────────────── */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* ─── Column 1: Completed Yesterday / Recent Wins ────────── */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50/80 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] hover:border-emerald-500/30 flex flex-col justify-between space-y-3.5 transition-all shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-base/70">
                <span className="text-xs uppercase font-bold tracking-wider text-text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                  {isYesterdayWins ? 'Completed Yesterday' : 'Recent Completed'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {yesterdayItems.length} finished
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {yesterdayItems.length === 0 ? (
                  <div className="py-7 text-center flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-bg-elevated flex items-center justify-center text-text-faint mb-2">
                      <Check className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-text-muted font-medium">No completed items recorded.</p>
                  </div>
                ) : (
                  yesterdayItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs flex items-start gap-2.5 group hover:border-emerald-500/30 transition-all"
                    >
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-secondary line-through opacity-75 truncate leading-snug">
                          {item.title}
                        </p>
                        {item.project_title && (
                          <span className="inline-block text-[10px] font-medium text-text-muted mt-1 bg-slate-100 dark:bg-bg-elevated px-2 py-0.5 rounded-md truncate max-w-full">
                            {item.project_title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border-base/70 text-xs text-text-muted flex items-center justify-between">
              <span>{yesterdayItems.length} logged</span>
              <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Summary complete
              </span>
            </div>
          </div>

          {/* ─── Column 2: Scheduled Today (From Calendar) ─────────── */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50/80 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] hover:border-solar-500/30 flex flex-col justify-between space-y-3.5 transition-all shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-base/70">
                <span className="text-xs uppercase font-bold tracking-wider text-text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-solar-500/10 text-solar-600 dark:text-solar-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-solar-500" />
                  </span>
                  Scheduled Today
                </span>
                <span className="text-[11px] font-semibold text-solar-700 dark:text-solar-400 bg-solar-500/10 px-2.5 py-0.5 rounded-full border border-solar-500/20">
                  {totalTodayItems} on agenda
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {totalTodayItems === 0 ? (
                  <div className="py-7 text-center flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-bg-elevated flex items-center justify-center text-text-faint mb-2">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-text-muted font-medium">No agenda items scheduled for today.</p>
                  </div>
                ) : (
                  <>
                    {scheduledItems.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs space-y-1.5 hover:border-solar-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-text-primary truncate">{event.title}</p>
                          <Badge
                            variant="neutral"
                            size="sm"
                            className="text-[10px] uppercase shrink-0"
                          >
                            {event.event_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-solar-600 dark:text-solar-400">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatEventTime(event.start_at, event.end_at)}</span>
                        </div>
                      </div>
                    ))}

                    {tasksDueToday.map((task) => (
                      <div
                        key={`due-${task.id}`}
                        className="p-3 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs flex items-center justify-between gap-2.5 hover:border-amber-500/30 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">{task.title}</p>
                          {task.project_title && (
                            <span className="inline-block text-[10px] font-medium text-text-muted mt-1 bg-slate-100 dark:bg-bg-elevated px-2 py-0.5 rounded-md truncate max-w-full">
                              {task.project_title}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0 border border-amber-500/20">
                          Due Today
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border-base/70 flex items-center justify-between text-xs">
              <a
                href="#my-schedule"
                onClick={(e) => {
                  const el = document.getElementById('my-schedule');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group inline-flex items-center gap-1.5 font-semibold text-solar-600 dark:text-solar-400 hover:text-solar-700 transition-colors cursor-pointer"
              >
                <span>View in My Schedule</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* ─── Column 3: Next Upcoming Milestone ─────────────────── */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50/80 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] hover:border-amber-500/30 flex flex-col justify-between space-y-3.5 transition-all shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-base/70">
                <span className="text-xs uppercase font-bold tracking-wider text-text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  Upcoming Milestone
                </span>
                {nextMilestone &&
                  nextMilestone.days_remaining !== null &&
                  nextMilestone.days_remaining !== undefined && (
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        nextMilestone.days_remaining <= 0
                          ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : nextMilestone.days_remaining <= 3
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/20'
                      }`}
                    >
                      {nextMilestone.days_remaining === 0
                        ? 'Due today'
                        : nextMilestone.days_remaining < 0
                          ? `${Math.abs(nextMilestone.days_remaining)}d overdue`
                          : `${nextMilestone.days_remaining}d remaining`}
                    </span>
                  )}
              </div>

              <div className="mt-3 space-y-2">
                {nextMilestone ? (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs space-y-2.5 hover:border-amber-500/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-text-primary leading-snug">
                          {nextMilestone.title}
                        </h4>
                        <Badge
                          variant={
                            nextMilestone.status === 'completed'
                              ? 'success'
                              : nextMilestone.status === 'in_progress'
                                ? 'warning'
                                : 'neutral'
                          }
                          size="sm"
                          className="shrink-0 text-[10px]"
                        >
                          {nextMilestone.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {nextMilestone.project_title && (
                        <p className="text-[11px] text-text-muted truncate">
                          Roadmap: {nextMilestone.project_title}
                        </p>
                      )}
                    </div>

                    {nextMilestone.target_date && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-2 border-t border-border-base/60">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          Deadline: {new Date(nextMilestone.target_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-7 text-center flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-bg-elevated flex items-center justify-center text-text-faint">
                      <Target className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-text-muted font-medium">No upcoming milestones.</p>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => openCaptureModal('manual')}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      New Milestone
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border-base/70 flex items-center justify-between text-xs">
              <Link
                to={
                  role === 'student'
                    ? '/app/student/projects'
                    : `/app/${role === 'job_seeker' ? 'job-seeker' : role}/projects`
                }
                className="group inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
              >
                <span>View milestones</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
