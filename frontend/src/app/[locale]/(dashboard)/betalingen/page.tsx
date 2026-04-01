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

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Payout['status'] }) {
  const t = useTranslations('betalingen.history');

  const config: Record<Payout['status'], { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: { label: t('statusPending'), className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
    IN_TRANSIT: { label: t('statusInTransit'), className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <ArrowRight className="w-3 h-3" /> },
    PAID: { label: t('statusPaid'), className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
    FAILED: { label: t('statusFailed'), className: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
    CANCELLED: { label: t('statusCancelled'), className: 'bg-slate-50 text-slate-600 border-slate-200', icon: <XCircle className="w-3 h-3" /> },
  };

  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', c.className)}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── Account status icon ──────────────────────────────────────────────────────

function AccountStatusIcon({ status }: { status: AccountStatus }) {
  if (status === 'VERIFIED') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === 'REJECTED' || status === 'SUSPENDED') return <AlertCircle className="w-5 h-5 text-red-500" />;
  if (status === 'ONBOARDING') return <Clock className="w-5 h-5 text-amber-500" />;
  return <AlertCircle className="w-5 h-5 text-slate-400" />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BetalingenPage() {
  const t = useTranslations('betalingen');
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const onboardingResult = searchParams.get('onboarding');

  // Account status
  const { data: accountData, isLoading: accountLoading, refetch: refetchAccount } = useQuery<AccountStatusData>({
    queryKey: ['payout-account-status'],
    queryFn: () => api.get('/payouts/account-status').then((r) => r.data.data),
  });

  // Payout summary
  const { data: summary } = useQuery<PayoutSummary>({
    queryKey: ['payout-summary'],
    queryFn: () => api.get('/payouts/summary').then((r) => r.data.data),
  });

  // Payout history
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery<{ items: Payout[]; total: number }>({
    queryKey: ['payouts'],
    queryFn: () => api.get('/payouts').then((r) => r.data.data),
  });

  // Onboarding mutation
  const { mutate: startOnboarding, isPending: onboardingPending } = useMutation({
    mutationFn: () =>
      api.post('/payouts/onboarding', {
        returnUrl: `${window.location.origin}/${locale}/betalingen?onboarding=success`,
        refreshUrl: `${window.location.origin}/${locale}/betalingen?onboarding=refresh`,
      }).then((r) => r.data.data),
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
  });

  const accountStatus = accountData?.status ?? 'NONE';
  const isVerified = accountStatus === 'VERIFIED';
  const needsOnboarding = accountStatus === 'NONE' || accountStatus === 'PENDING';
  const needsRefresh = accountStatus === 'ONBOARDING';

  const statusLabels: Record<AccountStatus | 'NONE', string> = {
    NONE: t('accountCard.statusNone'),
    PENDING: t('accountCard.statusPending'),
    ONBOARDING: t('accountCard.statusOnboarding'),
    VERIFIED: t('accountCard.statusVerified'),
    REJECTED: t('accountCard.statusRejected'),
    SUSPENDED: t('accountCard.statusSuspended'),
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Onboarding result banner */}
      {onboardingResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {t('onboardingSuccess')}
        </div>
      )}
      {onboardingResult === 'refresh' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {t('onboardingRefresh')}
        </div>
      )}

      {/* Top row: Account card + summary cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Account card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t('accountCard.title')}</p>
                {accountLoading ? (
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mt-1" />
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AccountStatusIcon status={accountStatus} />
                    <span className="text-sm text-slate-500">{statusLabels[accountStatus]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            {!accountLoading && (
              <div className="shrink-0">
                {(needsOnboarding || needsRefresh) && (
                  <button
                    onClick={() => startOnboarding()}
                    disabled={onboardingPending}
                    className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {onboardingPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : needsRefresh ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {needsRefresh ? t('accountCard.refreshButton') : t('accountCard.connectButton')}
                  </button>
                )}
                {isVerified && (
                  <button
                    onClick={() => refetchAccount()}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Vernieuwen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Capability checklist — show when onboarding or verified */}
          {accountData && accountStatus !== 'NONE' && accountStatus !== 'PENDING' && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
              {[
                { label: t('accountCard.detailsSubmitted'), value: accountData.detailsSubmitted },
                { label: t('accountCard.chargesEnabled'), value: accountData.chargesEnabled },
                { label: t('accountCard.payoutsEnabled'), value: accountData.payoutsEnabled },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {value
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  }
                  <span className={cn('text-xs', value ? 'text-slate-700' : 'text-slate-400')}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-slate-500 font-medium">{t('summary.totalPaidOut')}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              €{(summary?.totalPaidOut ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">{t('summary.pending')}</p>
              <p className="text-lg font-bold text-slate-900">{summary?.pendingCount ?? 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">{t('summary.inTransit')}</p>
              <p className="text-lg font-bold text-slate-900">{summary?.inTransitCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout history table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">{t('history.title')}</h2>
        </div>

        {payoutsLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !payoutsData?.items.length ? (
          <div className="py-16 text-center">
            <Banknote className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">{t('history.empty')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('history.emptyDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('history.colDate')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('history.colDescription')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">{t('history.colAmount')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">{t('history.colFee')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">{t('history.colNet')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('history.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payoutsData.items.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(payout.createdAt).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs truncate">
                      {payout.description ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 tabular-nums">
                      €{Number(payout.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 tabular-nums text-xs">
                      −€{Number(payout.platformFee).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      €{Number(payout.netAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
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
