import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of transactions in production for performance monitoring.
  // Set to 1.0 during initial rollout if you want full coverage.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay 1 % of all sessions, 100 % of sessions with an error.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media to protect user privacy by default.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Only send events in production; suppress noise during local development.
  enabled: process.env.NODE_ENV === 'production',

  // Tag every event with the deployment environment.
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
});
