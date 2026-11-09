import { describe, it, expect } from 'vitest';
import {
  analyzeJobRole,
  generateJobPortalLinks,
  POPULAR_ROLE_PRESETS,
} from '../../../services/jobAnalyzerService';

describe('jobAnalyzerService', () => {
  it('correctly provides popular role presets including Data Analyst', () => {
    expect(POPULAR_ROLE_PRESETS.length).toBeGreaterThanOrEqual(4);
    const dataAnalyst = POPULAR_ROLE_PRESETS.find((p) => p.id === 'data-analyst');
    expect(dataAnalyst).toBeDefined();
    expect(dataAnalyst?.role).toBe('Data Analyst');
    expect(dataAnalyst?.suggestedSkills).toContain('SQL');
    expect(dataAnalyst?.suggestedSkills).toContain('Tableau');
  });

  it('analyzes Data Analyst role and separates matched vs missing skills', () => {
    const result = analyzeJobRole({
      targetRole: 'Data Analyst',
      seniority: 'fresher',
      userSkills: ['Python', 'Excel', 'Pandas'],
      locationPreference: 'Remote',
    });

    expect(result.targetRole).toBe('Data Analyst');
    expect(result.seniority).toBe('fresher');

    // User has Python, Excel, Pandas -> should be in matchedSkills
    const matchedWithStrings = result.matchedSkills.map((s) => s.matchedWith.toLowerCase()).join(' ');
    expect(matchedWithStrings).toContain('python');
    expect(matchedWithStrings).toContain('excel');
    expect(matchedWithStrings).toContain('pandas');

    // Missing skills should include SQL and Tableau/PowerBI
    const missingNames = result.missingSkills.map((s) => s.name.toLowerCase());
    const hasSqlGap = missingNames.some((n) => n.includes('sql'));
    const hasBiGap = missingNames.some((n) => n.includes('bi') || n.includes('tableau'));
    expect(hasSqlGap).toBe(true);
    expect(hasBiGap).toBe(true);

    // Score should reflect partial match
    expect(result.readinessScore).toBeGreaterThan(25);
    expect(result.readinessScore).toBeLessThan(90);

    // Mentor opinion should identify missing SQL / gaps
    expect(result.mentorOpinion.executiveSummary).toBeTruthy();
    expect(result.mentorOpinion.strategicActionPlan.length).toBe(3);
  });

  it('generates direct 1-click job portal links with search queries', () => {
    const portals = generateJobPortalLinks('Data Analyst', 'Remote');
    expect(portals.length).toBeGreaterThanOrEqual(5);

    const linkedin = portals.find((p) => p.platform === 'LinkedIn Jobs');
    expect(linkedin).toBeDefined();
    expect(linkedin?.url).toContain('Data%20Analyst');

    const wellfound = portals.find((p) => p.platform === 'Wellfound (AngelList)');
    expect(wellfound).toBeDefined();
    expect(wellfound?.url).toContain('Data%20Analyst');
  });

  it('handles custom unlisted roles with generic benchmarking', () => {
    const result = analyzeJobRole({
      targetRole: 'Quantum Computing Researcher',
      seniority: 'junior',
      userSkills: ['Python', 'Linear Algebra'],
    });

    expect(result.targetRole).toBe('Quantum Computing Researcher');
    expect(result.matchedSkills.length).toBeGreaterThan(0);
    expect(result.missingSkills.length).toBeGreaterThan(0);
    expect(result.mentorOpinion.overallVerdict).toBeTruthy();
  });
});
