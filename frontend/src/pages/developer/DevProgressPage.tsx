import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  Flame,
  Zap,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks } from '../../services/taskService';
import { fetchMilestones, fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function DevProgressPage() {
  const { openAIDrawer } = useWorkspace();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'developer'],
    queryFn: () => fetchTasks(),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'developer'],
    queryFn: () => fetchMilestones(),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects(),
  });

  if (tasksLoading || milestonesLoading || projectsLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const completedMilestones = milestones.filter((m) => m.status === 'completed');
  const milestoneRate = milestones.length > 0 ? Math.round((completedMilestones.length / milestones.length) * 100) : 0;

  const totalEstimatedMins = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const completedMins = completedTasks.reduce((sum, t) => sum + (t.actual_minutes || t.estimated_minutes || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-developer-500/20 text-developer-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-developer-400">
              VELOCITY &amp; PERFORMANCE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Sprint Progress &amp; Analytics
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            Sprint burndown, task completion rate, engineering velocity, and milestone targets.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            openAIDrawer(
              'Analyze our sprint velocity, task completion rate, and highlight bottlenecks',
            )
          }
          icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        >
          AI Velocity Analysis
        </Button>
      </div>

      {/* 4 Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-developer-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-developer-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{taskCompletionRate}%</span>
            <span className="text-xs text-text-muted">
              ({completedTasks.length}/{tasks.length})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-developer-400">
            Sprint backlog on track
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Milestones Delivered</span>
            <Flag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{milestoneRate}%</span>
            <span className="text-xs text-text-muted">
              ({completedMilestones.length}/{milestones.length})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400">
            {milestones.length - completedMilestones.length} remaining
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Hours Logged</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">
              {(completedMins / 60).toFixed(1)}h
            </span>
            <span className="text-xs text-text-muted">
              / {(totalEstimatedMins / 60).toFixed(1)}h est
            </span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-400">
            Sprint capacity optimized
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Sprint Heat</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">High</span>
            <span className="text-xs text-text-muted">velocity</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-400">
            4 tasks shipped today
          </div>
        </Card>
      </div>

      {/* Progress Breakdown Bars */}
      <Card className="p-6 space-y-6">
        <h3 className="text-base font-bold text-text-primary">
          Project Completion Breakdown
        </h3>

        <div className="space-y-4">
          {projects.map((proj) => (
            <div key={proj.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">{proj.title}</span>
                <span className="font-mono font-semibold text-developer-400">
                  {proj.progress}%
                </span>
              </div>

              <div className="w-full bg-bg-base h-2.5 rounded-full overflow-hidden border border-border-base">
                <div
                  className="bg-gradient-to-r from-developer-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-faint">
                <span>{proj.description}</span>
                <span>{proj.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
