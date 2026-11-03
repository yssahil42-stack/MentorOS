import type { UserRole } from '../types/user';
import { ROLE_CONFIGS, isRouteAllowedForRole } from '../config/roles';

export { isRouteAllowedForRole };

export interface SimpleRoleConfig {
  id: UserRole;
  label: string;
  color: string;
  icon?: string;
  routePrefix?: string;
}

const BASE_ROLE_CONFIGS: Record<UserRole, SimpleRoleConfig> = {
  student: {
    id: 'student',
    label: 'Student',
    color: '#6366F1',
    icon: 'GraduationCap',
    routePrefix: '/app/student',
  },
  freelancer: {
    id: 'freelancer',
    label: 'Freelancer',
    color: '#8B5CF6',
    icon: 'Briefcase',
    routePrefix: '/app/freelancer',
  },
  developer: {
    id: 'developer',
    label: 'Developer',
    color: '#06B6D4',
    icon: 'Code2',
    routePrefix: '/app/developer',
  },
  job_seeker: {
    id: 'job_seeker',
    label: 'Job Seeker',
    color: '#10B981',
    icon: 'Search',
    routePrefix: '/app/job-seeker',
  },
};

/** Get role configuration, falling back to student for unknown roles. */
export function getRoleConfig(role: UserRole | string): SimpleRoleConfig {
  const found = BASE_ROLE_CONFIGS[role as UserRole];
  return found ?? BASE_ROLE_CONFIGS.student;
}

/** Returns the color for a role. */
export function getRoleColor(role: UserRole | string): string {
  return getRoleConfig(role).color;
}

/** Returns human-readable label for a role. */
export function getRoleLabel(role: UserRole | string): string {
  return getRoleConfig(role).label;
}

/** Returns icon name for a role. */
export function getRoleIcon(role: UserRole | string): string {
  return getRoleConfig(role).icon ?? 'User';
}

/** Returns route prefix for a role. */
export function getRoutePrefix(role: UserRole | string): string {
  return getRoleConfig(role).routePrefix ?? '/app/student';
}

/** Check if a string is a valid UserRole. */
export function isValidRole(role: string): boolean {
  return ['student', 'freelancer', 'developer', 'job_seeker'].includes(role);
}

/** Returns list of all role configurations. */
export function getAllRoles(): { id: UserRole; label: string; color: string }[] {
  return [
    { id: 'student', label: 'Student', color: '#6366F1' },
    { id: 'freelancer', label: 'Freelancer', color: '#8B5CF6' },
    { id: 'developer', label: 'Developer', color: '#06B6D4' },
    { id: 'job_seeker', label: 'Job Seeker', color: '#10B981' },
  ];
}

/** Parse raw string or route path into UserRole. */
export function parseRole(raw: string | undefined | null): UserRole | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // If path starts with /app/
  const roleSegment = trimmed.startsWith('/app/')
    ? trimmed.replace(/^\/app\//, '').split('/')[0]
    : trimmed.split('/')[0];

  const normalized = roleSegment.replace(/-/g, '_');
  const valid: UserRole[] = ['student', 'freelancer', 'developer', 'job_seeker'];
  if (valid.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }
  return null;
}

/** Extract role from path. */
export function getRoleFromPath(path: string): UserRole | null {
  if (!path || typeof path !== 'string' || !path.startsWith('/app/')) return null;
  return parseRole(path);
}

/** Return the dashboard home route for a role. */
export function getRoleDashboardRoute(role: UserRole): string {
  return `${ROLE_CONFIGS[role]?.routePrefix ?? getRoutePrefix(role)}/dashboard`;
}

/** Return a role-specific terminology string. */
export function getTerm(role: UserRole, key: string): string {
  return ROLE_CONFIGS[role]?.terminology?.[key] ?? key;
}

/** Return the Tailwind color class suffix for a role (e.g. 'student'). */
export function getRoleColorClass(role: UserRole): string {
  return ROLE_CONFIGS[role]?.colorClass ?? 'student';
}

/** Resolve the active workspace from its route, falling back to the account's default role. */
export function getWorkspaceRole(pathname: string, fallback: UserRole): UserRole {
  return parseRole(pathname) ?? fallback;
}

/** Returns the CSS hex color for a role. */
export function getRoleHex(role: UserRole): string {
  return getRoleColor(role);
}
