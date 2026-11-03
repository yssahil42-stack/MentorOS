import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../../services/api';
import {
  fetchRepositories,
  fetchRepository,
  connectRepository,
  updateRepository,
  disconnectRepository,
  fetchSyncSettings,
  updateSyncSettings,
  triggerSync,
  fetchSyncLogs,
  fetchIssues,
  fetchPullRequests,
  fetchCommits,
  mapIssueToTask,
  mapPRToTask,
  createTaskFromIssue,
  createTaskFromPR,
  fetchMilestones,
} from '../../../services/githubService';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('githubService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Repository Management', () => {
    it('fetchRepositories queries /git/repositories', async () => {
      const mockRepos = [{ id: 1, name: 'mentoros', full_name: 'org/mentoros' }];
      (api.get as any).mockResolvedValueOnce(mockRepos);

      const result = await fetchRepositories();
      expect(api.get).toHaveBeenCalledWith('/git/repositories', { signal: undefined });
      expect(result).toEqual(mockRepos);
    });

    it('fetchRepository queries /git/repositories/:id', async () => {
      const mockRepo = { id: 42, name: 'api-service' };
      (api.get as any).mockResolvedValueOnce(mockRepo);

      const result = await fetchRepository(42);
      expect(api.get).toHaveBeenCalledWith('/git/repositories/42', { signal: undefined });
      expect(result).toEqual(mockRepo);
    });

    it('connectRepository posts to /git/repositories', async () => {
      const payload = {
        provider: 'github' as const,
        repository_url: 'https://github.com/org/repo',
        access_token: 'ghp_secret',
      };
      const mockResponse = { repository: { id: 1, name: 'repo' }, message: 'Connected' };
      (api.post as any).mockResolvedValueOnce(mockResponse);

      const result = await connectRepository(payload);
      expect(api.post).toHaveBeenCalledWith('/git/repositories', payload);
      expect(result).toEqual(mockResponse);
    });

    it('updateRepository patches /git/repositories/:id', async () => {
      const updateData = { default_branch: 'main' };
      (api.patch as any).mockResolvedValueOnce({ id: 10, default_branch: 'main' });

      const result = await updateRepository(10, updateData);
      expect(api.patch).toHaveBeenCalledWith('/git/repositories/10', updateData);
      expect(result.default_branch).toBe('main');
    });

    it('disconnectRepository deletes /git/repositories/:id', async () => {
      (api.delete as any).mockResolvedValueOnce(undefined);

      await disconnectRepository(99);
      expect(api.delete).toHaveBeenCalledWith('/git/repositories/99');
    });
  });

  describe('Sync Settings & Triggers', () => {
    it('fetchSyncSettings queries sync settings endpoint', async () => {
      const mockSettings = { auto_sync: true, sync_interval: 15 };
      (api.get as any).mockResolvedValueOnce(mockSettings);

      const result = await fetchSyncSettings(5);
      expect(api.get).toHaveBeenCalledWith('/git/repositories/5/sync-settings', {
        signal: undefined,
      });
      expect(result).toEqual(mockSettings);
    });

    it('updateSyncSettings patches sync settings', async () => {
      const patchData = { sync_interval: 30 };
      (api.patch as any).mockResolvedValueOnce({ auto_sync: true, sync_interval: 30 });

      const result = await updateSyncSettings(5, patchData);
      expect(api.patch).toHaveBeenCalledWith('/git/repositories/5/sync-settings', patchData);
      expect(result.sync_interval).toBe(30);
    });

    it('triggerSync posts to trigger endpoint', async () => {
      const mockSyncResponse = { sync_id: 'sync-123', status: 'started' };
      (api.post as any).mockResolvedValueOnce(mockSyncResponse);

      const result = await triggerSync({ repository_id: 8, sync_type: 'all' });
      expect(api.post).toHaveBeenCalledWith('/git/sync', { repository_id: 8, sync_type: 'all' });
      expect(result).toEqual(mockSyncResponse);
    });

    it('fetchSyncLogs queries logs endpoint with parameters', async () => {
      const mockLogs = [{ id: 1, status: 'success' }];
      (api.get as any).mockResolvedValueOnce(mockLogs);

      const result = await fetchSyncLogs(8, { limit: 20 });
      expect(api.get).toHaveBeenCalledWith('/git/repositories/8/sync-logs', {
        params: { limit: 20 },
        signal: undefined,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('Issues, PRs, Commits & Task Mapping', () => {
    it('fetchIssues queries repository issues with filters', async () => {
      const mockIssues = [{ id: 101, title: 'Bug in auth', state: 'open' }];
      (api.get as any).mockResolvedValueOnce(mockIssues);

      const result = await fetchIssues(3, { state: 'open' });
      expect(api.get).toHaveBeenCalledWith('/git/repositories/3/issues', {
        params: { state: 'open' },
        signal: undefined,
      });
      expect(result).toEqual(mockIssues);
    });

    it('fetchPullRequests queries repository PRs', async () => {
      const mockPRs = [{ id: 201, title: 'Add dark mode' }];
      (api.get as any).mockResolvedValueOnce(mockPRs);

      const result = await fetchPullRequests(3);
      expect(api.get).toHaveBeenCalledWith('/git/repositories/3/pull-requests', {
        params: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockPRs);
    });

    it('fetchCommits queries commits with parameters', async () => {
      const mockCommits = [{ sha: 'abc1234', message: 'feat: add kanban' }];
      (api.get as any).mockResolvedValueOnce(mockCommits);

      const result = await fetchCommits(3, { per_page: 50 });
      expect(api.get).toHaveBeenCalledWith('/git/repositories/3/commits', {
        params: { per_page: 50 },
      });
      expect(result).toEqual(mockCommits);
    });

    it('mapIssueToTask and mapPRToTask call mapping endpoints', async () => {
      (api.post as any).mockResolvedValue({ mapped: true });

      await mapIssueToTask({ issue_id: 101, task_id: 501 });
      expect(api.post).toHaveBeenCalledWith('/git/issues/map-task', {
        issue_id: 101,
        task_id: 501,
      });

      await mapPRToTask({ pr_id: 201, task_id: 501 });
      expect(api.post).toHaveBeenCalledWith('/git/pull-requests/map-task', {
        pr_id: 201,
        task_id: 501,
      });
    });

    it('createTaskFromIssue and createTaskFromPR call task creation endpoints', async () => {
      const mockTask = { task_id: 701 };
      (api.post as any).mockResolvedValue(mockTask);

      const issueResult = await createTaskFromIssue({ issue_id: 101, project_id: 10 });
      expect(api.post).toHaveBeenCalledWith('/git/issues/create-task', {
        issue_id: 101,
        project_id: 10,
      });
      expect(issueResult).toEqual(mockTask);

      const prResult = await createTaskFromPR({ pr_id: 201, project_id: 10 });
      expect(api.post).toHaveBeenCalledWith('/git/pull-requests/create-task', {
        pr_id: 201,
        project_id: 10,
      });
      expect(prResult).toEqual(mockTask);
    });

    it('fetchMilestones queries milestones endpoint', async () => {
      const mockMilestones = [{ id: 1, title: 'v1.0 Launch' }];
      (api.get as any).mockResolvedValueOnce(mockMilestones);

      const result = await fetchMilestones(4);
      expect(api.get).toHaveBeenCalledWith('/git/repositories/4/milestones', { signal: undefined });
      expect(result).toEqual(mockMilestones);
    });
  });
});
