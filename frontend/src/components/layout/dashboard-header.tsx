'use client';

import { useAuth } from '@/hooks/use-auth';
import { LanguageSwitcher } from './language-switcher';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Bell, X, CalendarDays, Check, XCircle, ArrowRight, BedDouble } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
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

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Goedemorgen, ${name} 👋`;
  if (hour < 18) return `Goedemiddag, ${name} 👋`;
  return `Goedenavond, ${name} 👋`;
}

export function DashboardHeader() {
  const { user } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const currentLocale = useLocale();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = (user as any)?.role === 'ADMIN';

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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
    enabled: !isAdmin,
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
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  const nights = (ci: string, co: string) =>
    Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <header className="bg-white border-b border-slate-100 px-8 h-16 flex items-center justify-between shrink-0">
      {/* Begroeting */}
      <div>
        {user && (
          <p className="text-base font-semibold text-slate-900">
            {getGreeting(user.firstName)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <FeedbackButton compact />

        {/* Notificatie bel */}
        {!isAdmin && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              className={`relative p-2.5 rounded-xl transition-colors ${
                open ? 'bg-slate-100' : 'hover:bg-slate-100'
              }`}
              aria-label="Meldingen"
            >
              <Bell className={`w-5 h-5 ${pendingCount > 0 ? 'text-slate-700' : 'text-slate-400'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Boekingsaanvragen</h3>
                    {pendingCount > 0 && (
                      <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Lijst */}
                <div className="max-h-[480px] overflow-y-auto">
                  {pendingBookings.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-500">Geen openstaande aanvragen</p>
                      <p className="text-sm text-slate-400 mt-1">Alles is bijgewerkt!</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {pendingBookings.map((booking) => (
                        <li key={booking.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                          {/* Gast */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
                                {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">
                                  {booking.guest.firstName} {booking.guest.lastName}
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                  <BedDouble className="w-3 h-3 flex-shrink-0" />
                                  {booking.room.property.name} · {booking.room.name}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                              €{Number(booking.totalPrice).toFixed(0)}
                            </span>
                          </div>

                          {/* Datums */}
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 bg-slate-50 px-3 py-2 rounded-lg">
                            <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>{fmt(booking.checkIn)} → {fmt(booking.checkOut)}</span>
                            <span className="text-slate-400">
                              ({nights(booking.checkIn, booking.checkOut)} nachten)
                            </span>
                          </div>

                          {/* Knoppen */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              Accepteren
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ id: booking.id, status: 'REJECTED' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-red-200 hover:text-red-600 text-slate-600 text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Weigeren
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-5 py-3">
                  <Link
                    href={`/${locale}/bookings`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between text-sm font-semibold text-brand hover:text-brand-600 group"
                  >
                    Alle boekingen bekijken
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <LanguageSwitcher />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
          {initials}
        </div>
      </div>
    </header>
  );
}
