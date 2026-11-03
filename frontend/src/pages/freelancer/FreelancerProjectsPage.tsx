import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Sparkles,
  Flag,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  MoreVertical,
  Building2,
  PieChart,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/dateUtils';

import type { Project, ProjectStatus, ProjectPriority } from '../../types/project';

export default function FreelancerProjectsPage() {
  const { openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'progress' | 'target_date'>(
    'updated'
  );
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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', 'freelancer', { page, pageSize: PAGE_SIZE }],
    queryFn: ({ signal }) => fetchProjects({ role: 'freelancer' }, signal),
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, priorityFilter, sortBy, showArchived]);

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
      showToast('Project created!', 'success');
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

  const handleDeleteProject = (id: number) => {
    if (
      window.confirm('Are you sure you want to delete this project? This action cannot be undone.')
    ) {
      deleteProjectMutation.mutate(id);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      title: project.title,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      target_date: project.target_date
        ? new Date(project.target_date).toISOString().split('T')[0]
        : '',
    });
  };

  const filteredProjects = projects
    .filter((p) => {
      if (!showArchived && p.status === 'completed') return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'progress':
          return b.progress - a.progress;
        case 'target_date':
          if (!a.target_date && !b.target_date) return 0;
          if (!a.target_date) return 1;
          if (!b.target_date) return -1;
          return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeProjects = projects.filter((p) => p.status !== 'completed');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const totalRevenue = projects.reduce((sum, p) => sum + p.progress * 100, 0);
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0;

  const statusLabels: Record<string, string> = {
    planning: 'Planning',
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
    archived: 'Archived',
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton variant="card" className="h-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="card" className="h-80" />
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
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Briefcase className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              CLIENT PORTFOLIO
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">Client Projects</h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Manage client engagements, track deliverables, and monitor project health.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => openCaptureModal('ai')}
            className="bg-orange-500 hover:bg-orange-600 font-bold px-5 h-10 text-white shadow-sm"
            icon={<Sparkles className="w-4 h-4 text-white" />}
          >
            AI Project Generator
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
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
                milestone_count: 0,
                completed_milestone_count: 0,
                task_count: 0,
                created_at: '',
                updated_at: '',
              } as Project)
            }
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* ─── METRICS ROW ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Active Clients</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {activeProjects.length}
            </span>
            <span className="text-xs text-text-muted">engagements</span>
          </div>
        </Card3D>

        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {completedProjects.length}
            </span>
            <span className="text-xs text-text-muted">delivered</span>
          </div>
        </Card3D>

        <Card3D
          maxTilt={5}
          depth={20}
          variant="glass"
          className="p-4 sm:p-5 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Avg Progress</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {avgProgress}%
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
            <span>Pipeline Value</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              ${(totalRevenue / 1000).toFixed(1)}k
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
            <span>On Hold</span>
            <div className="p-2 rounded-xl bg-gray-500/15 text-gray-400 border border-gray-500/25">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {projects.filter((p) => p.status === 'on_hold').length}
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
              value={sortBy}
              onValueChange={setSortBy}
              className="w-full sm:w-44"
              options={[
                { value: 'updated', label: 'Recently Updated' },
                { value: 'created', label: 'Newest First' },
                { value: 'progress', label: 'Progress' },
                { value: 'target_date', label: 'Due Date' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border-base text-amber-500 focus:ring-amber-500"
              />
              Show Completed
            </label>
          </div>
        </div>
      </Card3D>

      {/* ─── PROJECTS GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="lg:col-span-3 p-12 text-center">
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
              onClick={() => openCaptureModal('ai')}
              icon={<Sparkles className="w-4 h-4" />}
            >
              {projects.length === 0 ? 'Create with AI' : 'Clear Filters'}
            </Button>
          </div>
        ) : (
          paginatedProjects.map((project) => (
            <Card3D
              key={project.id}
              maxTilt={6}
              depth={20}
              variant="default"
              className="p-5 border border-border-base hover:border-amber-500/35 transition-all shadow-card flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary truncate max-w-[200px]">
                      {project.title}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}
                    >
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
                <p className="text-xs text-text-muted line-clamp-2 mb-3 flex-1">
                  {project.description}
                </p>
              )}

              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-2xs text-text-muted">
                    <span>Progress</span>
                    <span className="font-semibold text-text-primary font-mono">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-2xs text-text-faint pt-1 border-t border-border-base/50">
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    {project.completed_milestone_count}/{project.milestone_count} milestones
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {project.task_count} tasks
                  </span>
                </div>

                {/* Priority & Target Date */}
                <div className="flex items-center justify-between text-2xs text-text-faint pt-1">
                  <Badge
                    variant={
                      project.priority === 'urgent'
                        ? 'danger'
                        : project.priority === 'high'
                          ? 'warning'
                          : 'default'
                    }
                    size="sm"
                  >
                    {project.priority}
                  </Badge>
                  {project.target_date && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.target_date, 'medium')}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between">
                <span className="text-xs text-text-faint">
                  Updated {formatDate(project.updated_at, 'medium')}
                </span>
                <div className="flex items-center gap-2">
                  <Link to={`/app/freelancer/client-portal/${project.id}`}>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-amber-500 hover:text-amber-400 flex items-center gap-1"
                      icon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Client Portal
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => startEditing(project)}
                    className="text-amber-500 hover:text-amber-400"
                  >
                    Open
                  </Button>
                </div>
              </div>
            </Card3D>
          ))
        )}
      </div>

      {/* ─── PAGINATION CONTROLS ───────────────────────────────────────── */}
      {filteredProjects.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-bg-surface border border-border-base mt-6">
          <p className="text-xs text-text-muted">
            Showing{' '}
            <span className="font-semibold text-text-primary font-mono">
              {(page - 1) * PAGE_SIZE + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-text-primary font-mono">
              {Math.min(page * PAGE_SIZE, filteredProjects.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-text-primary font-mono">
              {filteredProjects.length}
            </span>{' '}
            projects
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                    pNum === page
                      ? 'bg-amber-500 text-black font-bold shadow-xs'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                  aria-current={pNum === page ? 'page' : undefined}
                >
                  {pNum}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ─── CREATE/EDIT MODAL ─────────────────────────────────────────── */}
      {(editingProject || createProjectMutation.isPending) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card3D
            maxTilt={0}
            depth={0}
            variant="default"
            className="w-full max-w-md p-6 border border-border-base shadow-xl animate-slide-up"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                {editingProject?.id === 0 ? 'New Project' : 'Edit Project'}
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
              onSubmit={editingProject?.id === 0 ? handleCreateProject : handleUpdateProject}
              className="space-y-4"
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
                    onValueChange={setEditForm as any}
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
                    onValueChange={setEditForm as any}
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
                  className="!bg-amber-500 hover:!bg-amber-600 text-stone-950"
                >
                  {createProjectMutation.isPending || updateProjectMutation.isPending
                    ? 'Saving...'
                    : editingProject?.id === 0
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
