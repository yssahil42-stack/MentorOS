import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  Trash2,
  Kanban,
  List,
  ArrowRight,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';
import type { Project } from '../../types/project';

export default function StudentTasksPage() {
  const { openAIDrawer, openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Track expanded state for roadmap sections in the task table with localStorage persistence
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('mentoros_expanded_roadmaps_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [quickAddTitles, setQuickAddTitles] = useState<Record<string, string>>({});

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newEstMinutes, setNewEstMinutes] = useState(60);
  const [newProjectId, setNewProjectId] = useState<number | undefined>(undefined);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');

  // Fetch strictly role: 'student' projects (Generated Roadmaps)
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  // Fetch strictly role: 'student' tasks (Subtasks)
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      return createTask({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        due_date: newDueDate,
        estimated_minutes: Number(newEstMinutes),
        project_id: newProjectId,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewProjectId(undefined);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Study task added! 🎯', 'success');
    },
    onError: () => {
      showToast('Failed to add study task', 'error');
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async ({ title, projectId }: { title: string; projectId?: number }) => {
      return createTask({
        title,
        project_id: projectId,
        priority: 'medium',
        estimated_minutes: 60,
        role: 'student',
      });
    },
    onSuccess: (_, vars) => {
      const key = vars.projectId ? String(vars.projectId) : 'unassigned';
      setQuickAddTitles((prev) => ({ ...prev, [key]: '' }));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Subtask added to roadmap!', 'success');
    },
    onError: () => {
      showToast('Failed to add subtask', 'error');
    },
  });

  const quickAddMutation = useMutation({
    mutationFn: async (title: string) => {
      return createTask({
        title,
        priority: 'high',
        estimated_minutes: 60,
        role: 'student',
      });
    },
    onSuccess: () => {
      setQuickTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task added!', 'success');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      return updateTask(id, { status });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(
        updated.status === 'completed'
          ? 'Study task completed! 🎓'
          : `Task moved to ${updated.status}`,
        'success'
      );
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task deleted', 'info');
    },
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  // Group study tasks inside their corresponding Generated Roadmaps
  interface RoadmapGroup {
    key: string;
    projectId?: number;
    title: string;
    description?: string | null;
    priority: string;
    targetDate?: string | null;
    subtasks: Task[];
    completedCount: number;
    totalCount: number;
    progressPercent: number;
    isGeneratedRoadmap: boolean;
  }

  const roadmapGroups: RoadmapGroup[] = projects.map((project) => {
    const projectSubtasks = filteredTasks.filter(
      (t) =>
        t.project_id === project.id ||
        (t.project_title &&
          t.project_title.trim().toLowerCase() === project.title.trim().toLowerCase())
    );
    const completedCount = projectSubtasks.filter((t) => t.status === 'completed').length;
    const totalCount = projectSubtasks.length;
    const progressPercent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : project.progress || 0;

    return {
      key: String(project.id),
      projectId: project.id,
      title: project.title,
      description: project.description,
      priority: project.priority,
      targetDate: project.target_date,
      subtasks: projectSubtasks,
      completedCount,
      totalCount,
      progressPercent,
      isGeneratedRoadmap: true,
    };
  });

  const matchedTaskIds = new Set(
    roadmapGroups.flatMap((group) => group.subtasks.map((task) => task.id))
  );
  const orphanTasks = filteredTasks.filter((task) => !matchedTaskIds.has(task.id));

  if (orphanTasks.length > 0) {
    const completedCount = orphanTasks.filter((t) => t.status === 'completed').length;
    const totalCount = orphanTasks.length;
    roadmapGroups.push({
      key: 'unassigned',
      projectId: undefined,
      title: 'General Study Tasks & Independent Topics',
      description: 'Independent study tasks and ad-hoc focus items',
      priority: 'medium',
      targetDate: undefined,
      subtasks: orphanTasks,
      completedCount,
      totalCount,
      progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      isGeneratedRoadmap: false,
    });
  }

  const toggleExpand = (key: string) => {
    setExpandedRoadmaps((prev) => {
      const next = {
        ...prev,
        [key]: prev[key] === undefined ? false : !prev[key],
      };
      try {
        localStorage.setItem('mentoros_expanded_roadmaps_tasks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterPriority('all');
  };

  const hasActiveFilters = search.trim() !== '' || filterPriority !== 'all';

  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const completedMinutes = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-student-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-student-500/15 border border-student-500/25 text-student-400">
                <Kanban className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-student-500/10 text-student-300 border border-student-500/20">
                STUDY KANBAN &amp; TASKS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Study Tasks &amp; Focus Board
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Organize syllabus assignments, research readings, and track Pomodoro focus intervals
              without cross-module clutter.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="!bg-solar-500 hover:!bg-solar-600 shadow-glow-solar"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-student-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>To Study (Pending)</span>
            <BookOpen className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">{todoTasks.length}</div>
          <p className="text-2xs text-text-muted mt-1">Ready for study session</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>In Progress</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {inProgressTasks.length}
          </div>
          <p className="text-2xs text-amber-400 mt-1">Currently active</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {completedTasks.length}
          </div>
          <p className="text-2xs text-emerald-400 mt-1">
            {tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            completion rate
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Study Hours Logged</span>
            <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {(completedMinutes / 60).toFixed(1)}h{' '}
            <span className="text-xs font-normal text-text-muted">
              / {(totalMinutes / 60).toFixed(1)}h
            </span>
          </div>
          <p className="text-2xs text-orange-500 dark:text-orange-400 mt-1">Estimated workload</p>
        </Card>
      </div>

      {/* Search, Filter & Quick Add Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-base">
        {/* Quick Add Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!quickTitle.trim()) return;
            quickAddMutation.mutate(quickTitle.trim());
          }}
          className="flex items-center gap-2 w-full md:w-96"
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add study task (e.g. 'Solve Problems 4-8 in Linear Algebra')..."
            className="flex-1 bg-bg-base/80 border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-student-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!quickTitle.trim() || quickAddMutation.isPending}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Search with 1-click Clear */}
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-7 py-1.5 bg-bg-base border border-border-base rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-student-500/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search input"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary rounded-md focus-visible:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-bg-base border border-border-base rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-student-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearFilters}
              className="h-8 px-2 text-2xs text-text-muted hover:text-student-400"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-bg-base p-1 rounded-xl border border-border-base">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-student-500/20 text-student-300'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-student-500/20 text-student-300'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or List */}
      {isTasksLoading || isProjectsLoading ? (
        <LoadingSkeleton count={3} />
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: To Do */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  To Study / Pending
                </h3>
              </div>
              <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-bg-base text-text-muted">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {todoTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 space-y-3 hover:border-student-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <PriorityBadge priority={task.priority} />
                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="text-text-faint hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary group-hover:text-student-400 transition-colors">
                      {task.title}
                    </h4>
                    {task.project_title && (
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-student-500/10 text-student-300 border border-student-500/20 max-w-[200px] truncate mt-1">
                        {task.project_title}
                      </span>
                    )}
                    {task.description && (
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-2xs text-text-faint pt-1 border-t border-border-base/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-student-400" />
                      {task.estimated_minutes || 60}m
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-2xs justify-center"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: 'in_progress',
                        })
                      }
                      icon={<ArrowRight className="w-3 h-3" />}
                    >
                      Start Studying
                    </Button>
                  </div>
                </Card>
              ))}
              {todoTasks.length === 0 && (
                <div className="p-8 text-center border border-dashed border-border-base rounded-xl text-xs text-text-faint">
                  No tasks to study
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-student-500 animate-pulse" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  In Progress / Reading
                </h3>
              </div>
              <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-student-500/15 text-student-300">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 space-y-3 border-student-500/30 bg-student-500/5 hover:border-student-500/60 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <PriorityBadge priority={task.priority} />
                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="text-text-faint hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{task.title}</h4>
                    {task.project_title && (
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-student-500/10 text-student-300 border border-student-500/20 max-w-[200px] truncate mt-1">
                        {task.project_title}
                      </span>
                    )}
                    {task.description && (
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-2xs text-text-faint pt-1 border-t border-border-base/50">
                    <span className="flex items-center gap-1 text-student-400">
                      <Clock className="w-3 h-3" />
                      {task.estimated_minutes || 60}m focus
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-2xs"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: 'todo',
                        })
                      }
                    >
                      Back
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 text-2xs !bg-student-500 hover:!bg-student-600 shadow-glow-solar"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: 'completed',
                        })
                      }
                      icon={<CheckCircle2 className="w-3 h-3" />}
                    >
                      Mark Done
                    </Button>
                  </div>
                </Card>
              ))}
              {inProgressTasks.length === 0 && (
                <div className="p-8 text-center border border-dashed border-border-base rounded-xl text-xs text-text-faint">
                  No active study sessions
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Submitted / Completed
                </h3>
              </div>
              <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 space-y-3 opacity-75 hover:opacity-100 transition-opacity group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={task.status} />
                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="text-text-faint hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold line-through text-text-muted">
                      {task.title}
                    </h4>
                    {task.project_title && (
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-student-500/10 text-student-300 border border-student-500/20 max-w-[200px] truncate mt-1">
                        {task.project_title}
                      </span>
                    )}
                    {task.description && (
                      <p className="text-[11px] text-text-faint mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-2xs text-text-muted hover:text-text-primary"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: 'in_progress',
                        })
                      }
                    >
                      Reopen Task
                    </Button>
                  </div>
                </Card>
              ))}
              {completedTasks.length === 0 && (
                <div className="p-8 text-center border border-dashed border-border-base rounded-xl text-xs text-text-faint">
                  No completed tasks yet
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Study Task Table: Grouped by Generated Roadmap with Subtasks Inside */
        <div className="space-y-5">
          {roadmapGroups.length === 0 ? (
            <Card className="p-12 text-center border-border-base space-y-3">
              <BookOpen className="w-10 h-10 text-text-muted mx-auto opacity-50" />
              <h3 className="text-base font-bold text-text-primary">No study roadmaps found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                No study roadmaps or subtasks available. Clear your filters or generate a new
                roadmap using the AI Assistant.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearFilters}
                    className="border-border-base hover:border-student-500"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => openAIDrawer()}
                  className="bg-student-500 hover:bg-student-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generate Roadmap via AI
                </Button>
              </div>
            </Card>
          ) : (
            roadmapGroups.map((group) => {
              const isExpanded = expandedRoadmaps[group.key] !== false;
              const quickAddTitle = quickAddTitles[group.key] || '';
              const subtaskId = `roadmap-task-subtasks-${group.key}`;

              return (
                <div
                  key={group.key}
                  className="rounded-2xl border border-border-base bg-bg-surface overflow-hidden shadow-sm transition-all hover:border-student-500/30"
                >
                  {/* Generated Roadmap Header (Accessible Accordion) */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={subtaskId}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(group.key);
                      }
                    }}
                    onClick={() => toggleExpand(group.key)}
                    className="p-5 cursor-pointer bg-gradient-to-r from-bg-surface via-bg-elevated/60 to-bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base/60 select-none hover:bg-bg-elevated/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-student-500"
                  >
                    <div className="flex items-start md:items-center gap-3.5 min-w-0">
                      <span
                        aria-label={isExpanded ? 'Collapse roadmap' : 'Expand roadmap'}
                        className="mt-0.5 p-1 rounded-lg text-text-muted hover:text-student-400 hover:bg-student-500/10 transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-student-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </span>

                      <div className="p-2.5 rounded-xl bg-student-500/10 border border-student-500/20 text-student-400 shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-md bg-student-500/10 text-student-400 border border-student-500/20">
                            {group.isGeneratedRoadmap ? 'COURSE PROJECT' : 'GENERAL STUDY'}
                          </span>
                          <h3 className="text-base font-bold text-text-primary truncate">
                            {group.title}
                          </h3>
                          <PriorityBadge priority={group.priority as any} />
                        </div>
                        {group.description && (
                          <p className="text-xs text-text-secondary line-clamp-1 max-w-2xl">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Subtask Done Counter */}
                    <div className="flex items-center gap-4 shrink-0 pl-10 md:pl-0">
                      <div className="flex flex-col items-end w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-text-primary">
                          <span>
                            {group.completedCount} / {group.totalCount} Done
                          </span>
                          <span className="text-student-400">({group.progressPercent}%)</span>
                        </div>
                        <div className="w-24 sm:w-36 h-2 bg-bg-base rounded-full overflow-hidden mt-1.5 border border-border-base/50">
                          <div
                            className="h-full bg-gradient-to-r from-student-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${group.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nested Subtasks Inside the Roadmap */}
                  {isExpanded && (
                    <div
                      id={subtaskId}
                      role="region"
                      aria-label={`${group.title} subtasks`}
                      className="p-4 bg-bg-base/30 space-y-3"
                    >
                      {group.subtasks.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-border-base/80 rounded-xl text-xs text-text-muted">
                          No subtasks in this roadmap yet. Use the input below to add one.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {group.subtasks.map((task) => {
                            const isDone = task.status === 'completed';

                            return (
                              <div
                                key={task.id}
                                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                                  isDone
                                    ? 'bg-bg-surface/50 border-border-base/50 opacity-65'
                                    : 'bg-bg-surface border-border-base hover:border-student-500/40'
                                }`}
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  {/* Accessible Checkbox Button */}
                                  <button
                                    type="button"
                                    aria-label={
                                      isDone
                                        ? `Mark "${task.title}" as incomplete`
                                        : `Mark "${task.title}" as complete`
                                    }
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: task.id,
                                        status: isDone ? 'todo' : 'completed',
                                      })
                                    }
                                    className="mt-0.5 p-1 shrink-0 text-text-muted hover:text-student-400 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-student-500"
                                    title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                                  >
                                    <CheckCircle2
                                      className={`w-5 h-5 transition-transform hover:scale-110 ${
                                        isDone
                                          ? 'text-emerald-500 fill-emerald-500/20'
                                          : 'text-text-muted'
                                      }`}
                                    />
                                  </button>

                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p
                                        className={`text-xs sm:text-sm font-semibold ${
                                          isDone
                                            ? 'line-through text-text-muted'
                                            : 'text-text-primary'
                                        }`}
                                      >
                                        {task.title}
                                      </p>
                                      <PriorityBadge priority={task.priority} />
                                      <StatusBadge status={task.status} />
                                    </div>
                                    {task.description && (
                                      <p className="text-2xs text-text-secondary line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-2xs text-text-muted pt-0.5">
                                      {task.due_date && (
                                        <span className="flex items-center gap-1 text-amber-400">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1 text-student-400">
                                        <Clock className="w-3 h-3" />
                                        {task.estimated_minutes || 60}m
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Single Delete Action (Redundant Complete Button Removed) */}
                                <div className="flex items-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    aria-label={`Delete subtask "${task.title}"`}
                                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                    title="Delete subtask"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline Quick-Add Subtask Input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!quickAddTitle.trim()) return;
                          addSubtaskMutation.mutate({
                            title: quickAddTitle.trim(),
                            projectId: group.projectId,
                          });
                        }}
                        className="flex items-center gap-2 pt-2"
                      >
                        <input
                          type="text"
                          value={quickAddTitle}
                          onChange={(e) =>
                            setQuickAddTitles((prev) => ({
                              ...prev,
                              [group.key]: e.target.value,
                            }))
                          }
                          placeholder={`+ Add a subtask to "${group.title}"…`}
                          className="flex-1 h-9 px-3.5 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-student-500 focus:outline-none text-text-primary placeholder:text-text-muted"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          disabled={!quickAddTitle.trim() || addSubtaskMutation.isPending}
                          className="h-9 px-3 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Subtask
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Study Task / Reading"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            createTaskMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Read Operating Systems Chapter 6: Concurrency & Semaphores"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Details &amp; Key Exercises
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Take summary notes, solve problem sets #14-19, and write sample mutex code."
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          {projects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Course / Subject
              </label>
              <select
                value={newProjectId ?? ''}
                onChange={(e) =>
                  setNewProjectId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              >
                <option value="">Independent Study Task (No assigned course)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Est. Minutes
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={newEstMinutes}
                onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                openCaptureModal('ai');
              }}
              icon={<Sparkles className="w-3.5 h-3.5 text-student-400" />}
              className="text-student-400"
            >
              Ask AI to decompose
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
                disabled={!newTitle.trim() || createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Saving...' : 'Add Task'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
