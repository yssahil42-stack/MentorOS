import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ListTodo,
  CheckCircle2,
  Calendar,
  Calculator,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface FreelancerMetricsProps {
  displayName: string;
  projectCount: number;
  avgProjectProgress: number;
  pendingTaskCount: number;
  completedTaskCount: number;
  totalTaskCount: number;
  taskCompletionRate: number;
  nextDeadlineTitle?: string;
  onOpenCapture: () => void;
  onPlanWithAI?: () => void;
}

export const FreelancerMetrics: React.FC<FreelancerMetricsProps> = ({
  displayName,
  projectCount,
  avgProjectProgress,
  pendingTaskCount,
  completedTaskCount,
  totalTaskCount,
  taskCompletionRate,
  nextDeadlineTitle = 'Client Deliverable Review',
  onOpenCapture,
  onPlanWithAI,
}) => {
  const leftPercent =
    totalTaskCount > 0 ? Math.round((pendingTaskCount / totalTaskCount) * 100) : 0;

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="space-y-6">
      {/* ─── Hero Header & Action Buttons ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            {formattedDate}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
            {timeGreeting}, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
            <span className="sr-only">Welcome back, {displayName}</span>
            Track client deliverables, contracts, and schedule project milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link to="/app/freelancer/rate-calculator">
            <Button
              variant="secondary"
              size="sm"
              className="font-semibold text-xs h-9.5 px-3.5 bg-white dark:bg-[#161922] hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-[#eee7e0] dark:border-stone-800 text-stone-800 dark:text-stone-200 rounded-xl transition-all shadow-xs"
              leftIcon={<Calculator className="w-3.5 h-3.5 text-[#c04b1e]" />}
            >
              Rate Calculator
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenCapture}
            className="font-semibold text-xs h-9.5 px-3.5 bg-white dark:bg-[#161922] hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-[#eee7e0] dark:border-stone-800 text-stone-800 dark:text-stone-200 rounded-xl transition-all shadow-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Deliverable
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onPlanWithAI}
            className="font-semibold text-xs h-9.5 px-4 !bg-[#c04b1e] hover:!bg-[#a83f17] text-white shadow-xs transition-all cursor-pointer rounded-xl flex items-center gap-1.5"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
          >
            Plan with Skillpath AI
          </Button>
        </div>
      </div>

      {/* ─── 4 Terracotta Stat Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Client Accounts */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Client Accounts
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                {projectCount}
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

        {/* Card 2: Deliverables Due */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Deliverables Due
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                {pendingTaskCount}
              </span>
              <span className="text-xs font-medium text-stone-400">pending</span>
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
              <span>{completedTaskCount} delivered</span>
              <span className="font-mono text-3xs font-semibold text-stone-700 dark:text-stone-300">
                {leftPercent}% left
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed Milestones */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Completed Milestones
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white font-mono tracking-tight">
                {completedTaskCount}
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

        {/* Card 4: Target Deadline */}
        <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800/80 rounded-2xl md:rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#c04b1e]/30 transition-colors">
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Target Deadline
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-stone-950 dark:text-white truncate">
                {nextDeadlineTitle}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Upcoming client milestone</span>
          </div>
        </div>
      </div>
    </div>
  );
};
