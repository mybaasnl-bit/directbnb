import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['nl', 'en'],
  defaultLocale: 'nl',
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
