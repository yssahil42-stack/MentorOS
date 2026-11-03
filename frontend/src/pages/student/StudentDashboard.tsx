import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardSummary } from '../../services/dashboardService';
import { tasksApi, projectsApi } from '../../services/apiClient';
import { Card3D } from '../../components/ui/Card3D';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { DailyStandupWidget } from '../../components/dashboard/DailyStandupWidget';
import { ROLE_CONFIGS } from '../../config/roles';
import type { TaskStatus } from '../../types/task';
import { DashboardMetrics } from './DashboardMetrics';
import { CourseAccordion } from './CourseAccordion';
import { QuickAddForm } from './QuickAddForm';
import { CalendarSidebar } from './CalendarSidebar';

export default function StudentDashboard() {
  const { openCaptureModal, showToast } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | 'all'>('all');
  const [expandedCourses, setExpandedCourses] = useState<Record<string | number, boolean>>({});
  const [courseTaskPages, setCourseTaskPages] = useState<Record<string | number, number>>({});
  const TASK_PAGE_SIZE = 25;

  const { data: summary, isLoading: sLoad } = useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: ({ signal }) => fetchDashboardSummary('student', signal),
  });
  const { data: tasks = [], isLoading: tLoad } = useQuery({
    queryKey: ['tasks', 'student', { page: 1, pageSize: TASK_PAGE_SIZE }],
    queryFn: ({ signal }) => tasksApi.get('student', { signal }),
  });
  const { data: projects = [], isLoading: pLoad } = useQuery({
    queryKey: ['projects', 'student', { page: 1, pageSize: TASK_PAGE_SIZE }],
    queryFn: ({ signal }) => projectsApi.get('student', { signal }),
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
        showToast('Task completed', 'success', {
          action: {
            label: 'Undo',
            onClick: () => toggleMutation.mutate({ id: variables.id, status: 'todo' }),
          },
        });
      } else {
        showToast('Task updated', 'success');
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
        role: 'student',
      }),
    onSuccess: () => {
      setQuickTaskTitle('');
      invalidate();
      showToast('Study task added!', 'success');
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
      <DashboardMetrics
        displayName={user?.full_name ? user.full_name.split(' ')[0] : 'there'}
        projectCount={projects.length}
        avgProjectProgress={avgProgress}
        pendingTaskCount={pending.length}
        completedTaskCount={completed.length}
        totalTaskCount={tasks.length}
        taskCompletionRate={compRate}
        nextDeadlineTitle={(summary?.role_summary as any)?.next_deadline_title}
      />
      <DailyStandupWidget role="student" standupData={summary?.daily_standup} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <Card3D
            maxTilt={4}
            depth={35}
            variant="secondary"
            className="p-5 border border-border-base hover:border-orange-500/35 transition-all shadow-card backdrop-blur-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-border-base gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <span>Courses &amp; Assignments</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Select a course to view details, or expand any course to manage assignments
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
                onClick={() => setSelectedCourseFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all border ${selectedCourseFilter === 'all' ? 'bg-orange-500 text-white border-orange-500 shadow-2xs' : 'bg-bg-elevated text-text-muted border-border-base hover:text-text-primary'}`}
              >
                All Courses ({projects.length})
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedCourseFilter(p.id)}
                  className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${selectedCourseFilter === p.id ? 'bg-orange-500 text-white border-orange-500 shadow-2xs' : 'bg-bg-elevated text-text-muted border-border-base hover:text-text-primary'}`}
                >
                  <span>{p.title}</span>
                  <span className="text-3xs font-mono opacity-80">{p.progress}%</span>
                </button>
              ))}
            </div>
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-2xs text-text-muted">
                <span>Semester Progress</span>
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
            <QuickAddForm
              value={quickTaskTitle}
              onChange={setQuickTaskTitle}
              onSubmit={(e) => {
                e.preventDefault();
                if (quickTaskTitle.trim())
                  addTaskMutation.mutate({
                    title: quickTaskTitle.trim(),
                    projectId: selectedCourseFilter !== 'all' ? selectedCourseFilter : undefined,
                  });
              }}
              placeholder={
                selectedCourseFilter === 'all'
                  ? 'Add assignment or study task...'
                  : `Add assignment to ${projects.find((p) => p.id === selectedCourseFilter)?.title}...`
              }
              isPending={addTaskMutation.isPending}
            />
            <div className="mt-4">
              <CourseAccordion
                projects={projects}
                tasks={tasks}
                filteredTasks={filteredTasks}
                selectedCourseFilter={selectedCourseFilter}
                expandedCourses={expandedCourses}
                onToggleExpand={(id) =>
                  setExpandedCourses((prev) => ({
                    ...prev,
                    [id]: prev[id] === undefined ? false : !prev[id],
                  }))
                }
                courseTaskPages={courseTaskPages}
                onLoadMoreCourseTasks={(id) =>
                  setCourseTaskPages((prev) => ({ ...prev, [id]: (prev[id] || 1) + 1 }))
                }
                onToggleTask={(id, st) =>
                  toggleMutation.mutate({ id, status: st === 'completed' ? 'todo' : 'completed' })
                }
                emptyStateConfig={ROLE_CONFIGS.student.emptyStates.tasks}
                onAiPromptClick={() => openCaptureModal('ai', ROLE_CONFIGS.student.firstAiPrompt)}
              />
            </div>
            <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-xs">
              <span className="text-text-faint text-2xs">
                {pending.length} total assignments remaining
              </span>
              <Link
                to="/app/student/projects"
                className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-semibold text-xs"
              >
                <span>Manage Courses &amp; Milestones</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card3D>
        </div>
        <CalendarSidebar />
      </div>
    </div>
  );
}
