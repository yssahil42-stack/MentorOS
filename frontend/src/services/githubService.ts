import { api } from './api';
import type {
  GitRepository,
  GitIssue,
  GitPullRequest,
  GitCommit,
  GitMilestone,
  SyncSettings,
  SyncLog,
  ConnectRepositoryRequest,
  ConnectRepositoryResponse,
  TriggerSyncRequest,
  TriggerSyncResponse,
  MapIssueToTaskRequest,
  MapPRToTaskRequest,
  CreateTaskFromIssueRequest,
  CreateTaskFromPRRequest,
} from '../types/github';

// ─── GitHub/GitLab API Service ────────────────────────────────────────────────

// Repository Management
export function fetchRepositories(
  signalOrContext?: AbortSignal | { signal?: AbortSignal }
): Promise<GitRepository[]> {
  const signal = signalOrContext instanceof AbortSignal ? signalOrContext : signalOrContext?.signal;
  return api.get<GitRepository[]>('/git/repositories', { signal });
}

export function fetchRepository(id: number, signal?: AbortSignal): Promise<GitRepository> {
  return api.get<GitRepository>(`/git/repositories/${id}`, { signal });
}

export function connectRepository(
  data: ConnectRepositoryRequest
): Promise<ConnectRepositoryResponse> {
  return api.post<ConnectRepositoryResponse>('/git/repositories', data);
}

export function updateRepository(id: number, data: Partial<GitRepository>): Promise<GitRepository> {
  return api.patch<GitRepository>(`/git/repositories/${id}`, data);
}

export function disconnectRepository(id: number): Promise<void> {
  return api.delete(`/git/repositories/${id}`);
}

// Sync Settings
export function fetchSyncSettings(
  repositoryId: number,
  signal?: AbortSignal
): Promise<SyncSettings> {
  return api.get<SyncSettings>(`/git/repositories/${repositoryId}/sync-settings`, { signal });
}

export function updateSyncSettings(
  repositoryId: number,
  settings: Partial<SyncSettings>
): Promise<SyncSettings> {
  return api.patch<SyncSettings>(`/git/repositories/${repositoryId}/sync-settings`, settings);
}

// Sync Operations
export function triggerSync(data: TriggerSyncRequest): Promise<TriggerSyncResponse> {
  return api.post<TriggerSyncResponse>('/git/sync', data);
}

export function fetchSyncLogs(
  repositoryId: number,
  params?: { limit?: number; offset?: number },
  signal?: AbortSignal
): Promise<SyncLog[]> {
  return api.get<SyncLog[]>(`/git/repositories/${repositoryId}/sync-logs`, { params, signal });
}

// Issues
export function fetchIssues(
  repositoryId: number,
  params?: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    assignee?: string;
    milestone?: string;
    page?: number;
    per_page?: number;
  },
  signal?: AbortSignal
): Promise<GitIssue[]> {
  return api.get<GitIssue[]>(`/git/repositories/${repositoryId}/issues`, { params, signal });
}

export function fetchIssue(
  repositoryId: number,
  issueId: number,
  signal?: AbortSignal
): Promise<GitIssue> {
  return api.get<GitIssue>(`/git/repositories/${repositoryId}/issues/${issueId}`, { signal });
}

export function mapIssueToTask(data: MapIssueToTaskRequest): Promise<GitIssue> {
  return api.post<GitIssue>('/git/issues/map-task', data);
}

export function createTaskFromIssue(
  data: CreateTaskFromIssueRequest
): Promise<{ task_id: number }> {
  return api.post<{ task_id: number }>('/git/issues/create-task', data);
}

export function unmapIssueFromTask(issueId: number): Promise<GitIssue> {
  return api.delete<GitIssue>(`/git/issues/${issueId}/unmap-task`);
}

// Pull Requests
export function fetchPullRequests(
  repositoryId: number,
  params?: {
    state?: 'open' | 'closed' | 'merged' | 'all';
    head_branch?: string;
    base_branch?: string;
    page?: number;
    per_page?: number;
  },
  signal?: AbortSignal
): Promise<GitPullRequest[]> {
  return api.get<GitPullRequest[]>(`/git/repositories/${repositoryId}/pull-requests`, {
    params,
    signal,
  });
}

export function fetchPullRequest(
  repositoryId: number,
  prId: number,
  signal?: AbortSignal
): Promise<GitPullRequest> {
  return api.get<GitPullRequest>(`/git/repositories/${repositoryId}/pull-requests/${prId}`, {
    signal,
  });
}

export function mapPRToTask(data: MapPRToTaskRequest): Promise<GitPullRequest> {
  return api.post<GitPullRequest>('/git/pull-requests/map-task', data);
}

export function createTaskFromPR(data: CreateTaskFromPRRequest): Promise<{ task_id: number }> {
  return api.post<{ task_id: number }>('/git/pull-requests/create-task', data);
}

export function unmapPRFromTask(prId: number): Promise<GitPullRequest> {
  return api.delete<GitPullRequest>(`/git/pull-requests/${prId}/unmap-task`);
}

// Milestones
export function fetchMilestones(
  repositoryId: number,
  params?: {
    state?: 'open' | 'closed' | 'all';
  },
  signal?: AbortSignal
): Promise<GitMilestone[]> {
  return api.get<GitMilestone[]>(`/git/repositories/${repositoryId}/milestones`, {
    params,
    signal,
  });
}

export function createMilestone(
  repositoryId: number,
  data: {
    title: string;
    description?: string;
    due_on?: string;
  }
): Promise<GitMilestone> {
  return api.post<GitMilestone>(`/git/repositories/${repositoryId}/milestones`, data);
}

export function updateMilestone(
  repositoryId: number,
  milestoneId: number,
  data: {
    title?: string;
    description?: string;
    state?: 'open' | 'closed';
    due_on?: string;
  }
): Promise<GitMilestone> {
  return api.patch<GitMilestone>(
    `/git/repositories/${repositoryId}/milestones/${milestoneId}`,
    data
  );
}

// Commits
export function fetchCommits(
  repositoryId: number,
  params?: {
    since?: string;
    until?: string;
    author?: string;
    page?: number;
    per_page?: number;
  }
): Promise<GitCommit[]> {
  return api.get<GitCommit[]>(`/git/repositories/${repositoryId}/commits`, { params });
}

// Webhooks
export function registerWebhook(repositoryId: number): Promise<{ url: string; secret: string }> {
  return api.post<{ url: string; secret: string }>(`/git/repositories/${repositoryId}/webhook`);
}

export function deleteWebhook(repositoryId: number): Promise<void> {
  return api.delete(`/git/repositories/${repositoryId}/webhook`);
}

// OAuth
export function getOAuthUrl(
  provider: 'github' | 'gitlab',
  redirectUri: string
): Promise<{ url: string }> {
  return api.get<{ url: string }>(`/git/oauth/${provider}`, {
    params: { redirect_uri: redirectUri },
  });
}

export function exchangeCode(
  provider: 'github' | 'gitlab',
  code: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope: string;
}> {
  return api.post(`/git/oauth/${provider}/exchange`, { code });
}
