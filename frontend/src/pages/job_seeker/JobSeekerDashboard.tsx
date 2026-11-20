import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Award,
  Calendar,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardSummary } from '../../services/dashboardService';
import { tasksApi, projectsApi } from '../../services/apiClient';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { DailyStandupWidget } from '../../components/dashboard/DailyStandupWidget';
import type { TaskStatus } from '../../types/task';
import { cn } from '../../utils/cn';

export default function JobSeekerDashboard() {
  const { openAIDrawer, showToast } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'job_seeker'],
    queryFn: ({ signal }) => fetchDashboardSummary('job_seeker', signal),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'job_seeker'],
    queryFn: ({ signal }) => tasksApi.get('job_seeker', { signal }),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'job_seeker'],
    queryFn: ({ signal }) => projectsApi.get('job_seeker', { signal }),
  });

  const invalidate = () =>
    ['tasks', 'dashboard', 'projects', 'milestones'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) =>
      tasksApi.update(id, { status }),
    onSuccess: (updated, variables) => {
      invalidate();
      if (updated.status === 'completed') {
        showToast('Application task completed!', 'success', {
          action: {
            label: 'Undo',
            onClick: () => toggleMutation.mutate({ id: variables.id, status: 'todo' }),
          },
        });
      } else {
        showToast('Task updated', 'success');
      }
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) =>
      tasksApi.create({
        title,
        priority: 'high',
        estimated_minutes: 45,
        role: 'job_seeker',
      }),
    onSuccess: () => {
      setQuickTaskTitle('');
      invalidate();
      showToast('Career task added!', 'success');
    },
  });

  if (summaryLoading || tasksLoading || projectsLoading) {
    return <DashboardSkeleton />;
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const leftPercent =
    tasks.length > 0 ? Math.round((pendingTasks.length / tasks.length) * 100) : 0;
  const avgProjectProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => {
            const pTasks = tasks.filter(
              (t) =>
                t.project_id === p.id ||
                (t.project_title &&
                  t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
            );
            const pProg =
              pTasks.length > 0
                ? Math.round(
                    (pTasks.filter((t) => t.status === 'completed').length / pTasks.length) * 100
                  )
                : p.progress || 0;
            return acc + pProg;
          }, 0) / projects.length
        )
      : 0;

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Sahil';

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

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const nextMilestoneTitle =
    (summary?.role_summary as any)?.next_interview_title || 'Technical Interview Prep';

  // Dynamic companies list mapping
  const companiesList =
    projects.length > 0
      ? projects.slice(0, 5).map((p, idx) => {
          const codes = ['STRIPE-480', 'VERCEL-401', 'NOTION-320', 'LINEAR-210'];
          const stages = ['Offer', 'Onsite', 'Screening', 'Applied'];
          const pTasks = tasks.filter(
            (t) =>
              t.project_id === p.id ||
              (t.project_title &&
                t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
          );
          const pComp = pTasks.filter((t) => t.status === 'completed').length;
          const pct =
            pTasks.length > 0 ? Math.round((pComp / pTasks.length) * 100) : p.progress || 85;
          return {
            id: p.id,
            code: codes[idx % codes.length],
            title: p.title,
            subtitle: pct >= 90 ? 'Final Round · Senior Staff Role' : 'Interview pipeline active',
            progress: pct,
            stage: stages[idx % stages.length],
          };
        })
      : [
          {
            id: 1,
            code: 'STRIPE-480',
            title: 'Stripe · Senior Infrastructure Engineer',
            subtitle: 'Final Round · Senior Staff Role',
            progress: 94,
            stage: 'Offer',
          },
          {
            id: 2,
            code: 'VERCEL-401',
            title: 'Vercel · Full-Stack Developer Platform',
            subtitle: 'Onsite Loop scheduled for Thursday',
            progress: 96,
            stage: 'Onsite',
          },
          {
            id: 3,
            code: 'NOTION-320',
            title: 'Notion · Core Productivity Workspace',
            subtitle: 'System Design Interview completed',
            progress: 91,
            stage: 'Screening',
          },
          {
            id: 4,
            code: 'LINEAR-210',
            title: 'Linear · Systems & Sync Architecture',
            subtitle: 'Application submitted & reviewed',
            progress: 88,
            stage: 'Applied',
          },
        ];

  // Activity bars for prep hours
  const activityData = [
    { day: 'Mon', value: 4 },
    { day: 'Tue', value: 5.5 },
    { day: 'Wed', value: 3 },
    { day: 'Thu', value: 6 },
    { day: 'Fri', value: 5, isCurrentDay: true },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans text-stone-900 dark:text-stone-100 transition-colors">
      {/* ─── 1. TOP GREETING & HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            {formattedDate}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
            {timeGreeting}, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
            Welcome back, {displayName}. Here is your application pipeline, target companies, and
            interview prep.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            to="/app/job-seeker/applications"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#161922] hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-[#eee7e0] dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-semibold transition-all shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-stone-500" />
            <span>My Applications</span>
          </Link>
          <button
            type="button"
            onClick={() => openAIDrawer()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Plan with Skillpath AI</span>
          </button>
        </div>
      </div>

      {/* ─── 2. METRICS ROW (4 STAT CARDS) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Applications */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Target Applications
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                {projects.length}
              </span>
              <span className="text-xs font-medium text-stone-400">active</span>
            </div>
          </div>
          <div className="mt-4 pt-1">
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-[#0d9488] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, avgProjectProgress))}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-[#0d9488] dark:text-teal-400 truncate">
              {avgProjectProgress}% avg progress
            </div>
          </div>
        </div>

        {/* Card 2: Tasks To Do */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Tasks To Do
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                {pendingTasks.length}
              </span>
              <span className="text-xs font-medium text-stone-400">remaining</span>
            </div>
          </div>
          <div className="mt-4 pt-1">
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-stone-900 dark:bg-stone-100 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, 100 - leftPercent))}%` }}
              />
            </div>
            <div className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>{completedTasks.length} completed</span>
              <span className="font-mono text-3xs font-semibold text-stone-700 dark:text-stone-300">
                {leftPercent}% left
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Tasks Done */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Tasks Done
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                {completedTasks.length}
              </span>
              <span className="text-xs font-medium text-stone-400">finished</span>
            </div>
          </div>
          <div className="mt-4 pt-1">
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-[#c04b1e] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, taskCompletionRate))}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 truncate">
              {taskCompletionRate}% completion
            </div>
          </div>
        </div>

        {/* Card 4: Next Target / Interview */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Next Interview
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-stone-950 dark:text-white truncate">
                {nextMilestoneTitle}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Upcoming milestone</span>
          </div>
        </div>
      </div>

      {/* ─── STANDUP SUMMARY ─────────────────────────────────────────────────── */}
      <DailyStandupWidget role="job_seeker" standupData={summary?.daily_standup} />

      {/* ─── 3. MIDDLE ROW: TODAY (7 cols) + MINI CALENDAR (5 cols) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today Career Tasks */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">Today</h3>
            <Link
              to="/app/job-seeker/calendar"
              className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 hover:underline"
            >
              View schedule
            </Link>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 5).map((t, idx) => {
              const isDone = t.status === 'completed';
              const defaultCodes = ['STRIPE-480', 'VERCEL-401', 'NOTION-320', 'LINEAR-210'];
              const code = defaultCodes[idx % defaultCodes.length];
              const times = ['10:00', '14:00', '16:00', '18:00'];
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
                        <span>· about {t.estimated_minutes || 45}m</span>
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickTaskTitle.trim()) {
                addTaskMutation.mutate(quickTaskTitle.trim());
              }
            }}
            className="pt-2"
          >
            <div className="flex items-center gap-2 border border-[#eee7e0] dark:border-stone-800 rounded-full px-4 py-1.5 bg-[#faf8f5]/60 dark:bg-stone-900/60 focus-within:border-stone-400 dark:focus-within:border-stone-600 transition-colors">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Add an application or interview prep task..."
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

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

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

      {/* ─── 4. LOWER ROW: TARGET COMPANIES (7 cols) + PREP TIME (5 cols) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Companies Table */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              Target Companies &amp; Roles
            </h3>
            <Link
              to="/app/job-seeker/applications"
              className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-12 text-2xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider pb-2 border-b border-[#eee7e0] dark:border-stone-800/80">
            <div className="col-span-2">CODE</div>
            <div className="col-span-5">COMPANY / ROLE</div>
            <div className="col-span-3 text-center">PROGRESS</div>
            <div className="col-span-2 text-right">STAGE</div>
          </div>

          <div className="divide-y divide-[#f2ede6] dark:divide-stone-800/60">
            {companiesList.map((c) => (
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
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800">
                    {c.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Prep Time Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              Interview prep
            </h3>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              23.5h this week
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-stone-300 dark:border-stone-700 pointer-events-none" />

            <div className="flex items-end justify-between gap-2 h-36 px-2">
              {activityData.map((bar, idx) => {
                const heightPercent = Math.max(12, Math.round((bar.value / 6) * 100));

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
            Dashed line: 3.5h a day keeps interview readiness on target for onsite loops.
          </div>
        </div>
      </div>

      {/* ─── 5. BOTTOM ROW: MILESTONES ────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
          Career Milestones
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30">
            <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-[#c04b1e] dark:bg-orange-950/40 dark:text-orange-300 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Resume Optimization Complete
              </div>
              <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                ATS score 95/100 verified across technical roles
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30">
            <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-[#0d9488] dark:bg-teal-950/40 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                System Design Ace
              </div>
              <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                8 comprehensive architecture mock sessions
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Target Offer Milestone
              </div>
              <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                2 formal offers under final compensation review
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
