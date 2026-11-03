import React from 'react';
import {
  CheckSquare,
  Square,
  FolderGit2,
  Flag,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
} from 'lucide-react';
import type { AIProposalItem, AIProposalItemType } from '../../types/aiProposal';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ProposalReviewPanelProps {
  items: AIProposalItem[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  roleColor?: string;
  maxListHeight?: string;
}

export function ProposalReviewPanel({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  roleColor = 'var(--role-primary, #10B981)',
  maxListHeight = 'max-h-[calc(100vh-320px)]',
}: ProposalReviewPanelProps) {
  const getItemIcon = (type: AIProposalItemType) => {
    switch (type) {
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-emerald-400" />;
      case 'milestone':
        return <Flag className="w-4 h-4 text-amber-400" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
      case 'calendar_event':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
    }
  };

  const getItemTypeBadge = (type: AIProposalItemType) => {
    switch (type) {
      case 'project':
        return (
          <Badge variant="success" size="sm">
            Roadmap Project
          </Badge>
        );
      case 'milestone':
        return (
          <Badge variant="warning" size="sm">
            Roadmap Phase
          </Badge>
        );
      case 'task':
        return (
          <Badge variant="info" size="sm">
            Actionable Task
          </Badge>
        );
      case 'calendar_event':
        return (
          <Badge variant="neutral" size="sm">
            Scheduled Session
          </Badge>
        );
      case 'note':
        return (
          <Badge variant="neutral" size="sm">
            Guidance &amp; Strategy
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          Selected <strong className="text-text-primary">{selectedIds.length}</strong> of{' '}
          {items.length} items
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="hover:text-text-primary transition-colors hover:underline"
          >
            Select All
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="hover:text-text-primary transition-colors hover:underline"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className={cn('space-y-2 overflow-y-auto pr-1', maxListHeight)}>
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const payload = item.payload as any;

          return (
            <div
              key={item.id}
              onClick={() => onToggleSelect(item.id)}
              className={cn(
                'group relative p-3 rounded-xl border transition-all cursor-pointer select-none',
                isSelected
                  ? 'bg-bg-elevated/90 border-border-hover shadow-sm'
                  : 'bg-bg-surface/40 border-border-base/50 opacity-60 hover:opacity-100 hover:bg-bg-surface/80'
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={isSelected ? 'Deselect item' : 'Select item'}
                  className="mt-0.5 text-text-muted group-hover:text-text-primary transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1 rounded bg-bg-surface border border-border-base">
                      {getItemIcon(item.item_type)}
                    </span>
                    {getItemTypeBadge(item.item_type)}
                    <h5 className="text-sm font-semibold text-text-primary truncate">
                      {payload.title}
                    </h5>
                  </div>

                  {payload.description && (
                    <p className="text-xs text-text-muted line-clamp-2 pl-0.5">
                      {payload.description}
                    </p>
                  )}

                  {payload.content && (
                    <div className="mt-1.5 p-2 rounded-lg bg-bg-surface/80 border border-border-subtle text-2xs text-text-secondary whitespace-pre-line max-h-36 overflow-y-auto leading-relaxed font-sans">
                      {payload.content}
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 text-[11px] text-text-faint pt-1">
                    {payload.project_title && (
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-text-muted" />
                        {payload.project_title}
                      </span>
                    )}

                    {payload.priority &&
                      !['high', 'low', 'intermediate', 'urgent', 'medium'].includes(
                        String(payload.priority).toLowerCase()
                      ) && (
                        <span className="capitalize px-1.5 py-0.5 rounded bg-bg-surface border border-border-base text-text-muted">
                          {payload.priority}
                        </span>
                      )}

                    {payload.estimated_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {payload.estimated_minutes} min
                      </span>
                    )}

                    {payload.target_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {payload.target_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
