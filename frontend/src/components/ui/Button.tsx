import React from 'react';
import { clsx } from 'clsx';
import { cn } from '../../utils/cn';
import {
  buttonVariants,
  buttonSizes,
  type ButtonVariant,
  type ButtonSize,
} from '../../utils/buttonVariants';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Variant = ButtonVariant;
export type Size = ButtonSize;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  selected?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

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
    ref
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface',
          'touch-target',
          // Selected subtle micro-movement
          isSelected && 'translate-y-[1px] shadow-xs',
          // Variant using clsx(buttonVariants[variant])
          clsx(buttonVariants[variant]),
          // Size
          buttonSizes[size],
          // Width
          fullWidth && 'w-full',
          // Disabled
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 role="status" aria-label="Loading" className="h-4 w-4 animate-spin" />
        ) : (
          leadIcon && (
            <span className="shrink-0" aria-hidden="true">
              {leadIcon}
            </span>
          )
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && (
          <span className="shrink-0 ml-auto" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
