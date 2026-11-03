import { api } from './api';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task';

export function fetchTasks(params?: { status?: string; project_id?: number; role?: string }): Promise<Task[]> {
  return api.get<Task[]>('/tasks', { params });
}

export function createTask(data: CreateTaskRequest): Promise<Task> {
  return api.post<Task>('/tasks', data);
}

export function updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}`, data);
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
