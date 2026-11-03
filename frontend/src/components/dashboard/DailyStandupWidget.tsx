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
      ? 'Developer Standup'
      : role === 'freelancer'
        ? 'Freelancer Standup'
        : role === 'job_seeker'
          ? 'Career Standup'
          : 'Study Standup';

  const calendarRoute = `/app/${role === 'job_seeker' ? 'job-seeker' : role}/calendar`;

  return (
    <Card3D
      maxTilt={2}
      depth={20}
      variant="glass"
      className="p-5 md:p-6 border border-border-base/90 bg-gradient-to-r from-bg-surface/95 via-bg-elevated/60 to-bg-surface/95 shadow-card backdrop-blur-xl transition-all"
    >
      {/* ─── Header Banner ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-border-base/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-solar-500/20 to-amber-500/10 border border-solar-500/30 text-solar-500 shadow-sm shrink-0">
            <Sunrise className="w-5 h-5 text-solar-500" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm md:text-base font-extrabold text-text-primary tracking-tight">
                {roleLabel} &amp; Focus Brief
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
              Yesterday&apos;s achievements • Today&apos;s calendar schedule • Next milestone
              deadline
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors shrink-0"
          title={isExpanded ? 'Collapse standup' : 'Expand standup'}
          aria-label={isExpanded ? 'Collapse standup' : 'Expand standup'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── 3 Pillar Columns ──────────────────────────────────────── */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* ─── Column 1: Completed Yesterday / Recent Wins ────────── */}
          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
                <span className="text-3xs uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isYesterdayWins ? 'Completed Yesterday' : 'Recent Completed Wins'}
                </span>
                <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  {yesterdayItems.length} finished
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {yesterdayItems.length === 0 ? (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-xs text-text-muted italic">No tasks completed yesterday.</p>
                    <p className="text-3xs text-text-faint">
                      Check off your first task today to build momentum!
                    </p>
                  </div>
                ) : (
                  yesterdayItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-bg-surface/80 border border-emerald-500/15 text-xs flex items-start gap-2 group transition-all"
                    >
                      <span className="mt-0.5 p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-primary line-through opacity-80 truncate">
                          {item.title}
                        </p>
                        {item.project_title && (
                          <span className="text-3xs font-mono text-emerald-400/90 truncate block">
                            {item.project_title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/10 text-3xs text-emerald-400/80 font-mono flex items-center justify-between">
              <span>Momentum intact</span>
              <span className="font-bold">Ready for today</span>
            </div>
          </div>

          {/* ─── Column 2: Scheduled Today (From Calendar) ─────────── */}
          <div className="p-4 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/15">
                <span className="text-3xs uppercase font-mono font-bold text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Scheduled Today
                </span>
                <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  {totalTodayItems} on agenda
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {totalTodayItems === 0 ? (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-xs text-text-muted italic">
                      No calendar events scheduled for today.
                    </p>
                    <p className="text-3xs text-text-faint">
                      Uninterrupted deep focus time on your deliverables!
                    </p>
                  </div>
                ) : (
                  <>
                    {scheduledItems.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg bg-bg-surface/80 border border-blue-500/15 text-xs space-y-1"
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
                        <div className="flex items-center gap-1.5 text-3xs font-mono text-blue-400">
                          <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>{formatEventTime(event.start_at, event.end_at)}</span>
                        </div>
                      </div>
                    ))}

                    {tasksDueToday.map((task) => (
                      <div
                        key={`due-${task.id}`}
                        className="p-2 rounded-lg bg-bg-surface/80 border border-border-base text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{task.title}</p>
                          {task.project_title && (
                            <span className="text-3xs text-text-muted font-mono truncate block">
                              {task.project_title}
                            </span>
                          )}
                        </div>
                        <span className="text-3xs font-mono font-bold text-amber-400 shrink-0">
                          Due Today
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-500/10 flex items-center justify-between text-3xs font-mono text-blue-400">
              <Link
                to={calendarRoute}
                className="hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Calendar View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* ─── Column 3: Next Upcoming Milestone ─────────────────── */}
          <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
                <span className="text-3xs uppercase font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Next Milestone Target
                </span>
                {nextMilestone &&
                  nextMilestone.days_remaining !== null &&
                  nextMilestone.days_remaining !== undefined && (
                    <span
                      className={`text-3xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        nextMilestone.days_remaining <= 0
                          ? 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse'
                          : nextMilestone.days_remaining <= 3
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                      }`}
                    >
                      {nextMilestone.days_remaining === 0
                        ? 'Due Today!'
                        : nextMilestone.days_remaining < 0
                          ? `${Math.abs(nextMilestone.days_remaining)}d overdue`
                          : `In ${nextMilestone.days_remaining} days`}
                    </span>
                  )}
              </div>

              <div className="mt-2.5">
                {nextMilestone ? (
                  <div className="p-3 rounded-lg bg-bg-surface/80 border border-amber-500/20 space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-text-primary">
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
                        <p className="text-3xs font-mono text-amber-400 truncate">
                          Roadmap: {nextMilestone.project_title}
                        </p>
                      )}
                    </div>

                    {nextMilestone.target_date && (
                      <div className="flex items-center gap-1.5 text-3xs font-mono text-text-muted pt-1 border-t border-border-subtle/60">
                        <CalendarDays className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          Deadline: {new Date(nextMilestone.target_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-xs text-text-muted italic">No upcoming milestone targets.</p>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => openCaptureModal('ai')}
                      icon={<Sparkles className="w-3 h-3 text-solar-500" />}
                    >
                      AI Roadmap
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between text-3xs font-mono text-amber-400">
              <Link
                to={
                  role === 'student'
                    ? '/app/student/projects'
                    : `/app/${role === 'job_seeker' ? 'job-seeker' : role}/projects`
                }
                className="hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Milestones &amp; Projects</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Card3D>
  );
}
