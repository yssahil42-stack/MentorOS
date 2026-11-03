import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-2xl border transition-all duration-200',
        variant === 'default'  && 'bg-bg-surface border-border-base shadow-card',
        variant === 'elevated' && 'bg-bg-elevated border-border-base shadow-card',
        variant === 'glass'    && 'glass border-border-base shadow-glass',
        hoverable && [
          'cursor-pointer',
          'hover:shadow-card-hover hover:border-border-hover',
        ],
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, subtitle, actions, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 text-text-muted" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
