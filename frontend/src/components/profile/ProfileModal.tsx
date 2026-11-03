import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ROLE_CONFIGS } from '../../config/roles';
import type { UserRole } from '../../types/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const { showToast } = useWorkspace();
  const navigate = useNavigate();

  if (!user) return null;

  const role = (user.role as UserRole) || 'student';
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.student;

  const getRoleIcon = () => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'developer':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'freelancer':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'job_seeker':
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Member';

  const profileData = (user.profile_data as Record<string, unknown>) || {};

  const handleGoToSettings = () => {
    onClose();
    const route = role === 'job_seeker' ? '/app/job-seeker/settings' : `/app/${role}/settings`;
    navigate(route);
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
    showToast('Signed out successfully', 'info');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" size="md">
      <div className="space-y-4">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg-elevated/70 border border-border-base shadow-2xs">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0 ring-4 ring-bg-surface"
            style={{ backgroundColor: roleConfig.color }}
          >
            {user.full_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-text-primary truncate">{user.full_name}</h3>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider text-white shadow-2xs"
                style={{ backgroundColor: roleConfig.color }}
              >
                {getRoleIcon()}
                <span>{roleConfig.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-3xs text-text-faint font-mono mt-0.5">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Joined {memberSince}</span>
              <span className="mx-1">•</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Profile Attributes */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-bg-surface border border-border-base space-y-1">
            <span className="text-3xs uppercase font-mono font-bold text-text-muted block">
              Workspace Role
            </span>
            <span className="font-semibold text-text-primary block">{roleConfig.label}</span>
          </div>
          <div className="p-3 rounded-xl bg-bg-surface border border-border-base space-y-1">
            <span className="text-3xs uppercase font-mono font-bold text-text-muted block">
              Account ID
            </span>
            <span className="font-mono font-semibold text-text-primary block">USR-{user.id}</span>
          </div>
        </div>

        {/* Dynamic Profile Context (if available) */}
        {(Boolean(profileData.program) ||
          Boolean(profileData.primary_goal) ||
          Boolean(profileData.target_role)) && (
          <div className="p-3 rounded-xl bg-bg-surface border border-border-base text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-3xs font-mono font-bold uppercase tracking-wider text-text-muted">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>Context &amp; Goals</span>
            </div>
            {Boolean(profileData.program) && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Program: </span>
                {String(profileData.program)}
              </p>
            )}
            {Boolean(profileData.primary_goal) && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Goal: </span>
                {String(profileData.primary_goal).replace(/_/g, ' ')}
              </p>
            )}
            {Boolean(profileData.target_role) && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Target: </span>
                {String(profileData.target_role)}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border-base flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-danger hover:text-danger hover:bg-danger/10 text-xs"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGoToSettings}
              className="text-xs"
              leftIcon={<Settings className="w-3.5 h-3.5" />}
            >
              Settings
            </Button>
            <Button variant="primary" size="sm" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
