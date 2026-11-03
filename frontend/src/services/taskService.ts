import { tasksApi } from './apiClient';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task';

export function fetchTasks(
  params?: {
    status?: string;
    project_id?: number;
    role?: string;
    page?: number;
    page_size?: number;
  },
  signal?: AbortSignal
): Promise<Task[]> {
  return tasksApi.get(params, signal);
}

export function fetchTasksPaginated(
  params?: {
    status?: string;
    project_id?: number;
    role?: string;
    page?: number;
    page_size?: number;
  },
  signal?: AbortSignal
): Promise<{ data: Task[]; total: number }> {
  return tasksApi.getPaginated(params, signal);
}

export function createTask(data: CreateTaskRequest): Promise<Task> {
  return tasksApi.create(data);
}

export function updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
  return tasksApi.update(id, data);
}

export function deleteTask(id: number): Promise<void> {
  return tasksApi.delete(id);
}
