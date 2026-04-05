'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowRight, Star, CheckCircle2, Bell, CreditCard,
  CalendarDays, Users, BarChart3, Mail, Zap,
  TrendingUp, Lock, Smartphone,
} from 'lucide-react';

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
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-sm border-b border-slate-100' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900">
            Direct<span className="text-brand">BnB</span>
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
          <Link href={`/${locale}/register`} className="text-sm bg-brand hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
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
    <section className="relative overflow-hidden bg-slate-50 pt-20 pb-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-slate-50 to-white pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand text-sm font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5 fill-brand text-brand" />
              Nu beschikbaar in Nederland
            </div>
            <h1 className="text-5xl font-extrabold leading-tight text-slate-900 mb-5">
              Meer boekingen,{' '}
              <span className="text-brand">zonder commissies</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-8 max-w-lg">
              Ontvang directe reserveringen en houd tot €30 per nacht zelf. Beheer alles vanuit één eenvoudig platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/register`}
                className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold px-6 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-brand/20"
              >
                Start gratis beta
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#hoe-het-werkt"
                className="flex items-center gap-2 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
              >
                Bekijk demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-400">
              {['Gratis in beta', 'Geen kredietkaart nodig', '0% commissie'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: mockup */}
          <div className="relative lg:pl-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <span className="text-white text-sm font-bold">Direct<span className="text-brand">BnB</span></span>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Reserveringen', value: '12', color: 'bg-brand-light text-brand' },
                    { label: 'Gasten', value: '28', color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Omzet', value: '€1.840', color: 'bg-amber-50 text-amber-700' },
                  ].map(s => (
                    <div key={s.label} className={`${s.color} rounded-xl px-3 py-3 text-center`}>
                      <div className="text-lg font-bold">{s.value}</div>
                      <div className="text-xs opacity-80 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Anna de Vries', room: 'Kamer Roos', status: 'Bevestigd', color: 'bg-emerald-100 text-emerald-700' },
                    { name: 'Mark Johnson', room: 'Suite Lavendel', status: 'Aangevraagd', color: 'bg-amber-100 text-amber-700' },
                    { name: 'Sophie Martin', room: 'Kamer Iris', status: 'Betaald', color: 'bg-brand-light text-brand' },
                  ].map(b => (
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
            <div className="absolute -top-4 -left-4 bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-xs">Nieuwe boeking!</div>
                <div className="text-slate-400 text-xs">Zojuist</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-light rounded-full flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-brand" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-xs">€285 ontvangen</div>
                <div className="text-slate-400 text-xs">via iDEAL</div>
              </div>
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
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                {card.icon}
              </div>
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
              { icon: TrendingUp, title: 'Directe boekingen', desc: 'Gasten boeken rechtstreeks bij jou. Geen tussenpartij, geen commissie.' },
              { icon: Lock, title: 'Eigen controle', desc: 'Jij bepaalt de prijzen, regels en beschikbaarheid. Volledig op jouw voorwaarden.' },
              { icon: Smartphone, title: 'Alles in één systeem', desc: 'Kalender, betalingen, gastcommunicatie en statistieken in één overzicht.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
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
            { num: '2', title: 'Deel je boekingspagina', desc: 'Deel jouw persoonlijke link via social media, email of je eigen website.' },
            { num: '3', title: 'Ontvang directe boekingen', desc: 'Gasten boeken en betalen direct bij jou. Jij houdt 100% van de opbrengst.' },
          ].map((step, i) => (
            <div key={step.num} className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm ${i === 1 ? 'md:mt-6' : ''}`}>
              <div className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center font-extrabold text-lg mb-4">
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
            { icon: CreditCard, title: 'Directe betalingen', desc: 'iDEAL, creditcard en banktransfer. Geld staat direct op jouw rekening.', orange: false },
            { icon: BarChart3, title: 'Live statistieken', desc: 'Volg je omzet, bezettingsgraad en inkomsten in real-time.', orange: false },
            { icon: CalendarDays, title: 'Kamer beheer', desc: 'Beheer meerdere kamers, prijzen en beschikbaarheid vanuit één dashboard.', orange: false },
            { icon: Mail, title: 'Automatische e-mails', desc: 'Bevestigingen, herinneringen en follow-ups worden automatisch verstuurd.', orange: false },
            { icon: Users, title: 'Gastbeheer', desc: 'Alle gastgegevens, voorkeuren en communicatie op één plek.', orange: false },
            { icon: Zap, title: 'Ontdek alle functies', desc: 'En nog veel meer — kalender, reviews, website integratie...', orange: true },
          ].map(({ icon: Icon, title, desc, orange }) => (
            <div key={title} className={`rounded-2xl p-6 flex flex-col gap-3 ${orange ? 'bg-brand text-white' : 'bg-white border border-slate-100 shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${orange ? 'bg-white/20' : 'bg-brand-light'}`}>
                <Icon className={`w-5 h-5 ${orange ? 'text-white' : 'text-brand'}`} />
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">"{review.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
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
    <section id="besparing" className="bg-brand py-20 px-6">
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
                <span className={`font-extrabold text-lg ${row.highlight ? 'text-brand' : 'text-white'}`}>{row.value}</span>
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
        <div className="flex justify-center gap-8 mb-8">
          {[
            { value: '€0', label: 'Commissies' },
            { value: '5 min', label: 'Setup tijd' },
            { value: '100%', label: 'Jouw winst' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-brand">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <Link
          href={`/${locale}/register`}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-brand/20"
        >
          Vraag beta toegang aan →
        </Link>
        <p className="mt-4 text-slate-400 text-sm flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Geen spam. Gratis in beta.
        </p>
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
            <span className="text-lg font-bold text-white">
              Direct<span className="text-brand">BnB</span>
            </span>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-xs">
              Directe boekingen voor B&B eigenaren. Geen commissies, volledige controle.
            </p>
          </div>
          {[
            {
              title: 'Product',
              links: [
                { label: 'Voordelen', href: '#voordelen' },
                { label: 'Hoe werkt het', href: '#hoe-het-werkt' },
                { label: 'Besparing', href: '#besparing' },
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
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
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
