export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export interface ResumeCandidateProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface ResumeExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  role: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  bullets: string[];
  selected: boolean;
}

export interface ResumeEducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  graduationYear: string;
  details?: string;
}

export interface ResumeTailorInput {
  profile: ResumeCandidateProfile;
  targetRole: string;
  seniority: SeniorityLevel;
  targetIndustry: string;
  jobDescription: string;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    cloud: string[];
  };
  experiences: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  education: ResumeEducationItem[];
}

export interface ResumeKeywordReport {
  matchScore: number; // 0-100%
  atsScore: number; // 0-100%
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendedAdditions: string[];
  keywordDensity: { keyword: string; count: number }[];
  bulletCount: number;
  actionVerbScore: number; // 0-100%
}

export interface TailoredResumeResult {
  summary: string;
  markdown: string;
  plainText: string;
  keywordReport: ResumeKeywordReport;
  skillsCategorized: {
    languages: string[];
    frameworks: string[];
    toolsAndCloud: string[];
  };
  tailoredExperiences: {
    company: string;
    role: string;
    location: string;
    period: string;
    bullets: string[];
  }[];
  tailoredProjects: {
    title: string;
    role: string;
    techStack: string[];
    bullets: string[];
    links: { github?: string; live?: string };
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }[];
  generatedAt: string;
}
