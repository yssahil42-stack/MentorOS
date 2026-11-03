import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitPullRequest,
  Sparkles,
  Layers,
  Flag,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Database,
  Layout,
  Server,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects, fetchMilestones, updateMilestone } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function BuildPlanPage() {
  const { openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects(),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'developer'],
    queryFn: () => fetchMilestones(),
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'completed' | 'pending' }) => {
      return updateMilestone(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Milestone status updated', 'success');
    },
  });

  if (projectsLoading || milestonesLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-40" />
        <LoadingSkeleton variant="card" className="h-96" />
      </div>
    );
  }

  const phases = [
    {
      id: 1,
      name: 'Phase 1: Architecture & Foundation',
      icon: <Layout className="w-4 h-4 text-developer-400" />,
      desc: 'Design system, React 18, Tailwind tokens, role partitioning',
      milestones: milestones.filter((m) => m.id <= 2),
    },
    {
      id: 2,
      name: 'Phase 2: Core Workspace Engine',
      icon: <Server className="w-4 h-4 text-cyan-400" />,
      desc: 'Interactive task boards, project roadmap, and state caching',
      milestones: milestones.filter((m) => m.id === 3),
    },
    {
      id: 3,
      name: 'Phase 3: Backend API & Persistence',
      icon: <Database className="w-4 h-4 text-amber-400" />,
      desc: 'FastAPI REST backend with local database & JWT authentication',
      milestones: milestones.filter((m) => m.id === 4),
    },
    {
      id: 4,
      name: 'Phase 4: AI Assistant & Structured Proposals',
      icon: <Bot className="w-4 h-4 text-purple-400" />,
      desc: 'Groq ultra-fast AI engine with structured JSON proposal schema',
      milestones: milestones.filter((m) => m.id >= 5),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-developer-500/20 text-developer-400">
              <GitPullRequest className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-developer-500/10 text-developer-400 border border-developer-500/20">
              SYSTEM ARCHITECTURE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Build Plan &amp; Roadmap
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Strategic breakdown of platform features, technical deliverables, and milestone
            releases.
          </p>
        </div>

        <Button
          variant="primary"
          className="!bg-developer-500 hover:!bg-developer-600 shadow-glow-emerald shrink-0"
          onClick={() =>
            openAIDrawer(
              'Analyze my build plan and generate an architectural roadmap with technical risks and milestone deliverables'
            )
          }
          icon={<Sparkles className="w-4 h-4" />}
        >
          AI Plan Generator
        </Button>
      </div>

      {/* Phase Accordions */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const isExpanded = expandedPhase === phase.id;
          const completedCount = phase.milestones.filter((m) => m.status === 'completed').length;
          const totalCount = phase.milestones.length;
          const isAllDone = totalCount > 0 && completedCount === totalCount;

          return (
            <Card
              key={phase.id}
              className="border border-border-base hover:border-border-hover transition-all overflow-hidden"
            >
              <div
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                className="p-5 flex items-center justify-between cursor-pointer bg-bg-surface/70 hover:bg-bg-elevated/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-bg-elevated border border-border-base">
                    {phase.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm md:text-base font-bold text-text-primary">
                        {phase.name}
                      </h3>
                      {isAllDone && (
                        <Badge variant="success" size="sm">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{phase.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono text-text-muted hidden sm:inline-block">
                    {completedCount}/{totalCount} milestones
                  </span>
                  <div className="p-1 rounded-lg bg-bg-elevated text-text-muted">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Milestones inside phase */}
              {isExpanded && (
                <div className="p-5 border-t border-border-base bg-bg-base/40 space-y-3 animate-fade-in">
                  {phase.milestones.length === 0 ? (
                    <p className="text-xs text-text-muted italic py-2">
                      No milestones recorded for this phase yet.
                    </p>
                  ) : (
                    phase.milestones.map((m) => {
                      const done = m.status === 'completed';
                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-bg-surface border border-border-base flex items-start justify-between gap-3 hover:border-border-hover transition-all"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                toggleMilestoneMutation.mutate({
                                  id: m.id,
                                  status: done ? 'pending' : 'completed',
                                })
                              }
                              className="mt-0.5 text-text-muted hover:text-developer-400 transition-colors"
                            >
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  done
                                    ? 'text-developer-400 fill-developer-400/20'
                                    : 'text-text-muted'
                                }`}
                              />
                            </button>
                            <div className="space-y-0.5 min-w-0">
                              <h4
                                className={`text-xs font-semibold ${
                                  done ? 'line-through text-text-muted' : 'text-text-primary'
                                }`}
                              >
                                {m.title}
                              </h4>
                              {m.description && (
                                <p className="text-[11px] text-text-muted">{m.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-text-faint">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {m.target_date ? new Date(m.target_date).toLocaleDateString() : 'TBD'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
