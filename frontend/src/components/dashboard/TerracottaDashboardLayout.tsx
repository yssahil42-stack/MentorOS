import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/dateUtils';

export interface TerracottaStat {
  title: string;
  value: string | number;
  subValue?: string;
  progressBar?: {
    value: number;
    color?: 'charcoal' | 'terracotta' | 'teal';
  };
  statusText: string;
  statusColor?: 'teal' | 'stone' | 'terracotta' | 'purple';
}

export interface TerracottaTaskItem {
  id: number;
  title: string;
  code?: string;
  time?: string;
  duration?: string;
  dueBadge?: string;
  completed: boolean;
}

export interface TerracottaTableItem {
  id: string | number;
  code: string;
  title: string;
  subtitle: string;
  progress: number;
  statusBadge: string;
  statusColor?: string;
  created_at?: string;
}

export interface TerracottaActivityBar {
  day: string;
  value: number;
  isCurrentDay?: boolean;
}

export interface TerracottaMilestoneItem {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

export interface TerracottaDashboardLayoutProps {
  role: 'student' | 'developer' | 'freelancer' | 'job_seeker';
  displayName: string;
  eyebrowDate?: string;
  greetingSubtitle?: string;
  secondaryAction?: {
    label: string;
    to: string;
    icon?: React.ReactNode;
  };
  onPlanWithAI?: () => void;
  stats: TerracottaStat[];
  todayTasks: TerracottaTaskItem[];
  onToggleTask: (id: number, completed: boolean) => void;
  quickAddPlaceholder: string;
  quickAddValue: string;
  onQuickAddChange: (val: string) => void;
  onQuickAddSubmit: (e: React.FormEvent) => void;
  quickAddPending?: boolean;
  calendarScheduleTo: string;
  itemsTitle: string;
  itemsSeeAllTo: string;
  itemsColumns?: {
    code: string;
    title: string;
    progress: string;
    status: string;
  };
  items: TerracottaTableItem[];
  activityTitle: string;
  activityStat: string;
  activityBars: TerracottaActivityBar[];
  activityBenchmarkText?: string;
  milestones: TerracottaMilestoneItem[];
  standupWidget?: React.ReactNode;
}

export const TerracottaDashboardLayout: React.FC<TerracottaDashboardLayoutProps> = ({
  displayName,
  eyebrowDate,
  greetingSubtitle,
  secondaryAction,
  onPlanWithAI,
  stats,
  todayTasks,
  onToggleTask,
  quickAddPlaceholder,
  quickAddValue,
  onQuickAddChange,
  onQuickAddSubmit,
  quickAddPending,
  calendarScheduleTo,
  itemsTitle,
  itemsSeeAllTo,
  itemsColumns = {
    code: 'CODE',
    title: 'COURSE',
    progress: 'PROGRESS',
    status: 'GRADE',
  },
  items,
  activityTitle,
  activityStat,
  activityBars,
  activityBenchmarkText = 'Dashed line: 2.9h a day keeps you on pace for 20h.',
  milestones,
  standupWidget,
}) => {
  // Calendar interactive state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  // Compute days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDayNum = today.getDate();

  // Time of day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const defaultDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const maxBarValue = Math.max(...activityBars.map((b) => b.value), 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 text-stone-900 dark:text-stone-100 font-sans transition-colors">
      {/* ─── 1. TOP GREETING & ACTIONS ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1 pb-2">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            {eyebrowDate || defaultDateStr}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
            {timeGreeting}, {displayName}
            <span className="sr-only">Welcome back, {displayName}</span>
          </h1>
          {greetingSubtitle && (
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium max-w-2xl">
              {greetingSubtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {secondaryAction && (
            <Link
              to={secondaryAction.to}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#161922] hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-[#eee7e0] dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={onPlanWithAI}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Plan with Skillpath AI</span>
          </button>
        </div>
      </div>

      {/* ─── STANDUP WIDGET (IF PRESENT) ──────────────────────────────────────── */}
      {standupWidget}

      {/* ─── 2. METRICS ROW (4 CARDS) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-[#c04b1e]/30"
          >
            <div>
              <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {stat.title}
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                  {stat.value}
                </span>
                {stat.subValue && (
                  <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
                    {stat.subValue}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-1">
              {stat.progressBar && (
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      stat.progressBar.color === 'terracotta'
                        ? 'bg-[#c04b1e]'
                        : stat.progressBar.color === 'teal'
                          ? 'bg-[#0d9488]'
                          : 'bg-stone-900 dark:bg-stone-100'
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, stat.progressBar.value))}%` }}
                  />
                </div>
              )}
              <div
                className={cn(
                  'text-xs font-medium truncate',
                  stat.statusColor === 'teal'
                    ? 'text-[#0d9488] dark:text-teal-400 font-semibold'
                    : stat.statusColor === 'terracotta'
                      ? 'text-[#c04b1e] dark:text-orange-400 font-semibold'
                      : stat.statusColor === 'purple'
                        ? 'text-purple-600 dark:text-purple-400 font-semibold'
                        : 'text-stone-500 dark:text-stone-400'
                )}
              >
                {stat.statusText}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 3. MIDDLE SECTION: TODAY TASKS (7 cols) + MINI CALENDAR (5 cols) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today Tasks */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">Today</h2>
            <Link
              to={calendarScheduleTo}
              className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 hover:underline"
            >
              View schedule
            </Link>
          </div>

          {/* Task list items */}
          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                No tasks scheduled for today. Add one below!
              </div>
            ) : (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5]/80 dark:bg-stone-900/40 border border-[#f0eae1] dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700 transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(t.id, t.completed)}
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                        t.completed
                          ? 'bg-[#0d9488] text-white shadow-2xs'
                          : 'border-2 border-stone-300 dark:border-stone-600 hover:border-[#c04b1e]'
                      )}
                      aria-label={t.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <div
                        className={cn(
                          'text-xs sm:text-sm font-semibold truncate',
                          t.completed
                            ? 'line-through text-stone-400 dark:text-stone-500'
                            : 'text-stone-900 dark:text-stone-100'
                        )}
                      >
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {t.code && (
                          <span className="font-semibold text-stone-600 dark:text-stone-300">
                            {t.code}
                          </span>
                        )}
                        {t.duration && <span>· {t.duration}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {t.dueBadge && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-100/70 text-[#c04b1e] border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/40">
                        {t.dueBadge}
                      </span>
                    )}
                    {t.time && (
                      <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                        {t.time}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Inline Quick Add form */}
          <form onSubmit={onQuickAddSubmit} className="pt-2">
            <div className="flex items-center gap-2 border border-[#eee7e0] dark:border-stone-800 rounded-full px-4 py-1.5 bg-[#faf8f5]/60 dark:bg-stone-900/60 focus-within:border-stone-400 dark:focus-within:border-stone-600 transition-colors">
              <input
                type="text"
                value={quickAddValue}
                onChange={(e) => onQuickAddChange(e.target.value)}
                placeholder={quickAddPlaceholder}
                disabled={quickAddPending}
                className="text-xs bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 flex-1 focus:outline-none"
              />
              <button
                type="submit"
                disabled={quickAddPending || !quickAddValue?.trim()}
                className="bg-stone-950 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-950 text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-40 cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Mini Calendar */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              {monthName} {year}
            </h2>
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
            {/* Empty offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Calendar days */}
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

      {/* ─── 4. LOWER SECTION: ITEMS TABLE (7 cols) + ACTIVITY CHART (5 cols) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Items Table (Courses / Projects / Deliverables) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              {itemsTitle}
            </h2>
            <Link
              to={itemsSeeAllTo}
              className="text-xs font-semibold text-[#c04b1e] dark:text-orange-400 hover:underline"
            >
              See all
            </Link>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-2xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider pb-2 border-b border-[#eee7e0] dark:border-stone-800/80">
            <div className="col-span-2">{itemsColumns.code}</div>
            <div className="col-span-5">{itemsColumns.title}</div>
            <div className="col-span-3 text-center">{itemsColumns.progress}</div>
            <div className="col-span-2 text-right">{itemsColumns.status}</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#f2ede6] dark:divide-stone-800/60">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 items-center py-3 text-xs gap-2 hover:bg-stone-50/50 dark:hover:bg-stone-900/30 rounded-lg px-1 transition-colors"
              >
                {/* Code badge */}
                <div className="col-span-2 font-mono font-semibold text-stone-500 dark:text-stone-400 text-xs">
                  {item.code}
                </div>

                {/* Title & Subtitle */}
                <div className="col-span-5 min-w-0 pr-2">
                  <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                    {item.title}
                  </div>
                  <div className="text-2xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="truncate">{item.subtitle}</span>
                    {item.created_at && (
                      <>
                        <span className="text-stone-300 dark:text-stone-600">&bull;</span>
                        <span className="inline-flex items-center gap-1 text-stone-400 dark:text-stone-500 font-mono shrink-0">
                          <Clock className="w-2.5 h-2.5 text-[#c04b1e]" />
                          Created {formatDateTime(item.created_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar + % */}
                <div className="col-span-3 flex items-center justify-center gap-2">
                  <div className="w-16 sm:w-24 bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0d9488] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                    />
                  </div>
                  <span className="font-mono text-2xs text-stone-500 font-medium">
                    {item.progress}%
                  </span>
                </div>

                {/* Grade / Status */}
                <div className="col-span-2 text-right">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {item.statusBadge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Activity Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
              {activityTitle}
            </h2>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {activityStat}
            </span>
          </div>

          {/* Bar Chart Area */}
          <div className="relative pt-6 pb-2">
            {/* Dashed Benchmark Line */}
            <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-stone-300 dark:border-stone-700 pointer-events-none" />

            <div className="flex items-end justify-between gap-2 h-36 px-2">
              {activityBars.map((bar, idx) => {
                const heightPercent = Math.max(12, Math.round((bar.value / maxBarValue) * 100));

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

          {/* Subtitle benchmark explanation */}
          <div className="text-2xs text-stone-500 dark:text-stone-400 pt-1 text-center">
            {activityBenchmarkText}
          </div>
        </div>
      </div>

      {/* ─── 5. BOTTOM SECTION: MILESTONES ────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
          Milestones
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#c04b1e]/30"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold',
                  m.iconBg,
                  m.iconColor
                )}
              >
                {m.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                  {m.title}
                </div>
                <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  {m.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
