import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from './Button';
import { cn } from '../../utils/cn';

export interface LoadingButtonProps extends ButtonProps {
  loadingText?: React.ReactNode;
  spinnerPlacement?: 'start' | 'end';
  spinner?: React.ReactNode;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      loading = false,
      loadingText,
      spinnerPlacement = 'start',
      spinner,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const defaultSpinner = spinner ?? (
      <Loader2 role="status" aria-label="Loading" className="h-4 w-4 animate-spin shrink-0" />
    );

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        loading={loading && !loadingText}
        className={cn('relative transition-all', className)}
        {...props}
      >
        {loading && loadingText ? (
          <span className="inline-flex items-center gap-2">
            {spinnerPlacement === 'start' && defaultSpinner}
            <span>{loadingText}</span>
            {spinnerPlacement === 'end' && defaultSpinner}
          </span>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
