import { api } from './api';
import type {
  AIProposal,
  CreateProposalRequest,
  ApproveProposalRequest,
  ApprovalResult,
} from '../types/aiProposal';

export async function checkAiHealth(
  signal?: AbortSignal
): Promise<{ online: boolean; model: string }> {
  const res = await api.get<{ status: string; model: string }>('/ai/health', { signal });
  return { online: res.status === 'ok', model: res.model || 'AI provider' };
}

export async function fetchRecentProposals(
  role?: string,
  userId?: number,
  signal?: AbortSignal
): Promise<AIProposal[]> {
  const proposals = await api.get<AIProposal[]>('/ai/proposals', { signal });
  return proposals.filter(
    (proposal) =>
      (userId === undefined || proposal.user_id === userId) && (!role || proposal.role === role)
  );
}

export async function requestAIProposal(
  data: CreateProposalRequest,
  role = 'developer',
  signal?: AbortSignal
): Promise<AIProposal> {
  return api.post<AIProposal>('/ai/propose', { ...data, role }, { signal });
}

function notifyToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mentor:toast', { detail: { message, type } }));
  }
}

export async function approveProposalItems(
  proposal: AIProposal,
  req: ApproveProposalRequest
): Promise<ApprovalResult> {
  const itemResults: import('../types/aiProposal').ApprovalItemResult[] = [];
  const validApprovedIds: number[] = [];

  // 1. Validate each item payload before sending
  for (const itemId of req.approved_item_ids) {
    const item = proposal.items.find((i) => i.id === itemId);
    if (!item) {
      itemResults.push({
        id: itemId,
        item_type: 'task',
        title: `Item #${itemId}`,
        status: 'failed',
        reason: 'Item not found in proposal',
      });
      notifyToast(`✗ Failed: Item #${itemId} (Item not found in proposal)`, 'error');
      continue;
    }

    const override = req.item_overrides?.[itemId] || {};
    const effectivePayload: any = {
      ...(item.payload as unknown as Record<string, unknown>),
      ...override,
    };
    const title =
      effectivePayload.title ||
      effectivePayload.name ||
      (item.item_type === 'note' ? effectivePayload.content?.slice(0, 30) : '');

    // Validation checks
    let failureReason: string | null = null;
    if (!title || String(title).trim() === '') {
      failureReason = 'Missing required title';
    } else if (item.item_type === 'calendar_event' && !effectivePayload.start_at) {
      failureReason = 'Missing event start date';
    }

    if (failureReason) {
      const fallbackTitle = title || `${item.item_type} #${itemId}`;
      itemResults.push({
        id: itemId,
        item_type: item.item_type,
        title: fallbackTitle,
        status: 'failed',
        reason: failureReason,
      });
      notifyToast(`✗ Failed: ${fallbackTitle} (${failureReason})`, 'error');
    } else {
      validApprovedIds.push(itemId);
    }
  }

  // If no items passed validation, return early with recorded results
  if (validApprovedIds.length === 0) {
    return {
      created_tasks: [],
      created_projects: [],
      created_milestones: [],
      created_events: [],
      created_notes: [],
      results: itemResults,
    };
  }

  try {
    const res = await api.post<ApprovalResult>(`/ai/proposals/${proposal.id}/approve`, {
      ...req,
      approved_item_ids: validApprovedIds,
    });

    // 2. Track per-item success/failure in ApprovalResult & show toast per item
    for (const itemId of validApprovedIds) {
      const item = proposal.items.find((i) => i.id === itemId)!;
      const override = req.item_overrides?.[itemId] || {};
      const effectivePayload: any = {
        ...(item.payload as unknown as Record<string, unknown>),
        ...override,
      };
      const title = effectivePayload.title || effectivePayload.name || item.item_type;

      itemResults.push({
        id: itemId,
        item_type: item.item_type,
        title,
        status: 'success',
      });
      notifyToast(`✓ Created ${item.item_type}: ${title}`, 'success');
    }

    res.results = itemResults;
    return res;
  } catch (err: any) {
    for (const itemId of validApprovedIds) {
      const item = proposal.items.find((i) => i.id === itemId);
      const title = (item?.payload as any)?.title || `Item #${itemId}`;
      const reason = err.message || 'Server approval error';
      itemResults.push({
        id: itemId,
        item_type: item?.item_type || 'task',
        title,
        status: 'failed',
        reason,
      });
      notifyToast(`✗ Failed: ${title} (${reason})`, 'error');
    }
    throw err;
  }
}
