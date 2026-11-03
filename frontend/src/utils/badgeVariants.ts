import { cn } from './cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'
  | 'neutral'
  | 'outline';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-student-500/15 text-student-700 dark:text-student-300 border-student-500/30',
  primary: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  secondary: 'bg-bg-elevated text-text-secondary border-border-base',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  info: 'bg-developer-500/15 text-cyan-700 dark:text-developer-300 border-developer-500/30',
  muted: 'bg-bg-elevated text-text-muted border-border-base',
  neutral: 'bg-bg-elevated text-text-secondary border-border-base',
  outline: 'bg-transparent text-text-primary border-border-base hover:border-border-hover',
};

export const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-student-400',
  primary: 'bg-orange-500',
  secondary: 'bg-text-muted',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-developer-400',
  muted: 'bg-text-muted',
  neutral: 'bg-text-muted',
  outline: 'bg-text-muted',
};

export const badgeSizes: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-3xs',
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export interface BadgeVariantOptions {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function badgeVariants({
  variant = 'default',
  size = 'sm',
  className,
}: BadgeVariantOptions = {}) {
  return cn(
    'inline-flex items-center gap-1.5 rounded-full border font-medium',
    badgeSizes[size] || badgeSizes.sm,
    variantStyles[variant] || variantStyles.default,
    className
  );
}
