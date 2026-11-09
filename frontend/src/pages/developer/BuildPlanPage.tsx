import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitPullRequest,
  Layers,
  Flag,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  FolderGit2,
  CheckSquare,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Code2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchProjects,
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../../services/projectService';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Milestone, MilestoneStatus } from '../../types/project';
import type { Task } from '../../types/task';

export default function BuildPlanPage() {
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();

  // Filters & State
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MilestoneStatus>('all');
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  const [quickAddTitles, setQuickAddTitles] = useState<Record<number, string>>({});

  // Modal State for New Milestone
  const [isNewMilestoneOpen, setIsNewMilestoneOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProjectId, setNewProjectId] = useState<number | undefined>(undefined);
  const [newTargetDate, setNewTargetDate] = useState('');

  // Queries
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects('developer'),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'developer'],
    queryFn: () => fetchMilestones(),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'developer'],
    queryFn: () => fetchTasks({ role: 'developer' }),
  });

  // Toggle Milestone Status Mutation
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MilestoneStatus }) => {
      return updateMilestone(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone status updated', 'success');
    },
  });

  // Create Milestone Mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async () => {
      const targetProjId =
        newProjectId ??
        (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id ?? 1);
      return createMilestone({
        project_id: targetProjId,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        target_date: newTargetDate || undefined,
      });
    },
    onSuccess: () => {
      setIsNewMilestoneOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewTargetDate('');
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone added to build plan', 'success');
    },
  });

  // Delete Milestone Mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteMilestone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Milestone removed', 'info');
    },
  });

  // Toggle Subtask Completion Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return updateTask(id, { status: completed ? 'completed' : 'todo' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Quick Add Subtask Mutation
  const addSubtaskMutation = useMutation({
    mutationFn: async ({ title, projectId }: { title: string; projectId: number }) => {
      return createTask({
        title,
        project_id: projectId,
        role: 'developer',
        status: 'todo',
        priority: 'medium',
      });
    },
    onSuccess: (_, variables) => {
      setQuickAddTitles((prev) => ({ ...prev, [variables.projectId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Technical subtask added', 'success');
    },
  });

  const toggleExpand = (id: number) => {
    setExpandedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Milestones
  const filteredMilestones = milestones.filter((m) => {
    if (selectedProjectId !== 'all' && m.project_id !== selectedProjectId) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  // Metric Computations
  const totalMilestones = filteredMilestones.length;
  const completedMilestones = filteredMilestones.filter((m) => m.status === 'completed').length;
  const inProgressMilestones = filteredMilestones.filter((m) => m.status === 'in_progress').length;
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  if (projectsLoading || milestonesLoading || tasksLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-40" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* ─── Executive Header Banner ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border-base/80 bg-white dark:bg-bg-surface shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <span className="text-2xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              SYSTEM ARCHITECTURE &amp; SPRINT ROADMAP
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Build Plan &amp; Roadmap
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl font-normal">
            Deconstruct engineering goals into architectural phases, track shippable milestones, and review linked technical deliverables.
          </p>
        </div>

        {/* Banner Action CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Button
            size="sm"
            onClick={() => {
              setNewProjectId(selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id);
              setIsNewMilestoneOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Milestone
          </Button>
        </div>
      </div>

      {/* ─── Sprint Metrics Bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border-base/80 bg-white dark:bg-bg-surface">
          <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
            Total Milestones
          </span>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{totalMilestones}</p>
        </Card>

        <Card className="p-4 border-border-base/80 bg-white dark:bg-bg-surface">
          <span className="text-2xs font-semibold uppercase tracking-wider text-indigo-500">
            In Progress
          </span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {inProgressMilestones}
          </p>
        </Card>

        <Card className="p-4 border-border-base/80 bg-white dark:bg-bg-surface">
          <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-500">
            Shipped / Done
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {completedMilestones}
          </p>
        </Card>

        <Card className="p-4 border-border-base/80 bg-white dark:bg-bg-surface">
          <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
            <span>Sprint Completion</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-bg-elevated h-2 rounded-full overflow-hidden mt-3 border border-border-base/60">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </Card>
      </div>

      {/* ─── Controls: Project Selector & Status Pills ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Repository Filter */}
        <div className="flex items-center gap-2 min-w-0">
          <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) =>
              setSelectedProjectId(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
          >
            <option value="all">All Repositories ({projects.length})</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'in_progress', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-bg-surface border border-border-base/80 text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:hover:bg-bg-elevated'
              }`}
            >
              {status === 'all'
                ? 'All Statuses'
                : status === 'in_progress'
                  ? 'In Progress'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Milestones Roadmap List ─────────────────────────────────── */}
      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <Card className="p-10 border-border-base text-center space-y-3 bg-white dark:bg-bg-surface">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto">
              <Flag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">No Milestones Recorded</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Break down your active repository into milestones, technical deliverables, and shippable releases.
            </p>
            <div className="pt-2 flex items-center justify-center">
              <Button
                size="sm"
                onClick={() => setIsNewMilestoneOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Milestone
              </Button>
            </div>
          </Card>
        ) : (
          filteredMilestones.map((m) => {
            const isDone = m.status === 'completed';
            const isExpanded = !!expandedMilestones[m.id];
            const project = projects.find((p) => p.id === m.project_id);
            const milestoneTasks = tasks.filter((t) => t.project_id === m.project_id);
            const completedTasksCount = milestoneTasks.filter((t) => t.status === 'completed').length;
            const taskProgress =
              milestoneTasks.length > 0
                ? Math.round((completedTasksCount / milestoneTasks.length) * 100)
                : isDone
                  ? 100
                  : 0;

            const quickTitle = quickAddTitles[m.project_id] || '';

            return (
              <Card
                key={m.id}
                className="border border-border-base/80 bg-white dark:bg-bg-surface hover:border-indigo-500/30 transition-all overflow-hidden shadow-2xs"
              >
                {/* Milestone Header Summary */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        toggleMilestoneMutation.mutate({
                          id: m.id,
                          status: isDone ? 'pending' : 'completed',
                        })
                      }
                      className="mt-0.5 text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                      title={isDone ? 'Mark as Pending' : 'Mark as Completed'}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          isDone
                            ? 'text-emerald-500 fill-emerald-500/20'
                            : 'text-text-muted hover:text-indigo-500'
                        }`}
                      />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm md:text-base font-bold tracking-tight ${
                            isDone ? 'line-through text-text-muted' : 'text-text-primary'
                          }`}
                        >
                          {m.title}
                        </h3>

                        {project && (
                          <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-bg-elevated text-text-secondary border border-border-subtle">
                            {project.title}
                          </span>
                        )}

                        <Badge
                          variant={
                            isDone
                              ? 'success'
                              : m.status === 'in_progress'
                                ? 'primary'
                                : 'neutral'
                          }
                          size="sm"
                          className="text-[10px]"
                        >
                          {m.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {m.description && (
                        <p className="text-xs text-text-muted line-clamp-2">{m.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Progress & Expansion */}
                  <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-2xs font-mono text-text-muted">
                        <span>{completedTasksCount}/{milestoneTasks.length} tasks</span>
                        <span className="mx-1.5">•</span>
                        <span className="font-semibold text-text-primary">{taskProgress}%</span>
                      </div>
                      {m.target_date && (
                        <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5 justify-end">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>Due {new Date(m.target_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(m.id)}
                      className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-elevated border border-border-subtle transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <span>{isExpanded ? 'Hide Tasks' : 'View Tasks'}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this milestone?')) {
                          deleteMilestoneMutation.mutate(m.id);
                        }
                      }}
                      className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtask Checklist Drawer */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-border-base/80 bg-slate-50/60 dark:bg-bg-base/40 space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                          Technical Deliverables &amp; Subtasks
                        </h4>
                      </div>
                      <span className="text-2xs text-text-muted font-mono">
                        {completedTasksCount} of {milestoneTasks.length} done
                      </span>
                    </div>

                    {milestoneTasks.length === 0 ? (
                      <p className="text-xs text-text-muted italic py-2">
                        No technical subtasks recorded under this repository yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {milestoneTasks.map((task) => {
                          const taskDone = task.status === 'completed';
                          return (
                            <div
                              key={task.id}
                              className="p-3 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-all shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleTaskMutation.mutate({
                                      id: task.id,
                                      completed: !taskDone,
                                    })
                                  }
                                  className="text-text-muted hover:text-indigo-500 transition-colors shrink-0"
                                >
                                  <CheckCircle2
                                    className={`w-4 h-4 ${
                                      taskDone
                                        ? 'text-emerald-500 fill-emerald-500/20'
                                        : 'text-text-muted'
                                    }`}
                                  />
                                </button>
                                <span
                                  className={`text-xs font-medium truncate ${
                                    taskDone ? 'line-through text-text-muted' : 'text-text-primary'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {task.estimated_minutes && (
                                  <span className="text-3xs font-mono text-text-muted flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-indigo-500" />
                                    {task.estimated_minutes}m
                                  </span>
                                )}
                                <span className="text-3xs uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-bg-elevated text-text-muted">
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline Quick Add Task Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!quickTitle.trim()) return;
                        addSubtaskMutation.mutate({
                          title: quickTitle.trim(),
                          projectId: m.project_id,
                        });
                      }}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        value={quickTitle}
                        onChange={(e) =>
                          setQuickAddTitles((prev) => ({
                            ...prev,
                            [m.project_id]: e.target.value,
                          }))
                        }
                        placeholder={`+ Add a technical deliverable to this sprint...`}
                        className="flex-1 h-9 px-3.5 rounded-xl text-xs bg-white dark:bg-bg-surface border border-border-base focus:border-indigo-500 focus:outline-none text-text-primary placeholder:text-text-muted shadow-2xs"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!quickTitle.trim() || addSubtaskMutation.isPending}
                        className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Deliverable
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ─── Modal: Create New Milestone ─────────────────────────────── */}
      <Modal
        isOpen={isNewMilestoneOpen}
        onClose={() => setIsNewMilestoneOpen(false)}
        title="Add Technical Milestone"
        description="Schedule a new architectural deliverable or release target."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            createMilestoneMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Target Repository / Project
            </label>
            <select
              value={newProjectId ?? projects[0]?.id ?? 1}
              onChange={(e) => setNewProjectId(Number(e.target.value))}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-indigo-500"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Milestone Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 PKCE Authentication Flow"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Description / Architecture Notes
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Key specifications, API contracts, acceptance criteria..."
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewMilestoneOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newTitle.trim() || createMilestoneMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
