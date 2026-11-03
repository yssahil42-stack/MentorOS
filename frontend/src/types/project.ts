// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: number;
  user_id: number;
  role: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  target_date?: string | null;
  progress: number; // 0–100
  milestone_count?: number;
  completed_milestone_count?: number;
  task_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  tasks: import('./task').Task[];
}

export interface CreateProjectRequest {
  title: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  target_date?: string | null;
  role?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  target_date?: string | null;
  progress?: number;
}

// ─── Milestones ──────────────────────────────────────────────────────────────

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface Milestone {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  target_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneRequest {
  project_id: number;
  title: string;
  description?: string;
  target_date?: string;
  role?: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  status?: MilestoneStatus;
  target_date?: string;
}
