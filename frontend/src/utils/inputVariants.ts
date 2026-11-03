import { cn } from './cn';

export type InputVariant = 'default' | 'filled' | 'outline' | 'ghost';
export type InputSize = 'sm' | 'md' | 'lg';

export const inputSizes: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-9 px-3 text-xs rounded-xl',
  lg: 'h-11 px-4 text-sm rounded-xl',
};

export const inputVariantsMap: Record<InputVariant, string> = {
  default: 'bg-bg-surface border-border-base text-text-primary placeholder:text-text-faint',
  filled:
    'bg-bg-elevated border-transparent text-text-primary placeholder:text-text-faint focus:bg-bg-surface',
  outline: 'bg-transparent border-border-base text-text-primary placeholder:text-text-faint',
  ghost:
    'bg-transparent border-transparent text-text-primary placeholder:text-text-faint hover:bg-bg-elevated/50',
};

export interface InputVariantOptions {
  variant?: InputVariant;
  size?: InputSize;
  hasError?: boolean;
  hasIcon?: boolean;
  className?: string;
}

export function inputVariants({
  variant = 'default',
  size = 'md',
  hasError = false,
  hasIcon = false,
  className,
}: InputVariantOptions = {}) {
  return cn(
    'w-full border transition-all text-xs font-normal',
    'focus:outline-none focus:border-solar-500 focus:ring-1 focus:ring-solar-500/50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    inputSizes[size] || inputSizes.md,
    inputVariantsMap[variant] || inputVariantsMap.default,
    hasIcon && 'pl-9',
    hasError && 'border-danger focus:border-danger focus:ring-danger/30 text-danger-text',
    className
  );
}

export function selectVariants({
  variant = 'default',
  size = 'md',
  hasError = false,
  className,
}: Omit<InputVariantOptions, 'hasIcon'> = {}) {
  return cn(
    'w-full border transition-all text-xs font-normal cursor-pointer',
    'focus:outline-none focus:border-solar-500 focus:ring-1 focus:ring-solar-500/50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    inputSizes[size] || inputSizes.md,
    inputVariantsMap[variant] || inputVariantsMap.default,
    hasError && 'border-danger focus:border-danger focus:ring-danger/30',
    className
  );
}
