import React from 'react';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import { PriorityBadge } from '../../components/ui/Badge';
import type { Task, TaskStatus } from '../../types/task';

interface FreelancerTaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: number, currentStatus: TaskStatus) => void;
  emptyMessage?: string;
  onLoadMore?: () => void;
  remainingCount?: number;
  loadMoreLabel?: string;
}

export const FreelancerTaskList: React.FC<FreelancerTaskListProps> = ({
  tasks,
  onToggleTask,
  emptyMessage = 'No deliverables for this client project yet.',
  onLoadMore,
  remainingCount = 0,
  loadMoreLabel = 'Load more deliverables',
}) => {
  if (tasks.length === 0) {
    return <p className="text-center py-4 text-xs text-text-muted italic">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isDone = task.status === 'completed';
        return (
          <div
            key={task.id}
            className={`p-3 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
              isDone
                ? 'bg-slate-50/60 dark:bg-bg-elevated/20 border-border-subtle/60 opacity-60'
                : 'bg-white dark:bg-bg-surface border-border-base/70 hover:border-amber-500/40 hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <button
                type="button"
                aria-label={`Toggle deliverable ${task.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(task.id, task.status);
                }}
                className="mt-0.5 text-text-muted hover:text-amber-500 transition-colors active:translate-y-[1px] cursor-pointer shrink-0"
              >
                <CheckCircle2
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    isDone ? 'text-amber-500 fill-amber-500/20' : 'text-text-muted hover:text-amber-500'
                  }`}
                />
              </button>

              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className={`text-xs font-semibold leading-snug ${
                    isDone ? 'line-through text-text-muted font-normal' : 'text-text-primary'
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-2xs text-text-muted line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-3xs text-text-muted pt-0.5 flex-wrap">
                  {task.estimated_minutes && (
                    <span className="inline-flex items-center gap-1 font-mono text-amber-700 dark:text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{task.estimated_minutes}m billable</span>
                    </span>
                  )}
                  {task.due_date && (
                    <span className="inline-flex items-center gap-1 font-mono text-text-secondary">
                      <Calendar className="w-2.5 h-2.5 shrink-0 text-text-muted" />
                      <span>
                        Due{' '}
                        {new Date(task.due_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <PriorityBadge priority={task.priority} />
          </div>
        );
      })}

      {onLoadMore && remainingCount > 0 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="text-xs font-semibold px-3 py-1.5 rounded-full text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 transition-all cursor-pointer"
          >
            {loadMoreLabel} ({remainingCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
