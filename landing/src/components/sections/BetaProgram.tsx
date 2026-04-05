const rows = [
  { label: 'Per nacht', value: '€20 – €30', highlight: false },
  { label: 'Per maand', value: '€400 – €900', highlight: true },
  { label: 'Per kwartaal', value: '€1.200 – €2.700', highlight: false },
];

const platforms = [
  { name: 'Booking.com', commission: '-€25', pct: 25, bad: true },
  { name: 'Airbnb', commission: '-€18', pct: 18, bad: true },
  { name: 'DirectBnB', commission: '€0', pct: 0, bad: false, label: 'Jij houdt 100%' },
];

export default function BetaProgram() {
  return (
    <section id="besparing" className="bg-brand-500 py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Met DirectBnB bespaar je:
          </h2>
          <p className="text-white/70 text-lg">Bij een gemiddelde nachtprijs van €100</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Savings rows */}
          <div className="bg-white/10 rounded-3xl p-6 lg:p-8 space-y-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between rounded-2xl px-5 py-4 ${
                  row.highlight ? 'bg-white' : 'bg-white/10'
                }`}
              >
                <span className={`font-semibold text-sm ${row.highlight ? 'text-slate-700' : 'text-white/80'}`}>
                  {row.label}
                </span>
                <span className={`font-extrabold text-lg ${row.highlight ? 'text-brand-500' : 'text-white'}`}>
                  {row.value}
                </span>
              </div>
            ))}

            <div className="pt-2">
              <p className="text-white/60 text-xs leading-relaxed">
                Rekenvoorbeeld: B&B met 2 kamers, gemiddeld 15 boekingsnachten per maand tegen €100 per nacht.
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
              {platforms.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                    <span className={`text-sm font-bold ${p.bad ? 'text-red-500' : 'text-emerald-600'}`}>
                      {p.label ?? p.commission}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    {p.bad ? (
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${p.pct}%` }}
                      />
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
