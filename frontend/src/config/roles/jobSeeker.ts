import type { RoleConfig } from './types';

export const jobSeekerConfig: RoleConfig = {
  id: 'job_seeker',
  label: 'Job Seeker',
  labelPlural: 'Job Seekers',
  tagline: 'Organize your job search, applications, and interview preparation.',
  color: '#10B981',
  colorClass: 'job',
  glowClass: 'shadow-glow-mint',
  icon: 'Search',
  routePrefix: '/app/job-seeker',
  allowedRoutes: ['/app/job-seeker'],

  navigation: [
    { to: '/app/job-seeker/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/app/job-seeker/applications', label: 'Applications', icon: 'Send' },
    { to: '/app/job-seeker/search-plan', label: 'Job Analyzer', icon: 'Sparkles', badge: 'AI' },
    {
      to: '/app/job-seeker/resume-generator',
      label: 'Resume Tailor',
      icon: 'FileText',
      badge: 'AI',
    },
    { to: '/app/job-seeker/interview-prep', label: 'Mock Interviews', icon: 'MessageSquare' },
    { to: '/app/job-seeker/notes', label: 'Notes', icon: 'FileText' },
    { to: '/app/job-seeker/settings', label: 'Settings', icon: 'Settings' },
  ],

  onboardingSteps: [
    {
      id: 'target_role',
      title: 'Your Job Search Target',
      subtitle: "Help MentorOS understand what you're aiming for.",
      fields: [
        {
          name: 'target_role',
          label: 'Target Role',
          type: 'text',
          placeholder: 'e.g. Frontend Engineer, Data Analyst, Product Designer',
          required: true,
        },
        {
          name: 'industry',
          label: 'Preferred Industry',
          type: 'text',
          placeholder: 'e.g. FinTech, Healthcare, SaaS (optional)',
        },
        {
          name: 'location_pref',
          label: 'Location Preference',
          type: 'select',
          options: [
            { value: 'remote', label: 'Remote only' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'onsite', label: 'On-site' },
            { value: 'flexible', label: 'Flexible / No preference' },
          ],
        },
      ],
    },
    {
      id: 'readiness',
      title: 'Your Current Readiness',
      subtitle: 'Where are you in your job search right now?',
      fields: [
        {
          name: 'app_stage',
          label: 'Current Application Stage',
          type: 'select',
          options: [
            { value: 'preparing', label: 'Preparing resume / portfolio' },
            { value: 'applying', label: 'Actively applying' },
            { value: 'interviews', label: 'In interviews' },
            { value: 'offers', label: 'Evaluating offers' },
          ],
          required: true,
        },
        {
          name: 'resume_ready',
          label: 'Resume / Portfolio Readiness',
          type: 'select',
          options: [
            { value: 'not_started', label: 'Not started yet' },
            { value: 'draft', label: 'Have a draft' },
            { value: 'polished', label: 'Polished and ready' },
          ],
        },
        {
          name: 'weekly_hours',
          label: 'Weekly Job Search Time (hours)',
          type: 'number',
          placeholder: '10',
          required: true,
        },
      ],
    },
    {
      id: 'deadline',
      title: 'Your Timeline',
      subtitle: 'Set a target to stay accountable.',
      fields: [
        { name: 'target_deadline', label: 'Target Application / Start Date', type: 'date' },
        { name: 'interview_date', label: 'Upcoming Interview (if any)', type: 'date' },
        {
          name: 'main_goal',
          label: 'Your Main Job Search Goal',
          type: 'textarea',
          placeholder: 'e.g. Land a frontend engineering role at a SaaS company by January.',
          required: true,
        },
      ],
    },
  ],

  quickActions: [
    { id: 'new-task', label: 'Add Task', icon: 'Plus', href: '/app/job-seeker/tasks' },
    {
      id: 'ai-search-plan',
      label: 'Generate Search Plan',
      icon: 'Sparkles',
      promptStarter: 'Create a focused job-search plan with application and preparation tasks.',
    },
    {
      id: 'new-application',
      label: 'Log Application',
      icon: 'Send',
      href: '/app/job-seeker/applications',
    },
    {
      id: 'profile-draft',
      label: 'Draft Profile',
      icon: 'User',
      promptStarter: 'Write a professional profile summary for my target role.',
    },
  ],

  aiTemplates: [
    {
      id: 'search-plan',
      label: 'Job Search Plan',
      promptStarter: 'Create a focused job-search plan with application and preparation tasks.',
      icon: 'Map',
      contextType: 'job_search_plan',
    },
    {
      id: 'prep-tasks',
      label: 'Interview Prep Plan',
      promptStarter: 'Create an interview preparation plan for my upcoming interview.',
      icon: 'MessageSquare',
      contextType: 'interview_prep',
    },
    {
      id: 'profile-summary',
      label: 'Profile Summary',
      promptStarter: 'Write a professional profile summary for my target role.',
      icon: 'User',
      contextType: 'profile_draft',
    },
    {
      id: 'portfolio-desc',
      label: 'Portfolio Project',
      promptStarter: 'Write a portfolio project description that aligns with my target role.',
      icon: 'Briefcase',
      contextType: 'portfolio_draft',
    },
  ],

  dashboardCards: [
    { id: 'welcome', type: 'metric', title: 'Search Overview', span: 3 },
    { id: 'today_tasks', type: 'task_list', title: 'Priority Actions', span: 2 },
    { id: 'ai_suggestion', type: 'ai_suggestion', title: 'AI Recommendation', span: 1 },
    { id: 'projects', type: 'project_list', title: 'Applications', span: 2 },
    { id: 'calendar', type: 'calendar_preview', title: 'Upcoming Interviews', span: 1 },
    { id: 'activity', type: 'activity', title: 'Recent Activity', span: 3 },
  ],

  terminology: {
    project: 'Application',
    projects: 'Applications',
    milestone: 'Preparation Phase',
    milestones: 'Preparation Phases',
    task: 'Search Task',
    tasks: 'Search Tasks',
    note: 'Note',
    notes: 'Notes',
    calendar_event: 'Job Search Event',
    deadline: 'Application Deadline',
    progress: 'Search Progress',
  },

  emptyStates: {
    tasks: {
      icon: 'CheckSquare',
      title: 'No tasks yet',
      description: 'Add your first task to get started.',
      actionLabel: 'New Task',
    },
    projects: {
      icon: 'Send',
      title: 'No applications yet',
      description: 'Track job opportunities as applications to stay organized.',
      actionLabel: 'Log Application',
    },
    notes: {
      icon: 'FileText',
      title: 'No notes yet',
      description: 'Capture interview preparation notes, company research, or ideas.',
      actionLabel: 'New Note',
    },
    calendar: {
      icon: 'Calendar',
      title: 'No events scheduled',
      description: 'Add interviews, follow-up dates, or preparation sessions.',
      actionLabel: 'Add Event',
    },
  },

  firstAiPrompt: 'Create a focused job-search plan with application and preparation tasks.',
};
