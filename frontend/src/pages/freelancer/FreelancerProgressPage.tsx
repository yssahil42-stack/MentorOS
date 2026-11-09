import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Flag,
  Briefcase,
  ArrowRight,
  ExternalLink,
  Calendar,
  Building2,
  CheckSquare,
  PieChart,
  ArrowLeft,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, updateTask } from '../../services/taskService';
import { fetchMilestones, fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function FreelancerProgressPage() {
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const selectedProjectId = projectIdParam ? Number(projectIdParam) : null;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'freelancer'],
    queryFn: () => fetchTasks({ role: 'freelancer' }),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'freelancer'],
    queryFn: () => fetchMilestones({ role: 'freelancer' }),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'freelancer'],
    queryFn: () => fetchProjects('freelancer'),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'todo' | 'completed' }) => {
      return updateTask(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task status updated', 'success');
    },
    onError: () => {
      showToast('Failed to update task', 'error');
    },
  });

  if (tasksLoading || milestonesLoading || projectsLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const displayedProjects = selectedProject ? [selectedProject] : projects;
  const projectTasks = selectedProject
    ? tasks.filter(
        (t) =>
          t.project_id === selectedProject.id ||
          (t.project_title &&
            t.project_title.trim().toLowerCase() === selectedProject.title.trim().toLowerCase())
      )
    : tasks;

  const projectMilestones = selectedProject
    ? milestones.filter(
        (m) =>
          m.project_id === selectedProject.id ||
          ((m as any).project_title &&
            (m as any).project_title.trim().toLowerCase() ===
              selectedProject.title.trim().toLowerCase())
      )
    : milestones;

  const completedTasks = projectTasks.filter((t) => t.status === 'completed');
  const taskCompletionRate =
    projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

  const completedMilestones = projectMilestones.filter((m) => m.status === 'completed');
  const milestoneRate =
    projectMilestones.length > 0 ? Math.round((completedMilestones.length / projectMilestones.length) * 100) : 0;

  const totalEstimatedMins = projectTasks.reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);
  const completedMins = completedTasks.reduce(
    (sum, t) => sum + (t.actual_minutes || t.estimated_minutes || 60),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/25">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-2xs font-mono font-bold uppercase tracking-wider text-amber-500">
              DELIVERY &amp; CLIENT VELOCITY
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Freelancer Progress &amp; Analytics
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            Track client deliverables, milestone completion, task execution rate, and delivery momentum.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchParams({})}
              className="text-xs font-semibold flex items-center gap-1.5 text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Show All Projects Progress
            </Button>
          )}
          <Link to="/app/freelancer/projects">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-500" />
              Manage Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Selected Project Banner */}
      {selectedProject && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold text-text-primary">
                Filtered to Project: {selectedProject.title}
              </span>
              <span className="text-text-muted text-2xs block">
                Showing milestone completion, deliverable tasks, and effort metrics for this project only.
              </span>
            </div>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setSearchParams({})}
            className="text-amber-500 hover:text-amber-400 text-2xs font-semibold shrink-0"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Deliverables Shipped</span>
            <Flag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {milestoneRate}%
            </span>
            <span className="text-xs text-text-muted">
              ({completedMilestones.length}/{milestones.length})
            </span>
          </div>
          <div className="mt-2 text-2xs text-emerald-500 font-medium">
            {milestones.length - completedMilestones.length} deliverables pending
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {taskCompletionRate}%
            </span>
            <span className="text-xs text-text-muted">
              ({completedTasks.length}/{tasks.length})
            </span>
          </div>
          <div className="mt-2 text-2xs text-amber-500 font-medium">
            {tasks.length - completedTasks.length} tasks in backlog
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Estimated Hours</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {(completedMins / 60).toFixed(1)}h
            </span>
            <span className="text-xs text-text-muted">
              / {(totalEstimatedMins / 60).toFixed(1)}h total
            </span>
          </div>
          <div className="mt-2 text-2xs text-cyan-500 font-medium">
            Delivery capacity on schedule
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Active Pipeline</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {displayedProjects.length}
            </span>
            <span className="text-xs text-text-muted">
              {displayedProjects.length === 1 ? 'contract' : 'contracts'}
            </span>
          </div>
          <div className="mt-2 text-2xs text-purple-500 font-medium">
            Active client initiatives
          </div>
        </Card>
      </div>

      {/* Project Completion Breakdown */}
      <Card className="p-6 space-y-6 border border-border-base shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-base">
          <div>
            <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Project Deliverable Breakdown
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Live completion status per client contract and roadmap
            </p>
          </div>
        </div>

        {displayedProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted space-y-2">
            <p>No active projects found. Save an AI roadmap or create a project to track progress.</p>
            <Link to="/app/freelancer/projects">
              <Button size="xs" variant="primary" className="bg-amber-500 hover:bg-amber-600 text-white mt-2">
                Create First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {displayedProjects.map((proj) => {
              const projTasks = tasks.filter(
                (t) =>
                  t.project_id === proj.id ||
                  (t.project_title &&
                    t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
              );
              const compCount = projTasks.filter((t) => t.status === 'completed').length;
              const totCount = projTasks.length;
              const dynamicProg =
                totCount > 0 ? Math.round((compCount / totCount) * 100) : proj.progress || 0;

              const projMilestones = milestones.filter(
                (m) =>
                  m.project_id === proj.id ||
                  ((m as any).project_title &&
                    (m as any).project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
              );
              const compMilestones = projMilestones.filter((m) => m.status === 'completed').length;

              return (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl border border-border-base bg-bg-surface hover:border-amber-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{proj.title}</h4>
                      {proj.description && (
                        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                          {proj.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm" className="capitalize text-xs font-mono">
                        {proj.status}
                      </Badge>
                      <span className="font-mono font-bold text-amber-500 text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                        {dynamicProg}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dynamicProg}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-2xs text-text-muted pt-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 font-mono">
                        <Flag className="w-3 h-3 text-amber-500" />
                        {compMilestones}/{projMilestones.length || proj.milestone_count || 0} milestones
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <CheckSquare className="w-3 h-3 text-emerald-500" />
                        {compCount}/{totCount || proj.task_count || 0} tasks
                      </span>
                      {proj.target_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          Due {new Date(proj.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/app/freelancer/client-portal/${proj.id}`}
                      className="text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 ml-auto"
                    >
                      Client Portal <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Actionable Deliverable Tasks */}
      <Card className="p-6 space-y-4 border border-border-base shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-base">
          <div>
            <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              Active Milestone Tasks &amp; Deliverables ({projectTasks.length})
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Check off deliverables as you complete client milestones
            </p>
          </div>
        </div>

        {projectTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted space-y-2">
            <p>No deliverable tasks found in this workspace.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {projectTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isDone
                      ? 'bg-bg-surface/50 border-border-base/50 opacity-60'
                      : 'bg-bg-surface border-border-base hover:border-amber-500/40 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        toggleTaskMutation.mutate({
                          id: task.id,
                          status: isDone ? 'todo' : 'completed',
                        })
                      }
                      className="mt-0.5 text-text-muted hover:text-emerald-500 transition-colors"
                      aria-label={isDone ? 'Mark task as todo' : 'Mark task as completed'}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          isDone ? 'text-emerald-500 fill-emerald-500/20' : 'text-text-muted'
                        }`}
                      />
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={`text-xs font-semibold ${
                          isDone ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-2xs text-text-muted line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-3xs text-text-faint pt-0.5 font-mono">
                        {task.project_title && (
                          <span className="text-amber-500 font-medium">{task.project_title}</span>
                        )}
                        {task.estimated_minutes && <span>{task.estimated_minutes} min</span>}
                        {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-3xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                      isDone
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isDone ? 'Done' : 'In Progress'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
