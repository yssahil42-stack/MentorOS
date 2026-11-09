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
    lower.includes('college') ||
    lower === 'yssahil42@gmail.com'
  ) {
    return 'student';
  }
  if (lower.includes('dev') || lower === 'yssahil422@gmail.com' || lower === 'yssahil2@gmail.com') {
    return 'developer';
  }
  if (lower.includes('freelance') || lower === 'yssahil412@gmail.com' || lower === 'yssahil421@gmail.com' || lower === 'yssahil1@gmail.com') {
    return 'freelancer';
  }
  if (lower.includes('job') || lower.includes('seek') || lower === 'yssahil424@gmail.com' || lower === 'yssahil3@gmail.com') {
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
    try {
      const res = await api.post<AuthResponse>('/auth/login', req);
      return persistSession(res);
    } catch (err: any) {
      const isNetworkError =
        err?.status === 0 ||
        err?.message?.includes('Unable to reach the server') ||
        err?.message?.includes('Network Error');
      if (isNetworkError) {
        const demoRole = resolveRoleForUser(req.email);
        const rawName = req.email.split('@')[0].replace(/[._-]/g, ' ') || 'Demo User';
        const demoName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        const demoUser: User = {
          id: 1,
          email: req.email,
          full_name: demoName,
          role: demoRole,
          created_at: new Date().toISOString(),
        };
        return persistSession({
          access_token: 'demo_token_' + Date.now(),
          user: demoUser,
        });
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (req: RegisterRequest): Promise<User> => {
    try {
      const res = await api.post<AuthResponse>('/auth/register', req);
      return persistSession(res);
    } catch (err: any) {
      const isNetworkError =
        err?.status === 0 ||
        err?.message?.includes('Unable to reach the server') ||
        err?.message?.includes('Network Error');
      if (isNetworkError) {
        const demoUser: User = {
          id: Date.now(),
          email: req.email,
          full_name: req.full_name || 'New Member',
          role: resolveRoleForUser(req.email, req.role),
          created_at: new Date().toISOString(),
        };
        return persistSession({
          access_token: 'demo_token_' + Date.now(),
          user: demoUser,
        });
      }
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, role?: string): Promise<User> => {
    try {
      const res = await api.post<AuthResponse>('/auth/google', { credential, role });
      return persistSession(res);
    } catch (err: any) {
      const isNetworkError =
        err?.status === 0 ||
        err?.message?.includes('Unable to reach the server') ||
        err?.message?.includes('Network Error');
      if (isNetworkError) {
        const demoUser: User = {
          id: 1,
          email: 'google.user@mentoros.dev',
          full_name: 'Google User',
          role: resolveRoleForUser('google.user@mentoros.dev', role),
          created_at: new Date().toISOString(),
        };
        return persistSession({
          access_token: 'demo_token_' + Date.now(),
          user: demoUser,
        });
      }
      throw err;
    }
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
