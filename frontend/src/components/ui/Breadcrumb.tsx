import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIGS, type RoleConfig } from '../../config/roles';
import { getWorkspaceRole } from '../../utils/roleUtils';
import type { UserRole } from '../../types/user';
import { cn } from '../../utils/cn';

export interface BreadcrumbProps {
  roleConfig?: RoleConfig;
  className?: string;
  variant?: 'default' | 'outline';
}

function formatSegmentLabel(segment: string): string {
  if (!segment) return '';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumb({ roleConfig, className, variant = 'default' }: BreadcrumbProps) {
  const location = useLocation();
  const { user } = useAuth();

  // Resolve roleConfig from prop or infer from active route / user role
  const resolvedRoleConfig =
    roleConfig ??
    (user ? ROLE_CONFIGS[getWorkspaceRole(location.pathname, user.role as UserRole)] : undefined);

  const homeRoute = resolvedRoleConfig?.routePrefix
    ? `${resolvedRoleConfig.routePrefix}/dashboard`
    : '/app';

  const moduleLabel = resolvedRoleConfig?.label ?? 'Workspace';
  const moduleRoute = homeRoute;

  // Determine current Page title by checking roleConfig.navigation items
  const matchedNav = resolvedRoleConfig?.navigation.find((item) => item.to === location.pathname);

  let pageLabel = matchedNav?.label;

  if (!pageLabel) {
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (!lastSegment || lastSegment === resolvedRoleConfig?.id || lastSegment === 'app') {
      pageLabel = 'Dashboard';
    } else {
      pageLabel = formatSegmentLabel(lastSegment);
    }
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center text-xs text-text-muted select-none overflow-x-auto no-scrollbar',
        variant === 'outline' &&
          'border border-border-base bg-bg-surface/80 rounded-xl px-2.5 py-1 shadow-2xs w-fit',
        className
      )}
    >
      <ol className="flex items-center gap-1.5 whitespace-nowrap">
        {/* 1. Home */}
        <li className="flex items-center">
          <Link
            to={homeRoute}
            className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus rounded-sm px-1 py-0.5"
            title="Go to workspace home"
          >
            <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="font-medium">Home</span>
          </Link>
        </li>

        <li aria-hidden="true" className="text-text-muted/50 shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>

        {/* 2. Module */}
        <li className="flex items-center">
          <Link
            to={moduleRoute}
            className="font-medium text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus rounded-sm px-1 py-0.5"
          >
            {moduleLabel}
          </Link>
        </li>

        <li aria-hidden="true" className="text-text-muted/50 shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>

        {/* 3. Page */}
        <li
          aria-current="page"
          className="flex items-center font-semibold text-text-primary px-1 py-0.5"
        >
          <span>{pageLabel}</span>
        </li>
      </ol>
    </nav>
  );
}

export default Breadcrumb;
