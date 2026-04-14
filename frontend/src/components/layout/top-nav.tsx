'use client';

import { useAuth } from '@/hooks/use-auth';
import { LanguageSwitcher } from './language-switcher';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Bell, X, CalendarDays, Check, XCircle, ArrowRight, BedDouble, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface Booking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  createdAt: string;
  guest: { firstName: string; lastName: string; email: string };
  room: { name: string; property: { name: string; id: string } };
}

export function TopNav() {
  const { user, logout } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const currentLocale = useLocale();
  const t = useTranslations('notifications');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (open || profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, profileOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { data: pendingBookings = [] } = useQuery<Booking[]>({
    queryKey: ['pending-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { status: 'PENDING' } }).then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
  });

  const pendingCount = pendingBookings.length;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const dateLocale = currentLocale === 'nl' ? 'nl-NL' : 'en-GB';
  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });

  const nights = (checkIn: string, checkOut: string) =>
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="text-sm text-slate-500">
        {user && (
          <span>
            {currentLocale === 'nl' ? 'Welkom, ' : 'Welcome, '}
            <span className="font-medium text-slate-900">{user.firstName}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <FeedbackButton compact />

        {/* ── Notification bell ── */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(v => !v)}
            className={`relative p-2 rounded-lg transition-colors ${
              open ? 'bg-slate-100' : 'hover:bg-slate-100'
            }`}
            aria-label={t('ariaLabel')}
          >
            <Bell className={`w-4 h-4 ${pendingCount > 0 ? 'text-slate-700' : 'text-slate-400'}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>

          {/* ── Dropdown ── */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{t('title')}</h3>
                  {pendingCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[420px] overflow-y-auto">
                {pendingBookings.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">{t('empty')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('emptySubtitle')}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {pendingBookings.map((booking) => (
                      <li key={booking.id} className="px-4 py-3.5 hover:bg-slate-50 transition-colors">
                        {/* Guest + property */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0">
                              {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {booking.guest.firstName} {booking.guest.lastName}
                              </p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                <BedDouble className="w-3 h-3 flex-shrink-0" />
                                {booking.room.property.name} · {booking.room.name}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-700 flex-shrink-0">
                            €{Number(booking.totalPrice).toFixed(0)}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {fmt(booking.checkIn)} → {fmt(booking.checkOut)}
                          <span className="text-slate-400">
                            ({t('nights', { count: nights(booking.checkIn, booking.checkOut) })})
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t('confirm')}
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({ id: booking.id, status: 'REJECTED' })}
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-1.5 flex-1 justify-center text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {t('reject')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-4 py-2.5">
                <Link
                  href={`/${locale}/bookings`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between text-xs font-medium text-brand hover:text-brand-600 group"
                >
                  {t('viewAll')}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

            </div>
          )}
        </div>

        <LanguageSwitcher />

        {/* Avatar dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-1.5 rounded-xl p-1 hover:bg-slate-100 transition-colors"
            aria-label="Profielmenu"
          >
            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{(user as any)?.email}</p>
              </div>
              <Link
                href={`/${locale}/settings`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Instellingen
              </Link>
              <button
                onClick={() => { logout(); setProfileOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
