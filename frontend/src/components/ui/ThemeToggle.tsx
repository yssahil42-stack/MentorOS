import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'expanded' | 'badge' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'badge' || variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border-base bg-bg-surface hover:bg-bg-elevated text-xs font-semibold text-text-secondary hover:text-text-primary transition-all duration-200 shadow-sm active:translate-y-[1px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          className,
        )}
        aria-label={`Current mode: ${isDark ? 'Dark' : 'Light'}. Click to switch.`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'expanded' || showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-2.5 h-9 w-full rounded-xl px-2.5 text-xs font-medium',
          'border border-border-base bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary',
          'transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-[1px]',
          className,
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
          <Sun
            className={cn(
              'w-4 h-4 transition-all duration-300 absolute',
              isDark ? 'opacity-0 rotate-90 scale-50 pointer-events-none' : 'opacity-100 rotate-0 scale-100 text-amber-500',
            )}
            aria-hidden="true"
          />
          <Moon
            className={cn(
              'w-4 h-4 transition-all duration-300 absolute',
              isDark ? 'opacity-100 rotate-0 scale-100 text-indigo-400' : 'opacity-0 -rotate-90 scale-50 pointer-events-none',
            )}
            aria-hidden="true"
          />
        </div>
        <span className="truncate">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </button>
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative rounded-xl flex items-center justify-center transition-all duration-200',
        'border border-border-base bg-bg-surface hover:bg-bg-elevated hover:border-border-hover text-text-muted hover:text-text-primary',
        'active:translate-y-[1px] shadow-sm group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        sizeClasses[size],
        className,
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun icon for light mode */}
        <Sun
          className={cn(
            'transition-all duration-300 absolute',
            iconSizes[size],
            isDark
              ? 'opacity-0 rotate-90 scale-50 pointer-events-none'
              : 'opacity-100 rotate-0 scale-100 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]',
          )}
          aria-hidden="true"
        />

        {/* Moon icon for dark mode */}
        <Moon
          className={cn(
            'transition-all duration-300 absolute',
            iconSizes[size],
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]'
              : 'opacity-0 -rotate-90 scale-50 pointer-events-none',
          )}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
