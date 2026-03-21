'use client';

import { useTranslations } from 'next-intl';

const benefits = [
  'benefit1',
  'benefit2',
  'benefit3',
  'benefit4',
] as const;

export default function BetaProgram() {
  const t = useTranslations('beta');

  return (
    <section id="beta" className="relative bg-dark-800 py-24 lg:py-32 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100" />

      {/* Gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
          </span>
          {t('badge')}
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5">
          {t('headline')}
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-12">
          {t('subheadline')}
        </p>

        {/* Spots counter */}
        <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-5 mb-12">
          <div className="text-center">
            <div className="text-4xl font-black text-white">43</div>
            <div className="text-slate-400 text-xs mt-1">{t('spotsLabel')}</div>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="w-48">
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-violet-400 rounded-full"
                style={{ width: `${(43 / 50) * 100}%` }}
              />
            </div>
            <div className="text-slate-400 text-xs mt-2 text-center">{t('spotsValue')}</div>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
          {benefits.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-left"
            >
              <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-slate-200 text-sm font-medium">{t(key)}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold px-10 py-4 rounded-2xl text-base shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/50 transition-all duration-200 group"
        >
          {t('cta')}
          <svg
            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
