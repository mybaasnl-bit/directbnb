'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import axios from 'axios';
import { Check, Loader2, Clock, XCircle, ShieldCheck } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type PaymentStatus = 'loading' | 'paid' | 'pending' | 'open' | 'failed' | 'canceled' | 'expired' | 'unknown';

export default function PaymentReturnPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const lang = (locale === 'en' ? 'en' : 'nl') as 'nl' | 'en';

  const bookingId = searchParams.get('bookingId');
  const paymentId = searchParams.get('paymentId');

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setStatus('unknown');
      return;
    }

    // If no paymentId in URL, we need to look it up via the booking
    // For now poll the booking's Mollie payment status via bookingId query
    const checkStatus = async () => {
      try {
        // Try paymentId from URL first, otherwise fall back to bookingId lookup
        const endpoint = paymentId
          ? `${API}/mollie/payment/${paymentId}/status`
          : `${API}/mollie/payment/by-booking/${bookingId}/status`;

        const res = await axios.get(endpoint);
        const data = res.data?.data ?? res.data;
        const mollieStatus: string = data.status ?? 'unknown';

        if (mollieStatus === 'paid' || data.depositPaid) {
          setStatus('paid');
        } else if (mollieStatus === 'pending' || mollieStatus === 'open') {
          // Bank transfer stays in open/pending — treat as soft success
          setStatus(mollieStatus as PaymentStatus);
        } else if (mollieStatus === 'canceled' || mollieStatus === 'expired') {
          setStatus(mollieStatus as PaymentStatus);
        } else if (mollieStatus === 'failed') {
          setStatus('failed');
        } else {
          setStatus('unknown');
        }
      } catch {
        // If status check fails (e.g. no paymentId), show generic booking success
        setStatus('pending');
      }
    };

    checkStatus();

    // Poll up to 5 times with 2s interval for iDEAL (usually instant)
    if (pollCount < 5) {
      const timer = setTimeout(() => {
        setPollCount(c => c + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [bookingId, paymentId, pollCount]);

  const t = {
    nl: {
      loading: 'Betaling controleren...',
      paidTitle: 'Betaling geslaagd!',
      paidMsg: 'Je aanbetaling is ontvangen. Je boeking is bevestigd en je ontvangt een bevestigingsmail.',
      pendingTitle: 'Boeking ontvangen',
      pendingMsg: 'Je boekingsaanvraag is ontvangen. De betaling wordt verwerkt of de eigenaar neemt spoedig contact met je op.',
      openTitle: 'Overschrijving verwacht',
      openMsg: 'Voer de bankoverschrijving uit zoals aangegeven. Zodra het bedrag is ontvangen, wordt je boeking bevestigd.',
      failedTitle: 'Betaling mislukt',
      failedMsg: 'De betaling is niet gelukt. Ga terug en probeer opnieuw of kies een andere betaalmethode.',
      canceledTitle: 'Betaling geannuleerd',
      canceledMsg: 'Je hebt de betaling afgebroken. Je boeking is nog aangemeld bij de eigenaar.',
      expiredTitle: 'Betaallink verlopen',
      expiredMsg: 'De betaallink is verlopen. Neem contact op met de eigenaar om een nieuwe link te ontvangen.',
      unknownTitle: 'Boeking ingediend',
      unknownMsg: 'Je boeking is ontvangen. Je ontvangt binnenkort een bevestiging per e-mail.',
      commission: '0% commissie — directe boeking',
      backToHome: 'Terug naar home',
    },
    en: {
      loading: 'Checking payment...',
      paidTitle: 'Payment successful!',
      paidMsg: 'Your deposit has been received. Your booking is confirmed and you will receive a confirmation email.',
      pendingTitle: 'Booking received',
      pendingMsg: 'Your booking request has been received. The payment is being processed or the host will contact you shortly.',
      openTitle: 'Bank transfer expected',
      openMsg: 'Please complete the bank transfer as instructed. Once the amount is received, your booking will be confirmed.',
      failedTitle: 'Payment failed',
      failedMsg: 'The payment was unsuccessful. Please go back and try again or choose a different payment method.',
      canceledTitle: 'Payment canceled',
      canceledMsg: 'You canceled the payment. Your booking request has still been submitted to the host.',
      expiredTitle: 'Payment link expired',
      expiredMsg: 'The payment link has expired. Please contact the host to receive a new link.',
      unknownTitle: 'Booking submitted',
      unknownMsg: 'Your booking has been received. You will receive a confirmation email shortly.',
      commission: '0% commission — direct booking',
      backToHome: 'Back to home',
    },
  }[lang];

  const statusConfig: Record<PaymentStatus, { icon: React.ReactNode; title: string; msg: string; color: string }> = {
    loading: {
      icon: <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />,
      title: t.loading,
      msg: '',
      color: 'bg-indigo-100',
    },
    paid: {
      icon: <Check className="w-10 h-10 text-emerald-600" />,
      title: t.paidTitle,
      msg: t.paidMsg,
      color: 'bg-emerald-100',
    },
    pending: {
      icon: <Clock className="w-10 h-10 text-amber-500" />,
      title: t.pendingTitle,
      msg: t.pendingMsg,
      color: 'bg-amber-100',
    },
    open: {
      icon: <Clock className="w-10 h-10 text-blue-500" />,
      title: t.openTitle,
      msg: t.openMsg,
      color: 'bg-blue-100',
    },
    failed: {
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      title: t.failedTitle,
      msg: t.failedMsg,
      color: 'bg-red-100',
    },
    canceled: {
      icon: <XCircle className="w-10 h-10 text-slate-400" />,
      title: t.canceledTitle,
      msg: t.canceledMsg,
      color: 'bg-slate-100',
    },
    expired: {
      icon: <XCircle className="w-10 h-10 text-slate-400" />,
      title: t.expiredTitle,
      msg: t.expiredMsg,
      color: 'bg-slate-100',
    },
    unknown: {
      icon: <Check className="w-10 h-10 text-emerald-600" />,
      title: t.unknownTitle,
      msg: t.unknownMsg,
      color: 'bg-emerald-100',
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <span className="text-lg font-bold text-slate-900">
            Direct<span className="text-indigo-600">BnB</span>
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className={`w-20 h-20 ${cfg.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {cfg.icon}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">{cfg.title}</h1>

        {cfg.msg && (
          <p className="text-slate-600 leading-relaxed mb-8">{cfg.msg}</p>
        )}

        {status !== 'loading' && (
          <>
            <p className="text-center text-sm text-slate-400 flex items-center justify-center gap-1.5 mb-6">
              <ShieldCheck className="w-4 h-4" />
              {t.commission}
            </p>

            {(status === 'failed' || status === 'canceled' || status === 'expired') && (
              <button
                onClick={() => window.history.back()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {t.backToHome}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
