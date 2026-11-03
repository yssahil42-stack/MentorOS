import { api } from './api';
import type {
  DeployPreview,
  TechDebtItem,
  DebtReport,
  DeploySettings,
  CreateDeployPreviewRequest,
  UpdateDeployPreviewRequest,
  CreateTechDebtRequest,
  UpdateTechDebtRequest,
  TechDebtFilters,
} from '../types/deploy';

// ─── Deploy Preview & Tech Debt API Service ────────────────────────────────────

// Deploy Previews
export function fetchDeployPreviews(
  projectId: number,
  signal?: AbortSignal
): Promise<DeployPreview[]> {
  return api.get<DeployPreview[]>(`/deploy/projects/${projectId}/previews`, { signal });
}

export function fetchDeployPreview(
  projectId: number,
  previewId: number,
  signal?: AbortSignal
): Promise<DeployPreview> {
  return api.get<DeployPreview>(`/deploy/projects/${projectId}/previews/${previewId}`, { signal });
}

export function createDeployPreview(data: CreateDeployPreviewRequest): Promise<DeployPreview> {
  return api.post<DeployPreview>(`/deploy/projects/${data.project_id}/previews`, data);
}

export function updateDeployPreview(
  projectId: number,
  previewId: number,
  data: UpdateDeployPreviewRequest
): Promise<DeployPreview> {
  return api.patch<DeployPreview>(`/deploy/projects/${projectId}/previews/${previewId}`, data);
}

export function deleteDeployPreview(projectId: number, previewId: number): Promise<void> {
  return api.delete(`/deploy/projects/${projectId}/previews/${previewId}`);
}

// Tech Debt
export function fetchTechDebt(
  projectId: number,
  filters?: TechDebtFilters,
  signal?: AbortSignal
): Promise<TechDebtItem[]> {
  return api.get<TechDebtItem[]>(`/deploy/projects/${projectId}/tech-debt`, {
    params: filters,
    signal,
  });
}

export function fetchTechDebtItem(
  projectId: number,
  debtId: number,
  signal?: AbortSignal
): Promise<TechDebtItem> {
  return api.get<TechDebtItem>(`/deploy/projects/${projectId}/tech-debt/${debtId}`, { signal });
}

export function createTechDebt(data: CreateTechDebtRequest): Promise<TechDebtItem> {
  return api.post<TechDebtItem>(`/deploy/projects/${data.project_id}/tech-debt`, data);
}

export function updateTechDebt(
  projectId: number,
  debtId: number,
  data: UpdateTechDebtRequest
): Promise<TechDebtItem> {
  return api.patch<TechDebtItem>(`/deploy/projects/${projectId}/tech-debt/${debtId}`, data);
}

export function deleteTechDebt(projectId: number, debtId: number): Promise<void> {
  return api.delete(`/deploy/projects/${projectId}/tech-debt/${debtId}`);
}

// Debt Reports
export function fetchDebtReport(projectId: number, signal?: AbortSignal): Promise<DebtReport> {
  return api.get<DebtReport>(`/deploy/projects/${projectId}/tech-debt/report`, { signal });
}

// Deploy Settings
export function fetchDeploySettings(
  projectId: number,
  signal?: AbortSignal
): Promise<DeploySettings> {
  return api.get<DeploySettings>(`/deploy/projects/${projectId}/settings`, { signal });
}

export function updateDeploySettings(
  projectId: number,
  settings: Partial<DeploySettings>
): Promise<DeploySettings> {
  return api.patch<DeploySettings>(`/deploy/projects/${projectId}/settings`, settings);
}

// Webhooks
export function registerDeployWebhook(projectId: number): Promise<{ url: string; secret: string }> {
  return api.post<{ url: string; secret: string }>(`/deploy/projects/${projectId}/webhook`);
}

export function deleteDeployWebhook(projectId: number): Promise<void> {
  return api.delete(`/deploy/projects/${projectId}/webhook`);
}
