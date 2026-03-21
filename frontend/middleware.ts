import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected dashboard routes: redirect to login if no token
  const isDashboardRoute = pathname.includes('/dashboard') ||
    pathname.includes('/properties') ||
    pathname.includes('/rooms') ||
    pathname.includes('/bookings') ||
    pathname.includes('/guests') ||
    pathname.includes('/calendar') ||
    pathname.includes('/settings');

  if (isDashboardRoute) {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      const locale = pathname.split('/')[1] || 'nl';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
