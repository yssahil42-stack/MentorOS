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
import { tasksApi, projectsApi } from '../../services/apiClient';
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

  // Dynamic courses mapping
  const coursesList =
    projects.length > 0
      ? projects.slice(0, 5).map((p, idx) => {
          const codes = ['CS-480', 'CS-401', 'MATH-320', 'PHYS-210', 'ENG-301'];
          const grades = ['A', 'A', 'A-', 'B+', 'A'];
          const pTasks = tasks.filter(
            (t) =>
              t.project_id === p.id ||
              (t.project_title &&
                t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
          );
          const pComp = pTasks.filter((t) => t.status === 'completed').length;
          const pct =
            pTasks.length > 0 ? Math.round((pComp / pTasks.length) * 100) : p.progress || 88;
          return {
            id: p.id,
            code: codes[idx % codes.length],
            title: p.title,
            subtitle: pct >= 90 ? 'High performance · 4 credits' : 'On track · 3 credits',
            progress: pct,
            grade: grades[idx % grades.length],
          };
        })
      : [
          {
            id: 1,
            code: 'CS-480',
            title: 'Distributed Systems & Cloud Computing',
            subtitle: 'On track · 4 credits',
            progress: 94,
            grade: 'A',
          },
          {
            id: 2,
            code: 'CS-401',
            title: 'Senior Capstone Engineering',
            subtitle: 'High performance · 4 credits',
            progress: 96,
            grade: 'A',
          },
          {
            id: 3,
            code: 'MATH-320',
            title: 'Advanced Linear Algebra & Optimization',
            subtitle: 'Needs midterm focus · 3 credits',
            progress: 91,
            grade: 'A-',
          },
          {
            id: 4,
            code: 'PHYS-210',
            title: 'Quantum Physics & Semiconductor Devices',
            subtitle: 'Add a study block · 3 credits',
            progress: 88,
            grade: 'B+',
          },
        ];

  // Activity bars for the week
  const activityData = [
    { day: 'Mon', value: 3.5 },
    { day: 'Tue', value: 4 },
    { day: 'Wed', value: 2.5 },
    { day: 'Thu', value: 4.5 },
    { day: 'Fri', value: 4, isCurrentDay: true },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans text-stone-900 dark:text-stone-100 transition-colors">
      {/* ─── 1. TOP METRICS & GREETING ────────────────────────────────────────── */}
      <DashboardMetrics
        displayName={user?.full_name ? user.full_name.split(' ')[0] : 'Sahil'}
        projectCount={projects.length || 4}
        avgProjectProgress={avgProgress || 68}
        pendingTaskCount={pending.length}
        completedTaskCount={completed.length}
        totalTaskCount={tasks.length}
        taskCompletionRate={compRate}
        nextDeadlineTitle={(summary?.role_summary as any)?.next_deadline_title || 'Semester Review'}
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
            {tasks.slice(0, 5).map((t, idx) => {
              const isDone = t.status === 'completed';
              const defaultCodes = ['CS-480', 'CS-401', 'MATH-320', 'PHYS-210'];
              const code = defaultCodes[idx % defaultCodes.length];
              const times = ['10:00', '14:00', '16:30', '18:00'];
              const time = times[idx % times.length];

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
                        <span className="font-semibold text-stone-600 dark:text-stone-300">
                          {t.project_title || code}
                        </span>
                        <span>· about {t.estimated_minutes || 60}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {!isDone && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-100/70 text-[#c04b1e] border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/40">
                        Due 23:59
                      </span>
                    )}
                    <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                      {time}
                    </span>
                  </div>
                </div>
              );
            })}
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
              const hasTask = dayNum % 3 === 0 || dayNum === currentDayNum;

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
        </div>

        {/* Right Column: Study time Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              Study time
            </h3>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              18.5h of 20h
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-stone-300 dark:border-stone-700 pointer-events-none" />

            <div className="flex items-end justify-between gap-2 h-36 px-2">
              {activityData.map((bar, idx) => {
                const heightPercent = Math.max(12, Math.round((bar.value / 5) * 100));

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
                          : 'bg-orange-300 dark:bg-orange-400/40 hover:bg-orange-400'
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
            Dashed line: 2.9h a day keeps you on pace for 20h.
          </div>
        </div>
      </div>

      {/* ─── 4. BOTTOM ROW: MILESTONES ────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
          Milestones
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30">
            <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-[#c04b1e] dark:bg-orange-950/40 dark:text-orange-300 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Dean&apos;s List candidate
              </div>
              <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                3.88 GPA over the last two terms
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30">
            <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-[#0d9488] dark:bg-teal-950/40 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                100h Study Club
              </div>
              <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                182 total Pomodoro focus hours
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Early submitter
              </div>
              <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                Deliverables handed in 48h early
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
