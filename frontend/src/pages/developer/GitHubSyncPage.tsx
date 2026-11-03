import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2,
  GitBranch,
  GitPullRequest as GitPullRequestIcon,
  GitCommit,
  GitCompare,
  Plus,
  Settings,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  Key,
  ToggleLeft,
  ToggleRight,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  Zap,
  Bell,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects } from '../../services/projectService';
import {
  fetchRepositories,
  fetchRepository,
  connectRepository,
  disconnectRepository,
  fetchSyncSettings,
  updateSyncSettings,
  triggerSync,
  fetchSyncLogs,
  fetchIssues,
  fetchPullRequests,
  fetchMilestones,
  mapIssueToTask,
  createTaskFromIssue,
  mapPRToTask,
  createTaskFromPR,
  registerWebhook,
} from '../../services/githubService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ToastContainer } from '../../components/ui/ToastContainer';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import type {
  GitRepository,
  GitIssue,
  GitPullRequest,
  GitMilestone,
  SyncSettings,
  SyncLog,
  ConnectRepositoryRequest,
} from '../../types/github';

export default function GitHubSyncPage() {
  const { showToast, openCaptureModal } = useWorkspace();
  const queryClient = useQueryClient();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'repos' | 'issues' | 'prs' | 'settings' | 'logs'>(
    'repos'
  );
  const [selectedRepo, setSelectedRepo] = useState<GitRepository | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [connectForm, setConnectForm] = useState<ConnectRepositoryRequest>({
    provider: 'github',
    access_token: '',
    repository: '',
    sync_settings: {
      auto_sync: true,
      sync_interval: 15,
      sync_issues: true,
      sync_prs: true,
      sync_commits: false,
      sync_milestones: true,
      create_tasks_for_issues: true,
      create_tasks_for_prs: true,
      close_task_on_issue_close: true,
      close_task_on_pr_merge: true,
      default_task_priority: 'medium',
    },
  });
  const [settingsForm, setSettingsForm] = useState<Partial<SyncSettings>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [issuesFilter, setIssuesFilter] = useState<{
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
  }>({ state: 'open' });
  const [prsFilter, setPrsFilter] = useState<{ state?: 'open' | 'closed' | 'merged' | 'all' }>({
    state: 'open',
  });
  const debouncedIssuesFilter = useDebounce(issuesFilter, 300);
  const debouncedPrsFilter = useDebounce(prsFilter, 300);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const {
    data: repositories = [],
    isLoading: reposLoading,
    refetch: refetchRepos,
  } = useQuery({
    queryKey: ['git', 'repositories'],
    queryFn: fetchRepositories,
  });

  const { data: syncSettings } = useQuery({
    queryKey: ['git', 'sync-settings', selectedRepo?.id],
    queryFn: () => fetchSyncSettings(selectedRepo!.id),
    enabled: !!selectedRepo,
  });

  const {
    data: syncLogs = [],
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['git', 'sync-logs', selectedRepo?.id],
    queryFn: () => fetchSyncLogs(selectedRepo!.id),
    enabled: !!selectedRepo,
  });

  const {
    data: issues = [],
    isLoading: issuesLoading,
    refetch: refetchIssues,
  } = useQuery({
    queryKey: ['git', 'issues', selectedRepo?.id, debouncedIssuesFilter],
    queryFn: () => fetchIssues(selectedRepo!.id, debouncedIssuesFilter),
    enabled: !!selectedRepo,
  });

  const {
    data: pullRequests = [],
    isLoading: prsLoading,
    refetch: refetchPRs,
  } = useQuery({
    queryKey: ['git', 'prs', selectedRepo?.id, debouncedPrsFilter],
    queryFn: () => fetchPullRequests(selectedRepo!.id, debouncedPrsFilter),
    enabled: !!selectedRepo,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['git', 'milestones', selectedRepo?.id],
    queryFn: () => fetchMilestones(selectedRepo!.id),
    enabled: !!selectedRepo,
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const connectMutation = useMutation({
    mutationFn: connectRepository,
    onSuccess: (data) => {
      showToast(`Connected ${data.repository.full_name}`, 'success');
      setShowConnectModal(false);
      setConnectForm({
        provider: 'github',
        access_token: '',
        repository: '',
        sync_settings: {
          auto_sync: true,
          sync_interval: 15,
          sync_issues: true,
          sync_prs: true,
          sync_commits: false,
          sync_milestones: true,
          create_tasks_for_issues: true,
          create_tasks_for_prs: true,
          close_task_on_issue_close: true,
          close_task_on_pr_merge: true,
          default_task_priority: 'medium',
        },
      });
      refetchRepos();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to connect repository', 'error');
    },
    onSettled: () => setIsConnecting(false),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: number) => disconnectRepository(id),
    onSuccess: () => {
      showToast('Repository disconnected', 'success');
      if (selectedRepo?.id === selectedRepo?.id) {
        setSelectedRepo(null);
      }
      refetchRepos();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to disconnect', 'error');
    },
  });

  const syncMutation = useMutation({
    mutationFn: (repoId: number) => triggerSync({ repository_id: repoId, type: 'full' }),
    onSuccess: () => {
      showToast('Sync completed', 'success');
      refetchLogs();
      refetchIssues();
      refetchPRs();
      refetchRepos();
    },
    onError: (error: any) => {
      showToast(error.message || 'Sync failed', 'error');
    },
    onSettled: () => setIsSyncing(false),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ repoId, settings }: { repoId: number; settings: Partial<SyncSettings> }) =>
      updateSyncSettings(repoId, settings),
    onSuccess: () => {
      showToast('Settings saved', 'success');
      setShowSettingsModal(false);
      queryClient.invalidateQueries({ queryKey: ['git', 'sync-settings'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to save settings', 'error');
    },
  });

  const mapIssueMutation = useMutation({
    mutationFn: ({ issueId, taskId }: { issueId: number; taskId: number }) =>
      mapIssueToTask({ issue_id: issueId, task_id: taskId }),
    onSuccess: () => {
      showToast('Issue mapped to task', 'success');
      refetchIssues();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to map issue', 'error');
    },
  });

  const createTaskFromIssueMutation = useMutation({
    mutationFn: ({ issueId, projectId }: { issueId: number; projectId?: number }) =>
      createTaskFromIssue({ issue_id: issueId, project_id: projectId }),
    onSuccess: () => {
      showToast('Task created from issue', 'success');
      refetchIssues();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create task', 'error');
    },
  });

  const mapPRMutation = useMutation({
    mutationFn: ({ prId, taskId }: { prId: number; taskId: number }) =>
      mapPRToTask({ pr_id: prId, task_id: taskId }),
    onSuccess: () => {
      showToast('PR mapped to task', 'success');
      refetchPRs();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to map PR', 'error');
    },
  });

  const createTaskFromPRMutation = useMutation({
    mutationFn: ({ prId, projectId }: { prId: number; projectId?: number }) =>
      createTaskFromPR({ pr_id: prId, project_id: projectId }),
    onSuccess: () => {
      showToast('Task created from PR', 'success');
      refetchPRs();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create task', 'error');
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleConnect = () => {
    connectMutation.mutate(connectForm);
    setIsConnecting(true);
  };

  const handleDisconnect = (id: number) => {
    if (
      window.confirm(
        'Are you sure you want to disconnect this repository? This will remove all sync settings and history.'
      )
    ) {
      disconnectMutation.mutate(id);
    }
  };

  const handleSync = (repoId: number) => {
    syncMutation.mutate(repoId);
    setIsSyncing(true);
  };

  const handleSettingsSave = () => {
    if (!selectedRepo) return;
    updateSettingsMutation.mutate({ repoId: selectedRepo.id, settings: settingsForm });
  };

  const openSettings = (repo: GitRepository) => {
    setSelectedRepo(repo);
    setSettingsForm(
      repo.sync_enabled
        ? {
            auto_sync: repo.sync_enabled,
            sync_interval: 15,
            sync_issues: true,
            sync_prs: true,
            sync_commits: false,
            sync_milestones: true,
            create_tasks_for_issues: true,
            create_tasks_for_prs: true,
            close_task_on_issue_close: true,
            close_task_on_pr_merge: true,
            default_task_priority: 'medium',
            ...syncSettings,
          }
        : {}
    );
    setShowSettingsModal(true);
  };

  const handleMapIssueToTask = (issue: GitIssue) => {
    const taskId = prompt('Enter task ID to map this issue to:');
    if (taskId) {
      mapIssueMutation.mutate({ issueId: issue.id, taskId: parseInt(taskId) });
    }
  };

  const handleCreateTaskFromIssue = (issue: GitIssue) => {
    const projectId = prompt('Enter project ID (optional):');
    createTaskFromIssueMutation.mutate({
      issueId: issue.id,
      projectId: projectId ? parseInt(projectId) : undefined,
    });
  };

  const handleMapPRToTask = (pr: GitPullRequest) => {
    const taskId = prompt('Enter task ID to map this PR to:');
    if (taskId) {
      mapPRMutation.mutate({ prId: pr.id, taskId: parseInt(taskId) });
    }
  };

  const handleCreateTaskFromPR = (pr: GitPullRequest) => {
    const projectId = prompt('Enter project ID (optional):');
    createTaskFromPRMutation.mutate({
      prId: pr.id,
      projectId: projectId ? parseInt(projectId) : undefined,
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (reposLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton variant="card" className="h-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="card" className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <FolderGit2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              GIT SYNC
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            GitHub / GitLab Sync
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Sync repositories, issues, and PRs. Auto-create tasks from GitHub/GitLab activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowConnectModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Connect Repository
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openCaptureModal('ai')}
            keyboardShortcut="⌘K"
            tooltip="Quick capture (⌘K)"
            className="!bg-gradient-to-r !from-purple-500 !to-indigo-500 hover:!from-purple-600 hover:!to-indigo-600 shadow-glow-solar font-bold px-5 h-10 text-white transition-all active:translate-y-[1px]"
            icon={<Plus className="w-4 h-4 text-white" />}
          >
            + Capture Work
          </Button>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-bg-base/80 p-1 rounded-xl border border-border-base">
        {(['repos', 'issues', 'prs', 'logs', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {tab === 'repos' && <FolderGit2 className="w-4 h-4 mr-2 inline" />}
            {tab === 'issues' && <FileText className="w-4 h-4 mr-2 inline" />}
            {tab === 'prs' && <GitPullRequestIcon className="w-4 h-4 mr-2 inline" />}
            {tab === 'logs' && <Zap className="w-4 h-4 mr-2 inline" />}
            {tab === 'settings' && <Settings className="w-4 h-4 mr-2 inline" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── REPOSITORIES TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'repos' && (
        <div className="space-y-6">
          {repositories.length === 0 ? (
            <Card className="p-12 text-center border-border-base/50">
              <div className="p-4 rounded-2xl bg-bg-surface border border-border-base inline-block mb-4">
                <FolderGit2 className="w-16 h-16 text-text-faint mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No repositories connected
              </h3>
              <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
                Connect your GitHub or GitLab repositories to sync issues, PRs, and milestones with
                your projects.
              </p>
              <Button
                onClick={() => setShowConnectModal(true)}
                icon={<Plus className="w-4 h-4" />}
                size="lg"
              >
                Connect Your First Repository
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isSelected={selectedRepo?.id === repo.id}
                  onSelect={() => setSelectedRepo(repo)}
                  onSettings={() => openSettings(repo)}
                  onSync={() => handleSync(repo.id)}
                  onDisconnect={() => handleDisconnect(repo.id)}
                  isSyncing={isSyncing}
                  syncLogs={syncLogs.filter((l) => l.repository_id === repo.id).slice(0, 1)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ISSUES TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          {!selectedRepo ? (
            <Card className="p-8 text-center border-border-base/50">
              <FileText className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Select a repository</h3>
              <p className="text-sm text-text-muted">
                Choose a repository from the Repositories tab to view issues
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-bold text-text-primary">
                  Issues in {selectedRepo.full_name}
                </h2>
                <div className="flex items-center gap-2">
                  <Select
                    value={issuesFilter.state || 'open'}
                    onValueChange={(v) => setIssuesFilter((prev) => ({ ...prev, state: v }))}
                    className="w-40"
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'closed', label: 'Closed' },
                      { value: 'all', label: 'All' },
                    ]}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => refetchIssues()}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    loading={issuesLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {issuesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <LoadingSkeleton key={i} variant="card" className="h-24" />
                  ))}
                </div>
              ) : issues.length === 0 ? (
                <Card className="p-8 text-center border-border-base/50">
                  <FileText className="w-12 h-12 text-text-faint mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-1">No issues found</h3>
                  <p className="text-sm text-text-muted">No issues match your current filters</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onMapToTask={handleMapIssueToTask}
                      onCreateTask={handleCreateTaskFromIssue}
                      taskId={issue.task_id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── PRS TAB ──────────────────────────────────────────────────────────── */}
      {activeTab === 'prs' && (
        <div className="space-y-6">
          {!selectedRepo ? (
            <Card className="p-8 text-center border-border-base/50">
              <GitPullRequestIcon className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Select a repository</h3>
              <p className="text-sm text-text-muted">
                Choose a repository from the Repositories tab to view PRs
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-bold text-text-primary">
                  Pull Requests in {selectedRepo.full_name}
                </h2>
                <div className="flex items-center gap-2">
                  <Select
                    value={prsFilter.state || 'open'}
                    onValueChange={(v) => setPrsFilter((prev) => ({ ...prev, state: v }))}
                    className="w-40"
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'closed', label: 'Closed' },
                      { value: 'merged', label: 'Merged' },
                      { value: 'all', label: 'All' },
                    ]}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => refetchPRs()}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    loading={prsLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {prsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <LoadingSkeleton key={i} variant="card" className="h-24" />
                  ))}
                </div>
              ) : pullRequests.length === 0 ? (
                <Card className="p-8 text-center border-border-base/50">
                  <GitPullRequestIcon className="w-12 h-12 text-text-faint mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-1">No PRs found</h3>
                  <p className="text-sm text-text-muted">
                    No pull requests match your current filters
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pullRequests.map((pr) => (
                    <PRCard
                      key={pr.id}
                      pr={pr}
                      onMapToTask={handleMapPRToTask}
                      onCreateTask={handleCreateTaskFromPR}
                      taskId={pr.task_id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── LOGS TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {!selectedRepo ? (
            <Card className="p-8 text-center border-border-base/50">
              <Zap className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Select a repository</h3>
              <p className="text-sm text-text-muted">Choose a repository to view sync logs</p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-bold text-text-primary">
                  Sync Logs for {selectedRepo.full_name}
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetchLogs()}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  loading={logsLoading}
                >
                  Refresh
                </Button>
              </div>

              {logsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <LoadingSkeleton key={i} variant="card" className="h-24" />
                  ))}
                </div>
              ) : syncLogs.length === 0 ? (
                <Card className="p-8 text-center border-border-base/50">
                  <Zap className="w-12 h-12 text-text-faint mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-1">No sync logs yet</h3>
                  <p className="text-sm text-text-muted">
                    Sync logs will appear here after the first sync
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <LogCard key={log.id} log={log} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── SETTINGS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {!selectedRepo ? (
            <Card className="p-8 text-center border-border-base/50">
              <Settings className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Select a repository</h3>
              <p className="text-sm text-text-muted">
                Choose a repository to configure sync settings
              </p>
            </Card>
          ) : (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">
                  Sync Settings for {selectedRepo.full_name}
                </h2>
                <p className="text-sm text-text-muted">
                  Configure how this repository syncs with your workspace
                </p>
              </div>

              <Card className="p-5 border-border-base/50">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Sync Behavior</h3>
                <div className="space-y-4">
                  <ToggleSetting
                    label="Auto Sync"
                    description="Automatically sync on a schedule"
                    checked={settingsForm.auto_sync ?? true}
                    onChange={(v) => setSettingsForm((prev) => ({ ...prev, auto_sync: v }))}
                  />
                  <ToggleSetting
                    label="Sync Issues"
                    description="Create tasks from GitHub/GitLab issues"
                    checked={settingsForm.sync_issues ?? true}
                    onChange={(v) => setSettingsForm((prev) => ({ ...prev, sync_issues: v }))}
                  />
                  <ToggleSetting
                    label="Sync Pull Requests"
                    description="Create tasks from pull requests"
                    checked={settingsForm.sync_prs ?? true}
                    onChange={(v) => setSettingsForm((prev) => ({ ...prev, sync_prs: v }))}
                  />
                  <ToggleSetting
                    label="Sync Commits"
                    description="Create notes from commit messages"
                    checked={settingsForm.sync_commits ?? false}
                    onChange={(v) => setSettingsForm((prev) => ({ ...prev, sync_commits: v }))}
                  />
                  <ToggleSetting
                    label="Sync Milestones"
                    description="Sync milestone deadlines to calendar"
                    checked={settingsForm.sync_milestones ?? true}
                    onChange={(v) => setSettingsForm((prev) => ({ ...prev, sync_milestones: v }))}
                  />
                </div>
              </Card>

              <Card className="p-5 border-border-base/50">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Task Creation</h3>
                <div className="space-y-4">
                  <ToggleSetting
                    label="Create Tasks for Issues"
                    description="Auto-create tasks when new issues are synced"
                    checked={settingsForm.create_tasks_for_issues ?? true}
                    onChange={(v) =>
                      setSettingsForm((prev) => ({ ...prev, create_tasks_for_issues: v }))
                    }
                  />
                  <ToggleSetting
                    label="Create Tasks for PRs"
                    description="Auto-create tasks when new PRs are synced"
                    checked={settingsForm.create_tasks_for_prs ?? true}
                    onChange={(v) =>
                      setSettingsForm((prev) => ({ ...prev, create_tasks_for_prs: v }))
                    }
                  />
                  <ToggleSetting
                    label="Close Task on Issue Close"
                    description="Mark task complete when issue is closed"
                    checked={settingsForm.close_task_on_issue_close ?? true}
                    onChange={(v) =>
                      setSettingsForm((prev) => ({ ...prev, close_task_on_issue_close: v }))
                    }
                  />
                  <ToggleSetting
                    label="Close Task on PR Merge"
                    description="Mark task complete when PR is merged"
                    checked={settingsForm.close_task_on_pr_merge ?? true}
                    onChange={(v) =>
                      setSettingsForm((prev) => ({ ...prev, close_task_on_pr_merge: v }))
                    }
                  />
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-2">
                      Default Task Priority
                    </label>
                    <Select
                      value={settingsForm.default_task_priority || 'medium'}
                      onValueChange={(v) =>
                        setSettingsForm((prev) => ({ ...prev, default_task_priority: v as any }))
                      }
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-2">
                      Sync Interval (minutes)
                    </label>
                    <Input
                      type="number"
                      min="5"
                      max="1440"
                      value={settingsForm.sync_interval || 15}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          sync_interval: parseInt(e.target.value) || 15,
                        }))
                      }
                      className="w-full max-w-xs"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSettingsSave}
                  className="!bg-gradient-to-r !from-purple-500 !to-indigo-500 hover:!from-purple-600 hover:!to-indigo-600 shadow-glow-solar font-bold text-white"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

interface RepoCardProps {
  repo: GitRepository;
  isSelected: boolean;
  onSelect: () => void;
  onSettings: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
  syncLogs: SyncLog[];
}

function RepoCard({
  repo,
  isSelected,
  onSelect,
  onSettings,
  onSync,
  onDisconnect,
  isSyncing,
  syncLogs,
}: RepoCardProps) {
  const lastSync = syncLogs[0];
  const statusConfig = {
    success: {
      label: 'Success',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    },
    partial: { label: 'Partial', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
    failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border-red-500/25' },
  };

  const lastSyncStatus = lastSync
    ? statusConfig[lastSync.status]
    : { label: 'Never', color: 'bg-gray-500/10 text-gray-400 border-gray-500/25' };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'p-5 border rounded-xl transition-all text-left',
        'hover:border-purple-500/40 hover:bg-bg-elevated/50',
        isSelected
          ? 'border-purple-500/50 bg-purple-500/5 ring-2 ring-purple-500/20'
          : 'border-border-base'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-3 rounded-xl',
              repo.private
                ? 'bg-red-500/15 text-red-400 border-red-500/25'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
            )}
          >
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-text-primary truncate">{repo.full_name}</h3>
            <p className="text-xs text-text-muted">{repo.description || 'No description'}</p>
          </div>
        </div>
        {repo.sync_enabled && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto-sync
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="p-2 bg-bg-base/50 rounded-lg">
          <p className="text-2xl font-extrabold text-text-primary">{repo.stars}</p>
          <p className="text-[10px] text-text-muted">Stars</p>
        </div>
        <div className="p-2 bg-bg-base/50 rounded-lg">
          <p className="text-2xl font-extrabold text-text-primary">{repo.open_issues}</p>
          <p className="text-[10px] text-text-muted">Open Issues</p>
        </div>
        <div className="p-2 bg-bg-base/50 rounded-lg">
          <p className="text-2xl font-extrabold text-text-primary">{repo.forks}</p>
          <p className="text-[10px] text-text-muted">Forks</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
            lastSyncStatus.color
          )}
        >
          Last Sync: {lastSyncStatus.label}
        </span>
        <span className="text-text-muted">
          {lastSync
            ? `• ${new Date(lastSync.completed_at || lastSync.started_at).toLocaleDateString()}`
            : 'Never synced'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          className="flex-1 flex items-center justify-center gap-1"
          icon={<Settings className="w-3.5 h-3.5" />}
        >
          Settings
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSync();
          }}
          loading={false}
          className="flex-1 flex items-center justify-center gap-1"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Sync Now
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onDisconnect();
          }}
          className="text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1"
          icon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Disconnect
        </Button>
      </div>
    </button>
  );
}

interface IssueCardProps {
  issue: GitIssue;
  onMapToTask: (issue: GitIssue) => void;
  onCreateTask: (issue: GitIssue) => void;
  taskId?: number;
}

function IssueCard({ issue, onMapToTask, onCreateTask, taskId }: IssueCardProps) {
  const stateConfig =
    issue.state === 'open'
      ? {
          label: 'Open',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          icon: <GitBranch className="w-3.5 h-3.5" />,
        }
      : {
          label: 'Closed',
          color: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
          icon: <XCircle className="w-3.5 h-3.5" />,
        };

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                stateConfig.color
              )}
            >
              {stateConfig.icon}
              {stateConfig.label}
            </span>
            {issue.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {issue.labels.slice(0, 3).map((label) => (
                  <span
                    key={label.id}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      borderColor: `#${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h4 className="font-semibold text-text-primary truncate mb-1">
            #{issue.external_id} {issue.title}
          </h4>
          {issue.body && <p className="text-sm text-text-muted line-clamp-2 mt-1">{issue.body}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              {issue.assignees.map((a: any) => a.login).join(', ') || 'Unassigned'}
            </span>
            {issue.milestone && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border-purple-500/25">
                {issue.milestone.title}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {taskId ? (
            <Badge variant="success" size="sm" className="w-full">
              <CheckCircle2 className="w-3 h-3" />
              Mapped to Task #{taskId}
            </Badge>
          ) : (
            <div className="flex flex-col gap-1 w-full">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onMapToTask(issue)}
                className="w-full"
                icon={<LinkIcon className="w-3.5 h-3.5" />}
              >
                Map to Task
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onCreateTask(issue)}
                className="w-full"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Task
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface PRCardProps {
  pr: GitPullRequest;
  onMapToTask: (pr: GitPullRequest) => void;
  onCreateTask: (pr: GitPullRequest) => void;
  taskId?: number;
}

function PRCard({ pr, onMapToTask, onCreateTask, taskId }: PRCardProps) {
  const stateConfig = {
    open: {
      label: 'Open',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      icon: <GitPullRequestIcon className="w-3.5 h-3.5" />,
    },
    closed: {
      label: 'Closed',
      color: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    merged: {
      label: 'Merged',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  }[pr.state] || {
    label: pr.state,
    color: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
    icon: <GitPullRequestIcon className="w-3.5 h-3.5" />,
  };

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                stateConfig.color
              )}
            >
              {stateConfig.icon}
              {stateConfig.label}
            </span>
            {pr.draft && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/25">
                Draft
              </span>
            )}
            {pr.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pr.labels.slice(0, 3).map((label: any) => (
                  <span
                    key={label.id}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      borderColor: `#${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h4 className="font-semibold text-text-primary truncate mb-1">
            #{pr.external_id} {pr.title}
          </h4>
          {pr.body && <p className="text-sm text-text-muted line-clamp-2 mt-1">{pr.body}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              {pr.assignees.map((a: any) => a.login).join(', ') || 'Unassigned'}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {pr.head_branch} → {pr.base_branch}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {taskId ? (
            <Badge variant="success" size="sm" className="w-full">
              <CheckCircle2 className="w-3 h-3" />
              Mapped to Task #{taskId}
            </Badge>
          ) : (
            <div className="flex flex-col gap-1 w-full">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onMapToTask(pr)}
                className="w-full"
                icon={<LinkIcon className="w-3.5 h-3.5" />}
              >
                Map to Task
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onCreateTask(pr)}
                className="w-full"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Task
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface LogCardProps {
  log: SyncLog;
}

function LogCard({ log }: LogCardProps) {
  const statusConfig = {
    success: {
      label: 'Success',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    partial: {
      label: 'Partial',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    failed: {
      label: 'Failed',
      color: 'bg-red-500/10 text-red-400 border-red-500/25',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  }[log.status];

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
              statusConfig.color
            )}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {log.started_at ? new Date(log.started_at).toLocaleString() : 'Unknown'}
            </p>
            <p className="text-xs text-text-muted">
              {log.items_synced} items • {log.items_created} created • {log.items_updated} updated
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-text-muted">
          {log.completed_at && (
            <span>
              Duration:{' '}
              {Math.round(
                (new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000
              )}
              s
            </span>
          )}
        </div>
      </div>
      {log.error_message && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {log.error_message}
        </div>
      )}
    </Card>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            'w-11 h-6 rounded-full transition-colors cursor-pointer',
            checked ? 'bg-purple-500' : 'bg-border-base'
          )}
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full bg-white transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}
