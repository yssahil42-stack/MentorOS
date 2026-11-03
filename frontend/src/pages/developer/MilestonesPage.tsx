import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  FolderGit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  fetchProjects,
} from '../../services/projectService';
import { fetchTasks } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Milestone, MilestoneStatus } from '../../types/project';

export default function MilestonesPage() {
  const { openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | MilestoneStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [projectId, setProjectId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', 'developer'],
    queryFn: () => fetchMilestones(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'developer'],
    queryFn: () => fetchTasks(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createMilestone({
        project_id: projectId,
        title,
        description,
        target_date: targetDate,
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone created!', 'success');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MilestoneStatus }) => {
      return updateMilestone(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone updated', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteMilestone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone deleted', 'info');
    },
  });

  const filtered = milestones.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <LoadingSkeleton variant="card" className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Flag className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-amber-400">KEY DELIVERABLES</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Sprint Milestones
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            Track major release gates, architectural deadlines, and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              openAIDrawer(
                'Generate 3 milestone targets with target delivery dates for our software architecture sprint'
              )
            }
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          >
            AI Milestones
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="!bg-amber-500 hover:!bg-amber-600 text-black font-semibold shadow-glow-amber"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-bg-surface border border-border-base w-fit text-xs">
        {(['all', 'in_progress', 'pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
              filter === tab
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="relative border-l-2 border-border-base ml-4 pl-6 space-y-6">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted bg-bg-surface rounded-xl border border-border-base">
            No milestones found matching filter.
          </div>
        ) : (
          filtered.map((m) => {
            const isCompleted = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';

            return (
              <div key={m.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -left-[31px] top-3.5 w-4 h-4 rounded-full border-2 bg-bg-base transition-colors ${
                    isCompleted
                      ? 'border-emerald-400 bg-emerald-400'
                      : isInProgress
                        ? 'border-amber-400 bg-amber-400 animate-pulse'
                        : 'border-border-hover'
                  }`}
                />

                {(() => {
                  const projectMilestones = milestones.filter(
                    (ms) => ms.project_id === m.project_id
                  );
                  const mIdx = projectMilestones.findIndex((ms) => ms.id === m.id);
                  const projTasks = tasks.filter((t) => t.project_id === m.project_id);
                  const phaseTasks = projTasks.filter((t, tIdx) => {
                    const desc = (t.description || '').toLowerCase();
                    const title = (t.title || '').toLowerCase();
                    const mTitle = (m.title || '').toLowerCase();
                    if (desc.includes(`phase ${mIdx + 1}`) || title.includes(`phase ${mIdx + 1}`))
                      return true;
                    if (mTitle && (desc.includes(mTitle) || title.includes(mTitle))) return true;
                    return tIdx % Math.max(projectMilestones.length, 1) === (mIdx >= 0 ? mIdx : 0);
                  });
                  const phaseCompleted = phaseTasks.filter((t) => t.status === 'completed').length;
                  const phaseProgress =
                    phaseTasks.length > 0
                      ? Math.round((phaseCompleted / phaseTasks.length) * 100)
                      : isCompleted
                        ? 100
                        : 0;

                  return (
                    <Card className="p-4 border border-border-base hover:border-amber-500/40 transition-all flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: m.id,
                                status: isCompleted ? 'pending' : 'completed',
                              })
                            }
                            className="mt-1 text-text-muted hover:text-emerald-400 transition-colors"
                          >
                            <CheckCircle2
                              className={`w-5 h-5 ${
                                isCompleted
                                  ? 'text-emerald-400 fill-emerald-400/20'
                                  : 'text-text-muted'
                              }`}
                            />
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className={`text-sm font-bold ${
                                  isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                                }`}
                              >
                                {m.title}
                              </h3>
                              <Badge
                                variant={
                                  isCompleted ? 'success' : isInProgress ? 'warning' : 'neutral'
                                }
                                size="sm"
                              >
                                {m.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            {m.description && (
                              <p className="text-xs text-text-muted">{m.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {m.target_date && (
                            <span className="flex items-center gap-1 text-xs font-mono text-text-faint">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              {new Date(m.target_date).toLocaleDateString()}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(m.id)}
                            className="p-1.5 text-text-faint hover:text-danger rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Milestone Subtask Progress Bar */}
                      {phaseTasks.length > 0 && (
                        <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-3 text-3xs text-text-muted font-mono">
                          <div className="flex-1 bg-bg-base h-1.5 rounded-full overflow-hidden border border-border-subtle">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${phaseProgress}%` }}
                            />
                          </div>
                          <span className="shrink-0 font-semibold text-amber-400">
                            {phaseCompleted}/{phaseTasks.length} tasks ({phaseProgress}%)
                          </span>
                        </div>
                      )}
                    </Card>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Sprint Milestone"
        description="Define a tangible deliverable and target completion date"
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
              Associated Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Milestone Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End-to-End Authentication Suite"
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key verification requirements..."
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Target Completion Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border-base">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-amber-500 hover:!bg-amber-600 text-black font-semibold"
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Milestone'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
