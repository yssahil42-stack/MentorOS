import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../../../contexts/AuthContext';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('throws error when used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within <AuthProvider>');
    consoleError.mockRestore();
  });

  it('initializes with null user when no token exists in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restores user from localStorage on mount and verifies with /auth/me', async () => {
    const mockUser = {
      id: 1,
      email: 'student@mentoros.dev',
      full_name: 'Alex Student',
      role: 'student',
      is_active: true,
    };
    localStorage.setItem('mentor_token', 'saved-token');
    localStorage.setItem('mentor_user', JSON.stringify(mockUser));

    (api.get as any).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('logs in successfully and updates localStorage and state', async () => {
    const mockUser = {
      id: 2,
      email: 'dev@mentoros.dev',
      full_name: 'Dev User',
      role: 'developer',
      is_active: true,
    };
    (api.post as any).mockResolvedValueOnce({
      access_token: 'new-token',
      token_type: 'bearer',
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
    });

    let loggedInUser: any;
    await act(async () => {
      loggedInUser = await result.current.login({
        email: 'dev@mentoros.dev',
        password: 'Password123',
      });
    });

    expect(loggedInUser).toEqual(mockUser);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('mentor_token')).toBe('new-token');
  });

  it('logs out and purges storage and user state', async () => {
    localStorage.setItem('mentor_token', 'active-token');
    localStorage.setItem('mentor_user', JSON.stringify({ id: 3, role: 'student' }));

    (api.post as any).mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('mentor_token')).toBeNull();
    expect(localStorage.getItem('mentor_user')).toBeNull();
  });
});
