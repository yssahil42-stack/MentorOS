import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Award,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardSummary } from '../../services/dashboardService';
import { tasksApi, projectsApi, milestonesApi } from '../../services/apiClient';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { DailyStandupWidget } from '../../components/dashboard/DailyStandupWidget';
import type { TaskStatus } from '../../types/task';
import { DashboardMetrics } from './DashboardMetrics';
import { cn } from '../../utils/cn';

export default function StudentDashboard() {
  const { openAIDrawer, showToast } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const TASK_PAGE_SIZE = 25;

  // Mini calendar state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const { data: summary, isLoading: sLoad } = useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: ({ signal }) => fetchDashboardSummary('student', signal),
  });
  const { data: tasks = [], isLoading: tLoad } = useQuery({
    queryKey: ['tasks', 'student', { page: 1, pageSize: TASK_PAGE_SIZE }],
    queryFn: ({ signal }) => tasksApi.get('student', { signal }),
  });
  const { data: projects = [], isLoading: pLoad } = useQuery({
    queryKey: ['projects', 'student', { page: 1, pageSize: TASK_PAGE_SIZE }],
    queryFn: ({ signal }) => projectsApi.get('student', { signal }),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', 'student'],
    queryFn: ({ signal }) => milestonesApi.get({ role: 'student' }, signal),
  });

  const invalidate = () =>
    ['tasks', 'dashboard', 'projects', 'milestones'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      tasksApi.update(id, { status }),
    onSuccess: (u, variables) => {
      invalidate();
      if (u.status === 'completed') {
        showToast('Assignment completed!', 'success', {
          action: {
            label: 'Undo',
            onClick: () => toggleMutation.mutate({ id: variables.id, status: 'todo' }),
          },
        });
      } else {
        showToast('Assignment updated', 'success');
      }
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ title, projectId }: { title: string; projectId?: number }) =>
      tasksApi.create({
        title,
        project_id: projectId,
        priority: 'high',
        estimated_minutes: 60,
        role: 'student',
      }),
    onSuccess: () => {
      setQuickTaskTitle('');
      invalidate();
      showToast('Assignment added to schedule!', 'success');
    },
  });

  if (sLoad || tLoad || pLoad) return <DashboardSkeleton />;

  const completed = tasks.filter((t) => t.status === 'completed');
  const pending = tasks.filter((t) => t.status !== 'completed');
  const compRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => {
            const pTasks = tasks.filter(
              (t) =>
                t.project_id === p.id ||
                (t.project_title &&
                  t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
            );
            return (
              acc +
              (pTasks.length > 0
                ? Math.round(
                    (pTasks.filter((t) => t.status === 'completed').length / pTasks.length) * 100
                  )
                : p.progress || 0)
            );
          }, 0) / projects.length
        )
      : 0;

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDayNum = today.getDate();

  // Dynamic courses mapping - strictly real data without hallucinated fallbacks
  const coursesList = projects.slice(0, 5).map((p, idx) => {
    const pTasks = tasks.filter(
      (t) =>
        t.project_id === p.id ||
        (t.project_title && t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
    );
    const pComp = pTasks.filter((t) => t.status === 'completed').length;
    const pct = pTasks.length > 0 ? Math.round((pComp / pTasks.length) * 100) : p.progress || 0;
    const grade =
      pct >= 93
        ? 'A'
        : pct >= 90
          ? 'A-'
          : pct >= 85
            ? 'B+'
            : pct >= 80
              ? 'B'
              : pct >= 70
                ? 'C'
                : pct > 0
                  ? 'In Progress'
                  : '—';
    const code =
      (p as any).code || (p.title.length <= 8 ? p.title.toUpperCase() : `CRS-${idx + 1}`);

    return {
      id: p.id,
      code,
      title: p.title,
      subtitle:
        pTasks.length > 0
          ? `${pComp}/${pTasks.length} assignments completed · ${pct}%`
          : `${pct}% progress`,
      progress: pct,
      grade,
    };
  });

  const studyHoursThisWeek =
    (summary?.role_summary as any)?.study_hours_this_week ??
    (tasks.length > 0
      ? Math.round((tasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0) / 60) * 10) / 10
      : 0);

  // Activity bars for the week (Mon - Sun)
  const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  const monBasedDayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const activityData = daysList.map((day, idx) => ({
    day,
    value: 0,
    isCurrentDay: idx === monBasedDayIndex,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans text-stone-900 dark:text-stone-100 transition-colors">
      {/* ─── 1. TOP METRICS & GREETING ────────────────────────────────────────── */}
      <DashboardMetrics
        displayName={user?.full_name ? user.full_name.split(' ')[0] : 'Sahil'}
        projectCount={projects.length}
        avgProjectProgress={avgProgress}
        pendingTaskCount={pending.length}
        completedTaskCount={completed.length}
        totalTaskCount={tasks.length}
        taskCompletionRate={compRate}
        nextDeadlineTitle={
          (summary?.role_summary as any)?.next_deadline_title ||
          (projects.length === 0 && tasks.length === 0
            ? 'No upcoming deadlines'
            : 'Semester Review')
        }
        onPlanWithAI={() => openAIDrawer()}
      />

      {/* ─── STANDUP SUMMARY ─────────────────────────────────────────────────── */}
      <DailyStandupWidget role="student" standupData={summary?.daily_standup} />

      {/* ─── 2. MIDDLE ROW: TODAY (7 cols) + MINI CALENDAR (5 cols) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today Tasks */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">Today</h3>
            <Link
              to="/app/student/calendar"
              className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 hover:underline"
            >
              View schedule
            </Link>
          </div>

          {/* Today's Tasks */}
          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-stone-500 dark:text-stone-400">
                <Check className="w-7 h-7 mx-auto mb-2 opacity-30 text-stone-400" />
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  No assignments due today
                </p>
                <p className="text-2xs text-stone-400 dark:text-stone-500 mt-0.5">
                  Your schedule is clear. Add an assignment or study task below.
                </p>
              </div>
            ) : (
              tasks.slice(0, 5).map((t) => {
                const isDone = t.status === 'completed';
                const timeStr = t.due_date
                  ? new Date(t.due_date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf8f5]/80 dark:bg-stone-900/40 border border-[#f0eae1] dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: t.id,
                            status: isDone ? 'todo' : 'completed',
                          })
                        }
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                          isDone
                            ? 'bg-[#0d9488] text-white shadow-2xs'
                            : 'border-2 border-stone-300 dark:border-stone-600 hover:border-[#c04b1e]'
                        )}
                        aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div
                          className={cn(
                            'text-xs sm:text-sm font-semibold truncate',
                            isDone
                              ? 'line-through text-stone-400 dark:text-stone-500'
                              : 'text-stone-900 dark:text-stone-100'
                          )}
                        >
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-stone-500 dark:text-stone-400 mt-0.5">
                          <span className="font-semibold text-stone-600 dark:text-stone-300 truncate">
                            {t.project_title || 'General'}
                          </span>
                          <span>· ~{t.estimated_minutes || 60}m</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isDone && t.due_date && (
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-100/70 text-[#c04b1e] border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/40">
                          Due{' '}
                          {new Date(t.due_date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {timeStr && (
                        <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                          {timeStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inline Quick Add */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickTaskTitle.trim()) {
                addTaskMutation.mutate({ title: quickTaskTitle.trim() });
              }
            }}
            className="pt-2"
          >
            <div className="flex items-center gap-2 border border-[#eee7e0] dark:border-stone-800 rounded-full px-4 py-1.5 bg-[#faf8f5]/60 dark:bg-stone-900/60 focus-within:border-stone-400 dark:focus-within:border-stone-600 transition-colors">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Add an assignment or study task..."
                disabled={addTaskMutation.isPending}
                className="text-xs bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 flex-1 focus:outline-none"
              />
              <button
                type="submit"
                disabled={addTaskMutation.isPending || !quickTaskTitle.trim()}
                className="bg-stone-950 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-950 text-xs font-semibold px-3.5 py-1 rounded-full transition-colors disabled:opacity-40 cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Mini Calendar */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              {monthName} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-xs font-medium">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isToday = isCurrentMonth && dayNum === currentDayNum;
              const hasTask = tasks.some((t) => {
                if (!t.due_date) return false;
                const d = new Date(t.due_date);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
              });

              return (
                <div key={dayNum} className="flex flex-col items-center justify-center">
                  <div
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors',
                      isToday
                        ? 'bg-[#c04b1e] text-white font-bold shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer'
                    )}
                  >
                    {dayNum}
                  </div>
                  {hasTask && (
                    <span
                      className={cn(
                        'w-1 h-1 rounded-full mt-0.5',
                        isToday ? 'bg-[#c04b1e]' : 'bg-[#c04b1e]/70'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 3. LOWER ROW: COURSES (7 cols) + STUDY TIME (5 cols) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Courses Table */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              Courses
            </h3>
            <Link
              to="/app/student/projects"
              className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 hover:underline"
            >
              See all
            </Link>
          </div>

          {coursesList.length === 0 ? (
            <div className="py-8 text-center text-stone-500 dark:text-stone-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-400" />
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                No courses enrolled
              </p>
              <p className="text-2xs text-stone-400 dark:text-stone-500 mt-0.5 max-w-xs mx-auto">
                You haven&apos;t added any courses or academic projects yet.
              </p>
              <Link
                to="/app/student/projects"
                className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>Add your first course</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 text-2xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider pb-2 border-b border-[#eee7e0] dark:border-stone-800/80">
                <div className="col-span-2">CODE</div>
                <div className="col-span-5">COURSE</div>
                <div className="col-span-3 text-center">PROGRESS</div>
                <div className="col-span-2 text-right">GRADE</div>
              </div>

              <div className="divide-y divide-[#f2ede6] dark:divide-stone-800/60">
                {coursesList.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 items-center py-3 text-xs gap-2 hover:bg-stone-50/50 dark:hover:bg-stone-900/30 rounded-lg px-1 transition-colors"
                  >
                    <div className="col-span-2 font-mono font-semibold text-stone-500 dark:text-stone-400 text-xs">
                      {c.code}
                    </div>
                    <div className="col-span-5 min-w-0 pr-2">
                      <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {c.title}
                      </div>
                      <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {c.subtitle}
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center justify-center gap-2">
                      <div className="w-16 sm:w-24 bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0d9488] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, c.progress))}%` }}
                        />
                      </div>
                      <span className="font-mono text-2xs text-stone-500 font-medium">
                        {c.progress}%
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {c.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Study time Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              Study time
            </h3>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {studyHoursThisWeek}h {studyHoursThisWeek > 0 ? 'of 20h' : 'logged'}
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-stone-300 dark:border-stone-700 pointer-events-none" />

            <div className="flex items-end justify-between gap-2 h-36 px-2">
              {activityData.map((bar, idx) => {
                const heightPercent =
                  bar.value > 0 ? Math.max(12, Math.round((bar.value / 5) * 100)) : 8;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                    <span className="text-2xs font-semibold text-stone-500 dark:text-stone-400 font-mono">
                      {bar.value > 0 ? bar.value : ''}
                    </span>
                    <div
                      className={cn(
                        'w-full max-w-[32px] rounded-t-lg transition-all duration-500',
                        bar.isCurrentDay
                          ? 'bg-[#c04b1e]'
                          : bar.value > 0
                            ? 'bg-orange-300 dark:bg-orange-400/40 hover:bg-orange-400'
                            : 'bg-stone-200/60 dark:bg-stone-800/60'
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-2xs font-medium text-stone-400 dark:text-stone-500 mt-1">
                      {bar.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-2xs text-stone-500 dark:text-stone-400 pt-1 text-center">
            {studyHoursThisWeek > 0
              ? 'Dashed line: 2.9h a day keeps you on pace for 20h.'
              : 'Log focus time on assignments to track your weekly study pacing.'}
          </div>
        </div>
      </div>

      {/* ─── 4. BOTTOM ROW: MILESTONES ────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
          Milestones
        </h3>

        {milestones.length === 0 ? (
          <div className="bg-white dark:bg-[#161922] border border-dashed border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-6 text-center text-stone-500 dark:text-stone-400">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-400" />
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              No milestones set
            </p>
            <p className="text-2xs text-stone-400 dark:text-stone-500 mt-0.5">
              Create major academic milestones like exams or thesis deadlines in Academic Projects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {milestones.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-[#c04b1e] dark:bg-orange-950/40 dark:text-orange-300 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {m.title}
                  </div>
                  <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {m.target_date ? `Target: ${m.target_date}` : m.status || 'In progress'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
