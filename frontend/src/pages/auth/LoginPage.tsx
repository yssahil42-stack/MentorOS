import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Layers,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Spatial3DCanvas } from '../../components/ui/Spatial3DCanvas';
import { cn } from '../../utils/cn';

export default function LoginPage() {
  const { login }    = useAuth();
  const { showToast }= useWorkspace();
  const navigate     = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email, password });
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      localStorage.setItem('mentor_workspace_role', user.role);
      const rolePath = user.role.replace('_', '-');
      navigate(`/app/${rolePath}/dashboard`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating Theme Toggle in corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle size="sm" variant="expanded" showLabel />
      </div>

      {/* Dynamic ambient backdrop glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-solar-500/15 blur-[140px] pointer-events-none" aria-hidden="true" />

      <Spatial3DCanvas defaultMode="2d" defaultPreset="standard" className="max-w-sm mx-auto">
        <div className="relative w-full z-10">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link
            to="/"
            className="flex flex-col items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-2xl p-1"
            title="Go to first page"
          >
            <div className="w-12 h-12 rounded-2xl bg-solar-500/15 border border-solar-500/35 flex items-center justify-center shadow-glow-solar group-hover:scale-105 transition-transform">
              <Layers className="h-6 w-6 text-solar-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-text-primary group-hover:text-solar-500 transition-colors tracking-tight">
              MentorOS
            </h1>
          </Link>
          <p className="text-xs text-text-muted">Sign in to your intelligent workspace</p>
        </div>

        {/* Card */}
        <div className="card p-6 md:p-7 shadow-card-hover border-border-base backdrop-blur-md">
          <form onSubmit={handleSubmit} noValidate aria-label="Sign in form">
            {/* Error banner */}
            {error && (
              <div role="alert" className="mb-4 px-3.5 py-2.5 rounded-xl bg-danger/10 border border-danger/25 text-xs text-danger font-medium flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="login-email" className="block text-xs font-semibold text-text-secondary mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                aria-required="true"
                disabled={loading}
                className={cn(
                  'w-full h-10 px-3.5 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                  'bg-bg-elevated border border-border-base',
                  'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                  'disabled:opacity-50 shadow-sm',
                )}
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  aria-required="true"
                  disabled={loading}
                  className={cn(
                    'w-full h-10 px-3.5 pr-10 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                    'bg-bg-elevated border border-border-base',
                    'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                    'disabled:opacity-50 shadow-sm',
                  )}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus rounded-lg"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye    className="h-4 w-4" aria-hidden="true" />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-10 rounded-xl text-sm font-bold text-white',
                'bg-solar-500 hover:bg-solar-600 shadow-md hover:shadow-glow-solar',
                'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
                'flex items-center justify-center gap-2',
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Signing in…' : 'Sign in to MentorOS'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-xs text-text-muted">
          No account yet?{' '}
          <Link
            to="/register"
            className="text-student-500 hover:text-student-600 font-bold transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Create an account
          </Link>
        </p>
        </div>
      </Spatial3DCanvas>
    </div>
  );
}
