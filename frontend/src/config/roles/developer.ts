import type { RoleConfig } from './types';

export const developerConfig: RoleConfig = {
  id: 'developer',
  label: 'Developer',
  labelPlural: 'Developers',
  tagline: 'Turn development goals into shippable milestones and portfolio evidence.',
  color: '#6366F1',
  colorClass: 'developer',
  glowClass: 'shadow-glow-indigo',
  icon: 'Code2',
  routePrefix: '/app/developer',
  allowedRoutes: ['/app/developer'],

  navigation: [
    { to: '/app/developer/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/app/developer/projects', label: 'Repositories', icon: 'FolderGit2' },
    { to: '/app/developer/build-plan', label: 'Build Plan', icon: 'Sparkles', badge: 'AI' },
    { to: '/app/developer/tasks', label: 'Issue Tracker', icon: 'CheckSquare' },
    { to: '/app/developer/notes', label: 'Documentation', icon: 'FileText' },
    { to: '/app/developer/api-keys', label: 'API Keys', icon: 'Key' },
    { to: '/app/developer/calendar', label: 'Calendar', icon: 'Calendar' },
    { to: '/app/developer/settings', label: 'Settings', icon: 'Settings' },
  ],

  onboardingSteps: [
    {
      id: 'skills_project',
      title: 'Your Development Context',
      subtitle: 'Help MentorOS understand your technical focus.',
      fields: [
        {
          name: 'skill_focus',
          label: 'Current Skill Focus',
          type: 'text',
          placeholder: 'e.g. React, Machine Learning, Rust',
          required: true,
        },
        {
          name: 'active_project',
          label: 'Active Software Project',
          type: 'text',
          placeholder: 'e.g. Portfolio Website, CLI Tool, Mobile App',
          required: true,
        },
        {
          name: 'preferred_stack',
          label: 'Preferred Stack / Tools',
          type: 'textarea',
          placeholder: 'e.g. React + TypeScript + FastAPI + PostgreSQL',
        },
      ],
    },
    {
      id: 'time_target',
      title: 'Time & Target',
      subtitle: 'How much time do you have, and what are you aiming to ship?',
      fields: [
        {
          name: 'weekly_build_hours',
          label: 'Weekly Build Time (hours)',
          type: 'number',
          placeholder: '15',
          required: true,
        },
        {
          name: 'target_outcome',
          label: 'Target Outcome',
          type: 'select',
          options: [
            { value: 'portfolio_project', label: 'Complete a portfolio project' },
            { value: 'feature_milestone', label: 'Ship a feature milestone' },
            { value: 'learn_skill', label: 'Solidify a specific skill' },
            { value: 'open_source', label: 'Contribute to open source' },
            { value: 'other', label: 'Something else' },
          ],
          required: true,
        },
        { name: 'target_date', label: 'Target Completion Date', type: 'date' },
      ],
    },
    {
      id: 'goal',
      title: 'Your Build Goal',
      subtitle: 'Describe what you want to achieve in detail.',
      fields: [
        {
          name: 'build_goal',
          label: 'Build Goal',
          type: 'textarea',
          placeholder:
            'e.g. Build and deploy a full-stack portfolio project with auth, CRUD, and AI integration by end of October.',
          required: true,
        },
      ],
    },
  ],

  quickActions: [
    { id: 'new-task', label: 'Add Dev Task', icon: 'Plus', href: '/app/developer/tasks' },
    {
      id: 'ai-build-plan',
      label: 'Generate Build Plan',
      icon: 'Sparkles',
      promptStarter: 'Break my development goal into practical milestones and coding tasks.',
    },
    { id: 'new-note', label: 'Dev Note', icon: 'FileText', href: '/app/developer/notes' },
    {
      id: 'readme-draft',
      label: 'Draft README',
      icon: 'Book',
      promptStarter: 'Draft a professional README outline for my project.',
    },
  ],

  aiTemplates: [
    {
      id: 'build-plan',
      label: 'Build Plan',
      promptStarter: 'Break my development goal into practical milestones and coding tasks.',
      icon: 'Map',
      contextType: 'build_plan',
    },
    {
      id: 'spec',
      label: 'Feature Spec',
      promptStarter: 'Draft a brief specification with milestones for this feature.',
      icon: 'FileCode',
      contextType: 'feature_spec',
    },
    {
      id: 'readme',
      label: 'README Draft',
      promptStarter: 'Draft a professional README outline for my project.',
      icon: 'Book',
      contextType: 'readme_draft',
    },
    {
      id: 'portfolio-desc',
      label: 'Portfolio Summary',
      promptStarter: 'Write a portfolio project summary for my completed project.',
      icon: 'Briefcase',
      contextType: 'portfolio_draft',
    },
  ],

  dashboardCards: [
    { id: 'welcome', type: 'metric', title: 'Build Status', span: 3 },
    { id: 'today_tasks', type: 'task_list', title: 'Open Implementation Tasks', span: 2 },
    { id: 'ai_suggestion', type: 'ai_suggestion', title: 'Next Best Step', span: 1 },
    { id: 'projects', type: 'project_list', title: 'Active Projects', span: 2 },
    { id: 'calendar', type: 'calendar_preview', title: 'Milestone Targets', span: 1 },
    { id: 'activity', type: 'activity', title: 'Recent Activity', span: 3 },
  ],

  terminology: {
    project: 'Project',
    projects: 'Projects',
    milestone: 'Milestone',
    milestones: 'Milestones',
    task: 'Implementation Task',
    tasks: 'Implementation Tasks',
    note: 'Dev Note',
    notes: 'Dev Notes',
    calendar_event: 'Build Event',
    deadline: 'Target Date',
    progress: 'Build Progress',
  },

  emptyStates: {
    tasks: {
      icon: 'CheckSquare',
      title: 'No implementation tasks yet',
      description: 'Add tasks or let AI break your goal into a build plan.',
      actionLabel: 'Generate Build Plan',
    },
    projects: {
      icon: 'FolderKanban',
      title: 'No projects yet',
      description: 'Add your active project or portfolio goal to get started.',
      actionLabel: 'New Project',
    },
    notes: {
      icon: 'FileText',
      title: 'No dev notes yet',
      description: 'Capture architecture decisions, learnings, or technical notes.',
      actionLabel: 'New Dev Note',
    },
    calendar: {
      icon: 'Calendar',
      title: 'No build events yet',
      description: 'Add milestone target dates or focused build blocks.',
      actionLabel: 'Add Event',
    },
  },

  firstAiPrompt: 'Break my development goal into practical milestones and coding tasks.',
};
