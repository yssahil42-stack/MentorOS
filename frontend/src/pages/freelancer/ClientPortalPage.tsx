import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Building,
  CheckCircle2,
  Clock,
  Flag,
  TrendingUp,
  Calendar,
  ArrowRight,
  Share2,
  ExternalLink,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  fetchProjects,
  fetchMilestones,
  fetchPublicClientPortal,
} from '../../services/projectService';
import { fetchTasks } from '../../services/taskService';
import { formatDate, formatMinutes } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

interface ClientPortalPageProps {
  projectId?: string;
}

export default function ClientPortalPage({ projectId: propProjectId }: ClientPortalPageProps) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const projectId = propProjectId || params.projectId || searchParams.get('project');
  const [copied, setCopied] = useState(false);

  const token = searchParams.get('token');
  const isPublicView = !!token && token.startsWith('public-');

  useEffect(() => {
    if (isPublicView) {
      document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow');
    }
  }, [isPublicView]);

  const { data: publicData, isLoading: publicLoading } = useQuery({
    queryKey: ['public-portal', projectId, token],
    queryFn: () => fetchPublicClientPortal(parseInt(projectId || '0', 10), token || undefined),
    enabled: isPublicView && !!projectId,
  });

  const { data: projects = [], isLoading: authProjectsLoading } = useQuery({
    queryKey: ['projects', 'freelancer'],
    queryFn: () => fetchProjects(),
    enabled: !isPublicView,
  });

  const { data: allMilestones = [] } = useQuery({
    queryKey: ['milestones', 'freelancer'],
    queryFn: () => fetchMilestones(),
    enabled: !isPublicView && !!projectId,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', 'freelancer'],
    queryFn: () => fetchTasks({ role: 'freelancer' }),
    enabled: !isPublicView && !!projectId,
  });

  const project = isPublicView
    ? publicData?.project
    : projects.find((p) => p.id === parseInt(projectId || '0', 10));
  const projectMilestones = isPublicView
    ? publicData?.milestones || []
    : allMilestones.filter((m) => m.project_id === project?.id);
  const projectTasks = isPublicView
    ? publicData?.tasks || []
    : allTasks.filter((t) => t.project_id === project?.id);
  const projectsLoading = isPublicView ? publicLoading : authProjectsLoading;

  const completedMilestones = projectMilestones.filter((m) => m.status === 'completed');
  const inProgressMilestones = projectMilestones.filter((m) => m.status === 'in_progress');
  const pendingMilestones = projectMilestones.filter((m) => m.status === 'pending');

  const completedTasks = projectTasks.filter((t) => t.status === 'completed');
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = projectTasks.filter((t) => t.status === 'todo');

  // ─── Share URL ──────────────────────────────────────────────────────────────
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/client/${project?.id}?token=public-${project?.id}`
      : '';

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (projectsLoading || (!project && projectId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center space-y-4">
          <LoadingSkeleton variant="avatar" className="w-12 h-12 mx-auto" />
          <p className="text-text-muted">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center space-y-4 p-8">
          <div className="p-4 rounded-2xl bg-bg-surface border border-border-base inline-block mb-4">
            <AlertCircle className="w-12 h-12 text-text-faint mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Project Not Found</h1>
          <p className="text-text-muted max-w-md mx-auto">
            This project doesn't exist or the link has expired. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="border-b border-border-base bg-bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-text-primary">{project.title}</h1>
                <p className="text-xs text-text-muted">
                  {isPublicView ? 'Public Client View' : 'Freelancer Dashboard'}
                </p>
              </div>
            </div>

            {!isPublicView && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyShareUrl}
                  className="gap-2"
                  icon={
                    copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )
                  }
                >
                  {copied ? 'Copied!' : 'Share Link'}
                </Button>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" icon={<ExternalLink className="w-4 h-4" />}>
                    Open Public View
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Project Overview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Project Overview</h2>
            {!isPublicView && (
              <a href={`/app/freelancer/projects`}>
                <Button variant="ghost" size="sm">
                  Edit Project →
                </Button>
              </a>
            )}
          </div>

          {project.description && (
            <p className="text-text-secondary leading-relaxed">{project.description}</p>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Overall Progress"
              value={`${project.progress}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="amber"
            />
            <MetricCard
              label="Milestones"
              value={`${completedMilestones.length}/${projectMilestones.length}`}
              subtitle={`${inProgressMilestones.length} in progress`}
              icon={<Flag className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              label="Tasks"
              value={`${completedTasks.length}/${projectTasks.length}`}
              subtitle={`${inProgressTasks.length} in progress`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="emerald"
            />
            <MetricCard
              label="Target Date"
              value={project.target_date ? formatDate(project.target_date, 'short') : 'Not set'}
              subtitle={
                project.target_date && !isOverdue(project.target_date) ? 'On track' : 'Overdue'
              }
              icon={<Calendar className="w-5 h-5" />}
              color={project.target_date && isOverdue(project.target_date) ? 'red' : 'purple'}
            />
          </div>
        </section>

        {/* Milestones */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Milestones</h2>
            {!isPublicView && projectMilestones.length > 0 && (
              <span className="text-xs text-text-muted">
                {completedMilestones.length} of {projectMilestones.length} completed
              </span>
            )}
          </div>

          {projectMilestones.length === 0 ? (
            <EmptyState
              icon="Flag"
              title="No milestones yet"
              description="Milestones will appear here as they're added to the project."
            />
          ) : (
            <div className="space-y-3">
              {projectMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  isPublicView={isPublicView}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity / Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
            {!isPublicView && projectTasks.length > 0 && (
              <span className="text-xs text-text-muted">
                {completedTasks.length} of {projectTasks.length} tasks completed
              </span>
            )}
          </div>

          {projectTasks.length === 0 ? (
            <EmptyState
              icon="CheckCircle2"
              title="No tasks yet"
              description="Tasks will appear here as work progresses."
            />
          ) : (
            <div className="space-y-2">
              {projectTasks
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 10)
                .map((task) => (
                  <TaskCard key={task.id} task={task} isPublicView={isPublicView} />
                ))}
            </div>
          )}

          {!isPublicView && projectTasks.length > 10 && (
            <div className="mt-4 text-center">
              <a href={`/app/freelancer/tasks`}>
                <Button variant="ghost" size="sm">
                  View All Tasks →
                </Button>
              </a>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-border-base pt-6 text-center">
          <p className="text-xs text-text-muted">
            {isPublicView
              ? 'This is a read-only client view. Contact your freelancer for changes.'
              : 'Share the public link above to give your client access to this view.'}
          </p>
        </footer>
      </main>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'amber' | 'blue' | 'emerald' | 'purple' | 'red';
}

function MetricCard({ label, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
  };

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2 rounded-xl', colorClasses[color])}>{icon}</div>
      </div>
    </Card>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

function EmptyState({ icon: IconName, title, description }: EmptyStateProps) {
  const iconMap: Record<string, React.ReactNode> = {
    Flag: <Flag className="w-10 h-10" />,
    CheckCircle2: <CheckCircle2 className="w-10 h-10" />,
    Clock: <Clock className="w-10 h-10" />,
    Building: <Building className="w-10 h-10" />,
  };

  return (
    <Card className="p-8 text-center border-border-base/50">
      <div className="p-3 rounded-2xl bg-bg-surface border border-border-base inline-block mb-4">
        {iconMap[IconName] || <Flag className="w-10 h-10 text-text-faint" />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-muted">{description}</p>
    </Card>
  );
}

interface MilestoneCardProps {
  milestone: {
    id: number;
    title: string;
    description?: string;
    status: string;
    target_date?: string;
    completed_at?: string;
  };
  isPublicView: boolean;
}

function MilestoneCard({ milestone, isPublicView }: MilestoneCardProps) {
  const statusConfig = {
    completed: {
      label: 'Completed',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    pending: {
      label: 'Pending',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      icon: <Flag className="w-3.5 h-3.5" />,
    },
  };

  const config =
    statusConfig[milestone.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                config.color
              )}
            >
              {config.icon}
              {config.label}
            </span>
            {milestone.target_date && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due: {formatDate(milestone.target_date, 'medium')}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-text-primary truncate">{milestone.title}</h4>
          {milestone.description && (
            <p className="text-sm text-text-muted mt-1 line-clamp-2">{milestone.description}</p>
          )}
        </div>
        {milestone.completed_at && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Completed {formatDate(milestone.completed_at, 'medium')}
          </span>
        )}
      </div>
    </Card>
  );
}

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    updated_at: string;
  };
  isPublicView: boolean;
}

function TaskCard({ task, isPublicView }: TaskCardProps) {
  const statusConfig = {
    completed: { label: 'Done', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
    todo: { label: 'To Do', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  };

  const config = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;

  return (
    <Card className="p-3 border-border-base/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
              config.color
            )}
          >
            {config.label}
          </span>
          <h4 className="font-medium text-text-primary truncate">{task.title}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-text-muted">
            Updated {formatDate(task.updated_at, 'relative')}
          </span>
        </div>
      </div>
    </Card>
  );
}

// Need to import isOverdue
import { isOverdue } from '../../utils/dateUtils';
