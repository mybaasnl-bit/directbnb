'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountStatus = 'NONE' | 'PENDING' | 'ONBOARDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

interface AccountStatusData {
  status: AccountStatus;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  providerAccountId?: string;
}

interface Payout {
  id: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'PAID' | 'FAILED' | 'CANCELLED';
  description?: string;
  arrivalDate?: string;
  createdAt: string;
}

interface PayoutSummary {
  totalPaidOut: number;
  pendingCount: number;
  inTransitCount: number;
}

function StatusBadge({ status }: { status: Payout['status'] }) {
  const t = useTranslations('betalingen.history');
  const config: Record<Payout['status'], { label: string; className: string; icon: React.ReactNode }> = {
    PENDING:    { label: t('statusPending'),   className: 'bg-amber-50 text-amber-700',   icon: <Clock className="w-3 h-3" /> },
    IN_TRANSIT: { label: t('statusInTransit'), className: 'bg-blue-50 text-blue-700',     icon: <ArrowRight className="w-3 h-3" /> },
    PAID:       { label: t('statusPaid'),      className: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    FAILED:     { label: t('statusFailed'),    className: 'bg-red-50 text-red-700',       icon: <XCircle className="w-3 h-3" /> },
    CANCELLED:  { label: t('statusCancelled'), className: 'bg-slate-50 text-slate-500',   icon: <XCircle className="w-3 h-3" /> },
  };
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold', c.className)}>
      {c.icon}{c.label}
    </span>
  );
}

export default function BetalingenPage() {
  const t = useTranslations('betalingen');
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const onboardingResult = searchParams.get('onboarding');

  const { data: accountData, isLoading: accountLoading, refetch: refetchAccount } = useQuery<AccountStatusData>({
    queryKey: ['payout-account-status'],
    queryFn: () => api.get('/payouts/account-status').then((r) => r.data.data),
  });

  const { data: summary } = useQuery<PayoutSummary>({
    queryKey: ['payout-summary'],
    queryFn: () => api.get('/payouts/summary').then((r) => r.data.data),
  });

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery<{ items: Payout[]; total: number }>({
    queryKey: ['payouts'],
    queryFn: () => api.get('/payouts').then((r) => r.data.data),
  });

  const { mutate: startOnboarding, isPending: onboardingPending } = useMutation({
    mutationFn: () =>
      api.post('/payouts/onboarding', {
        returnUrl:  `${window.location.origin}/${locale}/betalingen?onboarding=success`,
        refreshUrl: `${window.location.origin}/${locale}/betalingen?onboarding=refresh`,
      }).then((r) => r.data.data),
    onSuccess: (data: { url: string }) => { window.location.href = data.url; },
  });

  const accountStatus  = accountData?.status ?? 'NONE';
  const isVerified     = accountStatus === 'VERIFIED';
  const needsOnboarding = accountStatus === 'NONE' || accountStatus === 'PENDING';
  const needsRefresh   = accountStatus === 'ONBOARDING';

  const statusLabels: Record<AccountStatus | 'NONE', string> = {
    NONE:      t('accountCard.statusNone'),
    PENDING:   t('accountCard.statusPending'),
    ONBOARDING: t('accountCard.statusOnboarding'),
    VERIFIED:  t('accountCard.statusVerified'),
    REJECTED:  t('accountCard.statusRejected'),
    SUSPENDED: t('accountCard.statusSuspended'),
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
          <Banknote className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-400 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Onboarding resultaat */}
      {onboardingResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-5 py-4 text-sm text-emerald-800 font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {t('onboardingSuccess')}
        </div>
      )}
      {onboardingResult === 'refresh' && (
        <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-5 py-4 text-sm text-amber-800 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {t('onboardingRefresh')}
        </div>
      )}

      {/* Stats + Account */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Account kaart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
                <Banknote className="w-6 h-6 text-brand" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{t('accountCard.title')}</p>
                {accountLoading ? (
                  <div className="h-4 w-28 bg-slate-100 rounded-lg animate-pulse mt-1.5" />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {accountStatus === 'VERIFIED'
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : accountStatus === 'REJECTED' || accountStatus === 'SUSPENDED'
                        ? <AlertCircle className="w-4 h-4 text-red-500" />
                        : <Clock className="w-4 h-4 text-amber-500" />
                    }
                    <span className="text-sm text-slate-500 font-medium">{statusLabels[accountStatus]}</span>
                  </div>
                )}
              </div>
            </div>

            {!accountLoading && (
              <div className="shrink-0">
                {(needsOnboarding || needsRefresh) && (
                  <button
                    onClick={() => startOnboarding()}
                    disabled={onboardingPending}
                    className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    {onboardingPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : needsRefresh
                        ? <RefreshCw className="w-4 h-4" />
                        : <ArrowRight className="w-4 h-4" />
                    }
                    {needsRefresh ? t('accountCard.refreshButton') : t('accountCard.connectButton')}
                  </button>
                )}
                {isVerified && (
                  <button
                    onClick={() => refetchAccount()}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-brand text-sm px-3 py-2 rounded-xl hover:bg-brand-light transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Vernieuwen
                  </button>
                )}
              </div>
            )}
          </div>

          {accountData && accountStatus !== 'NONE' && accountStatus !== 'PENDING' && (
            <div className="mt-5 pt-5 border-t border-slate-50 grid grid-cols-3 gap-3">
              {[
                { label: t('accountCard.detailsSubmitted'), value: accountData.detailsSubmitted },
                { label: t('accountCard.chargesEnabled'),   value: accountData.chargesEnabled },
                { label: t('accountCard.payoutsEnabled'),   value: accountData.payoutsEnabled },
              ].map(({ label, value }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${value ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  {value
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                  }
                  <span className={cn('text-xs font-semibold', value ? 'text-emerald-700' : 'text-slate-400')}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="space-y-4">
          <div className="bg-brand rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-white/70" />
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wide">{t('summary.totalPaidOut')}</p>
            </div>
            <p className="text-3xl font-bold text-white">
              €{(summary?.totalPaidOut ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-light rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold mb-1">{t('summary.pending')}</p>
              <p className="text-2xl font-bold text-slate-900">{summary?.pendingCount ?? 0}</p>
            </div>
            <div className="bg-brand-light rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold mb-1">{t('summary.inTransit')}</p>
              <p className="text-2xl font-bold text-slate-900">{summary?.inTransitCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uitbetalingen tabel */}
      <div className="bg-white rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="font-bold text-slate-900">{t('history.title')}</h2>
        </div>

        {payoutsLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-brand-light/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !payoutsData?.items.length ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-7 h-7 text-brand" />
            </div>
            <p className="font-bold text-slate-700">{t('history.empty')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('history.emptyDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-light/40">
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('history.colDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t('history.colDescription')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">{t('history.colAmount')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">{t('history.colFee')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">{t('history.colNet')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{t('history.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payoutsData.items.map((payout) => (
                  <tr key={payout.id} className="hover:bg-brand-light/20 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-sm">
                      {new Date(payout.createdAt).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate text-sm">
                      {payout.description ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 tabular-nums text-sm">
                      €{Number(payout.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 tabular-nums text-xs">
                      −€{Number(payout.platformFee).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                      €{Number(payout.netAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payout.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
