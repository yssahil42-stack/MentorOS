import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Clock, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { fetchRecentProposals, deleteProposal } from '../../services/aiService';
import type { Project } from '../../types/project';
import type { AIProposal } from '../../types/aiProposal';
import { cn } from '../../utils/cn';
import { getWorkspaceRole } from '../../utils/roleUtils';

interface RoadmapSidebarProps {
  activeProposalId?: number | null;
  onSelectRecentRoadmap: (proposal: AIProposal) => void;
  onDeleteRecentRoadmap?: (proposalId: number) => void;
  onNewRoadmap: () => void;
  onSelectProject?: (project: Project) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  refreshTrigger?: number;
}

export function RoadmapSidebar({
  activeProposalId,
  onSelectRecentRoadmap,
  onDeleteRecentRoadmap,
  onNewRoadmap,
  isMobileOpen = false,
  onCloseMobile,
  refreshTrigger = 0,
}: RoadmapSidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const role = getWorkspaceRole(location.pathname, user?.role || 'student');
  const roleConfig = ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS];

  const [recentRoadmaps, setRecentRoadmaps] = useState<AIProposal[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch recent proposals / roadmap chats for current role
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingRecent(true);
      setLoadError('');

      try {
        const recentList = await fetchRecentProposals(role, user?.id);
        if (isMounted) {
          setRecentRoadmaps(recentList || []);
        }
      } catch (error) {
        if (isMounted) {
          setRecentRoadmaps([]);
          setLoadError(error instanceof Error ? error.message : 'Unable to load workspace data.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecent(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [role, refreshTrigger, user?.id]);

  const handleDeleteChat = async (e: React.MouseEvent, proposalId: number, title?: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete this chat roadmap?\n\n"${title || 'Untitled Roadmap'}"`
    );
    if (!confirmed) return;

    setDeletingId(proposalId);
    // Optimistic removal from sidebar list
    setRecentRoadmaps((prev) => prev.filter((p) => p.id !== proposalId));

    try {
      await deleteProposal(proposalId);
      if (onDeleteRecentRoadmap) {
        onDeleteRecentRoadmap(proposalId);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to delete chat.');
      // Revert if error
      const reloaded = await fetchRecentProposals(role, user?.id).catch(() => []);
      setRecentRoadmaps(reloaded);
    } finally {
      setDeletingId(null);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-slate-50/70 dark:bg-bg-elevated/40 text-text-primary">
      {/* ─── Top Header & New Roadmap ───────────────────────────────── */}
      <div className="p-4 border-b border-border-base/70 dark:border-white/[0.06] shrink-0 space-y-3.5 bg-white/40 dark:bg-bg-surface/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: roleConfig?.color || '#F59E0B' }}
            >
              M
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-text-primary">
                MentorOS
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-bg-surface border border-border-base/70 text-text-muted">
                {roleConfig?.label || 'Workspace'}
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loadError && (
          <p
            className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-2xs text-danger"
            role="alert"
          >
            {loadError}
          </p>
        )}

        {/* "+ New roadmap" Button */}
        <button
          type="button"
          onClick={() => {
            onNewRoadmap();
            if (onCloseMobile) onCloseMobile();
          }}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border border-border-base/80 dark:border-white/[0.08]',
            'bg-white dark:bg-bg-surface hover:bg-slate-50 dark:hover:bg-bg-elevated text-text-primary hover:border-solar-500/40 shadow-2xs hover:shadow-xs active:translate-y-[1px]'
          )}
        >
          <Plus className="w-3.5 h-3.5 text-solar-500 stroke-[2.5]" />
          <span>New roadmap</span>
        </button>
      </div>

      {/* ─── Scrollable Body: Recent Roadmap Chats ──────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span>Recent</span>
            </span>
            <span className="text-[10px] font-semibold text-text-muted bg-slate-200/60 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
              {recentRoadmaps.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {isLoadingRecent ? (
              <div className="p-3 text-xs text-text-faint animate-pulse">
                Loading past roadmaps...
              </div>
            ) : recentRoadmaps.length === 0 ? (
              <div className="px-3 py-6 rounded-xl border border-dashed border-border-base/80 text-center">
                <p className="text-xs text-text-muted">No recent roadmaps</p>
                <p className="text-[11px] text-text-faint mt-0.5">Generate one to see it here</p>
              </div>
            ) : (
              recentRoadmaps.map((proposal) => {
                const isActive = activeProposalId === proposal.id;
                const milestoneCount =
                  proposal.items?.filter((i) => i.item_type === 'milestone').length || 0;
                const taskCount = proposal.items?.filter((i) => i.item_type === 'task').length || 0;

                return (
                  <div
                    key={proposal.id}
                    onClick={() => {
                      onSelectRecentRoadmap(proposal);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSelectRecentRoadmap(proposal);
                        if (onCloseMobile) onCloseMobile();
                      }
                    }}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl border text-xs transition-all duration-200 flex items-start justify-between gap-2 group cursor-pointer relative',
                      isActive
                        ? 'bg-white dark:bg-bg-surface border-solar-500/40 shadow-xs font-semibold ring-1 ring-solar-500/20'
                        : 'bg-white/40 dark:bg-bg-surface/30 border-border-base/50 dark:border-white/[0.04] hover:bg-white dark:hover:bg-bg-surface hover:border-border-base text-text-secondary hover:text-text-primary shadow-2xs'
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="truncate text-xs font-medium text-text-primary leading-snug">
                        {proposal.request_text || 'Untitled Roadmap'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-text-muted font-medium flex-wrap">
                        {milestoneCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-bg-elevated text-text-secondary font-medium">
                            {milestoneCount} phases
                          </span>
                        )}
                        {taskCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-bg-elevated text-text-secondary font-medium">
                            {taskCount} tasks
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteChat(e, proposal.id, proposal.request_text)}
                        disabled={deletingId === proposal.id}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-90 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        title="Delete chat"
                        aria-label={`Delete chat "${proposal.request_text || 'Untitled Roadmap'}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {isActive && (
                        <span
                          className="w-2 h-2 rounded-full ring-4 ring-solar-500/20"
                          style={{ backgroundColor: roleConfig?.color || '#F59E0B' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Pinned User Avatar / Name at Bottom ─────────────────────── */}
      <div className="p-3.5 border-t border-border-base/70 dark:border-white/[0.06] shrink-0 bg-white/60 dark:bg-bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/60 dark:hover:bg-bg-elevated/40 transition-colors">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
            style={{ backgroundColor: roleConfig?.color || '#F59E0B' }}
          >
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary truncate">
              {user?.full_name || 'Active User'}
            </p>
            <p className="text-[11px] text-text-muted truncate capitalize">
              {roleConfig?.label || role} workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (~18% width, min 210px, max 280px) */}
      <aside className="hidden md:flex flex-col w-[18%] min-w-[210px] max-w-[280px] h-full border-r border-border-base shrink-0 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer (< 768px) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-xl border-r border-border-base z-10 animate-slide-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
