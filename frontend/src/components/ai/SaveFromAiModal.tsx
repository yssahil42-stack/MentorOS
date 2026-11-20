import React, { useState, useEffect } from 'react';
import { CheckSquare, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { createTask } from '../../services/taskService';
import { createNote } from '../../services/noteService';
import { queryClient } from '../../store/queryClient';
import type { TaskPriority } from '../../types/task';

export type SaveFromAiMode = 'task' | 'note';

export interface SaveFromAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SaveFromAiMode;
  initialTitle: string;
  initialContent: string;
  role: string;
}

export function SaveFromAiModal({
  isOpen,
  onClose,
  mode,
  initialTitle,
  initialContent,
  role,
}: SaveFromAiModalProps) {
  const { showToast } = useWorkspace();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || (mode === 'task' ? 'New Task from AI' : 'New Note from AI'));
      setContent(initialContent || '');
      setPriority('medium');
      setDueDate('');
      setError(null);
    }
  }, [isOpen, initialTitle, initialContent, mode]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (mode === 'task') {
        await createTask({
          title: title.trim(),
          description: content.trim() || undefined,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          status: 'todo',
          role: role || 'developer',
        });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        showToast(`Task "${title.trim()}" saved to ${role} board!`, 'success');
      } else {
        await createNote({
          title: title.trim(),
          content: content.trim(),
          role: role || 'developer',
        });
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        showToast(`Note "${title.trim()}" saved to ${role} notes!`, 'success');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isTask = mode === 'task';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isTask ? 'Review & Save as Task' : 'Review & Save as Note'}
      description={
        isTask
          ? 'Review this AI recommendation and add it directly to your task board.'
          : 'Review this AI explanation/documentation and save it to your workspace notes.'
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Badge variant="default" size="sm" className="capitalize text-3xs font-mono">
            Target: {role} workspace
          </Badge>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="!bg-orange-500 hover:!bg-orange-600 text-white font-bold"
              icon={isTask ? <CheckSquare className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            >
              {isSaving ? 'Saving...' : isTask ? 'Save Task' : 'Save Note'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label={isTask ? 'Task Title' : 'Note Title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isTask ? 'e.g. Implement React memoization' : 'e.g. React Performance Notes'}
          required
          autoFocus
        />

        {isTask && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Select
                label="Priority"
                value={priority}
                onValueChange={(val) => setPriority(val as TaskPriority)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Due Date (Optional)
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500/60"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text-secondary">
            {isTask ? 'Task Description / Steps' : 'Note Content (Markdown)'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full bg-bg-base border border-border-base rounded-xl p-3 text-xs text-text-primary font-mono focus:outline-none focus:border-orange-500/60 leading-relaxed resize-y"
            placeholder={isTask ? 'Add details or steps...' : 'Note content...'}
          />
        </div>
      </form>
    </Modal>
  );
}
