'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  Mail,
  CheckCircle2,
  ArrowRight,
  Star,
  Building2,
  Globe,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('landing');

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">
              Direct<span className="text-indigo-600">BnB</span>
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
              Beta
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">{t('nav.howItWorks')}</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">{t('nav.features')}</a>
            <a href="#beta" className="hover:text-slate-900 transition-colors">{t('nav.beta')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {t('nav.joinBeta')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white pt-20 pb-24 px-6">
        {/* Background gradient blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                <Star className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                {t('hero.badge')}
              </div>
              <h1 className="text-5xl font-extrabold leading-tight text-slate-900 mb-5">
                {t('hero.headline1')}{' '}
                <span className="text-indigo-600">{t('hero.headlineAccent')}</span>{' '}
                {t('hero.headline2')}
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-8 max-w-lg">
                {t('hero.subheadline')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/register`}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  {t('hero.ctaSecondary')}
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {t('hero.trust1')}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {t('hero.trust2')}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {t('hero.trust3')}
                </span>
              </div>
            </div>

            {/* Right: UI mockup */}
            <div className="relative lg:pl-6">
              {/* Main dashboard card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                {/* Fake top bar */}
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Direct<span className="text-indigo-400">BnB</span></span>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t('mockup.bookings'), value: '12', color: 'bg-indigo-50 text-indigo-700' },
                      { label: t('mockup.guests'), value: '28', color: 'bg-emerald-50 text-emerald-700' },
                      { label: t('mockup.revenue'), value: '€1.840', color: 'bg-amber-50 text-amber-700' },
                    ].map((s) => (
                      <div key={s.label} className={`${s.color} rounded-xl px-3 py-3 text-center`}>
                        <div className="text-lg font-bold">{s.value}</div>
                        <div className="text-xs opacity-80 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Booking rows */}
                  <div className="space-y-2">
                    {[
                      { name: 'Anna de Vries', room: 'Kamer Roos', status: t('mockup.confirmed'), color: 'bg-emerald-100 text-emerald-700' },
                      { name: 'Mark Johnson', room: 'Suite Lavendel', status: t('mockup.pending'), color: 'bg-amber-100 text-amber-700' },
                      { name: 'Sophie Martin', room: 'Kamer Iris', status: t('mockup.paid'), color: 'bg-indigo-100 text-indigo-700' },
                    ].map((b) => (
                      <div key={b.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{b.name}</div>
                          <div className="text-xs text-slate-400">{b.room}</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.color}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -top-4 -left-4 bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{t('mockup.newBooking')}</div>
                  <div className="text-slate-400 text-xs">{t('mockup.justNow')}</div>
                </div>
              </div>

              {/* Floating payment card */}
              <div className="absolute -bottom-4 -right-4 bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs">€285 {t('mockup.received')}</div>
                  <div className="text-slate-400 text-xs">{t('mockup.via')} iDEAL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">{t('value.title')}</h2>
            <p className="text-slate-500 mt-2 text-lg">{t('value.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: t('value.card1Title'), desc: t('value.card1Desc'), color: 'bg-indigo-100 text-indigo-600' },
              { icon: ShieldCheck, title: t('value.card2Title'), desc: t('value.card2Desc'), color: 'bg-green-100 text-green-600' },
              { icon: CalendarDays, title: t('value.card3Title'), desc: t('value.card3Desc'), color: 'bg-amber-100 text-amber-600' },
              { icon: Zap, title: t('value.card4Title'), desc: t('value.card4Desc'), color: 'bg-purple-100 text-purple-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 text-sm font-semibold uppercase tracking-wider">{t('how.label')}</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">{t('how.title')}</h2>
            <p className="text-slate-500 mt-2 text-lg max-w-xl mx-auto">{t('how.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Building2,
                title: t('how.step1Title'),
                desc: t('how.step1Desc'),
                color: 'bg-indigo-600',
              },
              {
                step: '02',
                icon: Globe,
                title: t('how.step2Title'),
                desc: t('how.step2Desc'),
                color: 'bg-indigo-600',
              },
              {
                step: '03',
                icon: BarChart3,
                title: t('how.step3Title'),
                desc: t('how.step3Desc'),
                color: 'bg-indigo-600',
              },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <div key={step} className="relative">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%-1rem)] w-8 border-t-2 border-dashed border-slate-200 z-10" />
                )}
                <div className="bg-slate-50 rounded-2xl p-7 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-200">{step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <span className="text-indigo-600 text-sm font-semibold uppercase tracking-wider">{t('features.label')}</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-3">{t('features.title')}</h2>
              <p className="text-slate-500 text-lg mb-8">{t('features.subtitle')}</p>

              <div className="space-y-4">
                {[
                  { icon: CalendarDays, title: t('features.f1Title'), desc: t('features.f1Desc') },
                  { icon: Users, title: t('features.f2Title'), desc: t('features.f2Desc') },
                  { icon: CreditCard, title: t('features.f3Title'), desc: t('features.f3Desc') },
                  { icon: Bell, title: t('features.f4Title'), desc: t('features.f4Desc') },
                  { icon: BarChart3, title: t('features.f5Title'), desc: t('features.f5Desc') },
                  { icon: Mail, title: t('features.f6Title'), desc: t('features.f6Desc') },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{title}</div>
                      <div className="text-slate-500 text-sm mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: feature cards grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CalendarDays, title: t('features.f1Title'), color: 'bg-indigo-50 text-indigo-600' },
                { icon: Users, title: t('features.f2Title'), color: 'bg-emerald-50 text-emerald-600' },
                { icon: CreditCard, title: t('features.f3Title'), color: 'bg-amber-50 text-amber-600' },
                { icon: Bell, title: t('features.f4Title'), color: 'bg-purple-50 text-purple-600' },
                { icon: BarChart3, title: t('features.f5Title'), color: 'bg-rose-50 text-rose-600' },
                { icon: Mail, title: t('features.f6Title'), color: 'bg-cyan-50 text-cyan-600' },
              ].map(({ icon: Icon, title, color }) => (
                <div key={title} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BETA SIGNUP ── */}
      <section id="beta" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('beta.badge')}
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">{t('beta.title')}</h2>
          <p className="text-slate-500 text-lg mb-3 max-w-xl mx-auto">{t('beta.subtitle')}</p>
          <p className="text-slate-400 text-sm mb-8">{t('beta.geo')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${locale}/register`}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
            >
              {t('beta.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 text-sm text-slate-400">
            {t('beta.noCredit')}
          </div>
        </div>
      </section>

      {/* ── LANGUAGES ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left: copy */}
              <div className="p-10">
                <Globe className="w-8 h-8 text-indigo-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('languages.title')}</h2>
                <p className="text-slate-500 mb-6">{t('languages.subtitle')}</p>
                <p className="text-xs text-slate-400">{t('languages.comingSoon')}</p>
              </div>
              {/* Right: language list */}
              <div className="bg-slate-50 p-10 flex flex-col justify-center gap-3">
                {[
                  { flag: '🇳🇱', lang: 'Nederlands', status: t('languages.available'), active: true },
                  { flag: '🇬🇧', lang: 'English', status: t('languages.available'), active: true },
                  { flag: '🇩🇪', lang: 'Deutsch', status: t('languages.soon'), active: false },
                  { flag: '🇫🇷', lang: 'Français', status: t('languages.soon'), active: false },
                ].map(({ flag, lang, status, active }) => (
                  <div key={lang} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
                    <span className="text-xl">{flag}</span>
                    <span className="flex-1 font-medium text-slate-900 text-sm">{lang}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">{t('finalCta.title')}</h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">{t('finalCta.subtitle')}</p>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 font-bold px-8 py-4 rounded-xl text-base transition-colors"
          >
            {t('finalCta.cta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-indigo-300 text-sm">{t('finalCta.noCredit')}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-white">
            Direct<span className="text-indigo-400">BnB</span>
          </span>
          <p className="text-slate-500 text-sm">{t('footer.copy')}</p>
          <div className="flex gap-5 text-sm text-slate-500">
            <Link href={`/${locale}/login`} className="hover:text-white transition-colors">{t('footer.login')}</Link>
            <Link href={`/${locale}/register`} className="hover:text-white transition-colors">{t('footer.register')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
