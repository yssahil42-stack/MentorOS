import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Loader2, ArrowLeft, Mail, CheckCircle2, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { api } from '../../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [directResetUrl, setDirectResetUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const resp: any = await api.post('/auth/forgot-password', { email: cleanEmail });
      setSuccess(true);
      if (resp?.reset_url) {
        setDirectResetUrl(resp.reset_url);
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to request password reset. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!directResetUrl) return;
    const fullUrl = directResetUrl.startsWith('http')
      ? directResetUrl
      : `${window.location.origin}${directResetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
              Remember your password?
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
            {success ? (
              /* Success View */
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-2xl bg-[#c04b1e]/10 border border-[#c04b1e]/20 text-[#c04b1e] flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-xl font-bold text-stone-950 dark:text-white tracking-tight">
                    Check your inbox
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    If an account is associated with{' '}
                    <strong className="text-stone-900 dark:text-white font-semibold">{email}</strong>,
                    a password reset link has been generated.
                  </p>
                </div>

                {directResetUrl && (
                  <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 text-left space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-stone-900 dark:text-white">
                        Direct Reset Link
                      </span>
                      <span className="text-[11px] text-stone-400">Expires in 15 mins</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate(directResetUrl)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Reset Password Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-[#eee7e0] dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 text-xs font-medium transition-colors cursor-pointer"
                        title="Copy reset link to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-xs text-stone-500 dark:text-stone-400">
                  Didn't receive an email? Check your spam folder or{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setDirectResetUrl('');
                      setError('');
                    }}
                    className="text-[#c04b1e] hover:underline font-semibold cursor-pointer"
                  >
                    try another email
                  </button>
                  .
                </div>

                <div className="pt-4 border-t border-[#eee7e0] dark:border-stone-800">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-[#c04b1e] dark:hover:text-orange-400 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Request Form View */
              <>
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#c04b1e]/10 border border-[#c04b1e]/20 text-[#c04b1e] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Mail className="w-6 h-6 text-[#c04b1e]" />
                  </div>
                  <h1 className="text-2xl font-bold text-stone-950 dark:text-white tracking-tight">
                    Forgot your password?
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
                    Enter the email associated with your account and we'll help you reset your password.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                        className="w-full h-10.5 pl-3.5 pr-10 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 bg-[#faf8f5]/60 dark:bg-stone-900/60 border border-[#eee7e0] dark:border-stone-800 focus:outline-none focus:border-[#c04b1e] focus:ring-1 focus:ring-[#c04b1e] transition-all shadow-2xs disabled:opacity-50"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full h-11 rounded-xl bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
                  </button>
                </form>

                <div className="pt-4 border-t border-[#eee7e0] dark:border-stone-800 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-[#c04b1e] dark:hover:text-orange-400 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
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
