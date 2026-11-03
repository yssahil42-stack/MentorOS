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
  dropdown?: React.ReactNode; // For SplitButton
  tooltip?: string; // Native tooltip
  keyboardShortcut?: string; // Show hint (e.g., "⌘K")
  analyticsEvent?: string; // Auto-track clicks
  confirm?: string; // Native confirm dialog
  debounceMs?: number; // Prevent double-click
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
      dropdown,
      tooltip,
      keyboardShortcut,
      analyticsEvent,
      confirm,
      debounceMs,
      children,
      className,
      disabled,
      title,
      onClick,
      ...props
    },
    ref
  ) => {
    const lastClickRef = React.useRef<number>(0);
    const isDisabled = disabled || loading;
    const leadIcon = icon ?? leftIcon;
    const isSelected = selected || props['aria-pressed'] === true;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (confirm && typeof window !== 'undefined' && !window.confirm(confirm)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (debounceMs && debounceMs > 0) {
        const now = Date.now();
        if (now - lastClickRef.current < debounceMs) {
          e.preventDefault();
          return;
        }
        lastClickRef.current = now;
      }

      if (analyticsEvent && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('mentoros:analytics', {
              detail: { event: analyticsEvent, timestamp: Date.now() },
            })
          );
        } catch {
          // ignore
        }
      }

      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        title={tooltip ?? title}
        onClick={handleClick}
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
        {keyboardShortcut && (
          <kbd className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-muted bg-bg-surface/80 border border-border-base rounded shadow-2xs select-none">
            {keyboardShortcut}
          </kbd>
        )}
        {!loading && iconRight && (
          <span className="shrink-0 ml-auto" aria-hidden="true">
            {iconRight}
          </span>
        )}
        {dropdown && (
          <span className="shrink-0 ml-1" aria-hidden="true">
            {dropdown}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
