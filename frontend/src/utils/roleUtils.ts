import type { UserRole } from '../types/user';
import { ROLE_CONFIGS, isRouteAllowedForRole } from '../config/roles';

export { isRouteAllowedForRole };

/** Return the dashboard home route for a role. */
export function getRoleDashboardRoute(role: UserRole): string {
  return `${ROLE_CONFIGS[role].routePrefix}/dashboard`;
}

/** Return a role-specific terminology string. */
export function getTerm(role: UserRole, key: string): string {
  return ROLE_CONFIGS[role]?.terminology?.[key] ?? key;
}

/** Return the Tailwind color class suffix for a role (e.g. 'student'). */
export function getRoleColorClass(role: UserRole): string {
  return ROLE_CONFIGS[role]?.colorClass ?? 'student';
}

/** Given a raw string from the backend, coerce it to UserRole. */
export function parseRole(raw: string | undefined | null): UserRole | null {
  const valid: UserRole[] = ['student', 'freelancer', 'developer', 'job_seeker'];
  if (raw && valid.includes(raw as UserRole)) return raw as UserRole;
  return null;
}

/** Resolve the active workspace from its route, falling back to the account's default role. */
export function getWorkspaceRole(pathname: string, fallback: UserRole): UserRole {
  const routeRole = pathname.split('/')[2]?.replace(/-/g, '_');
  return parseRole(routeRole) ?? fallback;
}

/** Returns the CSS hex color for a role. */
export function getRoleHex(role: UserRole): string {
  return ROLE_CONFIGS[role]?.color ?? '#6366F1';
}

/** Returns human-readable label for a role. */
export function getRoleLabel(role: UserRole): string {
  return ROLE_CONFIGS[role]?.label ?? role;
}
