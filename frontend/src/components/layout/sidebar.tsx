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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { locale } = useParams();
  const { logout, user } = useAuth();

  const isAdmin = (user as any)?.role === 'ADMIN';

  const { data: pendingBookings = [] } = useQuery<unknown[]>({
    queryKey: ['pending-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { status: 'PENDING' } }).then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
    enabled: !isAdmin,
  });
  const pendingCount = pendingBookings.length;

  const navItems = [
    { href: `/${locale}/dashboard`,        label: 'Dashboard',       icon: LayoutDashboard },
    { href: `/${locale}/bookings`,         label: 'Boekingen',       icon: BookOpen, badge: pendingCount },
    { href: `/${locale}/calendar`,         label: 'Kalender',        icon: CalendarDays },
    { href: `/${locale}/properties`,       label: 'Accommodaties',   icon: Building2 },
    { href: `/${locale}/guests`,           label: 'Gasten',          icon: Users },
    ...(!isAdmin ? [{ href: `/${locale}/email-templates`, label: 'E-mails', icon: Mail }] : []),
    { href: `/${locale}/betalingen`,       label: 'Uitbetalingen',   icon: Banknote },
  ];

  const bottomItems = [
    { href: `/${locale}/settings`, label: 'Instellingen', icon: Settings },
  ];

  const adminItems = [
    { href: `/${locale}/admin/payments`,        label: t('payments'),       icon: Euro },
    { href: `/${locale}/admin/email-templates`, label: t('emailTemplates'), icon: Mail },
    { href: `/${locale}/admin/beta-signups`,    label: t('betaSignups'),    icon: ClipboardList },
    { href: `/${locale}/admin/email-logs`,      label: t('emailLogs'),      icon: FileText },
  ];

  const sidebarContent = (
    <aside className="w-[260px] h-full bg-white flex flex-col border-r border-slate-100">

      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Direct<span className="text-brand">BnB</span>
          </span>
        </div>
        {isAdmin && (
          <span className="mt-2 inline-block text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-0.5 rounded-full">
            Admin
          </span>
        )}
      </div>

      {/* Sectielabel */}
      <div className="px-6 pb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }: any) => {
          const isActive = pathname === href || (href !== `/${locale}/dashboard` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-brand-light text-brand'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                isActive ? 'bg-brand' : 'bg-slate-100 group-hover:bg-slate-200',
              )}>
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
              </span>

              <span className="flex-1">{label}</span>

              {badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin sectie */}
        {isAdmin && (
          <>
            <div className="pt-5 pb-2 px-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-brand-light text-brand'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                    isActive ? 'bg-brand' : 'bg-slate-100',
                  )}>
                    <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-slate-400')} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 pt-3 space-y-0.5 border-t border-slate-50">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-brand-light text-brand'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                isActive ? 'bg-brand' : 'bg-slate-100',
              )}>
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
              </span>
              {label}
            </Link>
          );
        })}

        <button
          onClick={() => { logout(); onClose?.(); }}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-2xl text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-slate-400" />
          </span>
          Uitloggen
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0 min-h-screen">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
