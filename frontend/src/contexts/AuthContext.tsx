import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../types/user';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/user';
import { api } from '../services/api';
import { queryClient } from '../store/queryClient';

// ─── Context Shape ───────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (req: LoginRequest)    => Promise<User>;
  register: (req: RegisterRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Storage Keys ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'mentor_token';
const USER_KEY  = 'mentor_user';

// ─── Provider ────────────────────────────────────────────────────────────────

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

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('mentor_workspace_role');
    localStorage.removeItem('mentor_recent_proposals');
    setUser(null);
    // Clear all cached queries on logout
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }}>
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
