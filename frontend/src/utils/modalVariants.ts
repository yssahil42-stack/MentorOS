import { cn } from './cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fullscreen';

export const modalSizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[95vw]',
  fullscreen: 'w-full h-full max-w-none max-h-none',
};

export interface ModalVariantOptions {
  size?: ModalSize;
  className?: string;
}

export function modalDialogVariants({ size = 'md', className }: ModalVariantOptions = {}) {
  return cn(
    'relative w-full bg-bg-surface border border-border-subtle shadow-glass-lg',
    'animate-scale-in flex flex-col',
    size === 'fullscreen'
      ? 'h-screen max-h-screen rounded-none border-0'
      : 'rounded-2xl max-h-[90vh]',
    modalSizes[size] || modalSizes.md,
    className
  );
}

export function modalOverlayVariants({ size = 'md', className }: ModalVariantOptions = {}) {
  return cn(
    'fixed inset-0 z-50 flex items-center justify-center',
    size === 'fullscreen' ? 'p-0' : 'p-4',
    className
  );
}

export const modalBackdropVariants =
  'absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in';
