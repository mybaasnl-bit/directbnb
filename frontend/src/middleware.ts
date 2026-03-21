import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['nl', 'en'],
  defaultLocale: 'nl',
  localePrefix: 'as-needed', // /nl/login → /login, /en/login stays as-is
});

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
