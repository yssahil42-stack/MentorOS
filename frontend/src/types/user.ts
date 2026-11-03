// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'freelancer' | 'developer' | 'job_seeker';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  onboarding_complete?: boolean;
  onboarding_completed?: boolean;
  profile_data?: Record<string, unknown>;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  profile_data?: Record<string, unknown>;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
