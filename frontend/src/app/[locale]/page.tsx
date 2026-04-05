'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// ─── MockCalendar ─────────────────────────────────────────────────────────────

function MockCalendar() {
  const booked = [5, 6, 11, 12, 16, 17, 18];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const offset = 2; // April 2026 starts on Wednesday (Mon-based)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-900 text-sm">April 2026</span>
        <div className="flex gap-1">
          <button className="w-6 h-6 rounded text-slate-400 flex items-center justify-center text-xs">‹</button>
          <button className="w-6 h-6 rounded text-slate-400 flex items-center justify-center text-xs">›</button>
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
          <div key={d} className={`aspect-square flex items-center justify-center text-[11px] font-semibold rounded-lg
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
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600 font-medium">
          <a href="#voordelen" className="hover:text-slate-900 transition-colors">Voordelen</a>
          <a href="#hoe-het-werkt" className="hover:text-slate-900 transition-colors">Hoe werkt het</a>
          <a href="#besparing" className="hover:text-slate-900 transition-colors">Besparing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/login`} className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Inloggen
          </Link>
          <Link href={`/${locale}/register`} className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
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

          {/* Left */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Meer boekingen,{' '}
              <span className="text-brand-500">zonder<br />commissies</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Ontvang directe reserveringen en houd tot €30 per nacht zelf.
            </p>
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
                href="#hoe-het-werkt"
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
              <p className="text-sm text-slate-500 font-medium">Al meer dan 200 B&B eigenaren</p>
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="hidden lg:block relative">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative">
              <h3 className="font-bold text-slate-900 text-base mb-5">Dashboard Overzicht</h3>
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
              <MockCalendar />
            </div>
            {/* Floating: users */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-48">
              <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">200+</p>
              <p className="text-xs text-slate-400 leading-snug">B&B eigenaren gebruiken DirectBnB</p>
            </div>
            {/* Floating: savings */}
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

// ─── Problem ──────────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Het probleem met grote platforms</h2>
          <p className="text-slate-400 mt-2 text-lg">Waarom B&B eigenaren steeds meer betalen</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '💸', title: 'Hoge commissies', desc: 'Booking.com en Airbnb rekenen 15–25% over elke boeking. Bij €100 per nacht verlies je direct €15–25.' },
            { icon: '🔒', title: 'Afhankelijkheid', desc: 'Je bent volledig afhankelijk van hun algoritme, regels en prijsbeleid. Je hebt nauwelijks controle.' },
            { icon: '📉', title: 'Minder winst', desc: 'Na commissies, kosten en regels houd je steeds minder over. Gemiddeld €1.000 per maand minder.' },
          ].map(card => (
            <div key={card.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl mb-4">{card.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
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
    <section id="voordelen" className="bg-slate-50 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">De directe oplossing</h2>
        <p className="text-slate-400 text-lg mb-10">DirectBnB geeft jou de controle terug</p>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '📈', title: 'Directe boekingen', desc: 'Gasten boeken rechtstreeks bij jou. Geen tussenpartij, geen commissie.' },
              { emoji: '🔓', title: 'Eigen controle', desc: 'Jij bepaalt de prijzen, regels en beschikbaarheid. Volledig op jouw voorwaarden.' },
              { emoji: '📱', title: 'Alles in één systeem', desc: 'Kalender, betalingen, gastcommunicatie en statistieken in één overzicht.' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-2xl">{item.emoji}</div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="hoe-het-werkt" className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Zo werkt het</h2>
          <p className="text-slate-400 mt-2 text-lg">In 3 stappen live met directe boekingen</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: '1', title: 'Maak je profiel aan', desc: 'Voeg je B&B toe met foto\'s, kamers en beschikbaarheid. Binnen 5 minuten klaar.' },
            { num: '2', title: 'Deel je boekingspagina', desc: 'Deel jouw persoonlijke link via social media, email of je eigen website.', offset: true },
            { num: '3', title: 'Ontvang directe boekingen', desc: 'Gasten boeken en betalen direct bij jou. Jij houdt 100% van de opbrengst.' },
          ].map((step) => (
            <div key={step.num} className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm ${step.offset ? 'md:mt-6' : ''}`}>
              <div className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center font-extrabold text-lg mb-4">
                {step.num}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
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
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Alles wat je nodig hebt</h2>
          <p className="text-slate-400 mt-2 text-lg">Een compleet platform voor jouw B&B</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { emoji: '💳', title: 'Directe betalingen', desc: 'iDEAL, creditcard en banktransfer. Geld staat direct op jouw rekening.', orange: false },
            { emoji: '📊', title: 'Live statistieken', desc: 'Volg je omzet, bezettingsgraad en inkomsten in real-time.', orange: false },
            { emoji: '🛏️', title: 'Kamer beheer', desc: 'Beheer meerdere kamers, prijzen en beschikbaarheid vanuit één dashboard.', orange: false },
            { emoji: '✉️', title: 'Automatische e-mails', desc: 'Bevestigingen, herinneringen en follow-ups worden automatisch verstuurd.', orange: false },
            { emoji: '👥', title: 'Gastbeheer', desc: 'Alle gastgegevens, voorkeuren en communicatie op één plek.', orange: false },
            { emoji: '⚡', title: 'Ontdek alle functies', desc: 'En nog veel meer — kalender, reviews, website integratie...', orange: true },
          ].map(({ emoji, title, desc, orange }) => (
            <div key={title} className={`rounded-2xl p-6 flex flex-col gap-3 ${orange ? 'bg-brand-500 text-white' : 'bg-white border border-slate-100 shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${orange ? 'bg-white/20' : 'bg-brand-100'}`}>
                {emoji}
              </div>
              <h3 className={`font-bold text-sm ${orange ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
              <p className={`text-sm leading-relaxed ${orange ? 'text-white/80' : 'text-slate-500'}`}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Wat eigenaren zeggen</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Marieke van den Berg', location: 'Utrecht', quote: 'Eindelijk geen commissies meer! Ik houd nu €400 extra per maand over. De setup was super eenvoudig.' },
            { name: 'Hans Jansen', location: 'Amsterdam', quote: 'In de eerste week al 3 directe boekingen. Het systeem werkt perfect en mijn gasten vinden het fijn.' },
            { name: 'Els Vermeulen', location: 'Limburg', quote: 'De overstap was makkelijker dan ik dacht. Nu boek ik 60% direct en bespaar ik flink op commissies.' },
          ].map(review => (
            <div key={review.name} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
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

// ─── Besparing ────────────────────────────────────────────────────────────────

function Besparing() {
  return (
    <section id="besparing" className="bg-brand-500 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-2">Met DirectBnB bespaar je:</h2>
          <p className="text-white/70 text-lg">Bij een gemiddelde nachtprijs van €100</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/10 rounded-3xl p-6 space-y-3">
            {[
              { label: 'Per nacht', value: '€20 – €30', highlight: false },
              { label: 'Per maand', value: '€400 – €900', highlight: true },
              { label: 'Per kwartaal', value: '€1.200 – €2.700', highlight: false },
            ].map(row => (
              <div key={row.label} className={`flex items-center justify-between rounded-2xl px-5 py-4 ${row.highlight ? 'bg-white' : 'bg-white/10'}`}>
                <span className={`font-semibold text-sm ${row.highlight ? 'text-slate-700' : 'text-white/80'}`}>{row.label}</span>
                <span className={`font-extrabold text-lg ${row.highlight ? 'text-brand-500' : 'text-white'}`}>{row.value}</span>
              </div>
            ))}
            <p className="text-white/50 text-xs pt-2 leading-relaxed">
              Rekenvoorbeeld: B&B met 2 kamers, gemiddeld 15 boekingsnachten per maand. Op platforms betaal je 15–25% commissie. Met DirectBnB: €0.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">Commissies per €100 boeking</p>
            <div className="space-y-4">
              {[
                { name: 'Booking.com', pct: 25, bad: true },
                { name: 'Airbnb', pct: 18, bad: true },
                { name: 'DirectBnB', pct: 0, bad: false, label: '€0 — Jij houdt 100%' },
              ].map(p => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                    <span className={`text-sm font-bold ${p.bad ? 'text-red-500' : 'text-emerald-600'}`}>
                      {p.label ?? `-€${p.pct}`}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.bad ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${p.pct}%` }} />
                  </div>
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
    <section id="aanmelden" className="bg-slate-50 py-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Klaar om te starten?</h2>
        <p className="text-slate-500 text-lg mb-8">Vraag gratis beta toegang aan en ontvang directe boekingen zonder commissies.</p>
        <div className="flex justify-center gap-10 mb-8">
          {[
            { value: '€0', label: 'Commissies' },
            { value: '5 min', label: 'Setup tijd' },
            { value: '100%', label: 'Jouw winst' },
          ].map(s => (
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
        <p className="mt-4 text-slate-400 text-sm">Geen spam. Gratis in beta. Geen kredietkaart nodig.</p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { locale } = useParams<{ locale: string }>();
  return (
    <footer className="bg-slate-900 py-14 px-6">
      <div className="max-w-6xl mx-auto">
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
              Directe boekingen voor B&B eigenaren. Geen commissies, volledige controle.
            </p>
          </div>
          {[
            { title: 'Product', links: [{ label: 'Voordelen', href: '#voordelen' }, { label: 'Hoe werkt het', href: '#hoe-het-werkt' }, { label: 'Besparing', href: '#besparing' }] },
            { title: 'Bedrijf', links: [{ label: 'Over ons', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Dashboard', href: `/${locale}/login` }] },
            { title: 'Support', links: [{ label: 'Help center', href: '#' }, { label: 'Privacy', href: '#' }, { label: 'Voorwaarden', href: '#' }] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">{link.label}</a>
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
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <SocialProof />
        <Besparing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
