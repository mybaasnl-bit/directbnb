'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Mail,
  FileText,
  ClipboardList,
  Euro,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { locale } = useParams();
  const { logout, user } = useAuth();

  const isAdmin = (user as any)?.role === 'ADMIN';

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/properties`, label: t('properties'), icon: Building2 },
    { href: `/${locale}/bookings`, label: t('bookings'), icon: BookOpen },
    { href: `/${locale}/calendar`, label: t('calendar'), icon: CalendarDays },
    { href: `/${locale}/guests`, label: t('guests'), icon: Users },
    { href: `/${locale}/settings`, label: t('settings'), icon: Settings },
    { href: `/${locale}/betalingen`, label: t('payouts'), icon: Banknote },
  ];

  const adminItems = [
    { href: `/${locale}/admin/payments`, label: t('payments'), icon: Euro },
    { href: `/${locale}/admin/email-templates`, label: t('emailTemplates'), icon: Mail },
    { href: `/${locale}/admin/beta-signups`, label: t('betaSignups'), icon: ClipboardList },
    { href: `/${locale}/admin/email-logs`, label: t('emailLogs'), icon: FileText },
  ];

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <span className="text-lg font-bold text-white">
          Direct<span className="text-indigo-400">BnB</span>
        </span>
        <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
          Beta
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Admin
              </p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
