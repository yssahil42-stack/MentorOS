import React, { forwardRef } from 'react';
import { inputVariants, InputVariant, InputSize } from '../../utils/inputVariants';

export * from '../../utils/inputVariants';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: InputVariant;
  size?: InputSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      id,
      required,
      variant = 'default',
      size = 'md',
      ...props
    },
    ref
  ) => {
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
            className={inputVariants({
              variant,
              size,
              hasError: !!error,
              hasIcon: !!icon,
              className,
            })}
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
