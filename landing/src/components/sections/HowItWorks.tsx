const steps = [
  {
    number: '1',
    title: 'Maak je accommodatie aan',
    body: 'Vul je kamers, tarieven en beschikbaarheid in. Binnen <strong>5 minuten</strong> klaar.',
    highlight: '5 minuten',
  },
  {
    number: '2',
    title: 'Ontvang boekingen',
    body: 'Deel je boekingslink met gasten. Zij boeken direct bij jou, <strong>zonder commissies</strong>.',
    highlight: 'zonder commissies',
  },
  {
    number: '3',
    title: 'Beheer alles op één plek',
    body: 'Overzichtelijk dashboard met kalender, boekingen en gastgegevens. <strong>Altijd inzicht</strong>.',
    highlight: 'Altijd inzicht',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Hoe werkt het
          </h2>
          <p className="text-slate-500 text-lg">In drie stappen online en directe boekingen ontvangen</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-start gap-6 bg-white rounded-2xl border border-slate-100 p-6 ${
              i === 1 ? 'ml-0 md:ml-8' : ''
            }`}>
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl flex-shrink-0">
                {step.number}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-slate-900 text-lg mb-1">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: step.body.replace(
                      `<strong>${step.highlight}</strong>`,
                      `<span class="text-brand-500 font-bold">${step.highlight}</span>`
                    )
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
