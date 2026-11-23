import { cn } from '../../utils/cn';
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
import { TimeTrackingBadge } from '../../components/ui/TimeTrackingBadge';
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
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      {/* ─── Main White Container Card Matching Notes & Dashboard ─── */}
      <div className="bg-white dark:bg-[#161922] rounded-3xl border border-[#eee7e0] dark:border-stone-800/80 p-5 sm:p-8 space-y-6 shadow-xs">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Developer projects
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Manage your engineering initiatives, code repositories, feature releases, and milestone targets.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openAIDrawer()}
              className="h-10 px-4 rounded-xl border border-border-base bg-white dark:bg-bg-elevated hover:bg-slate-50 dark:hover:bg-bg-surface text-xs font-semibold text-text-primary flex items-center gap-2 shadow-2xs transition-all hover:border-[#c04b1e]/40 cursor-pointer active:translate-y-[1px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c04b1e]" />
              <span>AI Roadmap</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:translate-y-[1px] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New project</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name or description..."
              className="h-10 w-full pl-10 pr-4 rounded-xl border border-border-base bg-white dark:bg-bg-elevated/40 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#c04b1e]/20 focus:border-[#c04b1e] transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-100/80 dark:bg-bg-elevated p-1 rounded-xl border border-border-base/50">
            {['all', 'planning', 'active', 'completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg capitalize transition-colors font-medium cursor-pointer',
                  filterStatus === st
                    ? 'bg-white dark:bg-bg-surface text-text-primary shadow-2xs font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-[#eee7e0] dark:border-stone-800 p-8 sm:p-12 text-center bg-white/50 dark:bg-bg-surface/50">
              <div className="w-14 h-14 rounded-2xl bg-amber-100/80 dark:bg-amber-950/50 text-[#c04b1e] flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">No Projects Found</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                No active developer projects matching your search criteria.
              </p>
            </div>
          ) : (
            filteredProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-border-base/90 bg-white dark:bg-stone-900/40 hover:border-[#c04b1e]/40 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="p-2 rounded-xl bg-orange-100/70 text-[#c04b1e] border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300">
                      <FolderGit2 className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={p.priority} />
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="p-1 text-text-muted hover:text-danger rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm md:text-base font-bold text-text-primary group-hover:text-[#c04b1e] transition-colors leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
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
                      <span className="text-text-muted">Progress</span>
                      <span className="font-mono font-bold text-[#c04b1e]">
                        {dynamicProgress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden border border-border-base/50">
                      <div
                        className="bg-[#c04b1e] h-full rounded-full transition-all duration-300"
                        style={{ width: `${dynamicProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Flag className="w-3 h-3 text-[#c04b1e]" />
                        {p.completed_milestone_count || 0}/{p.milestone_count || 0} milestones
                      </span>
                      <span className="text-3xs font-mono">
                        {totalCount > 0
                          ? `${completedCount}/${totalCount} tasks`
                          : `${p.task_count || 0} tasks`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-3xs text-text-muted">Total Time:</span>
                      <TimeTrackingBadge
                        expectedMinutes={projTasks.reduce(
                          (s, t) => s + (t.estimated_minutes || 0),
                          0
                        )}
                        actualMinutes={projTasks.reduce((s, t) => s + (t.actual_minutes || 0), 0)}
                        size="xs"
                        variant="pill"
                      />
                    </div>

                    <Link
                      to={`/app/developer/progress?projectId=${p.id}`}
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-[#c04b1e] border border-[#c04b1e]/20 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/60 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>View Progress</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })()}
              </div>
            ))
          )}
        </div>
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
