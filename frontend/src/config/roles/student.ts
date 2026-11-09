import type { RoleConfig } from './types';

export const studentConfig: RoleConfig = {
  id: 'student',
  label: 'Student',
  labelPlural: 'Students',
  tagline: 'Organize your studies, projects, and academic progress.',
  color: '#F97316',
  colorClass: 'student',
  glowClass: 'shadow-glow-solar',
  icon: 'GraduationCap',
  routePrefix: '/app/student',
  allowedRoutes: ['/app/student'],

  navigation: [
    { to: '/app/student/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/app/student/projects', label: 'Courses & Assignments', icon: 'BookOpen' },
    { to: '/app/student/notes', label: 'Notes', icon: 'FileText' },
    { to: '/app/student/settings', label: 'Settings', icon: 'Settings' },
  ],

  onboardingSteps: [
    {
      id: 'program',
      title: 'Your Academic Context',
      subtitle: 'Help MentorOS understand your current studies.',
      fields: [
        {
          name: 'program',
          label: 'Current Program or Course',
          type: 'text',
          placeholder: 'e.g. BSc Computer Science',
          required: true,
        },
        {
          name: 'semester',
          label: 'Semester / Year',
          type: 'select',
          options: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Graduate'].map((v) => ({
            value: v,
            label: v,
          })),
          required: true,
        },
        {
          name: 'main_subjects',
          label: 'Main Subjects',
          type: 'textarea',
          placeholder: 'e.g. Algorithms, Web Dev, Data Science',
          required: true,
        },
      ],
    },
    {
      id: 'deadlines',
      title: 'Upcoming Deadlines',
      subtitle: 'Share any upcoming assessments to help plan your schedule.',
      fields: [
        {
          name: 'next_exam_title',
          label: 'Next Exam or Assignment',
          type: 'text',
          placeholder: 'e.g. Data Structures Final Exam',
        },
        { name: 'next_exam_date', label: 'Due / Exam Date', type: 'date' },
        {
          name: 'weekly_hours',
          label: 'Weekly Study Availability (hours)',
          type: 'number',
          placeholder: '20',
        },
      ],
    },
    {
      id: 'goal',
      title: 'Primary Goal',
      subtitle: 'What do you most want to achieve right now?',
      fields: [
        {
          name: 'primary_goal',
          label: 'Your Main Focus',
          type: 'select',
          options: [
            { value: 'finish_project', label: 'Finish a major project' },
            { value: 'exam_prep', label: 'Prepare for upcoming exams' },
            { value: 'skill_building', label: 'Build a specific skill' },
            { value: 'improve_grades', label: 'Improve grades' },
            { value: 'other', label: 'Something else' },
          ],
          required: true,
        },
        {
          name: 'goal_detail',
          label: 'Tell us more (optional)',
          type: 'textarea',
          placeholder: 'e.g. I want to finish my capstone project by December.',
        },
      ],
    },
  ],

  quickActions: [
    { id: 'new-task', label: 'Add Study Task', icon: 'Plus', href: '/app/student/tasks' },
    {
      id: 'ai-study-plan',
      label: 'Generate Study Plan',
      icon: 'Sparkles',
      promptStarter: 'Create a realistic study and project plan from my current priorities.',
    },
    { id: 'add-deadline', label: 'Add Deadline', icon: 'Calendar', href: '/app/student/dashboard#my-schedule' },
  ],

  aiTemplates: [
    {
      id: 'study-plan',
      label: 'Study Plan',
      promptStarter: 'Create a realistic study and project plan from my current priorities.',
      icon: 'BookOpen',
      contextType: 'study_plan',
    },
    {
      id: 'exam-prep',
      label: 'Exam Prep Schedule',
      promptStarter: 'Break down my exam preparation into daily study blocks.',
      icon: 'Calendar',
      contextType: 'exam_prep',
    },
    {
      id: 'project-plan',
      label: 'Project Milestone',
      promptStarter: 'Create milestones and tasks for my academic project.',
      icon: 'FolderKanban',
      contextType: 'project_milestone',
    },
    {
      id: 'reflection',
      label: 'Portfolio Reflection',
      promptStarter: 'Draft a portfolio description for my completed academic project.',
      icon: 'FileText',
      contextType: 'portfolio_draft',
    },
  ],

  dashboardCards: [
    { id: 'welcome', type: 'metric', title: 'Overview', span: 3 },
    { id: 'today_tasks', type: 'task_list', title: "Today's Study Tasks", span: 2 },
    { id: 'ai_suggestion', type: 'ai_suggestion', title: 'AI Recommendation', span: 1 },
    { id: 'projects', type: 'project_list', title: 'Academic Projects', span: 2 },
    { id: 'calendar', type: 'calendar_preview', title: 'Upcoming Deadlines', span: 1 },
    { id: 'activity', type: 'activity', title: 'Recent Activity', span: 3 },
  ],

  terminology: {
    project: 'Academic Project',
    projects: 'Academic Projects',
    milestone: 'Assignment Phase',
    milestones: 'Assignment Phases',
    task: 'Study Task',
    tasks: 'Study Tasks',
    note: 'Learning Note',
    notes: 'Learning Notes',
    calendar_event: 'Academic Event',
    deadline: 'Exam / Deadline',
    progress: 'Study Progress',
  },

  emptyStates: {
    tasks: {
      icon: 'CheckSquare',
      title: 'No study tasks yet',
      description: 'Add your first study task to get started.',
      actionLabel: 'New Task',
    },
    projects: {
      icon: 'FolderKanban',
      title: 'No academic projects yet',
      description: 'Start a new project or import one from your assignments.',
      actionLabel: 'New Academic Project',
    },
    notes: {
      icon: 'FileText',
      title: 'No learning notes yet',
      description: "Capture what you're studying — concepts, summaries, questions.",
      actionLabel: 'New Learning Note',
    },
    calendar: {
      icon: 'Calendar',
      title: 'No events scheduled',
      description: 'Add exam dates, submission deadlines, or study blocks.',
      actionLabel: 'Add Event',
    },
  },

  firstAiPrompt: 'Create a realistic study and project plan from my current priorities.',
};
