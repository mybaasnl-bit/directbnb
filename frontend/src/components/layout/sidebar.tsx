'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { locale } = useParams();
  const { logout, user } = useAuth();

  const isAdmin = (user as any)?.role === 'ADMIN';

  // Pending bookings badge
  const { data: pendingBookings = [] } = useQuery<unknown[]>({
    queryKey: ['pending-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { status: 'PENDING' } }).then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
    enabled: !isAdmin,
  });
  const pendingCount = pendingBookings.length;

  const navItems = [
    { href: `/${locale}/dashboard`,        label: 'Dashboard',     icon: LayoutDashboard },
    { href: `/${locale}/bookings`,         label: 'Boekingen',     icon: BookOpen,  badge: pendingCount },
    { href: `/${locale}/calendar`,         label: 'Agenda',        icon: CalendarDays },
    { href: `/${locale}/properties`,       label: 'Kamers',        icon: Building2 },
    { href: `/${locale}/guests`,           label: 'Gasten',        icon: Users },
    ...(!isAdmin ? [{ href: `/${locale}/email-templates`, label: 'E-mails', icon: Mail }] : []),
    { href: `/${locale}/betalingen`,       label: 'Uitbetalingen', icon: Banknote },
  ];

  const bottomItems = [
    { href: `/${locale}/settings`, label: 'Instellingen', icon: Settings },
  ];

  const adminItems = [
    { href: `/${locale}/admin/payments`,        label: t('payments'),    icon: Euro },
    { href: `/${locale}/admin/email-templates`, label: t('emailTemplates'), icon: Mail },
    { href: `/${locale}/admin/beta-signups`,    label: t('betaSignups'), icon: ClipboardList },
    { href: `/${locale}/admin/email-logs`,      label: t('emailLogs'),   icon: FileText },
  ];

  return (
    <aside className="w-[280px] shrink-0 min-h-screen bg-white border-r border-slate-100 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-slate-900 font-display tracking-tight">
            Direct<span className="text-brand">BnB</span>
          </span>
        </div>
        {isAdmin && (
          <span className="mt-2 inline-block text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            Admin
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, badge }: any) => {
          const isActive = pathname === href || (href !== `/${locale}/dashboard` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-light text-brand font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
              )}
            >
              {/* Active indicator bar */}
              <span className={cn(
                'absolute left-0 w-1 h-8 rounded-r-full bg-brand transition-opacity',
                isActive ? 'opacity-100' : 'opacity-0',
              )} />

              <Icon className={cn(
                'w-5 h-5 shrink-0 transition-colors',
                isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600',
              )} />

              <span className="flex-1">{label}</span>

              {/* Badge (bv. openstaande boekingen) */}
              {badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand text-white text-xs font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin sectie */}
        {isAdmin && (
          <>
            <div className="pt-5 pb-2 px-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin</p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand-light text-brand font-semibold'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50',
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

      {/* Bottom: instellingen + uitloggen */}
      <div className="px-4 pb-6 space-y-1 border-t border-slate-100 pt-4">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-medium transition-all',
                isActive
                  ? 'bg-brand-light text-brand font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
              )}
            >
              <Icon className="w-5 h-5 shrink-0 text-slate-400" />
              {label}
            </Link>
          );
        })}

        <button
          onClick={logout}
          className="flex items-center gap-3.5 px-4 py-3.5 w-full rounded-xl text-base font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
