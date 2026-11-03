import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
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
        variant === 'default' && 'bg-bg-surface border-border-base shadow-card',
        variant === 'elevated' && 'bg-bg-surface border-border-base shadow-card',
        variant === 'glass' && 'glass border-border-base shadow-glass',
        variant === 'interactive' &&
          'bg-bg-surface border-border-base cursor-pointer transition-all hover:shadow-card-hover hover:border-border-hover',
        hoverable && ['cursor-pointer', 'hover:shadow-card-hover hover:border-border-hover'],
        paddingMap[padding],
        className
      )}
      {...props}
    >
      <div>{children}</div>
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
  children,
  className,
  ...props
}: CardHeaderProps) {
  if (children) {
    return (
      <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)} {...props}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 text-text-muted" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>}
          {subtitle && <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-text-muted', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}
