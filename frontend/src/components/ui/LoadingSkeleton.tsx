import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  shape?: 'text' | 'card' | 'avatar' | 'button' | 'custom';
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'custom';
  lines?: number;
  count?: number;
  className?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />;
}

export function LoadingSkeleton({ shape = 'card', variant, lines = 3, count, className }: LoadingSkeletonProps) {
  if (count && count > 1) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, idx) => (
          <LoadingSkeleton key={idx} shape={shape} variant={variant} lines={lines} />
        ))}
      </div>
    );
  }
  const activeShape = variant ?? shape;
  if (activeShape === 'text') {
    return (
      <div className={cn('space-y-2', className)} aria-busy="true" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
          />
        ))}
      </div>
    );
  }

  if (shape === 'avatar') {
    return <SkeletonBlock className={cn('h-10 w-10 rounded-full', className)} />;
  }

  if (shape === 'button') {
    return <SkeletonBlock className={cn('h-9 w-24 rounded-xl', className)} />;
  }

  // card (default)
  return (
    <div className={cn('bg-bg-surface border border-border-subtle rounded-2xl p-5 space-y-3', className)} aria-busy="true" aria-label="Loading content">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

// Dashboard grid skeleton
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      <LoadingSkeleton className="lg:col-span-3" lines={2} shape="card" />
      <LoadingSkeleton className="lg:col-span-2" lines={4} />
      <LoadingSkeleton lines={3} />
      <LoadingSkeleton className="lg:col-span-2" lines={4} />
      <LoadingSkeleton lines={3} />
    </div>
  );
}
