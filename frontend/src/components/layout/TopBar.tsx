import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { UserRole } from '../../types/user';
import { getWorkspaceRole } from '../../utils/roleUtils';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user }   = useAuth();
  const { openCaptureModal } = useWorkspace();
  const location   = useLocation();

  const roleConfig = user
    ? ROLE_CONFIGS[getWorkspaceRole(location.pathname, user.role as UserRole)]
    : null;

  // Derive page title from last path segment
  const segments  = location.pathname.split('/').filter(Boolean);
  const lastSeg   = segments[segments.length - 1] ?? 'Dashboard';
  const pageTitle = lastSeg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header
      className={cn(
        'h-14 flex items-center gap-3 px-4 md:px-6 border-b border-border-base',
        'bg-bg-surface/85 backdrop-blur-md sticky top-0 z-20 transition-colors',
      )}
      role="banner"
    >
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-focus text-white px-3 py-1.5 rounded-lg text-sm z-50 shadow-lg"
      >
        Skip to main content
      </a>

      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Page title & Role context */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Link
          to="/"
          className="items-center gap-1 text-xs font-bold text-text-muted hover:text-student-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus rounded px-1 shrink-0 flex"
          title="MentorOS - Go to first page"
        >
          <span>MentorOS</span>
          <span className="text-text-faint font-normal">/</span>
        </Link>
        <h1 className="text-sm md:text-base font-bold text-text-primary truncate">
          {pageTitle}
        </h1>
        {roleConfig && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold tracking-wide uppercase border"
            style={{
              backgroundColor: `${roleConfig.color}15`,
              color: roleConfig.color,
              borderColor: `${roleConfig.color}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: roleConfig.color }}
              aria-hidden="true"
            />
            {roleConfig.label}
          </span>
        )}
      </div>

      {/* ─── Right actions ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <ThemeToggle size="sm" variant="icon" />

        {/* Primary Action: Capture Work (Manual Form Entry) */}
        <button
          onClick={() => openCaptureModal('manual')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold',
            'bg-solar-500 hover:bg-solar-600 text-white shadow-sm',
            'transition-all duration-200 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
          )}
          title="Capture Work - Manual form entry (Ctrl+J)"
          aria-label="Capture Work"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Capture Work</span>
        </button>

        {/* User Profile Avatar */}
        <div
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-bg-elevated to-bg-surface border border-border-base flex items-center justify-center text-xs font-bold text-text-primary shadow-sm hover:border-border-hover transition-colors shrink-0 cursor-default"
          aria-label={`Signed in as ${user?.full_name ?? 'user'}`}
          title={user?.full_name}
        >
          {user?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  );
}
