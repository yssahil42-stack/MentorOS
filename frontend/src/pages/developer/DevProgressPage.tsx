import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  Flame,
  Zap,
  Layers,
  ArrowUpRight,
  FolderGit2,
  ArrowLeft,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks } from '../../services/taskService';
import { fetchMilestones, fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function DevProgressPage() {
  const { openAIDrawer } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const selectedProjectId = projectIdParam ? Number(projectIdParam) : null;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'developer'],
    queryFn: () => fetchTasks({ role: 'developer' }),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'developer'],
    queryFn: () => fetchMilestones({ role: 'developer' }),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects('developer'),
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

  // Filter items specifically for the selected project if specified
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
    projectMilestones.length > 0
      ? Math.round((completedMilestones.length / projectMilestones.length) * 100)
      : 0;

  const totalEstimatedMins = projectTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const completedMins = completedTasks.reduce(
    (sum, t) => sum + (t.actual_minutes || t.estimated_minutes || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-developer-500/20 text-developer-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-developer-400 uppercase">
              {selectedProject ? `PROJECT: ${selectedProject.title}` : 'VELOCITY & PERFORMANCE'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            {selectedProject ? `${selectedProject.title} Progress` : 'Sprint Progress & Analytics'}
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            {selectedProject
              ? selectedProject.description || 'Sprint burndown and deliverables for this project.'
              : 'Sprint burndown, task completion rate, engineering velocity, and milestone targets across all initiatives.'}
          </p>

          {selectedProject && (
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-developer-400 border border-developer-500/30 bg-developer-500/10 hover:bg-developer-500/20 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Show All Projects Progress
              </button>
            </div>
          )}
        </div>

        <Link to="/app/developer/projects">
          <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-developer-400" />
            All Projects
          </Button>
        </Link>
      </div>

      {/* 4 Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-developer-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-developer-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{taskCompletionRate}%</span>
            <span className="text-xs text-text-muted">
              ({completedTasks.length}/{projectTasks.length})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-developer-400">
            {projectTasks.length - completedTasks.length} tasks remaining
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Milestones Delivered</span>
            <Flag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{milestoneRate}%</span>
            <span className="text-xs text-text-muted">
              ({completedMilestones.length}/{projectMilestones.length})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400">
            {projectMilestones.length - completedMilestones.length} remaining
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Hours Logged</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">
              {(completedMins / 60).toFixed(1)}h
            </span>
            <span className="text-xs text-text-muted">
              / {(totalEstimatedMins / 60).toFixed(1)}h est
            </span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-400">Sprint capacity tracked</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Scope Scope</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">
              {selectedProject ? '1 Project' : `${projects.length} Total`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-400">
            {selectedProject ? 'Active focused view' : 'All engineering initiatives'}
          </div>
        </Card>
      </div>

      {/* Progress Breakdown Bars */}
      <Card className="p-6 space-y-6">
        <h3 className="text-base font-bold text-text-primary">
          {selectedProject ? 'Project Deliverables & Milestones' : 'Project Completion Breakdown'}
        </h3>

        <div className="space-y-4">
          {displayedProjects.map((proj) => {
            const thisProjTasks = tasks.filter(
              (t) =>
                t.project_id === proj.id ||
                (t.project_title &&
                  t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
            );
            const thisComp = thisProjTasks.filter((t) => t.status === 'completed').length;
            const thisTot = thisProjTasks.length;
            const dynamicP =
              thisTot > 0 ? Math.round((thisComp / thisTot) * 100) : proj.progress || 0;

            return (
              <div key={proj.id} className="space-y-2 p-4 rounded-xl border border-border-base bg-bg-surface">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary text-sm">{proj.title}</span>
                  <span className="font-mono font-bold text-developer-400 bg-developer-500/10 px-2 py-0.5 rounded-full border border-developer-500/25">
                    {dynamicP}%
                  </span>
                </div>

                <div className="w-full bg-bg-base h-2.5 rounded-full overflow-hidden border border-border-base">
                  <div
                    className="bg-gradient-to-r from-developer-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dynamicP}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-2xs text-text-faint pt-1">
                  <span>{proj.description || 'No description.'}</span>
                  <span className="font-mono font-semibold">
                    {thisComp}/{thisTot} tasks completed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Task List for Selected Project */}
      {selectedProject && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-base">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-developer-400" />
                Tasks &amp; Deliverables ({projectTasks.length})
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                All roadmap tasks associated with {selectedProject.title}
              </p>
            </div>
          </div>

          {projectTasks.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">
              No tasks logged under this project yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {projectTasks.map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                      isDone
                        ? 'bg-bg-surface/50 border-border-base/50 opacity-60'
                        : 'bg-bg-surface border-border-base shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 ${
                          isDone ? 'text-emerald-400 fill-emerald-400/20' : 'text-text-muted'
                        }`}
                      />
                      <div>
                        <p className={`font-semibold ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-2xs text-text-muted line-clamp-1 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.estimated_minutes ? (
                        <span className="text-3xs font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded border border-border-subtle">
                          {task.estimated_minutes}m
                        </span>
                      ) : null}
                      <span
                        className={`text-3xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isDone ? 'Done' : 'To Do'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
