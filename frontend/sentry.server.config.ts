import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture all server-side transactions in production.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Only send events in production.
  enabled: process.env.NODE_ENV === 'production',

  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
});
