import React from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FolderKanban,
  Calendar,
  CheckSquare,
  FileText,
  TrendingUp,
  Settings,
  Map,
  Package,
  Flag,
  Search,
  Send,
  Briefcase,
  MessageSquare,
  LogOut,
  ChevronRight,
  GraduationCap,
  Code2,
  Layers,
  Bot,
  Clock,
  Receipt,
  FolderGit2,
  Key,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { UserRole } from '../../types/user';
import { getRoleDashboardRoute, getWorkspaceRole } from '../../utils/roleUtils';

// ─── Lucide icon lookup ───────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FolderKanban,
  Calendar,
  CheckSquare,
  FileText,
  TrendingUp,
  Settings,
  Map,
  Package,
  Flag,
  Search,
  Send,
  Briefcase,
  MessageSquare,
  GraduationCap,
  Code2,
  Layers,
  Bot,
  Clock,
  Receipt,
  FolderGit2,
  Key,
  Users,
  Sparkles,
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
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const activeRole = getWorkspaceRole(location.pathname, user.role as UserRole);
  const roleConfig = ROLE_CONFIGS[activeRole];
  const roleColor = roleConfig.color;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col',
        'bg-bg-surface border-r border-border-base',
        'transition-all duration-300 ease-out-expo',
        'overflow-hidden shadow-sm',
        expanded ? 'w-64' : 'w-[76px]'
      )}
      aria-label={`${roleConfig.label} navigation`}
    >
      {/* ─── Logo + Brand ─────────────────────────────────────── */}
      <Link
        to={getRoleDashboardRoute(activeRole)}
        id="sidebar-brand-mentoros"
        className={cn(
          'border-b border-border-base shrink-0 hover:bg-bg-elevated transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus flex items-center',
          expanded ? 'h-16 px-4' : 'h-16 flex-col justify-center px-1 py-1.5 text-center'
        )}
        title="MentorOS - Go to dashboard"
        aria-label="MentorOS Home"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${roleColor}20`, border: `1px solid ${roleColor}40` }}
        >
          <Layers className="h-4.5 w-4.5" style={{ color: roleColor }} aria-hidden="true" />
        </div>
        {expanded ? (
          <div className="ml-3 overflow-hidden">
            <span className="text-sm font-extrabold text-text-primary tracking-tight whitespace-nowrap block">
              MentorOS
            </span>
            <span
              className="block text-2xs font-semibold tracking-wide uppercase whitespace-nowrap truncate"
              style={{ color: roleColor }}
            >
              {roleConfig.label} Workspace
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-text-primary tracking-tight mt-1 leading-none truncate max-w-[68px]">
            MentorOS
          </span>
        )}
      </Link>

      {/* ─── Navigation ───────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar"
        aria-label="Sidebar Sections"
      >
        {expanded && (
          <div className="px-3 pb-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Navigation
            </span>
          </div>
        )}
        <ul className={cn('space-y-1', expanded ? 'px-2' : 'px-1')} role="list">
          {roleConfig.navigation.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex rounded-xl font-medium transition-all duration-150 ease-smooth relative group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-[1px]',
                    expanded
                      ? 'items-center gap-3 h-10 px-3 text-xs'
                      : 'flex-col items-center justify-center py-2 px-1 text-center min-h-[54px] gap-1',
                    isActive
                      ? 'border font-semibold shadow-2xs'
                      : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: `${roleColor}14`,
                        color: roleColor,
                        borderColor: `${roleColor}30`,
                      }
                    : {}
                }
                aria-label={item.label}
                title={item.label}
              >
                <NavIcon
                  name={item.icon}
                  className="shrink-0 transition-transform group-hover:scale-110"
                />
                <span
                  className={cn(
                    'truncate transition-all',
                    expanded
                      ? 'whitespace-nowrap flex-1 text-xs'
                      : 'text-[10px] leading-tight font-medium max-w-[68px] text-center block'
                  )}
                >
                  {item.label}
                </span>
                {item.badge === 'AI' &&
                  (expanded ? (
                    <span className="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs shrink-0">
                      AI
                    </span>
                  ) : (
                    <span className="absolute top-1 right-1 text-[8px] font-black px-1 py-0.2 rounded bg-blue-600 text-white">
                      AI
                    </span>
                  ))}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ─── Bottom: Theme switch + Logout ─────────────────────── */}
      <div className="border-t border-border-base p-2 space-y-1.5 shrink-0 bg-bg-surface/50">
        {/* Theme switcher toggle */}
        <div
          className={cn(
            'flex items-center w-full',
            expanded ? 'justify-between px-1' : 'justify-center'
          )}
        >
          {expanded && (
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Theme
            </span>
          )}
          {expanded ? (
            <ThemeToggle size="sm" variant="expanded" showLabel className="w-full justify-start" />
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <ThemeToggle size="sm" variant="icon" />
              <span className="text-[10px] text-text-muted font-medium mt-1">Theme</span>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex rounded-xl font-medium text-text-muted hover:text-danger hover:bg-danger/10',
            'transition-colors duration-150 active:translate-y-[1px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus w-full',
            expanded
              ? 'items-center gap-2.5 h-10 px-3 text-xs'
              : 'flex-col items-center justify-center py-2 px-1 text-center min-h-[50px] gap-1'
          )}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className={expanded ? 'text-xs' : 'text-[10px] font-medium leading-tight'}>
            Sign out
          </span>
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
          'shadow-sm cursor-pointer'
        )}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={expanded}
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 transition-transform duration-300', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
