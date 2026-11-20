import React from 'react';
import { Clock, Timer } from 'lucide-react';
import { formatTimeMinutes } from '../../utils/timeTracking';

export interface TimeTrackingBadgeProps {
  expectedMinutes?: number | null;
  actualMinutes?: number | null;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'badges' | 'inline' | 'pill';
  className?: string;
  expectedLabel?: string;
  actualLabel?: string;
}

export const TimeTrackingBadge: React.FC<TimeTrackingBadgeProps> = ({
  expectedMinutes = 0,
  actualMinutes = 0,
  size = 'xs',
  variant = 'badges',
  className = '',
  expectedLabel = 'Expected',
  actualLabel = 'Actual',
}) => {
  const exp = expectedMinutes ?? 0;
  const act = actualMinutes ?? 0;
  const isOvertime = act > 0 && exp > 0 && act > exp;
  const hasActual = act > 0;

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  const textSizes = {
    xs: 'text-3xs',
    sm: 'text-2xs',
    md: 'text-xs',
  };

  const iconSize = iconSizes[size];
  const textSize = textSizes[size];

  if (variant === 'inline') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-mono ${textSize} text-text-muted bg-bg-elevated/70 px-2 py-0.5 rounded-md border border-border-subtle shrink-0 ${className}`}
        title={`Expected: ${formatTimeMinutes(exp)} | Actual time taken: ${formatTimeMinutes(act)}`}
      >
        <span className="inline-flex items-center gap-1">
          <Clock className={`${iconSize} text-text-faint shrink-0`} />
          <span>
            {expectedLabel}: {formatTimeMinutes(exp)}
          </span>
        </span>
        <span className="text-border-base font-sans">|</span>
        <span
          className={`inline-flex items-center gap-1 ${
            isOvertime
              ? 'text-amber-500 font-semibold'
              : hasActual
                ? 'text-emerald-500 font-medium'
                : 'text-text-faint'
          }`}
        >
          <Timer className={`${iconSize} shrink-0`} />
          <span>
            {actualLabel}: {formatTimeMinutes(act)}
          </span>
        </span>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1 font-mono ${textSize} px-2 py-0.5 rounded-full border bg-bg-elevated/60 border-border-subtle shrink-0 text-text-muted ${className}`}
        title={`Expected: ${formatTimeMinutes(exp)} | Actual time taken: ${formatTimeMinutes(act)}`}
      >
        <Clock className={`${iconSize} text-text-faint shrink-0`} />
        <span>{formatTimeMinutes(exp)}</span>
        <span className="text-border-base">/</span>
        <Timer
          className={`${iconSize} ${hasActual ? 'text-emerald-400' : 'text-text-faint'} shrink-0`}
        />
        <span className={hasActual ? 'text-text-primary font-medium' : 'text-text-faint'}>
          {formatTimeMinutes(act)}
        </span>
      </div>
    );
  }

  // Default 'badges'
  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono ${textSize} shrink-0 flex-wrap ${className}`}
    >
      {/* Expected Time Badge */}
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-elevated/80 border border-border-subtle text-text-muted"
        title={`Expected time: ${formatTimeMinutes(exp)}`}
      >
        <Clock className={`${iconSize} text-text-faint shrink-0`} />
        <span>
          <span className="text-text-faint font-sans mr-0.5">{expectedLabel}:</span>
          {formatTimeMinutes(exp)}
        </span>
      </span>

      {/* Actual Time Badge */}
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
          isOvertime
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/25 font-semibold'
            : hasActual
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-medium'
              : 'bg-bg-elevated/80 border-border-subtle text-text-faint'
        }`}
        title={`Actual time taken: ${formatTimeMinutes(act)}`}
      >
        <Timer className={`${iconSize} shrink-0`} />
        <span>
          <span className="text-text-faint font-sans mr-0.5">{actualLabel}:</span>
          {formatTimeMinutes(act)}
        </span>
      </span>
    </div>
  );
};
