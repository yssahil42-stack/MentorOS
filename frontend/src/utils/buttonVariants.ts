export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'outline'
  | 'subtle' // bg-muted, no border, for tertiary
  | 'link' // text-only, underline hover
  | 'toggle' // pressed state, aria-pressed
  | 'split'; // primary + dropdown arrow

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';

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
  subtle:
    'bg-text-muted/10 hover:bg-text-muted/20 text-text-muted border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  link: 'bg-transparent hover:bg-transparent text-[var(--focus)] underline-offset-2 hover:underline border-transparent shadow-none',
  toggle:
    'bg-bg-surface hover:bg-bg-elevated text-text-primary border-border-base active:translate-y-[1px] transition-transform duration-100 ease-out',
  split:
    'bg-[var(--focus)] hover:opacity-90 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
};

export const buttonSizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2.5',
  xl: 'h-14 px-6 text-lg gap-3',
  icon: 'h-9 w-9 p-0 flex items-center justify-center',
};
