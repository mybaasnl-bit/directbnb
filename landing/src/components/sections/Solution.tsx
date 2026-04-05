const benefits = [
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: 'Directe boekingen',
    body: 'Gasten boeken rechtstreeks bij jou. Geen tussenpartij, geen commissies.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Eigen controle',
    body: 'Jij bepaalt de regels, prijzen en voorwaarden. Geen platformafhankelijkheid.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Alles in één systeem',
    body: 'Kalender, boekingen, gasten en betalingen in één overzichtelijk dashboard.',
  },
];

export default function Solution() {
  return (
    <section className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            De oplossing: DirectBnB
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Ontvang directe boekingen zonder commissies en beheer alles op één plek
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {benefits.map((b, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  {b.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
