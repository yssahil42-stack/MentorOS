import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Plus,
  Calendar,
  Building,
  ListTodo,
  ArrowRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardSummary } from '../../services/dashboardService';
import { fetchTasks, updateTask, createTask } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { PriorityBadge } from '../../components/ui/Badge';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { SmallCalendar } from '../../components/ui/SmallCalendar';
import type { TaskStatus } from '../../types/task';

export default function FreelancerDashboard() {
  const { openCaptureModal, showToast } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'completed'>('all');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'freelancer'],
    queryFn: () => fetchDashboardSummary('freelancer'),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'freelancer'],
    queryFn: () => fetchTasks(),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'freelancer'],
    queryFn: () => fetchProjects(),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      return updateTask(id, { status });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(
        updated.status === 'completed'
          ? 'Deliverable marked done!'
          : 'Task updated',
        'success',
      );
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      return createTask({
        title,
        priority: 'high',
        estimated_minutes: 60,
        role: 'freelancer',
      });
    },
    onSuccess: () => {
      setQuickTaskTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Client task added!', 'success');
    },
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTaskMutation.mutate(quickTaskTitle.trim());
  };

  if (summaryLoading || tasksLoading || projectsLoading) {
    return <DashboardSkeleton />;
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const avgProjectProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
      : 0;

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'todo') return t.status !== 'completed';
    return t.status === 'completed';
  });

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* ─── ZONE 1: HEADER & SYSTEMATIC METRICS ─────────────────────── */}
        <Card3D
          variant="glass"
          maxTilt={3}
          depth={20}
          className="p-6 md:p-7 border border-border-base/80 bg-gradient-to-r from-bg-surface/90 via-bg-elevated/70 to-bg-surface/90 shadow-card backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-3xs uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Studio Active
                </span>
                <span className="text-3xs font-mono text-text-muted px-2.5 py-0.5 rounded-full bg-bg-surface/80 border border-border-base">
                  {todayFormatted}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary">
                Here is your daily schedule, client deliverables, and project progress.
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => openCaptureModal('ai')}
                className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shadow-glow-solar font-bold px-5 h-10 text-stone-950 transition-all active:translate-y-[1px]"
                icon={<Plus className="w-4 h-4 text-stone-950" />}
              >
                + Capture Work
              </Button>
            </div>
          </div>
        </Card3D>

        {/* 4 Systematic 3D Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Client Projects */}
          <Card3D
            maxTilt={7}
            depth={25}
            variant="glass"
            className="p-4 sm:p-5 border border-border-base/90 hover:border-solar-500/40 transition-all shadow-card group"
          >
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Client Projects</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 transition-transform">
                <Building className="w-4 h-4 text-solar-500" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
                {projects.length}
              </span>
              <span className="text-xs text-text-muted">active</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-2xs">
              <span className="text-solar-500 font-semibold">{avgProjectProgress}% avg progress</span>
              <div className="w-16 h-1.5 rounded-full bg-bg-base overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-solar-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, avgProjectProgress))}%` }}
                />
              </div>
            </div>
          </Card3D>

          {/* Metric 2: Deliverables Due */}
          <Card3D
            maxTilt={7}
            depth={25}
            variant="glass"
            className="p-4 sm:p-5 border border-border-base/90 hover:border-amber-500/40 transition-all shadow-card group"
          >
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Deliverables Due</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 transition-transform">
                <ListTodo className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
                {pendingTasks.length}
              </span>
              <span className="text-xs text-text-muted">pending</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-2xs text-text-muted">
              <span>{completedTasks.length} delivered</span>
              <span className="font-mono text-3xs font-bold text-amber-400">
                {tasks.length > 0 ? Math.round((pendingTasks.length / tasks.length) * 100) : 0}% left
              </span>
            </div>
          </Card3D>

          {/* Metric 3: Tasks Done */}
          <Card3D
            maxTilt={7}
            depth={25}
            variant="glass"
            className="p-4 sm:p-5 border border-border-base/90 hover:border-emerald-500/40 transition-all shadow-card group"
          >
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Tasks Done</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 transition-transform">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
                {completedTasks.length}
              </span>
              <span className="text-xs text-text-muted">finished</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-2xs">
              <span className="text-emerald-400 font-semibold">{taskCompletionRate}% completion</span>
              <div className="w-16 h-1.5 rounded-full bg-bg-base overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, taskCompletionRate))}%` }}
                />
              </div>
            </div>
          </Card3D>

          {/* Metric 4: Next Target */}
          <Card3D
            maxTilt={7}
            depth={25}
            variant="glass"
            className="p-4 sm:p-5 border border-border-base/90 hover:border-purple-500/40 transition-all shadow-card group"
          >
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Next Target</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 transition-transform">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-bold text-text-primary truncate">
                {(summary?.role_summary as any)?.next_delivery_title || 'Client Prototype Review'}
              </span>
            </div>
            <div className="mt-2.5 text-2xs text-purple-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Upcoming milestone
            </div>
          </Card3D>
        </div>

        {/* ─── ZONE 2: DAILY ACTION CENTER (TASKS & SCHEDULE) ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): My Tasks */}
          <div className="lg:col-span-7 space-y-4">
            <Card3D
              maxTilt={4}
              depth={35}
              variant="default"
              className="p-5 border border-border-base hover:border-amber-500/35 transition-all shadow-card backdrop-blur-md"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-base">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span>Client Deliverables &amp; Tasks</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Check off items as you finish them
                  </p>
                </div>

                {/* Simple Filter Pills */}
                <div className="flex items-center gap-1 bg-bg-base/80 p-1 rounded-xl border border-border-base text-xs">
                  {(['all', 'todo', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTaskFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                        taskFilter === filter
                          ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm border border-amber-500/30'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {filter === 'completed' ? 'Done' : filter === 'todo' ? 'To Do' : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-2xs text-text-muted">
                  <span>Sprint Completion</span>
                  <span className="font-semibold text-text-primary font-mono">
                    {completedTasks.length} of {tasks.length} finished ({taskCompletionRate}%)
                  </span>
                </div>
                <div className="w-full bg-bg-base h-2.5 rounded-full overflow-hidden border border-border-base p-0.5">
                  <div
                    className="bg-gradient-to-r from-solar-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${taskCompletionRate}%` }}
                  />
                </div>
              </div>

              {/* Quick Add Input */}
              <form onSubmit={handleQuickAdd} className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Add client deliverable..."
                  className="flex-1 bg-bg-base/70 border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500/50 transition-colors"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!quickTaskTitle.trim() || addTaskMutation.isPending}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="active:translate-y-[1px]"
                >
                  Add
                </Button>
              </form>

              {/* Task Checklist */}
              <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-text-muted">
                    No deliverables here right now.
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isDone
                            ? 'bg-bg-surface/40 border-border-base/40 opacity-60'
                            : 'bg-bg-surface/90 border-border-base hover:border-solar-500/40 hover:bg-bg-elevated/40 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: task.id,
                                status: isDone ? 'todo' : 'completed',
                              })
                            }
                            className="mt-0.5 text-text-muted hover:text-amber-400 transition-colors active:translate-y-[1px]"
                          >
                            <CheckCircle2
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                isDone ? 'text-amber-400 fill-amber-400/20' : 'text-text-muted'
                              }`}
                            />
                          </button>

                          <div className="min-w-0 space-y-0.5">
                            <p
                              className={`text-xs font-semibold ${
                                isDone ? 'line-through text-text-muted' : 'text-text-primary'
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-2xs text-text-muted line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-3xs text-text-faint pt-0.5">
                              {task.project_title && (
                                <span className="text-solar-500 font-medium">
                                  {task.project_title}
                                </span>
                              )}
                              {task.estimated_minutes && (
                                <span>{task.estimated_minutes} min billable</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <PriorityBadge priority={task.priority} />
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-xs">
                <span className="text-text-faint text-2xs">
                  {pendingTasks.length} deliverables remaining
                </span>
                <Link
                  to="/app/freelancer/tasks"
                  className="text-solar-500 hover:text-solar-400 flex items-center gap-1 font-medium transition-colors text-xs"
                >
                  <span>Open Task Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card3D>
          </div>

          {/* Right Column (5 cols): Small Calendar (Click to Fullscreen) */}
          <div className="lg:col-span-5">
            <SmallCalendar role="freelancer" />
          </div>
        </div>

        {/* ─── ZONE 3: ACTIVE PROJECTS (SYSTEMATIC HORIZONTAL GRID) ────── */}
        <Card3D
          maxTilt={2}
          depth={25}
          variant="default"
          className="p-5 sm:p-6 border border-border-base shadow-card backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-border-base">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                <span className="p-1 rounded-lg bg-solar-500/15 text-solar-500 border border-solar-500/25">
                  <Building className="w-4 h-4" />
                </span>
                <span>Active Client Projects &amp; Accounts</span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Contract milestones and deliverable pacing
              </p>
            </div>
            <Link to="/app/freelancer/projects">
              <Button variant="ghost" size="xs">
                Manage All Projects
              </Button>
            </Link>
          </div>

          <div className="mt-4">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted space-y-2">
                <p>No active client projects yet.</p>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => openCaptureModal('ai')}
                >
                  Create with AI
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <Card3D
                    key={proj.id}
                    maxTilt={6}
                    depth={15}
                    variant="glass"
                    className="p-4 sm:p-5 border border-border-base/90 hover:border-solar-500/40 transition-all flex flex-col justify-between space-y-3.5 group shadow-sm hover:shadow-card-hover"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-solar-500 transition-colors">
                          <Link to="/app/freelancer/projects">{proj.title}</Link>
                        </h4>
                        <span className="text-xs font-mono font-bold text-solar-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                          {proj.progress}%
                        </span>
                      </div>
                      <p className="text-2xs text-text-muted line-clamp-2">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {/* Progress Bar */}
                      <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                        <div
                          className="bg-gradient-to-r from-solar-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-3xs text-text-faint pt-1.5 border-t border-border-base/50">
                        <span>
                          {proj.completed_milestone_count || 0}/{proj.milestone_count || 0} milestones
                        </span>
                        <span>{proj.task_count || 0} tasks</span>
                      </div>
                    </div>
                  </Card3D>
                ))}
              </div>
            )}
          </div>
        </Card3D>
      </div>
    </>
  );
}
