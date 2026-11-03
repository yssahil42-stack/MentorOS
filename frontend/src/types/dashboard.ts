// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardSummary {
  role: string;
  // Shared metrics
  active_projects: number;
  open_tasks: number;
  overdue_tasks: number;
  upcoming_events: number;
  // Today
  todays_tasks: import('./task').Task[];
  // Role-specific summaries
  role_summary: StudentSummary | FreelancerSummary | DeveloperSummary | JobSeekerSummary;
  // Daily Standup & Focus Brief
  daily_standup?: DailyStandupData;
  // AI suggestion
  ai_suggestion?: AISuggestion;
  // Recent activity
  recent_activity: ActivityItem[];
}

export interface StudentSummary {
  upcoming_exams: number;
  due_assignments: number;
  study_hours_this_week: number;
  active_academic_projects: number;
  next_deadline_title?: string;
  next_deadline_date?: string;
}

export interface FreelancerSummary {
  deliverables_due_this_week: number;
  active_engagements: number;
  work_hours_available: number;
  next_delivery_title?: string;
  next_delivery_date?: string;
}

export interface DeveloperSummary {
  active_build_projects: number;
  open_implementation_tasks: number;
  milestones_this_week: number;
  current_milestone_title?: string;
  target_date?: string;
}

export interface JobSeekerSummary {
  applications_pending: number;
  interviews_upcoming: number;
  portfolio_tasks_remaining: number;
  next_interview_title?: string;
  next_interview_date?: string;
}

export interface AISuggestion {
  id: string;
  text: string;
  prompt_starter: string;
  context_type: string;
}

export interface ActivityItem {
  id: number;
  action_type: string;
  entity_type: string;
  entity_title: string;
  entity_id: number;
  created_at: string;
}

export interface StandupCompletedTask {
  id: number;
  title: string;
  project_title?: string | null;
  completed_at?: string | null;
  is_yesterday: boolean;
}

export interface StandupScheduledEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  event_type: string;
  project_title?: string | null;
}

export interface StandupTaskDueToday {
  id: number;
  title: string;
  project_title?: string | null;
  priority: string;
}

export interface StandupNextMilestone {
  id: number;
  title: string;
  project_id?: number | null;
  project_title?: string | null;
  target_date?: string | null;
  status: string;
  days_remaining?: number | null;
}

export interface DailyStandupData {
  yesterday_completed: StandupCompletedTask[];
  today_scheduled: StandupScheduledEvent[];
  tasks_due_today: StandupTaskDueToday[];
  next_milestone?: StandupNextMilestone | null;
  date_today: string;
  date_yesterday: string;
}
