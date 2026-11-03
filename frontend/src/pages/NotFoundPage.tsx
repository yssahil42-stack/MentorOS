import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_CONFIGS } from '../config/roles';
import type { UserRole } from '../types/user';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const roleConfig = user ? ROLE_CONFIGS[user.role as UserRole] : null;
  const dashboardPath = roleConfig ? `${roleConfig.routePrefix}/dashboard` : '/app';

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 text-text-primary">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border-base shadow-card text-center space-y-6 animate-fade-in">
        {/* Visual Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>

        {/* Status & Title */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-0.5 rounded-full">
            Error 404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Page Not Found</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved, renamed, or
            never existed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>

          {isAuthenticated ? (
            <Link to={dashboardPath} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                className="w-full inline-flex items-center justify-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                className="w-full inline-flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
