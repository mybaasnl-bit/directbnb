'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

function DashboardMockup() {
  return (
    <div className="relative animate-float">
      {/* Glow */}
      <div className="absolute -inset-4 bg-brand-500/20 blur-3xl rounded-3xl pointer-events-none" />

      {/* Browser window */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-dark-700">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-dark-800 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-3 bg-white/10 rounded-md px-3 py-1 text-white/40 text-xs font-mono">
            directbnb.nl/dashboard
          </div>
        </div>

        {/* Dashboard UI */}
        <div className="flex" style={{ height: '320px' }}>
          {/* Sidebar */}
          <div className="w-44 bg-dark-800/80 border-r border-white/10 p-4 flex-shrink-0">
            <div className="text-white font-bold text-sm mb-6 flex items-center gap-2">
              <div className="w-5 h-5 bg-brand-500 rounded" />
              DirectBnB
            </div>
            {[
              { icon: '▦', label: 'Dashboard', active: true },
              { icon: '📋', label: 'Boekingen', active: false },
              { icon: '🏠', label: 'Kamers', active: false },
              { icon: '👥', label: 'Gasten', active: false },
              { icon: '📅', label: 'Kalender', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs mb-1 transition-colors ${
                  item.active
                    ? 'bg-brand-500/20 text-brand-400 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Boekingen', value: '24', color: 'text-brand-400', bg: 'bg-brand-500/10' },
                { label: 'Inkomsten', value: '€3.240', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Bezetting', value: '87%', color: 'text-sky-400', bg: 'bg-sky-500/10' },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-3 border border-white/5`}>
                  <div className="text-slate-400 text-xs mb-1">{stat.label}</div>
                  <div className={`text-base font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Section title */}
            <div className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">
              Aankomende boekingen
            </div>

            {/* Bookings list */}
            <div className="space-y-2">
              {[
                { name: 'Familie Jansen', room: 'Kamer 1', dates: '12–14 jan', status: 'Bevestigd', color: 'text-emerald-400 bg-emerald-500/10' },
                { name: 'P. de Wit', room: 'Kamer 2', dates: '15–17 jan', status: 'Nieuw', color: 'text-brand-400 bg-brand-500/10' },
                { name: 'M. Bakker', room: 'Suite', dates: '18–20 jan', status: 'Bevestigd', color: 'text-emerald-400 bg-emerald-500/10' },
              ].map((booking) => (
                <div
                  key={booking.name}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5 border border-white/5"
                >
                  <div>
                    <div className="text-white text-xs font-semibold">{booking.name}</div>
                    <div className="text-slate-400 text-xs">
                      {booking.room} · {booking.dates}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${booking.color}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-screen bg-dark-800 flex items-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100" />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-800/50 to-dark-800" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              {t('badge')}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 animate-fade-up">
              {t('headline')}
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl animate-fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              {t('subheadline')}
            </p>

            {/* CTA buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-up"
              style={{ animationDelay: '0.2s' }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('ctaPrimary')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('ctaSecondary')}
              </Button>
            </div>

            {/* Spots counter */}
            <div
              className="flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex -space-x-2">
                {['bg-indigo-400', 'bg-violet-400', 'bg-sky-400', 'bg-emerald-400'].map((color, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full ${color} border-2 border-dark-800 flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm">
                <span className="text-white font-semibold">{t('spotsLeft')}</span>
              </p>
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}
