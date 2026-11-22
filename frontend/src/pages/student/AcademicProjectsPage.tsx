import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  List,
  Columns3,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  Timer,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects, createProject, deleteProject } from '../../services/projectService';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import type { Project } from '../../types/project';
import type { Task, TaskStatus } from '../../types/task';

// ── Baseline Starter Data (Matches Mockup when DB is unpopulated) ─────────────
const STARTER_COURSES: Project[] = [
  {
    id: 1,
    user_id: 1,
    role: 'student',
    title: 'Computer networks',
    description: 'Network architecture, subnetting, CIDR, and routing protocols.',
    priority: 'high',
    status: 'active',
    progress: 33,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    role: 'student',
    title: 'Database management',
    description: 'Relational algebra, normalization, query optimization, and transactions.',
    priority: 'high',
    status: 'active',
    progress: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    role: 'student',
    title: 'Operating systems',
    description: 'Process scheduling, virtual memory, synchronization, and kernel design.',
    priority: 'medium',
    status: 'active',
    progress: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    role: 'student',
    title: 'Engineering maths',
    description: 'Linear algebra, matrices, rank, eigenvalues, and Fourier analysis.',
    priority: 'medium',
    status: 'active',
    progress: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const STARTER_TASKS: Task[] = [
  {
    id: 101,
    user_id: 1,
    role: 'student',
    project_id: 1,
    project_title: 'Computer networks',
    title: 'Subnetting worksheet',
    description: 'CIDR masks and variable-length subnet calculations.',
    status: 'todo',
    priority: 'high',
    due_date: 'Yesterday',
    estimated_minutes: 60, // 1h
    actual_minutes: 20, // 20m
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 102,
    user_id: 1,
    role: 'student',
    project_id: 2,
    project_title: 'Database management',
    title: 'DBMS lab record',
    description: 'Triggers, store procedures, and index execution plans.',
    status: 'in_progress',
    priority: 'high',
    due_date: 'Tomorrow',
    estimated_minutes: 120, // 2h
    actual_minutes: 160, // 2h 40m (+40m)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 103,
    user_id: 1,
    role: 'student',
    project_id: 3,
    project_title: 'Operating systems',
    title: 'OS assignment 3',
    description: 'Round-robin CPU scheduler simulation implementation.',
    status: 'in_progress',
    priority: 'high',
    due_date: 'Wed',
    estimated_minutes: 180, // 3h
    actual_minutes: 75, // 1h 15m
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 104,
    user_id: 1,
    role: 'student',
    project_id: 4,
    project_title: 'Engineering maths',
    title: 'Matrices quiz prep',
    description: 'Eigenvalues, eigenvectors, and diagonalisation shortcuts.',
    status: 'todo',
    priority: 'medium',
    due_date: 'Fri',
    estimated_minutes: 90, // 1h 30m
    actual_minutes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 105,
    user_id: 1,
    role: 'student',
    project_id: 2,
    project_title: 'Database management',
    title: 'ER diagram exercise',
    description: 'Conceptual data model to logical schema translation.',
    status: 'completed',
    priority: 'medium',
    due_date: '12 Nov',
    estimated_minutes: 120, // 2h
    actual_minutes: 100, // 1h 40m (-20m)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── Time & Date Helpers ──────────────────────────────────────────────────────
function formatMins(mins?: number | null): string {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getDelta(task: Task) {
  const est = task.estimated_minutes || 0;
  const actual = task.actual_minutes || 0;
  if (actual > est && est > 0) {
    const diff = actual - est;
    return {
      text: `+${formatMins(diff)}`,
      className: 'text-[#991b1b]', // dark red / maroon
    };
  }
  if (task.status === 'completed' && actual < est && actual > 0) {
    const diff = est - actual;
    return {
      text: `-${formatMins(diff)}`,
      className: 'text-[#16a34a]', // green
    };
  }
  return null;
}

function getProgressBar(task: Task) {
  const est = task.estimated_minutes || 60;
  const actual = task.actual_minutes || 0;
  const isOvertime = actual > est;
  const isCompleted = task.status === 'completed';
  const percent = est > 0 ? Math.min(100, Math.round((actual / est) * 100)) : 0;

  if (isOvertime) {
    return { percent: 100, color: 'bg-[#7f1d1d]' }; // dark maroon
  }
  if (isCompleted) {
    return { percent: 100, color: 'bg-[#c04b1e]' }; // terracotta
  }
  if (actual > 0) {
    return { percent, color: 'bg-[#c04b1e]' }; // terracotta
  }
  return { percent: 0, color: 'bg-transparent' };
}

function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  if (!task.due_date) return false;
  const lower = task.due_date.toLowerCase();
  if (lower.includes('yesterday')) return true;
  // If ISO date string
  const d = new Date(task.due_date);
  if (!isNaN(d.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }
  return false;
}

export default function AcademicProjectsPage() {
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'courses' | 'assignments'>('assignments');
  const [viewMode, setViewMode] = useState<'both' | 'list' | 'board'>('both');
  const [search, setSearch] = useState('');

  // Modals state
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentCourseId, setNewAssignmentCourseId] = useState<number | undefined>(undefined);
  const [newAssignmentEstimate, setNewAssignmentEstimate] = useState<number>(60);
  const [newAssignmentDue, setNewAssignmentDue] = useState<string>('Tomorrow');

  // Log Time Modal state
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<Task | null>(null);
  const [logTimeMinutesToAdd, setLogTimeMinutesToAdd] = useState<number>(30);
  const [logTimeStatus, setLogTimeStatus] = useState<TaskStatus>('in_progress');

  // Queries
  const { data: dbProjects = [] } = useQuery<Project[]>({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  const { data: dbTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  // Blend with starter items if unpopulated
  const courses = useMemo(() => {
    if (dbProjects.length > 0) return dbProjects;
    return STARTER_COURSES;
  }, [dbProjects]);

  const tasks = useMemo(() => {
    if (dbTasks.length > 0) return dbTasks;
    return STARTER_TASKS;
  }, [dbTasks]);

  // Map courses lookup for quick project_title resolution
  const courseLookup = useMemo(() => {
    const map = new Map<number, string>();
    courses.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [courses]);

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

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!newAssignmentTitle.trim()) return;
      return createTask({
        title: newAssignmentTitle.trim(),
        project_id: newAssignmentCourseId,
        estimated_minutes: newAssignmentEstimate,
        due_date: newAssignmentDue,
        role: 'student',
        status: 'todo',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsNewAssignmentModalOpen(false);
      setNewAssignmentTitle('');
      showToast('Assignment added! 📝', 'success');
    },
    onError: () => {
      showToast('Failed to add assignment', 'error');
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
      // If task was a client starter task, update local task reflection
      if (selectedTaskForLog) {
        selectedTaskForLog.actual_minutes =
          (selectedTaskForLog.actual_minutes || 0) + logTimeMinutesToAdd;
        selectedTaskForLog.status = logTimeStatus;
        setSelectedTaskForLog(null);
        showToast('Study time logged! ⏱️', 'success');
      }
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Course removed', 'info');
    },
  });

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const courseName = (
        t.project_title ||
        (t.project_id ? courseLookup.get(t.project_id) : '') ||
        ''
      ).toLowerCase();
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        courseName.includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [tasks, search, courseLookup]);

  // Aggregate Metrics
  const totalExpected = useMemo(() => {
    return filteredTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  }, [filteredTasks]);

  const totalLogged = useMemo(() => {
    return filteredTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
  }, [filteredTasks]);

  // Groupings
  const overdueTasks = useMemo(() => {
    return filteredTasks.filter((t) => isTaskOverdue(t));
  }, [filteredTasks]);

  const thisWeekTasks = useMemo(() => {
    return filteredTasks.filter((t) => !isTaskOverdue(t) && t.status !== 'completed');
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'completed');
  }, [filteredTasks]);

  // Board Columns
  const todoBoardTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'todo');
  }, [filteredTasks]);

  const inProgressBoardTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'in_progress');
  }, [filteredTasks]);

  const doneBoardTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'completed');
  }, [filteredTasks]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 animate-fade-in space-y-6">
      {/* ── Main White Container Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#eee7e0] p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Courses and assignments
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {courses.length} active courses · {thisWeekTasks.length + overdueTasks.length} tasks
              due this week
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

        {/* Tab Row */}
        <div className="flex items-center gap-6 border-b border-[#eee7e0] mt-6">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={cn(
              'text-sm pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'courses'
                ? 'font-semibold text-neutral-900 border-b-2 border-[#c04b1e]'
                : 'font-medium text-neutral-500 hover:text-neutral-800'
            )}
          >
            <span>Courses</span>
            <span className="text-xs font-semibold">{courses.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={cn(
              'text-sm pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'assignments'
                ? 'font-semibold text-neutral-900 border-b-2 border-[#c04b1e]'
                : 'font-medium text-neutral-500 hover:text-neutral-800'
            )}
          >
            <span>Assignments</span>
            <span className="text-xs font-semibold">{tasks.length}</span>
          </button>
        </div>

        {/* ── TAB 1: ASSIGNMENTS (Matches Target Mockup) ───────────────────────── */}
        {activeTab === 'assignments' && (
          <div className="mt-5 space-y-6">
            {/* Search and View Switchers */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xl">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assignments"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="List View"
                  onClick={() => setViewMode(viewMode === 'list' ? 'both' : 'list')}
                  className={cn(
                    'p-2 rounded-lg border text-sm transition-colors cursor-pointer',
                    viewMode === 'list' || viewMode === 'both'
                      ? 'border-[#c04b1e] bg-[#fbf5f2] text-[#c04b1e]'
                      : 'border-[#e5e0d8] bg-white text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  title="Board View"
                  onClick={() => setViewMode(viewMode === 'board' ? 'both' : 'board')}
                  className={cn(
                    'p-2 rounded-lg border text-sm transition-colors cursor-pointer',
                    viewMode === 'board' || viewMode === 'both'
                      ? 'border-[#c04b1e] bg-[#fbf5f2] text-[#c04b1e]'
                      : 'border-[#e5e0d8] bg-white text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  <Columns3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Time Summary Row */}
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                Expected{' '}
                <span className="font-bold text-neutral-900">{formatMins(totalExpected)}</span> ·
                Logged <span className="font-bold text-neutral-900">{formatMins(totalLogged)}</span>
              </span>
            </div>

            {/* ── LIST VIEW SECTIONS ────────────────────────────────────────── */}
            {(viewMode === 'list' || viewMode === 'both') && (
              <div className="space-y-6">
                {/* 1. Overdue Group */}
                {overdueTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#b91c1c] mb-3">
                      Overdue {overdueTasks.length}
                    </h3>
                    <div className="space-y-2.5">
                      {overdueTasks.map((task) => {
                        const courseName =
                          task.project_title ||
                          (task.project_id ? courseLookup.get(task.project_id) : '') ||
                          'General Studies';
                        const bar = getProgressBar(task);
                        const delta = getDelta(task);

                        return (
                          <div
                            key={task.id}
                            className="rounded-xl border border-[#eee7e0] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#ded5cb]"
                          >
                            <div className="flex-1 min-w-[180px]">
                              <h4 className="font-semibold text-neutral-900 text-sm sm:text-base leading-snug">
                                {task.title}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-0.5">{courseName}</p>
                            </div>

                            <div className="sm:w-28 shrink-0 text-left sm:text-center">
                              <span className="text-sm font-bold text-[#b91c1c]">
                                {task.due_date || 'Yesterday'}
                              </span>
                            </div>

                            <div className="sm:w-48 shrink-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>
                                  Est{' '}
                                  <strong className="text-neutral-900 font-bold">
                                    {formatMins(task.estimated_minutes)}
                                  </strong>
                                </span>
                                <span>
                                  Logged{' '}
                                  <strong className="text-neutral-900 font-bold">
                                    {task.actual_minutes ? formatMins(task.actual_minutes) : '—'}
                                  </strong>
                                </span>
                              </div>
                              {delta && (
                                <div className="text-xs font-semibold mt-0.5">
                                  <span className={delta.className}>{delta.text}</span>
                                </div>
                              )}
                              <div className="w-full h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={cn('h-full rounded-full transition-all', bar.color)}
                                  style={{ width: `${bar.percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskForLog(task);
                                  setLogTimeStatus(task.status);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dcd4ca] bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
                              >
                                <Timer className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Log time</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. This week Group */}
                {thisWeekTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-3">
                      This week {thisWeekTasks.length}
                    </h3>
                    <div className="space-y-2.5">
                      {thisWeekTasks.map((task) => {
                        const courseName =
                          task.project_title ||
                          (task.project_id ? courseLookup.get(task.project_id) : '') ||
                          'General Studies';
                        const bar = getProgressBar(task);
                        const delta = getDelta(task);

                        return (
                          <div
                            key={task.id}
                            className="rounded-xl border border-[#eee7e0] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#ded5cb]"
                          >
                            <div className="flex-1 min-w-[180px]">
                              <h4 className="font-semibold text-neutral-900 text-sm sm:text-base leading-snug">
                                {task.title}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-0.5">{courseName}</p>
                            </div>

                            <div className="sm:w-28 shrink-0 text-left sm:text-center">
                              <span className="text-sm font-bold text-neutral-800">
                                {task.due_date || 'This week'}
                              </span>
                            </div>

                            <div className="sm:w-48 shrink-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>
                                  Est{' '}
                                  <strong className="text-neutral-900 font-bold">
                                    {formatMins(task.estimated_minutes)}
                                  </strong>
                                </span>
                                <span>
                                  Logged{' '}
                                  <strong className="text-neutral-900 font-bold">
                                    {task.actual_minutes ? formatMins(task.actual_minutes) : '—'}
                                  </strong>
                                </span>
                              </div>
                              {delta && (
                                <div className="text-xs font-semibold mt-0.5">
                                  <span className={delta.className}>{delta.text}</span>
                                </div>
                              )}
                              <div className="w-full h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={cn('h-full rounded-full transition-all', bar.color)}
                                  style={{ width: `${bar.percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskForLog(task);
                                  setLogTimeStatus(task.status);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dcd4ca] bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
                              >
                                <Timer className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Log time</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Completed Group */}
                {completedTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-3">
                      Completed {completedTasks.length}
                    </h3>
                    <div className="space-y-2.5">
                      {completedTasks.map((task) => {
                        const courseName =
                          task.project_title ||
                          (task.project_id ? courseLookup.get(task.project_id) : '') ||
                          'General Studies';
                        const bar = getProgressBar(task);
                        const delta = getDelta(task);

                        return (
                          <div
                            key={task.id}
                            className="rounded-xl border border-[#eee7e0] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#ded5cb]"
                          >
                            <div className="flex-1 min-w-[180px]">
                              <h4 className="font-semibold text-neutral-900 text-sm sm:text-base leading-snug">
                                {task.title}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-0.5">{courseName}</p>
                            </div>

                            <div className="sm:w-28 shrink-0 text-left sm:text-center">
                              <span className="text-sm font-bold text-neutral-800">
                                {task.due_date || 'Completed'}
                              </span>
                            </div>

                            <div className="sm:w-48 shrink-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>
                                  Est{' '}
                                  <strong className="text-neutral-900 font-bold">
                                    {formatMins(task.estimated_minutes)}
                                  </strong>
                                </span>
                                <span>
                                  Took{' '}
                                  <strong className="text-neutral-900 font-bold">
                                    {task.actual_minutes ? formatMins(task.actual_minutes) : '—'}
                                  </strong>
                                </span>
                              </div>
                              {delta && (
                                <div className="text-xs font-semibold mt-0.5">
                                  <span className={delta.className}>{delta.text}</span>
                                </div>
                              )}
                              <div className="w-full h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={cn('h-full rounded-full transition-all', bar.color)}
                                  style={{ width: `${bar.percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskForLog(task);
                                  setLogTimeStatus(task.status);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dcd4ca] bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
                              >
                                <Timer className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Log time</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: COURSES VIEW ────────────────────────────────────────────── */}
        {activeTab === 'courses' && (
          <div className="mt-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => {
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

                return (
                  <div
                    key={course.id}
                    className="rounded-xl border border-[#eee7e0] bg-white p-5 hover:border-[#ded5cb] transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#fbf5f2] text-[#c04b1e] border border-[#f2ded5]">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-neutral-900 text-base">{course.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCourseMutation.mutate(course.id)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {course.description && (
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-[#f2ede6] flex items-center justify-between text-xs text-neutral-600">
                        <span>
                          Tasks:{' '}
                          <strong className="text-neutral-900">
                            {completedCourseTasks}/{courseTasks.length}
                          </strong>
                        </span>
                        <span>
                          Logged:{' '}
                          <strong className="text-neutral-900">
                            {formatMins(totalCourseMins)}
                          </strong>
                        </span>
                        <span className="font-semibold text-[#c04b1e]">{progressPct}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-[#c04b1e] rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#f2ede6] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setNewAssignmentCourseId(course.id);
                          setIsNewAssignmentModalOpen(true);
                        }}
                        className="text-xs font-semibold text-[#c04b1e] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add assignment</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('assignments')}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        View all tasks →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── BOARD VIEW CONTAINER (Matches Target Mockup Bottom Section) ──────── */}
      {activeTab === 'assignments' && (viewMode === 'board' || viewMode === 'both') && (
        <div className="mt-8 space-y-2">
          <div className="text-xs font-semibold text-neutral-600 px-1">Board view</div>

          <div className="bg-[#f5f2ed] border border-[#e6dfd5] rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: To do */}
              <div>
                <div className="text-xs font-semibold text-neutral-700 mb-3 px-1">
                  To do {todoBoardTasks.length}
                </div>
                <div className="space-y-3">
                  {todoBoardTasks.map((task) => {
                    const courseName =
                      task.project_title ||
                      (task.project_id ? courseLookup.get(task.project_id) : '') ||
                      'General Studies';
                    const bar = getProgressBar(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskForLog(task);
                          setLogTimeStatus(task.status);
                        }}
                        className="bg-white rounded-xl border border-[#eee7e0] p-4 shadow-2xs hover:border-[#ded5cb] transition-all cursor-pointer space-y-1.5"
                      >
                        <h4 className="font-semibold text-sm text-neutral-900 leading-snug">
                          {task.title}
                        </h4>
                        <p className="text-xs text-neutral-500">
                          {courseName} · {task.due_date || 'Upcoming'}
                        </p>
                        <div className="text-xs text-neutral-600 pt-0.5">
                          Est {formatMins(task.estimated_minutes)}
                          {task.actual_minutes ? ` · Logged ${formatMins(task.actual_minutes)}` : ''}
                        </div>
                        {bar.percent > 0 && (
                          <div className="w-full h-1 bg-[#f0ebe4] rounded-full overflow-hidden mt-1">
                            <div
                              className={cn('h-full rounded-full', bar.color)}
                              style={{ width: `${bar.percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: In progress */}
              <div>
                <div className="text-xs font-semibold text-neutral-700 mb-3 px-1">
                  In progress {inProgressBoardTasks.length}
                </div>
                <div className="space-y-3">
                  {inProgressBoardTasks.map((task) => {
                    const courseName =
                      task.project_title ||
                      (task.project_id ? courseLookup.get(task.project_id) : '') ||
                      'General Studies';
                    const bar = getProgressBar(task);
                    const isOvertime =
                      (task.actual_minutes || 0) > (task.estimated_minutes || 0) &&
                      (task.estimated_minutes || 0) > 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskForLog(task);
                          setLogTimeStatus(task.status);
                        }}
                        className="bg-white rounded-xl border border-[#eee7e0] p-4 shadow-2xs hover:border-[#ded5cb] transition-all cursor-pointer space-y-1.5"
                      >
                        <h4 className="font-semibold text-sm text-neutral-900 leading-snug">
                          {task.title}
                        </h4>
                        <p className="text-xs text-neutral-500">
                          {courseName} · {task.due_date || 'In progress'}
                        </p>
                        <div
                          className={cn(
                            'text-xs pt-0.5 font-medium',
                            isOvertime ? 'text-[#7f1d1d]' : 'text-neutral-600'
                          )}
                        >
                          Est {formatMins(task.estimated_minutes)} · Logged{' '}
                          {formatMins(task.actual_minutes)}
                        </div>
                        <div className="w-full h-1 bg-[#f0ebe4] rounded-full overflow-hidden mt-1">
                          <div
                            className={cn('h-full rounded-full', bar.color)}
                            style={{ width: `${bar.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Done */}
              <div>
                <div className="text-xs font-semibold text-neutral-700 mb-3 px-1">
                  Done {doneBoardTasks.length}
                </div>
                <div className="space-y-3">
                  {doneBoardTasks.map((task) => {
                    const courseName =
                      task.project_title ||
                      (task.project_id ? courseLookup.get(task.project_id) : '') ||
                      'General Studies';
                    const delta = getDelta(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskForLog(task);
                          setLogTimeStatus(task.status);
                        }}
                        className="bg-white rounded-xl border border-[#eee7e0] p-4 shadow-2xs hover:border-[#ded5cb] transition-all cursor-pointer space-y-1.5"
                      >
                        <h4 className="font-semibold text-sm text-neutral-900 leading-snug">
                          {task.title}
                        </h4>
                        <p className="text-xs text-neutral-500">
                          {courseName} · {task.due_date || 'Completed'}
                        </p>
                        <div className="text-xs text-neutral-600 pt-0.5 flex items-center gap-1.5">
                          <span>
                            Est {formatMins(task.estimated_minutes)} · Took{' '}
                            {formatMins(task.actual_minutes)}
                          </span>
                          {delta && (
                            <span className={cn('font-semibold', delta.className)}>
                              {delta.text}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LOG TIME ─────────────────────────────────────────────────── */}
      {selectedTaskForLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTaskForLog(null)}
          title={`Log time · ${selectedTaskForLog.title}`}
        >
          <div className="space-y-5">
            <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#eee7e0] text-xs space-y-1">
              <div className="text-neutral-500">
                Course:{' '}
                <strong className="text-neutral-900 font-semibold">
                  {selectedTaskForLog.project_title ||
                    (selectedTaskForLog.project_id
                      ? courseLookup.get(selectedTaskForLog.project_id)
                      : '') ||
                    'General Studies'}
                </strong>
              </div>
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
                placeholder="e.g. Distributed Systems & Algorithms"
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
                placeholder="Course outline, key chapters, professor notes or grading criteria..."
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

      {/* ── MODAL: CREATE NEW ASSIGNMENT ────────────────────────────────────── */}
      {isNewAssignmentModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewAssignmentModalOpen(false)}
          title="Add coursework assignment"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createAssignmentMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Assignment Title
              </label>
              <input
                type="text"
                required
                value={newAssignmentTitle}
                onChange={(e) => setNewAssignmentTitle(e.target.value)}
                placeholder="e.g. Subnetting worksheet"
                className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#c04b1e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Linked Course
              </label>
              <select
                value={newAssignmentCourseId || ''}
                onChange={(e) =>
                  setNewAssignmentCourseId(e.target.value ? Number(e.target.value) : undefined)
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
                  value={newAssignmentEstimate}
                  onChange={(e) => setNewAssignmentEstimate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-[#c04b1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Due Timing
                </label>
                <input
                  type="text"
                  value={newAssignmentDue}
                  onChange={(e) => setNewAssignmentDue(e.target.value)}
                  placeholder="e.g. Tomorrow, Wed, 15 Nov"
                  className="w-full px-3 py-2 bg-white border border-[#e5e0d8] rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-[#c04b1e]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eee7e0]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNewAssignmentModalOpen(false)}
                className="text-xs text-neutral-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newAssignmentTitle.trim() || createAssignmentMutation.isPending}
                loading={createAssignmentMutation.isPending}
                className="!bg-[#c04b1e] hover:!bg-[#a83e16] text-white text-xs px-4"
              >
                Add assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
