import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkAiHealth,
  fetchRecentProposals,
  requestAIProposal,
  approveProposalItems,
} from '../../../services/aiService';
import { api } from '../../../services/api';
import type { AIProposal } from '../../../types/aiProposal';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAiHealth', () => {
    it('returns online true when backend status is ok', async () => {
      (api.get as any).mockResolvedValueOnce({ status: 'ok', model: 'llama-3.3-70b-versatile' });

      const res = await checkAiHealth();
      expect(api.get).toHaveBeenCalledWith('/ai/health', { signal: undefined });
      expect(res.online).toBe(true);
      expect(res.model).toBe('llama-3.3-70b-versatile');
    });

    it('returns online false when status is not ok', async () => {
      (api.get as any).mockResolvedValueOnce({ status: 'degraded', model: 'fallback' });

      const res = await checkAiHealth();
      expect(res.online).toBe(false);
    });
  });

  describe('fetchRecentProposals', () => {
    it('fetches proposals and filters by role and userId', async () => {
      const mockList: Partial<AIProposal>[] = [
        { id: 1, role: 'student', user_id: 10, request_text: 'Study math' },
        { id: 2, role: 'developer', user_id: 10, request_text: 'Build app' },
        { id: 3, role: 'student', user_id: 20, request_text: 'Study physics' },
      ];
      (api.get as any).mockResolvedValueOnce(mockList);

      const res = await fetchRecentProposals('student', 10);
      expect(api.get).toHaveBeenCalledWith('/ai/proposals', { signal: undefined });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe(1);
    });
  });

  describe('requestAIProposal', () => {
    it('sends proposal request with payload and role', async () => {
      const req = {
        context_type: 'build_plan',
        request_text: 'Plan microservices',
      };
      (api.post as any).mockResolvedValueOnce({ id: 100, ...req });

      const res = await requestAIProposal(req as any, 'developer');
      expect(api.post).toHaveBeenCalledWith(
        '/ai/propose',
        { ...req, role: 'developer' },
        { signal: undefined }
      );
      expect(res.id).toBe(100);
    });
  });

  describe('approveProposalItems', () => {
    it('validates proposal items and calls /ai/proposals/:id/approve with valid IDs', async () => {
      const mockProposal: AIProposal = {
        id: 50,
        request_text: 'Plan architecture',
        summary: 'Architecture plan',
        role: 'developer',
        context_type: 'build_plan',
        items: [
          {
            id: 1,
            proposal_id: 50,
            item_type: 'task',
            payload: { title: 'Implement Auth' },
          },
          {
            id: 2,
            proposal_id: 50,
            item_type: 'milestone',
            payload: { title: 'Milestone 1' },
          },
        ],
        created_at: new Date().toISOString(),
      };

      (api.post as any).mockResolvedValueOnce({
        proposal_id: 50,
        created_tasks: [101],
        created_projects: [],
        created_milestones: [201],
        created_events: [],
        created_notes: [],
        results: [],
      });

      const res = await approveProposalItems(mockProposal, {
        approved_item_ids: [1, 2],
        item_overrides: {
          1: { title: 'Implement JWT Auth' },
        },
      });

      expect(api.post).toHaveBeenCalledWith(
        '/ai/proposals/50/approve',
        expect.objectContaining({
          approved_item_ids: [1, 2],
          item_overrides: { 1: { title: 'Implement JWT Auth' } },
        })
      );
      expect(res.created_tasks).toEqual([101]);
    });

    it('rejects items with empty titles and returns failed item results', async () => {
      const mockProposal: AIProposal = {
        id: 51,
        request_text: 'Plan tasks',
        summary: 'Task plan',
        role: 'developer',
        context_type: 'build_plan',
        items: [
          {
            id: 1,
            proposal_id: 51,
            item_type: 'task',
            payload: { title: '   ' },
          },
        ],
        created_at: new Date().toISOString(),
      };

      const res = await approveProposalItems(mockProposal, {
        approved_item_ids: [1],
      });

      expect(res.results).toBeDefined();
      expect(res.results.length).toBe(1);
      expect(res.results[0].status).toBe('failed');
      expect(res.results[0].reason).toBe('Missing required title');
    });
  });
});
