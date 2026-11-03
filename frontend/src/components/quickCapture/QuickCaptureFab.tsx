import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { useQuickCapture } from '../../contexts/QuickCaptureContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export interface QuickCaptureFabProps {
  /** Custom position override */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Whether to show the FAB */
  enabled?: boolean;
}

const POSITION_CLASSES: Record<string, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

export function QuickCaptureFab({
  position = 'bottom-right',
  enabled = true,
}: QuickCaptureFabProps) {
  const { settings, capture } = useQuickCapture();
  const { openCaptureModal } = useWorkspace();
  const [isExpanded, setIsExpanded] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // ─── Keyboard Shortcut ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!settings.shortcutEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for quick capture
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openCaptureModal('ai');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.shortcutEnabled, openCaptureModal]);

  // ─── Close on Outside Click ─────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isExpanded && fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // ─── Handle Capture Type Quick Actions ──────────────────────────────────────

  const handleQuickCapture = useCallback(
    async (type: string, source: 'shortcut' | 'fab') => {
      const typeMap: Record<string, { title: string; promptStarter: string }> = {
        task: { title: 'New Task', promptStarter: 'Create a task for: ' },
        idea: { title: 'New Idea', promptStarter: 'Capture this idea: ' },
        note: { title: 'New Note', promptStarter: 'Quick note: ' },
        deadline: { title: 'New Deadline', promptStarter: 'Add deadline for: ' },
      };

      const config = typeMap[type] || typeMap.task;
      setIsExpanded(false);

      // Open the modal with prefilled type
      openCaptureModal('ai');
      // The modal will open with the default type, user can change it
      // For a more advanced implementation, we could pass the type to the modal
    },
    [openCaptureModal]
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!enabled || !settings.showFAB) return null;

  return (
    <div
      ref={fabRef}
      className={cn('fixed z-50 flex flex-col items-end gap-3', POSITION_CLASSES[position])}
    >
      {/* Expanded Actions */}
      {isExpanded && (
        <div
          className="flex flex-col items-end gap-2 animate-fade-in"
          role="menu"
          aria-label="Quick capture actions"
        >
          {[
            { type: 'task', icon: Zap, label: 'Task', color: 'bg-blue-500' },
            { type: 'idea', icon: Plus, label: 'Idea', color: 'bg-purple-500' },
            { type: 'note', icon: Plus, label: 'Note', color: 'bg-emerald-500' },
            { type: 'deadline', icon: Plus, label: 'Deadline', color: 'bg-amber-500' },
          ].map((action) => (
            <button
              key={action.type}
              role="menuitem"
              onClick={() => handleQuickCapture(action.type, 'fab')}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-white shadow-lg',
                'transition-all duration-200 hover:scale-105 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                action.color
              )}
              aria-label={`Capture ${action.label}`}
            >
              <action.icon className="w-4 h-4" aria-hidden="true" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-haspopup="menu"
        aria-label={isExpanded ? 'Close quick capture' : 'Open quick capture (Ctrl+K)'}
        className={cn(
          'w-14 h-14 rounded-2xl shadow-glass-lg flex items-center justify-center',
          'transition-all duration-300 ease-spring',
          'hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
          'bg-solar-500 text-white hover:bg-solar-600',
          isExpanded && 'rotate-45 bg-solar-600'
        )}
        size="lg"
        variant="primary"
      >
        {isExpanded ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <Plus className="w-6 h-6" aria-hidden="true" />
        )}
      </Button>

      {/* Keyboard Hint Tooltip */}
      <div className="hidden md:block absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-bg-surface border border-border-base rounded-lg shadow-lg text-xs whitespace-nowrap animate-fade-in">
        <kbd className="px-1.5 py-0.5 bg-bg-base border border-border-base rounded font-semibold text-text-primary">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K
        </kbd>{' '}
        <span className="text-text-secondary font-medium">Quick capture</span>
      </div>
    </div>
  );
}
