import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Flag,
  Briefcase,
  Building2,
  PieChart,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchTasks, updateTask } from '../../services/taskService';
import { fetchMilestones, fetchProjects, fetchProject } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DEFAULT_JOB_TRACKS = [
  {
    id: 1,
    title: 'Recommendation System Development Roadmap',
    description:
      'A structured plan to design, implement, and evaluate a recommendation system within one month using Python, SQL, and collaborative filtering.',
    progress: 40,
    role: 'job_seeker',
    milestones: [
      {
        id: 101,
        project_id: 1,
        title: 'Phase 1: Dataset & Matrix Factorization',
        description: 'Clean MovieLens dataset and implement baseline matrix factorization',
        status: 'completed',
        target_date: '2026-11-15',
      },
      {
        id: 102,
        project_id: 1,
        title: 'Phase 2: Hybrid Filtering & Precision@K',
        description: 'Implement collaborative filtering with user-item embeddings',
        status: 'pending',
        target_date: '2026-11-25',
      },
      {
        id: 103,
        project_id: 1,
        title: 'Phase 3: Production API & Dashboard Demo',
        description: 'Package recommendations into a FastAPI endpoint with interactive UI',
        status: 'pending',
        target_date: '2026-12-05',
      },
    ],
    tasks: [
      {
        id: 1001,
        project_id: 1,
        title: 'Clean MovieLens ratings matrix & handle missing values',
        description: 'Normalize sparse matrix and remove cold-start anomalies',
        status: 'completed',
        estimated_minutes: 45,
      },
      {
        id: 1002,
        project_id: 1,
        title: 'Implement SVD matrix factorization baseline',
        description: 'Compute latent feature representations using Scikit-Learn / PyTorch',
        status: 'completed',
        estimated_minutes: 90,
      },
      {
        id: 1003,
        project_id: 1,
        title: 'Build collaborative filtering recommendation pipeline',
        description: 'Generate top-N candidate recommendations with cosine similarity',
        status: 'todo',
        estimated_minutes: 60,
      },
      {
        id: 1004,
        project_id: 1,
        title: 'Evaluate RMSE, NDCG and Precision@10 metrics',
        description: 'Benchmark offline accuracy against standard train/test split',
        status: 'todo',
        estimated_minutes: 45,
      },
      {
        id: 1005,
        project_id: 1,
        title: 'Package FastAPI model serving endpoint',
        description: 'Expose recommendations via REST endpoint with swagger docs',
        status: 'todo',
        estimated_minutes: 75,
      },
    ],
  },
  {
    id: 2,
    title: 'Data Analyst & Analytics Engineering Track',
    description:
      'Master advanced SQL window functions, cohort retention modeling, and executive Tableau dashboards.',
    progress: 66,
    role: 'job_seeker',
    milestones: [
      {
        id: 201,
        project_id: 2,
        title: 'Phase 1: Advanced SQL & Star Schema Modeling',
        description: 'Data modeling with fact and dimension tables',
        status: 'completed',
        target_date: '2026-11-10',
      },
      {
        id: 202,
        project_id: 2,
        title: 'Phase 2: Executive KPI Retention Dashboard',
        description: 'Interactive dashboard published to Tableau Public',
        status: 'completed',
        target_date: '2026-11-20',
      },
      {
        id: 203,
        project_id: 2,
        title: 'Phase 3: Direct Recruiter InMail Blitz',
        description: 'Targeted outreach to talent acquisition leads',
        status: 'pending',
        target_date: '2026-11-30',
      },
    ],
    tasks: [
      {
        id: 2001,
        project_id: 2,
        title: 'Write window function analytical queries (LEAD/LAG, RANK)',
        description: 'Analyze user cohort progression over monthly active periods',
        status: 'completed',
        estimated_minutes: 60,
      },
      {
        id: 2002,
        project_id: 2,
        title: 'Design Star Schema fact & dimension tables',
        description: 'Model transactions and dimensions for fast aggregation',
        status: 'completed',
        estimated_minutes: 90,
      },
      {
        id: 2003,
        project_id: 2,
        title: 'Publish executive churn dashboard on Tableau Public',
        description: 'Live interactive dashboard with drill-down filters',
        status: 'completed',
        estimated_minutes: 120,
      },
      {
        id: 2004,
        project_id: 2,
        title: 'Target 15 senior recruiter connections on LinkedIn',
        description: 'Personalized messages referencing the portfolio project',
        status: 'todo',
        estimated_minutes: 45,
      },
    ],
  },
];

export default function JobProgressPage() {
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const selectedProjectId = projectIdParam ? Number(projectIdParam) : null;

  // 1. Fetch user projects
  const { data: fetchedProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'job_seeker'],
    queryFn: () => fetchProjects('job_seeker'),
  });

  // 2. If a specific project is selected, fetch its detail
  const { data: singleProject, isLoading: singleLoading } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => (selectedProjectId ? fetchProject(selectedProjectId) : null),
    enabled: !!selectedProjectId,
  });

  // 3. Fetch tasks
  const { data: fetchedTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', selectedProjectId ? `project_${selectedProjectId}` : 'job_seeker'],
    queryFn: () =>
      selectedProjectId
        ? fetchTasks({ project_id: selectedProjectId, role: 'job_seeker' })
        : fetchTasks({ role: 'job_seeker' }),
  });

  // 4. Fetch milestones
  const { data: fetchedMilestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', selectedProjectId ? `project_${selectedProjectId}` : 'job_seeker'],
    queryFn: () =>
      selectedProjectId
        ? fetchMilestones({ project_id: selectedProjectId, role: 'job_seeker' })
        : fetchMilestones({ role: 'job_seeker' }),
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'todo' | 'completed' }) => {
      return updateTask(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Task updated', 'success');
    },
  });

  if (tasksLoading || milestonesLoading || projectsLoading || (selectedProjectId && singleLoading)) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  // Combine fetched projects with baseline fallbacks
  const availableProjects = fetchedProjects.length > 0 ? fetchedProjects : DEFAULT_JOB_TRACKS;

  // Resolve selected project safely
  const selectedProject = selectedProjectId
    ? availableProjects.find(
        (p) => p.id === selectedProjectId || String(p.id) === String(selectedProjectId)
      ) ||
      singleProject ||
      DEFAULT_JOB_TRACKS.find(
        (p) => p.id === selectedProjectId || String(p.id) === String(selectedProjectId)
      ) ||
      null
    : null;

  // STRICT FILTER RULE: If a projectId is in the URL, ONLY display that project! Never show other projects.
  const displayedProjects = selectedProjectId
    ? selectedProject
      ? [selectedProject]
      : []
    : availableProjects;

  // Filter tasks specifically for this project
  const projectTasks = selectedProject
    ? (singleProject?.tasks && singleProject.tasks.length > 0
        ? singleProject.tasks
        : (selectedProject as any).tasks && (selectedProject as any).tasks.length > 0
        ? (selectedProject as any).tasks
        : fetchedTasks.filter(
            (t) =>
              t.project_id === selectedProject.id ||
              String(t.project_id) === String(selectedProject.id) ||
              (t.project_title &&
                t.project_title.trim().toLowerCase() === selectedProject.title.trim().toLowerCase())
          ))
    : fetchedTasks.length > 0
    ? fetchedTasks
    : DEFAULT_JOB_TRACKS.flatMap((p) => p.tasks);

  // Filter milestones specifically for this project
  const projectMilestones = selectedProject
    ? (singleProject?.milestones && singleProject.milestones.length > 0
        ? singleProject.milestones
        : (selectedProject as any).milestones && (selectedProject as any).milestones.length > 0
        ? (selectedProject as any).milestones
        : fetchedMilestones.filter(
            (m) =>
              m.project_id === selectedProject.id ||
              String(m.project_id) === String(selectedProject.id) ||
              ((m as any).project_title &&
                (m as any).project_title.trim().toLowerCase() ===
                  selectedProject.title.trim().toLowerCase())
          ))
    : fetchedMilestones.length > 0
    ? fetchedMilestones
    : DEFAULT_JOB_TRACKS.flatMap((p) => p.milestones);

  // Calculate task and milestone completion rates
  const completedTasks = projectTasks.filter((t: any) => t.status === 'completed');
  const taskCompletionRate =
    projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

  const completedMilestones = projectMilestones.filter((m: any) => m.status === 'completed');
  const milestoneRate =
    projectMilestones.length > 0
      ? Math.round((completedMilestones.length / projectMilestones.length) * 100)
      : 0;

  // Dynamic overall project progress
  const dynamicProjectProgress =
    projectTasks.length > 0
      ? taskCompletionRate
      : projectMilestones.length > 0
      ? milestoneRate
      : selectedProject?.progress || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-500 border border-teal-500/25">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-2xs font-mono font-bold uppercase tracking-wider text-teal-500">
              {selectedProject ? `PIPELINE TRACK: ${selectedProject.title}` : 'CAREER & SEARCH VELOCITY'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            {selectedProject ? `${selectedProject.title} Progress` : 'Job Search Progress & Analytics'}
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            {selectedProject
              ? selectedProject.description ||
                'Application pipeline milestones, interview checkpoints, and preparation tasks for this track.'
              : 'Track interview preparation milestones, portfolio projects, and application delivery targets.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedProject ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchParams({})}
              className="text-xs font-semibold flex items-center gap-1.5 text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Show All Tracks Progress
            </Button>
          ) : (
            <Link to="/app/job-seeker/search-plan">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-teal-500" />
                Job Analyzer
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Selected Project Filter Banner */}
      {selectedProject && (
        <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-500/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-teal-500 shrink-0" />
            <div>
              <span className="font-semibold text-text-primary">
                Filtered to Track: {selectedProject.title}
              </span>
              <span className="text-text-muted text-2xs block">
                Showing milestone completion, interview rounds, and tasks for this specific track only.
              </span>
            </div>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setSearchParams({})}
            className="text-teal-500 hover:text-teal-400 text-2xs font-semibold shrink-0"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milestones Achieved */}
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Milestones Achieved</span>
            <Flag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {milestoneRate}%
            </span>
            <span className="text-xs text-text-muted">
              ({completedMilestones.length}/{projectMilestones.length})
            </span>
          </div>
          <div className="mt-2 text-2xs text-emerald-500 font-medium">
            {projectMilestones.length - completedMilestones.length === 0
              ? 'All checkpoints completed!'
              : `${projectMilestones.length - completedMilestones.length} checkpoints remaining`}
          </div>
        </Card>

        {/* Search Tasks Completed */}
        <Card className="p-4 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Track Tasks Done</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {taskCompletionRate}%
            </span>
            <span className="text-xs text-text-muted">
              ({completedTasks.length}/{projectTasks.length})
            </span>
          </div>
          <div className="mt-2 text-2xs text-teal-500 font-medium">
            {projectTasks.length - completedTasks.length === 0
              ? 'All tasks completed!'
              : `${projectTasks.length - completedTasks.length} tasks remaining`}
          </div>
        </Card>

        {/* Track Scope */}
        <Card className="p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Track Scope</span>
            <Building2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {selectedProject ? '1 Track' : `${availableProjects.length} Tracks`}
            </span>
          </div>
          <div className="mt-2 text-2xs text-cyan-500 font-medium">
            {selectedProject ? 'Active focused view' : 'All target initiatives'}
          </div>
        </Card>

        {/* Overall Velocity / Progress */}
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Track Completion</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono tracking-tight">
              {dynamicProjectProgress}%
            </span>
            <span className="text-xs text-text-muted">overall</span>
          </div>
          <div className="mt-2 text-2xs text-purple-500 font-medium">
            Calculated completion score
          </div>
        </Card>
      </div>

      {/* If Project Selected: Dedicated Project Progress Breakdown */}
      {selectedProject ? (
        <Card className="p-6 space-y-4 border border-border-base shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-base">
            <div>
              <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-500" />
                {selectedProject.title} Progress Overview
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {selectedProject.description || 'Target track pipeline and deliverables.'}
              </p>
            </div>
            <span className="font-mono font-bold text-teal-500 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/25 text-sm">
              {dynamicProjectProgress}%
            </span>
          </div>

          <div className="w-full bg-bg-base h-3 rounded-full overflow-hidden border border-border-base">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${dynamicProjectProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-2xs text-text-faint pt-1">
            <span>
              {completedMilestones.length}/{projectMilestones.length} Milestones Achieved
            </span>
            <span>
              {completedTasks.length}/{projectTasks.length} Tasks Completed
            </span>
          </div>
        </Card>
      ) : (
        /* If No Project Filter: Show All Tracks */
        <Card className="p-6 space-y-4 border border-border-base shadow-sm">
          <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2 pb-2 border-b border-border-base">
            <PieChart className="w-4 h-4 text-teal-500" />
            Active Target Tracks &amp; Roadmaps ({availableProjects.length})
          </h3>

          {availableProjects.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">
              No active roadmaps found. Generate or save a career plan to see progress here.
            </p>
          ) : (
            <div className="space-y-4">
              {availableProjects.map((proj) => {
                const thisProjTasks = (proj as any).tasks || fetchedTasks.filter(
                  (t) =>
                    t.project_id === proj.id ||
                    String(t.project_id) === String(proj.id) ||
                    (t.project_title &&
                      t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
                );
                const thisComp = thisProjTasks.filter((t: any) => t.status === 'completed').length;
                const thisTot = thisProjTasks.length;
                const dynamicP =
                  thisTot > 0 ? Math.round((thisComp / thisTot) * 100) : proj.progress || 0;

                return (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-border-base bg-bg-surface hover:border-teal-500/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSearchParams({ projectId: String(proj.id) })}
                        className="font-bold text-text-primary hover:text-teal-500 text-sm transition-colors text-left"
                      >
                        {proj.title}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/25">
                          {dynamicP}%
                        </span>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setSearchParams({ projectId: String(proj.id) })}
                          className="text-2xs text-teal-500 hover:text-teal-400"
                        >
                          View Track Progress
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${dynamicP}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-2xs text-text-faint">
                      <span>{proj.description || 'Target track pipeline'}</span>
                      <span>
                        {thisComp}/{thisTot} tasks completed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Selected Project: Milestones / Checkpoints */}
      {selectedProject && (
        <Card className="p-6 space-y-4 border border-border-base shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-base">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-500" />
                Roadmap Milestones ({projectMilestones.length})
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Target checkpoints and interview stages for {selectedProject.title}
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {completedMilestones.length}/{projectMilestones.length} Completed
            </span>
          </div>

          {projectMilestones.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">
              No milestones defined for this track yet.
            </p>
          ) : (
            <div className="space-y-3">
              {projectMilestones.map((ms: any) => {
                const isCompleted = ms.status === 'completed';
                return (
                  <div
                    key={ms.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                      isCompleted
                        ? 'bg-bg-surface/50 border-emerald-500/30'
                        : 'bg-bg-surface border-border-base'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Flag
                        className={`w-4 h-4 mt-0.5 ${
                          isCompleted ? 'text-emerald-500 fill-emerald-500/20' : 'text-text-muted'
                        }`}
                      />
                      <div>
                        <h4
                          className={`font-semibold ${
                            isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                          }`}
                        >
                          {ms.title}
                        </h4>
                        {ms.description && (
                          <p className="text-2xs text-text-muted mt-0.5">{ms.description}</p>
                        )}
                        {ms.target_date && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-text-faint mt-1">
                            <Calendar className="w-2.5 h-2.5" />
                            Target: {ms.target_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-3xs px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Selected Project: Tasks & Deliverables Checklist */}
      {selectedProject && (
        <Card className="p-6 space-y-4 border border-border-base shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-base">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                Track Tasks &amp; Deliverables ({projectTasks.length})
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Check off completed tasks to update this roadmap's progress in real-time
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              {completedTasks.length}/{projectTasks.length} Done
            </span>
          </div>

          {projectTasks.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">
              No tasks logged under this track yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {projectTasks.map((task: any) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    onClick={() =>
                      toggleTaskMutation.mutate({
                        id: task.id,
                        status: isDone ? 'todo' : 'completed',
                      })
                    }
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs cursor-pointer hover:border-teal-500/40 ${
                      isDone
                        ? 'bg-bg-surface/50 border-border-base/50 opacity-60'
                        : 'bg-bg-surface border-border-base shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                          isDone
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'border-border-subtle bg-bg-base hover:border-teal-500'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isDone ? 'line-through text-text-muted' : 'text-text-primary'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-2xs text-text-muted line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
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
