import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Flag,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  PieChart,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Kanban,
  ListTodo,
  CheckSquare,
  RotateCcw,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../../services/projectService';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import { useDebounce } from '../../hooks/useDebounce';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/dateUtils';

import type { Project, ProjectStatus, ProjectPriority, Milestone } from '../../types/project';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';

export default function FreelancerProjectsPage() {
  const { openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  // ─── Active Tab Switcher ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'projects' | 'deliverables' | 'tasks'>('projects');

  // ─── Project Filter & Search States ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'progress' | 'target_date'>('updated');
  const [showArchived, setShowArchived] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'planning' as ProjectStatus,
    priority: 'medium' as ProjectPriority,
    target_date: '',
  });

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);

  // ─── Deliverables / Milestone Form State ─────────────────────────────────
  const [quickDeliverableTitle, setQuickDeliverableTitle] = useState('');
  const [quickDeliverableProjectId, setQuickDeliverableProjectId] = useState<number | undefined>(undefined);
  const [quickDeliverableDate, setQuickDeliverableDate] = useState('');

  // ─── Task Form State ──────────────────────────────────────────────────────
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [taskProjectFilter, setTaskProjectFilter] = useState<number | 'all'>('all');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskProjectId, setQuickTaskProjectId] = useState<number | undefined>(undefined);
  const [quickTaskPriority, setQuickTaskPriority] = useState<TaskPriority>('medium');
  const [quickTaskMinutes, setQuickTaskMinutes] = useState(60);

  // ─── Data Queries ─────────────────────────────────────────────────────────
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'freelancer', { page, pageSize: PAGE_SIZE }],
    queryFn: ({ signal }) => fetchProjects({ role: 'freelancer' }, signal),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'freelancer'],
    queryFn: () => fetchMilestones({ role: 'freelancer' }),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'freelancer'],
    queryFn: () => fetchTasks({ role: 'freelancer' }),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusFilter, priorityFilter, sortBy, showArchived]);

  // Set default project IDs once projects load
  useEffect(() => {
    if (projects.length > 0) {
      if (!quickDeliverableProjectId) setQuickDeliverableProjectId(projects[0].id);
      if (!quickTaskProjectId) setQuickTaskProjectId(projects[0].id);
    }
  }, [projects, quickDeliverableProjectId, quickTaskProjectId]);

  // ─── Project Mutations ────────────────────────────────────────────────────
  const createProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      return createProject({
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'planning',
        priority: data.priority || 'medium',
        target_date: data.target_date || null,
        role: 'freelancer',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Client project created!', 'success');
      setEditingProject(null);
    },
    onError: () => {
      showToast('Failed to create project', 'error');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project> & { id: number }) => {
      const { id, ...rest } = data;
      return updateProject(id, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project updated!', 'success');
      setEditingProject(null);
    },
    onError: () => {
      showToast('Failed to update project', 'error');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted', 'success');
    },
    onError: () => {
      showToast('Failed to delete project', 'error');
    },
  });

  // ─── Deliverable Mutations ────────────────────────────────────────────────
  const createDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!quickDeliverableTitle.trim()) return;
      return createMilestone({
        project_id: quickDeliverableProjectId || projects[0]?.id || 1,
        title: quickDeliverableTitle.trim(),
        target_date: quickDeliverableDate || undefined,
        role: 'freelancer',
      });
    },
    onSuccess: () => {
      setQuickDeliverableTitle('');
      setQuickDeliverableDate('');
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Deliverable added! 🎯', 'success');
    },
    onError: () => {
      showToast('Failed to add deliverable', 'error');
    },
  });

  const toggleDeliverableMutation = useMutation({
    mutationFn: async (m: Milestone) => {
      const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
      return updateMilestone(m.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Deliverable status updated', 'success');
    },
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: async (id: number) => deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Deliverable removed', 'info');
    },
  });

  // ─── Task Mutations ───────────────────────────────────────────────────────
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!quickTaskTitle.trim()) return;
      return createTask({
        title: quickTaskTitle.trim(),
        project_id: quickTaskProjectId || projects[0]?.id || null,
        priority: quickTaskPriority,
        estimated_minutes: quickTaskMinutes,
        role: 'freelancer',
        status: 'todo',
      });
    },
    onSuccess: () => {
      setQuickTaskTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Task added! 📋', 'success');
    },
    onError: () => {
      showToast('Failed to create task', 'error');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      return updateTask(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Task status updated', 'success');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Task deleted', 'info');
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    createProjectMutation.mutate(editForm);
    setEditForm({
      title: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      target_date: '',
    });
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editForm.title.trim()) return;
    updateProjectMutation.mutate({ id: editingProject.id, ...editForm });
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      title: project.title,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      target_date: project.target_date ? project.target_date.split('T')[0] : '',
    });
  };

  const handleDeleteProject = (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  // ─── Calculations ─────────────────────────────────────────────────────────
  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const completedMilestonesCount = milestones.filter((m) => m.status === 'completed').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;

  const totalRevenue = projects.reduce((acc, p) => {
    const rate = 85;
    const hours = p.progress ? (p.progress / 100) * 40 : 10;
    return acc + rate * hours;
  }, 0);

  const avgProgress = projects.length
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
    : 0;

  // ─── Filtering Projects ───────────────────────────────────────────────────
  let filteredProjects = projects.filter((p) => {
    if (!showArchived && p.status === 'archived') return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  filteredProjects.sort((a, b) => {
    if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
    if (sortBy === 'target_date') {
      if (!a.target_date) return 1;
      if (!b.target_date) return -1;
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── Filtering Tasks ──────────────────────────────────────────────────────
  const filteredTasks = tasks.filter((t) => {
    if (taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false;
    if (taskProjectFilter !== 'all' && t.project_id !== taskProjectFilter) return false;
    if (taskSearch) {
      const q = taskSearch.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    }
    return true;
  });

  const statusColors: Record<ProjectStatus, string> = {
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const statusLabels: Record<ProjectStatus, string> = {
    planning: 'Planning',
    active: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Delivered',
    archived: 'Archived',
  };

  if (projectsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <LoadingSkeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400">
              <Briefcase className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              CLIENT WORKSPACE SUITE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Projects, Deliverables &amp; Tasks
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Manage client engagements, project deliverables, and execution tasks in one unified workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('deliverables')}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          >
            Deliverables
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('tasks')}
            icon={<CheckSquare className="w-4 h-4 text-amber-500" />}
          >
            Task Board
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProject({
                id: 0,
                user_id: 0,
                role: 'freelancer',
                title: '',
                description: '',
                status: 'planning',
                priority: 'medium',
                target_date: null,
                progress: 0,
                created_at: '',
                updated_at: '',
              } as Project);
            }}
            icon={<Plus className="w-4 h-4" />}
            className="!bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold"
          >
            New Project
          </Button>
        </div>
      </div>

      {/* ─── METRICS ROW ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card3D maxTilt={5} depth={20} variant="glass" className="p-4 sm:p-5 border border-border-base/90 shadow-card">
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Project Tasks</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {projects.length}
            </span>
            <span className="text-xs text-text-muted">total</span>
          </div>
        </Card3D>

        <Card3D maxTilt={5} depth={20} variant="glass" className="p-4 sm:p-5 border border-border-base/90 shadow-card">
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Deliverables</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {completedMilestonesCount}
            </span>
            <span className="text-xs text-text-muted">/ {milestones.length} delivered</span>
          </div>
        </Card3D>

        <Card3D maxTilt={5} depth={20} variant="glass" className="p-4 sm:p-5 border border-border-base/90 shadow-card">
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Client Tasks</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500 border border-cyan-500/25">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {completedTasksCount}
            </span>
            <span className="text-xs text-text-muted">/ {tasks.length} done</span>
          </div>
        </Card3D>

        <Card3D maxTilt={5} depth={20} variant="glass" className="p-4 sm:p-5 border border-border-base/90 shadow-card">
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Avg Progress</span>
            <div className="p-2 rounded-xl bg-solar-500/15 text-solar-500 border border-solar-500/25">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {avgProgress}%
            </span>
          </div>
        </Card3D>

        <Card3D maxTilt={5} depth={20} variant="glass" className="p-4 sm:p-5 border border-border-base/90 shadow-card">
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Pipeline Value</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/25">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              ${(totalRevenue / 1000).toFixed(1)}k
            </span>
          </div>
        </Card3D>
      </div>

      {/* ─── VIEW SWITCHER TABS ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border-base pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects'
              ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-2xs'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Project Tasks</span>
          <span className="text-3xs font-mono px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-base">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliverables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'deliverables'
              ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-2xs'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Deliverables</span>
          <span className="text-3xs font-mono px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-base">
            {milestones.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tasks'
              ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-2xs'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks &amp; Board</span>
          <span className="text-3xs font-mono px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-base">
            {tasks.length}
          </span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CLIENT PROJECTS                                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <Card3D maxTilt={2} depth={15} variant="glass" className="p-4 border border-border-base/80 shadow-card">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                  <Input
                    type="text"
                    placeholder="Search projects..."
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
                    { value: 'planning', label: 'Planning' },
                    { value: 'active', label: 'Active' },
                    { value: 'on_hold', label: 'On Hold' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />

                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                  className="w-full sm:w-40"
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'low', label: 'Low' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                  className="w-40"
                  options={[
                    { value: 'updated', label: 'Last Updated' },
                    { value: 'created', label: 'Creation Date' },
                    { value: 'progress', label: 'Progress' },
                    { value: 'target_date', label: 'Target Date' },
                  ]}
                />
              </div>
            </div>
          </Card3D>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProjects.length === 0 ? (
              <div className="col-span-full card p-12 text-center border-dashed border-border-base">
                <div className="p-4 rounded-2xl bg-bg-surface border border-border-base inline-block mb-4">
                  <Briefcase className="w-12 h-12 text-text-faint mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
                </h3>
                <p className="text-sm text-text-muted mb-6">
                  {projects.length === 0
                    ? 'Create your first client project to get started'
                    : 'Try adjusting your search or filters'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (projects.length === 0) {
                      setEditingProject({
                        id: 0,
                        user_id: 0,
                        role: 'freelancer',
                        title: '',
                        description: '',
                        status: 'active',
                      } as Project);
                    } else {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }
                  }}
                  icon={projects.length === 0 ? <Plus className="w-4 h-4" /> : undefined}
                >
                  {projects.length === 0 ? 'New Project' : 'Clear Filters'}
                </Button>
              </div>
            ) : (
              paginatedProjects.map((project) => (
                <Card3D
                  key={project.id}
                  maxTilt={6}
                  depth={20}
                  variant="secondary"
                  className="p-5 border border-border-base hover:border-amber-500/35 transition-all shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary truncate max-w-[200px]">
                            {project.title}
                          </h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}>
                            {statusLabels[project.status]}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => startEditing(project)}
                          className="text-text-muted hover:text-text-primary"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-text-muted hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mt-4 pt-3 border-t border-border-base/60">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-2xs text-text-muted">
                        <span>Milestones &amp; Progress</span>
                        <span className="font-semibold text-text-primary font-mono">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xs text-text-muted pt-1">
                      {project.target_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          {formatDate(project.target_date)}
                        </span>
                      )}
                      <Link
                        to={`/app/freelancer/client-portal/${project.id}`}
                        className="text-amber-500 hover:text-amber-400 ml-auto flex items-center gap-1 font-semibold"
                      >
                        Client Portal <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <Link
                      to={`/app/freelancer/progress?projectId=${project.id}`}
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-2xs font-semibold text-amber-500 border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all"
                    >
                      <TrendingUp className="w-3 h-3" />
                      View Progress
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card3D>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredProjects.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-bg-surface border border-border-base">
              <span className="text-xs text-text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredProjects.length)} of {filteredProjects.length}
              </span>
              <div className="flex gap-2">
                <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: DELIVERABLES                                                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'deliverables' && (
        <div className="space-y-6">
          {/* Quick Deliverable Creation */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createDeliverableMutation.mutate();
            }}
            className="card p-4 sm:p-5 border-border-base/90 bg-gradient-to-r from-bg-surface via-bg-elevated/40 to-bg-surface shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Add Project Deliverable
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                placeholder="e.g. Design Tokens Spec, Beta API Handover, Final Production Review..."
                value={quickDeliverableTitle}
                onChange={(e) => setQuickDeliverableTitle(e.target.value)}
                className="input text-xs flex-1 px-3 py-2 rounded-xl bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none"
              />
              <select
                value={quickDeliverableProjectId}
                onChange={(e) => setQuickDeliverableProjectId(Number(e.target.value))}
                className="input text-xs sm:w-56 px-3 py-2 rounded-xl bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={quickDeliverableDate}
                onChange={(e) => setQuickDeliverableDate(e.target.value)}
                className="input text-xs sm:w-36 px-2 py-2 rounded-xl bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!quickDeliverableTitle.trim() || createDeliverableMutation.isPending}
                className="shrink-0 text-xs px-4 py-2 !bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Deliverable
              </Button>
            </div>
          </form>

          {/* Deliverables List */}
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <div className="card p-12 text-center border-dashed border-border-base">
                <Clock className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
                <h4 className="text-base font-bold text-text-primary">No client deliverables scheduled</h4>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Add deliverables above to track delivery milestones, client approvals, and invoice-ready checkpoints.
                </p>
              </div>
            ) : (
              milestones.map((m) => {
                const isDone = m.status === 'completed';
                const project = projects.find((p) => p.id === m.project_id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-bg-base/60 border-border-subtle opacity-75'
                        : 'bg-bg-surface border-border-base hover:border-amber-500/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleDeliverableMutation.mutate(m)}
                        className="text-text-muted hover:text-amber-500 shrink-0 transition-colors"
                        title={isDone ? 'Mark in-progress' : 'Mark delivered'}
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${
                            isDone ? 'text-emerald-500 fill-emerald-500/20' : 'text-text-muted hover:text-amber-500'
                          }`}
                        />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isDone ? 'line-through text-text-muted' : 'text-text-primary'
                            }`}
                          >
                            {m.title}
                          </span>
                          {project && (
                            <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 truncate max-w-xs">
                              {project.title}
                            </span>
                          )}
                          <span
                            className={`text-3xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isDone ? 'Delivered' : 'Pending Delivery'}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-text-muted mt-1 truncate">{m.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {m.target_date && (
                        <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          {new Date(m.target_date).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteDeliverableMutation.mutate(m.id)}
                        className="text-text-faint hover:text-danger p-1 rounded transition-colors"
                        title="Remove deliverable"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: TASKS & KANBAN                                                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Quick Task Creation & View Toggle Bar */}
          <div className="card p-4 sm:p-5 border-border-base/90 bg-gradient-to-r from-bg-surface via-bg-elevated/40 to-bg-surface shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Client Task Management
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-bg-base p-1 rounded-xl border border-border-base">
                <button
                  type="button"
                  onClick={() => setTaskViewMode('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    taskViewMode === 'kanban'
                      ? 'bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    taskViewMode === 'list'
                      ? 'bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTaskMutation.mutate();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <input
                type="text"
                placeholder="e.g. Audit checkout flow, Export asset package, Write client status email..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="input text-xs flex-1 px-3 py-2 rounded-xl bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none"
              />
              <select
                value={quickTaskProjectId}
                onChange={(e) => setQuickTaskProjectId(Number(e.target.value))}
                className="input text-xs sm:w-52 px-3 py-2 rounded-xl bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <select
                value={quickTaskPriority}
                onChange={(e) => setQuickTaskPriority(e.target.value as TaskPriority)}
                className="input text-xs sm:w-28 px-3 py-2 rounded-xl bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!quickTaskTitle.trim() || createTaskMutation.isPending}
                className="shrink-0 text-xs px-4 py-2 !bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Task
              </Button>
            </form>
          </div>

          {/* Kanban Mode */}
          {taskViewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  { id: 'todo', label: 'To Do', color: 'border-t-blue-500' },
                  { id: 'in_progress', label: 'In Progress', color: 'border-t-amber-500' },
                  { id: 'completed', label: 'Completed', color: 'border-t-emerald-500' },
                ] as const
              ).map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border border-border-base bg-bg-surface/70 p-4 border-t-4 ${col.color} space-y-3 shadow-2xs`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border-base/50">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="text-3xs font-mono px-2 py-0.5 rounded-full bg-bg-base border border-border-base text-text-muted">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[140px]">
                      {colTasks.length === 0 ? (
                        <div className="text-center py-8 text-3xs text-text-muted italic">
                          No tasks in {col.label}
                        </div>
                      ) : (
                        colTasks.map((t) => {
                          const project = projects.find((p) => p.id === t.project_id);
                          return (
                            <div
                              key={t.id}
                              className="p-3 rounded-xl bg-bg-surface border border-border-base hover:border-amber-500/40 shadow-xs space-y-2 transition-all"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span className="text-xs font-semibold text-text-primary leading-tight">
                                  {t.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteTaskMutation.mutate(t.id)}
                                  className="text-text-faint hover:text-danger p-0.5"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-3xs">
                                {project && (
                                  <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate max-w-[120px]">
                                    {project.title}
                                  </span>
                                )}
                                <PriorityBadge priority={t.priority || 'medium'} />
                              </div>

                              <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-1 text-3xs">
                                <span className="text-text-muted font-mono">{t.estimated_minutes || 60}m</span>
                                <div className="flex items-center gap-1">
                                  {col.id !== 'todo' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prevStatus: Record<string, TaskStatus> = {
                                          in_progress: 'todo',
                                          completed: 'in_progress',
                                        };
                                        updateTaskMutation.mutate({ id: t.id, status: prevStatus[col.id] || 'todo' });
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-bg-elevated hover:bg-bg-base border border-border-base text-text-muted"
                                      title="Move back"
                                    >
                                      ←
                                    </button>
                                  )}
                                  {col.id !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextStatus: Record<string, TaskStatus> = {
                                          todo: 'in_progress',
                                          in_progress: 'completed',
                                        };
                                        updateTaskMutation.mutate({ id: t.id, status: nextStatus[col.id] || 'completed' });
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 font-bold"
                                      title="Move forward"
                                    >
                                      →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Mode */
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="card p-10 text-center border-dashed border-border-base">
                  <CheckSquare className="w-10 h-10 text-amber-500/50 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-text-primary">No tasks found</h4>
                  <p className="text-xs text-text-muted mt-1">Add client tasks above or switch view modes.</p>
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isDone = t.status === 'completed';
                  const project = projects.find((p) => p.id === t.project_id);
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-bg-base/60 border-border-subtle opacity-75'
                          : 'bg-bg-surface border-border-base hover:border-amber-500/30 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateTaskMutation.mutate({
                              id: t.id,
                              status: isDone ? 'todo' : 'completed',
                            })
                          }
                          className="text-text-muted hover:text-amber-500 shrink-0 transition-colors"
                        >
                          <CheckCircle2
                            className={`w-5 h-5 ${
                              isDone ? 'text-emerald-500 fill-emerald-500/20' : 'text-text-muted hover:text-amber-500'
                            }`}
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold truncate ${
                                isDone ? 'line-through text-text-muted' : 'text-text-primary'
                              }`}
                            >
                              {t.title}
                            </span>
                            {project && (
                              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 truncate max-w-xs">
                                {project.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <PriorityBadge priority={t.priority || 'medium'} />
                        <span className="text-3xs text-text-muted font-mono">{t.estimated_minutes || 60}m</span>
                        <button
                          type="button"
                          onClick={() => deleteTaskMutation.mutate(t.id)}
                          className="text-text-faint hover:text-danger p-1 rounded"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE / EDIT PROJECT MODAL ───────────────────────────────── */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card3D
            maxTilt={2}
            depth={25}
            variant="glass"
            className="w-full max-w-lg p-6 border border-border-base/90 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-base">
              <h2 className="text-lg font-bold text-text-primary">
                {editingProject.id === 0 ? 'Create New Client Project' : 'Edit Project Details'}
              </h2>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditingProject(null)}
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              >
                ✕
              </Button>
            </div>

            <form
              onSubmit={editingProject.id === 0 ? handleCreateProject : handleUpdateProject}
              className="space-y-4 pt-4"
            >
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Project Title *
                </label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Client project name"
                  required
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Project scope, deliverables, notes..."
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-500/50 transition-colors resize-y min-h-[80px]"
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Status
                  </label>
                  <Select
                    value={editForm.status}
                    onValueChange={(val) => setEditForm({ ...editForm, status: val as ProjectStatus })}
                    options={[
                      { value: 'planning', label: 'Planning' },
                      { value: 'active', label: 'Active' },
                      { value: 'on_hold', label: 'On Hold' },
                      { value: 'completed', label: 'Completed' },
                    ]}
                    disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Priority
                  </label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(val) => setEditForm({ ...editForm, priority: val as ProjectPriority })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                    disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Target Date
                </label>
                <Input
                  type="date"
                  value={editForm.target_date}
                  onChange={(e) => setEditForm({ ...editForm, target_date: e.target.value })}
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingProject(null)}
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={
                    createProjectMutation.isPending ||
                    updateProjectMutation.isPending ||
                    !editForm.title.trim()
                  }
                  className="!bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold"
                >
                  {createProjectMutation.isPending || updateProjectMutation.isPending
                    ? 'Saving...'
                    : editingProject.id === 0
                      ? 'Create Project'
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
