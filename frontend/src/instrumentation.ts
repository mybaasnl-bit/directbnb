/**
 * Next.js instrumentation hook.
 * This file is loaded once per server startup and is the correct place
 * to initialise Sentry on the server / edge runtimes.
 *
 * The client runtime is initialised via sentry.client.config.ts, which
 * @sentry/nextjs auto-injects through the Webpack plugin (withSentryConfig).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
