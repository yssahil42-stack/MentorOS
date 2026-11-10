import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Layers, Loader2, ArrowLeft, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Spatial3DCanvas } from '../../components/ui/Spatial3DCanvas';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

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

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenValid(false);
      setVerifyError('No password reset token was provided.');
      return;
    }

    const verifyToken = async () => {
      try {
        const resp: any = await api.post('/auth/verify-reset-token', { token });
        setTokenValid(true);
        setTargetEmail(resp?.email || '');
      } catch (err: any) {
        setTokenValid(false);
        const msg = err?.response?.data?.detail || err?.message || 'Password reset link is invalid or has expired.';
        setVerifyError(msg);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
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
      const msg = err?.response?.data?.detail || err?.message || 'Failed to reset password.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-bg-base overflow-hidden">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-6xl mx-auto z-20">
        <Link
          to="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg"
        >
          <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-text-primary">
            Mentor<span className="text-accent-primary">OS</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Glass Card wrapped in Spatial3DCanvas */}
      <Spatial3DCanvas defaultMode="2d" defaultPreset="standard" className="w-full max-w-sm mx-auto z-10 my-8">
        <div className="relative rounded-2xl bg-bg-surface/80 backdrop-blur-xl border border-border-base p-8 shadow-2xl">
          {isVerifying ? (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent-primary mx-auto" />
              <p className="text-xs text-text-secondary">Verifying reset link...</p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-danger/10 border border-danger/20 text-danger flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  Invalid or Expired Link
                </h1>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {verifyError || 'This password reset link is invalid or has expired.'}
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-semibold text-white bg-accent-primary hover:bg-accent-hover rounded-xl transition-colors shadow-sm"
                >
                  Request a New Link
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : resetSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  Password Reset Complete
                </h1>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your password has been successfully updated. You can now log into your account.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-white bg-accent-primary hover:bg-accent-hover rounded-xl transition-colors shadow-md"
                >
                  Sign In with New Password
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-10 h-10 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  Set new password
                </h1>
                {targetEmail && (
                  <p className="text-xs text-text-muted mt-1">
                    For account: <strong className="text-text-primary">{targetEmail}</strong>
                  </p>
                )}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-text-secondary mb-1.5"
                  >
                    New Password <span className="text-text-muted font-normal text-3xs">(min. 8 characters)</span>
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
                      className={cn(
                        'w-full h-10 px-3.5 pr-10 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                        'bg-bg-elevated border border-border-base',
                        'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                        'disabled:opacity-50 shadow-sm'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-text-secondary mb-1.5"
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
                      className={cn(
                        'w-full h-10 px-3.5 pr-10 rounded-xl text-sm text-text-primary placeholder:text-text-faint',
                        'bg-bg-elevated border border-border-base',
                        'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
                        'disabled:opacity-50 shadow-sm'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg"
                      aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className={cn(
                    'w-full h-10 rounded-xl font-semibold text-xs tracking-wide text-white',
                    'bg-accent-primary hover:bg-accent-hover',
                    'transition-all duration-150 transform active:scale-[0.98]',
                    'disabled:opacity-50 disabled:cursor-not-allowed shadow-md',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Updating password...' : 'Update Password'}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-border-base text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cancel and Return to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </Spatial3DCanvas>
    </div>
  );
}
