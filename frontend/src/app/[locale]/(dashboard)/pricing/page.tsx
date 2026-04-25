'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import {
  Check,
  Zap,
  Star,
  AlertCircle,
  Loader2,
  CreditCard,
} from 'lucide-react';

// ── Plan definitions ──────────────────────────────────────────────────────────

interface Plan {
  id: 'basic' | 'professional';
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basis',
    price: '€19',
    period: 'per maand',
    tagline: 'Alles wat je nodig hebt om te starten',
    features: [
      'Onbeperkte boekingen',
      'Automatische e-mails aan gasten',
      'Beschikbaarheidskalender',
      'Stripe betalingen',
      'Gastenregistratie',
      'DirectB&B subdomain',
    ],
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '€39',
    period: 'per maand',
    tagline: 'Voor serieuze B&B ondernemers',
    badge: 'Meest gekozen',
    features: [
      'Alles uit Basis',
      'Meerdere kamers & accommodaties',
      'Aangepaste e-mail templates',
      'Prioriteit klantenservice',
      'Geavanceerde statistieken',
      'Eigen domein koppeling',
    ],
    highlighted: true,
  },
];

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────

function PricingContent() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isPaywall   = searchParams.get('paywall') === '1';
  const isCancelled = searchParams.get('subscription') === 'cancelled';

  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: (plan: 'basic' | 'professional') =>
      api
        .post('/subscription/checkout', {
          plan,
          successUrl: `${window.location.origin}/${locale}/dashboard?subscription=success`,
          cancelUrl:  `${window.location.origin}/${locale}/pricing?subscription=cancelled`,
        })
        .then((r) => r.data.data as { checkoutUrl: string }),
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl;
    },
  });

  const handleSelectPlan = (plan: 'basic' | 'professional') => {
    setSelectedPlan(plan);
    checkoutMutation.mutate(plan);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-4">

      {/* Paywall banner */}
      {isPaywall && (
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">Abonnement vereist</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Je hebt een actief abonnement nodig om DirectB&amp;B te gebruiken.
                Kies hieronder een plan om door te gaan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              Je hebt het afrekenproces geannuleerd. Kies een plan wanneer je er klaar voor bent.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-bold mb-4">
          <Zap className="w-4 h-4" />
          14 dagen gratis proberen
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Kies jouw abonnement
        </h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Start vandaag nog — geen creditcard nodig voor de proefperiode.
          Maandelijks opzegbaar.
        </p>
        {user && (
          <p className="text-sm text-slate-400 mt-2">
            Ingelogd als <span className="font-semibold">{user.email}</span>
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {PLANS.map((plan) => {
          const isLoading = checkoutMutation.isPending && selectedPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col transition-shadow ${
                plan.highlighted
                  ? 'bg-brand text-white shadow-2xl shadow-brand/30'
                  : 'bg-white border border-slate-100 hover:shadow-md'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                    <Star className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-5">
                <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                  plan.highlighted ? 'text-white/70' : 'text-brand'
                }`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/70' : 'text-slate-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1.5 ${plan.highlighted ? 'text-white/80' : 'text-slate-500'}`}>
                  {plan.tagline}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.highlighted ? 'bg-white/20' : 'bg-brand/10'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.highlighted ? 'text-white' : 'text-brand'}`} />
                    </div>
                    <span className={plan.highlighted ? 'text-white/90' : 'text-slate-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={checkoutMutation.isPending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlighted
                    ? 'bg-white text-brand hover:bg-slate-50'
                    : 'bg-brand text-white hover:bg-brand/90'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Doorverwijzen…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Start {plan.name} — 14 dagen gratis
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust note */}
      <p className="text-xs text-slate-400 text-center mt-8 max-w-sm">
        Betaling wordt veilig verwerkt via Stripe. Je kan op elk moment
        opzeggen via je accountinstellingen.
      </p>

      {/* Error state */}
      {checkoutMutation.isError && (
        <div className="mt-6 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-3 text-sm max-w-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Er is een fout opgetreden. Probeer het opnieuw of neem contact op met support.
        </div>
      )}
    </div>
  );
}

// ── Page export — wraps inner component in Suspense (required by Next.js 14) ──

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
