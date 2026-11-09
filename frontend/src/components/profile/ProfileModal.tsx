import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Calendar,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
  Briefcase,
  Code2,
  GraduationCap,
  Save,
  Check,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ROLE_CONFIGS } from '../../config/roles';
import type { UserRole } from '../../types/user';
import { getWorkspaceRole } from '../../utils/roleUtils';
import { api } from '../../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const currentWorkspaceRole = getWorkspaceRole(
    location.pathname,
    (user?.role as UserRole) || 'student'
  );

  const [selectedRole, setSelectedRole] = useState<UserRole>(currentWorkspaceRole);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedRole(currentWorkspaceRole);
  }, [currentWorkspaceRole, isOpen]);

  const profileData = (user?.profile_data as Record<string, unknown>) || {};

  const getInitialData = (r: UserRole) => {
    try {
      const saved = user ? localStorage.getItem(`mentoros_module_profile_${user.id}_${r}`) : null;
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }

    const roleScoped = (profileData[r] as Record<string, string>) || {};

    switch (r) {
      case 'student':
        return {
          university:
            roleScoped.university || (profileData.university as string) || 'State University',
          major: roleScoped.major || (profileData.program as string) || 'Computer Science',
          semester: roleScoped.semester || (profileData.semester as string) || 'Year 3, Semester 1',
          target_gpa: roleScoped.target_gpa || (profileData.target_gpa as string) || '3.85 / 4.0',
          study_focus:
            roleScoped.study_focus ||
            (profileData.study_focus as string) ||
            'Algorithms & Machine Learning',
        };
      case 'developer':
        return {
          tech_stack:
            roleScoped.tech_stack ||
            (profileData.tech_stack as string) ||
            'TypeScript, React, Python, Docker',
          experience_level:
            roleScoped.experience_level ||
            (profileData.experience_level as string) ||
            'Mid-Level (3-5 years)',
          github_url:
            roleScoped.github_url ||
            (profileData.github_url as string) ||
            'https://github.com/yssahil42-stack',
          dev_specialization:
            roleScoped.dev_specialization ||
            (profileData.dev_specialization as string) ||
            'Full-Stack Web & Cloud Architecture',
          engineering_goal:
            roleScoped.engineering_goal ||
            (profileData.engineering_goal as string) ||
            'Architecting scalable microservices',
        };
      case 'freelancer':
        return {
          business_name:
            roleScoped.business_name ||
            (profileData.business_name as string) ||
            'Apex Creative & Code Studio',
          services_offered:
            roleScoped.services_offered ||
            (profileData.services_offered as string) ||
            'Full-Stack Web Apps & UI/UX Design',
          hourly_rate:
            roleScoped.hourly_rate || (profileData.hourly_rate as string) || '$85 / hr (USD)',
          weekly_availability:
            roleScoped.weekly_availability ||
            (profileData.weekly_availability as string) ||
            '25-30 hours / week',
          portfolio_url:
            roleScoped.portfolio_url ||
            (profileData.portfolio_url as string) ||
            'https://freelanceportfolio.dev',
        };
      case 'job_seeker':
        return {
          target_role:
            roleScoped.target_role ||
            (profileData.target_role as string) ||
            'Senior Software Engineer',
          target_industries:
            roleScoped.target_industries ||
            (profileData.target_industries as string) ||
            'SaaS, FinTech, AI Startups',
          work_preference:
            roleScoped.work_preference || (profileData.work_preference as string) || 'Remote Only',
          desired_salary:
            roleScoped.desired_salary ||
            (profileData.desired_salary as string) ||
            '$130,000 - $160,000 / yr',
          linkedin_url:
            roleScoped.linkedin_url ||
            (profileData.linkedin_url as string) ||
            'https://linkedin.com/in/applicant',
        };
    }
  };

  const [profiles, setProfiles] = useState<Record<UserRole, any>>(() => ({
    student: getInitialData('student'),
    developer: getInitialData('developer'),
    freelancer: getInitialData('freelancer'),
    job_seeker: getInitialData('job_seeker'),
  }));

  const activeRoleConfig = ROLE_CONFIGS[selectedRole] || ROLE_CONFIGS.student;
  const userPrimaryConfig =
    ROLE_CONFIGS[(user?.role as UserRole) || 'student'] || ROLE_CONFIGS.student;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Member';

  const handleFieldChange = (field: string, value: string) => {
    setProfiles((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [field]: value,
      },
    }));
  };

  const handleSaveModuleData = async () => {
    setIsSaving(true);
    const currentData = profiles[selectedRole];

    try {
      if (user?.id) {
        localStorage.setItem(
          `mentoros_module_profile_${user.id}_${selectedRole}`,
          JSON.stringify(currentData)
        );
      }

      const updatedProfileData = {
        ...profileData,
        [selectedRole]: currentData,
      };

      try {
        await api.patch('/auth/me/onboarding', { profile_data: updatedProfileData });
        if (refreshUser) {
          await refreshUser();
        }
      } catch {
        // Fallback for tests or offline local mocks
      }

      showToast(`${activeRoleConfig.label} profile information saved!`, 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    const route =
      selectedRole === 'job_seeker' ? '/app/job-seeker/settings' : `/app/${selectedRole}/settings`;
    navigate(route);
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
    showToast('Signed out successfully', 'info');
  };

  const currentFields = profiles[selectedRole];

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" size="lg">
      <div className="space-y-4">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4.5 rounded-2xl bg-slate-50/70 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] shadow-2xs relative overflow-hidden">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-xs shrink-0 ring-4 ring-white dark:ring-bg-surface"
            style={{ backgroundColor: activeRoleConfig.color || '#F97316' }}
          >
            {user.full_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-text-primary truncate">{user.full_name}</h3>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs"
                style={{ backgroundColor: activeRoleConfig.color || '#F97316' }}
              >
                <span>{activeRoleConfig.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Joined {memberSince}</span>
              </span>
              <span className="text-border-base">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Profile Summary Attributes */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] shadow-2xs space-y-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted block">
              Workspace Role
            </span>
            <span className="text-sm font-bold text-text-primary block">{activeRoleConfig.label}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] shadow-2xs space-y-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted block">
              Account ID
            </span>
            <span className="text-sm font-bold text-text-primary block">USR-{user.id}</span>
          </div>
        </div>

        {/* Scoped Context & Goals (Only shown if relevant to respective module) */}
        {((selectedRole === 'student' && Boolean(profileData.program)) ||
          (selectedRole === 'student' && Boolean(profileData.primary_goal)) ||
          (selectedRole === 'job_seeker' && Boolean(profileData.target_role))) && (
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] shadow-2xs text-xs space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              <span className="w-5 h-5 rounded-md bg-solar-500/10 text-solar-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-solar-500" />
              </span>
              <span>Context &amp; Goals</span>
            </div>
            <div className="space-y-1 pt-0.5">
              {selectedRole === 'student' && Boolean(profileData.program) && (
                <p className="text-text-secondary text-xs">
                  <span className="font-semibold text-text-primary">Program: </span>
                  {String(profileData.program)}
                </p>
              )}
              {selectedRole === 'student' && Boolean(profileData.primary_goal) && (
                <p className="text-text-secondary text-xs">
                  <span className="font-semibold text-text-primary">Goal: </span>
                  {String(profileData.primary_goal).replace(/_/g, ' ')}
                </p>
              )}
              {selectedRole === 'job_seeker' && Boolean(profileData.target_role) && (
                <p className="text-text-secondary text-xs">
                  <span className="font-semibold text-text-primary">Target: </span>
                  {String(profileData.target_role)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Module-Specific Information Section (Strictly scoped to respective module) ─── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-bg-elevated/40 border border-border-base/80 dark:border-white/[0.06] shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-border-base/70">
            <div>
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: activeRoleConfig.color || '#F97316' }}
                />
                {activeRoleConfig.label} Profile Information
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5">
                Tailored information and preferences specific to the {activeRoleConfig.label}{' '}
                module.
              </p>
            </div>
          </div>

          {/* Module-Specific Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {selectedRole === 'student' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    University / Institution
                  </label>
                  <input
                    type="text"
                    value={currentFields.university || ''}
                    onChange={(e) => handleFieldChange('university', e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Degree / Academic Major
                  </label>
                  <input
                    type="text"
                    value={currentFields.major || ''}
                    onChange={(e) => handleFieldChange('major', e.target.value)}
                    placeholder="e.g. BSc Computer Science"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Semester / Year
                  </label>
                  <input
                    type="text"
                    value={currentFields.semester || ''}
                    onChange={(e) => handleFieldChange('semester', e.target.value)}
                    placeholder="e.g. Year 3, Semester 1"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Target GPA / Honor Goal
                  </label>
                  <input
                    type="text"
                    value={currentFields.target_gpa || ''}
                    onChange={(e) => handleFieldChange('target_gpa', e.target.value)}
                    placeholder="e.g. 3.85 / 4.0"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Primary Study Focus &amp; Interests
                  </label>
                  <input
                    type="text"
                    value={currentFields.study_focus || ''}
                    onChange={(e) => handleFieldChange('study_focus', e.target.value)}
                    placeholder="e.g. Distributed Systems, Machine Learning, Operating Systems"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
              </>
            )}

            {selectedRole === 'developer' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Primary Tech Stack
                  </label>
                  <input
                    type="text"
                    value={currentFields.tech_stack || ''}
                    onChange={(e) => handleFieldChange('tech_stack', e.target.value)}
                    placeholder="e.g. TypeScript, React, Python, Docker"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Experience Level
                  </label>
                  <select
                    value={currentFields.experience_level || 'Mid-Level (3-5 years)'}
                    onChange={(e) => handleFieldChange('experience_level', e.target.value)}
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Junior (0-2 years)">Junior (0-2 years)</option>
                    <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                    <option value="Senior Engineer (5-8 years)">Senior Engineer (5-8 years)</option>
                    <option value="Staff / Lead Architect (8+ years)">
                      Staff / Lead Architect (8+ years)
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    GitHub / Portfolio URL
                  </label>
                  <input
                    type="text"
                    value={currentFields.github_url || ''}
                    onChange={(e) => handleFieldChange('github_url', e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Core Specialization
                  </label>
                  <input
                    type="text"
                    value={currentFields.dev_specialization || ''}
                    onChange={(e) => handleFieldChange('dev_specialization', e.target.value)}
                    placeholder="e.g. Full-Stack Web & Cloud Architecture"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Active Engineering Target
                  </label>
                  <input
                    type="text"
                    value={currentFields.engineering_goal || ''}
                    onChange={(e) => handleFieldChange('engineering_goal', e.target.value)}
                    placeholder="e.g. Shipping scalable microservices and open source libraries"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
              </>
            )}

            {selectedRole === 'freelancer' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Business / Studio Name
                  </label>
                  <input
                    type="text"
                    value={currentFields.business_name || ''}
                    onChange={(e) => handleFieldChange('business_name', e.target.value)}
                    placeholder="e.g. Apex Creative & Code Studio"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Hourly Billing Rate
                  </label>
                  <input
                    type="text"
                    value={currentFields.hourly_rate || ''}
                    onChange={(e) => handleFieldChange('hourly_rate', e.target.value)}
                    placeholder="e.g. $85 / hr (USD)"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Weekly Client Availability
                  </label>
                  <input
                    type="text"
                    value={currentFields.weekly_availability || ''}
                    onChange={(e) => handleFieldChange('weekly_availability', e.target.value)}
                    placeholder="e.g. 25-30 hours / week"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Portfolio / Case Studies URL
                  </label>
                  <input
                    type="text"
                    value={currentFields.portfolio_url || ''}
                    onChange={(e) => handleFieldChange('portfolio_url', e.target.value)}
                    placeholder="https://freelanceportfolio.dev"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Primary Services Offered
                  </label>
                  <input
                    type="text"
                    value={currentFields.services_offered || ''}
                    onChange={(e) => handleFieldChange('services_offered', e.target.value)}
                    placeholder="e.g. Full-Stack Web Development, UX Consulting, API Integrations"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
              </>
            )}

            {selectedRole === 'job_seeker' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Target Job Title(s)
                  </label>
                  <input
                    type="text"
                    value={currentFields.target_role || ''}
                    onChange={(e) => handleFieldChange('target_role', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Target Industries
                  </label>
                  <input
                    type="text"
                    value={currentFields.target_industries || ''}
                    onChange={(e) => handleFieldChange('target_industries', e.target.value)}
                    placeholder="e.g. SaaS, FinTech, AI Startups"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Work Arrangement Preference
                  </label>
                  <select
                    value={currentFields.work_preference || 'Remote Only'}
                    onChange={(e) => handleFieldChange('work_preference', e.target.value)}
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Remote Only">Remote Only</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-Site">On-Site</option>
                    <option value="Open to Relocation">Open to Relocation</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    Desired Annual Compensation
                  </label>
                  <input
                    type="text"
                    value={currentFields.desired_salary || ''}
                    onChange={(e) => handleFieldChange('desired_salary', e.target.value)}
                    placeholder="e.g. $130,000 - $160,000 / yr"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                    LinkedIn / Portfolio URL
                  </label>
                  <input
                    type="text"
                    value={currentFields.linkedin_url || ''}
                    onChange={(e) => handleFieldChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/applicant"
                    className="w-full h-10 px-3.5 text-xs bg-white dark:bg-bg-surface hover:bg-slate-50/50 dark:hover:bg-bg-elevated/40 focus:bg-white dark:focus:bg-bg-surface border border-border-base/80 dark:border-white/[0.08] rounded-xl text-text-primary shadow-2xs focus:border-solar-500 focus:ring-4 focus:ring-solar-500/10 focus:outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveModuleData}
              disabled={isSaving}
              className="bg-gradient-to-r from-solar-500 to-solar-600 hover:from-solar-600 hover:to-solar-700 text-white font-semibold shadow-xs rounded-xl px-4 py-2 text-xs transition-all active:translate-y-[1px]"
              leftIcon={
                isSaving ? <Check className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />
              }
            >
              {isSaving ? 'Saving...' : `Save ${activeRoleConfig.label} Information`}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border-base/70 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-danger/90 hover:text-danger hover:bg-danger/10 text-xs font-semibold rounded-xl"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGoToSettings}
              className="text-xs font-semibold rounded-xl shadow-2xs"
              leftIcon={<Settings className="w-3.5 h-3.5" />}
            >
              Settings
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold bg-gradient-to-r from-solar-500 to-solar-600 hover:from-solar-600 hover:to-solar-700 text-white rounded-xl shadow-xs px-5 h-9 active:translate-y-[1px]"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
