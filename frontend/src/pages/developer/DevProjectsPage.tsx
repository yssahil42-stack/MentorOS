import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Flag,
  CheckCircle2,
  ArrowRight,
  Filter,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects, createProject, deleteProject } from '../../services/projectService';
import { fetchTasks } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Project, ProjectPriority } from '../../types/project';

export default function DevProjectsPage() {
  const { openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<ProjectPriority>('medium');
  const [newTargetDate, setNewTargetDate] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects('developer'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'developer'],
    queryFn: () => fetchTasks({ role: 'developer' }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createProject({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        target_date: newTargetDate,
        role: 'developer',
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Project created successfully!', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Project removed', 'info');
    },
  });

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="card" className="h-48" />
          <LoadingSkeleton variant="card" className="h-48" />
          <LoadingSkeleton variant="card" className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-developer-500/20 text-developer-400">
              <FolderGit2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-developer-400">
              REPOSITORIES &amp; BUILDS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Developer Projects
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            Manage your engineering initiatives, feature releases, and milestone targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="!bg-developer-500 hover:!bg-developer-600 shadow-glow-emerald"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-bg-surface border border-border-base">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or description..."
            className="w-full bg-bg-base/70 border border-border-base rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-hover"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['all', 'planning', 'active', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors font-medium ${
                filterStatus === st
                  ? 'bg-developer-500/20 text-developer-300 border border-developer-500/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-text-muted">
            No projects found matching current criteria.
          </div>
        ) : (
          filteredProjects.map((p) => (
            <Card
              key={p.id}
              className="p-5 flex flex-col justify-between border border-border-base hover:border-developer-500/40 transition-all hover:shadow-lg group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="p-2 rounded-xl bg-bg-elevated text-developer-400 border border-border-base">
                    <FolderGit2 className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={p.priority} />
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="p-1 text-text-faint hover:text-danger rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm md:text-base font-bold text-text-primary group-hover:text-developer-400 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 mt-1">{p.description}</p>
                </div>
              </div>

              {/* Progress & Milestones */}
              {(() => {
                const projTasks = tasks.filter(
                  (t) =>
                    t.project_id === p.id ||
                    (t.project_title &&
                      t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
                );
                const completedCount = projTasks.filter((t) => t.status === 'completed').length;
                const totalCount = projTasks.length;
                const dynamicProgress =
                  totalCount > 0
                    ? Math.round((completedCount / totalCount) * 100)
                    : p.progress || 0;

                return (
                  <div className="mt-5 pt-4 border-t border-border-base space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-faint">Progress</span>
                      <span className="font-mono font-bold text-developer-400">
                        {dynamicProgress}%
                      </span>
                    </div>

                    <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                      <div
                        className="bg-gradient-to-r from-developer-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${dynamicProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-faint pt-1">
                      <span className="flex items-center gap-1">
                        <Flag className="w-3 h-3 text-amber-400" />
                        {p.completed_milestone_count || 0}/{p.milestone_count || 0} milestones
                      </span>
                      <span className="text-3xs font-mono">
                        {totalCount > 0
                          ? `${completedCount}/${totalCount} tasks`
                          : `${p.task_count || 0} tasks`}
                      </span>
                    </div>

                    <Link
                      to={`/app/developer/progress?projectId=${p.id}`}
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-2xs font-semibold text-developer-400 border border-developer-500/25 bg-developer-500/5 hover:bg-developer-500/15 hover:border-developer-500/50 transition-all"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      View Progress
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })()}
            </Card>
          ))
        )}
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Developer Project"
        description="Initialize an engineering project with progress metrics and milestone targets"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            createMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Distributed Caching Layer"
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-hover"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">Description</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Architectural scope, goals, and technical stacks..."
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-hover resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as ProjectPriority)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">Target Date</label>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border-base">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-developer-500 hover:!bg-developer-600"
              disabled={!newTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
