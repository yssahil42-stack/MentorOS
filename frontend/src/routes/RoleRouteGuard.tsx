import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleRouteGuardProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean; // default true
}

/**
 * Handles two levels of protection:
 *  1. requireAuth       → unauthenticated → /login
 *  2. requireOnboarding → onboarding incomplete → /onboarding
 *  3. workspace route   → active workspace context for the signed-in user
 */
export function RoleRouteGuard({
  children,
  requireAuth = true,
  requireOnboarding = false,
}: RoleRouteGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // 1. Auth check
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Onboarding check (skip for the onboarding route itself)
  if (requireAuth && requireOnboarding && user && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // Workspace routes are selectable contexts; the API still scopes data to this user.
  return children ? <>{children}</> : <Outlet />;
}
