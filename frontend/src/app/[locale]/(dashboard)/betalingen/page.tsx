'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CheckCircle2, AlertCircle, ArrowRight, Loader2, Euro,
  TrendingUp, CalendarDays, CreditCard, Banknote, XCircle,
  ShieldCheck, Zap, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sublabel, icon: Icon }: {
  label: string; value: string | number; sublabel?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: Payout['status'] }) {
  const map: Record<Payout['status'], { label: string; cls: string }> = {
    PENDING:    { label: 'In behandeling', cls: 'bg-amber-50 text-amber-700' },
    IN_TRANSIT: { label: 'Onderweg',       cls: 'bg-blue-50 text-blue-700' },
    PAID:       { label: 'Uitbetaald',     cls: 'bg-emerald-50 text-emerald-700' },
    FAILED:     { label: 'Mislukt',        cls: 'bg-red-50 text-red-700' },
    CANCELLED:  { label: 'Geannuleerd',   cls: 'bg-slate-50 text-slate-500' },
  };
  const c = map[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold', c.cls)}>
      {c.label}
    </span>
  );
}

function RevenueChart({ payouts }: { payouts: Payout[] }) {
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
            <span className="text-xs text-slate-400">
              {m.total > 0 ? `€${Math.round(m.total)}` : ''}
            </span>
            <div
              className="w-full bg-brand rounded-t-lg transition-all"
              style={{ height: `${Math.max(4, (m.total / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-slate-400 capitalize">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stripe logo SVG ──────────────────────────────────────────────────────────

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 25" className={className} aria-label="Stripe" fill="currentColor">
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.07zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.9z"/>
    </svg>
  );
}

// ─── Not-connected hero ────────────────────────────────────────────────────────

function ConnectHero({ onConnect, isPending }: { onConnect: () => void; isPending: boolean }) {
  return (
    <div className="space-y-5 max-w-2xl mx-auto py-4">

      {/* Main setup card */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">

        {/* Header stripe */}
        <div className="bg-gradient-to-r from-brand to-brand-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-extrabold leading-tight">
              Veilig en automatisch uitbetaald krijgen
            </h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Om jouw verdiensten 100% veilig op je rekening te storten, werken wij samen met Stripe,
            een van de grootste betalingsverwerkers ter wereld. Omdat we met geld werken, zijn we
            wettelijk verplicht om je identiteit en bankgegevens eenmalig te verifiëren. Je wordt
            nu even doorgestuurd naar de beveiligde omgeving van Stripe. Dit duurt ongeveer 3 minuten.
          </p>
        </div>

        <div className="px-8 py-7 space-y-6">

          {/* What to expect checklist */}
          <div className="space-y-3">
            {[
              { icon: Lock,        text: 'Je gegevens worden versleuteld verstuurd — DirectBnB ziet je bankgegevens nooit' },
              { icon: ShieldCheck, text: 'Eenmalige verificatie — daarna volledig automatisch uitbetaald' },
              { icon: Zap,         text: 'Geld op je rekening binnen 2 werkdagen na check-in' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onConnect}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-3 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-brand/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Doorsturen naar Stripe…
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Koppel bankrekening via Stripe
              </>
            )}
          </button>

          {/* Powered by Stripe */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Beveiligd door</span>
            <StripeLogo className="h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-5">Hoe werkt het na het koppelen?</h3>
        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Bankrekening eenmalig koppelen',
              desc: 'Vul je gegevens in via Stripe. Duurt ±3 minuten. Je doet dit maar één keer.',
            },
            {
              step: '2',
              title: 'Gasten betalen veilig bij het boeken',
              desc: 'Zodra een gast boekt, wordt de betaling vastgehouden totdat de gast incheckt.',
            },
            {
              step: '3',
              title: 'Automatische uitbetaling na check-in',
              desc: 'Elke nacht verwerken we uitbetalingen. Je geld staat binnen 2 werkdagen op je rekening.',
            },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-brand-light rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-extrabold text-brand">{s.step}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{s.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BetalingenPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const onboardingResult = searchParams.get('onboarding');

  const { data: accountData, isLoading: accountLoading, refetch: refetchAccount } = useQuery<AccountStatusData>({
    queryKey: ['payout-account-status'],
    queryFn: () => api.get('/payouts/account-status').then((r) => r.data.data),
    // Re-check after returning from Stripe
    refetchOnMount: true,
  });

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery<{ items: Payout[]; total: number }>({
    queryKey: ['payouts'],
    queryFn: () => api.get('/payouts').then((r) => r.data.data),
  });

  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const { mutate: startOnboarding, isPending: onboardingPending } = useMutation({
    mutationFn: () =>
      api.post('/payouts/onboarding', {
        returnUrl:  `${window.location.origin}/${locale}/betalingen?onboarding=success`,
        refreshUrl: `${window.location.origin}/${locale}/betalingen?onboarding=refresh`,
      }).then((r) => r.data.data),
    onSuccess: (data: { url: string }) => {
      setOnboardingError(null);
      window.location.href = data.url;
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Er is iets misgegaan. Probeer het opnieuw of neem contact op met support.';
      setOnboardingError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
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
        <p className="text-slate-400 mt-1">Ontvang betalingen direct op je bankrekening</p>
      </div>

      {/* Return banners from Stripe */}
      {onboardingResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Bankrekening succesvol gekoppeld! ✅</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Je ontvangt betalingen automatisch na elke check-in.
            </p>
          </div>
        </div>
      )}

      {onboardingResult === 'refresh' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Het koppelen is nog niet afgerond</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Je verificatie is verlopen. Klik op de knop om opnieuw te starten — je gegevens worden bewaard.
            </p>
          </div>
          <button
            onClick={() => startOnboarding()}
            disabled={onboardingPending}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            {onboardingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Opnieuw koppelen
          </button>
        </div>
      )}

      {/* Onboarding error */}
      {onboardingError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Koppelen mislukt</p>
            <p className="text-sm text-red-700 mt-0.5">{onboardingError}</p>
          </div>
          <button
            onClick={() => setOnboardingError(null)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {accountLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* NOT CONNECTED: show hero */}
      {!accountLoading && needsOnboarding && onboardingResult !== 'refresh' && (
        <ConnectHero onConnect={() => startOnboarding()} isPending={onboardingPending} />
      )}

      {/* ONBOARDING IN PROGRESS (no banner shown yet) */}
      {!accountLoading && needsRefresh && onboardingResult !== 'refresh' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 flex items-start gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 mb-1">Koppeling nog niet volledig afgerond</p>
            <p className="text-sm text-slate-500 mb-4">
              Je bent gestart maar hebt het proces nog niet voltooid. Klik op de knop om verder te gaan waar je gebleven was.
            </p>
            <button
              onClick={() => startOnboarding()}
              disabled={onboardingPending}
              className="flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {onboardingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Koppeling afronden
            </button>
          </div>
        </div>
      )}

      {/* VERIFIED: full dashboard */}
      {!accountLoading && isVerified && (
        <>
          {/* Status banner */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Betalingen actief ✅</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Je ontvangt betalingen automatisch na check-in
                </p>
              </div>
            </div>
            <button
              onClick={() => startOnboarding()}
              disabled={onboardingPending}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Bankrekening wijzigen
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Totaal dit jaar"
              value={`€${totalThisYear.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon={Euro}
            />
            <StatCard
              label="Deze maand"
              value={`€${thisMonth.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon={TrendingUp}
            />
            <StatCard
              label="In behandeling"
              value={`€${pendingAmount.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              sublabel="Wordt uitbetaald na check-in"
              icon={CalendarDays}
            />
            <StatCard
              label="Volgende uitbetaling"
              value={nextPayout?.arrivalDate
                ? format(new Date(nextPayout.arrivalDate), 'd MMM', { locale: nl })
                : '—'}
              sublabel={nextPayout ? 'Verwachte aankomstdatum' : 'Geen uitbetaling gepland'}
              icon={CreditCard}
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Inkomsten overzicht</h3>
            <RevenueChart payouts={payouts} />
          </div>

          {/* Payout history */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-900">Recente uitbetalingen</h3>
              <button className="text-sm font-bold text-brand hover:underline">Exporteer →</button>
            </div>

            {payoutsLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : !payouts.length ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Banknote className="w-7 h-7 text-brand" />
                </div>
                <p className="font-bold text-slate-700">Nog geen uitbetalingen</p>
                <p className="text-sm text-slate-400 mt-1">
                  Zodra er boekingen zijn uitbetaald, verschijnen ze hier.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-50">
                      {['Periode', 'Netto bedrag', 'Omschrijving', 'Aankomstdatum', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payouts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-slate-700 font-medium">
                          {format(new Date(p.createdAt), 'MMMM yyyy', { locale: nl })}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          €{Number(p.netAmount).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-slate-500">{p.description ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-500">
                          {p.arrivalDate
                            ? format(new Date(p.arrivalDate), 'd MMM yyyy', { locale: nl })
                            : '—'}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
