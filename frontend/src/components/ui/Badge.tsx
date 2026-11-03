import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-student-500/15 text-student-700 dark:text-student-300 border-student-500/30',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  info: 'bg-developer-500/15 text-cyan-700 dark:text-developer-300 border-developer-500/30',
  muted: 'bg-bg-elevated text-text-muted border-border-base',
  neutral: 'bg-bg-elevated text-text-secondary border-border-base',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-student-400',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-developer-400',
  muted: 'bg-text-muted',
  neutral: 'bg-text-muted',
};

export function Badge({
  label,
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} aria-hidden="true" />
      )}
      {children ?? label}
    </span>
  );
}

// Priority badge helper
type Priority = 'low' | 'medium' | 'high' | 'urgent';
const priorityVariant: Record<Priority, BadgeVariant> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      label={priority.charAt(0).toUpperCase() + priority.slice(1)}
      variant={priorityVariant[priority]}
      dot
    />
  );
}

// Status badge helper
type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
const statusVariant: Record<TaskStatus, BadgeVariant> = {
  todo: 'muted',
  in_progress: 'info',
  completed: 'success',
  archived: 'muted',
};
const statusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Done',
  archived: 'Archived',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge label={statusLabel[status]} variant={statusVariant[status]} dot />;
}
