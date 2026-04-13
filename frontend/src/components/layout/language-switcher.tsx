'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const LOCALES = [
  { code: 'nl', label: '🇳🇱 Nederlands' },
  { code: 'en', label: '🇬🇧 Engels' },
  { code: 'de', label: '🇩🇪 Duits' },
  { code: 'fr', label: '🇫🇷 Frans' },
  { code: 'es', label: '🇪🇸 Spaans' },
];

export function LanguageSwitcher({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const current = LOCALES.find((l) => l.code === locale);

  if (variant === 'sidebar') {
    return (
      <div className="px-3 pb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1.5">Taal</p>
        <div className="relative">
          <select
            value={locale}
            onChange={(e) => switchLocale(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-100 text-slate-700 text-sm font-semibold rounded-xl pl-3 pr-8 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/30"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        className="appearance-none bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 cursor-pointer border-0 outline-none focus:ring-2 focus:ring-brand/30"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
    </div>
  );
}
