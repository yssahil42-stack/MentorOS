import React, { useRef, useState, useCallback } from 'react';
import { Card3DVariant, cardVariants, cardVariantStyles } from '../../utils/cardVariants';

export * from '../../utils/cardVariants';

export interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: Card3DVariant;
  maxTilt?: number;
  depth?: number;
  glare?: boolean;
  hoverElevate?: boolean;
  disabled?: boolean;
}

export function Card3D({
  children,
  variant = 'secondary',
  maxTilt = 0,
  depth = 0,
  glare = false,
  hoverElevate = false,
  disabled = false,
  className,
  style,
  onMouseMove,
  onMouseLeave,
  onMouseEnter,
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave]
  );

  const cardStyle: React.CSSProperties = {
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: isHovered && !disabled ? '0 6px 20px -2px rgba(0, 0, 0, 0.18)' : undefined,
    ...style,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      className={cardVariants({ variant, className })}
      {...props}
    >
      {/* Card Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
