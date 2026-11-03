import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generatePortfolio,
  synthesizePortfolio,
  exportMarkdown,
  exportPdf,
  savePortfolioDraft,
  loadPortfolioDrafts,
} from '../../../services/portfolioService';
import type { ProjectInputData } from '../../../types/portfolio';

const mockInput: ProjectInputData = {
  title: 'Cloud Orchestrator',
  tagline: 'Serverless deployment orchestrator with automated rollbacks',
  category: 'DevOps & Cloud',
  description: 'Enterprise deployment pipeline manager for hybrid clusters.',
  techStack: ['Go', 'Kubernetes', 'Docker', 'Prometheus'],
  features: ['Zero-downtime canary rollouts', 'Automatic telemetry and rollback on SLO breach'],
  challenges:
    'Coordinating blue-green deployments across multi-region clusters with variable networking.',
  solution:
    'Architected distributed controller state machines with consensus locks and fast health checks.',
  metrics: [
    { label: 'Deployment Time', value: '45s' },
    { label: 'Incident MTTR', value: '<2m' },
  ],
  githubUrl: 'https://github.com/developer/cloud-orchestrator',
  liveUrl: 'https://orchestrator.example.com',
};

describe('portfolioService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('synthesizePortfolio', () => {
    it('generates markdown README and Case Study containing project details', () => {
      const result = synthesizePortfolio(mockInput);

      expect(result.readme.markdown).toContain('# Cloud Orchestrator');
      expect(result.readme.markdown).toContain('Serverless deployment orchestrator');
      expect(result.readme.markdown).toContain('Zero-downtime canary rollouts');
      expect(result.readme.markdown).toContain('https://github.com/developer/cloud-orchestrator');

      expect(result.caseStudy.markdown).toContain('Case Study: Cloud Orchestrator');
      expect(result.caseStudy.markdown).toContain('Coordinating blue-green deployments');
      expect(result.caseStudy.markdown).toContain('Deployment Time');
      expect(result.caseStudy.markdown).toContain('45s');
    });
  });

  describe('generatePortfolio', () => {
    it('returns synthesized portfolio result on network fallback', async () => {
      const result = await generatePortfolio(mockInput);
      expect(result.readme.markdown).toBeTruthy();
      expect(result.caseStudy.markdown).toBeTruthy();
      expect(result.projectInput.title).toBe('Cloud Orchestrator');
    });
  });

  describe('exportMarkdown', () => {
    it('creates download anchor and triggers click', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = origCreateElement(tagName);
        if (tagName === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      exportMarkdown('# Test Markdown', 'test-readme.md');

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');

      vi.restoreAllMocks();
    });
  });

  describe('savePortfolioDraft & loadPortfolioDrafts', () => {
    it('persists and retrieves portfolio drafts from localStorage', () => {
      const initial = loadPortfolioDrafts();
      expect(initial).toEqual([]);

      const sample = synthesizePortfolio(mockInput);
      savePortfolioDraft(sample);

      const loaded = loadPortfolioDrafts();
      expect(loaded.length).toBe(1);
      expect(loaded[0].projectInput.title).toBe('Cloud Orchestrator');
    });
  });
});
