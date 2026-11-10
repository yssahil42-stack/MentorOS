import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, UserRole } from '../types/user';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/user';
import { api } from '../services/api';
import { queryClient } from '../store/queryClient';

// ─── Context Shape ───────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (req: LoginRequest) => Promise<User>;
  register: (req: RegisterRequest) => Promise<User>;
  loginWithGoogle: (credential: string, role?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Storage Keys ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'mentor_token';
const USER_KEY = 'mentor_user';

// ─── Provider ────────────────────────────────────────────────────────────────

function resolveRoleForUser(email: string, requestedRole?: string): UserRole {
  if (requestedRole && ['student', 'developer', 'freelancer', 'job_seeker'].includes(requestedRole)) {
    return requestedRole as UserRole;
  }
  const lower = (email || '').toLowerCase().trim();
  if (
    lower.includes('student') ||
    lower.includes('study') ||
    lower.includes('academic') ||
    lower.includes('college')
  ) {
    return 'student';
  }
  if (lower.includes('dev')) {
    return 'developer';
  }
  if (lower.includes('freelance')) {
    return 'freelancer';
  }
  if (lower.includes('job') || lower.includes('seek')) {
    return 'job_seeker';
  }
  try {
    const saved = localStorage.getItem('mentor_workspace_role') as UserRole;
    if (saved && ['student', 'developer', 'freelancer', 'job_seeker'].includes(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'student';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Verify existing session on mount
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setUser(null);
        localStorage.removeItem(USER_KEY);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener('mentor:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mentor:unauthorized', handleUnauthorized);
  }, []);

  const persistSession = (res: AuthResponse) => {
    queryClient.clear();
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    localStorage.setItem('mentor_workspace_role', res.user.role);
    localStorage.removeItem('mentor_recent_proposals');
    setUser(res.user);
    return res.user;
  };

  const login = useCallback(async (req: LoginRequest): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/login', req);
    return persistSession(res);
  }, []);

  const register = useCallback(async (req: RegisterRequest): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/register', req);
    return persistSession(res);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, role?: string): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/google', { credential, role });
    return persistSession(res);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort logout notification to server
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('mentor_workspace_role');
    localStorage.removeItem('mentor_recent_proposals');
    setUser(null);
    // Clear all cached queries on logout
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
