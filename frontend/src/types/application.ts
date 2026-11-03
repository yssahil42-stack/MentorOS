export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export type WorkplaceType = 'remote' | 'hybrid' | 'onsite';

export type ReminderType = 'follow_up_7d' | 'follow_up_14d';

export interface ApplicationReminder {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  type: ReminderType;
  dueDate: string; // ISO date string
  daysElapsed: number;
  message: string;
  dismissed: boolean;
}

export interface InterviewStage {
  id: string;
  stageName: string; // e.g. "Recruiter Screen", "Technical Assessment", "System Design", "Onsite Final"
  date: string;
  interviewer?: string;
  notes?: string;
  completed: boolean;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  workplaceType: WorkplaceType;
  status: ApplicationStatus;
  appliedDate: string | null; // YYYY-MM-DD or ISO string
  salaryRange?: string; // e.g. "$130k - $160k"
  url?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  interviewStages?: InterviewStage[];
  lastActivityDate: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  location?: string;
  workplaceType?: WorkplaceType;
  status?: ApplicationStatus;
  appliedDate?: string | null;
  salaryRange?: string;
  url?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

export interface ApplicationMetrics {
  total: number;
  saved: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  responseRate: number; // percentage
  pendingRemindersCount: number;
}
