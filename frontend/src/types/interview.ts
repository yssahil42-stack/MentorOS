export type QuestionCategory = 'behavioral' | 'technical' | 'system_design' | 'culture';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface StarFrameworkGuide {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewQuestion {
  id: string;
  company: string; // e.g. "Google", "Meta", "Stripe", "Amazon", "General"
  role: string; // e.g. "Frontend Engineer", "Full-Stack Engineer", "Backend Engineer", "System Design"
  category: QuestionCategory;
  question: string;
  difficulty: QuestionDifficulty;
  keyPointsToCover: string[];
  starFramework?: StarFrameworkGuide;
  sampleAnswer?: string;
  tags: string[];
}

export interface PracticeAnswer {
  questionId: string;
  notes: string;
  confidenceRating: number; // 1 to 5
  mastered: boolean;
  lastPracticedAt: string; // ISO date
}

export interface SalaryResearchEntry {
  id: string;
  company: string;
  role: string;
  level: string; // e.g. "L4 / Mid-Level", "L5 / Senior", "E5", "IC4"
  location: string; // e.g. "San Francisco, CA", "New York, NY", "Remote US"
  baseSalary: number;
  stockGrantPerYear: number;
  bonus: number;
  totalComp: number;
  currency: string;
  levelsFyiUrl: string;
  notes?: string;
  negotiationStrategy?: string;
  createdAt: string;
}

export interface InterviewFilterOptions {
  company?: string;
  role?: string;
  category?: QuestionCategory | 'all';
  difficulty?: QuestionDifficulty | 'all';
  searchQuery?: string;
  onlyMastered?: boolean;
}
