import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Sparkles,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Edit,
  Trash2,
  Filter,
  MoreVertical,
  ListTodo,
  Kanban,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PriorityBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/dateUtils';

import type { Task, TaskStatus, TaskPriority } from '../../types/task';

interface Project {
  id: number;
  title: string;
}

export default function FreelancerTasksPage() {
  const { openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    due_date: '',
    estimated_minutes: 60,
    project_id: null as number | null,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'freelancer'],
    queryFn: () => fetchTasks({ role: 'freelancer' }),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'freelancer'],
    queryFn: () => fetchProjects('freelancer'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      return updateTask(id, { status });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(
        updated.status === 'completed' ? 'Deliverable marked done!' : 'Task updated',
        'success'
      );
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      return createTask({
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        due_date: data.due_date || null,
        estimated_minutes: data.estimated_minutes || 60,
        project_id: data.project_id || null,
        role: 'freelancer',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task created!', 'success');
      setEditingTask(null);
    },
    onError: () => {
      showToast('Failed to create task', 'error');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task> & { id: number }) => {
      const { id, ...rest } = data;
      return updateTask(id, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task updated!', 'success');
      setEditingTask(null);
    },
    onError: () => {
      showToast('Failed to update task', 'error');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task deleted', 'success');
    },
    onError: () => {
      showToast('Failed to delete task', 'error');
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    createTaskMutation.mutate(editForm);
    setEditForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      estimated_minutes: 60,
      project_id: null,
    });
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editForm.title.trim()) return;
    updateTaskMutation.mutate({ id: editingTask.id, ...editForm });
  };

  const handleDeleteTask = (id: number) => {
    if (
      window.confirm('Are you sure you want to delete this task? This action cannot be undone.')
    ) {
      deleteTaskMutation.mutate(id);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      estimated_minutes: task.estimated_minutes || 60,
      project_id: task.project_id ?? null,
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.project_title || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');
  const archivedTasks = filteredTasks.filter((t) => t.status === 'archived');

  const totalEstimatedHours =
    Math.round((filteredTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0) / 60) * 10) /
    10;
  const totalActualHours =
    Math.round((filteredTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0) / 60) * 10) / 10;

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Done',
    archived: 'Archived',
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton variant="card" className="h-40" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  const renderTaskCard = (task: Task) => (
    <Card3D
      key={task.id}
      maxTilt={5}
      depth={15}
      variant="secondary"
      className="p-4 border border-border-base hover:border-amber-500/35 transition-all shadow-card"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-text-primary line-clamp-1 flex-1">
          {task.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => startEditing(task)}
            className="text-text-muted hover:text-text-primary"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleDeleteTask(task.id)}
            className="text-text-muted hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-text-muted line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="space-y-2 text-2xs text-text-faint">
        {task.project_title && (
          <span className="flex items-center gap-1 text-amber-500 font-medium">
            <Building2 className="w-3 h-3" />
            {task.project_title}
          </span>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due: {formatDate(task.due_date, 'medium')}
          </span>
        )}
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.estimated_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimated_minutes} min
            </span>
          )}
        </div>
      </div>
    </Card3D>
  );

  const kanbanColumns = [
    {
      status: 'todo' as TaskStatus,
      label: 'Backlog',
      icon: ListTodo,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
    },
    {
      status: 'in_progress' as TaskStatus,
      label: 'In Progress',
      icon: Kanban,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      status: 'completed' as TaskStatus,
      label: 'Delivered',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      status: 'archived' as TaskStatus,
      label: 'Archived',
      icon: ChevronDown,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ListTodo className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              CLIENT DELIVERABLES
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Tasks & Deliverables
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Track client deliverables, billable hours, and project milestones.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setEditingTask({
                id: 0,
                user_id: 0,
                role: 'freelancer',
                project_id: null,
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                due_date: null,
                estimated_minutes: 60,
                actual_minutes: 0,
                completed_at: null,
                created_at: '',
                updated_at: '',
              } as Task)
            }
            icon={<Plus className="w-4 h-4" />}
          >
            New Deliverable
          </Button>
        </div>
      </div>

      {/* ─── METRICS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Backlog</span>
            <div className="p-2 rounded-xl bg-gray-500/15 text-gray-400 border border-gray-500/25">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {todoTasks.length}
            </span>
          </div>
        </Card3D>

        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>In Progress</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Kanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {inProgressTasks.length}
            </span>
          </div>
        </Card3D>

        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Delivered</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {completedTasks.length}
            </span>
          </div>
        </Card3D>

        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Est. Hours</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {totalEstimatedHours}h
            </span>
          </div>
        </Card3D>

        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Logged Hours</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {totalActualHours}h
            </span>
          </div>
        </Card3D>
      </div>

      {/* ─── TOOLBAR ───────────────────────────────────────────────────── */}
      <Card3D
        maxTilt={2}
        depth={15}
        variant="glass"
        className="p-4 border border-border-base/80 shadow-card"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full sm:w-40"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Done' },
                { value: 'archived', label: 'Archived' },
              ]}
            />

            <Select
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              className="w-full sm:w-40"
              options={[
                { value: 'all', label: 'All Priority' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />

            <Select
              value={projectFilter}
              onValueChange={setProjectFilter}
              className="w-full sm:w-48"
              options={[
                { value: 'all', label: 'All Projects' },
                ...projects.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              icon={<Kanban className="w-4 h-4" />}
            >
              Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
              icon={<ListTodo className="w-4 h-4" />}
            >
              List
            </Button>
          </div>
        </div>
      </Card3D>

      {/* ─── KANBAN BOARD ──────────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.status);
            const Icon = column.icon;
            return (
              <div key={column.status} className="min-w-[320px] max-w-[360px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${column.bg} border border-border-base`}>
                      <Icon className={`w-4 h-4 ${column.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{column.label}</h3>
                      <span className="text-xs text-text-muted">{columnTasks.length} tasks</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 min-h-[400px] bg-bg-base/30 rounded-xl p-2 border border-border-base/50">
                  {columnTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-text-faint">
                      No {column.label.toLowerCase()} tasks
                    </div>
                  ) : (
                    columnTasks.map(renderTaskCard)
                  )}
                  {column.status === 'todo' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() =>
                        setEditingTask({
                          id: 0,
                          user_id: 0,
                          role: 'freelancer',
                          project_id: null,
                          title: '',
                          description: '',
                          status: 'todo',
                          priority: 'medium',
                          due_date: null,
                          estimated_minutes: 60,
                          actual_minutes: 0,
                          completed_at: null,
                          created_at: '',
                          updated_at: '',
                        } as Task)
                      }
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Deliverable
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── LIST VIEW ─────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <Card3D
          maxTilt={2}
          depth={20}
          variant="secondary"
          className="p-0 border border-border-base shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-base bg-bg-surface/50">
                  <th className="p-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Task
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">
                    Project
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">
                    Priority
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">
                    Due Date
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-text-faint">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-border-base/50 hover:bg-bg-elevated/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-text-primary">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-text-muted line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {task.project_title ? (
                          <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {task.project_title}
                          </span>
                        ) : (
                          <span className="text-xs text-text-faint">—</span>
                        )}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {task.due_date ? (
                          <span className="text-xs text-text-secondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.due_date, 'medium')}
                          </span>
                        ) : (
                          <span className="text-xs text-text-faint">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'success'
                              : task.status === 'in_progress'
                                ? 'warning'
                                : task.status === 'archived'
                                  ? 'muted'
                                  : 'default'
                          }
                          size="sm"
                        >
                          {statusLabels[task.status]}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => startEditing(task)}
                            className="text-text-muted hover:text-text-primary"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-text-muted hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card3D>
      )}

      {/* ─── CREATE/EDIT MODAL ─────────────────────────────────────────── */}
      {(editingTask || createTaskMutation.isPending) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card3D
            maxTilt={0}
            depth={0}
            variant="secondary"
            className="w-full max-w-md p-6 border border-border-base shadow-xl animate-slide-up"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                {editingTask?.id === 0 ? 'New Deliverable' : 'Edit Task'}
              </h2>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditingTask(null)}
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                ✕
              </Button>
            </div>

            <form
              onSubmit={editingTask?.id === 0 ? handleCreateTask : handleUpdateTask}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Task Title *
                </label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Deliverable name"
                  required
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Scope, requirements, notes..."
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-500/50 transition-colors resize-y min-h-[80px]"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Status
                  </label>
                  <Select
                    value={editForm.status}
                    onValueChange={setEditForm as any}
                    options={[
                      { value: 'todo', label: 'To Do' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'completed', label: 'Done' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Priority
                  </label>
                  <Select
                    value={editForm.priority}
                    onValueChange={setEditForm as any}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Project
                  </label>
                  <Select
                    value={editForm.project_id?.toString() || 'none'}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, project_id: v === 'none' ? null : parseInt(v) })
                    }
                    options={[
                      { value: 'none', label: 'No Project' },
                      ...projects.map((p) => ({ value: p.id.toString(), label: p.title })),
                    ]}
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Est. Minutes
                  </label>
                  <Input
                    type="number"
                    value={editForm.estimated_minutes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, estimated_minutes: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                    max={1440}
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingTask(null)}
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={
                    createTaskMutation.isPending ||
                    updateTaskMutation.isPending ||
                    !editForm.title.trim()
                  }
                  className="!bg-amber-500 hover:!bg-amber-600 text-stone-950"
                >
                  {createTaskMutation.isPending || updateTaskMutation.isPending
                    ? 'Saving...'
                    : editingTask?.id === 0
                      ? 'Create Deliverable'
                      : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card3D>
        </div>
      )}
    </div>
  );
}
