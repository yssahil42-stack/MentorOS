import * as Sentry from '@sentry/react';

/**
 * Sentry Error Monitoring Configuration
 * Configured for Sentry Free Tier (5,000 errors/month limit).
 * Sampling and filtering are applied to preserve error budget.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('[Sentry] VITE_SENTRY_DSN not configured; running in mock/local mode.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    // Sentry free tier: 5k errors/month. Full capture for real errors, zero trace overhead.
    sampleRate: 1.0,
    tracesSampleRate: 0.05,
    beforeSend(event, hint) {
      const error = hint?.originalException;
      // Filter non-actionable client network aborts and cancellations
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return null;
        }
      }
      return event;
    },
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Sentry]', error, context);
  }
}

export { Sentry };
