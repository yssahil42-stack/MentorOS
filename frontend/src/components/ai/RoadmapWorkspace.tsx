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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { useAIProposal } from '../../hooks/useAIProposal';
import {
  fetchRecentProposals,
  requestAIProposal,
  approveProposalItems,
  checkAiHealth,
} from '../../services/aiService';
import type {
  AIProposal,
  AIProposalItem,
  AIProposedMilestone,
  AIProposedTask,
  AIProposedNote,
  AIProposedProject,
  AIProposedCalendarEvent,
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
  const roleConfig = ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS];

  // Canvas State
  const [prompt, setPrompt] = useState(initialPrompt);
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
  const autoGenerationKeyRef = useRef<string | null>(null);

  // Restore an existing proposal before spending tokens on another generation.
  useEffect(() => {
    const requestText = initialPrompt.trim();
    if (!requestText || !isOpen) return;

    const normalizedPrompt = requestText.toLowerCase();
    const generationKey = `${user?.id ?? 'anonymous'}:${role}:${normalizedPrompt}`;
    if (autoGenerationKeyRef.current === generationKey) return;
    autoGenerationKeyRef.current = generationKey;
    setPrompt(requestText);

    void (async () => {
      try {
        const recentProposals = await fetchRecentProposals(role, user?.id);
        const existingProposal = recentProposals.find(
          (proposal) => proposal.request_text.trim().toLowerCase() === normalizedPrompt
        );

        if (existingProposal) {
          handleSelectRecentRoadmap(existingProposal);
        } else {
          await handleGenerate(requestText);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load previous roadmaps.';
        showToast(`Could not check for an existing roadmap: ${message}`, 'error');
      }
    })();
  }, [initialPrompt, isOpen, role, showToast, user?.id]);

  // Focus prompt input when opened
  useEffect(() => {
    if (isOpen) {
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
      const targetDate = mPayload.target_date
        ? `Target: ${mPayload.target_date}`
        : fallbackDurations[idx] || `Phase ${idx + 1}`;

      // Match tasks associated with this milestone/phase or distribute evenly
      const matchedTasks = taskItems.filter((tItem, tIdx) => {
        const tPayload = tItem.payload as AIProposedTask;
        if (tPayload.description && tPayload.description.toLowerCase().includes(`phase ${idx + 1}`))
          return true;
        // fallback distribution across phases
        return tIdx % Math.max(milestoneItems.length, 1) === idx;
      });

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
        duration: targetDate,
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
          duration: 'Weeks 1-4 • Month 1',
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
          duration: 'Weeks 5-8 • Month 2',
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
          duration: 'Weeks 9-12 • Month 3',
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
      // Find IDs of all items in activeProposal
      const allItemIds = activeProposal.items.map((i) => i.id);

      const res = await approveProposalItems(activeProposal, {
        approved_item_ids: allItemIds,
      });

      const totalCreated =
        res.created_tasks.length +
        res.created_projects.length +
        res.created_milestones.length +
        res.created_events.length +
        res.created_notes.length;

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

  // Starter prompts
  const starterChips = [
    { title: '🐍 3-Month Python Roadmap', prompt: 'i want to learn python in 3 months' },
    {
      title: '🏗️ System Architecture & Sprints',
      prompt: 'Create full architectural build roadmap for a distributed real-time platform',
    },
    {
      title: '⏱️ Daily 2-Hour Deep Work Plan',
      prompt: 'Create a structured daily 2-hour study and coding practice schedule',
    },
    {
      title: '🎯 Exam & Interview Prep Sprint',
      prompt: 'Create a 2-week active recall sprint and exam simulation roadmap',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-bg-base text-text-primary animate-fade-in font-sans">
      {/* ─── 1. LEFT SIDEBAR (~16% width, bg-elevated, border-r border-base) ─── */}
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
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-bg-base">
        {/* Workspace Canvas Header */}
        <header className="px-4 md:px-6 border-b border-border-base bg-bg-surface flex flex-col shrink-0">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu button (< 768px) */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated md:hidden border border-border-base"
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div>
                <h1 className="text-sm font-bold text-text-primary truncate">
                  Capture Work &amp; Planning
                </h1>
                <p className="text-2xs text-text-muted hidden md:block">
                  Generate mentor-grade roadmaps, structured phases, and 1-click deliverables.
                </p>
              </div>
            </div>

            {/* Offline warning banner (header desktop view) */}
            {!aiOnline && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-2xs text-amber-500 animate-fade-in">
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
                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent hover:border-border-base transition-colors active:translate-y-[1px]"
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
            {/* ─── Top: Persistent Prompt Input (not a chat thread) ──────── */}
            <div className="p-4 rounded-2xl bg-bg-surface border border-border-base space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="roadmap-prompt-input"
                  className="font-semibold text-text-secondary flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-solar-500" />
                  <span>Roadmap &amp; Planning Prompt</span>
                </label>
                {activeProposal && (
                  <button
                    type="button"
                    onClick={handleNewRoadmap}
                    className="text-2xs font-medium text-text-muted hover:text-text-primary flex items-center gap-1 active:translate-y-[1px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Canvas</span>
                  </button>
                )}
              </div>

              {/* Single persistent prompt input with solar gradient button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                  placeholder="e.g. i want to learn python in 3 months, or Capstone ML roadmap..."
                  disabled={isGenerating}
                  className="flex-1 h-11 px-3.5 rounded-xl text-sm bg-bg-base border border-border-base focus:border-solar-500 focus:outline-none text-text-primary placeholder:text-text-faint transition-colors"
                />

                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="h-11 px-4 rounded-xl text-xs font-bold text-white bg-solar-500/80 shadow-sm flex items-center justify-center gap-2 cursor-wait"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{proposalProgress}%</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelProposal}
                      className="h-11 px-4 rounded-xl text-xs font-bold text-danger hover:text-white border border-danger/40 hover:bg-danger/90 transition-all flex items-center justify-center gap-1.5 active:translate-y-[1px]"
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
                      'h-11 px-5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shrink-0 active:translate-y-[1px]',
                      prompt.trim()
                        ? 'bg-gradient-to-r from-solar-500 to-solar-600 hover:from-solar-600 hover:to-solar-700 shadow-sm cursor-pointer'
                        : 'bg-bg-elevated text-text-faint border border-border-base cursor-not-allowed'
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
                  <div className="flex items-center justify-between text-3xs font-medium text-text-muted">
                    <span className="flex items-center gap-1.5 text-solar-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Streaming AI roadmap...</span>
                    </span>
                    <span className="font-mono">{proposalProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden border border-border-subtle">
                    <div
                      className="h-full bg-gradient-to-r from-solar-500 to-amber-500 transition-all duration-300 ease-out"
                      style={{ width: `${proposalProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Prompt Starter Chips when canvas is empty */}
              {!activeProposal && !isGenerating && (
                <div className="pt-2 border-t border-border-subtle space-y-2">
                  <span className="text-3xs uppercase font-mono text-text-muted font-bold block">
                    Suggested Roadmaps
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {starterChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrompt(chip.prompt);
                          handleGenerate(chip.prompt);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-base border border-border-base text-text-secondary hover:text-text-primary transition-colors text-left active:translate-y-[1px]"
                      >
                        {chip.title}
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

            {/* ─── DOMINANT CONTENT: ROADMAP CANVAS ───────────────────────── */}
            {activeProposal && !isGenerating && (
              <div className="space-y-6 animate-fade-in">
                {/* a. Strategic Guidance Card (Flat card, border-base, no drop shadow) */}
                <Card
                  variant="default"
                  className="border border-border-base bg-bg-surface overflow-hidden p-6 space-y-4 shadow-none"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border-base">
                    <div className="flex items-center gap-2 text-text-primary">
                      <Compass className="w-4 h-4 text-solar-500 shrink-0" />
                      <h2 className="text-sm font-bold uppercase tracking-wider">
                        Strategic Guidance &amp; Execution Advice
                      </h2>
                    </div>
                    <Badge
                      variant="neutral"
                      size="sm"
                      className="border-border-base text-3xs font-mono uppercase"
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
              </div>
            )}
          </div>
        </div>

        {/* ─── Bottom Action Bar (Fixed at bottom of canvas) ─────────────── */}
        {activeProposal && !isGenerating && (
          <div className="p-4 border-t border-border-base bg-bg-surface shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-text-secondary truncate min-w-0">
              {isSavedSuccess ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold truncate">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                  'h-9 px-5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 active:translate-y-[1px]',
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
