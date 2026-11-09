import React from 'react';
import { cn } from '../../utils/cn';
import {
  BadgeVariant,
  BadgeSize,
  badgeVariants,
  dotStyles,
  variantStyles,
} from '../../utils/badgeVariants';

export * from '../../utils/badgeVariants';

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export function Badge({
  label,
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  const textContent = typeof children === 'string' ? children : typeof label === 'string' ? label : null;
  if (textContent && textContent.trim().toLowerCase() === 'medium') {
    return null;
  }

  return (
    <span className={badgeVariants({ variant, size, className })}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} aria-hidden="true" />
      )}
      {children ?? label}
    </span>
  );
}

// Priority badge helper
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export const priorityVariant: Record<Priority, BadgeVariant> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function PriorityBadge({ priority }: { priority?: Priority | string | null }) {
  if (!priority) return null;
  const normalized = String(priority).trim().toLowerCase();
  if (normalized === 'medium') return null;
  const p = normalized as Priority;
  return (
    <Badge
      label={p.charAt(0).toUpperCase() + p.slice(1)}
      variant={priorityVariant[p] || 'default'}
      dot
    />
  );
}

// Status badge helper
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export const statusVariant: Record<TaskStatus, BadgeVariant> = {
  todo: 'muted',
  in_progress: 'info',
  completed: 'success',
  archived: 'muted',
};
export const statusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Done',
  archived: 'Archived',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge label={statusLabel[status]} variant={statusVariant[status]} dot />;
}
