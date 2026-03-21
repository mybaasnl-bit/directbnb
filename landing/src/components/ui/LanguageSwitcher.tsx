'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

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
      // Strip existing locale prefix and add new one
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

  const base =
    'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150';
  const activeClass = dark
    ? 'bg-white/20 text-white'
    : 'bg-slate-100 text-slate-900';
  const inactiveClass = dark
    ? 'text-white/50 hover:text-white/80'
    : 'text-slate-400 hover:text-slate-600';

  return (
    <div
      className={`flex items-center rounded-xl p-1 gap-0.5 ${
        dark ? 'bg-white/10' : 'bg-slate-100'
      }`}
    >
      {(['nl', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => handleSwitch(l)}
          disabled={isPending}
          className={`${base} ${locale === l ? activeClass : inactiveClass}`}
        >
          {l === 'nl' ? '🇳🇱 NL' : '🇬🇧 EN'}
        </button>
      ))}
    </div>
  );
}
