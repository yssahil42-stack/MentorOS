export type ProjectCategory =
  | 'Full-Stack'
  | 'Frontend'
  | 'Backend & API'
  | 'Mobile App'
  | 'AI & Machine Learning'
  | 'DevOps & Cloud'
  | 'Open Source';

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectInputData {
  title: string;
  tagline: string;
  category: ProjectCategory;
  description: string;
  techStack: string[];
  features: string[];
  challenges: string;
  solution: string;
  metrics: ProjectMetric[];
  githubUrl?: string;
  liveUrl?: string;
  architectureDetails?: string;
}

export interface GeneratedReadme {
  markdown: string;
  overview: string;
  features: string[];
  installation: string;
  usage: string;
  architecture: string;
  license: string;
}

export interface GeneratedCaseStudy {
  title: string;
  tagline: string;
  summary: string;
  problemStatement: string;
  technicalDecisions: string[];
  systemArchitecture: string;
  metricsImpact: ProjectMetric[];
  keyOutcomes: string[];
  learnings: string[];
  markdown: string;
}

export interface GeneratedPortfolioResult {
  id: string;
  createdAt: string;
  projectInput: ProjectInputData;
  readme: GeneratedReadme;
  caseStudy: GeneratedCaseStudy;
}
