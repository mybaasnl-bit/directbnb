import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">
              Direct<span className="text-brand">BnB</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href={`/${locale}/algemene-voorwaarden`} className="text-slate-500 hover:text-brand transition-colors">
              Algemene voorwaarden
            </Link>
            <Link href={`/${locale}/privacybeleid`} className="text-slate-500 hover:text-brand transition-colors">
              Privacybeleid
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} DirectBnB — Alle rechten voorbehouden.</span>
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/algemene-voorwaarden`} className="hover:text-brand transition-colors">Algemene voorwaarden</Link>
            <Link href={`/${locale}/privacybeleid`} className="hover:text-brand transition-colors">Privacybeleid</Link>
            <Link href={`/${locale}/login`} className="hover:text-brand transition-colors">Inloggen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
