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
  Sparkles,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { cn } from '../../utils/cn';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';
import type { Project } from '../../types/project';

export default function AssignmentsPage() {
  const { openCaptureModal, openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  // Track expanded roadmap sections with localStorage persistence
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('mentoros_expanded_roadmaps_assignments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Inline quick-add per roadmap
  const [quickAddTitles, setQuickAddTitles] = useState<Record<string, string>>({});

  // Query projects strictly for student (Generated Roadmaps)
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  // Query tasks strictly for student (Subtasks)
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery<Task[]>({
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
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      showToast(
        updated.status === 'completed' ? 'Subtask marked complete! 🎓' : 'Subtask status updated',
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
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      showToast('Subtask removed', 'info');
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
      showToast('New subtask added to roadmap!', 'success');
    },
    onError: () => {
      showToast('Failed to add subtask', 'error');
    },
  });

  if (isProjectsLoading || isTasksLoading) {
    return <LoadingSkeleton className="h-96 w-full rounded-2xl" />;
  }

  const handleClearFilters = () => {
    setSearch('');
    setCourseFilter('all');
    setStatusFilter('all');
  };

  // Derive unique courses from tasks and projects
  const courseOptions = Array.from(
    new Set([
      ...tasks
        .map((t) => {
          const match = t.title.match(/\[([A-Za-z0-9]+)\]/);
          return match ? match[1] : null;
        })
        .filter((c): c is string => Boolean(c)),
      ...projects
        .map((p) => {
          const match = p.title.match(/\[([A-Za-z0-9]+)\]/);
          return match ? match[1] : null;
        })
        .filter((c): c is string => Boolean(c)),
    ])
  );

  // Group tasks inside their corresponding Generated Roadmaps
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
    const projectSubtasks = tasks.filter(
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

  // Collect any orphan tasks without an assigned roadmap
  const matchedTaskIds = new Set(
    roadmapGroups.flatMap((group) => group.subtasks.map((task) => task.id))
  );
  const orphanTasks = tasks.filter((task) => !matchedTaskIds.has(task.id));

  if (orphanTasks.length > 0) {
    const completedCount = orphanTasks.filter((t) => t.status === 'completed').length;
    const totalCount = orphanTasks.length;
    roadmapGroups.push({
      key: 'unassigned',
      projectId: undefined,
      title: 'General Coursework & Independent Tasks',
      description: 'Ad-hoc homework submissions and independent study assignments',
      priority: 'medium',
      targetDate: undefined,
      subtasks: orphanTasks,
      completedCount,
      totalCount,
      progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      isGeneratedRoadmap: false,
    });
  }

  // Filter roadmaps and their subtasks according to search and status filter
  const filteredRoadmaps = roadmapGroups
    .map((group) => {
      const matchesSearchDirect =
        group.title.toLowerCase().includes(search.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(search.toLowerCase()));

      const filteredSubtasks = group.subtasks.filter((task) => {
        const matchesSubtaskSearch =
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesCourse =
          courseFilter === 'all' ||
          task.title.toLowerCase().includes(`[${courseFilter.toLowerCase()}]`) ||
          group.title.toLowerCase().includes(courseFilter.toLowerCase());

        return (matchesSubtaskSearch || matchesSearchDirect) && matchesStatus && matchesCourse;
      });

      return {
        ...group,
        subtasks: filteredSubtasks,
      };
    })
    .filter(
      (group) =>
        group.subtasks.length > 0 ||
        (search.trim() !== '' && group.title.toLowerCase().includes(search.toLowerCase()))
    );

  const totalPendingSubtasks = tasks.filter((t) => t.status !== 'completed').length;
  const totalCompletedSubtasks = tasks.filter((t) => t.status === 'completed').length;
  const totalRoadmapsCount = projects.length;

  const toggleExpand = (key: string) => {
    setExpandedRoadmaps((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };
      try {
        localStorage.setItem('mentoros_expanded_roadmaps_assignments', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const hasActiveFilters = search.trim() !== '' || courseFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* ─── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-solar-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-solar-500/15 border border-solar-500/30 text-solar-500 shadow-glow-solar">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="text-2xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/25">
                COURSEWORK &amp; DELIVERABLES
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Assignments &amp; Course Deliverables
            </h1>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
              All coursework is organized by course. Expand any course to view, track, and manage
              its assignments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCaptureModal('manual')}
              keyboardShortcut="⌘K"
              tooltip="Quick capture (⌘K)"
              className="border-border-base hover:border-solar-500/50"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Assignment
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Metric Highlights ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-secondary uppercase">
            Active Courses
          </span>
          <p className="text-2xl font-extrabold font-mono text-solar-500 mt-1">
            {totalRoadmapsCount}
          </p>
          <span className="text-2xs text-text-muted">Enrolled subjects</span>
        </Card>
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-secondary uppercase">
            Pending Subtasks
          </span>
          <p className="text-2xl font-extrabold font-mono text-amber-500 mt-1">
            {totalPendingSubtasks}
          </p>
          <span className="text-2xs text-text-muted">Incomplete items</span>
        </Card>
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-secondary uppercase">
            Completed Subtasks
          </span>
          <p className="text-2xl font-extrabold font-mono text-emerald-500 mt-1">
            {totalCompletedSubtasks}
          </p>
          <span className="text-2xs text-text-muted">Submitted deliverables</span>
        </Card>
        <Card className="p-4 border-border-base">
          <span className="text-2xs font-semibold text-text-secondary uppercase">
            Urgent Subtasks
          </span>
          <p className="text-2xl font-extrabold font-mono text-danger mt-1">
            {tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length}
          </p>
          <span className="text-2xs text-text-muted">High priority deadlines</span>
        </Card>
      </div>

      {/* ─── Search & Filters Bar ──────────────────────────────────── */}
      <Card className="p-4 border-border-base flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search with 1-click Clear */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roadmaps or subtasks by keyword…"
            className="w-full h-9 pl-9 pr-8 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 focus:ring-1 focus:ring-solar-500 text-text-primary placeholder:text-text-muted"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md focus-visible:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter dropdowns & Reset button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {courseOptions.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Filter className="w-3.5 h-3.5" />
                <span>Course:</span>
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-9 px-3 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 text-text-primary"
              >
                <option value="all">All Courses</option>
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 text-text-primary"
          >
            <option value="all">All Subtask Statuses</option>
            <option value="todo">Pending / To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearFilters}
              className="h-9 text-xs text-text-muted hover:text-solar-500"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* ─── Generated Roadmaps with Nested Subtasks Table ──────────── */}
      <div className="space-y-5">
        {filteredRoadmaps.length === 0 ? (
          <Card className="p-12 text-center border-border-base space-y-3">
            <ClipboardList className="w-10 h-10 text-text-muted mx-auto opacity-50" />
            <h3 className="text-base font-bold text-text-primary">No matching roadmaps found</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              No roadmaps or subtasks match your query. Clear your filters or create a new assignment task.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="border-border-base hover:border-solar-500"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Clear Filters
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => openCaptureModal('manual')}
                className="bg-solar-500 hover:bg-solar-600 text-white shadow-glow-solar"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Assignment
              </Button>
            </div>
          </Card>
        ) : (
          filteredRoadmaps.map((group) => {
            const isExpanded = Boolean(expandedRoadmaps[group.key]);
            const quickAddTitle = quickAddTitles[group.key] || '';
            const subtaskId = `roadmap-subtasks-${group.key}`;

            return (
              <div
                key={group.key}
                className="rounded-2xl border border-border-base bg-bg-surface overflow-hidden shadow-sm transition-all hover:border-solar-500/30"
              >
                {/* ─── Generated Roadmap Title Card (Accessible Accordion Header) ─── */}
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
                  className="p-5 cursor-pointer bg-gradient-to-r from-bg-surface via-bg-elevated/60 to-bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base/60 select-none hover:bg-bg-elevated/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-500"
                >
                  <div className="flex items-start md:items-center gap-3.5 min-w-0">
                    <span
                      aria-label={isExpanded ? 'Collapse roadmap' : 'Expand roadmap'}
                      className="mt-0.5 p-1 rounded-lg text-text-muted hover:text-solar-500 hover:bg-solar-500/10 transition-colors shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-solar-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </span>

                    <div className="p-2.5 rounded-xl bg-solar-500/10 border border-solar-500/20 text-solar-500 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-md bg-solar-500/10 text-solar-500 border border-solar-500/20">
                          {group.isGeneratedRoadmap ? 'COURSE PROJECT' : 'COURSEWORK'}
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

                  {/* Responsive Roadmap Progress & Counter */}
                  <div className="flex items-center gap-4 shrink-0 pl-10 md:pl-0">
                    <div className="flex flex-col items-end w-full sm:w-auto">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-text-primary">
                        <span>
                          {group.completedCount} / {group.totalCount} Done
                        </span>
                        <span className="text-solar-500">({group.progressPercent}%)</span>
                      </div>
                      <div className="w-24 sm:w-36 h-2 bg-bg-base rounded-full overflow-hidden mt-1.5 border border-border-base/50">
                        <div
                          className="h-full bg-gradient-to-r from-solar-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${group.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Subtasks Inside the Roadmap ─── */}
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
                              className={cn(
                                'p-3.5 rounded-xl border border-border-base bg-bg-surface hover:border-solar-500/40 transition-all flex items-center justify-between gap-3',
                                isDone && 'opacity-65 bg-bg-surface/50'
                              )}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                {/* Single Accessible Completion Checkbox */}
                                <button
                                  type="button"
                                  aria-label={
                                    isDone
                                      ? `Mark "${task.title}" as incomplete`
                                      : `Mark "${task.title}" as complete`
                                  }
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      id: task.id,
                                      status: isDone ? 'todo' : 'completed',
                                    })
                                  }
                                  className="mt-0.5 p-1 shrink-0 text-text-muted hover:text-solar-500 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-500"
                                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                                >
                                  <CheckCircle2
                                    className={cn(
                                      'w-5 h-5 transition-transform hover:scale-110',
                                      isDone
                                        ? 'text-emerald-500 fill-emerald-500/20'
                                        : 'text-text-muted'
                                    )}
                                  />
                                </button>

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4
                                      className={cn(
                                        'text-xs sm:text-sm font-bold text-text-primary truncate',
                                        isDone && 'line-through text-text-muted'
                                      )}
                                    >
                                      {task.title}
                                    </h4>
                                    <PriorityBadge priority={task.priority} />
                                    <StatusBadge status={task.status} />
                                  </div>

                                  {task.description && (
                                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4 text-2xs text-text-muted pt-0.5 flex-wrap font-medium">
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
                                  </div>
                                </div>
                              </div>

                              {/* Single Delete Action (Redundant Complete Button Removed) */}
                              <div className="flex items-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => deleteMutation.mutate(task.id)}
                                  aria-label={`Delete subtask "${task.title}"`}
                                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
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

                    {/* ─── Inline Quick-Add Subtask Input ─── */}
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
                        className="flex-1 h-9 px-3.5 rounded-xl text-xs bg-bg-surface border border-border-base focus:border-solar-500 focus:outline-none text-text-primary placeholder:text-text-muted"
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
    </div>
  );
}
