'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { setAuth } from '@/lib/api';
import { api } from '@/lib/api';

/**
 * OAuth callback landing page.
 * The NestJS backend redirects here after a successful Google/Microsoft login:
 *   /[locale]/auth/callback?at=<accessToken>&rt=<refreshToken>
 *
 * This page stores the tokens and fetches /auth/me, then redirects to /dashboard.
 * On error (?error=...) it shows a message and offers a retry.
 */
function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const queryClient = useQueryClient();

  const accessToken = searchParams.get('at');
  const refreshToken = searchParams.get('rt');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) return; // handled below in JSX

    if (!accessToken || !refreshToken) {
      router.replace(`/${locale}/login?error=oauth_failed`);
      return;
    }

    // Store tokens in cookies (same as useAuth login flow)
    setAuth(accessToken, refreshToken);

    // Fetch the user and warm the React Query cache
    api.get('/auth/me')
      .then((res) => {
        queryClient.setQueryData(['me'], res.data.data);
        router.replace(`/${locale}/dashboard`);
      })
      .catch(() => {
        router.replace(`/${locale}/login?error=oauth_failed`);
      });
  }, [accessToken, refreshToken, error, locale, router, queryClient]);

  if (error) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Inloggen mislukt</h2>
          <p className="text-sm text-slate-500 mb-6">
            {decodeURIComponent(error) === 'This account has been disabled.'
              ? 'Dit account is uitgeschakeld. Neem contact op met support.'
              : 'Er is iets misgegaan bij het inloggen. Probeer het opnieuw.'}
          </p>
          <button
            onClick={() => router.replace(`/${locale}/login`)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Terug naar inloggen
          </button>
        </div>
      </div>
    );
  }

  // Loading state while we process
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Inloggen…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    }>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
