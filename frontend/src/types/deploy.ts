// ─── Deploy Preview & Tech Debt Types ──────────────────────────────────────────

export type DeployProvider = 'vercel' | 'netlify' | 'cloudflare' | 'aws' | 'custom';
export type DeployStatus = 'building' | 'ready' | 'failed' | 'cancelled';
export type DebtSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DebtStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';

export interface DeployPreview {
  id: number;
  project_id: number;
  user_id: number;
  provider: DeployProvider;
  deployment_id: string; // External deployment ID
  url: string; // Preview URL
  commit_sha: string;
  branch: string;
  status: DeployStatus;
  build_logs?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  // Metadata
  build_time_seconds?: number;
  size_bytes?: number;
  // Review
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
}

export interface TechDebtItem {
  id: number;
  project_id: number;
  user_id: number;
  title: string;
  description: string;
  severity: DebtSeverity;
  status: DebtStatus;
  category:
    | 'code_quality'
    | 'architecture'
    | 'testing'
    | 'documentation'
    | 'security'
    | 'performance'
    | 'dependency'
    | 'other';
  // Source
  source_type: 'manual' | 'linter' | 'sonar' | 'code_review' | 'incident';
  source_reference?: string; // PR #, commit SHA, file path
  // Effort estimation
  estimated_hours?: number;
  actual_hours?: number;
  // Impact
  affected_files?: string[];
  blocking_issues?: number[];
  // Tracking
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: number;
  // Links
  related_task_id?: number;
  related_pr_url?: string;
}

export interface DebtReport {
  project_id: number;
  total_items: number;
  by_severity: Record<DebtSeverity, number>;
  by_category: Record<string, number>;
  by_status: Record<DebtStatus, number>;
  total_estimated_hours: number;
  debt_ratio: number; // debt hours / total project hours
  trend: 'improving' | 'stable' | 'worsening';
  generated_at: string;
}

export interface DeploySettings {
  project_id: number;
  provider: DeployProvider;
  auto_deploy: boolean;
  deploy_on_push: boolean;
  deploy_on_pr: boolean;
  preview_enabled: boolean;
  custom_domain?: string;
  environment_variables: Record<string, string>;
  build_command: string;
  output_directory: string;
  install_command: string;
  // Notifications
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notify_on_preview_ready: boolean;
  slack_webhook?: string;
  discord_webhook?: string;
}

// API Request/Response types

export interface CreateDeployPreviewRequest {
  project_id: number;
  provider: DeployProvider;
  deployment_id: string;
  url: string;
  commit_sha: string;
  branch: string;
}

export interface UpdateDeployPreviewRequest {
  status?: DeployStatus;
  url?: string;
  review_notes?: string;
  reviewed_by?: number;
}

export interface CreateTechDebtRequest {
  project_id: number;
  title: string;
  description: string;
  severity: DebtSeverity;
  category: TechDebtItem['category'];
  source_type: TechDebtItem['source_type'];
  source_reference?: string;
  estimated_hours?: number;
  affected_files?: string[];
  related_task_id?: number;
  related_pr_url?: string;
}

export interface UpdateTechDebtRequest {
  title?: string;
  description?: string;
  severity?: DebtSeverity;
  status?: DebtStatus;
  category?: TechDebtItem['category'];
  estimated_hours?: number;
  actual_hours?: number;
  affected_files?: string[];
  related_task_id?: number;
  related_pr_url?: string;
}

export interface TechDebtFilters {
  severity?: DebtSeverity[];
  status?: DebtStatus[];
  category?: string[];
  assignee?: number;
  date_from?: string;
  date_to?: string;
}

// UI State types

export interface DeployTechDebtState {
  previews: DeployPreview[];
  techDebt: TechDebtItem[];
  settings: DeploySettings | null;
  debtReport: DebtReport | null;
  isLoading: boolean;
  isCreatingPreview: boolean;
  isCreatingDebt: boolean;
}

// Provider configs
export const DEPLOY_PROVIDERS: Record<
  DeployProvider,
  { name: string; icon: string; color: string; docsUrl: string }
> = {
  vercel: { name: 'Vercel', icon: 'vercel', color: '#000000', docsUrl: 'https://vercel.com/docs' },
  netlify: {
    name: 'Netlify',
    icon: 'netlify',
    color: '#00C7B7',
    docsUrl: 'https://docs.netlify.com',
  },
  cloudflare: {
    name: 'Cloudflare Pages',
    icon: 'cloudflare',
    color: '#F38020',
    docsUrl: 'https://developers.cloudflare.com/pages/',
  },
  aws: {
    name: 'AWS Amplify',
    icon: 'aws',
    color: '#FF9900',
    docsUrl: 'https://docs.aws.amazon.com/amplify/',
  },
  custom: { name: 'Custom', icon: 'server', color: '#6366F1', docsUrl: '' },
};

export const DEBT_SEVERITY_CONFIG: Record<
  DebtSeverity,
  { label: string; color: string; priority: number }
> = {
  critical: {
    label: 'Critical',
    color: 'bg-red-500/10 text-red-400 border-red-500/25',
    priority: 4,
  },
  high: {
    label: 'High',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
    priority: 3,
  },
  medium: {
    label: 'Medium',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    priority: 2,
  },
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25', priority: 1 },
};

export const DEBT_STATUS_CONFIG: Record<DebtStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-500/10 text-red-400 border-red-500/25' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
  resolved: {
    label: 'Resolved',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  },
  wont_fix: { label: "Won't Fix", color: 'bg-gray-500/10 text-gray-400 border-gray-500/25' },
};

export const DEBT_CATEGORIES = [
  'code_quality',
  'architecture',
  'testing',
  'documentation',
  'security',
  'performance',
  'dependency',
  'other',
] as const;

// Helper functions

export function getDeployProviderConfig(provider: DeployProvider) {
  return DEPLOY_PROVIDERS[provider];
}

export function getDeployStatusColor(status: DeployStatus): string {
  switch (status) {
    case 'building':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    case 'ready':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    case 'failed':
      return 'bg-red-500/10 text-red-400 border-red-500/25';
    case 'cancelled':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
  }
}

export function getDeployStatusLabel(status: DeployStatus): string {
  switch (status) {
    case 'building':
      return 'Building';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getDebtSeverityConfig(severity: DebtSeverity) {
  return DEBT_SEVERITY_CONFIG[severity];
}

export function getDebtStatusConfig(status: DebtStatus) {
  return DEBT_STATUS_CONFIG[status];
}

export function calculateDebtRatio(totalDebtHours: number, totalProjectHours: number): number {
  if (totalProjectHours === 0) return 0;
  return Math.round((totalDebtHours / totalProjectHours) * 100);
}

export function getDebtTrend(
  currentRatio: number,
  previousRatio: number
): 'improving' | 'stable' | 'worsening' {
  const diff = currentRatio - previousRatio;
  if (diff < -2) return 'improving';
  if (diff > 2) return 'worsening';
  return 'stable';
}
