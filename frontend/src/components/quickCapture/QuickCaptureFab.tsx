import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Plus,
  X,
  ListTodo,
  CheckCircle2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { getWorkspaceRole } from '../../utils/roleUtils';
import { tasksApi } from '../../services/apiClient';
import { queryClient } from '../../store/queryClient';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';
import type { UserRole } from '../../types/user';

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

const DEFAULT_TASKS_BY_ROLE: Record<string, Task[]> = {
  job_seeker: [
    {
      id: 1001,
      user_id: 1,
      role: 'job_seeker',
      title: 'Review target job requirements for Data Analyst',
      status: 'todo',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 1002,
      user_id: 1,
      role: 'job_seeker',
      title: 'Tailor resume keywords and export ATS PDF',
      status: 'todo',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 1003,
      user_id: 1,
      role: 'job_seeker',
      title: 'Send follow-up note to hiring manager',
      status: 'completed',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  developer: [
    {
      id: 2001,
      user_id: 1,
      role: 'developer',
      title: 'Deploy feature branch preview & test API',
      status: 'todo',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  freelancer: [
    {
      id: 3001,
      user_id: 1,
      role: 'freelancer',
      title: 'Draft and send client milestone invoice',
      status: 'todo',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  student: [
    {
      id: 4001,
      user_id: 1,
      role: 'student',
      title: 'Complete 45-min deep work study block',
      status: 'todo',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

const ROLE_SUGGESTIONS: Record<
  string,
  { label: string; priority: TaskPriority; icon: string }[]
> = {
  job_seeker: [
    { label: 'Tailor resume for target job description', priority: 'high', icon: '🎯' },
    { label: 'Send follow-up email for submitted application', priority: 'high', icon: '✉️' },
    { label: 'Connect with 2 hiring managers on LinkedIn', priority: 'medium', icon: '💼' },
    { label: 'Practice 15-min behavioral interview answers', priority: 'high', icon: '🎤' },
    { label: 'Audit missing skills on Job Analyzer', priority: 'medium', icon: '📊' },
  ],
  developer: [
    { label: 'Deploy feature branch preview & test API', priority: 'high', icon: '🚀' },
    { label: 'Write unit tests for recent changes', priority: 'high', icon: '🧪' },
    { label: 'Document system architecture & endpoints', priority: 'medium', icon: '📝' },
    { label: 'Refactor state management in core component', priority: 'medium', icon: '⚡' },
  ],
  freelancer: [
    { label: 'Draft and send client milestone invoice', priority: 'high', icon: '📄' },
    { label: 'Send deliverable progress update to client', priority: 'high', icon: '💬' },
    { label: 'Log billable hours for today', priority: 'medium', icon: '⏱️' },
    { label: 'Follow up on pending project proposal', priority: 'medium', icon: '🎯' },
  ],
  student: [
    { label: 'Complete 45-min deep work study block', priority: 'high', icon: '📚' },
    { label: 'Review lecture notes and summaries', priority: 'medium', icon: '📝' },
    { label: 'Submit upcoming course assignment', priority: 'high', icon: '🎯' },
    { label: 'Revise flashcards and practice problems', priority: 'medium', icon: '💡' },
  ],
};

export function QuickCaptureFab({
  position = 'bottom-right',
  enabled = true,
}: QuickCaptureFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('high');
  const [activeFilter, setActiveFilter] = useState<'todo' | 'completed' | 'all'>('todo');

  const { showToast } = useWorkspace();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const fabRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAuthed = Boolean(user && isAuthenticated !== false);
  const currentRole = user
    ? getWorkspaceRole(location.pathname, user.role as UserRole)
    : 'job_seeker';

  // ─── Query Tasks ────────────────────────────────────────────────────────────
  const { data: rawTasks } = useQuery({
    queryKey: ['tasks', currentRole],
    queryFn: ({ signal }) => tasksApi.get(currentRole, { signal }),
    enabled: isOpen && isAuthed,
  });

  const [localTasks, setLocalTasks] = useState<Task[]>(() => {
    return DEFAULT_TASKS_BY_ROLE[currentRole] || DEFAULT_TASKS_BY_ROLE.job_seeker;
  });

  useEffect(() => {
    if (Array.isArray(rawTasks) && rawTasks.length > 0) {
      setLocalTasks(rawTasks);
    }
  }, [rawTasks]);

  const pendingTasks = localTasks.filter((t) => t.status !== 'completed');
  const completedTasks = localTasks.filter((t) => t.status === 'completed');

  const visibleTasks = localTasks.filter((t) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'todo') return t.status !== 'completed';
    return t.status === 'completed';
  });

  // ─── Mutations & Direct Actions ─────────────────────────────────────────────
  const handleDirectCreate = async (title: string, priority: TaskPriority) => {
    const tempTask: Task = {
      id: Date.now(),
      user_id: user?.id ? Number(user.id) : 1,
      role: currentRole,
      title,
      status: 'todo',
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic local update
    setLocalTasks((prev) => [tempTask, ...prev]);
    setNewTaskTitle('');
    showToast(`Task added: ${title}`, 'success');

    try {
      await tasksApi.create({
        title,
        priority,
        status: 'todo',
        role: currentRole,
        estimated_minutes: 30,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch {
      // Retained in local list
    }
    inputRef.current?.focus();
  };

  const handleToggleTask = async (id: number, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    showToast(
      nextStatus === 'completed' ? 'Task marked completed!' : 'Task active',
      'success'
    );

    try {
      await tasksApi.update(id, { status: nextStatus });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch {
      // Local state is preserved
    }
  };

  const handleDeleteTask = async (id: number) => {
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task removed', 'info');

    try {
      await tasksApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch {
      // Local state is preserved
    }
  };

  // ─── Keyboard Shortcuts & Outside Click ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    handleDirectCreate(newTaskTitle.trim(), selectedPriority);
  };

  // Only render inside the authenticated workspace (/app/*)
  const isWorkspaceRoute = location.pathname.startsWith('/app');

  if (!enabled || !isAuthed || !isWorkspaceRoute) return null;

  const suggestions = ROLE_SUGGESTIONS[currentRole] || ROLE_SUGGESTIONS.job_seeker;
  const taskBoardPath = `/app/${currentRole === 'job_seeker' ? 'job_seeker' : currentRole}/tasks`;

  return (
    <div
      ref={fabRef}
      className={cn('fixed z-50 flex flex-col items-end gap-3', POSITION_CLASSES[position])}
    >
      {/* ─── QUICK TASK FLYOUT PANEL ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Direct Quick Tasks Panel"
          className="w-84 sm:w-96 rounded-2xl bg-bg-surface border border-border-base shadow-glass-xl p-4 sm:p-5 flex flex-col gap-3.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200 text-text-primary"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border-base">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-solar-500/10 text-solar-500 border border-solar-500/20">
                <ListTodo className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Quick Task Manager</h3>
                <p className="text-2xs text-text-muted">
                  Direct task actions without AI redirection
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors"
              aria-label="Close tasks panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Task Input Form */}
          <form onSubmit={handleManualAdd} className="space-y-2">
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter specific task title..."
                className="flex-1 rounded-xl text-xs bg-bg-base border border-border-base px-3 py-2 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500/60"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newTaskTitle.trim()}
                className="bg-solar-500 hover:bg-solar-600 text-white font-bold px-3 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Priority Selector Pills */}
            <div className="flex items-center justify-between text-2xs pt-0.5">
              <span className="text-text-muted font-medium">Priority:</span>
              <div className="flex items-center gap-1">
                {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPriority(p)}
                    className={`px-2 py-0.5 rounded-lg font-bold capitalize transition-all ${
                      selectedPriority === p
                        ? p === 'high'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                          : p === 'medium'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-text-muted hover:text-text-primary bg-bg-base'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Curated Suggested Tasks ("Give Tasks") */}
          <div className="space-y-1.5 pt-1 border-t border-border-base">
            <div className="flex items-center justify-between text-2xs font-semibold text-text-muted">
              <span>Suggested Career Tasks:</span>
              <span className="text-solar-500 font-bold">1-Click Add</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-0.5">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDirectCreate(item.label, item.priority)}
                  className="w-full text-left p-1.5 rounded-xl border border-border-base bg-bg-base/70 hover:bg-solar-500/10 hover:border-solar-500/30 text-xs transition-colors flex items-center justify-between group"
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span className="text-xs">{item.icon}</span>
                    <span className="text-2xs text-text-primary group-hover:text-solar-500">
                      {item.label}
                    </span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-text-muted group-hover:text-solar-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Tasks Checklist */}
          <div className="space-y-2 pt-1 border-t border-border-base">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-text-muted">
                Your Tasks ({pendingTasks.length} pending)
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveFilter('todo')}
                  className={`px-1.5 py-0.5 rounded ${
                    activeFilter === 'todo'
                      ? 'bg-solar-500 text-white font-bold'
                      : 'text-text-muted'
                  }`}
                >
                  To Do
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('completed')}
                  className={`px-1.5 py-0.5 rounded ${
                    activeFilter === 'completed'
                      ? 'bg-solar-500 text-white font-bold'
                      : 'text-text-muted'
                  }`}
                >
                  Done ({completedTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-1.5 py-0.5 rounded ${
                    activeFilter === 'all'
                      ? 'bg-solar-500 text-white font-bold'
                      : 'text-text-muted'
                  }`}
                >
                  All ({localTasks.length})
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {visibleTasks.length === 0 ? (
                <div className="p-3 text-center text-2xs text-text-faint rounded-xl bg-bg-base border border-dashed border-border-base">
                  {activeFilter === 'completed'
                    ? 'No completed tasks yet.'
                    : 'No pending tasks. Pick a suggestion above!'}
                </div>
              ) : (
                visibleTasks.map((t) => {
                  const isDone = t.status === 'completed';
                  return (
                    <div
                      key={t.id}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                        isDone
                          ? 'bg-bg-base/40 border-border-base/50 opacity-60'
                          : 'bg-bg-base border-border-base'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(t.id, t.status)}
                          className="shrink-0 text-text-muted hover:text-emerald-500 transition-colors"
                          title={isDone ? 'Mark as to-do' : 'Mark as done'}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              isDone ? 'text-emerald-500 fill-emerald-500/20' : 'text-text-muted'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-2xs truncate ${
                            isDone ? 'line-through text-text-muted' : 'text-text-primary font-medium'
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-text-faint hover:text-red-500 transition-colors p-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Direct Navigation */}
          <div className="pt-2 border-t border-border-base flex items-center justify-between text-2xs">
            <span className="text-text-faint">Shortcut: Ctrl+K</span>
            <Link
              to={taskBoardPath}
              onClick={() => setIsOpen(false)}
              className="text-solar-500 hover:text-solar-400 font-bold flex items-center gap-1 transition-colors"
            >
              <span>Open Full Task Board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* ─── MAIN ORANGE FLOATING ACTION BUTTON ──────────────────────────────── */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isOpen ? 'Close tasks panel' : 'Open quick task manager (Ctrl+K)'}
        className={cn(
          'w-14 h-14 rounded-2xl shadow-glass-lg flex items-center justify-center',
          'transition-all duration-300 ease-spring',
          'hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
          'bg-solar-500 text-white hover:bg-solar-600',
          isOpen && 'rotate-45 bg-solar-600'
        )}
        size="lg"
        variant="primary"
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <Plus className="w-6 h-6" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
