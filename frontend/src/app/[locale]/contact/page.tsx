'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { CheckCircle } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Naam is verplicht'),
  email: z.string().email('Voer een geldig e-mailadres in'),
  subject: z.string().min(3, 'Onderwerp is verplicht'),
  message: z.string().min(10, 'Bericht moet minimaal 10 tekens bevatten'),
});

type ContactForm = z.infer<typeof schema>;

export default function ContactPage() {
  const { locale } = useParams<{ locale: string }>();
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ContactForm) => {
    setSubmitError('');
    try {
      await api.post('/contact', data);
      setSent(true);
    } catch {
      setSubmitError('Er is iets misgegaan. Probeer het later opnieuw of stuur een e-mail naar info@directbnb.nl.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">
              Direct<span className="text-brand">BnB</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href={`/${locale}/over-ons`} className="text-slate-500 hover:text-slate-900 transition-colors">
              Over ons
            </Link>
            <Link
              href={`/${locale}/register`}
              className="bg-brand text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-brand-600 transition-colors"
            >
              Start gratis beta
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug naar Home
            </Link>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Contact</h1>
            <p className="text-lg text-slate-500">
              Heb je een vraag of wil je meer weten over DirectBnB? Stuur ons een bericht.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact details */}
            <div className="space-y-5">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'E-mail',
                  value: 'info@directbnb.nl',
                  href: 'mailto:info@directbnb.nl',
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Reactietijd',
                  value: 'Binnen 1 werkdag',
                  href: null,
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  title: 'Locatie',
                  value: 'Nederland',
                  href: null,
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-slate-800 hover:text-brand transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-brand-light rounded-2xl p-5">
                <p className="text-sm font-semibold text-brand mb-1">Beta gebruiker?</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Heb je al een account? Log in en gebruik het feedback-formulier in het dashboard voor directe ondersteuning.
                </p>
                <Link
                  href={`/${locale}/login`}
                  className="inline-block mt-3 text-xs font-semibold text-brand hover:underline"
                >
                  Naar dashboard →
                </Link>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {sent ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 shadow-sm flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Bericht ontvangen!</h2>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op, uiterlijk binnen één werkdag.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 text-sm text-brand font-semibold hover:underline"
                  >
                    Nog een bericht sturen
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Naam *</label>
                      <input
                        {...register('name')}
                        type="text"
                        placeholder="Jan de Vries"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mailadres *</label>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="jan@example.nl"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Onderwerp *</label>
                    <input
                      {...register('subject')}
                      type="text"
                      placeholder="Vraag over DirectBnB"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bericht *</label>
                    <textarea
                      {...register('message')}
                      rows={6}
                      placeholder="Schrijf hier je vraag of bericht..."
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <p className="text-red-600 text-sm">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    {isSubmitting ? 'Versturen…' : 'Bericht versturen'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} DirectBnB — Alle rechten voorbehouden.</span>
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/over-ons`} className="hover:text-brand transition-colors">Over ons</Link>
            <Link href={`/${locale}/contact`} className="hover:text-brand transition-colors">Contact</Link>
            <Link href={`/${locale}/privacybeleid`} className="hover:text-brand transition-colors">Privacy</Link>
            <Link href={`/${locale}/algemene-voorwaarden`} className="hover:text-brand transition-colors">Voorwaarden</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
