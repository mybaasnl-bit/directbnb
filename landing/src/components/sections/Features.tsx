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

export default function Features() {
  return (
    <section id="features" className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Alles wat je nodig hebt
          </h2>
          <p className="text-slate-500 text-lg">Alle functies om je B&B professioneel te beheren</p>
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
