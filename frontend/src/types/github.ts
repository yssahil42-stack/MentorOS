// ─── GitHub/GitLab Integration Types ───────────────────────────────────────────

export type GitProvider = 'github' | 'gitlab';

export interface GitRepository {
  id: number;
  user_id: number;
  provider: GitProvider;
  external_id: string; // GitHub/GitLab repo ID
  name: string;
  full_name: string; // owner/repo
  description?: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  language?: string;
  stars: number;
  forks: number;
  open_issues: number;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  // Sync settings
  sync_enabled: boolean;
  sync_issues: boolean;
  sync_prs: boolean;
  sync_milestones: boolean;
  issue_task_mapping: 'all' | 'labeled' | 'assigned';
  pr_task_mapping: 'all' | 'merged' | 'reviewed';
}

export interface GitIssue {
  id: number;
  repository_id: number;
  external_id: number; // GitHub/GitLab issue/PR number
  external_node_id?: string;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  type: 'issue' | 'pr';
  html_url: string;
  labels: GitLabel[];
  assignees: GitUser[];
  milestone?: GitMilestone;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Mapped task
  task_id?: number;
  last_sync_at?: string;
}

export interface GitLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitMilestone {
  id: number;
  title: string;
  description?: string;
  state: 'open' | 'closed';
  due_on?: string;
  created_at: string;
  updated_at: string;
}

export interface GitPullRequest {
  id: number;
  repository_id: number;
  external_id: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  head_branch: string;
  base_branch: string;
  draft: boolean;
  mergeable?: boolean;
  merged_at?: string;
  labels: GitLabel[];
  assignees: GitUser[];
  requested_reviewers: GitUser[];
  created_at: string;
  updated_at: string;
  // Mapped task
  task_id?: number;
  last_sync_at?: string;
}

export interface GitCommit {
  id: number;
  repository_id: number;
  sha: string;
  message: string;
  author: GitUser;
  committer?: GitUser;
  html_url: string;
  created_at: string;
  // Mapped task/note
  task_id?: number;
  note_id?: number;
}

export interface SyncSettings {
  repository_id: number;
  auto_sync: boolean;
  sync_interval: number; // minutes
  sync_issues: boolean;
  sync_prs: boolean;
  sync_commits: boolean;
  sync_milestones: boolean;
  issue_label_filter?: string[]; // Only sync issues with these labels
  pr_label_filter?: string[];
  create_tasks_for_issues: boolean;
  create_tasks_for_prs: boolean;
  close_task_on_issue_close: boolean;
  close_task_on_pr_merge: boolean;
  default_task_priority: 'low' | 'medium' | 'high' | 'urgent';
  default_task_project_id?: number;
}

export interface SyncLog {
  id: number;
  repository_id: number;
  type: 'full' | 'incremental' | 'webhook';
  status: 'success' | 'partial' | 'failed';
  items_synced: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface WebhookEvent {
  id: number;
  repository_id: number;
  event_type: string; // issues, pull_request, push, etc.
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  error?: string;
  created_at: string;
}

// API Request/Response types

export interface ConnectRepositoryRequest {
  provider: GitProvider;
  access_token: string;
  repository: string; // owner/repo
  sync_settings?: Partial<SyncSettings>;
}

export interface ConnectRepositoryResponse {
  repository: GitRepository;
  sync_settings: SyncSettings;
}

export interface TriggerSyncRequest {
  repository_id: number;
  type?: 'full' | 'incremental';
}

export interface TriggerSyncResponse {
  sync_log: SyncLog;
}

export interface MapIssueToTaskRequest {
  issue_id: number;
  task_id: number;
}

export interface MapPRToTaskRequest {
  pr_id: number;
  task_id: number;
}

export interface CreateTaskFromIssueRequest {
  issue_id: number;
  project_id?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface CreateTaskFromPRRequest {
  pr_id: number;
  project_id?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// UI State types

export interface GitSyncState {
  repositories: GitRepository[];
  selectedRepository: GitRepository | null;
  issues: GitIssue[];
  pullRequests: GitPullRequest[];
  commits: GitCommit[];
  milestones: GitMilestone[];
  syncLogs: SyncLog[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  error: string | null;
}

// Provider configs
export const GITHUB_API_BASE = 'https://api.github.com';
export const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

export const PROVIDER_CONFIGS: Record<
  GitProvider,
  { name: string; icon: string; color: string; authUrl: string }
> = {
  github: {
    name: 'GitHub',
    icon: 'github',
    color: '#24292e',
    authUrl: 'https://github.com/login/oauth/authorize',
  },
  gitlab: {
    name: 'GitLab',
    icon: 'gitlab',
    color: '#FC6D26',
    authUrl: 'https://gitlab.com/oauth/authorize',
  },
};

// Helper functions

export function getProviderDisplayName(provider: GitProvider): string {
  return PROVIDER_CONFIGS[provider].name;
}

export function getProviderColor(provider: GitProvider): string {
  return PROVIDER_CONFIGS[provider].color;
}

export function formatRepoName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  return { owner, repo };
}

export function getIssueStateColor(state: string): string {
  switch (state) {
    case 'open':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    case 'closed':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
  }
}

export function getPRStateColor(state: string): string {
  switch (state) {
    case 'open':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    case 'closed':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
    case 'merged':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
  }
}
