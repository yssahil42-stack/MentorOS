import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Send, Check, Home, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export interface ServerErrorPageProps {
  error?: Error | null;
  onReport?: () => void;
  onRetry?: () => void;
  reported?: boolean;
}

export default function ServerErrorPage({
  error,
  onReport,
  onRetry,
  reported: controlledReported,
}: ServerErrorPageProps) {
  const [internalReported, setInternalReported] = useState(false);
  const isReported = controlledReported ?? internalReported;

  const handleReport = () => {
    if (onReport) {
      onReport();
    } else {
      window.dispatchEvent(
        new CustomEvent('mentor:error', {
          detail: error ?? new Error('500 - Internal Server Error'),
        })
      );
      setInternalReported(true);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-screen bg-bg-base flex items-center justify-center p-6 text-text-primary"
    >
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border-base shadow-card text-center space-y-6 animate-fade-in">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-danger/10 border border-danger/25 flex items-center justify-center text-danger">
          <AlertTriangle className="w-8 h-8" aria-hidden="true" />
        </div>

        {/* Status & Title */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest text-danger uppercase bg-danger/10 px-2.5 py-0.5 rounded-full">
            Error 500
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Something Went Wrong
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            MentorOS ran into an unexpected server or rendering error. You can report it to help us
            fix the issue or reload to continue.
          </p>
        </div>

        {/* Error Message Snippet */}
        {error?.message && (
          <div className="p-3 rounded-xl bg-bg-elevated/70 border border-border-subtle text-left max-h-28 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-3xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3 text-danger" />
              <span>Diagnostic Details</span>
            </div>
            <code className="text-3xs font-mono text-danger break-words">{error.message}</code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReport}
            disabled={isReported}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
          >
            {isReported ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Error Reported</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-text-muted" />
                <span>Report Error</span>
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </Button>

          <a href="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="w-full inline-flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
