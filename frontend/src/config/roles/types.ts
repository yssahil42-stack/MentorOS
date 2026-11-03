import type { UserRole } from '../../types/user';

export interface NavigationItem {
  to: string;
  label: string;
  icon: string; // Lucide icon name
  badge?: string; // optional notification count key
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  promptStarter?: string; // opens AI drawer with this text pre-filled
  href?: string; // navigates to this route instead
}

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  fields: OnboardingField[];
}

export interface OnboardingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'date' | 'number' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface AiTemplate {
  id: string;
  label: string;
  promptStarter: string;
  icon: string;
  contextType: string;
}

export interface EmptyStateConfig {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
}

export interface DashboardCardConfig {
  id: string;
  type:
    | 'metric'
    | 'task_list'
    | 'project_list'
    | 'calendar_preview'
    | 'ai_suggestion'
    | 'quick_actions'
    | 'activity';
  title: string;
  span?: 1 | 2 | 3; // grid column span
}

export interface RoleConfig {
  id: UserRole;
  label: string;
  labelPlural: string;
  tagline: string;
  color: string; // CSS hex
  colorClass: string; // Tailwind class prefix e.g. 'student'
  glowClass: string; // Tailwind shadow class
  icon: string; // Lucide icon name
  routePrefix: string; // e.g. '/app/student'
  allowedRoutes: string[]; // allowed path prefixes
  navigation: NavigationItem[];
  onboardingSteps: OnboardingStep[];
  quickActions: QuickAction[];
  aiTemplates: AiTemplate[];
  dashboardCards: DashboardCardConfig[];
  terminology: Record<string, string>;
  emptyStates: Record<string, EmptyStateConfig>;
  firstAiPrompt: string;
}
