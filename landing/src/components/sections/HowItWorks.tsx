import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';

const steps = [
  {
    numberKey: 'step1Number' as const,
    titleKey: 'step1Title' as const,
    descKey: 'step1Desc' as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    numberKey: 'step2Number' as const,
    titleKey: 'step2Title' as const,
    descKey: 'step2Desc' as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    numberKey: 'step3Number' as const,
    titleKey: 'step3Title' as const,
    descKey: 'step3Desc' as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <section id="how-it-works" className="bg-slate-50 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="light" className="mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            {t('headline')}
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">{t('subheadline')}</p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.titleKey} className="relative flex flex-col items-center text-center group">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-white border-2 border-slate-200 group-hover:border-brand-300 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 text-slate-600 group-hover:text-brand-600">
                    {step.icon}
                  </div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-brand-500/30">
                    {idx + 1}
                  </div>
                </div>

                {/* Step label */}
                <div className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-2">
                  {t(step.numberKey)}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">{t(step.titleKey)}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
