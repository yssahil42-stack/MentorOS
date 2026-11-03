import { api } from './api';
import type {
  AIProposal,
  CreateProposalRequest,
  ApproveProposalRequest,
  ApprovalResult,
} from '../types/aiProposal';

export async function checkAiHealth(): Promise<{ online: boolean; model: string }> {
  const res = await api.get<{ status: string; model: string }>('/ai/health');
  return { online: res.status === 'ok', model: res.model || 'AI provider' };
}

export async function fetchRecentProposals(role?: string, userId?: number): Promise<AIProposal[]> {
  const proposals = await api.get<AIProposal[]>('/ai/proposals');
  return proposals.filter((proposal) =>
    (userId === undefined || proposal.user_id === userId) &&
    (!role || proposal.role === role)
  );
}

export async function requestAIProposal(
  data: CreateProposalRequest,
  role = 'developer',
): Promise<AIProposal> {
  return api.post<AIProposal>('/ai/propose', { ...data, role });
}

export async function approveProposalItems(
  proposal: AIProposal,
  req: ApproveProposalRequest,
): Promise<ApprovalResult> {
  return api.post<ApprovalResult>(`/ai/proposals/${proposal.id}/approve`, req);
}
