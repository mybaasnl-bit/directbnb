'use client';

import { useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { setAuth, api } from '@/lib/api';

/**
 * OAuth callback page — handles the redirect from the backend after
 * Google / Microsoft OAuth completes.
 *
 * The backend redirects here with:
 *   ?at=<accessToken>&rt=<refreshToken>
 *
 * We store the tokens, fetch the user, then forward to the dashboard.
 * On any error we redirect to /login?error=oauth_failed.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const at = searchParams.get('at');
    const rt = searchParams.get('rt');

    if (!at || !rt) {
      router.replace(`/${locale}/login?error=oauth_failed`);
      return;
    }

    // Store tokens first so the api interceptor sends the Authorization header
    setAuth(at, rt);

    // Fetch the current user to populate the React Query cache
    api
      .get('/auth/me')
      .then((res) => {
        const user = res.data?.data ?? res.data;
        // Redirect to dashboard; the layout will read the cached user
        router.replace(`/${locale}/dashboard`);
      })
      .catch(() => {
        router.replace(`/${locale}/login?error=oauth_failed`);
      });
  }, [searchParams, locale, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">D</span>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent" />
        <p className="text-sm text-slate-500">Inloggen…</p>
      </div>
    </div>
  );
}
