import { api } from './api';
import type {
  Project,
  ProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
} from '../types/project';

export function fetchProjects(role?: string): Promise<Project[]> {
  return api.get<Project[]>('/projects', { params: role ? { role } : undefined });
}

export function fetchProject(id: number): Promise<ProjectDetail> {
  return api.get<ProjectDetail>(`/projects/${id}`);
}

export function createProject(data: CreateProjectRequest): Promise<Project> {
  return api.post<Project>('/projects', data);
}

export function updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
  return api.patch<Project>(`/projects/${id}`, data);
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export function fetchMilestones(projectId?: number): Promise<Milestone[]> {
  return api.get<Milestone[]>('/milestones', { params: { project_id: projectId } });
}

export function createMilestone(data: CreateMilestoneRequest): Promise<Milestone> {
  return api.post<Milestone>('/milestones', data);
}

export function updateMilestone(id: number, data: UpdateMilestoneRequest): Promise<Milestone> {
  return api.patch<Milestone>(`/milestones/${id}`, data);
}

export async function deleteMilestone(id: number): Promise<void> {
  await api.delete(`/milestones/${id}`);
}
