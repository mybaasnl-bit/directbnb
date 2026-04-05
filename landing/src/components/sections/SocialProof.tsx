const testimonials = [
  {
    quote: 'Ik bespaar nu €720 per maand aan commissies. Simpel en duidelijk systeem.',
    name: 'Marieke van den Berg',
    location: 'Utrecht',
    initials: 'MB',
    bg: 'bg-brand-500',
  },
  {
    quote: 'Eindelijk onafhankelijk van Booking.com. Meer winst en volledige controle.',
    name: 'Hans Jansen',
    location: 'Amsterdam',
    initials: 'HJ',
    bg: 'bg-slate-700',
  },
  {
    quote: 'Super gebruiksvriendelijk. Binnen een dag volledig operationeel.',
    name: 'Els Vermeulen',
    location: 'Limburg',
    initials: 'EV',
    bg: 'bg-brand-400',
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Dit zeggen B&B eigenaren
          </h2>
          <p className="text-slate-500 text-lg">Al meer dan 200 eigenaren ontvangen directe boekingen</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-slate-100 p-7 hover:shadow-md transition-shadow">
              <Stars />
              <p className="text-slate-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${t.bg} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
