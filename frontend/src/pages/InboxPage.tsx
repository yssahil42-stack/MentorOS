import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  X,
  Tag,
  Target,
  AlertCircle,
  Send,
  Clock,
  Link2,
  MoreHorizontal,
  Archive,
  Trash2,
  ExternalLink,
  Loader2,
  Filter,
  Inbox,
  Check,
  Plus,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuickCapture } from '../contexts/QuickCaptureContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import type { CapturedItem, CaptureType, CaptureStatus } from '../lib/quickCaptureDB';
import { getRoleConfig, getTerm } from '../config/roles';

const TYPE_CONFIG: Record<CaptureType, { label: string; icon: React.ReactNode; color: string }> = {
  task: {
    label: 'Task',
    icon: <Target className="w-4 h-4" />,
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  idea: {
    label: 'Idea',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  note: {
    label: 'Note',
    icon: <Send className="w-4 h-4" />,
    color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  deadline: {
    label: 'Deadline',
    icon: <Clock className="w-4 h-4" />,
    color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  contact: {
    label: 'Contact',
    icon: <Link2 className="w-4 h-4" />,
    color: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },
  link: {
    label: 'Link',
    icon: <Link2 className="w-4 h-4" />,
    color: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
};

const STATUS_CONFIG: Record<CaptureStatus, { label: string; color: string }> = {
  captured: {
    label: 'Captured',
    color: 'bg-solar-500/20 text-solar-600 dark:text-solar-400 border-solar-500/30',
  },
  triaged: {
    label: 'Triaged',
    color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  synced: {
    label: 'Synced',
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  archived: { label: 'Archived', color: 'bg-text-muted/20 text-text-muted border-text-muted/30' },
};

const MODULE_ROUTES: Record<string, { path: string; label: string; icon: React.ReactNode }> = {
  student: { path: '/app/student', label: 'Student', icon: <Inbox className="w-4 h-4" /> },
  freelancer: { path: '/app/freelancer', label: 'Freelancer', icon: <Inbox className="w-4 h-4" /> },
  developer: { path: '/app/developer', label: 'Developer', icon: <Inbox className="w-4 h-4" /> },
  job_seeker: { path: '/app/job-seeker', label: 'Job Seeker', icon: <Inbox className="w-4 h-4" /> },
};

interface TriagedItem extends CapturedItem {
  targetModule: string;
  targetProjectId?: number;
}

export default function InboxPage() {
  const {
    pendingCaptures,
    triagedCaptures,
    triageCapture,
    archiveCapture,
    deleteCapture,
    refresh,
  } = useQuickCapture();
  const { showToast, openCaptureModal } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'captured' | 'triaged'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [triageItem, setTriageItem] = useState<CapturedItem | null>(null);
  const [triageForm, setTriageForm] = useState({ module: '', projectId: '' });
  const [isBulkTriage, setIsBulkTriage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── Computed ────────────────────────────────────────────────────────────────

  const displayedItems =
    filter === 'all'
      ? [...pendingCaptures, ...triagedCaptures]
      : filter === 'captured'
        ? pendingCaptures
        : triagedCaptures;

  const allSelected =
    displayedItems.length > 0 && displayedItems.every((item) => selectedItems.has(item.id));
  const someSelected = displayedItems.some((item) => selectedItems.has(item.id));

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayedItems.map((i) => i.id)));
    }
  }, [allSelected, displayedItems]);

  const openTriageModal = useCallback(
    (item: CapturedItem, bulk = false) => {
      setTriageItem(item);
      setTriageForm({ module: user?.role || 'student', projectId: '' });
      setIsBulkTriage(bulk);
      setTriageModalOpen(true);
    },
    [user?.role]
  );

  const closeTriageModal = useCallback(() => {
    setTriageModalOpen(false);
    setTriageItem(null);
    setIsBulkTriage(false);
  }, []);

  const handleTriage = useCallback(async () => {
    if (!triageItem) return;

    const itemsToTriage = isBulkTriage
      ? (Array.from(selectedItems)
          .map((id) => pendingCaptures.find((c) => c.id === id))
          .filter(Boolean) as CapturedItem[])
      : [triageItem];

    try {
      for (const item of itemsToTriage) {
        const projectId = triageForm.projectId ? parseInt(triageForm.projectId, 10) : undefined;
        await triageCapture(item.id, triageForm.module, projectId);
      }
      showToast(
        isBulkTriage
          ? `Triaged ${itemsToTriage.length} items to ${MODULE_ROUTES[triageForm.module]?.label}`
          : `Triaged to ${MODULE_ROUTES[triageForm.module]?.label}`,
        'success'
      );
      setSelectedItems(new Set());
      closeTriageModal();
    } catch (error) {
      console.error('Failed to triage:', error);
      showToast('Failed to triage', 'error');
    }
  }, [
    triageItem,
    isBulkTriage,
    selectedItems,
    triageForm,
    pendingCaptures,
    triageCapture,
    showToast,
    closeTriageModal,
  ]);

  const handleArchive = useCallback(
    async (id: string) => {
      await archiveCapture(id);
      showToast('Archived', 'info');
    },
    [archiveCapture, showToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteCapture(id);
      showToast('Deleted', 'info');
    },
    [deleteCapture, showToast]
  );

  const handleBulkArchive = useCallback(async () => {
    for (const id of selectedItems) {
      await archiveCapture(id);
    }
    showToast(`Archived ${selectedItems.size} items`, 'success');
    setSelectedItems(new Set());
  }, [selectedItems, archiveCapture, showToast]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedItems) {
      await deleteCapture(id);
    }
    showToast(`Deleted ${selectedItems.size} items`, 'success');
    setSelectedItems(new Set());
  }, [selectedItems, deleteCapture, showToast]);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (pendingCaptures.length === 0 && triagedCaptures.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary">Inbox</h1>
            <p className="text-sm text-text-muted mt-1">Captured items waiting to be organized</p>
          </div>
          <Button onClick={() => openCaptureModal('ai')} icon={<Plus className="w-4 h-4" />}>
            Capture
          </Button>
        </div>

        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="Nothing captured yet"
          description="Use the Quick Capture button (⌘K) or the floating action button to capture thoughts, tasks, and ideas on the fly."
          action={{
            label: 'Try Quick Capture',
            onClick: () => openCaptureModal('ai'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Inbox</h1>
          <p className="text-sm text-text-muted mt-1">
            {pendingCaptures.length} pending • {triagedCaptures.length} triaged
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openCaptureModal('ai')}
            icon={<Plus className="w-4 h-4" />}
          >
            Capture
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsSyncing(true);
              refresh().finally(() => setIsSyncing(false));
            }}
            loading={isSyncing}
            icon={<Loader2 className="w-4 h-4 animate-spin" />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-bg-base/80 p-1 rounded-xl border border-border-base">
        {(['all', 'captured', 'triaged'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f
                ? 'bg-solar-500 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {f === 'all' ? 'All' : f === 'captured' ? 'Captured' : 'Triaged'}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-bg-surface/50">
              {filter === 'all'
                ? pendingCaptures.length + triagedCaptures.length
                : filter === 'captured'
                  ? pendingCaptures.length
                  : triagedCaptures.length}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-solar-500/10 border border-solar-500/20 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-text-primary">{selectedItems.size} selected</span>
            <span className="text-text-muted">•</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkArchive}
              icon={<Archive className="w-3.5 h-3.5" />}
            >
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-danger hover:bg-danger/10"
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openTriageModal(null as any, true)}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Triaged →
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No {filter === 'all' ? 'items' : filter} found
          </div>
        ) : (
          displayedItems.map((item) => (
            <CaptureCard
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              isExpanded={expandedItem === item.id}
              onToggleSelect={() => toggleSelect(item.id)}
              onToggleExpand={() => setExpandedItem((prev) => (prev === item.id ? null : item.id))}
              onTriage={() => openTriageModal(item)}
              onArchive={() => handleArchive(item.id)}
              onDelete={() => handleDelete(item.id)}
              formatTime={formatTime}
            />
          ))
        )}
      </div>

      {/* Triage Modal */}
      <Modal
        isOpen={triageModalOpen}
        onClose={closeTriageModal}
        title={isBulkTriage ? `Triaged ${selectedItems.size} Items` : 'Triaged Item'}
        description="Choose where to organize this item"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Module</label>
            <select
              value={triageForm.module}
              onChange={(e) => setTriageForm((prev) => ({ ...prev, module: e.target.value }))}
              className="w-full bg-bg-base/80 border border-border-base rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none focus:border-solar-500/50 transition-colors"
            >
              {Object.entries(MODULE_ROUTES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Project (Optional)
            </label>
            <input
              type="text"
              value={triageForm.projectId}
              onChange={(e) => setTriageForm((prev) => ({ ...prev, projectId: e.target.value }))}
              placeholder="Project ID or leave blank"
              className="w-full bg-bg-base/80 border border-border-base rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500/50 transition-colors"
            />
            <p className="mt-1 text-xs text-text-muted">
              Enter a project ID to associate with this item
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-base">
            <Button variant="ghost" size="sm" onClick={closeTriageModal}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleTriage} loading={isBulkTriage}>
              {isBulkTriage ? `Triaged ${selectedItems.size} Items` : 'Triaged Item'}
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Capture Card Component ────────────────────────────────────────────────────

interface CaptureCardProps {
  item: CapturedItem;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onTriage: () => void;
  onArchive: () => void;
  onDelete: () => void;
  formatTime: (timestamp: number) => string;
}

function CaptureCard({
  item,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onTriage,
  onArchive,
  onDelete,
  formatTime,
}: CaptureCardProps) {
  const typeConfig = TYPE_CONFIG[item.type];
  const statusConfig = STATUS_CONFIG[item.status];

  return (
    <Card
      variant="elevated"
      className={cn(
        'transition-all duration-200 border-l-4',
        isSelected && 'ring-2 ring-solar-500/50 bg-solar-500/5',
        item.status === 'captured' && 'border-l-solar-500',
        item.status === 'triaged' && 'border-l-emerald-500',
        item.status === 'synced' && 'border-l-blue-500',
        item.status === 'archived' && 'border-l-text-muted/50 opacity-60'
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="mt-0.5 h-4 w-4 rounded border-border-base text-solar-500 focus:ring-solar-500 cursor-pointer"
              aria-label="Select item"
            />
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                typeConfig.color
              )}
            >
              {typeConfig.icon}
              {typeConfig.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-faint font-mono">
              {formatTime(item.createdAt)}
            </span>
            <div className="relative">
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="p-1.5"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Title & Content */}
        <div className="space-y-2 mb-3">
          <h3 className="font-semibold text-text-primary line-clamp-2">{item.title}</h3>
          {item.content && (
            <p className="text-sm text-text-secondary line-clamp-3">{item.content}</p>
          )}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-bg-base/80 border border-border-base text-text-muted"
              >
                <Tag className="w-2.5 h-2.5" />#{tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted border-t border-border-base pt-3">
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  item.source === 'voice'
                    ? '#8B5CF6'
                    : item.source === 'share'
                      ? '#06B6D4'
                      : '#F59E0B',
              }}
            />
            {item.source}
          </span>
          {item.moduleId && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/20">
              → {MODULE_ROUTES[item.moduleId]?.label || item.moduleId}
            </span>
          )}
        </div>

        {/* Expanded Actions */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border-base space-y-2 animate-fade-in">
            <Button
              variant="secondary"
              size="sm"
              onClick={onTriage}
              className="w-full justify-start gap-2"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              {item.status === 'captured' ? 'Triaged →' : 'Re-triaged →'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onArchive}
                className="justify-start gap-2"
                icon={<Archive className="w-3.5 h-3.5" />}
              >
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="justify-start gap-2 text-danger hover:bg-danger/10"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
