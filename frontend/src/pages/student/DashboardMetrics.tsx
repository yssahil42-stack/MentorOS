import React from 'react';
import { BookOpen, ListTodo, CheckCircle2, Calendar } from 'lucide-react';
import { Card3D } from '../../components/ui/Card3D';

interface DashboardMetricsProps {
  displayName: string;
  projectCount: number;
  avgProjectProgress: number;
  pendingTaskCount: number;
  completedTaskCount: number;
  totalTaskCount: number;
  taskCompletionRate: number;
  nextDeadlineTitle?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  displayName,
  projectCount,
  avgProjectProgress,
  pendingTaskCount,
  completedTaskCount,
  totalTaskCount,
  taskCompletionRate,
  nextDeadlineTitle = 'Semester Review',
}) => {
  const leftPercent =
    totalTaskCount > 0 ? Math.round((pendingTaskCount / totalTaskCount) * 100) : 0;

  const metrics = [
    {
      title: 'Course Projects',
      icon: <BookOpen className="w-4 h-4 text-solar-500" />,
      iconBox: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      value: projectCount,
      label: 'active',
      hoverBorder: 'hover:border-solar-500/40',
      footer: (
        <div className="mt-2.5 flex items-center justify-between text-2xs">
          <span className="text-solar-500 font-semibold">{avgProjectProgress}% avg progress</span>
          <div className="w-16 h-1.5 rounded-full bg-bg-base overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-solar-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, avgProjectProgress))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Assignments Due',
      icon: <ListTodo className="w-4 h-4 text-amber-400" />,
      iconBox: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      value: pendingTaskCount,
      label: 'pending',
      hoverBorder: 'hover:border-amber-500/40',
      footer: (
        <div className="mt-2.5 flex items-center justify-between text-2xs text-text-muted">
          <span>{completedTaskCount} completed</span>
          <span className="font-mono text-3xs font-bold text-amber-400">{leftPercent}% left</span>
        </div>
      ),
    },
    {
      title: 'Tasks Done',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      iconBox: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      value: completedTaskCount,
      label: 'finished',
      hoverBorder: 'hover:border-emerald-500/40',
      footer: (
        <div className="mt-2.5 flex items-center justify-between text-2xs">
          <span className="text-emerald-400 font-semibold">{taskCompletionRate}% completion</span>
          <div className="w-16 h-1.5 rounded-full bg-bg-base overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, taskCompletionRate))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Target Milestone',
      icon: <Calendar className="w-4 h-4 text-purple-400" />,
      iconBox: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      value: nextDeadlineTitle,
      label: '',
      hoverBorder: 'hover:border-purple-500/40',
      footer: (
        <div className="mt-2.5 text-2xs text-purple-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Upcoming deadline
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card3D
        variant="glass"
        maxTilt={3}
        depth={20}
        className="p-6 md:p-7 border border-border-base/80 bg-gradient-to-r from-bg-surface/90 via-bg-elevated/70 to-bg-surface/90 shadow-card backdrop-blur-xl"
      >
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome back, {displayName}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Here is your daily study schedule, active coursework, and upcoming assignments.
          </p>
        </div>
      </Card3D>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m) => (
          <Card3D
            key={m.title}
            maxTilt={7}
            depth={25}
            variant="glass"
            className={`p-4 sm:p-5 border border-border-base/90 ${m.hoverBorder} transition-all shadow-card group`}
          >
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>{m.title}</span>
              <div className={`p-2 rounded-xl border transition-transform ${m.iconBox}`}>
                {m.icon}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span
                className={`text-text-primary font-mono tracking-tight ${typeof m.value === 'number' ? 'text-2xl sm:text-3xl font-extrabold' : 'text-sm sm:text-base font-bold truncate'}`}
              >
                {m.value}
              </span>
              {m.label && <span className="text-xs text-text-muted">{m.label}</span>}
            </div>
            {m.footer}
          </Card3D>
        ))}
      </div>
    </div>
  );
};
