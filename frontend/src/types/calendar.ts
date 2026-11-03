// ─── Calendar Events ─────────────────────────────────────────────────────────

export type CalendarEventType =
  // Student
  | 'exam' | 'assignment_deadline' | 'study_block' | 'lecture'
  // Freelancer
  | 'delivery_deadline' | 'client_review' | 'work_block'
  // Developer
  | 'milestone_target' | 'build_block' | 'release'
  // Job Seeker
  | 'interview' | 'application_deadline' | 'follow_up' | 'prep_session'
  // Common
  | 'meeting' | 'other';

export interface CalendarEvent {
  id: number;
  user_id: number;
  role: string;
  task_id?: number;
  project_id?: number;
  title: string;
  description?: string;
  start_at: string;     // ISO datetime
  end_at: string;       // ISO datetime
  all_day?: boolean;
  event_type: CalendarEventType;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  event_type: CalendarEventType;
  task_id?: number;
  project_id?: number;
  role?: string;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
  event_type?: CalendarEventType;
}

export type CalendarView = 'month' | 'week' | 'agenda';
