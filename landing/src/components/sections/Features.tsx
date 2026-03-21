import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';

const features = [
  {
    titleKey: 'feat1Title' as const,
    descKey: 'feat1Desc' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-brand-500/10 to-violet-500/10',
    iconColor: 'text-brand-500',
  },
  {
    titleKey: 'feat2Title' as const,
    descKey: 'feat2Desc' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-sky-500/10 to-brand-500/10',
    iconColor: 'text-sky-500',
  },
  {
    titleKey: 'feat3Title' as const,
    descKey: 'feat3Desc' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-violet-500/10 to-pink-500/10',
    iconColor: 'text-violet-500',
  },
  {
    titleKey: 'feat4Title' as const,
    descKey: 'feat4Desc' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    gradient: 'from-emerald-500/10 to-sky-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    titleKey: 'feat5Title' as const,
    descKey: 'feat5Desc' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-orange-500/10 to-rose-500/10',
    iconColor: 'text-orange-500',
  },
  {
    titleKey: 'feat6Title' as const,
    descKey: 'feat6Desc' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
    gradient: 'from-teal-500/10 to-brand-500/10',
    iconColor: 'text-teal-500',
  },
];

export default function Features() {
  const t = useTranslations('features');

  return (
    <section id="features" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            {t('headline')}
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">{t('subheadline')}</p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => (
            <div
              key={feat.titleKey}
              className={`group relative bg-gradient-to-br ${feat.gradient} border border-slate-200 hover:border-transparent rounded-2xl p-7 hover:shadow-lg transition-all duration-200 overflow-hidden`}
            >
              <div
                className={`w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm mb-5 ${feat.iconColor} group-hover:scale-110 transition-transform duration-200`}
              >
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t(feat.titleKey)}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t(feat.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
