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
