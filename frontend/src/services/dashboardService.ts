import { api } from './api';
import type { DashboardSummary } from '../types/dashboard';

export function fetchDashboardSummary(role: string): Promise<DashboardSummary> {
  return api.get<DashboardSummary>('/dashboard/summary', { params: { role } });
}
