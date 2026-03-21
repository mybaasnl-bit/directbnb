import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';

const placeholders = [
  { initials: 'MB', color: 'bg-brand-500', name: 'Maria B.', location: 'Amsterdam' },
  { initials: 'JV', color: 'bg-violet-500', name: 'Jan V.', location: 'Utrecht' },
  { initials: 'SK', color: 'bg-emerald-500', name: 'Sophie K.', location: 'Rotterdam' },
];

export default function SocialProof() {
  const t = useTranslations('socialProof');

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="light" className="mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            {t('headline')}
          </h2>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-40">
          {placeholders.map((p) => (
            <div
              key={p.name}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-7"
            >
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="h-3 bg-slate-200 rounded-full w-full mb-2" />
              <div className="h-3 bg-slate-200 rounded-full w-4/5 mb-2" />
              <div className="h-3 bg-slate-200 rounded-full w-3/5 mb-6" />
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${p.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {p.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-400 text-sm mt-6">{t('comingSoon')}</p>
      </div>
    </section>
  );
}
