const PLANS = [
  {
    id: 'basic',
    name: 'Basis',
    price: '€19',
    period: 'per maand',
    tagline: 'Alles wat je nodig hebt om te starten',
    features: [
      'Onbeperkte boekingen',
      'Automatische e-mails aan gasten',
      'Beschikbaarheidskalender',
      'Stripe betalingen',
      'Gastenregistratie',
      'DirectB&B subdomain',
    ],
    highlighted: false,
    badge: null,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '€39',
    period: 'per maand',
    tagline: 'Voor serieuze B&B ondernemers',
    features: [
      'Alles uit Basis',
      'Meerdere kamers & accommodaties',
      'Aangepaste e-mail templates',
      'Prioriteit klantenservice',
      'Geavanceerde statistieken',
      'Eigen domein koppeling',
    ],
    highlighted: true,
    badge: 'Meest gekozen',
  },
] as const;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.directbnb.nl';

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            14 dagen gratis proberen
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Eenvoudige, eerlijke prijzen
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Geen verborgen kosten. Geen commissie per boeking. Maandelijks opzegbaar.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 flex flex-col transition-shadow ${
                plan.highlighted
                  ? 'bg-brand text-white shadow-2xl shadow-brand/30'
                  : 'bg-white border border-slate-100 hover:shadow-lg'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-6">
                <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                  plan.highlighted ? 'text-white/70' : 'text-brand'
                }`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/70' : 'text-slate-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1.5 ${plan.highlighted ? 'text-white/80' : 'text-slate-500'}`}>
                  {plan.tagline}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.highlighted ? 'bg-white/20' : 'bg-brand/10'
                    }`}>
                      <svg
                        className={`w-3 h-3 ${plan.highlighted ? 'text-white' : 'text-brand'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={plan.highlighted ? 'text-white/90' : 'text-slate-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={`${APP_URL}/nl/register`}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  plan.highlighted
                    ? 'bg-white text-brand hover:bg-slate-50'
                    : 'bg-brand text-white hover:bg-brand/90'
                }`}
              >
                Start Nu — 14 dagen gratis
              </a>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-slate-400 mt-10">
          Betaling veilig via Stripe · Geen creditcard nodig voor proefperiode · Maandelijks opzegbaar
        </p>
      </div>
    </section>
  );
}
