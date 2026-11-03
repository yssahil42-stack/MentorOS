import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Filter,
  Trash2,
  Award,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchMilestones,
  createMilestone,
  updateMilestone,
} from '../../services/projectService';
import { fetchTasks } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Project, ProjectPriority, Milestone } from '../../types/project';

export default function AcademicProjectsPage() {
  const { openAIDrawer, openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // New Project Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<ProjectPriority>('high');
  const [newTargetDate, setNewTargetDate] = useState('');

  // New Milestone Form State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeProjectForMilestone, setActiveProjectForMilestone] = useState<number | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneTargetDate, setMilestoneTargetDate] = useState('');

  // Fetch strictly role: 'student' projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', 'student'],
    queryFn: () => fetchMilestones(),
  });

  // Fetch tasks to dynamically compute real-time milestone and project progress
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return createProject({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        target_date: newTargetDate,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Academic project created successfully! 🎓', 'success');
    },
    onError: () => {
      showToast('Failed to create academic project', 'error');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Project removed', 'info');
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectForMilestone) return;
      return createMilestone({
        project_id: activeProjectForMilestone,
        title: milestoneTitle,
        target_date: milestoneTargetDate,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsMilestoneModalOpen(false);
      setMilestoneTitle('');
      setMilestoneTargetDate('');
      setActiveProjectForMilestone(null);
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Academic milestone added!', 'success');
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async (m: Milestone) => {
      const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
      return updateMilestone(m.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Milestone status updated!', 'success');
    },
  });

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const avgProgress = projects.length
    ? Math.round(
        projects.reduce((acc, p) => {
          const pTasks = tasks.filter(
            (t) =>
              t.project_id === p.id ||
              (t.project_title &&
                t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
          );
          const pProg =
            pTasks.length > 0
              ? Math.round(
                  (pTasks.filter((t) => t.status === 'completed').length / pTasks.length) * 100
                )
              : p.progress || 0;
          return acc + pProg;
        }, 0) / projects.length
      )
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-student-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-student-500/15 border border-student-500/25 text-student-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-student-500/10 text-student-300 border border-student-500/20">
                CAPSTONE &amp; RESEARCH SUITE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Academic Projects &amp; Thesis
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Organize term research papers, capstone deliverables, lab experiments, and AI-assisted
              literature roadmaps.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="!bg-solar-500 hover:!bg-solar-600 shadow-glow-solar"
              icon={<Plus className="w-4 h-4" />}
            >
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-student-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Academic Projects</span>
            <BookOpen className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">{projects.length}</div>
          <p className="text-2xs text-text-muted mt-1">Under active supervision</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Milestones Completed</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {completedMilestones}{' '}
            <span className="text-xs font-normal text-text-muted">/ {totalMilestones || 8}</span>
          </div>
          <p className="text-2xs text-amber-400 mt-1">
            {totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 60}%
            completed
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Overall Progress</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">{avgProgress}%</div>
          <p className="text-2xs text-emerald-400 mt-1">Across all courses</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>AI Research Assistant</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-sm font-bold text-text-primary">Ready to Assist</div>
          <button
            onClick={() =>
              openAIDrawer(
                'Generate a capstone research methodology with literature review milestones and experiment timeline'
              )
            }
            className="text-2xs text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1 font-semibold"
          >
            Generate Roadmap <ArrowRight className="w-3 h-3" />
          </button>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-base">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search academic projects..."
            className="w-full pl-9 pr-4 py-2 bg-bg-base/80 border border-border-base rounded-xl text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-student-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
          {(['all', 'active', 'planning', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? 'bg-student-500/20 text-student-300 border border-student-500/30'
                  : 'bg-bg-base text-text-muted hover:text-text-primary border border-border-base'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List / Grid */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : filteredProjects.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-border-base">
          <GraduationCap className="w-12 h-12 text-student-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-text-primary">No academic projects found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1 mb-4">
            Create your first capstone project, thesis outline, or term paper deliverable to track
            research milestones.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openCaptureModal('ai')}
              icon={<Sparkles className="w-4 h-4 text-student-400" />}
            >
              AI Capture Project
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Project Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProjects.map((project) => {
            const projectMilestones = milestones.filter((m) => m.project_id === project.id);
            const isExpanded = selectedProjectId === project.id;
            const projTasks = tasks.filter(
              (t) =>
                t.project_id === project.id ||
                (t.project_title &&
                  t.project_title.trim().toLowerCase() === project.title.trim().toLowerCase())
            );
            const completedProjTasks = projTasks.filter((t) => t.status === 'completed').length;
            const totalProjTasks = projTasks.length;
            const dynamicProgress =
              totalProjTasks > 0
                ? Math.round((completedProjTasks / totalProjTasks) * 100)
                : projectMilestones.length > 0
                  ? Math.round(
                      (projectMilestones.filter((m) => m.status === 'completed').length /
                        projectMilestones.length) *
                        100
                    )
                  : project.progress || 0;

            return (
              <Card
                key={project.id}
                className="p-5 flex flex-col justify-between hover:border-student-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-text-primary group-hover:text-student-400 transition-colors">
                        {project.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => deleteProjectMutation.mutate(project.id)}
                      className="p-1.5 text-text-faint hover:text-red-400 rounded-lg hover:bg-bg-elevated transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {project.description && (
                    <p className="text-xs text-text-muted mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-2xs font-semibold">
                      <span className="text-text-muted">Research Progress</span>
                      <span className="text-student-400 font-mono font-bold">
                        {dynamicProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                      <div
                        className="bg-gradient-to-r from-student-500 via-amber-400 to-student-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${dynamicProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta: Target date & milestones */}
                  <div className="mt-4 flex items-center justify-between text-2xs text-text-muted border-t border-border-base/60 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-student-400" />
                      {project.target_date
                        ? `Target: ${new Date(project.target_date).toLocaleDateString()}`
                        : 'No set deadline'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      {projectMilestones.length} milestones
                    </span>
                  </div>

                  {/* Milestones Preview or Expand */}
                  <div className="mt-3">
                    <button
                      onClick={() => setSelectedProjectId(isExpanded ? null : project.id)}
                      className="text-xs font-semibold text-student-300 hover:text-student-200 flex items-center gap-1 py-1"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                      {isExpanded ? 'Hide Milestones' : 'View Milestones & Roadmap'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2 bg-bg-base/70 p-3 rounded-xl border border-border-base">
                        <div className="flex items-center justify-between pb-1 border-b border-border-base/50">
                          <span className="text-2xs font-bold text-text-secondary uppercase">
                            Research Phases
                          </span>
                          <button
                            onClick={() => {
                              setActiveProjectForMilestone(project.id);
                              setIsMilestoneModalOpen(true);
                            }}
                            className="text-2xs font-semibold text-student-400 hover:text-student-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Phase
                          </button>
                        </div>

                        {projectMilestones.length === 0 ? (
                          <p className="text-2xs text-text-faint py-2 text-center">
                            No milestones yet. Click "+ Add Phase" or use AI to generate.
                          </p>
                        ) : (
                          projectMilestones.map((m, mIdx) => {
                            const isDone = m.status === 'completed';
                            // Calculate subtasks belonging to this phase
                            const phaseTasks = projTasks.filter((t, tIdx) => {
                              const desc = (t.description || '').toLowerCase();
                              const title = (t.title || '').toLowerCase();
                              const mTitle = (m.title || '').toLowerCase();
                              if (
                                desc.includes(`phase ${mIdx + 1}`) ||
                                title.includes(`phase ${mIdx + 1}`)
                              )
                                return true;
                              if (mTitle && (desc.includes(mTitle) || title.includes(mTitle)))
                                return true;
                              return tIdx % Math.max(projectMilestones.length, 1) === mIdx;
                            });
                            const phaseCompleted = phaseTasks.filter(
                              (t) => t.status === 'completed'
                            ).length;
                            const phaseProgress =
                              phaseTasks.length > 0
                                ? Math.round((phaseCompleted / phaseTasks.length) * 100)
                                : isDone
                                  ? 100
                                  : 0;

                            return (
                              <div
                                key={m.id}
                                className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-bg-surface border border-border-base/60 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      onClick={() => toggleMilestoneMutation.mutate(m)}
                                      className="text-text-muted hover:text-student-400"
                                      title={isDone ? 'Mark pending' : 'Mark completed'}
                                    >
                                      <CheckCircle2
                                        className={`w-4 h-4 ${
                                          isDone
                                            ? 'text-student-400 fill-student-400/20'
                                            : 'text-text-muted'
                                        }`}
                                      />
                                    </button>
                                    <span
                                      className={`truncate font-medium ${
                                        isDone
                                          ? 'line-through text-text-muted'
                                          : 'text-text-primary'
                                      }`}
                                    >
                                      {m.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {m.target_date && (
                                      <span className="text-3xs text-text-faint">
                                        {new Date(m.target_date).toLocaleDateString()}
                                      </span>
                                    )}
                                    <span className="text-3xs font-mono font-bold text-student-400">
                                      {phaseProgress}%
                                    </span>
                                  </div>
                                </div>

                                {phaseTasks.length > 0 && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-border-subtle/50 text-3xs text-text-muted">
                                    <div className="flex-1 bg-bg-base h-1 rounded-full overflow-hidden border border-border-subtle">
                                      <div
                                        className="bg-student-400 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${phaseProgress}%` }}
                                      />
                                    </div>
                                    <span className="font-mono">
                                      {phaseCompleted}/{phaseTasks.length} tasks
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-2xs text-student-400 hover:text-student-300"
                      onClick={() => {
                        setActiveProjectForMilestone(project.id);
                        setIsMilestoneModalOpen(true);
                      }}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add Milestone
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-2xs text-solar-500 hover:text-solar-400 font-semibold"
                      onClick={() =>
                        openAIDrawer(
                          `Draft a portfolio case study and LinkedIn post for completed project: "${project.title}". Highlight key milestones, technical takeaways, and deliverables.`
                        )
                      }
                      icon={<FileText className="w-3 h-3" />}
                    >
                      Draft Case Study / Post
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-2xs"
                    onClick={() =>
                      openAIDrawer(
                        `Suggest literature review and methodology next steps for academic project: "${project.title}"`
                      )
                    }
                    icon={<Sparkles className="w-3 h-3 text-student-400" />}
                  >
                    AI Advisory
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Academic Project / Thesis"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            createProjectMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Project / Paper Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Simulator in Rust"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Course / Abstract / Description
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Capstone deliverable for CS-480. Involves Raft consensus implementation, benchmark harness, and latex evaluation report."
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as ProjectPriority)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Target Submission Date
              </label>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
              ></input>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                openCaptureModal('ai');
              }}
              icon={<Sparkles className="w-3.5 h-3.5 text-student-400" />}
              className="text-student-400"
            >
              Ask AI to structure
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
                disabled={!newTitle.trim() || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'Saving...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Add Academic Milestone"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!milestoneTitle.trim()) return;
            createMilestoneMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Milestone / Deliverable Title *
            </label>
            <input
              type="text"
              required
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="e.g. Complete Literature Review Draft"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              value={milestoneTargetDate}
              onChange={(e) => setMilestoneTargetDate(e.target.value)}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsMilestoneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
              disabled={!milestoneTitle.trim() || createMilestoneMutation.isPending}
            >
              Add Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
