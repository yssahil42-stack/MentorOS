import React from 'react';
import { cn } from '../../utils/cn';
import { Button, type ButtonProps } from './Button';
import type { ButtonSize, ButtonVariant } from '../../utils/buttonVariants';

export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'leftIcon' | 'iconRight'> {
  icon: React.ReactNode;
  'aria-label': string; // Enforce accessibility for icon buttons
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: boolean; // rounded-full or rounded-xl
}

const ICON_SIZE_DIMENSIONS: Record<ButtonSize, string> = {
  xs: 'w-7 h-7 p-0',
  sm: 'w-8 h-8 p-0',
  md: 'w-9 h-9 p-0',
  lg: 'w-12 h-12 p-0',
  xl: 'w-14 h-14 p-0',
  icon: 'w-9 h-9 p-0',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      rounded = false,
      className,
      'aria-label': ariaLabel,
      title,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        icon={icon}
        aria-label={ariaLabel}
        title={title ?? ariaLabel}
        className={cn(
          'shrink-0 flex items-center justify-center p-0 aspect-square',
          ICON_SIZE_DIMENSIONS[size] || 'w-9 h-9',
          rounded ? 'rounded-full' : 'rounded-xl',
          className
        )}
        {...props}
      />
    );
  }
);

IconButton.displayName = 'IconButton';
