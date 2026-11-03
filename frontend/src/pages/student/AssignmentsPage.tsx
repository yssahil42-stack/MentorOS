import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { cn } from '../../utils/cn';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';

export default function AssignmentsPage() {
  const { openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  // Query tasks strictly for student
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
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
          ? 'Assignment submitted & marked complete! 🎓'
          : 'Assignment status updated',
        'success'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Assignment removed', 'info');
    },
  });

  if (isLoading) {
    return <LoadingSkeleton className="h-96 w-full rounded-2xl" />;
  }

  // Derive unique courses from tasks e.g. [CS401], [MATH302]
  const courses = Array.from(
    new Set(
      tasks
        .map((t) => {
          const match = t.title.match(/\[([A-Za-z0-9]+)\]/);
          return match ? match[1] : null;
        })
        .filter((c): c is string => Boolean(c))
    )
  );

  const filtered = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCourse =
      courseFilter === 'all' || t.title.toLowerCase().includes(`[${courseFilter.toLowerCase()}]`);
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* ─── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-solar-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-solar-500/15 border border-solar-500/30 text-solar-500 shadow-glow-solar">
                <ClipboardList className="w-5 h-5" />
              </span>
              <span className="text-2xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/25">
                COURSEWORK &amp; DELIVERABLES
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Assignments &amp; Homework Deliverables
            </h1>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
              Track upcoming problem sets, lab reports, essay submissions, and manage grading priorities.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCaptureModal('manual')}
              className="border-border-base hover:border-solar-500/50"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Assignment
            </Button>
            <Button
              size="sm"
              onClick={() => openCaptureModal('ai')}
              className="bg-solar-500 hover:bg-solar-600 text-white shadow-glow-solar"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Capture via AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Metric Highlights ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-muted uppercase">Pending</span>
          <p className="text-2xl font-extrabold font-mono text-solar-500 mt-1">{pendingCount}</p>
          <span className="text-3xs text-text-faint">Active submissions</span>
        </Card>
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-muted uppercase">Submitted / Done</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-500 mt-1">{completedCount}</p>
          <span className="text-3xs text-text-faint">Completed deliverables</span>
        </Card>
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-muted uppercase">Urgent Priority</span>
          <p className="text-2xl font-extrabold font-mono text-danger mt-1">
            {tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length}
          </p>
          <span className="text-3xs text-text-faint">Due within 48h</span>
        </Card>
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-muted uppercase">Total Enrolled Courses</span>
          <p className="text-2xl font-extrabold font-mono text-text-primary mt-1">
            {courses.length > 0 ? courses.length : 3}
          </p>
          <span className="text-3xs text-text-faint">Active course tags</span>
        </Card>
      </div>

      {/* ─── Search & Filters Bar ──────────────────────────────────── */}
      <Card className="p-4 border-border-base flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by title or keyword…"
            className="w-full h-9 pl-9 pr-3 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 focus:ring-1 focus:ring-solar-500 text-text-primary placeholder:text-text-faint"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Course:</span>
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="h-9 px-3 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 text-text-primary"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 text-text-primary"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* ─── Assignments List ──────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center border-border-base space-y-3">
            <ClipboardList className="w-10 h-10 text-text-muted mx-auto opacity-50" />
            <h3 className="text-base font-bold text-text-primary">No assignments found</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              No coursework matches your current search or course filters.
            </p>
            <Button
              size="sm"
              onClick={() => openCaptureModal('ai')}
              className="bg-solar-500 hover:bg-solar-600 text-white shadow-glow-solar"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Add via AI Assistant
            </Button>
          </Card>
        ) : (
          filtered.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <Card
                key={task.id}
                className={cn(
                  'p-4 border-border-base hover:border-solar-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  isCompleted && 'opacity-70 bg-bg-surface/50'
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({
                        id: task.id,
                        status: isCompleted ? 'todo' : 'completed',
                      })
                    }
                    className="mt-0.5 shrink-0 text-text-muted hover:text-solar-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg"
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <CheckCircle2
                      className={cn(
                        'w-5 h-5 transition-transform hover:scale-110',
                        isCompleted ? 'text-emerald-500 fill-emerald-500/20' : 'text-text-muted'
                      )}
                    />
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={cn(
                          'text-sm font-bold text-text-primary truncate',
                          isCompleted && 'line-through text-text-muted'
                        )}
                      >
                        {task.title}
                      </h4>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>

                    {task.description && (
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-2xs text-text-muted pt-1 flex-wrap font-medium">
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-solar-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due: {task.due_date}</span>
                        </span>
                      )}
                      {task.estimated_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Est: {task.estimated_minutes}m</span>
                        </span>
                      )}
                      {task.project_title && (
                        <span className="flex items-center gap-1 text-text-secondary">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{task.project_title}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right action tools */}
                <div className="flex items-center gap-2 shrink-0 sm:self-center justify-end">
                  <Button
                    size="sm"
                    variant={isCompleted ? 'outline' : 'secondary'}
                    onClick={() =>
                      toggleMutation.mutate({
                        id: task.id,
                        status: isCompleted ? 'todo' : 'completed',
                      })
                    }
                    className="text-xs"
                  >
                    {isCompleted ? 'Reopen' : 'Submit / Done'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(task.id)}
                    className="p-2 rounded-xl text-text-faint hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
