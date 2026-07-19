import * as Sentry from '@sentry/node';

// Initialize Sentry SDK for APM and error tracking
export function initObservability() {
  const dsn = process.env.SENTRY_DSN;
  const env = process.env.NODE_ENV || 'development';

  if (dsn) {
    Sentry.init({
      dsn,
      environment: env,
      tracesSampleRate: 1.0,
    });
    console.log(`[Observability] Sentry APM successfully initialized in environment: ${env}`);
  } else {
    console.log('[Observability] Sentry DSN not provided; running without external APM services.');
  }
}

// Helper to capture exception reports dynamically
export function reportError(error: Error | any, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }
}
