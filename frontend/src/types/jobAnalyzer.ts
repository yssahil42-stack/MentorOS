export type SeniorityLevel = 'fresher' | 'junior' | 'mid' | 'senior';

export interface SkillItem {
  name: string;
  category: 'core' | 'high_value' | 'differentiator' | 'soft_skill';
  description?: string;
  whyItMatters?: string;
  estimatedTimeToLearn?: string;
  suggestedProject?: string;
}

export interface MatchedSkill {
  name: string;
  matchedWith: string;
  category: 'core' | 'high_value' | 'differentiator';
  relevanceExplanation: string;
}

export interface MissingSkill {
  name: string;
  priority: 'critical' | 'high' | 'bonus';
  whyItMatters: string;
  estimatedTimeToLearn: string;
  suggestedProject: string;
}

export interface JobPortalLink {
  platform: string;
  url: string;
  badge?: string;
  description: string;
}

export interface TargetIndustryProfile {
  name: string;
  description: string;
  typicalRoles: string[];
  exampleCompanies: string[];
  hiringFocus: string;
}

export interface MentorActionPhase {
  phase: string;
  timeline: string;
  title: string;
  tasks: string[];
}

export interface MentorOpinion {
  overallVerdict: string;
  verdictTone: 'ready' | 'competitive_gap' | 'upskilling_needed';
  readinessPercentage: number;
  executiveSummary: string;
  strengthsSummary: string;
  biggestBlocker: string;
  strategicActionPlan: MentorActionPhase[];
  portfolioAdvice: string;
  applicationStrategy: string;
}

export interface JobAnalysisResult {
  targetRole: string;
  seniority: SeniorityLevel;
  analyzedAt: string;
  readinessScore: number;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  whereToApply: {
    portalLinks: JobPortalLink[];
    targetIndustries: TargetIndustryProfile[];
    recommendedChannels: {
      channel: string;
      allocation: number;
      advice: string;
    }[];
  };
  mentorOpinion: MentorOpinion;
}

export interface JobAnalysisRequest {
  targetRole: string;
  seniority: SeniorityLevel;
  userSkills: string[];
  jobDescription?: string;
  locationPreference?: string;
}

export interface RolePreset {
  id: string;
  role: string;
  label: string;
  category: string;
  description: string;
  suggestedSkills: string[];
}
