import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'milestone' | 'ai' | 'schedule' | 'task';
  link?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Milestone Review Upcoming',
    message: 'Phase 1 deliverable review is scheduled for this week. Check your roadmap.',
    timestamp: '10m ago',
    read: false,
    type: 'milestone',
    link: '/app/student/projects',
  },
  {
    id: 'n-2',
    title: 'AI Planning Ready',
    message: 'Your mentor-grade execution schedule has been synthesized and synced.',
    timestamp: '1h ago',
    read: false,
    type: 'ai',
  },
  {
    id: 'n-3',
    title: 'Daily Deep Work Target',
    message: 'You have completed 1h 45m out of your 2h daily focus target.',
    timestamp: '3h ago',
    read: false,
    type: 'schedule',
  },
];

export function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('mentoros_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Persist notifications
  useEffect(() => {
    try {
      localStorage.setItem('mentoros_notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'milestone':
        return <CheckCircle2 className="w-3.5 h-3.5 text-student-500" />;
      case 'ai':
        return <Sparkles className="w-3.5 h-3.5 text-solar-500" />;
      case 'schedule':
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case 'task':
        return <Clock className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          isOpen && 'bg-bg-elevated text-text-primary'
        )}
        aria-label="View notifications"
        aria-expanded={isOpen}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-bg-surface animate-pulse" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-bg-surface border border-border-base/90 dark:border-white/[0.08] shadow-xl backdrop-blur-xl z-50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-base/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-bg-elevated/40">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-solar-500" />
              <h3 className="text-xs font-bold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-solar-500/10 text-solar-600 dark:text-solar-400 border border-solar-500/20 font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-3xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-bg-elevated"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3 text-emerald-500" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-3xs text-text-faint hover:text-danger transition-colors p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-bg-elevated"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-text-faint hover:text-text-primary p-1 rounded-lg"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center space-y-2 px-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-bg-elevated text-text-muted flex items-center justify-center mx-auto">
                  <Bell className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-xs font-semibold text-text-primary">You&apos;re all caught up!</p>
                <p className="text-3xs text-text-muted">No new alerts or milestones scheduled.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={cn(
                    'p-3.5 hover:bg-slate-50 dark:hover:bg-bg-elevated/40 transition-colors flex items-start gap-3 cursor-pointer text-left',
                    !item.read && 'bg-solar-500/[0.03] dark:bg-solar-500/[0.05]'
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5 border border-border-base/60">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        'text-xs truncate',
                        item.read ? 'font-medium text-text-secondary' : 'font-bold text-text-primary'
                      )}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-text-faint font-mono shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-2xs text-text-muted leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-3xs font-semibold text-solar-600 dark:text-solar-400 hover:underline pt-1"
                      >
                        <span>View details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-solar-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
