import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  X,
  Timer,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects, createProject, deleteProject } from '../../services/projectService';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import type { Project } from '../../types/project';
import type { Task, TaskStatus } from '../../types/task';

// ── Time & Date Helpers ──────────────────────────────────────────────────────
function formatMins(mins?: number | null): string {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  if (!task.due_date) return false;
  const lower = task.due_date.toLowerCase();
  if (lower.includes('yesterday')) return true;
  const d = new Date(task.due_date);
  if (!isNaN(d.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }
  return false;
}

export default function AcademicProjectsPage() {
  const navigate = useNavigate();
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Record<number, boolean>>({});

  // Modals state
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCourseId, setNewTaskCourseId] = useState<number | undefined>(undefined);
  const [newTaskEstimate, setNewTaskEstimate] = useState<number>(60);
  const [newTaskDue, setNewTaskDue] = useState<string>('Tomorrow');

  // Log Time Modal state
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<Task | null>(null);
  const [logTimeMinutesToAdd, setLogTimeMinutesToAdd] = useState<number>(30);
  const [logTimeStatus, setLogTimeStatus] = useState<TaskStatus>('in_progress');

  // Queries - Real user data ONLY, never fallback to hallucinated/mock data
  const { data: dbProjects = [], isLoading: isLoadingCourses } = useQuery<Project[]>({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  const { data: dbTasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  const courses = dbProjects;
  const tasks = dbTasks;

  // Toggle course expanded view (default open if only 1 or 2 courses)
  const isCourseExpanded = (courseId: number) => {
    if (expandedCourses[courseId] !== undefined) {
      return expandedCourses[courseId];
    }
    // Auto-expand courses by default so tasks are immediately visible
    return true;
  };

  const toggleCourseExpand = (courseId: number) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !isCourseExpanded(courseId),
    }));
  };

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [courses, search]);

  // Real course tasks due this week
  const dueThisWeekCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const isBelongingToCourse = courses.some(
        (c) =>
          c.id === t.project_id ||
          (t.project_title && t.project_title.trim().toLowerCase() === c.title.trim().toLowerCase())
      );
      return isBelongingToCourse && !isTaskOverdue(t);
    }).length;
  }, [tasks, courses]);

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: async () => {
      if (!newCourseTitle.trim()) return;
      return createProject({
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim(),
        role: 'student',
        priority: 'high',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsNewCourseModalOpen(false);
      setNewCourseTitle('');
      setNewCourseDesc('');
      showToast('Course created successfully! 🎓', 'success');
    },
    onError: () => {
      showToast('Failed to create course', 'error');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!newTaskTitle.trim()) return;
      return createTask({
        title: newTaskTitle.trim(),
        project_id: newTaskCourseId,
        estimated_minutes: newTaskEstimate,
        due_date: newTaskDue,
        role: 'student',
        status: 'todo',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      showToast('Task added to course! 📝', 'success');
    },
    onError: () => {
      showToast('Failed to add task', 'error');
    },
  });

  const toggleTaskStatusMutation = useMutation({
    mutationFn: async (task: Task) => {
      const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
      return updateTask(task.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task updated!', 'success');
    },
    onError: () => {
      showToast('Failed to update task status', 'error');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task removed', 'info');
    },
    onError: () => {
      showToast('Failed to delete task', 'error');
    },
  });

  const logTimeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskForLog) return;
      const currentActual = selectedTaskForLog.actual_minutes || 0;
      const updatedActual = currentActual + logTimeMinutesToAdd;
      return updateTask(selectedTaskForLog.id, {
        actual_minutes: updatedActual,
        status: logTimeStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTaskForLog(null);
      showToast('Study time logged! ⏱️', 'success');
    },
    onError: () => {
      showToast('Failed to log time', 'error');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Course removed', 'info');
    },
    onError: () => {
      showToast('Failed to delete course', 'error');
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 animate-fade-in space-y-6">
      {/* ── Main Container Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#eee7e0] p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Courses
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {courses.length === 0
                ? 'No active courses yet · Get started by creating your first course or generating an academic roadmap with AI'
                : `${courses.length} active course${courses.length === 1 ? '' : 's'}${
                    dueThisWeekCount > 0 ? ` · ${dueThisWeekCount} tasks due this week` : ' · 0 tasks due this week'
                  }`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewCourseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c04b1e] hover:bg-[#a83e16] text-white text-sm font-medium transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New course</span>
            </button>
          </div>
        </div>

        {/* Search bar (when courses exist) */}
        {courses.length > 0 && (
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e]"
              />
            </div>
          </div>
        )}

        {/* ── COURSES LIST ─────────────────────────────────────────────────── */}
        <div className="mt-6 space-y-5">
          {isLoadingCourses ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              Loading courses...
            </div>
          ) : filteredCourses.length === 0 && courses.length > 0 ? (
            <div className="py-10 text-center text-sm text-neutral-500">
              No courses matching &quot;{search}&quot;
            </div>
          ) : courses.length === 0 ? (
            /* Clean Empty State */
            <div className="rounded-2xl border border-dashed border-[#e6dfd5] p-8 sm:p-12 text-center space-y-4 bg-[#faf8f5]">
              <div className="w-12 h-12 rounded-2xl bg-[#fbf5f2] border border-[#f2ded5] text-[#c04b1e] flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-6 h-6 text-[#c04b1e]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-neutral-900">Start your academic roadmap</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Track your semester subjects, milestone tasks, and study progress with structured clarity.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCourseModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#c04b1e] hover:bg-[#a83e16] text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create course</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/student/ai-planner')}
                  className="px-4 py-2 rounded-lg bg-white border border-[#ded5cb] text-neutral-700 hover:bg-neutral-50 text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-[#c04b1e]" />
                  <span>Generate with AI</span>
                </button>
              </div>
            </div>
          ) : (
            filteredCourses.map((course) => {
              // Strictly verify tasks belonging to this specific course only
              const courseTasks = tasks.filter(
                (t) =>
                  t.project_id === course.id ||
                  (t.project_title &&
                    t.project_title.trim().toLowerCase() === course.title.trim().toLowerCase())
              );
              const completedCourseTasks = courseTasks.filter(
                (t) => t.status === 'completed'
              ).length;
              const totalCourseMins = courseTasks.reduce(
                (sum, t) => sum + (t.actual_minutes || 0),
                0
              );
              const progressPct =
                courseTasks.length > 0
                  ? Math.round((completedCourseTasks / courseTasks.length) * 100)
                  : course.progress || 0;
              const expanded = isCourseExpanded(course.id);

              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-[#eee7e0] bg-white p-5 sm:p-6 hover:border-[#ded5cb] transition-all shadow-2xs space-y-4"
                >
                  {/* Top Bar of Course Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-xl bg-[#fbf5f2] text-[#c04b1e] border border-[#f2ded5] shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="font-bold text-neutral-900 text-base leading-snug">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-3 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleCourseExpand(course.id)}
                        className="text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 rounded-lg hover:bg-neutral-100"
                        title={expanded ? 'Collapse tasks' : 'Expand tasks'}
                      >
                        {expanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete course "${course.title}"?`)) {
                            deleteCourseMutation.mutate(course.id);
                          }
                        }}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Progress & Metrics Row */}
                  <div className="pt-2 border-t border-[#f2ede6] space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-600">
                      <div className="flex items-center gap-4">
                        <span>
                          Tasks:{' '}
                          <strong className="text-neutral-900 font-semibold">
                            {completedCourseTasks}/{courseTasks.length}
                          </strong>
                        </span>
                        <span>
                          Time Logged:{' '}
                          <strong className="text-neutral-900 font-semibold">
                            {formatMins(totalCourseMins)}
                          </strong>
                        </span>
                      </div>
                      <span className="font-bold text-[#c04b1e]">{progressPct}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c04b1e] rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Milestone Tasks Section */}
                  {expanded && (
                    <div className="pt-3 border-t border-[#f2ede6] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          Milestone Tasks ({courseTasks.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTaskCourseId(course.id);
                            setIsNewTaskModalOpen(true);
                          }}
                          className="text-xs font-semibold text-[#c04b1e] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add task</span>
                        </button>
                      </div>

                      {courseTasks.length === 0 ? (
                        <div className="py-4 px-3 rounded-lg bg-[#faf8f5] border border-dashed border-[#e6dfd5] text-center text-xs text-neutral-500">
                          No tasks created for this course yet.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setNewTaskCourseId(course.id);
                              setIsNewTaskModalOpen(true);
                            }}
                            className="font-semibold text-[#c04b1e] hover:underline cursor-pointer"
                          >
                            Add a task
                          </button>{' '}
                          to start tracking your milestones.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {courseTasks.map((task) => {
                            const isCompleted = task.status === 'completed';
                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  'flex items-center justify-between gap-3 p-3 rounded-xl border transition-all',
                                  isCompleted
                                    ? 'bg-[#faf8f5] border-[#eee7e0] text-neutral-400'
                                    : 'bg-white border-[#eee7e0] hover:border-[#ded5cb] text-neutral-800'
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Tickmark / Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskStatusMutation.mutate(task)}
                                    className="shrink-0 cursor-pointer text-neutral-400 hover:text-[#c04b1e] transition-colors"
                                    title={isCompleted ? 'Mark as to do' : 'Mark as done'}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5 text-[#c04b1e]" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-neutral-300 hover:text-[#c04b1e]" />
                                    )}
                                  </button>

                                  <div className="min-w-0">
                                    <span
                                      className={cn(
                                        'text-xs sm:text-sm font-medium leading-snug block truncate',
                                        isCompleted
                                          ? 'line-through text-neutral-400'
                                          : 'text-neutral-900'
                                      )}
                                    >
                                      {task.title}
                                    </span>
                                    <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 mt-0.5">
                                      {task.due_date && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-neutral-400" />
                                          <span>{task.due_date}</span>
                                        </span>
                                      )}
                                      <span>
                                        Est {formatMins(task.estimated_minutes)}
                                        {task.actual_minutes ? ` · Logged ${formatMins(task.actual_minutes)}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTaskForLog(task);
                                      setLogTimeStatus(task.status);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e5e0d8] bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
                                    title="Log study time"
                                  >
                                    <Timer className="w-3 h-3 text-neutral-500" />
                                    <span>Log time</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    className="p-1 text-neutral-400 hover:text-red-600 transition-colors rounded"
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── MODAL: LOG TIME ─────────────────────────────────────────────────── */}
      {selectedTaskForLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTaskForLog(null)}
          title={`Log study time · ${selectedTaskForLog.title}`}
        >
          <div className="space-y-5">
            <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#eee7e0] text-xs space-y-1">
              <div className="text-neutral-500">
                Current:{' '}
                <strong className="text-neutral-900 font-semibold">
                  {formatMins(selectedTaskForLog.actual_minutes)}
                </strong>{' '}
                logged of{' '}
                <strong className="text-neutral-900 font-semibold">
                  {formatMins(selectedTaskForLog.estimated_minutes)}
                </strong>{' '}
                expected
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Add study time
              </label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {[15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setLogTimeMinutesToAdd(mins)}
                    className={cn(
                      'py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                      logTimeMinutesToAdd === mins
                        ? 'border-[#c04b1e] bg-[#fbf5f2] text-[#c04b1e]'
                        : 'border-[#e5e0d8] bg-white text-neutral-700 hover:bg-neutral-50'
                    )}
                  >
                    +{formatMins(mins)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={5}
                  value={logTimeMinutesToAdd}
                  onChange={(e) => setLogTimeMinutesToAdd(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 text-center font-mono focus:outline-none focus:border-[#c04b1e]"
                />
                <span className="text-xs text-neutral-500">minutes to record</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Update status
              </label>
              <div className="flex items-center gap-2">
                {(['todo', 'in_progress', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLogTimeStatus(st)}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border capitalize transition-all cursor-pointer',
                      logTimeStatus === st
                        ? 'border-[#c04b1e] bg-[#fbf5f2] text-[#c04b1e]'
                        : 'border-[#e5e0d8] bg-white text-neutral-600 hover:bg-neutral-50'
                    )}
                  >
                    {st === 'in_progress' ? 'In progress' : st === 'completed' ? 'Done' : 'To do'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eee7e0]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTaskForLog(null)}
                className="text-xs text-neutral-600"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => logTimeMutation.mutate()}
                loading={logTimeMutation.isPending}
                className="!bg-[#c04b1e] hover:!bg-[#a83e16] text-white text-xs px-4"
              >
                Save time
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: CREATE NEW COURSE ────────────────────────────────────────── */}
      {isNewCourseModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewCourseModalOpen(false)}
          title="Create new course"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCourseMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Course Title
              </label>
              <input
                type="text"
                required
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="e.g. Python &amp; Data Science Fundamentals"
                className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#c04b1e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Syllabus &amp; Focus (Optional)
              </label>
              <textarea
                rows={3}
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                placeholder="Course outline, key chapters, notes or milestones..."
                className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#c04b1e]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eee7e0]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNewCourseModalOpen(false)}
                className="text-xs text-neutral-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newCourseTitle.trim() || createCourseMutation.isPending}
                loading={createCourseMutation.isPending}
                className="!bg-[#c04b1e] hover:!bg-[#a83e16] text-white text-xs px-4"
              >
                Create course
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: CREATE NEW TASK ────────────────────────────────────────── */}
      {isNewTaskModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewTaskModalOpen(false)}
          title="Add task to course"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createTaskMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Week 1: Python Basics &amp; Exercises"
                className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#c04b1e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Linked Course
              </label>
              <select
                value={newTaskCourseId || ''}
                onChange={(e) =>
                  setNewTaskCourseId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-[#c04b1e]"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Est Minutes
                </label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-[#c04b1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Due Timing
                </label>
                <input
                  type="text"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  placeholder="e.g. Tomorrow, Fri, Week 1"
                  className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-[#c04b1e]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eee7e0]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-xs text-neutral-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                loading={createTaskMutation.isPending}
                className="!bg-[#c04b1e] hover:!bg-[#a83e16] text-white text-xs px-4"
              >
                Add task
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
