import { LanguageSwitcher } from '@/components/layout/language-switcher';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900">
            Direct<span className="text-brand">BnB</span>
          </span>
          <span className="text-xs bg-brand-light text-brand-600 px-2 py-0.5 rounded-full font-medium">
            Beta
          </span>
        </div>
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <footer className="text-center text-sm text-slate-400 py-6">
        © {new Date().getFullYear()} DirectBnB
      </footer>
    </div>
  );
}
