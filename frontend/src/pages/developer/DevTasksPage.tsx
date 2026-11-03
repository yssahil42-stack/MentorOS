import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  FolderGit2,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';

export default function DevTasksPage() {
  const { openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'developer'],
    queryFn: () => fetchTasks(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createTask({
        title,
        description,
        project_id: projectId,
        priority,
        due_date: dueDate || undefined,
        estimated_minutes: estimatedMinutes,
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task added to sprint queue!', 'success');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      return updateTask(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task status updated', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task removed', 'info');
    },
  });

  const filtered = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-28" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-developer-500/20 text-developer-400">
              <ListTodo className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-developer-400">
              IMPLEMENTATION BOARD
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Developer Tasks
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            Sprint backlog, pending bugs, feature development, and architecture tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              openAIDrawer(
                'Generate 5 technical developer tasks with acceptance criteria and time estimates for user authentication',
              )
            }
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          >
            AI Tasks
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="!bg-developer-500 hover:!bg-developer-600 shadow-glow-emerald"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-2xl bg-bg-surface border border-border-base">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-bg-base/70 border border-border-base rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-hover"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-bg-base p-1 rounded-xl border border-border-base">
            {(['all', 'todo', 'in_progress', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-developer-500/20 text-developer-300 font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-bg-base border border-border-base rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-xs text-text-muted">
            No implementation tasks found matching filters.
          </Card>
        ) : (
          filtered.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <Card
                key={task.id}
                className={`p-4 border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group ${
                  isCompleted
                    ? 'bg-bg-surface/50 border-border-base/40 opacity-60'
                    : 'bg-bg-surface border-border-base hover:border-developer-500/40 hover:bg-bg-elevated/40'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({
                        id: task.id,
                        status: isCompleted ? 'todo' : 'completed',
                      })
                    }
                    className="mt-0.5 text-text-muted hover:text-developer-400 transition-colors"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        isCompleted
                          ? 'text-developer-400 fill-developer-400/20'
                          : 'text-text-muted'
                      }`}
                    />
                  </button>

                  <div className="min-w-0 space-y-1">
                    <h3
                      className={`text-sm font-bold ${
                        isCompleted
                          ? 'line-through text-text-muted'
                          : 'text-text-primary'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-text-muted line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-text-faint pt-0.5 flex-wrap">
                      {task.project_title && (
                        <span className="flex items-center gap-1 text-developer-300">
                          <FolderGit2 className="w-3 h-3" />
                          {task.project_title}
                        </span>
                      )}

                      {task.estimated_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimated_minutes} min
                        </span>
                      )}

                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(task.id)}
                    className="p-1.5 text-text-faint hover:text-danger rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Implementation Task"
        description="Schedule a technical deliverable in your sprint pipeline"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add rate-limiting middleware to /api/v1/auth"
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical implementation details, files involved..."
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Associated Project
              </label>
              <select
                value={projectId || ''}
                onChange={(e) =>
                  setProjectId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Est. Minutes
              </label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                min={5}
                step={15}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border-base">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-developer-500 hover:!bg-developer-600 font-semibold"
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
