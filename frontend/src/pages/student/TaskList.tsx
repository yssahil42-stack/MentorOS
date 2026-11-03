import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/task';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: number, currentStatus: TaskStatus) => void;
  accentColor?: 'blue' | 'amber';
  emptyMessage?: string;
  onLoadMore?: () => void;
  remainingCount?: number;
  loadMoreLabel?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleTask,
  accentColor = 'blue',
  emptyMessage = 'No assignments in this course yet.',
  onLoadMore,
  remainingCount = 0,
  loadMoreLabel = 'Load more assignments',
}) => {
  const isAmber = accentColor === 'amber';
  const activeColor = isAmber ? 'text-amber-600' : 'text-blue-600';
  const fillActive = isAmber
    ? 'text-amber-600 fill-amber-600/20'
    : 'text-blue-600 fill-blue-600/20';
  const hoverBorder = isAmber ? 'hover:border-amber-500/30' : 'hover:border-blue-500/30';
  const buttonBg = isAmber
    ? 'text-amber-500 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20'
    : 'text-blue-500 hover:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20';

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
            className={`p-2 rounded-lg border transition-all flex items-start justify-between gap-2.5 ${
              isDone
                ? 'bg-bg-surface/40 border-border-base/40 opacity-60'
                : `bg-bg-elevated/50 border-border-base ${hoverBorder} shadow-2xs`
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <button
                type="button"
                aria-label={`Toggle task ${task.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(task.id, task.status);
                }}
                className={`mt-0.5 text-text-muted hover:${activeColor} transition-all active:translate-y-[1px]`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                    isDone ? fillActive : 'text-text-muted'
                  }`}
                />
              </button>

              <div className="min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isDone ? 'line-through text-text-muted' : 'text-text-primary'
                  }`}
                >
                  {task.title}
                </p>
                {task.estimated_minutes && (
                  <p className="text-3xs text-text-faint mt-0.5">
                    {task.estimated_minutes} min study
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {remainingCount > 0 && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className={`w-full py-1.5 text-3xs font-medium text-center rounded-lg border transition-colors cursor-pointer ${buttonBg}`}
        >
          {loadMoreLabel} ({remainingCount} remaining)
        </button>
      )}
    </div>
  );
};
