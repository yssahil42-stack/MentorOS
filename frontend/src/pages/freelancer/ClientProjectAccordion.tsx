import React from 'react';
import { ChevronDown, ChevronRight, Building2, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FreelancerTaskList } from './FreelancerTaskList';
import type { Project } from '../../types/project';
import type { Task, TaskStatus } from '../../types/task';

interface ClientProjectAccordionProps {
  projects: Project[];
  tasks: Task[];
  filteredTasks: Task[];
  selectedProjectFilter: number | 'all';
  expandedProjects: Record<string | number, boolean>;
  onToggleExpand: (id: string | number) => void;
  projectTaskPages: Record<string | number, number>;
  onLoadMoreProjectTasks: (id: string | number) => void;
  onToggleTask: (taskId: number, currentStatus: TaskStatus) => void;
  pageSize?: number;
  emptyStateConfig: { description: string; actionLabel?: string };
  onAiPromptClick: () => void;
}

export const ClientProjectAccordion: React.FC<ClientProjectAccordionProps> = ({
  projects,
  tasks,
  filteredTasks,
  selectedProjectFilter,
  expandedProjects,
  onToggleExpand,
  projectTaskPages,
  onLoadMoreProjectTasks,
  onToggleTask,
  pageSize = 25,
  emptyStateConfig,
  onAiPromptClick,
}) => {
  const displayProjects =
    selectedProjectFilter === 'all'
      ? projects
      : projects.filter((p) => p.id === selectedProjectFilter);

  if (projects.length === 0 && tasks.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-text-muted space-y-3 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-bg-elevated/20">
        <p className="font-medium">{emptyStateConfig.description}</p>
        {emptyStateConfig.actionLabel && (
          <Button
            size="xs"
            variant="secondary"
            onClick={onAiPromptClick}
            className="inline-flex items-center gap-1.5 font-semibold text-xs"
          >
            {emptyStateConfig.actionLabel}
          </Button>
        )}
      </div>
    );
  }

  const generalTasks = filteredTasks.filter(
    (t) => !t.project_id && (!t.project_title || !projects.some((p) => p.title === t.project_title))
  );

  return (
    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
      {displayProjects.map((proj) => {
        const isExpanded = expandedProjects[proj.id] ?? false;
        const allTasks = tasks.filter(
          (t) =>
            t.project_id === proj.id ||
            (t.project_title &&
              t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
        );
        const projectTasks = filteredTasks.filter(
          (t) =>
            t.project_id === proj.id ||
            (t.project_title &&
              t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
        );
        const currentPage = projectTaskPages[proj.id] || 1;
        const visibleTasks = projectTasks.slice(0, currentPage * pageSize);
        const doneCount = allTasks.filter((t) => t.status === 'completed').length;
        const dynProgress =
          allTasks.length > 0
            ? Math.round((doneCount / allTasks.length) * 100)
            : proj.progress || 0;

        return (
          <div
            key={proj.id}
            className="rounded-xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface overflow-hidden shadow-2xs hover:border-amber-500/30 transition-all duration-200"
          >
            <div
              onClick={() => onToggleExpand(proj.id)}
              className="p-3.5 bg-slate-50/80 dark:bg-bg-elevated/40 hover:bg-slate-100 dark:hover:bg-bg-elevated cursor-pointer flex items-center justify-between gap-3 transition-colors border-b border-border-base/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-text-muted hover:text-amber-500 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-text-primary truncate">{proj.title}</h4>
                    <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                      Client
                    </span>
                  </div>
                  {proj.description && (
                    <p className="text-3xs text-text-muted truncate max-w-sm mt-0.5">{proj.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-20 bg-slate-200 dark:bg-bg-base h-1.5 rounded-full overflow-hidden border border-border-subtle/70">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dynProgress}%` }}
                    />
                  </div>
                  <span className="text-3xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {dynProgress}%
                  </span>
                </div>
                <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-bg-elevated text-text-secondary border border-border-subtle">
                  {doneCount}/{allTasks.length} done
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 bg-white dark:bg-bg-surface/90 border-t border-border-subtle/50">
                <FreelancerTaskList
                  tasks={visibleTasks}
                  onToggleTask={onToggleTask}
                  emptyMessage="No deliverables in this client account yet. Use the input above to add one."
                  onLoadMore={() => onLoadMoreProjectTasks(proj.id)}
                  remainingCount={projectTasks.length - visibleTasks.length}
                  loadMoreLabel="Load more deliverables"
                />
              </div>
            )}
          </div>
        );
      })}

      {selectedProjectFilter === 'all' && generalTasks.length > 0 && (
        <div className="rounded-xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface overflow-hidden shadow-2xs hover:border-amber-500/30 transition-all duration-200">
          <div
            onClick={() => onToggleExpand('general')}
            className="p-3.5 bg-slate-50/80 dark:bg-bg-elevated/40 hover:bg-slate-100 dark:hover:bg-bg-elevated cursor-pointer flex items-center justify-between gap-3 border-b border-border-base/50"
          >
            <div className="flex items-center gap-3">
              {(expandedProjects['general'] ?? false) ? (
                <ChevronDown className="w-4 h-4 text-amber-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              <h4 className="text-xs font-bold text-text-primary">
                General Deliverables &amp; Invoicing Admin
              </h4>
            </div>
            <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-bg-elevated text-text-secondary border border-border-subtle">
              {generalTasks.filter((t) => t.status === 'completed').length}/{generalTasks.length}{' '}
              done
            </span>
          </div>
          {(expandedProjects['general'] ?? false) && (
            <div className="p-3 bg-white dark:bg-bg-surface/90 border-t border-border-subtle/50">
              <FreelancerTaskList
                tasks={generalTasks}
                onToggleTask={onToggleTask}
                emptyMessage="No unassigned deliverables."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
