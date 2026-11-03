import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  tasksApi,
  projectsApi,
  milestonesApi,
  dashboardApi,
  calendarApi,
  notesApi,
} from '../../services/apiClient';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    getWithMeta: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('apiClient explicit services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tasksApi', () => {
    it('calls api.get with explicit role parameter', async () => {
      (api.get as any).mockResolvedValueOnce([{ id: 1, title: 'Task 1' }]);

      const res = await tasksApi.get('student');
      expect(api.get).toHaveBeenCalledWith('/tasks', {
        params: { role: 'student' },
        signal: undefined,
      });
      expect(res).toEqual([{ id: 1, title: 'Task 1' }]);
    });

    it('forwards AbortSignal and additional options to api.get', async () => {
      const controller = new AbortController();
      (api.get as any).mockResolvedValueOnce([]);

      await tasksApi.get('developer', { status: 'todo', signal: controller.signal });
      expect(api.get).toHaveBeenCalledWith('/tasks', {
        params: { role: 'developer', status: 'todo' },
        signal: controller.signal,
      });
    });

    it('creates, updates, and deletes tasks explicitly', async () => {
      (api.post as any).mockResolvedValueOnce({ id: 2, title: 'New Task' });
      (api.patch as any).mockResolvedValueOnce({ id: 2, status: 'completed' });
      (api.delete as any).mockResolvedValueOnce(undefined);

      const created = await tasksApi.create({
        title: 'New Task',
        role: 'student',
        priority: 'high',
      });
      expect(api.post).toHaveBeenCalledWith('/tasks', {
        title: 'New Task',
        role: 'student',
        priority: 'high',
      });
      expect(created.id).toBe(2);

      const updated = await tasksApi.update(2, { status: 'completed' });
      expect(api.patch).toHaveBeenCalledWith('/tasks/2', { status: 'completed' });
      expect(updated.status).toBe('completed');

      await tasksApi.delete(2);
      expect(api.delete).toHaveBeenCalledWith('/tasks/2');
    });
  });

  describe('projectsApi & milestonesApi', () => {
    it('fetches projects with role parameter', async () => {
      (api.get as any).mockResolvedValueOnce([{ id: 10, title: 'Project 1' }]);

      const res = await projectsApi.get('freelancer');
      expect(api.get).toHaveBeenCalledWith('/projects', {
        params: { role: 'freelancer' },
        signal: undefined,
      });
      expect(res).toEqual([{ id: 10, title: 'Project 1' }]);
    });

    it('fetches project by id', async () => {
      (api.get as any).mockResolvedValueOnce({
        id: 10,
        title: 'Project 1',
        milestones: [],
        tasks: [],
      });

      await projectsApi.getById(10);
      expect(api.get).toHaveBeenCalledWith('/projects/10', { signal: undefined });
    });

    it('fetches milestones for a project', async () => {
      (api.get as any).mockResolvedValueOnce([{ id: 5, title: 'Phase 1' }]);

      await milestonesApi.get(10);
      expect(api.get).toHaveBeenCalledWith('/milestones', {
        params: { project_id: 10 },
        signal: undefined,
      });
    });
  });

  describe('dashboardApi', () => {
    it('fetches dashboard summary with role', async () => {
      (api.get as any).mockResolvedValueOnce({ role: 'student', active_projects: 3 });

      await dashboardApi.getSummary('student');
      expect(api.get).toHaveBeenCalledWith('/dashboard/summary', {
        params: { role: 'student' },
        signal: undefined,
      });
    });
  });

  describe('calendarApi and notesApi', () => {
    it('fetches calendar events with role', async () => {
      (api.get as any).mockResolvedValueOnce([]);

      await calendarApi.getEvents('student', { start: '2026-11-01', end: '2026-11-30' });
      expect(api.get).toHaveBeenCalledWith('/calendar/events', {
        params: { role: 'student', start: '2026-11-01', end: '2026-11-30' },
        signal: undefined,
      });
    });

    it('fetches notes with role and project', async () => {
      (api.get as any).mockResolvedValueOnce([]);

      await notesApi.get(12, 'developer');
      expect(api.get).toHaveBeenCalledWith('/notes', {
        params: { project_id: 12, role: 'developer' },
        signal: undefined,
      });
    });
  });
});
