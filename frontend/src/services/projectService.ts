import { api } from './api';
import { projectsApi, milestonesApi, type MilestoneQueryOptions } from './apiClient';
import type {
  Project,
  ProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
} from '../types/project';

export function fetchProjects(
  params?: string | { role?: string; page?: number; page_size?: number },
  signal?: AbortSignal
): Promise<Project[]> {
  const queryParams = typeof params === 'string' ? { role: params } : params;
  return projectsApi.get(queryParams, signal);
}

export function fetchProjectsPaginated(
  params?: { role?: string; page?: number; page_size?: number },
  signal?: AbortSignal
): Promise<{ data: Project[]; total: number }> {
  return projectsApi.getPaginated(params, signal);
}

export function fetchProject(id: number, signal?: AbortSignal): Promise<ProjectDetail> {
  return projectsApi.getById(id, signal);
}

export function createProject(data: CreateProjectRequest): Promise<Project> {
  return projectsApi.create(data);
}

export function updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
  return projectsApi.update(id, data);
}

export function deleteProject(id: number): Promise<void> {
  return projectsApi.delete(id);
}

export function fetchMilestones(
  params?: number | MilestoneQueryOptions,
  signal?: AbortSignal
): Promise<Milestone[]> {
  return milestonesApi.get(params, signal);
}

export function createMilestone(data: CreateMilestoneRequest): Promise<Milestone> {
  return milestonesApi.create(data);
}

export function updateMilestone(id: number, data: UpdateMilestoneRequest): Promise<Milestone> {
  return milestonesApi.update(id, data);
}

export function deleteMilestone(id: number): Promise<void> {
  return milestonesApi.delete(id);
}

export function fetchPublicClientPortal(
  projectId: number,
  token?: string,
  signal?: AbortSignal
): Promise<{ project: Project; milestones: Milestone[]; tasks: any[] }> {
  return api.get(`/client-portal/${projectId}`, {
    params: token ? { token } : undefined,
    signal,
  });
}
