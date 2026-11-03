import { api } from './api';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task';
import type {
  Project,
  ProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
} from '../types/project';
import type { DashboardSummary } from '../types/dashboard';
import type {
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '../types/calendar';
import type { Note, CreateNoteRequest } from '../types/aiProposal';

export interface TaskQueryOptions {
  status?: string;
  project_id?: number;
  page?: number;
  page_size?: number;
  signal?: AbortSignal;
}

export interface ProjectQueryOptions {
  page?: number;
  page_size?: number;
  signal?: AbortSignal;
}

export interface CalendarEventQueryOptions {
  start?: string;
  end?: string;
  signal?: AbortSignal;
}

export const tasksApi = {
  get: (
    role?: string | (TaskQueryOptions & { role?: string }),
    options?: TaskQueryOptions | AbortSignal
  ): Promise<Task[]> => {
    let params: Record<string, unknown> = {};
    let signal: AbortSignal | undefined;

    if (typeof role === 'object' && role !== null) {
      const { signal: s, ...rest } = role;
      params = { ...rest };
      signal = s;
    } else if (typeof role === 'string') {
      params.role = role;
    }

    if (options instanceof AbortSignal) {
      signal = options;
    } else if (options && typeof options === 'object') {
      const { signal: s, ...rest } = options;
      params = { ...params, ...rest };
      if (s) signal = s;
    }

    return api.get<Task[]>('/tasks', { params, signal });
  },

  getPaginated: (
    role?: string | (TaskQueryOptions & { role?: string }),
    options?: TaskQueryOptions | AbortSignal
  ): Promise<{ data: Task[]; total: number }> => {
    let params: Record<string, unknown> = {};
    let signal: AbortSignal | undefined;

    if (typeof role === 'object' && role !== null) {
      const { signal: s, ...rest } = role;
      params = { ...rest };
      signal = s;
    } else if (typeof role === 'string') {
      params.role = role;
    }

    if (options instanceof AbortSignal) {
      signal = options;
    } else if (options && typeof options === 'object') {
      const { signal: s, ...rest } = options;
      params = { ...params, ...rest };
      if (s) signal = s;
    }

    return api.getWithMeta<Task[]>('/tasks', { params, signal });
  },

  create: (data: CreateTaskRequest): Promise<Task> => api.post<Task>('/tasks', data),

  update: (id: number, data: UpdateTaskRequest): Promise<Task> =>
    api.patch<Task>(`/tasks/${id}`, data),

  delete: (id: number): Promise<void> => api.delete(`/tasks/${id}`),
};

export const projectsApi = {
  get: (
    role?: string | (ProjectQueryOptions & { role?: string }),
    options?: ProjectQueryOptions | AbortSignal
  ): Promise<Project[]> => {
    let params: Record<string, unknown> = {};
    let signal: AbortSignal | undefined;

    if (typeof role === 'object' && role !== null) {
      const { signal: s, ...rest } = role;
      params = { ...rest };
      signal = s;
    } else if (typeof role === 'string') {
      params.role = role;
    }

    if (options instanceof AbortSignal) {
      signal = options;
    } else if (options && typeof options === 'object') {
      const { signal: s, ...rest } = options;
      params = { ...params, ...rest };
      if (s) signal = s;
    }

    return api.get<Project[]>('/projects', { params, signal });
  },

  getPaginated: (
    role?: string | (ProjectQueryOptions & { role?: string }),
    options?: ProjectQueryOptions | AbortSignal
  ): Promise<{ data: Project[]; total: number }> => {
    let params: Record<string, unknown> = {};
    let signal: AbortSignal | undefined;

    if (typeof role === 'object' && role !== null) {
      const { signal: s, ...rest } = role;
      params = { ...rest };
      signal = s;
    } else if (typeof role === 'string') {
      params.role = role;
    }

    if (options instanceof AbortSignal) {
      signal = options;
    } else if (options && typeof options === 'object') {
      const { signal: s, ...rest } = options;
      params = { ...params, ...rest };
      if (s) signal = s;
    }

    return api.getWithMeta<Project[]>('/projects', { params, signal });
  },

  getById: (id: number, signal?: AbortSignal): Promise<ProjectDetail> =>
    api.get<ProjectDetail>(`/projects/${id}`, { signal }),

  create: (data: CreateProjectRequest): Promise<Project> => api.post<Project>('/projects', data),

  update: (id: number, data: UpdateProjectRequest): Promise<Project> =>
    api.patch<Project>(`/projects/${id}`, data),

  delete: (id: number): Promise<void> => api.delete(`/projects/${id}`),
};

export const milestonesApi = {
  get: (projectId?: number, signal?: AbortSignal): Promise<Milestone[]> =>
    api.get<Milestone[]>('/milestones', {
      params: projectId ? { project_id: projectId } : undefined,
      signal,
    }),

  create: (data: CreateMilestoneRequest): Promise<Milestone> =>
    api.post<Milestone>('/milestones', data),

  update: (id: number, data: UpdateMilestoneRequest): Promise<Milestone> =>
    api.patch<Milestone>(`/milestones/${id}`, data),

  delete: (id: number): Promise<void> => api.delete(`/milestones/${id}`),
};

export const dashboardApi = {
  getSummary: (role: string, signal?: AbortSignal): Promise<DashboardSummary> =>
    api.get<DashboardSummary>('/dashboard/summary', { params: { role }, signal }),
};

export const calendarApi = {
  getEvents: (role?: string, options?: CalendarEventQueryOptions): Promise<CalendarEvent[]> =>
    api.get<CalendarEvent[]>('/calendar/events', {
      params: { role, start: options?.start, end: options?.end },
      signal: options?.signal,
    }),

  createEvent: (data: CreateCalendarEventRequest): Promise<CalendarEvent> =>
    api.post<CalendarEvent>('/calendar/events', data),

  updateEvent: (id: number, data: UpdateCalendarEventRequest): Promise<CalendarEvent> =>
    api.patch<CalendarEvent>(`/calendar/events/${id}`, data),

  deleteEvent: (id: number): Promise<void> => api.delete(`/calendar/events/${id}`),
};

export const notesApi = {
  get: (projectId?: number, role?: string, signal?: AbortSignal): Promise<Note[]> =>
    api.get<Note[]>('/notes', { params: { project_id: projectId, role }, signal }),

  create: (data: CreateNoteRequest): Promise<Note> => api.post<Note>('/notes', data),

  update: (id: number, data: Partial<CreateNoteRequest>): Promise<Note> =>
    api.patch<Note>(`/notes/${id}`, data),

  delete: (id: number): Promise<void> => api.delete(`/notes/${id}`),
};

export const apiClient = {
  tasks: tasksApi,
  projects: projectsApi,
  milestones: milestonesApi,
  dashboard: dashboardApi,
  calendar: calendarApi,
  notes: notesApi,
};

export default apiClient;
