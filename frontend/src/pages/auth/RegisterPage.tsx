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
  Check,
  Circle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { cn } from '../../utils/cn';
import type { UserRole } from '../../types/user';

// ─── Role Option ─────────────────────────────────────────────────────────────

interface RoleOptionData {
  id: UserRole;
  label: string;
  tagline: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOptionData[] = [
  {
    id: 'student',
    label: 'Student',
    tagline: 'Courses, assignments and study plans',
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    tagline: 'Client work, deadlines and deliverables',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: 'developer',
    label: 'Developer',
    tagline: 'Build plans and portfolio milestones',
    icon: <Code2 className="h-4 w-4" />,
  },
  {
    id: 'job_seeker',
    label: 'Job Seeker',
    tagline: 'Applications and interview prep',
    icon: <Search className="h-4 w-4" />,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  freelancer: 'Freelancer',
  developer: 'Developer',
  job_seeker: 'Job Seeker',
};

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

  const passwordBytes = new TextEncoder().encode(password).length;
  const hasMinLength = password.length >= 12;
  const hasValidBytes = passwordBytes <= 72;

  const handleGoogleSuccess = useCallback(
    async (credential: string) => {
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
    },
    [loginWithGoogle, role, showToast, navigate]
  );

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
    if (passwordBytes > 72) {
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
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0e14] text-stone-900 dark:text-stone-100 font-sans selection:bg-[#c04b1e]/20 selection:text-[#c04b1e] transition-colors relative overflow-x-hidden flex flex-col">
      {/* ─── Ambient Peach Glow matching Landing Page ─────────────────────── */}
      <div
        className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-orange-200/35 via-amber-100/25 to-transparent blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* ─── Header matching Landing Page ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/90 dark:bg-[#0c0e14]/90 backdrop-blur-md border-b border-[#eee7e0] dark:border-stone-800/80 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 h-16">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl"
            title="Back to home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c04b1e] text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-[#a83f17] transition-colors">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-stone-950 dark:text-white tracking-tight">
              MentorOS
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <span className="hidden sm:inline text-stone-500 dark:text-stone-400 font-medium">
              Already have an account?
            </span>
            <Link
              to="/login"
              className="font-semibold text-stone-700 dark:text-stone-200 hover:text-[#c04b1e] dark:hover:text-orange-400 transition-colors"
            >
              Sign in
            </Link>
            <ThemeToggle size="sm" variant="icon" />
          </div>
        </div>
      </header>

      {/* ─── Main Content Layout ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-[#c04b1e] dark:text-orange-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c04b1e] animate-pulse" />
              <span>Get started in under 2 minutes</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-stone-950 dark:text-white tracking-tight leading-[1.15]">
              One calm workspace for everything you are working toward.
            </h1>

            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
              Pick a role and MentorOS sets up the right dashboard, tasks and AI planning for you.
            </p>

            {/* Feature bullets */}
            <div className="space-y-3.5 pt-2">
              {[
                'A dashboard shaped around your role',
                'AI that plans your week around real deadlines',
                'Notes, tasks and milestones in one place',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#c04b1e]/10 border border-[#c04b1e]/20 text-[#c04b1e] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Create Workspace Card */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              {/* Card Header */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white tracking-tight">
                  Create your workspace
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">
                  Choose your role, then add your details.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in-50 duration-150"
                >
                  {error}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <span className="sr-only">Select Your Workspace Role</span>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-2.5">
                  I am a
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRole(opt.id);
                          setError('');
                        }}
                        className={cn(
                          'p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-2xs',
                          isSelected
                            ? 'border-[#c04b1e] bg-[#fbf5f0] dark:bg-[#c04b1e]/10 ring-1 ring-[#c04b1e]'
                            : 'border-[#eee7e0] dark:border-stone-800 bg-[#faf8f5]/50 dark:bg-stone-900/40 hover:border-stone-400 dark:hover:border-stone-600'
                        )}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                              isSelected
                                ? 'bg-[#c04b1e] text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                            )}
                          >
                            {opt.icon}
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-stone-950 dark:text-white">
                            {opt.label}
                          </div>
                        </div>
                        <div className="mt-2 text-2xs text-stone-500 dark:text-stone-400 font-medium leading-snug">
                          {opt.tagline}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Google Sign In */}
              <div className="pt-1">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="continue_with"
                  disabled={loading}
                />
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#eee7e0] dark:border-stone-800" />
                </div>
                <div className="relative bg-white dark:bg-[#161922] px-3 text-3xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold">
                  OR USE EMAIL
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                noValidate
                aria-label="Create account form"
                className="space-y-3.5"
              >
                {/* Full name */}
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Full name
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
                    className="w-full h-10.5 px-3.5 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs"
                  />
                </div>

                {/* Email address */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Email address
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
                    className="w-full h-10.5 px-3.5 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 12 characters"
                      required
                      minLength={12}
                      maxLength={72}
                      disabled={loading}
                      className="w-full h-10.5 px-3.5 pr-10 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
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

                  {/* Password Requirements Checklist */}
                  <div className="mt-2 space-y-1 text-2xs">
                    <div
                      className={cn(
                        'flex items-center gap-1.5 font-medium transition-colors',
                        hasMinLength
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-stone-500 dark:text-stone-400'
                      )}
                    >
                      {hasMinLength ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                      <span>At least 12 characters</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 font-medium transition-colors',
                        hasValidBytes
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 font-semibold'
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>No more than 72 bytes (UTF-8)</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    id="complete-registration-button"
                    type="submit"
                    disabled={loading}
                    aria-label="Complete registration and create account"
                    className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#c04b1e] hover:bg-[#a83f17] shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {loading
                      ? 'Creating workspace…'
                      : role
                        ? `Create ${ROLE_LABELS[role]} workspace`
                        : 'Create workspace'}
                  </button>
                </div>
              </form>

              {/* Sign In Link */}
              <div className="pt-1 text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#c04b1e] hover:text-[#a83f17] font-semibold transition-colors hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
