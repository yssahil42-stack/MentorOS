import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  buttonVariants,
  buttonSizes,
  type ButtonVariant,
  type ButtonSize,
} from '../../utils/buttonVariants';

export interface SplitButtonItem {
  label: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  id?: string;
}

export interface SplitButtonProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  options: SplitButtonItem[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  menuClassName?: string;
  menuPlacement?: 'bottom-left' | 'bottom-right';
  'aria-label'?: string;
  dropdownAriaLabel?: string;
}

export const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      children,
      label,
      onClick,
      options,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      className,
      menuClassName,
      menuPlacement = 'bottom-right',
      'aria-label': ariaLabel,
      dropdownAriaLabel = 'Toggle more actions',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isDisabled = disabled || loading;
    const content = children ?? label;

    // Close on click outside or escape key
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    const sizeClasses = buttonSizes[size] || buttonSizes.md;
    const variantClasses = buttonVariants[variant] || buttonVariants.primary;

    return (
      <div
        ref={containerRef}
        className={cn('inline-flex relative rounded-xl shadow-2xs group', className)}
      >
        {/* Main Action Button */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={onClick}
          aria-label={ariaLabel}
          className={cn(
            'inline-flex items-center justify-center font-medium border rounded-l-xl rounded-r-none',
            'transition-all duration-150 ease-smooth select-none cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:z-10',
            sizeClasses,
            variantClasses,
            isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-1.5" aria-label="Loading" />
          )}
          {content}
        </button>

        {/* Dropdown Toggle Trigger Button */}
        <button
          type="button"
          disabled={isDisabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={dropdownAriaLabel}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'inline-flex items-center justify-center border border-l-0 rounded-r-xl rounded-l-none px-2',
            'transition-all duration-150 ease-smooth select-none cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:z-10',
            variantClasses,
            isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className={cn(
              'absolute top-full mt-1.5 z-50 min-w-[180px] py-1.5',
              'bg-bg-surface border border-border-base rounded-xl shadow-lg backdrop-blur-md',
              'animate-in fade-in-0 zoom-in-95 duration-100',
              menuPlacement === 'bottom-right' ? 'right-0' : 'left-0',
              menuClassName
            )}
          >
            {options.map((option, index) => (
              <button
                key={option.id ?? index}
                type="button"
                role="menuitem"
                disabled={option.disabled}
                onClick={() => {
                  setIsOpen(false);
                  option.onClick();
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left',
                  'transition-colors duration-150 select-none cursor-pointer',
                  'hover:bg-bg-elevated focus-visible:bg-bg-elevated focus-visible:outline-none',
                  option.danger
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-text-primary hover:text-orange-600 dark:hover:text-orange-400',
                  option.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                {option.icon && (
                  <span className="shrink-0 text-text-muted" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SplitButton.displayName = 'SplitButton';
