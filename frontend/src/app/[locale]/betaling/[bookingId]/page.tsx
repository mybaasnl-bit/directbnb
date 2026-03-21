'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { CreditCard, Landmark, Loader2, CheckCircle2, AlertCircle, Calendar, Users, Euro } from 'lucide-react';

type PaymentMethod = 'ideal' | 'banktransfer' | 'creditcard';

interface BookingDetails {
  id: string;
  status: string;
  paymentStatus: string | null;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalPrice: number;
  propertyName: string;
  roomName: string;
  coverPhoto: string | null;
  guestFirstName: string;
}

function PaymentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const returnStatus = searchParams.get('status');
  const t = useTranslations('betaling');
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ideal');
  const [paid, setPaid] = useState(false);

  const METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'ideal', label: t('methodIdeal'), icon: <Landmark className="w-5 h-5" /> },
    { id: 'banktransfer', label: t('methodTransfer'), icon: <Euro className="w-5 h-5" /> },
    { id: 'creditcard', label: t('methodCard'), icon: <CreditCard className="w-5 h-5" /> },
  ];

  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: ['payment-booking', bookingId],
    queryFn: () => api.get(`/mollie/booking/${bookingId}`).then(r => r.data?.data ?? r.data),
    enabled: !!bookingId,
    retry: 1,
  });

  // If returning from Mollie, check the status
  useEffect(() => {
    if (returnStatus === 'return' && booking) {
      if (booking.paymentStatus === 'PAID' || booking.status === 'PAID') {
        setPaid(true);
      }
    }
  }, [returnStatus, booking]);

  const payMutation = useMutation({
    mutationFn: () =>
      api.post('/mollie/public/full-pay', { bookingId, method: selectedMethod })
        .then(r => r.data?.data ?? r.data),
    onSuccess: (data: any) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('notFound')}</h2>
          <p className="text-slate-500 text-sm">{t('notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = paid || booking.paymentStatus === 'PAID' || booking.status === 'PAID';
  const nights = Math.round(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (isAlreadyPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('paidTitle')}</h2>
          <p className="text-slate-500 text-sm mb-6">
            {t('paidDesc', { name: booking.guestFirstName, property: booking.propertyName })}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>{t('checkIn')}</span>
              <span className="font-medium">{format(new Date(booking.checkIn), 'd MMM yyyy', { locale: dateLocale })}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('checkOut')}</span>
              <span className="font-medium">{format(new Date(booking.checkOut), 'd MMM yyyy', { locale: dateLocale })}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!['CONFIRMED', 'PAYMENT_PENDING'].includes(booking.status)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('notAvailable')}</h2>
          <p className="text-slate-500 text-sm">{t('notAvailableDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">DirectBnB</h1>
          <p className="text-slate-500 text-sm mt-1">{t('pageTitle')}</p>
        </div>

        {/* Property card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {booking.coverPhoto && (
            <img
              src={booking.coverPhoto}
              alt={booking.propertyName}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-5">
            <h2 className="font-bold text-slate-900 text-lg">{booking.propertyName}</h2>
            <p className="text-slate-500 text-sm">{booking.roomName}</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('checkIn')}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {format(new Date(booking.checkIn), 'd MMM yyyy', { locale: dateLocale })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('checkOut')}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: dateLocale })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {t('guests')}
                </span>
                <span className="text-sm font-medium text-slate-900">{booking.numGuests}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">
                  {t('nights', { count: nights })}
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">
                  €{booking.totalPrice.toFixed(2)}
                </div>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 font-medium">
                {t('toBePaid')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">{t('chooseMethod')}</h3>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedMethod === m.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={selectedMethod === m.id}
                  onChange={() => setSelectedMethod(m.id)}
                  className="sr-only"
                />
                <span className={selectedMethod === m.id ? 'text-indigo-600' : 'text-slate-500'}>
                  {m.icon}
                </span>
                <span className={`font-medium text-sm ${selectedMethod === m.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {m.label}
                </span>
                {selectedMethod === m.id && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto" />
                )}
              </label>
            ))}
          </div>

          {payMutation.isError && (
            <p className="text-red-600 text-sm mt-3 bg-red-50 rounded-lg px-3 py-2">
              {t('errorMessage')}
            </p>
          )}

          <button
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
            className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {payMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('redirecting')}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {t('payButton', { amount: booking.totalPrice.toFixed(2) })}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          {t('subtitle')}
        </p>
      </div>
    </div>
  );
}

export default function BetalingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
