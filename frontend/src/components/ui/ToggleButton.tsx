import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button, type ButtonProps } from './Button';

export interface ToggleButtonProps extends Omit<ButtonProps, 'onChange'> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  activeClassName?: string;
}

export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      pressed: controlledPressed,
      defaultPressed = false,
      onPressedChange,
      variant = 'toggle',
      activeClassName,
      className,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledPressed !== undefined;
    const [internalPressed, setInternalPressed] = useState(defaultPressed);
    const isPressed = isControlled ? controlledPressed : internalPressed;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const next = !isPressed;
      if (!isControlled) {
        setInternalPressed(next);
      }
      onPressedChange?.(next);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        aria-pressed={isPressed}
        selected={isPressed}
        onClick={handleClick}
        className={cn(
          'transition-all duration-150',
          isPressed &&
            cn(
              'bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400 font-semibold shadow-2xs',
              activeClassName
            ),
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

ToggleButton.displayName = 'ToggleButton';
