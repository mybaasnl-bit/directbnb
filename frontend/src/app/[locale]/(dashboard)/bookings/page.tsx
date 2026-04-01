'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import {
  Check, X, Link2, Loader2, CheckCircle2, CalendarDays,
  BedDouble, Users, Clock, Filter,
} from 'lucide-react';

// ── Status filters (vereenvoudigd voor niet-technische gebruiker) ──────────
const FILTERS = [
  { key: 'all',              label: 'Alle boekingen' },
  { key: 'PENDING',          label: 'Wachten op actie' },
  { key: 'CONFIRMED',        label: 'Bevestigd' },
  { key: 'PAYMENT_PENDING',  label: 'Wacht op betaling' },
  { key: 'PAID',             label: 'Betaald' },
  { key: 'COMPLETED',        label: 'Afgerond' },
  { key: 'CANCELLED',        label: 'Geannuleerd' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function BookingsPage() {
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sentLinks, setSentLinks] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', filter],
    queryFn: () =>
      api
        .get('/bookings', { params: filter !== 'all' ? { status: filter } : {} })
        .then((r) => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
    },
  });

  const sendPaymentLink = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      api.post(`/mollie/send-link/${id}?method=${method}`).then(r => r.data?.data ?? r.data),
    onSuccess: (_data, variables) => {
      setSentLinks(prev => new Set(Array.from(prev).concat(variables.id)));
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const pendingBookings = (bookings as any[]).filter((b) => b.status === 'PENDING');
  const otherBookings   = (bookings as any[]).filter((b) => b.status !== 'PENDING');

  const fmt = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: dateLocale });
  const nights = (ci: string, co: string) =>
    Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Koptekst */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Boekingen</h1>
        <p className="text-slate-500 mt-1">Beheer hier alle reserveringen van uw gasten.</p>
      </div>

      {/* ── OPENSTAANDE AANVRAGEN (altijd bovenaan, opvallend) ─────────────── */}
      {filter === 'all' && pendingBookings.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-slate-900">
              Wachten op uw reactie
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-brand text-white text-xs font-bold rounded-full">
                {pendingBookings.length}
              </span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingBookings.map((booking: any) => {
              const checkIn  = new Date(booking.checkIn);
              const checkOut = new Date(booking.checkOut);
              const n = nights(booking.checkIn, booking.checkOut);

              return (
                <div
                  key={booking.id}
                  className="bg-brand-light border-2 border-brand/20 rounded-2xl p-5 space-y-4"
                >
                  {/* Gast + prijs */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-brand text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <BedDouble className="w-3.5 h-3.5" />
                          {booking.room.property.name} — {booking.room.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-slate-900">€{Number(booking.totalPrice).toFixed(0)}</p>
                      <p className="text-xs text-slate-500">{booking.numGuests} gast{booking.numGuests !== 1 ? 'en' : ''}</p>
                    </div>
                  </div>

                  {/* Datumrij */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-medium">Inchecken</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {format(checkIn, 'd MMM', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-medium">Uitchecken</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {format(checkOut, 'd MMM', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-medium">Nachten</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{n}</p>
                    </div>
                  </div>

                  {booking.guestMessage && (
                    <div className="bg-white rounded-xl px-4 py-3">
                      <p className="text-xs text-slate-400 font-medium mb-1">Bericht van gast</p>
                      <p className="text-sm text-slate-600 italic">"{booking.guestMessage}"</p>
                    </div>
                  )}

                  {/* Actieknoppen — groot en duidelijk */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Accepteren
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: booking.id, status: 'REJECTED' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-red-300 hover:text-red-600 disabled:opacity-60 text-slate-600 font-bold py-3.5 rounded-xl text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Weigeren
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FILTER TABS ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === key
                ? 'bg-brand text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── BOEKINGENLIJST ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (filter === 'all' ? otherBookings : bookings as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-14 text-center">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-brand" />
          </div>
          <p className="text-base font-semibold text-slate-700">Geen boekingen gevonden</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'all'
              ? 'U heeft nog geen boekingen ontvangen. Deel uw boekingslink om gasten aan te trekken.'
              : 'Geen boekingen met dit filter. Probeer een andere categorie.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(filter === 'all' ? otherBookings : bookings as any[]).map((booking: any) => {
            const linkSent   = sentLinks.has(booking.id);
            const isSending  = sendPaymentLink.isPending && sendPaymentLink.variables?.id === booking.id;
            const n          = nights(booking.checkIn, booking.checkOut);

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors overflow-hidden"
              >
                <div className="flex items-start gap-4 p-5">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
                    {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-slate-900 text-base">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 flex-shrink-0" />
                      {booking.room.property.name} — {booking.room.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {fmt(booking.checkIn)} → {fmt(booking.checkOut)}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {booking.numGuests}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-800">€{Number(booking.totalPrice).toFixed(0)}</span>
                    </div>
                    {booking.guestMessage && (
                      <p className="text-sm text-slate-400 mt-1.5 italic">
                        &ldquo;{booking.guestMessage}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Acties rechts */}
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {booking.status === 'CONFIRMED' && (
                      <>
                        {linkSent ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Link verstuurd
                          </span>
                        ) : (
                          <button
                            onClick={() => sendPaymentLink.mutate({ id: booking.id, method: 'ideal' })}
                            disabled={isSending}
                            className="flex items-center gap-1.5 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                            Betaallink sturen
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus.mutate({ id: booking.id, status: 'CANCELLED' })}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Annuleren
                        </button>
                      </>
                    )}
                    {booking.status === 'PAYMENT_PENDING' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: booking.id, status: 'CANCELLED' })}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Annuleren
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
