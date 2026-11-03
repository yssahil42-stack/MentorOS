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
} from 'lucide-react';
import { Card3D } from '../ui/Card3D';
import { Badge, badgeVariants } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { DailyStandupData } from '../../types/dashboard';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface DailyStandupWidgetProps {
  role?: string;
  standupData?: DailyStandupData;
}

export function DailyStandupWidget({ role = 'student', standupData }: DailyStandupWidgetProps) {
  const { openCaptureModal } = useWorkspace();
  const [isExpanded, setIsExpanded] = useState(true);

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
        ? 'Daily Briefing'
        : role === 'job_seeker'
          ? 'Career Briefing'
          : 'Daily Focus';

  const calendarRoute = `/app/${role === 'job_seeker' ? 'job-seeker' : role}/calendar`;

  return (
    <Card3D
      maxTilt={2}
      depth={15}
      variant="glass"
      className="p-4 sm:p-5 border border-border-base bg-bg-surface/95 shadow-card backdrop-blur-md transition-all"
    >
      {/* ─── Header Banner ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-border-base/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-solar-500/10 border border-solar-500/20 text-solar-500 shadow-sm shrink-0">
            <Sunrise className="w-4 h-4 text-solar-500" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm md:text-base font-bold text-text-primary tracking-tight">
                {roleLabel}
              </h2>
              <Badge
                variant="neutral"
                size="sm"
                className="font-mono text-3xs uppercase tracking-wider"
              >
                {todayDateStr}
              </Badge>
            </div>
            <p className="text-2xs sm:text-xs text-text-muted truncate mt-0.5">
              Recent progress, today&apos;s agenda, and upcoming milestone.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors shrink-0"
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── 3 Pillar Columns ──────────────────────────────────────── */}
      {isExpanded && (
        <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
          {/* ─── Column 1: Completed Yesterday / Recent Wins ────────── */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/[0.03] border border-border-base hover:border-emerald-500/30 flex flex-col justify-between space-y-3 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border-base/60">
                <span className="text-3xs uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {isYesterdayWins ? 'Completed Yesterday' : 'Recent Completed'}
                </span>
                <span
                  className={badgeVariants({
                    variant: 'success',
                    size: 'xs',
                    className: 'font-mono font-semibold',
                  })}
                >
                  {yesterdayItems.length} finished
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {yesterdayItems.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-text-muted">No completed items recorded.</p>
                  </div>
                ) : (
                  yesterdayItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-bg-surface/90 border border-border-subtle text-xs flex items-start gap-2 group transition-all"
                    >
                      <span className="mt-0.5 p-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-primary line-through opacity-75 truncate">
                          {item.title}
                        </p>
                        {item.project_title && (
                          <span className="text-3xs font-mono text-emerald-600/90 dark:text-emerald-400/90 truncate block">
                            {item.project_title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border-base/60 text-3xs text-text-muted font-mono flex items-center justify-between">
              <span>{yesterdayItems.length} logged</span>
              <span className="font-medium text-text-secondary">Summary complete</span>
            </div>
          </div>

          {/* ─── Column 2: Scheduled Today (From Calendar) ─────────── */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-orange-500/[0.03] border border-border-base hover:border-orange-500/30 flex flex-col justify-between space-y-3 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border-base/60">
                <span className="text-3xs uppercase font-mono font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                  Scheduled Today
                </span>
                <span
                  className={badgeVariants({
                    variant: 'primary',
                    size: 'xs',
                    className: 'font-mono font-semibold',
                  })}
                >
                  {totalTodayItems} on agenda
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {totalTodayItems === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-text-muted">No agenda items scheduled for today.</p>
                  </div>
                ) : (
                  <>
                    {scheduledItems.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg bg-bg-surface/90 border border-border-subtle text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-text-primary truncate">{event.title}</p>
                          <Badge
                            variant="neutral"
                            size="sm"
                            className="text-3xs uppercase shrink-0"
                          >
                            {event.event_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-3xs font-mono text-orange-600 dark:text-orange-400">
                          <Clock className="w-3 h-3 text-orange-500 dark:text-orange-400 shrink-0" />
                          <span>{formatEventTime(event.start_at, event.end_at)}</span>
                        </div>
                      </div>
                    ))}

                    {tasksDueToday.map((task) => (
                      <div
                        key={`due-${task.id}`}
                        className="p-2 rounded-lg bg-bg-surface/90 border border-border-subtle text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{task.title}</p>
                          {task.project_title && (
                            <span className="text-3xs text-text-muted font-mono truncate block">
                              {task.project_title}
                            </span>
                          )}
                        </div>
                        <span className="text-3xs font-mono font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                          Due Today
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border-base/60 flex items-center justify-between text-3xs font-mono text-orange-600 dark:text-orange-400">
              <Link
                to={calendarRoute}
                className="hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View calendar</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* ─── Column 3: Next Upcoming Milestone ─────────────────── */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/[0.03] border border-border-base hover:border-amber-500/30 flex flex-col justify-between space-y-3 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border-base/60">
                <span className="text-3xs uppercase font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Upcoming Milestone
                </span>
                {nextMilestone &&
                  nextMilestone.days_remaining !== null &&
                  nextMilestone.days_remaining !== undefined && (
                    <span
                      className={badgeVariants({
                        variant:
                          nextMilestone.days_remaining <= 0
                            ? 'danger'
                            : nextMilestone.days_remaining <= 3
                              ? 'warning'
                              : 'info',
                        size: 'xs',
                        className: 'font-mono font-semibold',
                      })}
                    >
                      {nextMilestone.days_remaining === 0
                        ? 'Due today'
                        : nextMilestone.days_remaining < 0
                          ? `${Math.abs(nextMilestone.days_remaining)}d overdue`
                          : `${nextMilestone.days_remaining}d remaining`}
                    </span>
                  )}
              </div>

              <div className="mt-2.5">
                {nextMilestone ? (
                  <div className="p-3 rounded-lg bg-bg-surface/90 border border-border-subtle space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-text-primary">
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
                          className="shrink-0"
                        >
                          {nextMilestone.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {nextMilestone.project_title && (
                        <p className="text-3xs font-mono text-text-muted truncate">
                          Roadmap: {nextMilestone.project_title}
                        </p>
                      )}
                    </div>

                    {nextMilestone.target_date && (
                      <div className="flex items-center gap-1.5 text-3xs font-mono text-text-muted pt-1 border-t border-border-subtle/60">
                        <CalendarDays className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>
                          Deadline: {new Date(nextMilestone.target_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-xs text-text-muted">No upcoming milestones.</p>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => openCaptureModal('ai')}
                      icon={<Sparkles className="w-3 h-3 text-solar-500" />}
                    >
                      Generate Roadmap
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border-base/60 flex items-center justify-between text-3xs font-mono text-amber-600 dark:text-amber-400">
              <Link
                to={
                  role === 'student'
                    ? '/app/student/projects'
                    : `/app/${role === 'job_seeker' ? 'job-seeker' : role}/projects`
                }
                className="hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View milestones</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Card3D>
  );
}
