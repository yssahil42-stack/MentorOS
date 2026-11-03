import type { UserRole } from '../../types/user';
import type { RoleConfig } from './types';
import { studentConfig } from './student';
import { freelancerConfig } from './freelancer';
import { developerConfig } from './developer';
import { jobSeekerConfig } from './jobSeeker';

export * from './types';
export { studentConfig } from './student';
export { freelancerConfig } from './freelancer';
export { developerConfig } from './developer';
export { jobSeekerConfig } from './jobSeeker';

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: studentConfig,
  freelancer: freelancerConfig,
  developer: developerConfig,
  job_seeker: jobSeekerConfig,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

export function getTerm(role: UserRole, key: string): string {
  return ROLE_CONFIGS[role].terminology[key] ?? key;
}

export function getRoleColor(role: UserRole): string {
  return ROLE_CONFIGS[role].color;
}

export function getRoleRoutePrefix(role: UserRole): string {
  return ROLE_CONFIGS[role].routePrefix;
}

export function isRouteAllowedForRole(role: UserRole, pathname: string): boolean {
  const prefix = ROLE_CONFIGS[role].routePrefix;
  return (
    pathname.startsWith(prefix) || pathname === '/app/settings' || pathname === '/app/unauthorized'
  );
}

export const ALL_ROLES: UserRole[] = ['student', 'freelancer', 'developer', 'job_seeker'];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  freelancer: 'Freelancer',
  developer: 'Developer',
  job_seeker: 'Job Seeker',
};
