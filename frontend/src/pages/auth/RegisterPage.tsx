import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Layers,
  GraduationCap,
  Briefcase,
  Code2,
  Search,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Spatial3DCanvas } from '../../components/ui/Spatial3DCanvas';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { cn } from '../../utils/cn';
import type { UserRole } from '../../types/user';

// ─── Role Option ─────────────────────────────────────────────────────────────

interface RoleOptionData {
  id: UserRole;
  label: string;
  tagline: string;
  color: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOptionData[] = [
  {
    id: 'student',
    label: 'Student',
    tagline: 'Studies & academic projects',
    color: '#6366F1',
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    tagline: 'Work commitments & deliverables',
    color: '#8B5CF6',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: 'developer',
    label: 'Developer',
    tagline: 'Build plans & portfolio milestones',
    color: '#06B6D4',
    icon: <Code2 className="h-4 w-4" />,
  },
  {
    id: 'job_seeker',
    label: 'Job Seeker',
    tagline: 'Applications & interview preparation',
    color: '#10B981',
    icon: <Search className="h-4 w-4" />,
  },
];

function RoleOption({
  option,
  selected,
  onSelect,
}: {
  option: RoleOptionData;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2.5 p-3 rounded-xl border text-left w-full shadow-sm',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        'active:translate-y-[1px]',
        selected
          ? 'border-current shadow-sm translate-y-[1px]'
          : 'border-border-base bg-bg-surface hover:bg-bg-elevated hover:border-border-hover'
      )}
      style={
        selected
          ? {
              backgroundColor: `${option.color}15`,
              borderColor: option.color,
              color: option.color,
              boxShadow: `0 2px 8px -1px ${option.color}25`,
            }
          : {}
      }
      aria-pressed={selected}
      aria-label={`Select ${option.label} role`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
        style={{ backgroundColor: `${option.color}20`, color: option.color }}
        aria-hidden="true"
      >
        {option.icon}
      </div>
      <div className="min-w-0">
        <p className={cn('text-xs font-bold', selected ? '' : 'text-text-primary')}>
          {option.label}
        </p>
        <p className="text-2xs text-text-muted truncate">{option.tagline}</p>
      </div>
      {selected && (
        <div
          className="ml-auto shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: option.color }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.color }} />
        </div>
      )}
    </button>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useWorkspace();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential, role || 'student');
      showToast(`Welcome to MentorOS, ${user.full_name}!`, 'success');
      localStorage.setItem('mentor_workspace_role', user.role);
      const rolePath = user.role.replace('_', '-');
      navigate(`/app/${rolePath}/dashboard`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-up failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, role, showToast, navigate]);

  const handleGoogleError = useCallback((err: string) => {
    setError(err);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError('Password must be at most 72 UTF-8 bytes.');
      return;
    }
    if (!role) {
      setError('Please select your workspace type.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({ full_name: fullName, email, password, role });
      showToast(`Welcome to MentorOS, ${user.full_name}! Registration completed.`, 'success');
      const rolePath = user.role.replace('_', '-');
      navigate(`/app/${rolePath}/dashboard`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12 relative overflow-y-auto">
      {/* Floating Theme Toggle in corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle size="sm" variant="expanded" showLabel />
      </div>

      {/* Dynamic ambient backdrop glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-student-500/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <Spatial3DCanvas defaultMode="2d" defaultPreset="standard" className="max-w-md mx-auto">
        <div className="relative w-full z-10">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-2xl p-1"
              title="Back to first page"
            >
              <div className="w-12 h-12 rounded-2xl bg-student-500/15 border border-student-500/30 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Layers className="h-6 w-6 text-student-500" aria-hidden="true" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-text-primary group-hover:text-student-500 transition-colors">
                MentorOS
              </span>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Create your workspace
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Choose your role, then personalize your workspace
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="card p-6 md:p-7 shadow-card-hover border-border-base backdrop-blur-md">
            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="mb-4 px-3.5 py-2.5 rounded-xl bg-danger/10 border border-danger/25 text-xs text-danger font-medium flex items-center gap-2"
              >
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-Up */}
            <div className="mb-4">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                disabled={loading}
              />
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-base" />
              </div>
              <div className="relative bg-bg-surface px-3 text-2xs uppercase tracking-wider text-text-faint font-semibold">
                or register with email
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate aria-label="Create account form">
              {/* Full name */}
              <div className="mb-4">
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-text-secondary mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  disabled={loading}
                  className={cn(
                    'w-full h-10 px-3.5 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                    'bg-bg-elevated border border-border-base',
                    'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                    'disabled:opacity-50 shadow-sm'
                  )}
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-text-secondary mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className={cn(
                    'w-full h-10 px-3.5 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                    'bg-bg-elevated border border-border-base',
                    'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                    'disabled:opacity-50 shadow-sm'
                  )}
                />
              </div>

              {/* Password */}
              <div className="mb-5">
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-text-secondary mb-1.5"
                >
                  Password{' '}
                  <span className="text-text-faint font-normal">
                    (12+ characters; max 72 UTF-8 bytes)
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={12}
                    maxLength={72}
                    disabled={loading}
                    className={cn(
                      'w-full h-10 px-3.5 pr-10 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                      'bg-bg-elevated border border-border-base',
                      'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                      'disabled:opacity-50 shadow-sm'
                    )}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus rounded-lg"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Role selection */}
              <fieldset className="mb-6">
                <legend className="block text-xs font-semibold text-text-secondary mb-2">
                  Select Your Workspace Role
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <RoleOption
                      key={opt.id}
                      option={opt}
                      selected={role === opt.id}
                      onSelect={() => setRole(opt.id)}
                    />
                  ))}
                </div>
              </fieldset>

              {/* Submit */}
              <button
                id="complete-registration-button"
                type="submit"
                disabled={loading}
                aria-label="Complete registration and create account"
                className={cn(
                  'w-full h-10 rounded-xl text-sm font-bold text-white',
                  'bg-student-500 hover:bg-student-600 shadow-md hover:shadow-glow-indigo',
                  'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                  'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
                  'flex items-center justify-center gap-2'
                )}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading ? 'Completing registration…' : 'Complete Registration'}
              </button>
            </form>
          </div>

          {/* Login link */}
          <p className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-student-500 hover:text-student-600 font-bold transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Spatial3DCanvas>
    </div>
  );
}
