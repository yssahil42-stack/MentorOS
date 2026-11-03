import React from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AiStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function AiStatusIndicator({ className, showText = false }: AiStatusIndicatorProps) {
  const { aiOnline, aiStatus = aiOnline ? 'online' : 'offline', openAIDrawer } = useWorkspace();

  // Determine current tri-state: online (green), slow (orange), offline (red)
  const effectiveStatus: 'online' | 'slow' | 'offline' = !aiOnline
    ? 'offline'
    : aiStatus === 'slow'
      ? 'slow'
      : 'online';

  const statusConfig = {
    online: {
      dotClass: 'bg-emerald-500',
      pingClass: 'bg-emerald-400',
      borderClass: 'border-emerald-500/30',
      bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      textClass: 'text-emerald-400',
      tooltip: 'AI: Online',
    },
    slow: {
      dotClass: 'bg-amber-500',
      pingClass: 'bg-amber-400',
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
      textClass: 'text-amber-400',
      tooltip: 'AI: Slow',
    },
    offline: {
      dotClass: 'bg-red-500',
      pingClass: 'bg-red-400',
      borderClass: 'border-red-500/30',
      bgClass: 'bg-red-500/10 hover:bg-red-500/20',
      textClass: 'text-red-400',
      tooltip: 'AI: Offline',
    },
  }[effectiveStatus];

  return (
    <button
      type="button"
      onClick={() => openAIDrawer()}
      title={statusConfig.tooltip}
      aria-label={statusConfig.tooltip}
      className={cn(
        'group relative flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-200 cursor-pointer',
        statusConfig.bgClass,
        statusConfig.borderClass,
        'hover:shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        className
      )}
    >
      {/* Indicator Dot */}
      <span className="relative flex h-2 w-2 items-center justify-center">
        {effectiveStatus !== 'offline' && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              statusConfig.pingClass
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2 shadow-xs transition-colors',
            statusConfig.dotClass
          )}
        />
      </span>

      {/* Optional Icon & Text Label */}
      <span className="flex items-center gap-1 text-3xs font-mono font-medium text-text-muted group-hover:text-text-primary transition-colors">
        <Sparkles className="w-2.5 h-2.5 text-solar-500" />
        {showText ? (
          <span className={statusConfig.textClass}>{statusConfig.tooltip}</span>
        ) : (
          <span className="hidden sm:inline">AI</span>
        )}
      </span>

      {/* Floating Tooltip Hover Balloon */}
      <div
        role="tooltip"
        className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-surface text-text-primary text-3xs font-mono font-bold shadow-lg border border-border-base whitespace-nowrap z-50 pointer-events-none animate-fade-in"
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotClass)} />
        <span>{statusConfig.tooltip}</span>
      </div>
    </button>
  );
}
export default AiStatusIndicator;
