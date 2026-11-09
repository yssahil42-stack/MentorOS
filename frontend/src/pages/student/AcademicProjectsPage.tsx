import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Filter,
  Trash2,
  Award,
  ChevronRight,
  ChevronDown,
  FileText,
  ClipboardList,
  Check,
  Layers,
  ListTodo,
  Target,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../../services/projectService';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Project, ProjectPriority, Milestone } from '../../types/project';
import type { TaskStatus } from '../../types/task';

export default function AcademicProjectsPage() {
  const { openAIDrawer, openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'courses' | 'assignments'>('courses');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Assignment tab filtering & quick add
  const [assignmentFilterStatus, setAssignmentFilterStatus] = useState<string>('all');
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState<string>('all');
  const [assignmentSearch, setAssignmentSearch] = useState<string>('');
  const [quickAssignmentTitle, setQuickAssignmentTitle] = useState<string>('');
  const [quickAssignmentCourseId, setQuickAssignmentCourseId] = useState<number | undefined>(undefined);
  const [quickAssignmentMinutes, setQuickAssignmentMinutes] = useState<number>(60);

  // New Project Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<ProjectPriority>('high');
  const [newTargetDate, setNewTargetDate] = useState('');

  // New Milestone Form State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeProjectForMilestone, setActiveProjectForMilestone] = useState<number | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneTargetDate, setMilestoneTargetDate] = useState('');

  // Phase Expansion & Quick Task State
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Record<number, boolean>>({});
  const [newTaskTitleByMilestone, setNewTaskTitleByMilestone] = useState<Record<number, string>>({});

  const toggleMilestoneExpand = (milestoneId: number) => {
    setExpandedMilestoneIds((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }));
  };

  const formatPhaseTime = (mins: number) => {
    if (mins <= 0) return 'Time: 0m';
    return `Time: ${mins}m`;
  };

  // Fetch strictly role: 'student' projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', 'student'],
    queryFn: () => fetchMilestones(),
  });

  // Fetch tasks to dynamically compute real-time milestone and project progress
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return createProject({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        target_date: newTargetDate,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Academic project created successfully! 🎓', 'success');
    },
    onError: () => {
      showToast('Failed to create academic project', 'error');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Project removed', 'info');
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectForMilestone) return;
      return createMilestone({
        project_id: activeProjectForMilestone,
        title: milestoneTitle,
        target_date: milestoneTargetDate,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsMilestoneModalOpen(false);
      setMilestoneTitle('');
      setMilestoneTargetDate('');
      setActiveProjectForMilestone(null);
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Academic milestone added!', 'success');
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async (m: Milestone) => {
      const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
      return updateMilestone(m.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone status updated!', 'success');
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone removed', 'info');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      return updateTask(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task status updated!', 'success');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; project_id: number; description: string }) => {
      return createTask({
        title: data.title,
        project_id: data.project_id,
        description: data.description,
        priority: 'medium',
        role: 'student',
        status: 'todo',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task added to phase!', 'success');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task deleted', 'info');
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!quickAssignmentTitle.trim()) return;
      return createTask({
        title: quickAssignmentTitle.trim(),
        project_id: quickAssignmentCourseId,
        estimated_minutes: quickAssignmentMinutes,
        role: 'student',
      });
    },
    onSuccess: () => {
      setQuickAssignmentTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Coursework assignment added! 📝', 'success');
    },
    onError: () => {
      showToast('Failed to add assignment', 'error');
    },
  });

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAssignments = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(assignmentSearch.toLowerCase()));
    const matchesStatus =
      assignmentFilterStatus === 'all' ||
      (assignmentFilterStatus === 'completed' && t.status === 'completed') ||
      (assignmentFilterStatus === 'todo' && t.status === 'todo') ||
      (assignmentFilterStatus === 'in_progress' && t.status === 'in_progress');
    const matchesCourse =
      assignmentCourseFilter === 'all' || String(t.project_id) === String(assignmentCourseFilter);
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const avgProgress = projects.length
    ? Math.round(
        projects.reduce((acc, p) => {
          const pTasks = tasks.filter(
            (t) =>
              t.project_id === p.id ||
              (t.project_title &&
                t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
          );
          const pProg =
            pTasks.length > 0
              ? Math.round(
                  (pTasks.filter((t) => t.status === 'completed').length / pTasks.length) * 100
                )
              : p.progress || 0;
          return acc + pProg;
        }, 0) / projects.length
      )
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-student-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-student-500/15 border border-student-500/25 text-student-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-student-500/10 text-student-300 border border-student-500/20">
                COURSES &amp; COURSEWORK SUITE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Courses &amp; Assignments
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Track course roadmaps, research phases, milestone deliverables, and coursework assignments in one integrated workspace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('assignments')}
              icon={<ClipboardList className="w-4 h-4 text-student-400" />}
            >
              Assignments View
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="!bg-solar-500 hover:!bg-solar-600 shadow-glow-solar"
              icon={<Plus className="w-4 h-4" />}
            >
              New Course
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-student-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Enrolled Courses</span>
            <BookOpen className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">{projects.length}</div>
          <p className="text-2xs text-text-muted mt-1">Active academic syllabi</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Coursework Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {completedTasksCount}{' '}
            <span className="text-xs font-normal text-text-muted">/ {tasks.length}</span>
          </div>
          <p className="text-2xs text-amber-400 mt-1">
            {tasks.length ? Math.round((completedTasksCount / tasks.length) * 100) : 0}% assignments
            finished
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Overall Progress</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">{avgProgress}%</div>
          <p className="text-2xs text-emerald-400 mt-1">Across all courses</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Pending Deadlines</span>
            <Target className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {tasks.length - completedTasksCount}
          </div>
          <p className="text-2xs text-orange-500 dark:text-orange-400 mt-1">Remaining assignments</p>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border-base pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'courses'
              ? 'bg-student-500/15 text-student-400 border border-student-500/30 shadow-2xs'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Courses &amp; Milestones ({projects.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assignments'
              ? 'bg-student-500/15 text-student-400 border border-student-500/30 shadow-2xs'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Coursework Assignments ({tasks.length})</span>
        </button>
      </div>

      {activeTab === 'courses' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-base">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search academic projects..."
            className="w-full pl-9 pr-4 py-2 bg-bg-base/80 border border-border-base rounded-xl text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-student-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
          {(['all', 'active', 'planning', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? 'bg-student-500/20 text-student-300 border border-student-500/30'
                  : 'bg-bg-base text-text-muted hover:text-text-primary border border-border-base'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List / Grid */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : filteredProjects.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-border-base">
          <GraduationCap className="w-12 h-12 text-student-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-text-primary">No academic projects found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1 mb-4">
            Create your first capstone project, thesis outline, or term paper deliverable to track
            research milestones.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Project Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProjects.map((project) => {
            const projectMilestones = milestones.filter((m) => m.project_id === project.id);
            const isExpanded = selectedProjectId === project.id;
            const projTasks = tasks.filter(
              (t) =>
                t.project_id === project.id ||
                (t.project_title &&
                  t.project_title.trim().toLowerCase() === project.title.trim().toLowerCase())
            );
            const completedProjTasks = projTasks.filter((t) => t.status === 'completed').length;
            const totalProjTasks = projTasks.length;
            const dynamicProgress =
              totalProjTasks > 0
                ? Math.round((completedProjTasks / totalProjTasks) * 100)
                : projectMilestones.length > 0
                  ? Math.round(
                      (projectMilestones.filter((m) => m.status === 'completed').length /
                        projectMilestones.length) *
                        100
                    )
                  : project.progress || 0;

            return (
              <Card
                key={project.id}
                className="p-5 flex flex-col justify-between hover:border-student-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-text-primary group-hover:text-student-400 transition-colors">
                        {project.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => deleteProjectMutation.mutate(project.id)}
                      className="p-1.5 text-text-faint hover:text-red-400 rounded-lg hover:bg-bg-elevated transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {project.description && (
                    <p className="text-xs text-text-muted mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-2xs font-semibold">
                      <span className="text-text-muted">Research Progress</span>
                      <span className="text-student-400 font-mono font-bold">
                        {dynamicProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                      <div
                        className="bg-gradient-to-r from-student-500 via-amber-400 to-student-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${dynamicProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta: Target date & milestones */}
                  <div className="mt-4 flex items-center justify-between text-2xs text-text-muted border-t border-border-base/60 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-student-400" />
                      {project.target_date
                        ? `Target: ${new Date(project.target_date).toLocaleDateString()}`
                        : 'No set deadline'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      {projectMilestones.length} milestones
                    </span>
                  </div>

                  {/* Milestones Preview or Expand */}
                  <div className="mt-3">
                    <button
                      onClick={() => setSelectedProjectId(isExpanded ? null : project.id)}
                      className="text-xs font-semibold text-student-300 hover:text-student-200 flex items-center gap-1 py-1"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                      {isExpanded ? 'Hide Milestones' : 'View Milestones & Roadmap'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2 bg-bg-base/70 p-3 rounded-xl border border-border-base">
                        <div className="flex items-center justify-between pb-1 border-b border-border-base/50">
                          <span className="text-2xs font-bold text-text-secondary uppercase">
                            Research Phases
                          </span>
                          <button
                            onClick={() => {
                              setActiveProjectForMilestone(project.id);
                              setIsMilestoneModalOpen(true);
                            }}
                            className="text-2xs font-semibold text-student-400 hover:text-student-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Phase
                          </button>
                        </div>

                        {projectMilestones.length === 0 ? (
                          <p className="text-2xs text-text-faint py-2 text-center">
                            No milestones yet. Click "+ Add Phase" or use AI to generate.
                          </p>
                        ) : (
                          projectMilestones.map((m, mIdx) => {
                            const isDone = m.status === 'completed';
                            // Calculate subtasks belonging to this phase
                            const phaseTasks = projTasks.filter((t, tIdx) => {
                              const desc = (t.description || '').toLowerCase();
                              const title = (t.title || '').toLowerCase();
                              const mTitle = (m.title || '').toLowerCase();
                              if (
                                desc.includes(`phase ${mIdx + 1}`) ||
                                title.includes(`phase ${mIdx + 1}`)
                              )
                                return true;
                              if (mTitle && (desc.includes(mTitle) || title.includes(mTitle)))
                                return true;
                              return tIdx % Math.max(projectMilestones.length, 1) === mIdx;
                            });
                            const phaseCompleted = phaseTasks.filter(
                              (t) => t.status === 'completed'
                            ).length;
                            const phaseProgress =
                              phaseTasks.length > 0
                                ? Math.round((phaseCompleted / phaseTasks.length) * 100)
                                : isDone
                                  ? 100
                                  : 0;
                            const phaseMinutes = phaseTasks.reduce(
                              (sum, t) => sum + (Number(t.estimated_minutes) || 60),
                              0
                            );

                            const isMilestoneExpanded = !!expandedMilestoneIds[m.id];

                            return (
                              <div
                                key={m.id}
                                className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
                                  isMilestoneExpanded
                                    ? 'border-student-500/40 bg-white dark:bg-bg-surface shadow-sm'
                                    : 'border-border-base/70 bg-bg-surface/90 hover:border-student-500/30'
                                }`}
                              >
                                {/* Phase Header (Clickable to open/close) */}
                                <div
                                  onClick={() => toggleMilestoneExpand(m.id)}
                                  className="flex items-center justify-between gap-2.5 p-3 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-bg-elevated/40 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMilestoneMutation.mutate(m);
                                      }}
                                      className="text-text-muted hover:text-student-400 p-0.5 rounded transition-colors shrink-0"
                                      title={isDone ? 'Mark pending' : 'Mark completed'}
                                    >
                                      <CheckCircle2
                                        className={`w-4 h-4 ${
                                          isDone
                                            ? 'text-student-400 fill-student-400/20'
                                            : 'text-text-muted hover:text-student-400'
                                        }`}
                                      />
                                    </button>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`font-semibold text-xs truncate ${
                                            isDone
                                              ? 'line-through text-text-muted'
                                              : 'text-text-primary'
                                          }`}
                                        >
                                          {m.title}
                                        </span>
                                        <span
                                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                                            isDone
                                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                          }`}
                                        >
                                          {isDone ? 'completed' : m.status || 'in progress'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="flex items-center gap-1 text-3xs font-semibold text-student-700 dark:text-student-300 bg-student-500/10 px-2.5 py-0.5 rounded-md border border-student-500/20">
                                      <Clock className="w-3 h-3 text-student-500" />
                                      <span>{formatPhaseTime(phaseMinutes)}</span>
                                    </span>
                                    <span className="text-3xs font-mono font-bold text-student-400 bg-student-500/10 px-2 py-0.5 rounded-md border border-student-500/20">
                                      {phaseProgress}%
                                    </span>
                                    <ChevronDown
                                      className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                                        isMilestoneExpanded ? 'rotate-180 text-student-400' : ''
                                      }`}
                                    />
                                  </div>
                                </div>

                                {/* Progress Bar strip */}
                                <div className="px-3 pb-2.5 pt-0">
                                  <div className="flex items-center justify-between text-3xs text-text-muted pb-1">
                                    <span className="text-2xs font-medium text-text-secondary">
                                      {isMilestoneExpanded ? 'Phase Progress' : 'Click to view phase tasks'}
                                    </span>
                                    <span className="font-mono font-medium">
                                      {phaseCompleted}/{phaseTasks.length} tasks
                                    </span>
                                  </div>
                                  <div className="w-full bg-bg-base h-1.5 rounded-full overflow-hidden border border-border-subtle">
                                    <div
                                      className="bg-gradient-to-r from-student-400 to-amber-500 h-full rounded-full transition-all duration-300"
                                      style={{ width: `${phaseProgress}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Expanded Phase Content (Shows tasks, details, quick-add, and actions) */}
                                {isMilestoneExpanded && (
                                  <div className="p-3.5 pt-2 border-t border-border-base/70 bg-slate-50/50 dark:bg-bg-elevated/20 space-y-3">
                                    {/* Phase Description / Scope if available */}
                                    {m.description && (
                                      <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle text-xs text-text-secondary leading-relaxed">
                                        <span className="text-2xs font-bold uppercase text-text-muted tracking-wider block mb-0.5">
                                          Phase Focus &amp; Scope
                                        </span>
                                        {m.description}
                                      </div>
                                    )}

                                    {/* Deliverables & Tasks Header */}
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-2xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                        <span>Phase Deliverables &amp; Tasks</span>
                                        <span className="px-1.5 py-0.2 rounded-full bg-bg-elevated text-text-muted text-3xs border border-border-subtle font-mono">
                                          {phaseTasks.length}
                                        </span>
                                      </span>
                                      <span className="text-3xs text-text-faint">
                                        Click checkbox to toggle completion
                                      </span>
                                    </div>

                                    {/* Task Checklist */}
                                    <div className="space-y-1.5">
                                      {phaseTasks.length === 0 ? (
                                        <div className="p-3 text-center rounded-lg border border-dashed border-border-base text-2xs text-text-faint">
                                          No tasks or deliverables assigned to this phase yet. Add the first task below.
                                        </div>
                                      ) : (
                                        phaseTasks.map((task) => {
                                          const isTaskDone = task.status === 'completed';
                                          return (
                                            <div
                                              key={task.id}
                                              className={`flex items-center justify-between gap-2.5 p-2.5 rounded-lg border transition-all ${
                                                isTaskDone
                                                  ? 'bg-bg-base/60 border-border-subtle opacity-75'
                                                  : 'bg-bg-surface border-border-base/80 hover:border-student-500/30'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    updateTaskMutation.mutate({
                                                      id: task.id,
                                                      status: isTaskDone ? 'todo' : 'completed',
                                                    })
                                                  }
                                                  className="text-text-muted hover:text-student-400 shrink-0 transition-colors"
                                                  title={isTaskDone ? 'Mark incomplete' : 'Mark complete'}
                                                >
                                                  <CheckCircle2
                                                    className={`w-4 h-4 ${
                                                      isTaskDone
                                                        ? 'text-student-400 fill-student-400/20'
                                                        : 'text-text-muted hover:text-student-400'
                                                    }`}
                                                  />
                                                </button>
                                                <span
                                                  className={`text-xs font-medium truncate ${
                                                    isTaskDone ? 'line-through text-text-muted' : 'text-text-primary'
                                                  }`}
                                                >
                                                  {task.title}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2 shrink-0">
                                                {task.estimated_minutes ? (
                                                  <span className="text-3xs text-text-muted flex items-center gap-1 bg-slate-100 dark:bg-bg-elevated px-2 py-0.5 rounded-md border border-border-subtle font-mono">
                                                    <Clock className="w-3 h-3 text-student-400" />
                                                    {task.estimated_minutes}m
                                                  </span>
                                                ) : null}
                                                {task.priority && task.priority !== 'medium' && (
                                                  <PriorityBadge priority={task.priority} />
                                                )}
                                                {task.due_date && (
                                                  <span className="text-3xs text-text-faint flex items-center gap-1 font-mono">
                                                    <Clock className="w-3 h-3 text-amber-400" />
                                                    {new Date(task.due_date).toLocaleDateString()}
                                                  </span>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => deleteTaskMutation.mutate(task.id)}
                                                  className="text-text-faint hover:text-danger p-1 rounded transition-colors"
                                                  title="Remove task"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    {/* Quick Add Task to Phase */}
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        const title = (newTaskTitleByMilestone[m.id] || '').trim();
                                        if (!title) return;
                                        createTaskMutation.mutate({
                                          title,
                                          project_id: project.id,
                                          description: `Phase ${mIdx + 1}: ${m.title}`,
                                        });
                                        setNewTaskTitleByMilestone((prev) => ({ ...prev, [m.id]: '' }));
                                      }}
                                      className="flex items-center gap-2 pt-1"
                                    >
                                      <input
                                        type="text"
                                        value={newTaskTitleByMilestone[m.id] || ''}
                                        onChange={(e) =>
                                          setNewTaskTitleByMilestone((prev) => ({
                                            ...prev,
                                            [m.id]: e.target.value,
                                          }))
                                        }
                                        placeholder={`Add new assignment or task to ${m.title}...`}
                                        className="flex-1 bg-bg-surface border border-border-base rounded-xl px-3 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-student-400"
                                      />
                                      <Button
                                        type="submit"
                                        size="sm"
                                        variant="primary"
                                        disabled={!(newTaskTitleByMilestone[m.id] || '').trim() || createTaskMutation.isPending}
                                        className="shrink-0 text-xs px-3 py-1.5"
                                        icon={<Plus className="w-3.5 h-3.5" />}
                                      >
                                        Add Task
                                      </Button>
                                    </form>

                                    {/* Phase Footer Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70 text-2xs text-text-muted flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 font-mono text-student-600 dark:text-student-400 font-semibold text-2xs">
                                          <Clock className="w-3.5 h-3.5 text-student-500" />
                                          {formatPhaseTime(phaseMinutes)} required
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => toggleMilestoneMutation.mutate(m)}
                                          className="text-student-400 hover:underline font-semibold"
                                        >
                                          {isDone ? 'Mark as In Progress' : 'Mark Phase Completed'}
                                        </button>
                                        <span className="text-border-base">•</span>
                                        <button
                                          type="button"
                                          onClick={() => deleteMilestoneMutation.mutate(m.id)}
                                          className="text-text-muted hover:text-danger transition-colors"
                                        >
                                          Delete Phase
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-2xs text-student-400 hover:text-student-300"
                      onClick={() => {
                        setActiveProjectForMilestone(project.id);
                        setIsMilestoneModalOpen(true);
                      }}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add Milestone
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-2xs text-solar-500 hover:text-solar-400 font-semibold"
                      onClick={() =>
                        openAIDrawer(
                          `Draft a portfolio case study and LinkedIn post for completed project: "${project.title}". Highlight key milestones, technical takeaways, and deliverables.`
                        )
                      }
                      icon={<FileText className="w-3 h-3" />}
                    >
                      Draft Case Study / Post
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  ) : (
    <div className="space-y-4">
      {/* Assignment Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-base">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={assignmentSearch}
            onChange={(e) => setAssignmentSearch(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-9 pr-4 py-2 bg-bg-base/80 border border-border-base rounded-xl text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-student-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={assignmentCourseFilter}
            onChange={(e) => setAssignmentCourseFilter(e.target.value)}
            className="bg-bg-base text-text-primary text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-student-500"
          >
            <option value="all">All Courses ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.title}
              </option>
            ))}
          </select>

          {(['all', 'todo', 'in_progress', 'completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setAssignmentFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                assignmentFilterStatus === st
                  ? 'bg-student-500/20 text-student-300 border border-student-500/30'
                  : 'bg-bg-base text-text-muted hover:text-text-primary border border-border-base'
              }`}
            >
              {st === 'in_progress' ? 'In Progress' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Assignment Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createAssignmentMutation.mutate();
        }}
        className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-bg-surface rounded-xl border border-border-base"
      >
        <input
          type="text"
          value={quickAssignmentTitle}
          onChange={(e) => setQuickAssignmentTitle(e.target.value)}
          placeholder="Add coursework assignment or study task..."
          className="flex-1 w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-student-400"
        />
        <select
          value={quickAssignmentCourseId || ''}
          onChange={(e) =>
            setQuickAssignmentCourseId(e.target.value ? Number(e.target.value) : undefined)
          }
          className="w-full sm:w-44 bg-bg-base text-xs border border-border-base rounded-xl px-3 py-2 text-text-primary focus:outline-none"
        >
          <option value="">Course (Optional)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="number"
            min={5}
            step={5}
            value={quickAssignmentMinutes}
            onChange={(e) => setQuickAssignmentMinutes(Number(e.target.value))}
            placeholder="Mins"
            className="w-20 bg-bg-base border border-border-base rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none text-center font-mono"
            title="Estimated minutes"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!quickAssignmentTitle.trim() || createAssignmentMutation.isPending}
            className="shrink-0 text-xs px-4 py-2"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Assignment
          </Button>
        </div>
      </form>

      {/* Assignment Items List */}
      <div className="space-y-2">
        {filteredAssignments.length === 0 ? (
          <div className="card p-10 text-center border-dashed border-border-base">
            <ClipboardList className="w-10 h-10 text-student-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-text-primary">No coursework assignments found</h4>
            <p className="text-xs text-text-muted mt-1">
              Add coursework assignments above or create deliverables directly inside course phases.
            </p>
          </div>
        ) : (
          filteredAssignments.map((task) => {
            const isDone = task.status === 'completed';
            const course = projects.find((p) => p.id === task.project_id);
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-bg-base/60 border-border-subtle opacity-75'
                    : 'bg-bg-surface border-border-base hover:border-student-500/30 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateTaskMutation.mutate({
                        id: task.id,
                        status: isDone ? 'todo' : 'completed',
                      })
                    }
                    className="text-text-muted hover:text-student-400 shrink-0 transition-colors"
                    title={isDone ? 'Mark incomplete' : 'Mark complete'}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        isDone
                          ? 'text-student-400 fill-student-400/20'
                          : 'text-text-muted hover:text-student-400'
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
                        {task.title}
                      </span>
                      {course && (
                        <span className="text-[10px] font-semibold text-student-400 bg-student-500/10 px-2 py-0.5 rounded-md border border-student-500/20 truncate max-w-xs">
                          {course.title}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-3xs text-text-muted mt-0.5 truncate">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.estimated_minutes ? (
                    <span className="text-3xs text-text-muted flex items-center gap-1 bg-slate-100 dark:bg-bg-elevated px-2 py-0.5 rounded-md border border-border-subtle font-mono">
                      <Clock className="w-3 h-3 text-student-400" />
                      {task.estimated_minutes}m
                    </span>
                  ) : null}
                  {task.priority && task.priority !== 'medium' && (
                    <PriorityBadge priority={task.priority} />
                  )}
                  {task.due_date && (
                    <span className="text-3xs text-text-faint flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="text-text-faint hover:text-danger p-1 rounded transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Academic Project / Thesis"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            createProjectMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Project / Paper Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Simulator in Rust"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Course / Abstract / Description
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Capstone deliverable for CS-480. Involves Raft consensus implementation, benchmark harness, and latex evaluation report."
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as ProjectPriority)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              >
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Target Submission Date
              </label>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              ></input>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
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
              disabled={!newTitle.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Saving...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Add Academic Milestone"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!milestoneTitle.trim()) return;
            createMilestoneMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Milestone / Deliverable Title *
            </label>
            <input
              type="text"
              required
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="e.g. Complete Literature Review Draft"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              value={milestoneTargetDate}
              onChange={(e) => setMilestoneTargetDate(e.target.value)}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsMilestoneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
              disabled={!milestoneTitle.trim() || createMilestoneMutation.isPending}
            >
              Add Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
