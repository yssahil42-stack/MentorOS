import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeKeywords,
  synthesizeTailoredResume,
  tailorResume,
  exportResumeMarkdown,
  exportResumePlainText,
  saveResumeDraft,
  loadResumeDraft,
  SAMPLE_RESUME_INPUTS,
} from '../../../services/resumeService';

describe('resumeService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('analyzeKeywords', () => {
    it('computes match score, matched keywords, and missing keywords from job description', () => {
      const sample = SAMPLE_RESUME_INPUTS.fullstack;
      const report = analyzeKeywords(sample);

      expect(report.matchScore).toBeGreaterThan(0);
      expect(report.matchScore).toBeLessThanOrEqual(100);
      expect(report.atsScore).toBeGreaterThanOrEqual(70);
      expect(report.matchedKeywords).toContain('React');
      expect(report.matchedKeywords).toContain('TypeScript');
      expect(report.actionVerbScore).toBeGreaterThan(0);
    });
  });

  describe('synthesizeTailoredResume', () => {
    it('generates tailored executive summary, markdown, and plain text', () => {
      const sample = SAMPLE_RESUME_INPUTS.fullstack;
      const result = synthesizeTailoredResume(sample);

      expect(result.summary).toContain('Senior Full-Stack Engineer');
      expect(result.markdown).toContain('# Alex Morgan');
      expect(result.markdown).toContain('## Professional Summary');
      expect(result.markdown).toContain('MentorOS Productivity Engine');
      expect(result.plainText).toContain('ALEX MORGAN');
      expect(result.plainText).toContain('PROFESSIONAL SUMMARY');
    });

    it('only includes selected projects in the tailored resume', () => {
      const sample = SAMPLE_RESUME_INPUTS.fullstack;
      const result = synthesizeTailoredResume(sample);

      // Selected project
      expect(result.markdown).toContain('MentorOS Productivity Engine');
      // Unselected project
      expect(result.markdown).not.toContain('Real-Time Collaborative Code Editor');
      expect(result.tailoredProjects.length).toBe(2);
    });
  });

  describe('tailorResume', () => {
    it('falls back to synthesized resume gracefully when API is unavailable', async () => {
      const sample = SAMPLE_RESUME_INPUTS.frontend;
      const result = await tailorResume(sample);

      expect(result).toBeDefined();
      expect(result.summary).toContain('Senior Frontend Engineer');
      expect(result.markdown).toContain('Prism Design System');
    });
  });

  describe('exportResumeMarkdown & exportResumePlainText', () => {
    it('creates and clicks a temporary download anchor', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-resume-url');
      const revokeObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      exportResumeMarkdown('# Test Resume', 'test.md');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      exportResumePlainText('TEST RESUME', 'test.txt');
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveResumeDraft & loadResumeDraft', () => {
    it('persists and retrieves resume draft from localStorage', () => {
      const sample = SAMPLE_RESUME_INPUTS.fullstack;
      saveResumeDraft(sample);

      const loaded = loadResumeDraft();
      expect(loaded).toBeDefined();
      expect(loaded?.profile.name).toBe('Alex Morgan');
      expect(loaded?.targetRole).toBe('Senior Full-Stack Engineer');
    });
  });
});
