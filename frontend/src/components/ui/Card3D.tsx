import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

export type Card3DVariant = 'default' | 'secondary' | 'elevated' | 'glass';

export const cardVariantStyles: Record<Card3DVariant, string> = {
  default:
    'bg-bg-surface/90 border-border-base/90 shadow-card hover:border-border-hover backdrop-blur-md',
  secondary:
    'bg-bg-surface/90 border-border-base/90 shadow-card hover:border-border-hover backdrop-blur-md',
  elevated:
    'bg-bg-elevated/90 border-border-base shadow-card hover:border-border-hover backdrop-blur-md',
  glass: 'glass border-glass-border/70 shadow-glass hover:border-border-hover backdrop-blur-xl',
};

export function cardVariants({
  variant = 'secondary',
  className,
}: {
  variant?: Card3DVariant;
  className?: string;
} = {}) {
  return cn(
    'relative rounded-2xl border transition-colors duration-200 group/card3d overflow-hidden',
    cardVariantStyles[variant] || cardVariantStyles.secondary,
    className
  );
}

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
