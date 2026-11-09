import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ListTodo,
  CheckCircle2,
  Calendar,
  Calculator,
  Receipt,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ROLE_CONFIGS } from '../../config/roles';

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

  const metrics = [
    {
      title: 'Client Accounts',
      icon: <Briefcase className="w-4 h-4 text-amber-500" aria-hidden="true" />,
      iconBox: 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500/15',
      value: projectCount,
      label: 'active',
      accentColor: 'from-amber-500 to-amber-600',
      footer: (
        <div className="mt-3.5 pt-3 border-t border-border-base/60 flex items-center justify-between text-xs">
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{avgProjectProgress}% avg progress</span>
          <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-bg-base overflow-hidden border border-border-subtle/80">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, avgProjectProgress))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Deliverables Due',
      icon: <ListTodo className="w-4 h-4 text-orange-500" aria-hidden="true" />,
      iconBox: 'bg-orange-500/10 text-orange-500 border-orange-500/20 group-hover:bg-orange-500/15',
      value: pendingTaskCount,
      label: 'pending',
      accentColor: 'from-orange-500 to-orange-600',
      footer: (
        <div className="mt-3.5 pt-3 border-t border-border-base/60 flex items-center justify-between text-xs text-text-muted">
          <span className="text-text-secondary font-medium">{completedTaskCount} delivered</span>
          <span className="font-mono text-2xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            {leftPercent}% left
          </span>
        </div>
      ),
    },
    {
      title: 'Completed Milestones',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />,
      iconBox: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500/15',
      value: completedTaskCount,
      label: 'finished',
      accentColor: 'from-emerald-500 to-emerald-600',
      footer: (
        <div className="mt-3.5 pt-3 border-t border-border-base/60 flex items-center justify-between text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{taskCompletionRate}% completion</span>
          <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-bg-base overflow-hidden border border-border-subtle/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, taskCompletionRate))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Target Deadline',
      icon: <Calendar className="w-4 h-4 text-purple-500" aria-hidden="true" />,
      iconBox: 'bg-purple-500/10 text-purple-500 border-purple-500/20 group-hover:bg-purple-500/15',
      value: nextDeadlineTitle,
      label: '',
      accentColor: 'from-purple-500 to-purple-600',
      footer: (
        <div className="mt-3.5 pt-3 border-t border-border-base/60 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span>Upcoming client milestone</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Executive Welcome & Action Banner ───────────────────────── */}
      <div className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle accent sheen */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-500/50 to-orange-500/20 pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-3xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Client Engagements &bull; Production Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Track client deliverables, manage hourly &amp; milestone contracts, and schedule
              project milestones.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link to="/app/freelancer/rate-calculator">
              <Button
                variant="secondary"
                size="sm"
                className="font-semibold text-xs h-9.5 px-3.5 border-border-base hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
                leftIcon={<Calculator className="w-3.5 h-3.5 text-amber-500" />}
              >
                Rate Calculator
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenCapture}
              className="font-semibold text-xs h-9.5 px-3.5 border-border-base hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Deliverable
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onPlanWithAI}
              className="font-semibold text-xs h-9.5 px-4 !bg-amber-500 hover:!bg-amber-600 text-stone-950 shadow-sm hover:shadow transition-all"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Plan with AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 4 Systematic Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.title}
            className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-5 shadow-2xs hover:shadow-md hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Hover sheen indicator */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-amber-500/40 group-hover:to-transparent transition-all duration-300"
              aria-hidden="true"
            />

            <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
              <span>{m.title}</span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 ${m.iconBox}`}
              >
                {m.icon}
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-text-primary font-mono tracking-tight ${
                  typeof m.value === 'number'
                    ? 'text-2xl sm:text-3xl font-extrabold'
                    : 'text-sm sm:text-base font-bold truncate max-w-[200px]'
                }`}
              >
                {m.value}
              </span>
              {m.label && <span className="text-xs text-text-muted font-normal">{m.label}</span>}
            </div>

            {m.footer}
          </div>
        ))}
      </div>
    </div>
  );
};
