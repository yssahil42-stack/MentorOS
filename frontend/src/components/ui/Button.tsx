import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size    = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  selected?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<Variant, string> = {
  primary:   'bg-student-500 hover:bg-student-600 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  secondary: 'bg-bg-surface hover:bg-bg-elevated text-text-primary border-border-base hover:border-border-hover active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  outline:   'bg-transparent hover:bg-bg-elevated text-text-primary border-border-base hover:border-student-500 active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  ghost:     'bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  danger:    'bg-danger hover:bg-danger/90 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
  success:   'bg-success hover:bg-success/90 text-white border-transparent active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100 ease-out',
};

const sizeStyles: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      selected = false,
      icon,
      leftIcon,
      iconRight,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const leadIcon = icon ?? leftIcon;
    const isSelected = selected || props['aria-pressed'] === true;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium rounded-xl border',
          'transition-all duration-150 ease-smooth select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
          'touch-target',
          // Selected subtle micro-movement
          isSelected && 'translate-y-[1px] shadow-xs',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Width
          fullWidth && 'w-full',
          // Disabled
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leadIcon && <span className="shrink-0" aria-hidden="true">{leadIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0 ml-auto" aria-hidden="true">{iconRight}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
