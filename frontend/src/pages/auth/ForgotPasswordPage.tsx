import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Loader2, ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Spatial3DCanvas } from '../../components/ui/Spatial3DCanvas';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [directResetUrl, setDirectResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const resp: any = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      if (resp?.reset_url) {
        setDirectResetUrl(resp.reset_url);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Unable to request password reset.';
      setError(msg);
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
          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  Check your inbox
                </h1>
                <p className="text-xs text-text-secondary leading-relaxed">
                  We have generated a password reset link for{' '}
                  <strong className="text-text-primary font-semibold">{email}</strong>.
                </p>
              </div>

              {directResetUrl && (
                <div className="p-3 rounded-xl bg-bg-subtle/80 border border-border-base text-left space-y-2 mt-4">
                  <p className="text-3xs text-text-muted">
                    Instant link for this session:
                  </p>
                  <Link
                    to={directResetUrl}
                    className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-semibold text-white bg-accent-primary hover:bg-accent-hover rounded-lg transition-colors shadow-sm"
                  >
                    Click to Reset Password Now &rarr;
                  </Link>
                </div>
              )}

              <div className="pt-4 border-t border-border-base/50">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-10 h-10 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  Reset your password
                </h1>
                <p className="text-xs text-text-secondary mt-1">
                  Enter your registered account email and we will send you a reset link.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-text-secondary mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="reset-email"
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

                <button
                  type="submit"
                  disabled={loading || !email}
                  className={cn(
                    'w-full h-10 rounded-xl font-semibold text-xs tracking-wide text-white',
                    'bg-accent-primary hover:bg-accent-hover',
                    'transition-all duration-150 transform active:scale-[0.98]',
                    'disabled:opacity-50 disabled:cursor-not-allowed shadow-md',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-border-base text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Remember your password? Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </Spatial3DCanvas>
    </div>
  );
}
