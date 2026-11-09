import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  Calendar,
  FileText,
  Settings,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Compass,
  Sun,
  Moon,
  Laptop,
  User,
  GraduationCap,
  Code2,
  Briefcase,
  Target,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROLE_CONFIGS } from '../../config/roles';
import { cn } from '../../utils/cn';
import { getWorkspaceRole } from '../../utils/roleUtils';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'AI Prompts' | 'Switch Role' | 'Theme';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, openAIDrawer, openProfileModal } =
    useWorkspace();
  const { user } = useAuth();
  const { resolvedTheme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const role = getWorkspaceRole(location.pathname, user?.role || 'developer');
  const roleConfig = ROLE_CONFIGS[role];

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Build command items list
  const commands: CommandItem[] = [
    // AI Actions
    {
      id: 'ai-open',
      category: 'AI Prompts',
      title: 'Open AI Assistant Drawer',
      subtitle: 'Plan tasks, milestones, or roadmaps with AI',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        closeCommandPalette();
        openAIDrawer();
      },
    },
    ...(roleConfig?.aiTemplates || []).map((t) => ({
      id: `ai-${t.id}`,
      category: 'AI Prompts' as const,
      title: t.label,
      subtitle: t.promptStarter,
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        closeCommandPalette();
        openAIDrawer(t.promptStarter);
      },
    })),

    // Navigation for current role
    ...(roleConfig?.navigation || []).map((nav) => ({
      id: `nav-${nav.to}`,
      category: 'Navigation' as const,
      title: nav.label,
      subtitle: nav.to,
      icon: <Compass className="w-4 h-4 text-orange-500 dark:text-orange-400" />,
      action: () => {
        closeCommandPalette();
        navigate(nav.to);
      },
    })),

    // Quick Actions
    {
      id: 'act-task',
      category: 'Actions',
      title: 'Create New Task',
      subtitle: 'Add task to current board',
      icon: <Plus className="w-4 h-4 text-cyan-400" />,
      action: () => {
        closeCommandPalette();
        navigate(`/app/${role}/tasks`);
      },
    },
    {
      id: 'act-proj',
      category: 'Actions',
      title: 'Create New Project',
      subtitle: 'Start a new project workspace',
      icon: <Plus className="w-4 h-4 text-amber-400" />,
      action: () => {
        closeCommandPalette();
        navigate(`/app/${role}/projects`);
      },
    },
    {
      id: 'act-note',
      category: 'Actions',
      title: 'Create Engineering Note',
      subtitle: 'Capture architecture decision or snippet',
      icon: <Plus className="w-4 h-4 text-purple-400" />,
      action: () => {
        closeCommandPalette();
        navigate(`/app/${role}/notes`);
      },
    },
    {
      id: 'act-profile',
      category: 'Actions',
      title: 'Open User Profile',
      subtitle: 'View account details, session status, and workspace context',
      icon: <User className="w-4 h-4 text-orange-500" />,
      action: () => {
        closeCommandPalette();
        openProfileModal();
      },
    },

    // Appearance & Themes
    {
      id: 'theme-toggle',
      category: 'Theme',
      title: `Toggle Theme (Currently ${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`,
      subtitle: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`,
      icon:
        resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" />
        ),
      action: () => {
        closeCommandPalette();
        toggleTheme();
      },
    },
    {
      id: 'theme-dark',
      category: 'Theme',
      title: 'Switch to Dark Mode',
      subtitle: 'Obsidian dark theme with neon accents',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        closeCommandPalette();
        setTheme('dark');
      },
    },
    {
      id: 'theme-light',
      category: 'Theme',
      title: 'Switch to Light Mode',
      subtitle: 'Crisp clean theme with soft shadows',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      action: () => {
        closeCommandPalette();
        setTheme('light');
      },
    },
    {
      id: 'theme-system',
      category: 'Theme',
      title: 'Use System Preference',
      subtitle: 'Automatically synchronize with OS dark/light mode',
      icon: <Laptop className="w-4 h-4 text-cyan-400" />,
      action: () => {
        closeCommandPalette();
        setTheme('system');
      },
    },
    // Switch Workspaces
    {
      id: 'switch-student',
      category: 'Switch Role',
      title: 'Switch to Student Workspace',
      subtitle: 'Study plans, courses & academic projects',
      icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
      action: () => {
        closeCommandPalette();
        localStorage.setItem('mentor_workspace_role', 'student');
        navigate('/app/student/dashboard');
      },
    },
    {
      id: 'switch-developer',
      category: 'Switch Role',
      title: 'Switch to Developer Workspace',
      subtitle: 'Build roadmaps, milestones & Git repos',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      action: () => {
        closeCommandPalette();
        localStorage.setItem('mentor_workspace_role', 'developer');
        navigate('/app/developer/dashboard');
      },
    },
    {
      id: 'switch-freelancer',
      category: 'Switch Role',
      title: 'Switch to Freelancer Workspace',
      subtitle: 'Client deliverables, invoicing & contracts',
      icon: <Briefcase className="w-4 h-4 text-purple-400" />,
      action: () => {
        closeCommandPalette();
        localStorage.setItem('mentor_workspace_role', 'freelancer');
        navigate('/app/freelancer/dashboard');
      },
    },
    {
      id: 'switch-job-seeker',
      category: 'Switch Role',
      title: 'Switch to Job Seeker Workspace',
      subtitle: 'Applications, resume builder & interview prep',
      icon: <Target className="w-4 h-4 text-amber-400" />,
      action: () => {
        closeCommandPalette();
        localStorage.setItem('mentor_workspace_role', 'job_seeker');
        navigate('/app/job-seeker/dashboard');
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filtered, selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeCommandPalette}
        aria-hidden="true"
      />

      {/* Palette dialog */}
      <div className="relative w-full max-w-xl bg-bg-surface border border-border-hover rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search input */}
        <div className="flex items-center px-4 py-3.5 border-b border-border-base bg-bg-elevated/40 gap-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search pages, or trigger AI..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-faint focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-surface border border-border-base rounded shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No matching commands found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-colors',
                    isSelected
                      ? 'bg-bg-elevated text-text-primary border border-border-hover'
                      : 'text-text-secondary hover:bg-bg-elevated/50 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-bg-surface border border-border-base">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-text-muted truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-bg-surface text-text-faint border border-border-base">
                      {item.category}
                    </span>
                    <ArrowRight
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-transparent'
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border-base bg-bg-elevated/30 flex items-center justify-between text-[11px] text-text-faint">
          <div className="flex items-center gap-2">
            <span>
              Navigate <kbd className="font-mono">↑↓</kbd>
            </span>
            <span>•</span>
            <span>
              Select <kbd className="font-mono">↵</kbd>
            </span>
          </div>
          <span>MentorOS Global Command</span>
        </div>
      </div>
    </div>
  );
}
