import { cn } from './cn';

export type Card3DVariant = 'default' | 'secondary' | 'elevated' | 'glass' | 'outline' | 'flat';

export const cardVariantStyles: Record<Card3DVariant, string> = {
  default:
    'bg-bg-surface/90 border-border-base/90 shadow-card hover:border-border-hover backdrop-blur-md',
  secondary:
    'bg-bg-surface/90 border-border-base/90 shadow-card hover:border-border-hover backdrop-blur-md',
  elevated:
    'bg-bg-elevated/90 border-border-base shadow-card hover:border-border-hover backdrop-blur-md',
  glass: 'glass border-glass-border/70 shadow-glass hover:border-border-hover backdrop-blur-xl',
  outline: 'bg-transparent border-border-base hover:border-border-hover shadow-none',
  flat: 'bg-bg-surface border-transparent shadow-none',
};

export interface CardVariantOptions {
  variant?: Card3DVariant;
  className?: string;
}

export function cardVariants({ variant = 'secondary', className }: CardVariantOptions = {}) {
  return cn(
    'relative rounded-2xl border transition-colors duration-200 group/card3d overflow-hidden',
    cardVariantStyles[variant] || cardVariantStyles.secondary,
    className
  );
}
