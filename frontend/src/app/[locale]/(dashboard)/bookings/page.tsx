'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { Check, X, Link2, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_FILTERS = ['all', 'PENDING', 'CONFIRMED', 'PAYMENT_PENDING', 'PAID', 'CANCELLED', 'COMPLETED'] as const;

export default function BookingsPage() {
  const t = useTranslations('bookings');
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;

  // Map STATUS_FILTERS keys to translation keys (lowercase for JSON lookup)
  const filterLabel = (s: string) =>
    s === 'all' ? t('filters.all') : t(`filters.${s.toLowerCase()}`);
  const [filter, setFilter] = useState<string>('all');
  const [sentLinks, setSentLinks] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-bookings'] });
    },
  });

  const sendPaymentLink = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      api.post(`/mollie/send-link/${id}?method=${method}`).then(r => r.data?.data ?? r.data),
    onSuccess: (_data, variables) => {
      setSentLinks(prev => new Set(Array.from(prev).concat(variables.id)));
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filterLabel(s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any) => {
            const linkSent = sentLinks.has(booking.id);
            const isSendingLink = sendPaymentLink.isPending && sendPaymentLink.variables?.id === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {booking.room.property.name} — {booking.room.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {format(new Date(booking.checkIn), 'dd MMM yyyy', { locale: dateLocale })}
                      {' → '}
                      {format(new Date(booking.checkOut), 'dd MMM yyyy', { locale: dateLocale })}
                      {' · '}
                      {booking.numGuests} {t('guests')}
                      {' · '}
                      <span className="font-medium">€{Number(booking.totalPrice).toFixed(0)}</span>
                    </p>
                    {booking.guestMessage && (
                      <p className="text-sm text-slate-500 mt-1 italic">&quot;{booking.guestMessage}&quot;</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {/* PENDING: confirm / reject */}
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatus.mutate({ id: booking.id, status: 'confirmed' })}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          {t('confirm')}
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: booking.id, status: 'rejected' })}
                          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border border-red-200"
                        >
                          <X className="w-4 h-4" />
                          {t('reject')}
                        </button>
                      </>
                    )}

                    {/* CONFIRMED: send payment link + cancel */}
                    {booking.status === 'CONFIRMED' && (
                      <>
                        {linkSent ? (
                          <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 text-sm font-medium px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('linkSent')}
                          </span>
                        ) : (
                          <button
                            onClick={() => sendPaymentLink.mutate({ id: booking.id, method: 'ideal' })}
                            disabled={isSendingLink}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {isSendingLink ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Link2 className="w-4 h-4" />
                            )}
                            {t('sendPaymentLink')}
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus.mutate({ id: booking.id, status: 'cancelled' })}
                          className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                        >
                          {t('cancel')}
                        </button>
                      </>
                    )}

                    {/* PAYMENT_PENDING: cancel only */}
                    {booking.status === 'PAYMENT_PENDING' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: booking.id, status: 'cancelled' })}
                        className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                      >
                        {t('cancel')}
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
