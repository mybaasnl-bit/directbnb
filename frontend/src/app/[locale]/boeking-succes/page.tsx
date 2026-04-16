'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { CheckCircle2, Mail, Home, Calendar } from 'lucide-react';

// ─── Inner component (needs useSearchParams inside Suspense) ─────────────────

function SuccessContent() {
  const locale = useLocale();
  const isNl = locale === 'nl';
  const searchParams = useSearchParams();
  // Stripe appends ?session_id=cs_xxx — we display it as a reference number
  const sessionId = searchParams.get('session_id') ?? '';
  const shortRef  = sessionId ? sessionId.replace('cs_', '').slice(0, 8).toUpperCase() : null;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8 text-center">

        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          {isNl ? 'Betaling geslaagd!' : 'Payment successful!'}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {isNl
            ? 'Je boeking is bevestigd. Je ontvangt een bevestigingsmail op het opgegeven e-mailadres.'
            : 'Your booking is confirmed. A confirmation email has been sent to the address you provided.'}
        </p>

        {/* Reference number */}
        {shortRef && (
          <div className="bg-slate-50 rounded-2xl px-5 py-4 mb-6 text-left space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
              {isNl ? 'Referentienummer' : 'Reference number'}
            </p>
            <p className="font-mono font-bold text-slate-900 text-lg tracking-widest">{shortRef}</p>
          </div>
        )}

        {/* What's next */}
        <div className="text-left space-y-3 mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {isNl ? 'Wat gebeurt er nu?' : "What happens next?"}
          </p>

          {[
            {
              icon: Mail,
              title: isNl ? 'Bevestigingsmail' : 'Confirmation email',
              desc:  isNl
                ? 'Je ontvangt binnen enkele minuten een bevestiging per e-mail.'
                : 'You will receive a confirmation by email within minutes.',
            },
            {
              icon: Calendar,
              title: isNl ? 'Incheckdetails' : 'Check-in details',
              desc:  isNl
                ? 'De B&B-eigenaar neemt contact met je op met verdere instructies.'
                : 'The B&B host will contact you with further check-in instructions.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-600 text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          <Home className="w-4 h-4" />
          {isNl ? 'Terug naar home' : 'Back to home'}
        </Link>
      </div>
    </main>
  );
}

// ─── Page (Suspense boundary for useSearchParams) ────────────────────────────

export default function BoekingSucces() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
