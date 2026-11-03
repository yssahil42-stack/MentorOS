export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--focus)] hover:opacity-90 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  secondary:
    'bg-bg-surface hover:bg-bg-elevated text-text-primary border-border-base hover:border-border-hover active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  outline:
    'bg-transparent hover:bg-bg-elevated text-text-primary border-border-base hover:border-[var(--focus)] active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  ghost:
    'bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  danger:
    'bg-danger hover:bg-danger/90 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  success:
    'bg-success hover:bg-success/90 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
};

export const buttonSizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2.5',
};
