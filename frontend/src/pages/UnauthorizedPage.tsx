import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_CONFIGS } from '../config/roles';
import type { UserRole } from '../types/user';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const roleConfig = user ? ROLE_CONFIGS[user.role as UserRole] : null;

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-sm gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-danger" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Access Restricted</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            This workspace area is restricted to a different user type. You're signed in as a{' '}
            <strong className="text-text-primary">{roleConfig?.label ?? 'user'}</strong>.
          </p>
        </div>
        {roleConfig && (
          <Link
            to={`${roleConfig.routePrefix}/dashboard`}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-student-500 hover:bg-student-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Go to my dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
