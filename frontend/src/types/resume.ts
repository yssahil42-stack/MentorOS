export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
export type ResumeTemplateId = 'modern' | 'classic' | 'minimal' | 'academic';
export type SummaryStyle = 'metrics' | 'technical' | 'growth';

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

export interface SchoolEducationItem {
  board: string;
  percentage: string;
  school: string;
  year: string;
  stream?: string;
}

export interface ResumeEducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  graduationYear: string;
  details?: string;
  percentage?: string;
  board?: string;
  stream?: string;
  educationLevel?: 'degree' | '12th' | '10th' | 'other';
  isPursuing?: boolean;
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
  tenthEducation?: SchoolEducationItem;
  twelfthEducation?: SchoolEducationItem;
  templateId?: ResumeTemplateId;
  summaryStyle?: SummaryStyle;
  isFresher?: boolean;
  omitExperience?: boolean;
  customSummary?: string;
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
  summaryVariations?: {
    metrics: string;
    technical: string;
    growth: string;
  };
  templateId?: ResumeTemplateId;
  isFresher?: boolean;
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
    percentage?: string;
    board?: string;
    stream?: string;
    educationLevel?: 'degree' | '12th' | '10th' | 'other';
    isPursuing?: boolean;
  }[];
  tenthEducation?: SchoolEducationItem;
  twelfthEducation?: SchoolEducationItem;
  generatedAt: string;
}
