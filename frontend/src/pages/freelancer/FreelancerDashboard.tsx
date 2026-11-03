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

export default function FreelancerDashboard() {
  const { openCaptureModal, showToast } = useWorkspace();
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <FreelancerMetrics
        displayName={user?.full_name ? user.full_name.split(' ')[0] : 'there'}
        projectCount={projects.length}
        avgProjectProgress={avgProgress}
        pendingTaskCount={pending.length}
        completedTaskCount={completed.length}
        totalTaskCount={tasks.length}
        taskCompletionRate={compRate}
        nextDeadlineTitle={(summary?.role_summary as any)?.next_delivery_title}
        onOpenCapture={() => openCaptureModal('ai', ROLE_CONFIGS.freelancer.firstAiPrompt)}
      />

      <DailyStandupWidget role="freelancer" standupData={summary?.daily_standup} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <Card3D
            maxTilt={4}
            depth={35}
            variant="default"
            className="p-5 border border-border-base hover:border-orange-500/35 transition-all shadow-card backdrop-blur-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-border-base gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <span>Client Projects &amp; Deliverables</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Select a client to view details, or expand any project to manage deliverables
                </p>
              </div>
              <div className="flex items-center gap-1 bg-bg-base/80 p-1 rounded-xl border border-border-base text-xs shrink-0 self-start sm:self-auto">
                {(['all', 'todo', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${taskFilter === f ? 'bg-orange-500/20 text-orange-600 dark:text-orange-300 font-semibold shadow-2xs border border-orange-500/30' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {f === 'completed' ? 'Done' : f === 'todo' ? 'To Do' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setSelectedProjectFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all border ${selectedProjectFilter === 'all' ? 'bg-orange-500 text-white border-orange-500 shadow-2xs' : 'bg-bg-elevated text-text-muted border-border-base hover:text-text-primary'}`}
              >
                All Clients ({projects.length})
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProjectFilter(p.id)}
                  className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${selectedProjectFilter === p.id ? 'bg-orange-500 text-white border-orange-500 shadow-2xs' : 'bg-bg-elevated text-text-muted border-border-base hover:text-text-primary'}`}
                >
                  <span>{p.title}</span>
                  <span className="text-3xs font-mono opacity-80">{p.progress}%</span>
                </button>
              ))}
            </div>

            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-2xs text-text-muted">
                <span>Contract Sprint Progress</span>
                <span className="font-semibold text-text-primary font-mono">
                  {completed.length} of {tasks.length} finished ({compRate}%)
                </span>
              </div>
              <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-2xs"
                  style={{ width: `${compRate}%` }}
                />
              </div>
            </div>

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
                onAiPromptClick={() =>
                  openCaptureModal('ai', ROLE_CONFIGS.freelancer.firstAiPrompt)
                }
              />
            </div>

            <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-xs">
              <span className="text-text-faint text-2xs">
                {pending.length} total deliverables remaining
              </span>
              <Link
                to="/app/freelancer/projects"
                className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-semibold text-xs"
              >
                <span>Manage Clients &amp; Milestones</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card3D>
        </div>

        <FreelancerCalendarSidebar />
      </div>
    </div>
  );
}
