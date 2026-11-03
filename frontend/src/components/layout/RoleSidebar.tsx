import React from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList, FolderKanban, Calendar,
  CheckSquare, FileText, TrendingUp, Settings, Map, Package, Flag,
  Search, Send, Briefcase, MessageSquare, LogOut, ChevronRight,
  GraduationCap, Code2, Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { UserRole } from '../../types/user';
import { queryClient } from '../../store/queryClient';
import { getRoleDashboardRoute, getWorkspaceRole } from '../../utils/roleUtils';

// ─── Lucide icon lookup ───────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, BookOpen, ClipboardList, FolderKanban, Calendar,
  CheckSquare, FileText, TrendingUp, Settings, Map, Package, Flag,
  Search, Send, Briefcase, MessageSquare, GraduationCap, Code2, Layers,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Layers;
  return <Icon className={cn('h-4 w-4', className)} aria-hidden="true" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoleSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoleSidebar({ expanded, onToggle }: RoleSidebarProps) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const activeRole = getWorkspaceRole(location.pathname, user.role as UserRole);
  const roleConfig = ROLE_CONFIGS[activeRole];
  const roleColor  = roleConfig.color;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col',
        'bg-bg-surface border-r border-border-base',
        'transition-all duration-400 ease-out-expo',
        'overflow-hidden shadow-sm',
        expanded ? 'w-60' : 'w-16',
      )}
      aria-label={`${roleConfig.label} navigation`}
    >
      {/* ─── Logo + Brand ─────────────────────────────────────── */}
      <Link
        to="/"
        id="sidebar-brand-mentoros"
        className="h-14 flex items-center px-3 border-b border-border-base shrink-0 hover:bg-bg-elevated transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        title="MentorOS - Go to first page"
        aria-label="MentorOS Home"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform"
          style={{ backgroundColor: `${roleColor}20`, border: `1px solid ${roleColor}40` }}
        >
          <Layers className="h-4 w-4" style={{ color: roleColor }} aria-hidden="true" />
        </div>
        {expanded && (
          <div className="ml-3 overflow-hidden">
            <span className="text-sm font-bold text-text-primary whitespace-nowrap">MentorOS</span>
            <span
              className="block text-2xs font-semibold tracking-wide uppercase whitespace-nowrap truncate"
              style={{ color: roleColor }}
            >
              {roleConfig.label}
            </span>
          </div>
        )}
      </Link>

      {/* ─── Navigation ───────────────────────────────────────── */}
      <div className="px-2 pt-2 shrink-0">
        {expanded ? (
          <label className="block text-2xs font-semibold text-text-muted uppercase tracking-wider">
            Workspace
            <select
              aria-label="Switch workspace"
              value={activeRole}
              onChange={(event) => {
                const nextRole = event.target.value as UserRole;
                if (nextRole === activeRole) return;
                localStorage.setItem('mentor_workspace_role', nextRole);
                queryClient.clear();
                navigate(getRoleDashboardRoute(nextRole));
              }}
              className="mt-1 h-9 w-full rounded-lg border border-border-base bg-bg-elevated px-2 text-xs font-medium normal-case tracking-normal text-text-primary"
            >
              {Object.values(ROLE_CONFIGS).map((config) => (
                <option key={config.id} value={config.id}>{config.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-full items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Expand sidebar to switch workspace"
            title="Expand to switch workspace"
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        <ul className="space-y-1 px-2" role="list">
          {roleConfig.navigation.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 h-9 rounded-xl text-sm font-medium',
                    'transition-all duration-150 ease-smooth relative group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                    'active:translate-y-[1px]',
                    expanded ? 'px-2.5' : 'px-2.5 justify-center',
                    isActive
                      ? 'text-text-primary font-semibold translate-y-[1px]'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: `${roleColor}16`,
                        color: roleColor,
                        boxShadow: `inset 3px 0 0 ${roleColor}`,
                      }
                    : {}
                }
                aria-label={!expanded ? item.label : undefined}
                title={!expanded ? item.label : undefined}
              >
                <NavIcon name={item.icon} className="shrink-0 transition-transform" />
                {expanded && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ─── Bottom: Theme switch + Logout ─────────────────────── */}
      <div className="border-t border-border-base p-2 space-y-1 shrink-0">
        {/* Theme switcher toggle */}
        <div className={cn('flex items-center', expanded ? 'justify-between px-1' : 'justify-center')}>
          {expanded && (
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">Theme</span>
          )}
          <ThemeToggle
            size="sm"
            variant={expanded ? 'expanded' : 'icon'}
            showLabel={expanded}
            className="w-full justify-start"
          />
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 h-9 w-full rounded-xl px-2.5 text-sm font-medium',
            'text-text-muted hover:text-danger hover:bg-danger/10',
            'transition-colors duration-150 active:translate-y-[1px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            !expanded && 'justify-center',
          )}
          aria-label={!expanded ? 'Sign out' : undefined}
          title={!expanded ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {expanded && <span>Sign out</span>}
        </button>
      </div>

      {/* ─── Expand / collapse toggle button ──────────────────── */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -right-3 z-40',
          'w-6 h-6 rounded-full bg-bg-surface border border-border-base',
          'flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated',
          'transition-all duration-200 active:translate-y-[1px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          'shadow-sm',
        )}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={expanded}
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 transition-transform duration-300', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
    </aside>
  );
}
