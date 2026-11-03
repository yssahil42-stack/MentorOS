// ─── AI Proposal Types ───────────────────────────────────────────────────────

export type AIProposalStatus = 'pending' | 'approved' | 'rejected' | 'draft';
export type AIProposalItemType = 'project' | 'milestone' | 'task' | 'calendar_event' | 'note';

// The structured JSON schema HuggingFaceTB/SmolLM2-1.7B-Instruct must produce
export interface AIProposalPayload {
  summary: string;
  projects?: AIProposedProject[];
  milestones?: AIProposedMilestone[];
  tasks?: AIProposedTask[];
  calendar_events?: AIProposedCalendarEvent[];
  notes?: AIProposedNote[];
}

export interface AIProposedProject {
  title: string;
  description?: string;
  target_date?: string;
  priority?: string;
}

export interface AIProposedMilestone {
  project_title: string;
  title: string;
  description?: string;
  target_date?: string;
}

export interface AIProposedTask {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  estimated_minutes?: number;
  project_title?: string;
}

export interface AIProposedCalendarEvent {
  title: string;
  start_at: string;
  end_at: string;
  event_type?: string;
  all_day?: boolean;
}

export interface AIProposedNote {
  title: string;
  content: string;
}

// ─── Persisted Proposal (from API) ───────────────────────────────────────────

export interface AIProposalItem {
  id: number;
  proposal_id: number;
  item_type: AIProposalItemType;
  payload: AIProposedProject | AIProposedMilestone | AIProposedTask | AIProposedCalendarEvent | AIProposedNote;
  // UI-only state (not from API, managed locally during review)
  selected?: boolean;
  // Overrides the user can edit before approving
  edited_payload?: Record<string, unknown>;
  approved: boolean;
  persisted_record_id?: number;
}

export interface AIProposal {
  id: number;
  user_id: number;
  role: string;
  request_text: string;
  summary: string;
  status: AIProposalStatus;
  items: AIProposalItem[];
  created_at: string;
}

export interface CreateProposalRequest {
  request_text: string;
  context_type?: string;
}

export interface ApproveProposalRequest {
  approved_item_ids: number[];
  item_overrides?: Record<number, Record<string, unknown>>;
}

export interface ApprovalResult {
  created_tasks: import('./task').Task[];
  created_projects: import('./project').Project[];
  created_milestones: import('./project').Milestone[];
  created_events: import('./calendar').CalendarEvent[];
  created_notes: Note[];
}

export interface Note {
  id: number;
  user_id: number;
  role: string;
  project_id?: number;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  project_id?: number;
  is_pinned?: boolean;
  role?: string;
}
