import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Code2,
  Briefcase,
  Target,
  ChevronDown,
  Check,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { UserRole } from '../../types/user';
import { getWorkspaceRole, getRoleDashboardRoute } from '../../utils/roleUtils';
import { cn } from '../../utils/cn';

interface WorkspaceOption {
  role: UserRole;
  label: string;
  tagline: string;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const WORKSPACES: WorkspaceOption[] = [
  {
    role: 'student',
    label: 'Student',
    tagline: 'Study plans, courses & academic projects',
    color: '#3B82F6', // Blue
    icon: GraduationCap,
  },
  {
    role: 'developer',
    label: 'Developer',
    tagline: 'Build roadmaps, milestones & Git repos',
    color: '#10B981', // Emerald
    icon: Code2,
  },
  {
    role: 'freelancer',
    label: 'Freelancer',
    tagline: 'Client deliverables, invoicing & contracts',
    color: '#8B5CF6', // Purple
    icon: Briefcase,
  },
  {
    role: 'job_seeker',
    label: 'Job Seeker',
    tagline: 'Applications, resume builder & interview prep',
    color: '#F59E0B', // Amber
    icon: Target,
  },
];

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useWorkspace();

  const currentRole = getWorkspaceRole(
    location.pathname,
    (user?.role as UserRole) || 'student'
  );

  const activeWorkspace =
    WORKSPACES.find((w) => w.role === currentRole) ?? WORKSPACES[0];
  const ActiveIcon = activeWorkspace.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = (opt: WorkspaceOption) => {
    if (opt.role === currentRole) {
      setIsOpen(false);
      return;
    }
    try {
      localStorage.setItem('mentor_workspace_role', opt.role);
    } catch {
      // ignore
    }
    setIsOpen(false);
    const targetRoute = getRoleDashboardRoute(opt.role);
    showToast(`Switched to ${opt.label} Workspace`, 'info');
    navigate(targetRoute);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold',
          'transition-all duration-150 cursor-pointer shadow-2xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          isOpen
            ? 'bg-bg-elevated border-border-hover shadow-sm'
            : 'bg-bg-surface hover:bg-bg-elevated border-border-base text-text-primary'
        )}
        style={{
          borderLeftColor: activeWorkspace.color,
          borderLeftWidth: '3px',
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Switch Workspace Module"
      >
        <ActiveIcon
          className="w-4 h-4 shrink-0"
          style={{ color: activeWorkspace.color }}
        />
        <span className="hidden sm:inline font-bold text-text-primary">
          {activeWorkspace.label}
        </span>
        <span className="hidden md:inline text-[10px] text-text-muted font-normal">
          Workspace
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-text-muted transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-text-primary'
          )}
        />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80',
            'bg-bg-surface border border-border-base rounded-2xl shadow-xl z-50',
            'overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md'
          )}
          role="listbox"
        >
          <div className="px-3 py-2 border-b border-border-subtle/50 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-solar-500" />
              Switch Workspace Module
            </span>
          </div>

          <div className="space-y-1">
            {WORKSPACES.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.role === currentRole;

              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleSelectWorkspace(opt)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-xl text-left cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-bg-elevated border border-border-hover'
                      : 'hover:bg-bg-elevated/60 border border-transparent'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: `${opt.color}18`,
                        border: `1px solid ${opt.color}35`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: opt.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span
                            className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md"
                            style={{
                              backgroundColor: `${opt.color}20`,
                              color: opt.color,
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {opt.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      className="w-4 h-4 shrink-0 ml-2"
                      style={{ color: opt.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
