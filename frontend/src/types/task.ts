// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus   = 'todo' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  user_id: number;
  role: string;
  project_id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;        // ISO date string
  estimated_minutes?: number;
  actual_minutes?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Populated joins
  project_title?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  project_id?: number;
  priority?: TaskPriority;
  due_date?: string;
  estimated_minutes?: number;
  role?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  project_id?: number;
}
