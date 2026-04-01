'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

const LOCALES = [
  { code: 'nl', label: '🇳🇱 NL' },
  { code: 'en', label: '🇬🇧 EN' },
];

interface LanguageSwitcherProps {
  dark?: boolean;
}

export default function LanguageSwitcher({ dark = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (newLocale: string) => {
    startTransition(() => {
      const segments = pathname.split('/');
      const locales = ['nl', 'en'];
      if (locales.includes(segments[1])) {
        segments[1] = newLocale;
      } else {
        segments.splice(1, 0, newLocale);
      }
      const newPath = segments.join('/') || '/';
      router.replace(newPath);
    });
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={isPending}
        className={`appearance-none text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 cursor-pointer border-0 outline-none focus:ring-2 ${
          dark
            ? 'bg-white/10 text-white focus:ring-white/30'
            : 'bg-slate-100 text-slate-700 focus:ring-brand/30'
        }`}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-white text-slate-900">
            {l.label}
          </option>
        ))}
      </select>
      <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-white/50' : 'text-slate-400'}`}>▾</span>
    </div>
  );
}
