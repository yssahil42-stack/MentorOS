import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../../services/api';
import {
  fetchDeployPreviews,
  fetchDeployPreview,
  createDeployPreview,
  updateDeployPreview,
  deleteDeployPreview,
  fetchTechDebt,
  fetchTechDebtItem,
  createTechDebt,
  updateTechDebt,
  deleteTechDebt,
  fetchDebtReport,
  fetchDeploySettings,
  updateDeploySettings,
} from '../../../services/deployService';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('deployService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deploy Previews Management', () => {
    it('fetchDeployPreviews queries project deploy previews', async () => {
      const mockPreviews = [{ id: 1, preview_url: 'https://preview-1.app' }];
      (api.get as any).mockResolvedValueOnce(mockPreviews);

      const result = await fetchDeployPreviews(10);
      expect(api.get).toHaveBeenCalledWith('/deploy/projects/10/previews', { signal: undefined });
      expect(result).toEqual(mockPreviews);
    });

    it('fetchDeployPreview queries specific preview by id', async () => {
      const mockPreview = { id: 2, preview_url: 'https://preview-2.app' };
      (api.get as any).mockResolvedValueOnce(mockPreview);

      const result = await fetchDeployPreview(10, 2);
      expect(api.get).toHaveBeenCalledWith('/deploy/projects/10/previews/2', { signal: undefined });
      expect(result).toEqual(mockPreview);
    });

    it('createDeployPreview posts to project previews endpoint', async () => {
      const payload = {
        project_id: 10,
        branch: 'feature/auth',
        commit_sha: 'abc1234',
        preview_url: 'https://auth-preview.app',
      };
      (api.post as any).mockResolvedValueOnce({ id: 3, ...payload });

      const result = await createDeployPreview(payload);
      expect(api.post).toHaveBeenCalledWith('/deploy/projects/10/previews', payload);
      expect(result.id).toBe(3);
    });

    it('updateDeployPreview patches preview status', async () => {
      const updateData = { status: 'deployed' as const };
      (api.patch as any).mockResolvedValueOnce({ id: 3, status: 'deployed' });

      const result = await updateDeployPreview(10, 3, updateData);
      expect(api.patch).toHaveBeenCalledWith('/deploy/projects/10/previews/3', updateData);
      expect(result.status).toBe('deployed');
    });

    it('deleteDeployPreview deletes preview', async () => {
      (api.delete as any).mockResolvedValueOnce(undefined);

      await deleteDeployPreview(10, 3);
      expect(api.delete).toHaveBeenCalledWith('/deploy/projects/10/previews/3');
    });
  });

  describe('Technical Debt Management', () => {
    it('fetchTechDebt queries project tech debt items with filters', async () => {
      const mockDebt = [{ id: 1, title: 'Refactor auth reducer', category: 'architecture' }];
      (api.get as any).mockResolvedValueOnce(mockDebt);

      const result = await fetchTechDebt(10, { category: 'architecture' });
      expect(api.get).toHaveBeenCalledWith('/deploy/projects/10/tech-debt', {
        params: { category: 'architecture' },
        signal: undefined,
      });
      expect(result).toEqual(mockDebt);
    });

    it('fetchTechDebtItem queries individual debt item', async () => {
      const mockItem = { id: 105, title: 'Fix memory leak' };
      (api.get as any).mockResolvedValueOnce(mockItem);

      const result = await fetchTechDebtItem(10, 105);
      expect(api.get).toHaveBeenCalledWith('/deploy/projects/10/tech-debt/105', {
        signal: undefined,
      });
      expect(result).toEqual(mockItem);
    });

    it('createTechDebt posts new debt item', async () => {
      const payload = {
        project_id: 10,
        title: 'Add accessibility tests',
        severity: 'medium' as const,
        category: 'testing' as const,
      };
      (api.post as any).mockResolvedValueOnce({ id: 106, ...payload });

      const result = await createTechDebt(payload);
      expect(api.post).toHaveBeenCalledWith('/deploy/projects/10/tech-debt', payload);
      expect(result.id).toBe(106);
    });

    it('updateTechDebt patches debt item', async () => {
      const updateData = { status: 'resolved' as const };
      (api.patch as any).mockResolvedValueOnce({ id: 106, status: 'resolved' });

      const result = await updateTechDebt(10, 106, updateData);
      expect(api.patch).toHaveBeenCalledWith('/deploy/projects/10/tech-debt/106', updateData);
      expect(result.status).toBe('resolved');
    });

    it('deleteTechDebt removes debt item', async () => {
      (api.delete as any).mockResolvedValueOnce(undefined);

      await deleteTechDebt(10, 106);
      expect(api.delete).toHaveBeenCalledWith('/deploy/projects/10/tech-debt/106');
    });

    it('fetchDebtReport queries comprehensive project debt metrics', async () => {
      const mockReport = { total_items: 8, total_debt_score: 42, health_rating: 'A' };
      (api.get as any).mockResolvedValueOnce(mockReport);

      const result = await fetchDebtReport(10);
      expect(api.get).toHaveBeenCalledWith('/deploy/projects/10/tech-debt/report', {
        signal: undefined,
      });
      expect(result).toEqual(mockReport);
    });
  });

  describe('Deploy Settings', () => {
    it('fetchDeploySettings queries project deploy configuration', async () => {
      const mockSettings = { auto_deploy: true, provider: 'vercel' };
      (api.get as any).mockResolvedValueOnce(mockSettings);

      const result = await fetchDeploySettings(10);
      expect(api.get).toHaveBeenCalledWith('/deploy/projects/10/settings', { signal: undefined });
      expect(result).toEqual(mockSettings);
    });

    it('updateDeploySettings patches project deploy configuration', async () => {
      const patchData = { auto_deploy: false };
      (api.patch as any).mockResolvedValueOnce({ auto_deploy: false });

      const result = await updateDeploySettings(10, patchData);
      expect(api.patch).toHaveBeenCalledWith('/deploy/projects/10/settings', patchData);
      expect(result.auto_deploy).toBe(false);
    });
  });
});
