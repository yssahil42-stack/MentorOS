import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CURATED_QUESTIONS,
  getFilteredQuestions,
  generateLevelsFyiLink,
  getPracticeAnswers,
  savePracticeAnswer,
  getSalaryEntries,
  saveSalaryEntry,
  deleteSalaryEntry,
} from '../../../services/interviewService';

describe('interviewService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('CURATED_QUESTIONS & getFilteredQuestions', () => {
    it('contains curated questions for top companies with STAR framework details', () => {
      expect(CURATED_QUESTIONS.length).toBeGreaterThanOrEqual(10);
      const googleQuestion = CURATED_QUESTIONS.find((q) => q.company === 'Google');
      expect(googleQuestion).toBeDefined();

      const behavioralQ = CURATED_QUESTIONS.find((q) => q.starFramework);
      expect(behavioralQ?.starFramework?.situation).toBeTruthy();
      expect(behavioralQ?.starFramework?.action).toBeTruthy();
    });

    it('filters questions by company', () => {
      const stripeQuestions = getFilteredQuestions({ company: 'Stripe' });
      expect(stripeQuestions.length).toBeGreaterThan(0);
      stripeQuestions.forEach((q) => expect(q.company).toBe('Stripe'));
    });

    it('filters questions by category', () => {
      const sysDesignQuestions = getFilteredQuestions({ category: 'system_design' });
      expect(sysDesignQuestions.length).toBeGreaterThan(0);
      sysDesignQuestions.forEach((q) => expect(q.category).toBe('system_design'));
    });

    it('filters questions by search query', () => {
      const results = getFilteredQuestions({ searchQuery: 'CRDT' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].question).toContain('collaborative');
    });
  });

  describe('generateLevelsFyiLink', () => {
    it('generates a direct Levels.fyi URL based on company and role slugs', () => {
      const url = generateLevelsFyiLink('Google', 'Software Engineer');
      expect(url).toBe('https://www.levels.fyi/companies/google/salaries/software-engineer');

      const stripeUrl = generateLevelsFyiLink('Stripe');
      expect(stripeUrl).toBe('https://www.levels.fyi/companies/stripe/salaries/software-engineer');
    });
  });

  describe('practice answers persistence', () => {
    it('saves and retrieves user practice answers from localStorage', () => {
      savePracticeAnswer({
        questionId: 'goog-sys-1',
        notes: 'Review operational transformation before Wednesday onsite.',
        confidenceRating: 4,
        mastered: true,
        lastPracticedAt: new Date().toISOString(),
      });

      const answers = getPracticeAnswers();
      expect(answers['goog-sys-1']).toBeDefined();
      expect(answers['goog-sys-1'].mastered).toBe(true);
      expect(answers['goog-sys-1'].notes).toContain('operational transformation');
    });
  });

  describe('salary entries persistence', () => {
    it('saves and deletes manual salary research entries', () => {
      const created = saveSalaryEntry({
        company: 'Airbnb',
        role: 'Staff Engineer',
        level: 'L6',
        location: 'Remote',
        baseSalary: 230000,
        stockGrantPerYear: 150000,
        bonus: 45000,
        totalComp: 425000,
        currency: 'USD',
        levelsFyiUrl: 'https://www.levels.fyi/companies/airbnb/salaries/software-engineer',
        notes: 'High equity upside.',
      });

      expect(created.id).toBeDefined();
      const entries = getSalaryEntries();
      expect(entries.some((e) => e.company === 'Airbnb')).toBe(true);

      deleteSalaryEntry(created.id);
      const updatedEntries = getSalaryEntries();
      expect(updatedEntries.some((e) => e.company === 'Airbnb')).toBe(false);
    });
  });
});
