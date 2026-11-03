import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
  children: React.ReactNode;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = 'horizontal', attached = true, className, children, ...props }, ref) => {
    const isHorizontal = orientation === 'horizontal';

    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          'inline-flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          attached &&
            isHorizontal && [
              '[&>*:not(:first-child):not(:last-child)]:rounded-none',
              '[&>*:first-child]:rounded-r-none',
              '[&>*:last-child]:rounded-l-none',
              '[&>*:not(:first-child)]:-ml-px',
              '[&>*:hover]:z-10',
              '[&>*:focus-visible]:z-20',
            ],
          attached &&
            !isHorizontal && [
              '[&>*:not(:first-child):not(:last-child)]:rounded-none',
              '[&>*:first-child]:rounded-b-none',
              '[&>*:last-child]:rounded-t-none',
              '[&>*:not(:first-child)]:-mt-px',
              '[&>*:hover]:z-10',
              '[&>*:focus-visible]:z-20',
            ],
          !attached && (isHorizontal ? 'gap-2' : 'gap-2 flex-col'),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
