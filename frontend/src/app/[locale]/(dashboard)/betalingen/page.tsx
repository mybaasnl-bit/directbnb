'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Banknote, CheckCircle2, Clock, AlertCircle, ArrowRight,
  RefreshCw, TrendingUp, XCircle, Loader2, Euro, CalendarDays, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { nl } from 'date-fns/locale';

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

function StatCard({ label, value, sublabel, icon: Icon, trend }: {
  label: string; value: string | number; sublabel?: string; icon: React.ElementType; trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 mb-1">
            <TrendingUp className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: Payout['status'] }) {
  const config: Record<Payout['status'], { label: string; className: string }> = {
    PENDING:    { label: 'In behandeling', className: 'bg-amber-50 text-amber-700' },
    IN_TRANSIT: { label: 'Onderweg',       className: 'bg-blue-50 text-blue-700' },
    PAID:       { label: 'Voltooid',       className: 'bg-emerald-100 text-emerald-700' },
    FAILED:     { label: 'Mislukt',        className: 'bg-red-50 text-red-700' },
    CANCELLED:  { label: 'Geannuleerd',   className: 'bg-slate-50 text-slate-500' },
  };
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold', c.className)}>
      {c.label}
    </span>
  );
}

// Simple SVG bar/line chart
function RevenueChart({ payouts }: { payouts: Payout[] }) {
  // Build 6 months of data
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const key = format(d, 'yyyy-MM');
    const label = format(d, 'MMM', { locale: nl });
    const total = payouts
      .filter(p => p.status === 'PAID' && p.createdAt.startsWith(key))
      .reduce((s, p) => s + Number(p.netAmount), 0);
    return { label, total };
  });

  const max = Math.max(...months.map(m => m.total), 1);

  return (
    <div>
      <div className="flex items-end justify-between gap-2 h-32">
        {months.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full bg-brand rounded-t-lg transition-all"
              style={{ height: `${Math.max(4, (m.total / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      {/* X labels */}
      <div className="flex items-center justify-between mt-2">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-slate-400 capitalize">{m.label}</span>
          </div>
        ))}
      </div>
      {/* Y guide labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-300">€0k</span>
        <span className="text-xs text-slate-300">€{Math.round(max / 1000)}k</span>
      </div>
    </div>
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

  const accountStatus   = accountData?.status ?? 'NONE';
  const isVerified      = accountStatus === 'VERIFIED';
  const needsOnboarding = accountStatus === 'NONE' || accountStatus === 'PENDING';
  const needsRefresh    = accountStatus === 'ONBOARDING';

  const payouts = payoutsData?.items ?? [];
  const totalThisYear = payouts
    .filter(p => p.status === 'PAID' && p.createdAt.startsWith(new Date().getFullYear().toString()))
    .reduce((s, p) => s + Number(p.netAmount), 0);
  const thisMonth = payouts
    .filter(p => p.status === 'PAID' && p.createdAt.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((s, p) => s + Number(p.netAmount), 0);
  const pendingAmount = payouts
    .filter(p => p.status === 'PENDING' || p.status === 'IN_TRANSIT')
    .reduce((s, p) => s + Number(p.netAmount), 0);
  const nextPayout = payouts.find(p => p.status === 'IN_TRANSIT' && p.arrivalDate);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Uitbetalingen</h1>
        <p className="text-slate-400 mt-1">Overzicht van je inkomsten</p>
      </div>

      {/* Onboarding alerts */}
      {onboardingResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-5 py-4 text-sm text-emerald-800 font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {t('onboardingSuccess')}
        </div>
      )}
      {onboardingResult === 'refresh' && (
        <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-5 py-4 text-sm text-amber-800 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" /> {t('onboardingRefresh')}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Totaal Dit Jaar" value={`€${totalThisYear.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}`} sublabel="" icon={Euro} trend="+24%" />
        <StatCard label="Deze Maand"      value={`€${thisMonth.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}`}      icon={TrendingUp} trend="+12%" />
        <StatCard label="In behandeling"  value={`€${pendingAmount.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}`} icon={CalendarDays} />
        <StatCard label="Volgende Uitbetaling" value={nextPayout?.arrivalDate ? format(new Date(nextPayout.arrivalDate), 'd MMM', { locale: nl }) : '—'} icon={CreditCard} />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-6">Inkomsten Overzicht</h3>
        <RevenueChart payouts={payouts} />
      </div>

      {/* Account / Bankrekening */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900">Bankrekening</p>
            {accountLoading ? (
              <div className="h-4 w-40 bg-slate-100 rounded-lg animate-pulse mt-1.5" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                {accountStatus === 'VERIFIED'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <Clock className="w-4 h-4 text-amber-500" />
                }
                <span className="text-sm text-slate-500">
                  {accountData?.providerAccountId ?? (accountStatus === 'VERIFIED' ? 'Verbonden' : 'Nog niet ingesteld')}
                </span>
              </div>
            )}
          </div>
          {!accountLoading && (needsOnboarding || needsRefresh) && (
            <button
              onClick={() => startOnboarding()}
              disabled={onboardingPending}
              className="flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              {onboardingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {needsRefresh ? t('accountCard.refreshButton') : t('accountCard.connectButton')}
            </button>
          )}
          {isVerified && (
            <button
              onClick={() => refetchAccount()}
              className="text-sm font-bold text-slate-500 hover:text-brand bg-slate-100 hover:bg-brand-light px-4 py-2 rounded-xl transition-colors"
            >
              Wijzigen
            </button>
          )}
        </div>

        {accountData && accountStatus !== 'NONE' && accountStatus !== 'PENDING' && (
          <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-3 gap-3">
            {[
              { label: 'Gegevens ingediend', value: accountData.detailsSubmitted },
              { label: 'Betalingen actief',  value: accountData.chargesEnabled },
              { label: 'Uitbetalingen actief', value: accountData.payoutsEnabled },
            ].map(({ label, value }) => (
              <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${value ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                {value
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                }
                <span className={cn('text-xs font-semibold', value ? 'text-emerald-700' : 'text-slate-400')}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uitbetalingen tabel */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900">Recente Uitbetalingen</h3>
          <button className="text-sm font-bold text-brand hover:underline">Exporteer →</button>
        </div>

        {payoutsLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : !payouts.length ? (
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
                <tr className="border-b border-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Periode</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Bedrag</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Boekingen</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Datum</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {format(new Date(payout.createdAt), 'MMMM yyyy', { locale: nl })}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">€{Number(payout.netAmount).toFixed(2)}</td>
                    <td className="px-5 py-4 text-slate-500">{payout.description ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {format(new Date(payout.createdAt), 'd MMM yyyy', { locale: nl })}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={payout.status} /></td>
                    <td className="px-5 py-4">
                      <button className="text-xs font-bold text-brand hover:underline">Details</button>
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
