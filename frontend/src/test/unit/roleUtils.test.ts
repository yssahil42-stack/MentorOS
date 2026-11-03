import { describe, it, expect } from 'vitest';
import {
  getRoleConfig,
  getRoleColor,
  getRoleLabel,
  getRoleIcon,
  getRoutePrefix,
  parseRole,
  isValidRole,
  getAllRoles,
  getRoleFromPath,
} from '../../utils/roleUtils';
import type { UserRole } from '../../types/user';

describe('roleUtils', () => {
  describe('getRoleConfig', () => {
    it('returns config for student role', () => {
      const config = getRoleConfig('student');
      expect(config.id).toBe('student');
      expect(config.label).toBe('Student');
      expect(config.color).toBe('#6366F1');
    });

    it('returns config for freelancer role', () => {
      const config = getRoleConfig('freelancer');
      expect(config.id).toBe('freelancer');
      expect(config.label).toBe('Freelancer');
      expect(config.color).toBe('#8B5CF6');
    });

    it('returns config for developer role', () => {
      const config = getRoleConfig('developer');
      expect(config.id).toBe('developer');
      expect(config.label).toBe('Developer');
      expect(config.color).toBe('#06B6D4');
    });

    it('returns config for job_seeker role', () => {
      const config = getRoleConfig('job_seeker');
      expect(config.id).toBe('job_seeker');
      expect(config.label).toBe('Job Seeker');
      expect(config.color).toBe('#10B981');
    });

    it('returns student config as fallback for unknown role', () => {
      const config = getRoleConfig('unknown' as UserRole);
      expect(config.id).toBe('student');
    });
  });

  describe('getRoleColor', () => {
    it('returns correct color for each role', () => {
      expect(getRoleColor('student')).toBe('#6366F1');
      expect(getRoleColor('freelancer')).toBe('#8B5CF6');
      expect(getRoleColor('developer')).toBe('#06B6D4');
      expect(getRoleColor('job_seeker')).toBe('#10B981');
    });
  });

  describe('getRoleLabel', () => {
    it('returns correct label for each role', () => {
      expect(getRoleLabel('student')).toBe('Student');
      expect(getRoleLabel('freelancer')).toBe('Freelancer');
      expect(getRoleLabel('developer')).toBe('Developer');
      expect(getRoleLabel('job_seeker')).toBe('Job Seeker');
    });
  });

  describe('getRoutePrefix', () => {
    it('returns correct route prefix for each role', () => {
      expect(getRoutePrefix('student')).toBe('/app/student');
      expect(getRoutePrefix('freelancer')).toBe('/app/freelancer');
      expect(getRoutePrefix('developer')).toBe('/app/developer');
      expect(getRoutePrefix('job_seeker')).toBe('/app/job-seeker');
    });
  });

  describe('parseRole', () => {
    it('parses student role correctly', () => {
      expect(parseRole('student')).toBe('student');
      expect(parseRole('/app/student')).toBe('student');
      expect(parseRole('/app/student/dashboard')).toBe('student');
    });

    it('parses freelancer role correctly', () => {
      expect(parseRole('freelancer')).toBe('freelancer');
      expect(parseRole('/app/freelancer')).toBe('freelancer');
    });

    it('parses developer role correctly', () => {
      expect(parseRole('developer')).toBe('developer');
      expect(parseRole('/app/developer')).toBe('developer');
    });

    it('parses job_seeker role correctly', () => {
      expect(parseRole('job_seeker')).toBe('job_seeker');
      expect(parseRole('job-seeker')).toBe('job_seeker');
      expect(parseRole('/app/job-seeker')).toBe('job_seeker');
      expect(parseRole('/app/job-seeker/dashboard')).toBe('job_seeker');
    });

    it('returns null for unknown role', () => {
      expect(parseRole('unknown')).toBeNull();
      expect(parseRole('/app/unknown')).toBeNull();
      expect(parseRole('')).toBeNull();
      expect(parseRole(null)).toBeNull();
      expect(parseRole(undefined)).toBeNull();
    });
  });

  describe('isValidRole', () => {
    it('returns true for valid roles', () => {
      expect(isValidRole('student')).toBe(true);
      expect(isValidRole('freelancer')).toBe(true);
      expect(isValidRole('developer')).toBe(true);
      expect(isValidRole('job_seeker')).toBe(true);
    });

    it('returns false for invalid roles', () => {
      expect(isValidRole('unknown')).toBe(false);
      expect(isValidRole('admin')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });
  });

  describe('getAllRoles', () => {
    it('returns all roles', () => {
      const roles = getAllRoles();
      expect(roles).toHaveLength(4);
      expect(roles.map((r) => r.id)).toEqual(['student', 'freelancer', 'developer', 'job_seeker']);
    });
  });

  describe('getRoleFromPath', () => {
    it('extracts role from path', () => {
      expect(getRoleFromPath('/app/student/dashboard')).toBe('student');
      expect(getRoleFromPath('/app/freelancer/projects')).toBe('freelancer');
      expect(getRoleFromPath('/app/developer/build-plan')).toBe('developer');
      expect(getRoleFromPath('/app/job-seeker/applications')).toBe('job_seeker');
    });

    it('returns null for invalid paths', () => {
      expect(getRoleFromPath('/login')).toBeNull();
      expect(getRoleFromPath('/register')).toBeNull();
      expect(getRoleFromPath('/')).toBeNull();
      expect(getRoleFromPath('')).toBeNull();
    });
  });
});
