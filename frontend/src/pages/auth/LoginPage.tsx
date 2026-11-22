import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Layers, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { cn } from '../../utils/cn';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => (location.state as { email?: string })?.email || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = useCallback(
    async (credential: string) => {
      setError('');
      setLoading(true);
      try {
        const user = await loginWithGoogle(credential);
        showToast(`Welcome, ${user.full_name}!`, 'success');
        localStorage.setItem('mentor_workspace_role', user.role);
        const rolePath = user.role.replace('_', '-');
        navigate(`/app/${rolePath}/dashboard`, { replace: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, showToast, navigate]
  );

  const handleGoogleError = useCallback((err: string) => {
    setError(err);
  }, []);

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
              Don't have an account?
            </span>
            <Link
              to="/register"
              className="font-semibold text-stone-700 dark:text-stone-200 hover:text-[#c04b1e] dark:hover:text-orange-400 transition-colors"
            >
              Get started
            </Link>
            <ThemeToggle size="sm" variant="icon" />
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Brand & Heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">
              Sign in to your intelligent workspace
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in-50 duration-150"
              >
                {error}
              </div>
            )}

            {/* Google Sign-In */}
            <div>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                disabled={loading}
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#eee7e0] dark:border-stone-800" />
              </div>
              <div className="relative bg-white dark:bg-[#161922] px-3 text-3xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold">
                OR CONTINUE WITH EMAIL
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Sign in form"
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Email address
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
                  className="w-full h-10.5 px-3.5 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-2xs text-[#c04b1e] hover:text-[#a83f17] font-medium transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
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
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#c04b1e] hover:bg-[#a83f17] shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? 'Signing in…' : 'Sign in to MentorOS'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="pt-1 text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#c04b1e] hover:text-[#a83f17] font-semibold transition-colors hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
