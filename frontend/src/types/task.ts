// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  user_id: number;
  role: string;
  project_id?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null; // ISO date string
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Populated joins
  project_title?: string | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  project_id?: number | null;
  priority?: TaskPriority;
  due_date?: string | null;
  estimated_minutes?: number | null;
  role?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  project_id?: number | null;
}
