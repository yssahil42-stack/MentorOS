import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={cn(
              'w-full h-9 rounded-xl text-xs bg-bg-surface border border-border-base px-3 py-2 text-text-primary placeholder:text-text-faint transition-all',
              'focus:outline-none focus:border-solar-500 focus:ring-1 focus:ring-solar-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-9',
              error && 'border-danger focus:border-danger focus:ring-danger/30',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-2xs text-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-2xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
