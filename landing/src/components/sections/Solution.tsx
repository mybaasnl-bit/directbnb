import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';

const cards = [
  {
    titleKey: 'card1Title' as const,
    descKey: 'card1Desc' as const,
    icon: '💰',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    titleKey: 'card2Title' as const,
    descKey: 'card2Desc' as const,
    icon: '🌐',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    titleKey: 'card3Title' as const,
    descKey: 'card3Desc' as const,
    icon: '📊',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    titleKey: 'card4Title' as const,
    descKey: 'card4Desc' as const,
    icon: '✉️',
    color: 'bg-sky-50 text-sky-600',
  },
];

export default function Solution() {
  const t = useTranslations('solution');

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-4">
            ✦ {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            {t('headline')}
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {t('subheadline')}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div
              key={card.titleKey}
              className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-brand-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-200"
            >
              <div
                className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-200`}
              >
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t(card.titleKey)}</h3>
              <p className="text-slate-500 leading-relaxed">{t(card.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
