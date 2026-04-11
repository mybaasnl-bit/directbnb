'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Root-level error boundary — catches errors thrown inside the root layout.
 * Must render its own <html> and <body> because the root layout is broken.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
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
    <html lang="nl">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Er is iets misgegaan</h1>
          <p className="text-sm text-slate-500">
            Een onverwachte fout heeft de pagina onbruikbaar gemaakt. Onze foutmeldingen
            zijn automatisch doorgestuurd zodat we het kunnen oplossen.
          </p>
          <button
            onClick={reset}
            className="w-full bg-brand hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Probeer opnieuw
          </button>
        </div>
      </body>
    </html>
  );
}
