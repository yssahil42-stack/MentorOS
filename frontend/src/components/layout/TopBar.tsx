import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { NotificationDropdown } from './NotificationDropdown';
import type { UserRole } from '../../types/user';
import { getWorkspaceRole } from '../../utils/roleUtils';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const { openProfileModal } = useWorkspace();
  const location = useLocation();

  // Derive page title from last path segment
  const segments = location.pathname.split('/').filter(Boolean);
  const lastSeg = segments[segments.length - 1] ?? 'Dashboard';
  const pageTitle = lastSeg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className={cn(
        'h-14 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-border-base',
        'bg-bg-surface/90 backdrop-blur-md sticky top-0 z-20 transition-colors'
      )}
    >
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-focus text-white px-3 py-1.5 rounded-lg text-sm z-50 shadow-lg"
      >
        Skip to main content
      </a>

      {/* Left: Mobile menu toggle + page title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <h1 className="text-xs md:text-sm font-bold text-text-primary truncate">{pageTitle}</h1>
      </div>

      {/* Center: Search pill bar (as featured in reference screenshot) */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search courses, tasks, or AI actions..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-bg-elevated hover:bg-bg-surface focus:bg-bg-surface border border-border-base rounded-full text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-focus transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ─── Right actions ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Profile Avatar / Icon */}
        <button
          type="button"
          onClick={openProfileModal}
          className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 shadow-2xs hover:bg-orange-500/20 hover:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 transition-all shrink-0 cursor-pointer"
          aria-label={`Open profile window for ${user?.full_name ?? 'user'}`}
          title={`Profile - ${user?.full_name ?? 'User'}`}
        >
          {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
        </button>
      </div>
    </div>
  );
}
