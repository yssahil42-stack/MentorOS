import React, { forwardRef } from 'react';
import { selectVariants, InputVariant, InputSize } from '../../utils/inputVariants';

export * from '../../utils/inputVariants';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'size'
> {
  label?: string;
  error?: string;
  options: SelectOption[];
  variant?: InputVariant;
  size?: InputSize;
  onValueChange?: (value: any) => void;
  onChange?: ((value: string) => void) | React.ChangeEventHandler<HTMLSelectElement>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      variant = 'default',
      size = 'md',
      onValueChange,
      onChange,
      id,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (onValueChange) {
        onValueChange(val);
      }
      if (onChange) {
        if (typeof onChange === 'function') {
          // Supports both (val: string) => void and (e: ChangeEvent) => void
          try {
            (onChange as (v: string) => void)(val);
          } catch {
            (onChange as React.ChangeEventHandler<HTMLSelectElement>)(e);
          }
        }
      }
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-text-secondary">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          value={value}
          onChange={handleChange}
          required={required}
          className={selectVariants({
            variant,
            size,
            hasError: !!error,
            className,
          })}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-elevated text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-2xs text-danger font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
