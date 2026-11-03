import type { RoleConfig } from './types';

export const freelancerConfig: RoleConfig = {
  id: 'freelancer',
  label: 'Freelancer',
  labelPlural: 'Freelancers',
  tagline: 'Manage commitments, deliverables, and your focused workflow.',
  color: '#F97316',
  colorClass: 'freelancer',
  glowClass: 'shadow-glow-solar',
  icon: 'Briefcase',
  routePrefix: '/app/freelancer',
  allowedRoutes: ['/app/freelancer'],

  navigation: [
    { to: '/app/freelancer/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/app/freelancer/projects', label: 'Client Projects', icon: 'Briefcase' },
    { to: '/app/freelancer/work-plans', label: 'Work Proposals', icon: 'Sparkles', badge: 'AI' },
    { to: '/app/freelancer/deliverables', label: 'Deliverables', icon: 'Clock' },
    { to: '/app/freelancer/tasks', label: 'Tasks', icon: 'CheckSquare' },
    { to: '/app/freelancer/calendar', label: 'Calendar', icon: 'Calendar' },
    { to: '/app/freelancer/notes', label: 'Work Notes', icon: 'FileText' },
    { to: '/app/freelancer/settings', label: 'Settings', icon: 'Settings' },
  ],

  onboardingSteps: [
    {
      id: 'work_type',
      title: 'Your Work',
      subtitle: 'Help MentorOS understand the kind of work you do.',
      fields: [
        {
          name: 'service_type',
          label: 'Service / Work Type',
          type: 'text',
          placeholder: 'e.g. UI Design, Content Writing, Web Dev',
          required: true,
        },
        {
          name: 'active_work',
          label: 'Current Active Work or Projects',
          type: 'textarea',
          placeholder: "Brief description of what you're working on now",
        },
        {
          name: 'weekly_hours',
          label: 'Weekly Availability (hours)',
          type: 'number',
          placeholder: '30',
          required: true,
        },
      ],
    },
    {
      id: 'deliverables',
      title: 'Deliverables & Deadlines',
      subtitle: 'Share upcoming deliverables to help build your plan.',
      fields: [
        {
          name: 'next_deliverable',
          label: 'Next Key Deliverable',
          type: 'text',
          placeholder: 'e.g. Website redesign final mockups',
        },
        { name: 'delivery_date', label: 'Delivery Date', type: 'date' },
        {
          name: 'typical_output',
          label: 'Typical Deliverable Type',
          type: 'select',
          options: [
            { value: 'design_files', label: 'Design files / mockups' },
            { value: 'code', label: 'Code / features' },
            { value: 'written_content', label: 'Written content / copy' },
            { value: 'strategy_docs', label: 'Strategy / planning documents' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      id: 'goal',
      title: 'Your Main Professional Goal',
      subtitle: 'What are you working toward right now?',
      fields: [
        {
          name: 'main_goal',
          label: 'Main Goal',
          type: 'textarea',
          placeholder:
            'e.g. Deliver three projects on time this month and build a portfolio case study.',
          required: true,
        },
      ],
    },
  ],

  quickActions: [
    { id: 'new-task', label: 'Add Task', icon: 'Plus', href: '/app/freelancer/tasks' },
    {
      id: 'ai-weekly-plan',
      label: 'AI Weekly Plan',
      icon: 'Sparkles',
      promptStarter: 'Turn my active work and deadlines into a focused weekly plan.',
    },
    {
      id: 'new-deliverable',
      label: 'Log Deliverable',
      icon: 'Package',
      href: '/app/freelancer/deliverables',
    },
    {
      id: 'case-study',
      label: 'Draft Case Study',
      icon: 'FileText',
      promptStarter: 'Draft a concise case study outline for my recent completed work.',
    },
  ],

  aiTemplates: [
    {
      id: 'weekly-plan',
      label: 'Weekly Work Plan',
      promptStarter: 'Turn my active work and deadlines into a focused weekly plan.',
      icon: 'Map',
      contextType: 'weekly_plan',
    },
    {
      id: 'milestones',
      label: 'Project Milestones',
      promptStarter: 'Break my project into milestones, effort blocks, and realistic deadlines.',
      icon: 'FolderKanban',
      contextType: 'project_milestone',
    },
    {
      id: 'case-study',
      label: 'Case Study Draft',
      promptStarter: 'Draft a concise case study outline for my recently completed project.',
      icon: 'FileText',
      contextType: 'case_study',
    },
    {
      id: 'work-summary',
      label: 'Work Summary',
      promptStarter: 'Write a professional work summary for my portfolio based on recent work.',
      icon: 'Briefcase',
      contextType: 'work_summary',
    },
  ],

  dashboardCards: [
    { id: 'welcome', type: 'metric', title: 'This Week', span: 3 },
    { id: 'today_tasks', type: 'task_list', title: 'Priority Tasks', span: 2 },
    { id: 'ai_suggestion', type: 'ai_suggestion', title: 'AI Recommendation', span: 1 },
    { id: 'projects', type: 'project_list', title: 'Active Projects', span: 2 },
    { id: 'calendar', type: 'calendar_preview', title: 'Delivery Timeline', span: 1 },
    { id: 'activity', type: 'activity', title: 'Recent Activity', span: 3 },
  ],

  terminology: {
    project: 'Project',
    projects: 'Projects',
    milestone: 'Deliverable Phase',
    milestones: 'Deliverable Phases',
    task: 'Task',
    tasks: 'Tasks',
    note: 'Work Note',
    notes: 'Work Notes',
    calendar_event: 'Work Event',
    deadline: 'Delivery Deadline',
    progress: 'Delivery Progress',
  },

  emptyStates: {
    tasks: {
      icon: 'CheckSquare',
      title: 'No tasks yet',
      description: 'Add your first task or let AI create a weekly plan.',
      actionLabel: 'Generate Weekly Plan',
    },
    projects: {
      icon: 'FolderKanban',
      title: 'No projects yet',
      description: 'Add a project or engagement to start tracking your work.',
      actionLabel: 'New Project',
    },
    notes: {
      icon: 'FileText',
      title: 'No work notes yet',
      description: 'Capture requirements, debriefs, or case study ideas here.',
      actionLabel: 'New Work Note',
    },
    calendar: {
      icon: 'Calendar',
      title: 'No events scheduled',
      description: 'Add delivery deadlines, review dates, or work blocks.',
      actionLabel: 'Add Event',
    },
  },

  firstAiPrompt: 'Turn my active work and deadlines into a focused weekly plan.',
};
