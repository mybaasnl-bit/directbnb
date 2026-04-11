'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Locale-level error boundary — catches errors inside the [locale] layout
 * and its children (dashboard, auth, public pages, etc.).
 *
 * Automatically reports the exception to Sentry and offers the user a way
 * to recover without a full page reload.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-5">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Er is iets misgegaan</h1>
          <p className="text-sm text-slate-500 mt-2">
            Een onverwachte fout heeft de pagina onderbroken. De melding is automatisch
            doorgestuurd naar ons team.
          </p>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <pre className="mt-3 text-xs text-left bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto text-red-700">
              {error.message}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-brand hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Probeer opnieuw
          </button>
          <Link
            href="/"
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-xl text-sm transition-colors text-center"
          >
            Terug naar home
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">Foutcode: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
