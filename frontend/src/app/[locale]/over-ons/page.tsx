import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export const metadata = {
  title: 'Over ons — DirectBnB',
  description: 'Leer meer over DirectBnB en onze missie om B&B eigenaren te helpen meer directe boekingen te krijgen zonder commissies.',
};

export default async function OverOnsPage() {
  const locale = await getLocale();

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
            <Link href={`/${locale}/contact`} className="text-slate-500 hover:text-slate-900 transition-colors">
              Contact
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
        <div className="max-w-3xl mx-auto">

          {/* Hero */}
          <div className="mb-14">
            <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug naar Home
            </Link>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Over DirectBnB</h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
              Wij geloven dat B&amp;B eigenaren de vruchten van hun eigen werk moeten plukken — niet de grote boekingsplatformen.
            </p>
          </div>

          {/* Mission */}
          <section className="bg-white rounded-2xl border border-slate-100 p-8 mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Onze missie</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              DirectBnB werd opgericht met één doel: B&amp;B eigenaren in Nederland en België helpen om meer directe boekingen te ontvangen zonder commissies te betalen aan grote platformen als Booking.com en Airbnb.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We bieden een eenvoudig, professioneel platform waarop gasten rechtstreeks bij jou kunnen boeken. Jij behoudt de volledige controle over je prijzen, beschikbaarheid en gastcommunicatie — en je houdt 100% van de opbrengst.
            </p>
          </section>

          {/* Why */}
          <section className="bg-white rounded-2xl border border-slate-100 p-8 mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Waarom DirectBnB?</h2>
            <div className="space-y-5">
              {[
                {
                  title: 'Geen commissies',
                  desc: 'Grote boekingsplatformen rekenen 15–25% commissie. Dat loopt al snel op tot honderden euro\'s per maand. Met DirectBnB betaal je een kleine vaste vergoeding en houd je de rest zelf.',
                },
                {
                  title: 'Jouw eigen platform',
                  desc: 'Een professionele boekingspagina met jouw branding, jouw sfeer. Gasten boeken bij jou — niet bij een platform.',
                },
                {
                  title: 'Gebouwd voor de Nederlandse markt',
                  desc: 'DirectBnB is speciaal ontwikkeld voor B&B eigenaren in Nederland en België. Alles is in het Nederlands beschikbaar en aansluitend op lokale wet- en regelgeving.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-light rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Story */}
          <section className="bg-white rounded-2xl border border-slate-100 p-8 mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ons verhaal</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              DirectBnB is in 2024 opgericht door een team van ondernemers die zelf ervaring hebben in de hospitality-branche. We zagen dat B&amp;B eigenaren steeds meer afhankelijk werden van grote platforms en steeds minder controle hadden over hun eigen business.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              We bouwden DirectBnB als het platform dat we zelf zouden willen gebruiken: eenvoudig, transparant en volledig gericht op directe boekingen.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We bevinden ons momenteel in de beta-fase en werken nauw samen met onze eerste gebruikers om het platform verder te verbeteren. Heb je vragen of feedback? We horen het graag.
            </p>
          </section>

          {/* CTA */}
          <div className="bg-brand rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-extrabold mb-3">Klaar om te starten?</h2>
            <p className="text-white/80 mb-6">
              Vraag gratis beta toegang aan en ontvang directe boekingen zonder commissies.
            </p>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 bg-white text-brand font-bold px-7 py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Start gratis beta
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
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
