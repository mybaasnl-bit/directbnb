import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce response headers size
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Allow the embed widget to be loaded in iframes on any external site
        source: '/:locale/embed/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ];
  },

  // Compress responses with gzip
  compress: true,

  images: {
    // Serve modern formats where supported
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Reduce JS bundle size in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Expose the instrumentation hook so Sentry can initialise on the server
  experimental: {
    instrumentationHook: true,
  },
};

// ─── Sentry Webpack plugin options ────────────────────────────────────────────
// These only apply at build time; they don't affect the runtime bundle.
const sentryWebpackPluginOptions = {
  // Silences the Sentry CLI output during builds (set to false to debug)
  silent: true,

  // Upload source maps to Sentry so stack traces show original code.
  // Requires SENTRY_AUTH_TOKEN to be set in the build environment.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Automatically tree-shake Sentry debug code out of production bundles.
  disableLogger: true,

  // Don't block the build if Sentry source-map upload fails.
  // Safe default for teams that haven't set up the auth token yet.
  errorHandler(err) {
    console.warn('[Sentry] Source map upload failed (non-fatal):', err.message);
  },
};

export default withSentryConfig(
  withNextIntl(nextConfig),
  sentryWebpackPluginOptions,
);
