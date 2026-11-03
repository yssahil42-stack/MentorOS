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
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';

export default function StudentTasksPage() {
  const { openAIDrawer, openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newEstMinutes, setNewEstMinutes] = useState(60);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');

  // Fetch strictly role: 'student' tasks
  const { data: tasks = [], isLoading } = useQuery({
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
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Study task added! 🎯', 'success');
    },
    onError: () => {
      showToast('Failed to add study task', 'error');
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task deleted', 'info');
    },
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesPriority =
      filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

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
              Organize syllabus assignments, research readings, and track Pomodoro focus intervals without cross-module clutter.
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
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {todoTasks.length}
          </div>
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
            {tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}% completion rate
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Study Hours Logged</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {(completedMinutes / 60).toFixed(1)}h <span className="text-xs font-normal text-text-muted">/ {(totalMinutes / 60).toFixed(1)}h</span>
          </div>
          <p className="text-2xs text-indigo-400 mt-1">Estimated workload</p>
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
          {/* Search */}
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 bg-bg-base border border-border-base rounded-xl text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-student-500/50"
            />
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
      {isLoading ? (
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
                    <h4 className="text-xs font-bold text-text-primary">
                      {task.title}
                    </h4>
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
        /* List View */
        <Card className="p-4 space-y-2">
          {filteredTasks.length === 0 ? (
            <p className="text-xs text-text-muted py-8 text-center">
              No tasks found.
            </p>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isDone
                      ? 'bg-bg-surface/40 border-border-base/40 opacity-60'
                      : 'bg-bg-surface border-border-base hover:border-student-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: isDone ? 'todo' : 'completed',
                        })
                      }
                      className="text-text-muted hover:text-student-400 transition-colors"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          isDone
                            ? 'text-student-400 fill-student-400/20'
                            : 'text-text-muted'
                        }`}
                      />
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          isDone ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-2xs text-text-faint truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-2xs text-text-muted hidden sm:inline">
                      {task.estimated_minutes} min
                    </span>
                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="p-1 text-text-faint hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
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
