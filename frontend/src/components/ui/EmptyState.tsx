import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}
      role="region"
      aria-label={title}
    >
      {/* Icon bubble */}
      <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5 text-text-muted">
        {icon}
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed mb-6">{description}</p>

      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}
      role="alert"
    >
      <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
        <span className="text-danger text-xl" aria-hidden="true">
          !
        </span>
      </div>
      <p className="text-sm text-text-muted mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
