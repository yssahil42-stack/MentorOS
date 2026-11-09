import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Compass,
  Clock,
  X,
  Menu,
  RotateCcw,
  Zap,
  Layers,
  ListTodo,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { useAIProposal } from '../../hooks/useAIProposal';
import {
  fetchRecentProposals,
  approveProposalItems,
  checkAiHealth,
} from '../../services/aiService';
import { createProject, createMilestone } from '../../services/projectService';
import { createTask } from '../../services/taskService';
import type {
  AIProposal,
  AIProposedMilestone,
  AIProposedTask,
  AIProposedNote,
} from '../../types/aiProposal';
import type { Project } from '../../types/project';
import { RoadmapSidebar } from '../layout/RoadmapSidebar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
const MarkdownRenderer = lazy(() => import('../ui/MarkdownRenderer'));
import { queryClient } from '../../store/queryClient';
import { cn } from '../../utils/cn';
import { getWorkspaceRole } from '../../utils/roleUtils';
import type { UserRole } from '../../types/user';

interface RoadmapWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface EditablePhase {
  id: number;
  title: string;
  duration: string;
  description: string;
  tasks: {
    id: number;
    title: string;
    description?: string;
    priority?: string;
    estimatedMinutes?: number;
    selected: boolean;
  }[];
}

export function RoadmapWorkspace({ isOpen, onClose, initialPrompt = '' }: RoadmapWorkspaceProps) {
  const { user } = useAuth();
  const { showToast, aiOnline, setAiOnline } = useWorkspace();
  const location = useLocation();
  const role = getWorkspaceRole(location.pathname, user?.role || 'student');

  // Canvas State
  const [prompt, setPrompt] = useState('');
  const {
    propose,
    cancel: cancelProposal,
    retry: retryProposal,
    progress: proposalProgress,
    status: proposalStatus,
    isTimeout: isProposalTimeout,
  } = useAIProposal();
  const isGenerating = proposalStatus === 'streaming';
  const [isSaving, setIsSaving] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AIProposal | null>(null);
  const [strategicGuidance, setStrategicGuidance] = useState<string>('');
  const [phases, setPhases] = useState<EditablePhase[]>([]);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const promptInputRef = useRef<HTMLInputElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // Reset canvas to blank state and focus prompt input when opened
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setActiveProposal(null);
      setStrategicGuidance('');
      setPhases([]);
      setIsSavedSuccess(false);
      setSavedCount(0);
      setTimeout(() => promptInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Transform proposal items into rich structured Phase Cards
  const parseProposalToPhases = (
    proposal: AIProposal
  ): { guidance: string; parsedPhases: EditablePhase[] } => {
    // 1. Extract Strategic Guidance note content or proposal summary
    const noteItem = proposal.items.find((i) => i.item_type === 'note');
    const notePayload = noteItem?.payload as AIProposedNote | undefined;
    const guidance =
      notePayload?.content && notePayload.content.length > (proposal.summary?.length || 0)
        ? notePayload.content
        : proposal.summary || 'Strategic execution guidance and roadmap overview.';

    // 2. Extract Milestone Phases
    const milestoneItems = proposal.items.filter((i) => i.item_type === 'milestone');
    const taskItems = proposal.items.filter((i) => i.item_type === 'task');

    // Default dates & durations if none specified
    const fallbackDurations = [
      'Month 1 (Weeks 1-4)',
      'Month 2 (Weeks 5-8)',
      'Month 3 (Weeks 9-12)',
      'Weeks 13-16',
    ];

    const parsedPhases: EditablePhase[] = milestoneItems.map((mItem, idx) => {
      const mPayload = mItem.payload as AIProposedMilestone;

      // Match tasks associated with this milestone/phase or distribute evenly
      const matchedTasks = taskItems.filter((tItem, tIdx) => {
        const tPayload = tItem.payload as AIProposedTask;
        if (tPayload.description && tPayload.description.toLowerCase().includes(`phase ${idx + 1}`))
          return true;
        // fallback distribution across phases
        return tIdx % Math.max(milestoneItems.length, 1) === idx;
      });

      // Calculate total minutes required for this phase
      const totalMinutes = matchedTasks.reduce((sum, tItem) => {
        const tPayload = tItem.payload as AIProposedTask;
        return sum + (Number(tPayload.estimated_minutes) || 60);
      }, 0);
      const phaseDuration = `Time: ${totalMinutes > 0 ? totalMinutes : 60}m`;

      // Enrich phase description if short
      let description = mPayload.description || '';
      if (!description || description.length < 40) {
        if (idx === 0) {
          description = `Establish core foundations, master essential syntax, configure the development environment, and build confidence through daily hands-on practice routines.`;
        } else if (idx === 1) {
          description = `Progress into core software patterns, modular architecture, and structured problem-solving with milestone mini-projects.`;
        } else {
          description = `Advance to real-world integration, testing, performance optimization, and capstone deployment ready for portfolio review.`;
        }
      }

      return {
        id: mItem.id,
        title: mPayload.title || `Phase ${idx + 1}`,
        duration: phaseDuration,
        description,
        tasks: matchedTasks.map((tItem) => {
          const tPayload = tItem.payload as AIProposedTask;
          return {
            id: tItem.id,
            title: tPayload.title,
            description: tPayload.description,
            priority: tPayload.priority || 'medium',
            estimatedMinutes: tPayload.estimated_minutes || 60,
            selected: true,
          };
        }),
      };
    });

    // If no milestones were generated, synthesize default 3 phases from prompt
    if (parsedPhases.length === 0) {
      const defaultPhases: EditablePhase[] = [
        {
          id: 101,
          title: 'Phase 1: Foundation & Core Concepts',
          duration: 'Time: 195m',
          description: `Focus on fundamentals, setup of development environment, variable scoping, input/output pipelines, and basic control flows through structured drills.`,
          tasks: [
            {
              id: 201,
              title: 'Environment Setup & Tooling Configuration',
              estimatedMinutes: 45,
              priority: 'high',
              selected: true,
            },
            {
              id: 202,
              title: 'Syntax Drills & Data Type Exercises',
              estimatedMinutes: 60,
              priority: 'medium',
              selected: true,
            },
            {
              id: 203,
              title: 'Interactive CLI Practice Tool',
              estimatedMinutes: 90,
              priority: 'high',
              selected: true,
            },
          ],
        },
        {
          id: 102,
          title: 'Phase 2: Modular Architecture & Application Logic',
          duration: 'Time: 195m',
          description: `Apply data structures, function composition, error handling, and file I/O to construct modular components and practical domain utilities.`,
          tasks: [
            {
              id: 204,
              title: 'Data Structures & Algorithmic Drills',
              estimatedMinutes: 75,
              priority: 'high',
              selected: true,
            },
            {
              id: 205,
              title: 'Modular Service & API Connector Project',
              estimatedMinutes: 120,
              priority: 'urgent',
              selected: true,
            },
          ],
        },
        {
          id: 103,
          title: 'Phase 3: Real-World Capstone & Optimization',
          duration: 'Time: 270m',
          description: `Deliver end-to-end projects, automated tests, performance profiling, and documentation showcasing real-world software engineering competencies.`,
          tasks: [
            {
              id: 206,
              title: 'Capstone Project Build & Polish',
              estimatedMinutes: 180,
              priority: 'urgent',
              selected: true,
            },
            {
              id: 207,
              title: 'Test Coverage & Deployment Verification',
              estimatedMinutes: 90,
              priority: 'medium',
              selected: true,
            },
          ],
        },
      ];
      return { guidance, parsedPhases: defaultPhases };
    }

    return { guidance, parsedPhases };
  };

  const handleRetryAiConnection = async () => {
    try {
      const res = await checkAiHealth();
      if (res.online) {
        setAiOnline(true);
        showToast('AI is online and connected!', 'success');
      } else {
        setAiOnline(false);
        showToast('Ollama is still unreachable. Please verify the service is running.', 'warning');
      }
    } catch {
      setAiOnline(false);
      showToast('Ollama is still unreachable. Please verify the service is running.', 'warning');
    }
  };

  // Generation Handler
  const handleGenerate = async (overridePrompt?: string) => {
    const text = (overridePrompt ?? prompt).trim();
    if (!text || isGenerating) return;

    setIsSavedSuccess(false);
    setSavedCount(0);

    try {
      const res = await propose(text, { role });
      if (res) {
        setActiveProposal(res);
        const { guidance, parsedPhases } = parseProposalToPhases(res);
        setStrategicGuidance(guidance);
        setPhases(parsedPhases);

        // Trigger sidebar to update recent list
        setSidebarRefreshKey((k) => k + 1);

        // Scroll canvas to top
        canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate roadmap', 'error');
    }
  };

  // Reset to blank capture state
  const handleNewRoadmap = () => {
    setPrompt('');
    setActiveProposal(null);
    setStrategicGuidance('');
    setPhases([]);
    setIsSavedSuccess(false);
    setSavedCount(0);
    setTimeout(() => promptInputRef.current?.focus(), 100);
  };

  // Select a recent roadmap to reload into canvas
  const handleSelectRecentRoadmap = (proposal: AIProposal) => {
    setPrompt(proposal.request_text || '');
    setActiveProposal(proposal);
    const { guidance, parsedPhases } = parseProposalToPhases(proposal);
    setStrategicGuidance(guidance);
    setPhases(parsedPhases);
    setIsSavedSuccess(proposal.status === 'approved');
    canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select an active project from the sidebar to generate a roadmap for it
  const handleSelectProject = (project: Project) => {
    const projectPrompt = `Create a structured execution roadmap and milestone plan for project: "${project.title}" - ${project.description || ''}`;
    setPrompt(projectPrompt);
    handleGenerate(projectPrompt);
  };

  // Save roadmap and its items into workspace
  const handleSaveToWorkspace = async () => {
    if (!activeProposal || isSaving) return;

    setIsSaving(true);
    try {
      let totalCreated = 0;

      // 1. If activeProposal has items, attempt to approve them through the backend API
      if (activeProposal.items && activeProposal.items.length > 0) {
        const allItemIds = activeProposal.items.map((i) => i.id);
        try {
          const res = await approveProposalItems(activeProposal, {
            approved_item_ids: allItemIds,
          });

          totalCreated =
            res.created_tasks.length +
            res.created_projects.length +
            res.created_milestones.length +
            res.created_events.length +
            res.created_notes.length;
        } catch {
          // If approval fails or returns 0, proceed to direct workspace creation below
        }
      }

      // 2. If backend approval created 0 items, persist the phases and tasks displayed
      // on the canvas directly into the workspace so milestones & tasks are never lost!
      if (totalCreated === 0 && phases.length > 0) {
        const rawTitle =
          prompt.trim() ||
          activeProposal.request_text ||
          `${role.charAt(0).toUpperCase() + role.slice(1)} Roadmap`;
        const projectTitle = rawTitle.length > 80 ? `${rawTitle.slice(0, 77)}...` : rawTitle;

        const newProj = await createProject({
          title: projectTitle,
          description: strategicGuidance?.slice(0, 300) || `Roadmap plan for ${projectTitle}`,
          priority: 'high',
          role: role,
        });

        if (newProj && newProj.id) {
          totalCreated += 1;

          for (let pIdx = 0; pIdx < phases.length; pIdx++) {
            const phase = phases[pIdx];
            const newMilestone = await createMilestone({
              project_id: newProj.id,
              title: phase.title || `Phase ${pIdx + 1}`,
              description: phase.description,
              role: role,
            });
            if (newMilestone) totalCreated += 1;

            for (const task of phase.tasks) {
              if (task.selected !== false) {
                const newTask = await createTask({
                  title: task.title,
                  description: task.description || `Phase ${pIdx + 1}: ${phase.title}`,
                  project_id: newProj.id,
                  priority: (task.priority as any) || 'medium',
                  estimated_minutes: task.estimatedMinutes || 60,
                  role: role,
                });
                if (newTask) totalCreated += 1;
              }
            }
          }
        }
      }

      setSavedCount(totalCreated);
      setIsSavedSuccess(true);
      showToast(`Successfully saved ${totalCreated} items into your workspace!`, 'success');

      // Refresh calendar, dashboard, tasks and project queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['milestones'] }),
        queryClient.invalidateQueries(),
      ]);
      setSidebarRefreshKey((k) => k + 1);
    } catch (err: any) {
      showToast(err.message || 'Failed to save roadmap to workspace', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Role-specific starter prompts tailored to each module
  const ROLE_STARTER_CHIPS: Record<UserRole, { title: string; prompt: string }[]> = {
    job_seeker: [
      {
        title: '🎯 30-Day Job Search & Application Sprint',
        prompt: 'Create a focused 30-day job search strategy with daily application targets and company outreach cadences',
      },
      {
        title: '🗣️ Technical & System Design Interview Prep',
        prompt: 'Create a 4-week structured technical interview, algorithm drills, and behavioral STAR questions prep roadmap',
      },
      {
        title: '📄 High-Impact Resume & Portfolio Revamp',
        prompt: 'Create a 2-week roadmap to tailor my resume for target roles, build standout case studies, and optimize LinkedIn profile',
      },
      {
        title: '💼 Recruiter Outreach & Networking Cadence',
        prompt: 'Create a 3-week cold outreach and recruiter networking roadmap for target tech companies and startups',
      },
    ],
    developer: [
      {
        title: '🏗️ Full-Stack System Architecture & MVP',
        prompt: 'Create full architectural build roadmap for a distributed real-time platform with scalable database and API endpoints',
      },
      {
        title: '🚀 CI/CD Pipeline & Docker Deployment Roadmap',
        prompt: 'Create a step-by-step roadmap to Dockerize, configure GitHub Actions CI, and deploy to cloud runners',
      },
      {
        title: '⚡ Microservices & Low-Latency Sync Engine',
        prompt: 'Create an architectural sprint plan to build a low-latency microservices backend with caching and websockets',
      },
      {
        title: '🧪 Test-Driven Suite & Security Hardening',
        prompt: 'Create an end-to-end testing, integration test coverage, and API security hardening roadmap',
      },
    ],
    freelancer: [
      {
        title: '💼 Client Project Delivery & Milestone Plan',
        prompt: 'Turn client requirements into a phased milestone roadmap with clear deliverables, review checkpoints, and deadlines',
      },
      {
        title: '📈 Retainer & Pricing Growth Strategy',
        prompt: 'Create a 60-day roadmap to land high-ticket retainer clients, standardize scopes of work, and scale freelance pricing',
      },
      {
        title: '⏱️ 2-Week Fixed-Price MVP Build Sprint',
        prompt: 'Create an agile 2-week client MVP build plan with daily subtasks, scope containment, and demo deliverables',
      },
      {
        title: '🧾 Proposal-to-Invoicing Lifecycle Roadmap',
        prompt: 'Create a structured workflow roadmap from client proposal to milestone deliverables, client portal updates, and final invoice',
      },
    ],
    student: [
      {
        title: '🐍 3-Month Python & Data Science Mastery',
        prompt: 'I want to learn Python and fundamental data science in 3 months with weekly hands-on projects and quizzes',
      },
      {
        title: '📚 Semester Exam Prep & Active Recall Sprint',
        prompt: 'Create a 3-week study roadmap with active recall sessions, spaced repetition schedule, and mock exam simulations',
      },
      {
        title: '🎓 Capstone / Final Year Project Execution Plan',
        prompt: 'Deconstruct my university capstone project into architectural phases, research deliverables, and weekly milestones',
      },
      {
        title: '⏱️ Daily 2-Hour Deep Study & Coding Schedule',
        prompt: 'Create a structured daily 2-hour study and coding practice schedule that balances coursework and practical build projects',
      },
    ],
  };

  const ROLE_PLACEHOLDERS: Record<UserRole, string> = {
    job_seeker: 'e.g. 30-Day Frontend Engineer job search plan, or FAANG mock interview prep roadmap...',
    developer: 'e.g. Microservices refactor sprints, Next.js 15 migration roadmap, or CI/CD pipeline...',
    freelancer: 'e.g. Client delivery sprint, fixed-price MVP roadmap, or retainers growth plan...',
    student: 'e.g. i want to learn python in 3 months, or Capstone ML roadmap...',
  };

  const starterChips = ROLE_STARTER_CHIPS[role] || ROLE_STARTER_CHIPS.student;
  const rolePlaceholder = ROLE_PLACEHOLDERS[role] || ROLE_PLACEHOLDERS.student;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden flex bg-slate-50/50 dark:bg-bg-base text-text-primary animate-fade-in font-sans backdrop-blur-2xl">
      {/* ─── 1. LEFT SIDEBAR (~18% width, sleek studio panel) ─── */}
      <RoadmapSidebar
        activeProposalId={activeProposal?.id}
        onSelectRecentRoadmap={handleSelectRecentRoadmap}
        onNewRoadmap={handleNewRoadmap}
        onSelectProject={handleSelectProject}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        refreshTrigger={sidebarRefreshKey}
      />

      {/* ─── 2. MAIN CANVAS (remaining width) ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-50/40 dark:bg-bg-base">
        {/* Workspace Canvas Header */}
        <header className="px-5 md:px-8 border-b border-border-base/80 dark:border-white/[0.08] bg-white/80 dark:bg-bg-surface/80 backdrop-blur-md flex flex-col shrink-0">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Mobile menu button (< 768px) */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-elevated md:hidden border border-border-base/80 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="w-9 h-9 rounded-xl bg-solar-500/10 text-solar-500 flex items-center justify-center shrink-0 border border-solar-500/20 shadow-2xs hidden sm:flex">
                <Compass className="w-5 h-5 text-solar-500" />
              </div>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-text-primary truncate">
                  Capture Work &amp; Planning
                </h1>
                <p className="text-xs text-text-muted hidden md:block">
                  Generate mentor-grade roadmaps, structured phases, and 1-click deliverables.
                </p>
              </div>
            </div>

            {/* Offline warning banner (header desktop view) */}
            {!aiOnline && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Ollama unreachable.</span>
                <button
                  type="button"
                  onClick={handleRetryAiConnection}
                  className="font-semibold underline hover:text-amber-400 ml-1 cursor-pointer"
                >
                  Retry
                </button>
                <a
                  href="/docs/ollama-setup.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-amber-400 ml-1"
                >
                  Troubleshoot
                </a>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-elevated border border-transparent hover:border-border-base transition-colors active:translate-y-[1px]"
                aria-label="Close workspace"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Offline warning banner (mobile view) */}
          {!aiOnline && (
            <div className="sm:hidden pb-2.5 pt-0.5 flex items-center justify-between text-2xs text-amber-500 border-t border-amber-500/15 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Ollama unreachable.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetryAiConnection}
                  className="font-semibold underline hover:text-amber-400 cursor-pointer"
                >
                  Retry
                </button>
                <a
                  href="/docs/ollama-setup.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-amber-400"
                >
                  Troubleshoot
                </a>
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Canvas Area */}
        <div ref={canvasScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* ─── Top: Persistent Prompt Input Studio ──────── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] space-y-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden backdrop-blur-xl">
              {/* Subtle top accent sheen */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-solar-500/40 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="roadmap-prompt-input"
                  className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-lg bg-solar-500/10 text-solar-600 dark:text-solar-400 flex items-center justify-center shrink-0">
                    <Compass className="w-3.5 h-3.5 text-solar-500" />
                  </span>
                  <span>Roadmap &amp; Planning Prompt</span>
                </label>
                {activeProposal && (
                  <button
                    type="button"
                    onClick={handleNewRoadmap}
                    className="text-xs font-semibold text-text-muted hover:text-text-primary flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors active:translate-y-[1px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Canvas</span>
                  </button>
                )}
              </div>

              {/* Single persistent prompt input with solar gradient button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  id="roadmap-prompt-input"
                  ref={promptInputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={rolePlaceholder}
                  disabled={isGenerating}
                  className="flex-1 h-12 px-4 rounded-xl text-sm bg-slate-50/80 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.08] focus:border-solar-500 focus:bg-white dark:focus:bg-bg-surface focus:ring-4 focus:ring-solar-500/10 focus:outline-none text-text-primary placeholder:text-text-muted transition-all shadow-inner-xs"
                />

                {isGenerating ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled
                      className="h-12 px-5 rounded-xl text-xs font-bold text-white bg-solar-500/80 shadow-xs flex items-center justify-center gap-2 cursor-wait"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{proposalProgress}%</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelProposal}
                      className="h-12 px-4 rounded-xl text-xs font-bold text-danger hover:text-white border border-danger/40 hover:bg-danger/90 transition-all flex items-center justify-center gap-1.5 active:translate-y-[1px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={!prompt.trim()}
                    className={cn(
                      'h-12 px-6 rounded-xl text-xs font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shrink-0 active:translate-y-[1px]',
                      prompt.trim()
                        ? 'bg-gradient-to-r from-solar-500 to-solar-600 hover:from-solar-600 hover:to-solar-700 shadow-sm cursor-pointer'
                        : 'bg-slate-100 dark:bg-bg-elevated text-text-muted border border-border-base/60 cursor-not-allowed'
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate roadmap</span>
                  </button>
                )}
              </div>

              {/* Streaming Progress Bar */}
              {isGenerating && (
                <div className="pt-2 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                    <span className="flex items-center gap-1.5 text-solar-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Streaming AI roadmap...</span>
                    </span>
                    <span className="font-semibold text-text-primary">{proposalProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-bg-elevated rounded-full overflow-hidden border border-border-base/60">
                    <div
                      className="h-full bg-gradient-to-r from-solar-500 to-amber-500 transition-all duration-300 ease-out"
                      style={{ width: `${proposalProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Prompt Starter Chips when canvas is empty */}
              {!activeProposal && !isGenerating && (
                <div className="pt-3 border-t border-border-base/70 dark:border-white/[0.06] space-y-2.5">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted block">
                    Suggested Roadmaps
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {starterChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrompt(chip.prompt);
                          handleGenerate(chip.prompt);
                        }}
                        className="text-xs px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-bg-elevated/30 hover:bg-solar-500/[0.04] dark:hover:bg-solar-500/[0.08] border border-border-base/70 dark:border-white/[0.06] hover:border-solar-500/30 text-text-secondary hover:text-text-primary transition-all duration-200 text-left flex items-center justify-between group shadow-2xs hover:shadow-xs active:translate-y-[1px]"
                      >
                        <span className="font-medium truncate">{chip.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-text-faint group-hover:text-solar-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Loading Indicator with Progress, Spinner, Cancel, and 90s Timeout Handler */}
            {isGenerating && (
              <div className="p-8 md:p-12 text-center space-y-5 rounded-2xl border border-border-base bg-bg-surface animate-fade-in">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-solar-500/20 border-t-solar-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-solar-500 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm md:text-base font-bold text-text-primary">
                    Synthesizing Comprehensive Roadmap &amp; Phases...
                  </h3>
                  <p className="text-xs text-text-muted max-w-md mx-auto">
                    AI is structuring sequential milestone phases, curriculum breakdown, and staging
                    deliverables into your workspace.
                  </p>
                </div>

                {/* Progress bar in canvas body */}
                <div className="max-w-xs mx-auto space-y-1.5">
                  <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden border border-border-subtle">
                    <div
                      className="h-full bg-gradient-to-r from-solar-500 to-amber-500 transition-all duration-300 ease-out"
                      style={{ width: `${proposalProgress}%` }}
                    />
                  </div>
                  <span className="text-3xs font-mono text-text-muted">
                    {proposalProgress}% completed
                  </span>
                </div>

                {/* Timeout Alert (90s) */}
                {isProposalTimeout ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 max-w-md mx-auto space-y-3 animate-fade-in text-left">
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-primary">
                          Taking longer than expected...
                        </p>
                        <p className="text-3xs text-text-muted mt-0.5">
                          Large curriculum generation may take up to a minute under high demand. You
                          can wait, retry, or cancel.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="xs" variant="primary" onClick={() => retryProposal()}>
                        Retry Generation
                      </Button>
                      <Button size="xs" variant="ghost" onClick={cancelProposal}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={cancelProposal}
                      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-danger"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Generation</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Empty State Blueprint Walkthrough ───────────────────────── */}
            {!activeProposal && !isGenerating && (
              <div className="rounded-2xl border border-dashed border-border-base/80 dark:border-white/[0.08] p-6 sm:p-8 bg-white/40 dark:bg-bg-surface/30 backdrop-blur-sm animate-fade-in space-y-6">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-solar-500/10 text-solar-500 flex items-center justify-center mx-auto border border-solar-500/20 shadow-2xs">
                    <Sparkles className="w-6 h-6 text-solar-500" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-text-primary">
                    Interactive Planning Studio
                  </h2>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Enter your learning or delivery goal above to synthesize structured milestones, task breakdowns, and sprint timelines.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-text-primary">1. Structured Phases</h3>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Sequential milestones broken into achievable phases with target dates.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-solar-500/10 text-solar-600 dark:text-solar-400 flex items-center justify-center">
                      <ListTodo className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-text-primary">2. Actionable Sprints</h3>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Curated tasks with estimated durations, priority levels, and checklist states.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-bg-surface border border-border-base/70 dark:border-white/[0.06] shadow-2xs space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-text-primary">3. 1-Click Deliverables</h3>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Direct synchronization into your active tasks, calendar, and project tracker.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── DOMINANT CONTENT: ROADMAP CANVAS ───────────────────────── */}
            {activeProposal && !isGenerating && (
              <div className="space-y-6 animate-fade-in">
                {/* a. Strategic Guidance Card */}
                <Card
                  variant="default"
                  className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface overflow-hidden p-6 space-y-4 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-border-base/80">
                    <div className="flex items-center gap-2.5 text-text-primary">
                      <div className="w-7 h-7 rounded-lg bg-solar-500/10 text-solar-600 flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4 text-solar-500" />
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                        Strategic Guidance &amp; Execution Advice
                      </h2>
                    </div>
                    <Badge
                      variant="neutral"
                      size="sm"
                      className="border-border-base text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    >
                      {role.toUpperCase()} ADVICE
                    </Badge>
                  </div>

                  <div className="prose prose-sm max-w-none text-text-primary leading-relaxed">
                    <Suspense
                      fallback={<div className="h-16 animate-pulse bg-bg-surface/50 rounded-lg" />}
                    >
                      <MarkdownRenderer content={strategicGuidance} />
                    </Suspense>
                  </div>
                </Card>

                {/* b. Structured Phase Cards */}
                {phases.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                        <Layers className="w-4 h-4 text-solar-500" />
                        <span>Curriculum &amp; Milestone Phases</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-text-muted bg-slate-100 dark:bg-bg-elevated px-2.5 py-0.5 rounded-full border border-border-base/70">
                        {phases.length} phases • {phases.reduce((acc, p) => acc + p.tasks.length, 0)} tasks
                      </span>
                    </div>

                    {phases.map((phase, pIdx) => (
                      <div
                        key={phase.id || pIdx}
                        className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-5 sm:p-6 space-y-4 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-base/70">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-solar-500/10 text-solar-600 dark:text-solar-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {pIdx + 1}
                            </div>
                            <h4 className="text-sm font-bold text-text-primary truncate">
                              {phase.title}
                            </h4>
                          </div>
                          {(() => {
                            const phaseMinutes =
                              phase.tasks?.reduce(
                                (sum, t) => sum + (Number(t.estimatedMinutes) || 0),
                                0
                              ) || 0;
                            const timeLabel =
                              phaseMinutes > 0
                                ? `Time: ${phaseMinutes}m`
                                : phase.duration?.startsWith('Time:')
                                  ? phase.duration
                                  : 'Time: 60m';

                            return (
                              <span className="text-[11px] font-semibold text-solar-700 dark:text-solar-400 bg-solar-500/10 px-2.5 py-0.5 rounded-full border border-solar-500/20 shrink-0 self-start sm:self-auto flex items-center gap-1">
                                <Clock className="w-3 h-3 text-solar-500" />
                                <span>{timeLabel}</span>
                              </span>
                            );
                          })()}
                        </div>

                        {phase.description && (
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {phase.description}
                          </p>
                        )}

                        {phase.tasks && phase.tasks.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
                              Milestone Tasks ({phase.tasks.length})
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                              {phase.tasks.map((task, tIdx) => (
                                <div
                                  key={task.id || tIdx}
                                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-bg-elevated/40 border border-border-base/60 dark:border-white/[0.04] flex items-center justify-between gap-3 text-xs hover:border-solar-500/30 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-4 h-4 rounded-md border border-solar-500/40 bg-solar-500/10 flex items-center justify-center text-solar-600 shrink-0">
                                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium text-text-primary truncate">
                                      {task.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {task.estimatedMinutes && (
                                      <span className="text-[10px] text-text-muted flex items-center gap-1 bg-white dark:bg-bg-surface px-2 py-0.5 rounded-md border border-border-base/60">
                                        <Clock className="w-3 h-3 text-text-faint" />
                                        {task.estimatedMinutes}m
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Bottom Action Bar (Fixed at bottom of canvas) ─────────────── */}
        {activeProposal && !isGenerating && (
          <div className="p-4 border-t border-border-base/80 dark:border-white/[0.08] bg-white/90 dark:bg-bg-surface/90 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-medium text-text-secondary truncate min-w-0">
              {isSavedSuccess ? (
                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold truncate">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  Saved {savedCount} items into your workspace!
                </span>
              ) : (
                <span className="truncate">
                  Roadmap generated for:{' '}
                  <strong className="text-text-primary">
                    &ldquo;{activeProposal.request_text}&rdquo;
                  </strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
              {/* "Save to workspace" button with solar gradient */}
              <button
                type="button"
                onClick={handleSaveToWorkspace}
                disabled={isSaving || isSavedSuccess}
                className={cn(
                  'h-10 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 active:translate-y-[1px]',
                  !isSavedSuccess && !isSaving
                    ? 'bg-gradient-to-r from-solar-500 to-solar-600 hover:from-solar-600 hover:to-solar-700 shadow-sm cursor-pointer'
                    : 'bg-emerald-600 text-white cursor-default'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to workspace...</span>
                  </>
                ) : isSavedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved to workspace</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Save to workspace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
