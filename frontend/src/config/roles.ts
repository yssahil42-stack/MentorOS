import type { UserRole } from '../types/user';

// ─── Sub-types ───────────────────────────────────────────────────────────────

export interface NavigationItem {
  to: string;
  label: string;
  icon: string;   // Lucide icon name
  badge?: string; // optional notification count key
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  promptStarter?: string;    // opens AI drawer with this text pre-filled
  href?: string;             // navigates to this route instead
}

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  fields: OnboardingField[];
}

export interface OnboardingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'date' | 'number' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface AiTemplate {
  id: string;
  label: string;
  promptStarter: string;
  icon: string;
  contextType: string;
}

export interface EmptyStateConfig {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
}

export interface DashboardCardConfig {
  id: string;
  type: 'metric' | 'task_list' | 'project_list' | 'calendar_preview' | 'ai_suggestion' | 'quick_actions' | 'activity';
  title: string;
  span?: 1 | 2 | 3;   // grid column span
}

export interface RoleConfig {
  id: UserRole;
  label: string;
  labelPlural: string;
  tagline: string;
  color: string;                // CSS hex
  colorClass: string;           // Tailwind class prefix e.g. 'student'
  glowClass: string;            // Tailwind shadow class
  icon: string;                 // Lucide icon name
  routePrefix: string;          // e.g. '/app/student'
  allowedRoutes: string[];      // allowed path prefixes
  navigation: NavigationItem[];
  onboardingSteps: OnboardingStep[];
  quickActions: QuickAction[];
  aiTemplates: AiTemplate[];
  dashboardCards: DashboardCardConfig[];
  terminology: Record<string, string>;
  emptyStates: Record<string, EmptyStateConfig>;
  firstAiPrompt: string;
}

// ─── Role Configurations ─────────────────────────────────────────────────────

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {

  // ══════════════════════════════════════════════════════════════
  // STUDENT
  // ══════════════════════════════════════════════════════════════
  student: {
    id: 'student',
    label: 'Student',
    labelPlural: 'Students',
    tagline: 'Organize your studies, projects, and academic progress.',
    color: '#F59E0B',
    colorClass: 'solar',
    glowClass: 'shadow-glow-solar',
    icon: 'GraduationCap',
    routePrefix: '/app/student',
    allowedRoutes: ['/app/student'],

    navigation: [
      { to: '/app/student/dashboard',  label: 'Dashboard',          icon: 'LayoutDashboard' },
      { to: '/app/student/projects',   label: 'Academic Projects',  icon: 'FolderKanban' },
      { to: '/app/student/tasks',      label: 'Focus Tasks',        icon: 'CheckSquare' },
      { to: '/app/student/calendar',   label: 'Calendar',           icon: 'Calendar' },
      { to: '/app/student/notes',      label: 'Learning Notes',     icon: 'FileText' },
      { to: '/app/student/settings',   label: 'Settings',           icon: 'Settings' },
    ],

    onboardingSteps: [
      {
        id: 'program',
        title: 'Your Academic Context',
        subtitle: 'Help MentorOS understand your current studies.',
        fields: [
          { name: 'program',      label: 'Current Program or Course', type: 'text',   placeholder: 'e.g. BSc Computer Science', required: true },
          { name: 'semester',     label: 'Semester / Year',           type: 'select',
            options: ['Year 1','Year 2','Year 3','Year 4','Year 5','Graduate'].map(v=>({value:v,label:v})), required: true },
          { name: 'main_subjects',label: 'Main Subjects',             type: 'textarea',placeholder: 'e.g. Algorithms, Web Dev, Data Science', required: true },
        ],
      },
      {
        id: 'deadlines',
        title: 'Upcoming Deadlines',
        subtitle: 'Share any upcoming assessments to help plan your schedule.',
        fields: [
          { name: 'next_exam_title', label: 'Next Exam or Assignment', type: 'text', placeholder: 'e.g. Data Structures Final Exam' },
          { name: 'next_exam_date',  label: 'Due / Exam Date',         type: 'date' },
          { name: 'weekly_hours',    label: 'Weekly Study Availability (hours)', type: 'number', placeholder: '20' },
        ],
      },
      {
        id: 'goal',
        title: 'Primary Goal',
        subtitle: 'What do you most want to achieve right now?',
        fields: [
          { name: 'primary_goal', label: 'Your Main Focus', type: 'select',
            options: [
              { value: 'finish_project',  label: 'Finish a major project' },
              { value: 'exam_prep',       label: 'Prepare for upcoming exams' },
              { value: 'skill_building',  label: 'Build a specific skill' },
              { value: 'improve_grades',  label: 'Improve grades' },
              { value: 'other',           label: 'Something else' },
            ], required: true },
          { name: 'goal_detail', label: 'Tell us more (optional)', type: 'textarea', placeholder: 'e.g. I want to finish my capstone project by December.' },
        ],
      },
    ],

    quickActions: [
      { id: 'new-task',      label: 'Add Study Task',    icon: 'Plus',       href: '/app/student/tasks' },
      { id: 'ai-study-plan', label: 'Generate Study Plan', icon: 'Sparkles', promptStarter: 'Create a realistic study and project plan from my current priorities.' },
      { id: 'new-note',      label: 'Learning Note',     icon: 'FileText',   href: '/app/student/notes' },
      { id: 'add-deadline',  label: 'Add Deadline',      icon: 'Calendar',   href: '/app/student/calendar' },
    ],

    aiTemplates: [
      { id: 'study-plan',  label: 'Study Plan',          promptStarter: 'Create a realistic study and project plan from my current priorities.', icon: 'BookOpen',     contextType: 'study_plan' },
      { id: 'exam-prep',   label: 'Exam Prep Schedule',  promptStarter: 'Break down my exam preparation into daily study blocks.',              icon: 'Calendar',     contextType: 'exam_prep' },
      { id: 'project-plan',label: 'Project Milestone',   promptStarter: 'Create milestones and tasks for my academic project.',                 icon: 'FolderKanban', contextType: 'project_milestone' },
      { id: 'reflection',  label: 'Portfolio Reflection', promptStarter: 'Draft a portfolio description for my completed academic project.',    icon: 'FileText',     contextType: 'portfolio_draft' },
    ],

    dashboardCards: [
      { id: 'welcome',       type: 'metric',           title: 'Overview',             span: 3 },
      { id: 'today_tasks',   type: 'task_list',         title: "Today's Study Tasks",  span: 2 },
      { id: 'ai_suggestion', type: 'ai_suggestion',     title: 'AI Recommendation',    span: 1 },
      { id: 'projects',      type: 'project_list',      title: 'Academic Projects',    span: 2 },
      { id: 'calendar',      type: 'calendar_preview',  title: 'Upcoming Deadlines',   span: 1 },
      { id: 'activity',      type: 'activity',          title: 'Recent Activity',      span: 3 },
    ],

    terminology: {
      project:     'Academic Project',
      projects:    'Academic Projects',
      milestone:   'Assignment Phase',
      milestones:  'Assignment Phases',
      task:        'Study Task',
      tasks:       'Study Tasks',
      note:        'Learning Note',
      notes:       'Learning Notes',
      calendar_event: 'Academic Event',
      deadline:    'Exam / Deadline',
      progress:    'Study Progress',
    },

    emptyStates: {
      tasks:    { icon: 'CheckSquare',  title: 'No study tasks yet',      description: 'Add your first study task or let AI generate a study plan.',     actionLabel: 'Generate Study Plan' },
      projects: { icon: 'FolderKanban', title: 'No academic projects yet', description: 'Start a new project or import one from your assignments.',        actionLabel: 'New Academic Project' },
      notes:    { icon: 'FileText',     title: 'No learning notes yet',    description: 'Capture what you\'re studying — concepts, summaries, questions.', actionLabel: 'New Learning Note' },
      calendar: { icon: 'Calendar',     title: 'No events scheduled',      description: 'Add exam dates, submission deadlines, or study blocks.',           actionLabel: 'Add Event' },
    },

    firstAiPrompt: 'Create a realistic study and project plan from my current priorities.',
  },

  // ══════════════════════════════════════════════════════════════
  // FREELANCER
  // ══════════════════════════════════════════════════════════════
  freelancer: {
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
      { to: '/app/freelancer/dashboard',   label: 'Dashboard',    icon: 'LayoutDashboard' },
      { to: '/app/freelancer/projects',    label: 'Projects',     icon: 'FolderKanban' },
      { to: '/app/freelancer/tasks',       label: 'Tasks',        icon: 'CheckSquare' },
      { to: '/app/freelancer/calendar',    label: 'Calendar',     icon: 'Calendar' },
      { to: '/app/freelancer/notes',       label: 'Work Notes',   icon: 'FileText' },
      { to: '/app/freelancer/settings',    label: 'Settings',     icon: 'Settings' },
    ],

    onboardingSteps: [
      {
        id: 'work_type',
        title: 'Your Work',
        subtitle: 'Help MentorOS understand the kind of work you do.',
        fields: [
          { name: 'service_type',   label: 'Service / Work Type',             type: 'text',     placeholder: 'e.g. UI Design, Content Writing, Web Dev', required: true },
          { name: 'active_work',    label: 'Current Active Work or Projects',  type: 'textarea', placeholder: 'Brief description of what you\'re working on now' },
          { name: 'weekly_hours',   label: 'Weekly Availability (hours)',       type: 'number',   placeholder: '30', required: true },
        ],
      },
      {
        id: 'deliverables',
        title: 'Deliverables & Deadlines',
        subtitle: 'Share upcoming deliverables to help build your plan.',
        fields: [
          { name: 'next_deliverable', label: 'Next Key Deliverable',    type: 'text', placeholder: 'e.g. Website redesign final mockups' },
          { name: 'delivery_date',    label: 'Delivery Date',           type: 'date' },
          { name: 'typical_output',   label: 'Typical Deliverable Type',type: 'select',
            options: [
              { value: 'design_files',  label: 'Design files / mockups' },
              { value: 'code',          label: 'Code / features' },
              { value: 'written_content',label: 'Written content / copy' },
              { value: 'strategy_docs', label: 'Strategy / planning documents' },
              { value: 'other',         label: 'Other' },
            ] },
        ],
      },
      {
        id: 'goal',
        title: 'Your Main Professional Goal',
        subtitle: 'What are you working toward right now?',
        fields: [
          { name: 'main_goal', label: 'Main Goal', type: 'textarea', placeholder: 'e.g. Deliver three projects on time this month and build a portfolio case study.', required: true },
        ],
      },
    ],

    quickActions: [
      { id: 'new-task',       label: 'Add Task',           icon: 'Plus',     href: '/app/freelancer/tasks' },
      { id: 'ai-weekly-plan', label: 'AI Weekly Plan',     icon: 'Sparkles', promptStarter: 'Turn my active work and deadlines into a focused weekly plan.' },
      { id: 'new-deliverable',label: 'Log Deliverable',    icon: 'Package',  href: '/app/freelancer/deliverables' },
      { id: 'case-study',     label: 'Draft Case Study',   icon: 'FileText', promptStarter: 'Draft a concise case study outline for my recent completed work.' },
    ],

    aiTemplates: [
      { id: 'weekly-plan',  label: 'Weekly Work Plan',   promptStarter: 'Turn my active work and deadlines into a focused weekly plan.',              icon: 'Map',         contextType: 'weekly_plan' },
      { id: 'milestones',   label: 'Project Milestones', promptStarter: 'Break my project into milestones, effort blocks, and realistic deadlines.',  icon: 'FolderKanban',contextType: 'project_milestone' },
      { id: 'case-study',   label: 'Case Study Draft',   promptStarter: 'Draft a concise case study outline for my recently completed project.',      icon: 'FileText',    contextType: 'case_study' },
      { id: 'work-summary', label: 'Work Summary',       promptStarter: 'Write a professional work summary for my portfolio based on recent work.',   icon: 'Briefcase',   contextType: 'work_summary' },
    ],

    dashboardCards: [
      { id: 'welcome',       type: 'metric',          title: 'This Week',           span: 3 },
      { id: 'today_tasks',   type: 'task_list',        title: "Priority Tasks",      span: 2 },
      { id: 'ai_suggestion', type: 'ai_suggestion',    title: 'AI Recommendation',   span: 1 },
      { id: 'projects',      type: 'project_list',     title: 'Active Projects',     span: 2 },
      { id: 'calendar',      type: 'calendar_preview', title: 'Delivery Timeline',   span: 1 },
      { id: 'activity',      type: 'activity',         title: 'Recent Activity',     span: 3 },
    ],

    terminology: {
      project:     'Project',
      projects:    'Projects',
      milestone:   'Deliverable Phase',
      milestones:  'Deliverable Phases',
      task:        'Task',
      tasks:       'Tasks',
      note:        'Work Note',
      notes:       'Work Notes',
      calendar_event: 'Work Event',
      deadline:    'Delivery Deadline',
      progress:    'Delivery Progress',
    },

    emptyStates: {
      tasks:    { icon: 'CheckSquare',  title: 'No tasks yet',         description: 'Add your first task or let AI create a weekly plan.',                actionLabel: 'Generate Weekly Plan' },
      projects: { icon: 'FolderKanban', title: 'No projects yet',      description: 'Add a project or engagement to start tracking your work.',            actionLabel: 'New Project' },
      notes:    { icon: 'FileText',     title: 'No work notes yet',    description: 'Capture requirements, debriefs, or case study ideas here.',           actionLabel: 'New Work Note' },
      calendar: { icon: 'Calendar',     title: 'No events scheduled',  description: 'Add delivery deadlines, review dates, or work blocks.',               actionLabel: 'Add Event' },
    },

    firstAiPrompt: 'Turn my active work and deadlines into a focused weekly plan.',
  },

  // ══════════════════════════════════════════════════════════════
  // DEVELOPER
  // ══════════════════════════════════════════════════════════════
  developer: {
    id: 'developer',
    label: 'Developer',
    labelPlural: 'Developers',
    tagline: 'Turn development goals into shippable milestones and portfolio evidence.',
    color: '#06B6D4',
    colorClass: 'developer',
    glowClass: 'shadow-glow-cyan',
    icon: 'Code2',
    routePrefix: '/app/developer',
    allowedRoutes: ['/app/developer'],

    navigation: [
      { to: '/app/developer/dashboard',  label: 'Dashboard',    icon: 'LayoutDashboard' },
      { to: '/app/developer/projects',   label: 'Projects',     icon: 'FolderKanban' },
      { to: '/app/developer/tasks',      label: 'Tasks',        icon: 'CheckSquare' },
      { to: '/app/developer/calendar',   label: 'Calendar',     icon: 'Calendar' },
      { to: '/app/developer/notes',      label: 'Dev Notes',    icon: 'FileText' },
      { to: '/app/developer/settings',   label: 'Settings',     icon: 'Settings' },
    ],

    onboardingSteps: [
      {
        id: 'skills_project',
        title: 'Your Development Context',
        subtitle: 'Help MentorOS understand your technical focus.',
        fields: [
          { name: 'skill_focus',    label: 'Current Skill Focus',       type: 'text',     placeholder: 'e.g. React, Machine Learning, Rust', required: true },
          { name: 'active_project', label: 'Active Software Project',   type: 'text',     placeholder: 'e.g. Portfolio Website, CLI Tool, Mobile App', required: true },
          { name: 'preferred_stack',label: 'Preferred Stack / Tools',   type: 'textarea', placeholder: 'e.g. React + TypeScript + FastAPI + PostgreSQL' },
        ],
      },
      {
        id: 'time_target',
        title: 'Time & Target',
        subtitle: 'How much time do you have, and what are you aiming to ship?',
        fields: [
          { name: 'weekly_build_hours', label: 'Weekly Build Time (hours)', type: 'number', placeholder: '15', required: true },
          { name: 'target_outcome',     label: 'Target Outcome',             type: 'select',
            options: [
              { value: 'portfolio_project', label: 'Complete a portfolio project' },
              { value: 'feature_milestone', label: 'Ship a feature milestone' },
              { value: 'learn_skill',       label: 'Solidify a specific skill' },
              { value: 'open_source',       label: 'Contribute to open source' },
              { value: 'other',             label: 'Something else' },
            ], required: true },
          { name: 'target_date', label: 'Target Completion Date', type: 'date' },
        ],
      },
      {
        id: 'goal',
        title: 'Your Build Goal',
        subtitle: 'Describe what you want to achieve in detail.',
        fields: [
          { name: 'build_goal', label: 'Build Goal', type: 'textarea', placeholder: 'e.g. Build and deploy a full-stack portfolio project with auth, CRUD, and AI integration by end of October.', required: true },
        ],
      },
    ],

    quickActions: [
      { id: 'new-task',      label: 'Add Dev Task',       icon: 'Plus',      href: '/app/developer/tasks' },
      { id: 'ai-build-plan', label: 'Generate Build Plan', icon: 'Sparkles', promptStarter: 'Break my development goal into practical milestones and coding tasks.' },
      { id: 'new-note',      label: 'Dev Note',            icon: 'FileText', href: '/app/developer/notes' },
      { id: 'readme-draft',  label: 'Draft README',        icon: 'Book',     promptStarter: 'Draft a professional README outline for my project.' },
    ],

    aiTemplates: [
      { id: 'build-plan',     label: 'Build Plan',         promptStarter: 'Break my development goal into practical milestones and coding tasks.',       icon: 'Map',         contextType: 'build_plan' },
      { id: 'spec',           label: 'Feature Spec',       promptStarter: 'Draft a brief specification with milestones for this feature.',               icon: 'FileCode',    contextType: 'feature_spec' },
      { id: 'readme',         label: 'README Draft',       promptStarter: 'Draft a professional README outline for my project.',                         icon: 'Book',        contextType: 'readme_draft' },
      { id: 'portfolio-desc', label: 'Portfolio Summary',  promptStarter: 'Write a portfolio project summary for my completed project.',                 icon: 'Briefcase',   contextType: 'portfolio_draft' },
    ],

    dashboardCards: [
      { id: 'welcome',       type: 'metric',          title: 'Build Status',          span: 3 },
      { id: 'today_tasks',   type: 'task_list',        title: 'Open Implementation Tasks', span: 2 },
      { id: 'ai_suggestion', type: 'ai_suggestion',    title: 'Next Best Step',        span: 1 },
      { id: 'projects',      type: 'project_list',     title: 'Active Projects',       span: 2 },
      { id: 'calendar',      type: 'calendar_preview', title: 'Milestone Targets',     span: 1 },
      { id: 'activity',      type: 'activity',         title: 'Recent Activity',       span: 3 },
    ],

    terminology: {
      project:     'Project',
      projects:    'Projects',
      milestone:   'Milestone',
      milestones:  'Milestones',
      task:        'Implementation Task',
      tasks:       'Implementation Tasks',
      note:        'Dev Note',
      notes:       'Dev Notes',
      calendar_event: 'Build Event',
      deadline:    'Target Date',
      progress:    'Build Progress',
    },

    emptyStates: {
      tasks:    { icon: 'CheckSquare',  title: 'No implementation tasks yet', description: 'Add tasks or let AI break your goal into a build plan.',           actionLabel: 'Generate Build Plan' },
      projects: { icon: 'FolderKanban', title: 'No projects yet',             description: 'Add your active project or portfolio goal to get started.',        actionLabel: 'New Project' },
      notes:    { icon: 'FileText',     title: 'No dev notes yet',            description: 'Capture architecture decisions, learnings, or technical notes.',   actionLabel: 'New Dev Note' },
      calendar: { icon: 'Calendar',     title: 'No build events yet',         description: 'Add milestone target dates or focused build blocks.',              actionLabel: 'Add Event' },
    },

    firstAiPrompt: 'Break my development goal into practical milestones and coding tasks.',
  },

  // ══════════════════════════════════════════════════════════════
  // JOB SEEKER
  // ══════════════════════════════════════════════════════════════
  job_seeker: {
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
      { to: '/app/job-seeker/dashboard',      label: 'Dashboard',        icon: 'LayoutDashboard' },
      { to: '/app/job-seeker/applications',   label: 'Applications',     icon: 'Send' },
      { to: '/app/job-seeker/portfolio',      label: 'Portfolio Tasks',  icon: 'Briefcase' },
      { to: '/app/job-seeker/calendar',       label: 'Calendar',         icon: 'Calendar' },
      { to: '/app/job-seeker/notes',          label: 'Notes',            icon: 'FileText' },
      { to: '/app/job-seeker/settings',       label: 'Settings',         icon: 'Settings' },
    ],

    onboardingSteps: [
      {
        id: 'target_role',
        title: 'Your Job Search Target',
        subtitle: 'Help MentorOS understand what you\'re aiming for.',
        fields: [
          { name: 'target_role',    label: 'Target Role',             type: 'text', placeholder: 'e.g. Frontend Engineer, Data Analyst, Product Designer', required: true },
          { name: 'industry',       label: 'Preferred Industry',       type: 'text', placeholder: 'e.g. FinTech, Healthcare, SaaS (optional)' },
          { name: 'location_pref',  label: 'Location Preference',      type: 'select',
            options: [
              { value: 'remote',    label: 'Remote only' },
              { value: 'hybrid',    label: 'Hybrid' },
              { value: 'onsite',    label: 'On-site' },
              { value: 'flexible',  label: 'Flexible / No preference' },
            ] },
        ],
      },
      {
        id: 'readiness',
        title: 'Your Current Readiness',
        subtitle: 'Where are you in your job search right now?',
        fields: [
          { name: 'app_stage',      label: 'Current Application Stage', type: 'select',
            options: [
              { value: 'preparing',  label: 'Preparing resume / portfolio' },
              { value: 'applying',   label: 'Actively applying' },
              { value: 'interviews', label: 'In interviews' },
              { value: 'offers',     label: 'Evaluating offers' },
            ], required: true },
          { name: 'resume_ready',   label: 'Resume / Portfolio Readiness', type: 'select',
            options: [
              { value: 'not_started', label: 'Not started yet' },
              { value: 'draft',       label: 'Have a draft' },
              { value: 'polished',    label: 'Polished and ready' },
            ] },
          { name: 'weekly_hours',   label: 'Weekly Job Search Time (hours)', type: 'number', placeholder: '10', required: true },
        ],
      },
      {
        id: 'deadline',
        title: 'Your Timeline',
        subtitle: 'Set a target to stay accountable.',
        fields: [
          { name: 'target_deadline', label: 'Target Application / Start Date', type: 'date' },
          { name: 'interview_date',  label: 'Upcoming Interview (if any)',      type: 'date' },
          { name: 'main_goal',       label: 'Your Main Job Search Goal',       type: 'textarea',
            placeholder: 'e.g. Land a frontend engineering role at a SaaS company by January.', required: true },
        ],
      },
    ],

    quickActions: [
      { id: 'new-task',       label: 'Add Task',          icon: 'Plus',         href: '/app/job-seeker/tasks' },
      { id: 'ai-search-plan', label: 'Generate Search Plan', icon: 'Sparkles', promptStarter: 'Create a focused job-search plan with application and preparation tasks.' },
      { id: 'new-application',label: 'Log Application',   icon: 'Send',         href: '/app/job-seeker/applications' },
      { id: 'profile-draft',  label: 'Draft Profile',     icon: 'User',         promptStarter: 'Write a professional profile summary for my target role.' },
    ],

    aiTemplates: [
      { id: 'search-plan',    label: 'Job Search Plan',     promptStarter: 'Create a focused job-search plan with application and preparation tasks.', icon: 'Map',          contextType: 'job_search_plan' },
      { id: 'prep-tasks',     label: 'Interview Prep Plan', promptStarter: 'Create an interview preparation plan for my upcoming interview.',         icon: 'MessageSquare', contextType: 'interview_prep' },
      { id: 'profile-summary',label: 'Profile Summary',     promptStarter: 'Write a professional profile summary for my target role.',               icon: 'User',          contextType: 'profile_draft' },
      { id: 'portfolio-desc', label: 'Portfolio Project',   promptStarter: 'Write a portfolio project description that aligns with my target role.', icon: 'Briefcase',    contextType: 'portfolio_draft' },
    ],

    dashboardCards: [
      { id: 'welcome',       type: 'metric',          title: 'Search Overview',      span: 3 },
      { id: 'today_tasks',   type: 'task_list',        title: 'Priority Actions',     span: 2 },
      { id: 'ai_suggestion', type: 'ai_suggestion',    title: 'AI Recommendation',    span: 1 },
      { id: 'projects',      type: 'project_list',     title: 'Applications',         span: 2 },
      { id: 'calendar',      type: 'calendar_preview', title: 'Upcoming Interviews',  span: 1 },
      { id: 'activity',      type: 'activity',         title: 'Recent Activity',      span: 3 },
    ],

    terminology: {
      project:     'Application',
      projects:    'Applications',
      milestone:   'Preparation Phase',
      milestones:  'Preparation Phases',
      task:        'Search Task',
      tasks:       'Search Tasks',
      note:        'Note',
      notes:       'Notes',
      calendar_event: 'Job Search Event',
      deadline:    'Application Deadline',
      progress:    'Search Progress',
    },

    emptyStates: {
      tasks:    { icon: 'CheckSquare', title: 'No tasks yet',              description: 'Add a task or let AI create a focused job search plan.',              actionLabel: 'Generate Search Plan' },
      projects: { icon: 'Send',        title: 'No applications yet',       description: 'Track job opportunities as applications to stay organized.',          actionLabel: 'Log Application' },
      notes:    { icon: 'FileText',    title: 'No notes yet',              description: 'Capture interview preparation notes, company research, or ideas.',    actionLabel: 'New Note' },
      calendar: { icon: 'Calendar',   title: 'No events scheduled',        description: 'Add interviews, follow-up dates, or preparation sessions.',          actionLabel: 'Add Event' },
    },

    firstAiPrompt: 'Create a focused job-search plan with application and preparation tasks.',
  },
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
  return pathname.startsWith(prefix) || pathname === '/app/settings' || pathname === '/app/unauthorized';
}

export const ALL_ROLES: UserRole[] = ['student', 'freelancer', 'developer', 'job_seeker'];

export const ROLE_LABELS: Record<UserRole, string> = {
  student:    'Student',
  freelancer: 'Freelancer',
  developer:  'Developer',
  job_seeker: 'Job Seeker',
};
