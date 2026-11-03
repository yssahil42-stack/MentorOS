import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ListTodo,
  CheckCircle2,
  Calendar,
  Calculator,
  FileText,
  Plus,
} from 'lucide-react';
import { Card3D } from '../../components/ui/Card3D';
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
}) => {
  const leftPercent =
    totalTaskCount > 0 ? Math.round((pendingTaskCount / totalTaskCount) * 100) : 0;

  const metrics = [
    {
      title: 'Client Accounts',
      icon: <Briefcase className="w-4 h-4 text-orange-500" />,
      iconBox: 'bg-orange-500/15 text-orange-500 border-orange-500/25',
      value: projectCount,
      label: 'active',
      hoverBorder: 'hover:border-orange-500/40',
      footer: (
        <div className="mt-2.5 flex items-center justify-between text-2xs">
          <span className="text-orange-500 font-semibold">{avgProjectProgress}% avg progress</span>
          <div className="w-16 h-1.5 rounded-full bg-bg-base overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, avgProjectProgress))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Deliverables Due',
      icon: <ListTodo className="w-4 h-4 text-amber-500" />,
      iconBox: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
      value: pendingTaskCount,
      label: 'pending',
      hoverBorder: 'hover:border-amber-500/40',
      footer: (
        <div className="mt-2.5 flex items-center justify-between text-2xs text-text-muted">
          <span>{completedTaskCount} delivered</span>
          <span className="font-mono text-3xs font-bold text-amber-500">{leftPercent}% left</span>
        </div>
      ),
    },
    {
      title: 'Completed Milestones',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      iconBox: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
      value: completedTaskCount,
      label: 'finished',
      hoverBorder: 'hover:border-emerald-500/40',
      footer: (
        <div className="mt-2.5 flex items-center justify-between text-2xs">
          <span className="text-emerald-500 font-semibold">{taskCompletionRate}% completion</span>
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
      title: 'Target Deadline',
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      iconBox: 'bg-purple-500/15 text-purple-500 border-purple-500/25',
      value: nextDeadlineTitle,
      label: '',
      hoverBorder: 'hover:border-purple-500/40',
      footer: (
        <div className="mt-2.5 text-2xs text-purple-500 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          Upcoming client milestone
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Action Banner */}
      <Card3D
        variant="glass"
        maxTilt={2}
        depth={15}
        className="p-5 sm:p-6 border border-border-base/90 bg-gradient-to-r from-bg-surface/95 via-bg-elevated/70 to-bg-surface/95 shadow-card backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Welcome back, {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Track client deliverables, manage hourly &amp; milestone contracts, and schedule
              project milestones.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/freelancer/rate-calculator">
              <Button
                variant="secondary"
                size="sm"
                className="font-medium text-xs h-9"
                leftIcon={<Calculator className="w-3.5 h-3.5 text-orange-500" />}
              >
                Rate Calculator
              </Button>
            </Link>
            <Link to="/app/freelancer/invoice-generator">
              <Button
                variant="secondary"
                size="sm"
                className="font-medium text-xs h-9"
                leftIcon={<FileText className="w-3.5 h-3.5 text-orange-500" />}
              >
                Generate Invoice
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCapture}
              className="font-semibold text-xs h-9 shadow-2xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              + Capture Work
            </Button>
          </div>
        </div>
      </Card3D>

      {/* 4 Systematic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m) => (
          <Card3D
            key={m.title}
            maxTilt={3}
            depth={15}
            variant="glass"
            className={`p-4 sm:p-5 border border-border-base/90 ${m.hoverBorder} transition-all shadow-card group bg-bg-surface`}
          >
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>{m.title}</span>
              <div className={`p-2 rounded-xl border transition-transform ${m.iconBox}`}>
                {m.icon}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span
                className={`text-text-primary font-mono tracking-tight ${
                  typeof m.value === 'number'
                    ? 'text-2xl sm:text-3xl font-extrabold'
                    : 'text-sm sm:text-base font-bold truncate'
                }`}
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
