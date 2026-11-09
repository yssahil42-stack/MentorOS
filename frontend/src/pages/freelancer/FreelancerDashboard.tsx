import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardSummary } from '../../services/dashboardService';
import { tasksApi, projectsApi } from '../../services/apiClient';
import { Card3D } from '../../components/ui/Card3D';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { DailyStandupWidget } from '../../components/dashboard/DailyStandupWidget';
import { ROLE_CONFIGS } from '../../config/roles';
import type { TaskStatus } from '../../types/task';
import { FreelancerMetrics } from './FreelancerMetrics';
import { ClientProjectAccordion } from './ClientProjectAccordion';
import { FreelancerQuickAddForm } from './FreelancerQuickAddForm';
import { FreelancerCalendarSidebar } from './FreelancerCalendarSidebar';
import { FreelancerProposalsSection } from './FreelancerProposalsSection';

export default function FreelancerDashboard() {
  const { openCaptureModal, openAIDrawer, showToast } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<number | 'all'>('all');
  const [expandedProjects, setExpandedProjects] = useState<Record<string | number, boolean>>({});
  const [projectTaskPages, setProjectTaskPages] = useState<Record<string | number, number>>({});
  const TASK_PAGE_SIZE = 25;

  const { data: summary, isLoading: sLoad } = useQuery({
    queryKey: ['dashboard', 'freelancer'],
    queryFn: ({ signal }) => fetchDashboardSummary('freelancer', signal),
  });
  const { data: tasks = [], isLoading: tLoad } = useQuery({
    queryKey: ['tasks', 'freelancer', { page: 1, pageSize: TASK_PAGE_SIZE }],
    queryFn: ({ signal }) => tasksApi.get('freelancer', { signal }),
  });
  const { data: projects = [], isLoading: pLoad } = useQuery({
    queryKey: ['projects', 'freelancer', { page: 1, pageSize: TASK_PAGE_SIZE }],
    queryFn: ({ signal }) => projectsApi.get('freelancer', { signal }),
  });

  const invalidate = () =>
    ['tasks', 'dashboard', 'projects', 'milestones'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      tasksApi.update(id, { status }),
    onSuccess: (u, variables) => {
      invalidate();
      if (u.status === 'completed') {
        showToast('Deliverable completed', 'success', {
          action: {
            label: 'Undo',
            onClick: () => toggleMutation.mutate({ id: variables.id, status: 'todo' }),
          },
        });
      } else {
        showToast('Deliverable updated', 'success');
      }
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ title, projectId }: { title: string; projectId?: number }) =>
      tasksApi.create({
        title,
        project_id: projectId,
        priority: 'high',
        estimated_minutes: 60,
        role: 'freelancer',
      }),
    onSuccess: () => {
      setQuickTaskTitle('');
      invalidate();
      showToast('Client deliverable added!', 'success');
    },
  });

  if (sLoad || tLoad || pLoad) return <DashboardSkeleton />;

  const completed = tasks.filter((t) => t.status === 'completed');
  const pending = tasks.filter((t) => t.status !== 'completed');
  const compRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => {
            const pTasks = tasks.filter(
              (t) =>
                t.project_id === p.id ||
                (t.project_title &&
                  t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
            );
            return (
              acc +
              (pTasks.length > 0
                ? Math.round(
                    (pTasks.filter((t) => t.status === 'completed').length / pTasks.length) * 100
                  )
                : p.progress || 0)
            );
          }, 0) / projects.length
        )
      : 0;

  const filteredTasks = tasks.filter((t) =>
    taskFilter === 'all'
      ? true
      : taskFilter === 'todo'
        ? t.status !== 'completed'
        : t.status === 'completed'
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <FreelancerMetrics
        displayName={user?.full_name ? user.full_name.split(' ')[0] : 'there'}
        projectCount={projects.length}
        avgProjectProgress={avgProgress}
        pendingTaskCount={pending.length}
        completedTaskCount={completed.length}
        totalTaskCount={tasks.length}
        taskCompletionRate={compRate}
        nextDeadlineTitle={(summary?.role_summary as any)?.next_delivery_title}
        onOpenCapture={() => openCaptureModal('manual')}
        onPlanWithAI={() => openAIDrawer()}
      />

      <DailyStandupWidget role="freelancer" standupData={summary?.daily_standup} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 relative overflow-hidden backdrop-blur-xl">
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-base/80 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                    Project Tasks
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Select a client to view details, or expand any project to manage deliverables
                  </p>
                </div>
              </div>

              {/* Segmented task filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-bg-base/80 p-1 rounded-xl border border-border-subtle text-xs shrink-0 self-start sm:self-auto">
                {(['all', 'todo', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                      taskFilter === f
                        ? 'bg-white dark:bg-bg-elevated text-amber-600 dark:text-amber-400 font-semibold shadow-2xs border border-border-subtle/80'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {f === 'completed' ? 'Done' : f === 'todo' ? 'To Do' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Client selector pills */}
            <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setSelectedProjectFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all border ${
                  selectedProjectFilter === 'all'
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs'
                    : 'bg-slate-100 dark:bg-bg-elevated text-text-muted border-border-subtle hover:text-text-primary'
                }`}
              >
                All Clients ({projects.length})
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProjectFilter(p.id)}
                  className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    selectedProjectFilter === p.id
                      ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-bg-elevated text-text-muted border-border-subtle hover:text-text-primary'
                  }`}
                >
                  <span>{p.title}</span>
                  <span className="text-3xs font-mono font-bold opacity-80">{p.progress}%</span>
                </button>
              ))}
            </div>

            {/* Sprint progress meter */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-bg-elevated/30 border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-medium text-text-secondary">Contract Sprint Progress</span>
                <span className="font-semibold text-text-primary font-mono">
                  {completed.length} of {tasks.length} finished ({compRate}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-bg-base h-2 rounded-full overflow-hidden border border-border-subtle/70">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500 shadow-2xs"
                  style={{ width: `${compRate}%` }}
                />
              </div>
            </div>

            {/* Quick add input */}
            <FreelancerQuickAddForm
              value={quickTaskTitle}
              onChange={setQuickTaskTitle}
              onSubmit={(e) => {
                e.preventDefault();
                if (quickTaskTitle.trim())
                  addTaskMutation.mutate({
                    title: quickTaskTitle.trim(),
                    projectId: selectedProjectFilter !== 'all' ? selectedProjectFilter : undefined,
                  });
              }}
              placeholder={
                selectedProjectFilter === 'all'
                  ? 'Add client deliverable or task...'
                  : `Add deliverable to ${projects.find((p) => p.id === selectedProjectFilter)?.title}...`
              }
              isPending={addTaskMutation.isPending}
            />

            {/* Client project deliverables accordion */}
            <div className="mt-4">
              <ClientProjectAccordion
                projects={projects}
                tasks={tasks}
                filteredTasks={filteredTasks}
                selectedProjectFilter={selectedProjectFilter}
                expandedProjects={expandedProjects}
                onToggleExpand={(id) =>
                  setExpandedProjects((prev) => ({
                    ...prev,
                    [id]: prev[id] === undefined ? false : !prev[id],
                  }))
                }
                projectTaskPages={projectTaskPages}
                onLoadMoreProjectTasks={(id) =>
                  setProjectTaskPages((prev) => ({ ...prev, [id]: (prev[id] || 1) + 1 }))
                }
                onToggleTask={(id, st) =>
                  toggleMutation.mutate({ id, status: st === 'completed' ? 'todo' : 'completed' })
                }
                emptyStateConfig={ROLE_CONFIGS.freelancer.emptyStates.tasks}
                onAiPromptClick={() => openCaptureModal('manual')}
              />
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3.5 border-t border-border-base/70 flex items-center justify-between text-xs">
              <span className="text-text-muted text-xs font-medium">
                {pending.length} deliverables remaining
              </span>
              <Link
                to="/app/freelancer/projects"
                className="group inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
              >
                <span>Manage Clients &amp; Milestones</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        <FreelancerCalendarSidebar />
      </div>

      {/* Systematic Work Proposals & Scope Management */}
      <FreelancerProposalsSection projects={projects} />
    </div>
  );
}
