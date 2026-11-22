import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Loader2,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { api } from '../../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract token from either search query (?token=...) or hash (#token=...)
  const hashParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.replace(/^#\/?/, ''))
    : new URLSearchParams();
  const token = searchParams.get('token') || hashParams.get('token') || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);

  // Token validation on mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenValid(false);
      setVerifyError('No password reset token was provided in the link.');
      return;
    }

    let isMounted = true;
    const verifyToken = async () => {
      try {
        const resp: any = await api.post('/auth/verify-reset-token', { token });
        if (isMounted) {
          setTokenValid(true);
          setTargetEmail(resp?.email || '');
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValid(false);
          const msg =
            err?.message ||
            'This password reset link is invalid, already used, or has expired.';
          setVerifyError(msg);
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Auto redirect countdown on success
  useEffect(() => {
    if (!resetSuccess) return;
    if (countdown <= 0) {
      navigate('/login', { replace: true, state: { email: targetEmail } });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetSuccess, countdown, navigate, targetEmail]);

  // Real-time password requirement metrics
  const passwordBytes = new TextEncoder().encode(password).length;
  const hasMinLength = password.length >= 8;
  const hasValidBytes = passwordBytes <= 72;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Strength score
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!hasMinLength) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (!hasValidBytes) {
      setFormError('Password must be at most 72 UTF-8 bytes.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: password,
      });
      setResetSuccess(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to reset password. Please try requesting a new link.';
      setFormError(msg);
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
              Know your password?
            </span>
            <Link
              to="/login"
              className="font-semibold text-stone-700 dark:text-stone-200 hover:text-[#c04b1e] dark:hover:text-orange-400 transition-colors"
            >
              Sign In
            </Link>
            <div className="h-4 w-px bg-stone-300 dark:bg-stone-700" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {isVerifying ? (
              /* Verifying Token State */
              <div className="text-center py-10 space-y-4">
                <Loader2 className="w-9 h-9 animate-spin text-[#c04b1e] mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Verifying security link...
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Checking authorization and signature
                  </p>
                </div>
              </div>
            ) : !tokenValid ? (
              /* Invalid or Expired Token View */
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-2xs">
                  <ShieldAlert className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-xl font-bold text-stone-950 dark:text-white tracking-tight">
                    Invalid or Expired Link
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
                    {verifyError || 'This password reset link is invalid, already used, or has expired (links expire after 15 minutes).'}
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <Link
                    to="/forgot-password"
                    className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Request a New Reset Link
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                  >
                    Return to Sign In
                  </Link>
                </div>
              </div>
            ) : resetSuccess ? (
              /* Success View */
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-xl font-bold text-stone-950 dark:text-white tracking-tight">
                    Password Reset Complete!
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Your password has been successfully updated. You can now log into your account.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 text-xs text-stone-500">
                  Redirecting to Sign In in <strong className="text-stone-900 dark:text-white">{countdown}s</strong>...
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login', { replace: true, state: { email: targetEmail } })}
                    className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In with New Password &rarr;
                  </button>
                </div>
              </div>
            ) : (
              /* New Password Form View */
              <>
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#c04b1e]/10 border border-[#c04b1e]/20 text-[#c04b1e] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Lock className="w-6 h-6 text-[#c04b1e]" />
                  </div>
                  <h1 className="text-2xl font-bold text-stone-950 dark:text-white tracking-tight">
                    Set new password
                  </h1>
                  {targetEmail && (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      For account: <strong className="text-stone-900 dark:text-white">{targetEmail}</strong>
                    </p>
                  )}
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        className="w-full h-10.5 pl-3.5 pr-10 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength Bar */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="grid grid-cols-4 gap-1.5 h-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full rounded-full transition-colors ${
                                step <= strengthScore
                                  ? strengthScore <= 1
                                    ? 'bg-rose-500'
                                    : strengthScore <= 2
                                    ? 'bg-amber-500'
                                    : strengthScore <= 3
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500'
                                  : 'bg-stone-200 dark:bg-stone-800'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span>
                            Strength:{' '}
                            <strong className="text-stone-700 dark:text-stone-300">
                              {strengthScore <= 1
                                ? 'Weak'
                                : strengthScore <= 2
                                ? 'Fair'
                                : strengthScore <= 3
                                ? 'Good'
                                : 'Strong'}
                            </strong>
                          </span>
                          <span>{passwordBytes}/72 bytes</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        className="w-full h-10.5 pl-3.5 pr-10 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                        aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-stone-900/50 border border-[#eee7e0] dark:border-stone-800 text-[11px] space-y-1 text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}>
                        {hasMinLength ? '✓' : '•'}
                      </span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasValidBytes ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {hasValidBytes ? '✓' : '✕'}
                      </span>
                      <span>At most 72 UTF-8 bytes</span>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {passwordsMatch ? '✓' : '✕'}
                        </span>
                        <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !hasMinLength || !hasValidBytes || !passwordsMatch}
                    className="w-full h-11 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Updating password...' : 'Update Password'}</span>
                  </button>
                </form>

                <div className="pt-4 border-t border-[#eee7e0] dark:border-stone-800 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-[#c04b1e] dark:hover:text-orange-400 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cancel and Return to Sign In</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
