import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  Zap,
  AlertTriangle,
  FileText,
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
  Code,
  Bug,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  Copy,
  Download,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects } from '../../services/projectService';
import {
  fetchDeployPreviews,
  fetchTechDebt,
  fetchDebtReport,
  fetchDeploySettings,
  createDeployPreview,
  updateDeployPreview,
  deleteDeployPreview,
  createTechDebt,
  updateTechDebt,
  deleteTechDebt,
  updateDeploySettings,
} from '../../services/deployService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/dateUtils';
import type {
  DeployPreview,
  TechDebtItem,
  DebtReport,
  DeploySettings,
  CreateDeployPreviewRequest,
  CreateTechDebtRequest,
  UpdateTechDebtRequest,
  DeployProvider,
  DebtSeverity,
  DebtStatus,
} from '../../types/deploy';

export default function DeployPreviewPage() {
  const { showToast, openCaptureModal } = useWorkspace();
  const queryClient = useQueryClient();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'previews' | 'tech-debt' | 'settings'>('previews');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showCreatePreviewModal, setShowCreatePreviewModal] = useState(false);
  const [showCreateDebtModal, setShowCreateDebtModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [previewForm, setPreviewForm] = useState<CreateDeployPreviewRequest>({
    project_id: 0,
    provider: 'vercel',
    deployment_id: '',
    url: '',
    commit_sha: '',
    branch: 'main',
  });
  const [debtForm, setDebtForm] = useState<CreateTechDebtRequest>({
    project_id: 0,
    title: '',
    description: '',
    severity: 'medium',
    category: 'code_quality',
    source_type: 'manual',
    source_reference: '',
    estimated_hours: undefined,
    affected_files: [],
    related_task_id: undefined,
    related_pr_url: '',
  });
  const [settingsForm, setSettingsForm] = useState<Partial<DeploySettings>>({});
  const [debtFilters, setDebtFilters] = useState<{
    severity?: DebtSeverity[];
    status?: DebtStatus[];
    category?: string[];
  }>({});
  const debouncedDebtFilters = useDebounce(debtFilters, 300);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'developer'],
    queryFn: () => fetchProjects(),
  });

  const {
    data: previews = [],
    isLoading: previewsLoading,
    refetch: refetchPreviews,
  } = useQuery({
    queryKey: ['deploy', 'previews', selectedProject],
    queryFn: () => fetchDeployPreviews(selectedProject!),
    enabled: !!selectedProject,
  });

  const {
    data: techDebt = [],
    isLoading: debtLoading,
    refetch: refetchDebt,
  } = useQuery({
    queryKey: ['deploy', 'tech-debt', selectedProject, debouncedDebtFilters],
    queryFn: () => fetchTechDebt(selectedProject!, debouncedDebtFilters),
    enabled: !!selectedProject,
  });

  const { data: debtReport, isLoading: reportLoading } = useQuery({
    queryKey: ['deploy', 'debt-report', selectedProject],
    queryFn: () => fetchDebtReport(selectedProject!),
    enabled: !!selectedProject,
  });

  const { data: deploySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['deploy', 'settings', selectedProject],
    queryFn: () => fetchDeploySettings(selectedProject!),
    enabled: !!selectedProject,
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createPreviewMutation = useMutation({
    mutationFn: createDeployPreview,
    onSuccess: () => {
      showToast('Deploy preview created', 'success');
      setShowCreatePreviewModal(false);
      refetchPreviews();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create preview', 'error');
    },
  });

  const updatePreviewMutation = useMutation({
    mutationFn: ({
      projectId,
      previewId,
      data,
    }: {
      projectId: number;
      previewId: number;
      data: Partial<DeployPreview>;
    }) => updateDeployPreview(projectId, previewId, data),
    onSuccess: () => {
      showToast('Preview updated', 'success');
      refetchPreviews();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update preview', 'error');
    },
  });

  const deletePreviewMutation = useMutation({
    mutationFn: ({ projectId, previewId }: { projectId: number; previewId: number }) =>
      deleteDeployPreview(projectId, previewId),
    onSuccess: () => {
      showToast('Preview deleted', 'success');
      refetchPreviews();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete preview', 'error');
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: createTechDebt,
    onSuccess: () => {
      showToast('Tech debt item created', 'success');
      setShowCreateDebtModal(false);
      refetchDebt();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create tech debt item', 'error');
    },
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({
      projectId,
      debtId,
      data,
    }: {
      projectId: number;
      debtId: number;
      data: UpdateTechDebtRequest;
    }) => updateTechDebt(projectId, debtId, data),
    onSuccess: () => {
      showToast('Tech debt updated', 'success');
      refetchDebt();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update tech debt', 'error');
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: ({ projectId, debtId }: { projectId: number; debtId: number }) =>
      deleteTechDebt(projectId, debtId),
    onSuccess: () => {
      showToast('Tech debt deleted', 'success');
      refetchDebt();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete tech debt', 'error');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<DeploySettings>) =>
      updateDeploySettings(selectedProject!, settings),
    onSuccess: () => {
      showToast('Settings saved', 'success');
      setShowSettingsModal(false);
      queryClient.invalidateQueries({ queryKey: ['deploy', 'settings', selectedProject] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to save settings', 'error');
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreatePreview = () => {
    if (!previewForm.url || !previewForm.deployment_id || !previewForm.commit_sha) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    createPreviewMutation.mutate(previewForm);
  };

  const handleCreateDebt = () => {
    if (!debtForm.title || !debtForm.description) {
      showToast('Title and description are required', 'error');
      return;
    }
    createDebtMutation.mutate(debtForm);
  };

  const handleSettingsSave = () => {
    if (!selectedProject) return;
    updateSettingsMutation.mutate(settingsForm);
  };

  const openSettings = () => {
    if (!selectedProject) return;
    setSettingsForm(
      deploySettings || {
        provider: 'vercel',
        auto_deploy: true,
        deploy_on_push: true,
        deploy_on_pr: true,
        preview_enabled: true,
        build_command: 'npm run build',
        output_directory: 'dist',
        install_command: 'npm install',
        notify_on_success: true,
        notify_on_failure: true,
        notify_on_preview_ready: true,
      }
    );
    setShowSettingsModal(true);
  };

  // ─── Computed ───────────────────────────────────────────────────────────────

  const DEPLOY_PROVIDERS: DeployProvider[] = ['vercel', 'netlify', 'cloudflare', 'aws', 'custom'];

  const DEBT_SEVERITIES: DebtSeverity[] = ['critical', 'high', 'medium', 'low'];
  const DEBT_STATUSES: DebtStatus[] = ['open', 'in_progress', 'resolved', 'wont_fix'];
  const DEBT_CATEGORIES = [
    'code_quality',
    'architecture',
    'testing',
    'documentation',
    'security',
    'performance',
    'dependency',
    'other',
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!selectedProject) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Zap className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                DEPLOY PREVIEW & TECH DEBT
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              Deploy Preview & Tech Debt
            </h1>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
              Manage deployment previews, track technical debt, and configure auto-deploy settings.
            </p>
          </div>
        </div>

        <Card className="p-12 text-center border-border-base/50">
          <Zap className="w-16 h-16 text-text-faint mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Select a project</h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Choose a project from the dropdown below to manage its deploy previews and tech debt.
          </p>
          <div className="max-w-xs mx-auto">
            <Select
              options={[
                { value: '', label: 'Select a project' },
                ...projects.map((p) => ({ value: String(p.id), label: p.title })),
              ]}
              onValueChange={(v) => v && setSelectedProject(parseInt(v))}
              className="w-full"
            />
          </div>
        </Card>
      </div>
    );
  }

  const project = projects.find((p) => p.id === selectedProject);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Zap className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              DEPLOY PREVIEW & TECH DEBT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              Deploy Preview & Tech Debt
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {project?.title}
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Manage deployment previews, track technical debt, and configure auto-deploy settings.
          </p>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-bg-base/80 p-1 rounded-xl border border-border-base">
        {(['previews', 'tech-debt', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {tab === 'previews' && <Globe className="w-4 h-4 mr-2 inline" />}
            {tab === 'tech-debt' && <Bug className="w-4 h-4 mr-2 inline" />}
            {tab === 'settings' && <Settings className="w-4 h-4 mr-2 inline" />}
            {tab === 'previews' && 'Previews'}
            {tab === 'tech-debt' && 'Tech Debt'}
            {tab === 'settings' && 'Settings'}
          </button>
        ))}
      </div>

      {/* ─── PREVIEWS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'previews' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-text-primary">Deploy Previews</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreatePreviewModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Preview
              </Button>
            </div>
          </div>

          {previewsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i} variant="card" className="h-24" />
              ))}
            </div>
          ) : previews.length === 0 ? (
            <Card className="p-8 text-center border-border-base/50">
              <Globe className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                No deploy previews yet
              </h3>
              <p className="text-sm text-text-muted mb-6">
                Add your first deploy preview URL to track deployments
              </p>
              <Button
                onClick={() => setShowCreatePreviewModal(true)}
                icon={<Plus className="w-4 h-4" />}
                size="lg"
              >
                Add Deploy Preview
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previews.map((preview) => (
                <PreviewCard
                  key={preview.id}
                  preview={preview}
                  onOpen={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}
                  onCopy={() => {
                    navigator.clipboard.writeText(preview.url);
                    showToast('URL copied', 'success');
                  }}
                  onDelete={() =>
                    deletePreviewMutation.mutate({
                      projectId: selectedProject!,
                      previewId: preview.id,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TECH DEBT TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'tech-debt' && (
        <div className="space-y-6">
          {/* Debt Report Summary */}
          {debtReport && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <DebtMetricCard
                label="Total Items"
                value={debtReport.total_items}
                icon={<FileText className="w-5 h-5" />}
                color="indigo"
              />
              <DebtMetricCard
                label="Est. Hours"
                value={`${debtReport.total_estimated_hours}h`}
                icon={<Clock className="w-5 h-5" />}
                color="amber"
              />
              <DebtMetricCard
                label="Debt Ratio"
                value={`${debtReport.debt_ratio}%`}
                subtitle={debtReport.trend}
                icon={
                  debtReport.trend === 'improving' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : debtReport.trend === 'worsening' ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <Minus className="w-5 h-5" />
                  )
                }
                color={
                  debtReport.trend === 'improving'
                    ? 'emerald'
                    : debtReport.trend === 'worsening'
                      ? 'red'
                      : 'blue'
                }
              />
              <DebtMetricCard
                label="Critical"
                value={debtReport.by_severity.critical || 0}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="red"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-text-primary">
              Tech Debt Items ({techDebt.length})
            </h2>
            <div className="flex items-center gap-2">
              <Select
                value={debtFilters.severity?.join(',') || ''}
                onValueChange={(v) =>
                  setDebtFilters((prev) => ({
                    ...prev,
                    severity: v.split(',').filter(Boolean) as DebtSeverity[],
                  }))
                }
                className="w-40"
                options={[
                  { value: '', label: 'All Severities' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
              <Select
                value={debtFilters.status?.join(',') || ''}
                onValueChange={(v) =>
                  setDebtFilters((prev) => ({
                    ...prev,
                    status: v.split(',').filter(Boolean) as DebtStatus[],
                  }))
                }
                className="w-40"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'wont_fix', label: "Won't Fix" },
                ]}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateDebtModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Debt Item
              </Button>
            </div>
          </div>

          {debtLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i} variant="card" className="h-24" />
              ))}
            </div>
          ) : techDebt.length === 0 ? (
            <Card className="p-8 text-center border-border-base/50">
              <Bug className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                No tech debt items yet
              </h3>
              <p className="text-sm text-text-muted mb-6">
                Start tracking technical debt in your project
              </p>
              <Button
                onClick={() => setShowCreateDebtModal(true)}
                icon={<Plus className="w-4 h-4" />}
                size="lg"
              >
                Add First Debt Item
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {techDebt.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onUpdate={(data) =>
                    updateDebtMutation.mutate({
                      projectId: selectedProject!,
                      debtId: debt.id,
                      data,
                    })
                  }
                  onDelete={() =>
                    deleteDebtMutation.mutate({ projectId: selectedProject!, debtId: debt.id })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── SETTINGS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Deploy Settings</h2>
            <p className="text-sm text-text-muted">
              Configure auto-deploy and preview settings for this project
            </p>
          </div>

          <Card className="p-5 border-border-base/50">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Provider Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-2">Provider</label>
                <Select
                  value={settingsForm.provider || 'vercel'}
                  onValueChange={(v) =>
                    setSettingsForm((prev) => ({ ...prev, provider: v as DeployProvider }))
                  }
                  options={[
                    { value: 'vercel', label: 'Vercel' },
                    { value: 'netlify', label: 'Netlify' },
                    { value: 'cloudflare', label: 'Cloudflare Pages' },
                    { value: 'aws', label: 'AWS Amplify' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Build Command"
                  value={settingsForm.build_command || 'npm run build'}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, build_command: e.target.value }))
                  }
                  placeholder="npm run build"
                />
                <Input
                  label="Output Directory"
                  value={settingsForm.output_directory || 'dist'}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, output_directory: e.target.value }))
                  }
                  placeholder="dist"
                />
                <Input
                  label="Install Command"
                  value={settingsForm.install_command || 'npm install'}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, install_command: e.target.value }))
                  }
                  placeholder="npm install"
                />
              </div>

              <Input
                label="Custom Domain (optional)"
                value={settingsForm.custom_domain || ''}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, custom_domain: e.target.value }))
                }
                placeholder="app.example.com"
              />
            </div>
          </Card>

          <Card className="p-5 border-border-base/50">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Auto-Deploy Triggers</h3>
            <div className="space-y-3">
              <ToggleSetting
                label="Auto Deploy on Push"
                description="Deploy automatically when code is pushed to main branch"
                checked={settingsForm.auto_deploy ?? true}
                onChange={(v) => setSettingsForm((prev) => ({ ...prev, auto_deploy: v }))}
              />
              <ToggleSetting
                label="Deploy on PR"
                description="Create preview deployments for pull requests"
                checked={settingsForm.deploy_on_pr ?? true}
                onChange={(v) => setSettingsForm((prev) => ({ ...prev, deploy_on_pr: v }))}
              />
              <ToggleSetting
                label="Preview Deployments Enabled"
                description="Generate preview URLs for each deployment"
                checked={settingsForm.preview_enabled ?? true}
                onChange={(v) => setSettingsForm((prev) => ({ ...prev, preview_enabled: v }))}
              />
            </div>
          </Card>

          <Card className="p-5 border-border-base/50">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Notifications</h3>
            <div className="space-y-3">
              <ToggleSetting
                label="Notify on Success"
                description="Send notification when deployment succeeds"
                checked={settingsForm.notify_on_success ?? true}
                onChange={(v) => setSettingsForm((prev) => ({ ...prev, notify_on_success: v }))}
              />
              <ToggleSetting
                label="Notify on Failure"
                description="Send notification when deployment fails"
                checked={settingsForm.notify_on_failure ?? true}
                onChange={(v) => setSettingsForm((prev) => ({ ...prev, notify_on_failure: v }))}
              />
              <ToggleSetting
                label="Notify on Preview Ready"
                description="Send notification when preview URL is ready"
                checked={settingsForm.notify_on_preview_ready ?? true}
                onChange={(v) =>
                  setSettingsForm((prev) => ({ ...prev, notify_on_preview_ready: v }))
                }
              />
            </div>
          </Card>

          <Card className="p-5 border-border-base/50">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Environment Variables</h3>
            <p className="text-xs text-text-muted mb-4">
              Add environment variables for your deployments (key=value, one per line)
            </p>
            <textarea
              value={JSON.stringify(settingsForm.environment_variables || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setSettingsForm((prev) => ({ ...prev, environment_variables: parsed }));
                } catch {
                  // Ignore invalid JSON while typing
                }
              }}
              rows={6}
              className="w-full font-mono text-xs bg-bg-base border border-border-base rounded-xl px-3 py-2 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-indigo-500/50 transition-colors resize-y"
              placeholder='{"NODE_ENV": "production", "API_URL": "https://api.example.com"}'
            />
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openSettings}
              className="!bg-gradient-to-r !from-indigo-500 !to-purple-500 hover:!from-indigo-600 hover:!to-purple-600 shadow-glow-solar font-bold text-white"
            >
              Open Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

interface PreviewCardProps {
  preview: DeployPreview;
  onOpen: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function PreviewCard({ preview, onOpen, onCopy, onDelete }: PreviewCardProps) {
  const statusConfig = {
    building: {
      label: 'Building',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    ready: {
      label: 'Ready',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    failed: {
      label: 'Failed',
      color: 'bg-red-500/10 text-red-400 border-red-500/25',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  }[preview.status];

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
              statusConfig.color
            )}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
          <span className="text-xs font-mono text-text-muted">{preview.provider}</span>
        </div>
        <span className="text-[10px] text-text-muted font-mono">{preview.branch}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">
            {preview.url}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={onOpen}
              className="flex items-center gap-1"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={onCopy}
              className="flex items-center gap-1"
              icon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <Code className="w-3 h-3" />
            {preview.commit_sha.slice(0, 7)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(preview.created_at, 'relative')}
          </span>
          {preview.build_time_seconds && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {preview.build_time_seconds}s build
            </span>
          )}
        </div>

        {preview.review_notes && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
            <strong>Review Notes:</strong> {preview.review_notes}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base">
        <Button
          variant="ghost"
          size="xs"
          onClick={onDelete}
          className="text-red-400 hover:bg-red-500/10"
          icon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

interface DebtMetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'indigo' | 'amber' | 'emerald' | 'red' | 'blue';
}

function DebtMetricCard({ label, value, subtitle, icon, color }: DebtMetricCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  };

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2 rounded-xl', colorClasses[color])}>{icon}</div>
      </div>
    </Card>
  );
}

interface DebtCardProps {
  debt: TechDebtItem;
  onUpdate: (data: UpdateTechDebtRequest) => void;
  onDelete: () => void;
}

function DebtCard({ debt, onUpdate, onDelete }: DebtCardProps) {
  const severityConfig = {
    critical: {
      label: 'Critical',
      color: 'bg-red-500/10 text-red-400 border-red-500/25',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    high: {
      label: 'High',
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    medium: {
      label: 'Medium',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    low: {
      label: 'Low',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      icon: <Bug className="w-3.5 h-3.5" />,
    },
  }[debt.severity];

  const statusConfig = {
    open: { label: 'Open', color: 'bg-red-500/10 text-red-400 border-red-500/25' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
    resolved: {
      label: 'Resolved',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    },
    wont_fix: { label: "Won't Fix", color: 'bg-gray-500/10 text-gray-400 border-gray-500/25' },
  }[debt.status];

  const categoryLabels: Record<string, string> = {
    code_quality: 'Code Quality',
    architecture: 'Architecture',
    testing: 'Testing',
    documentation: 'Documentation',
    security: 'Security',
    performance: 'Performance',
    dependency: 'Dependency',
    other: 'Other',
  };

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
              severityConfig.color
            )}
          >
            {severityConfig.icon}
            {severityConfig.label}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border-purple-500/25">
            {categoryLabels[debt.category] || debt.category}
          </span>
        </div>
        {debt.estimated_hours && (
          <span className="text-xs font-mono text-text-muted shrink-0">
            {debt.estimated_hours}h est.
          </span>
        )}
      </div>

      <h4 className="font-semibold text-text-primary mb-1">{debt.title}</h4>
      <p className="text-sm text-text-muted line-clamp-2 mb-3">{debt.description}</p>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted mb-3">
        {debt.source_reference && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-base/50 border border-border-base">
            <LinkIcon className="w-3 h-3" />
            {debt.source_reference}
          </span>
        )}
        {debt.affected_files && debt.affected_files.length > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {debt.affected_files.length} files
          </span>
        )}
        <span className="flex items-center gap-1">
          <Code className="w-3 h-3" />
          {debt.source_type}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border-base">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onUpdate({ status: 'in_progress' })}
            disabled={debt.status === 'in_progress'}
            className="flex items-center gap-1"
            icon={<Code className="w-3.5 h-3.5" />}
          >
            Start Fix
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onUpdate({ status: 'resolved' })}
            disabled={debt.status === 'resolved'}
            className="flex items-center gap-1"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Resolve
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onUpdate({ status: 'wont_fix' })}
            disabled={debt.status === 'wont_fix'}
            className="flex items-center gap-1"
            icon={<XCircle className="w-3.5 h-3.5" />}
          >
            Won't Fix
          </Button>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={onDelete}
          className="text-red-400 hover:bg-red-500/10"
          icon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Delete
        </Button>
      </div>
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
            checked ? 'bg-indigo-500' : 'bg-border-base'
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
