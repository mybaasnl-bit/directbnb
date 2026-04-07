'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// ─── MockCalendar ─────────────────────────────────────────────────────────────

function MockCalendar() {
  const booked = [5, 6, 11, 12, 16, 17, 18];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const offset = 2;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-900 text-sm">April 2026</span>
        <div className="flex gap-1">
          <button className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs">‹</button>
          <button className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['M','D','W','D','V','Z','Z'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array(offset).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {days.map((d) => (
          <div key={d} className={`aspect-square flex items-center justify-center text-[11px] font-semibold rounded-lg transition-colors
            ${booked.includes(d) ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  const { locale } = useParams<{ locale: string }>();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-all ${scrolled ? 'shadow-sm border-b border-slate-100' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">
            Direct<span className="text-brand-500">BnB</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600 font-medium">
          <a href="#voordelen" className="hover:text-slate-900 transition-colors">Voordelen</a>
          <a href="#hoe-werkt-het" className="hover:text-slate-900 transition-colors">Hoe werkt het</a>
          <a href="#besparing" className="hover:text-slate-900 transition-colors">Besparing</a>
          <Link href={`/${locale}/bnb/demo`} className="hover:text-slate-900 transition-colors">
            Voorbeeld B&amp;B
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/login`}
            className="text-sm text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 rounded-xl transition-colors border border-slate-200 hover:border-slate-300"
          >
            Inloggen
          </Link>
          <Link
            href={`/${locale}/register`}
            className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            Start gratis beta
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { locale } = useParams<{ locale: string }>();
  return (
    <section className="bg-slate-50 min-h-[90vh] flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Meer boekingen,{' '}
              <span className="text-brand-500">zonder<br />commissies</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Ontvang directe reserveringen en houd tot €30 per nacht zelf.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-brand-500/20"
              >
                Start gratis beta
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#hoe-werkt-het"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-brand-500 hover:text-brand-500 text-slate-700 font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
              >
                Bekijk demo
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  { initials: 'MV', bg: 'bg-brand-500' },
                  { initials: 'HJ', bg: 'bg-slate-700' },
                  { initials: 'EV', bg: 'bg-brand-600' },
                ].map((a) => (
                  <div key={a.initials} className={`w-8 h-8 rounded-full ${a.bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-500 font-medium">Al meer dan 200 B&amp;B eigenaren</p>
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="hidden lg:block relative">
            {/* Main dashboard card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative">
              <h3 className="font-bold text-slate-900 text-base mb-5">Dashboard Overzicht</h3>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">24</p>
                  <p className="text-xs text-slate-400 mt-0.5">Boekingen</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">€4.850</p>
                  <p className="text-xs text-slate-400 mt-0.5">Inkomsten</p>
                </div>
              </div>

              {/* Calendar */}
              <MockCalendar />

              {/* Aankomende Gasten */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm mb-3">
                  <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="font-semibold text-slate-700 text-xs">Aankomende Gasten</span>
                </div>
                {[
                  { name: 'Sarah J.', room: 'Deluxe Suite', date: '5 Apr' },
                  { name: 'Mark B.', room: 'Standaard Kamer', date: '10 Apr' },
                ].map((guest) => (
                  <div key={guest.name} className="flex items-center justify-between py-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{guest.name}</p>
                        <p className="text-[10px] text-slate-400">{guest.room}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-500">{guest.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating card: users */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-48">
              <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">200+</p>
              <p className="text-xs text-slate-400 leading-snug">B&amp;B eigenaren gebruiken DirectBnB</p>
            </div>

            {/* Floating card: savings */}
            <div className="absolute -bottom-4 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-44">
              <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">€720</p>
              <p className="text-xs text-slate-400 leading-snug">Gem. besparing per maand</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SocialProof ──────────────────────────────────────────────────────────────

function SocialProof() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Dit zeggen B&amp;B eigenaren
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Marieke van den Berg',
              location: 'Utrecht',
              quote: 'Eindelijk geen commissies meer! Ik houd nu €400 extra per maand over. De setup was super eenvoudig.',
            },
            {
              name: 'Hans Jansen',
              location: 'Amsterdam',
              quote: 'In de eerste week al 3 directe boekingen. Het systeem werkt perfect en mijn gasten vinden het fijn.',
            },
            {
              name: 'Els Vermeulen',
              location: 'Limburg',
              quote: 'De overstap was makkelijker dan ik dacht. Nu boek ik 60% direct en bespaar ik flink op commissies.',
            },
          ].map((review) => (
            <div key={review.name} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">"{review.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-sm">
                  {review.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
                  <p className="text-xs text-slate-400">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problem ──────────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Het probleem met boekingsplatformen
          </h2>
          <p className="text-slate-500 text-lg">Waarom B&amp;B eigenaren steeds meer betalen voor minder</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Hoge commissies',
              desc: (
                <>Booking.com en Airbnb rekenen <strong className="text-slate-700">15–25% commissie</strong> over elke boeking. Bij €100 per nacht verlies je direct €15–25.</>
              ),
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: 'Afhankelijkheid',
              desc: (
                <>Je bent volledig afhankelijk van hun <strong className="text-slate-700">algoritme en regels</strong>. Jij hebt nauwelijks controle over je eigen business.</>
              ),
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              ),
              title: 'Minder winst',
              desc: (
                <>Na commissies en kosten houd je steeds minder over. Gemiddeld <strong className="text-slate-700">€1.000 per maand</strong> minder dan nodig zou zijn.</>
              ),
            },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 mb-4">
                {card.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">{card.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Solution ─────────────────────────────────────────────────────────────────

function Solution() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            De oplossing: DirectBnB
          </h2>
          <p className="text-slate-500 text-lg">Geef jou de controle terug over je boekingen</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Directe boekingen',
              desc: (
                <>Gasten boeken <strong className="text-slate-700">rechtstreeks bij jou</strong>. Geen tussenpartij, geen commissie, geen gedoe.</>
              ),
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: 'Eigen controle',
              desc: (
                <>Jij bepaalt de <strong className="text-slate-700">prijzen, regels en beschikbaarheid</strong>. Volledig op jouw voorwaarden, jouw manier.</>
              ),
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: 'Alles in één systeem',
              desc: (
                <><strong className="text-slate-700">Kalender, betalingen, gastcommunicatie</strong> en statistieken allemaal in één overzichtelijk dashboard.</>
              ),
            },
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-500 mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Voordelen ────────────────────────────────────────────────────────────────

function Voordelen() {
  return (
    <section id="voordelen" className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Waarom kiezen voor DirectBnB?
          </h2>
          <p className="text-slate-500 text-lg">De voordelen voor jouw B&amp;B</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Meer winst',
              desc: 'Geen commissies betekent tot €900 meer inkomsten per maand. Alles gaat rechtstreeks naar jou.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Minder werk',
              desc: 'Automatische bevestigingen, herinneringen en check-in instructies. Bespaar uren per week.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Volledige controle',
              desc: 'Jij bepaalt de prijzen, annuleringsbeleid en huisregels. Geen regels van buitenaf opgelegd.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              ),
              title: 'Professionele uitstraling',
              desc: 'Een mooie boekingspagina met jouw eigen branding. Gasten vertrouwen direct boeking bij jou.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-500 mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HowItWorks ───────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="hoe-werkt-het" className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Hoe werkt het?
          </h2>
          <p className="text-slate-500 text-lg">In 3 stappen live met directe boekingen</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: '1',
              title: 'Maak je profiel aan',
              desc: (
                <>Voeg je B&amp;B toe met <strong className="text-slate-700">foto's, kamers en beschikbaarheid</strong>. Binnen 5 minuten volledig klaar.</>
              ),
            },
            {
              num: '2',
              title: 'Deel je boekingspagina',
              desc: (
                <>Deel jouw <strong className="text-slate-700">persoonlijke boekingslink</strong> via social media, email of je eigen website. Overal, altijd.</>
              ),
              offset: true,
            },
            {
              num: '3',
              title: 'Ontvang directe boekingen',
              desc: (
                <>Gasten boeken en betalen <strong className="text-slate-700">direct bij jou</strong>. Geen tussenpartij. Jij houdt 100% van de opbrengst.</>
              ),
            },
          ].map((step, i) => (
            <div key={i} className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm ${step.offset ? 'md:mt-8' : ''}`}>
              <div className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center font-extrabold text-lg mb-4">
                {step.num}
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Ontvang betalingen direct',
      body: 'Gasten betalen direct op je rekening. Geen wachttijden, geen commissies.',
      mockup: (
        <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2">Transacties</p>
          {[
            { name: 'Boeking Sarah J.', amount: '+€285.00', time: 'Vandaag' },
            { name: 'Boeking Mark B.', amount: '+€190.00', time: 'Gisteren' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[10px] text-slate-400">{t.time}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">{t.amount}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: 'Volg je inkomsten live',
      body: 'Real-time inzicht in je bezetting en inkomsten. Spot trends en plan beter.',
      mockup: (
        <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex gap-2 mb-3">
            <span className="text-[10px] font-bold bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">Inkomsten</span>
            <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5">Uitgaven</span>
          </div>
          <div className="flex items-end gap-1 h-12">
            {[30, 50, 40, 70, 60, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-500 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['Feb','Mrt','Apr','Mei','Jun','Jul'].map((m) => (
              <span key={m} className="text-[9px] text-slate-400 flex-1 text-center">{m}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: 'Beheer alle kamers',
      body: 'Overzichtelijke kalender voor al je kamers. Zie in één oogopslag wat beschikbaar is.',
      mockup: (
        <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100 space-y-2">
          {[
            { name: 'Deluxe Suite', status: 'Beschikbaar', color: 'text-emerald-600 bg-emerald-50' },
            { name: 'Standaard Kamer', status: 'Geboekt', color: 'text-slate-500 bg-slate-100' },
            { name: 'Budget Kamer', status: 'Beschikbaar', color: 'text-emerald-600 bg-emerald-50' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-800">{r.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.status}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Automatische emails',
      body: 'Bevestigingen en herinneringen worden automatisch verstuurd naar je gasten.',
      mockup: (
        <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Boekingsbevestiging</p>
              <p className="text-[10px] text-slate-400">Naar: sarah.jansen@email.nl</p>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full w-full mb-1" />
          <div className="h-1.5 bg-slate-100 rounded-full w-3/4" />
        </div>
      ),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Slimme statistieken',
      body: 'Zie welke kamers het beste presteren en optimaliseer je prijzen.',
      mockup: (
        <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-700">Bezettingsgraad</p>
            <span className="text-xs font-extrabold text-brand-500">87%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: '87%' }} />
          </div>
        </div>
      ),
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Ontdek alle functies',
      body: 'Meer dan 15 handige features om je B&B professioneel te beheren.',
      orange: true,
    },
  ];

  return (
    <section id="features" className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Alles wat je nodig hebt
          </h2>
          <p className="text-slate-500 text-lg">Alle functies om je B&amp;B professioneel te beheren</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className={`rounded-2xl p-6 ${f.orange ? 'bg-brand-500' : 'bg-white border border-slate-100'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                f.orange ? 'bg-white/20' : 'bg-brand-100'
              }`}>
                <span className={f.orange ? 'text-white' : 'text-brand-500'}>{f.icon}</span>
              </div>
              <h3 className={`font-bold text-lg mb-2 ${f.orange ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${f.orange ? 'text-white/80' : 'text-slate-500'}`}>{f.body}</p>
              {f.mockup && f.mockup}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Besparing ────────────────────────────────────────────────────────────────

function Besparing() {
  return (
    <section id="besparing" className="bg-brand-500 py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Hoeveel bespaar je?
          </h2>
          <p className="text-white/70 text-lg">Bij een gemiddelde nachtprijs van €100</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Savings rows */}
          <div className="bg-white/10 rounded-3xl p-6 lg:p-8 space-y-3">
            {[
              { label: 'Per nacht', desc: 'Gemiddeld €20–30 minder commissie', value: '€20 – €30', highlight: false },
              { label: 'Per maand', desc: 'Bij 15–30 boekingsnachten', value: '€400 – €900', highlight: true },
              { label: 'Per kwartaal', desc: 'Dat is een hele vakantie extra', value: '€1.200 – €2.700', highlight: false },
            ].map((row) => (
              <div
                key={row.label}
                className={`rounded-2xl px-5 py-4 ${row.highlight ? 'bg-white' : 'bg-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-sm ${row.highlight ? 'text-slate-700' : 'text-white/80'}`}>
                    {row.label}
                  </span>
                  <span className={`font-extrabold text-lg ${row.highlight ? 'text-brand-500' : 'text-white'}`}>
                    {row.value}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${row.highlight ? 'text-slate-400' : 'text-white/50'}`}>
                  {row.desc}
                </p>
              </div>
            ))}

            <div className="pt-2">
              <p className="text-white/60 text-xs leading-relaxed">
                Rekenvoorbeeld: B&amp;B met 2 kamers, gemiddeld 15 boekingsnachten per maand tegen €100 per nacht.
                Op platforms betaal je 15–25% commissie. Met DirectBnB: €0.
              </p>
            </div>
          </div>

          {/* Commission comparison */}
          <div className="bg-white rounded-3xl p-6 lg:p-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">
              Commissies per €100 boeking
            </p>
            <div className="space-y-4">
              {[
                { name: 'Booking.com', commission: '-€25', pct: 25, bad: true },
                { name: 'Airbnb', commission: '-€18', pct: 18, bad: true },
                { name: 'DirectBnB', commission: '€0', pct: 0, bad: false, label: 'Jij houdt 100%' },
              ].map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                    <span className={`text-sm font-bold ${p.bad ? 'text-red-500' : 'text-emerald-600'}`}>
                      {p.label ?? p.commission}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    {p.bad ? (
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${p.pct}%` }} />
                    ) : (
                      <div className="h-full bg-emerald-400 rounded-full w-0" />
                    )}
                  </div>
                  {p.bad && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.commission} per boeking</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  const { locale } = useParams<{ locale: string }>();
  return (
    <section id="aanmelden" className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Start vandaag zonder commissies
        </h2>
        <p className="text-slate-500 text-lg mb-8">
          Vraag gratis beta toegang aan en ontvang directe boekingen zonder commissies.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-10 mb-8">
          {[
            { value: '€0', label: 'Commissies' },
            { value: '5 min', label: 'Setup tijd' },
            { value: '100%', label: 'Jouw winst' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-brand-500">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <Link
          href={`/${locale}/register`}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-brand-500/20"
        >
          Vraag beta toegang aan →
        </Link>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 flex-wrap">
          {[
            { icon: '🔒', label: 'Veilig & versleuteld' },
            { icon: '✓', label: 'Geen creditcard nodig' },
            { icon: '★', label: 'Gratis in beta' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-1.5 text-slate-400 text-sm">
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { locale } = useParams<{ locale: string }>();
  return (
    <footer className="bg-slate-900 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">Direct<span className="text-brand-500">BnB</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Directe boekingen voor je B&amp;B zonder commissies.
            </p>
          </div>
          {[
            {
              title: 'Product',
              links: [
                { label: 'Voordelen', href: '#voordelen' },
                { label: 'Hoe werkt het', href: '#hoe-werkt-het' },
                { label: 'Besparing', href: '#besparing' },
                { label: 'Voorbeeld B&B', href: `/${locale}/bnb/demo` },
              ],
            },
            {
              title: 'Bedrijf',
              links: [
                { label: 'Over ons', href: '#' },
                { label: 'Contact', href: '#' },
                { label: 'Dashboard', href: `/${locale}/login` },
              ],
            },
            {
              title: 'Support',
              links: [
                { label: 'Help center', href: '#' },
                { label: 'Privacy', href: '#' },
                { label: 'Voorwaarden', href: '#' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">© 2026 DirectBnB. Alle rechten voorbehouden.</p>
          <p className="text-slate-500 text-sm">Gemaakt in Nederland 🇳🇱</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Problem />
        <Solution />
        <Voordelen />
        <HowItWorks />
        <Features />
        <Besparing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
