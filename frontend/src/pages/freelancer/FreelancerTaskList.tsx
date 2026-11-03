import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
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
    return <p className="text-center py-3 text-3xs text-text-muted italic">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => {
        const isDone = task.status === 'completed';
        return (
          <div
            key={task.id}
            className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
              isDone
                ? 'bg-bg-surface/40 border-border-base/40 opacity-60'
                : 'bg-bg-surface/90 border-border-base hover:border-orange-500/40 hover:bg-bg-elevated/40 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                aria-label={`Toggle deliverable ${task.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(task.id, task.status);
                }}
                className="mt-0.5 text-text-muted hover:text-orange-500 transition-colors active:translate-y-[1px]"
              >
                <CheckCircle2
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    isDone ? 'text-orange-500 fill-orange-500/20' : 'text-text-muted'
                  }`}
                />
              </button>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={`text-xs font-semibold ${
                    isDone ? 'line-through text-text-muted' : 'text-text-primary'
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-2xs text-text-muted line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-2 text-3xs text-text-faint pt-0.5">
                  {task.estimated_minutes && (
                    <span className="flex items-center gap-1 font-mono text-orange-600 dark:text-orange-400">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{task.estimated_minutes}m billable</span>
                    </span>
                  )}
                  {task.due_date && (
                    <span className="font-mono">
                      Due{' '}
                      {new Date(task.due_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
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
            className="text-2xs font-semibold px-3 py-1 rounded-full text-orange-600 dark:text-orange-400 hover:text-orange-500 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 transition-all cursor-pointer"
          >
            {loadMoreLabel} ({remainingCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
