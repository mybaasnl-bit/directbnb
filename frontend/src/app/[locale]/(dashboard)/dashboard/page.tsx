'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CalendarCheck,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Check,
  Sparkles,
  CalendarDays,
  BedDouble,
  Users,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-8">
      <div className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
    </div>
  );
}

// ── Onboarding banner ──────────────────────────────────────────────────────
function OnboardingBanner({ locale }: { locale: string }) {
  const steps = [
    { label: 'Account aangemaakt', done: true },
    { label: 'Uw accommodatie toevoegen', done: false },
    { label: 'Eerste kamer instellen', done: false },
    { label: 'Klaar voor boekingen!', done: false },
  ];

  return (
    <div className="bg-white border-2 border-brand-light rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-brand" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Welkom bij DirectBnB! 🎉</h2>
          <p className="text-slate-500 mt-1">Volg deze stappen om uw B&B klaar te zetten voor gasten.</p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  step.done
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-slate-50 text-slate-500 border border-slate-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-emerald-500' : 'bg-slate-200'
                }`}>
                  {step.done
                    ? <Check className="w-3 h-3 text-white" />
                    : <span className="text-[10px] font-bold text-slate-500">{i + 1}</span>
                  }
                </span>
                <span className="leading-tight">{step.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href={`/${locale}/properties/new`}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Voeg uw eerste accommodatie toe
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  highlight = false,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
  sublabel?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-6 flex items-start gap-4 ${
      highlight ? 'border-brand-light ring-2 ring-brand/20' : 'border-slate-100'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        highlight ? 'bg-brand text-white' : 'bg-brand-light text-brand'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${highlight ? 'text-brand' : 'text-slate-900'}`}>
          {value}
        </p>
        {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}

// ── Booking card (aankomend) ───────────────────────────────────────────────
function UpcomingCard({ booking }: { booking: any }) {
  const checkIn  = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights   = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
      {/* Datum blok */}
      <div className="w-14 h-14 bg-brand-light rounded-xl flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-brand uppercase">
          {format(checkIn, 'MMM', { locale: nl })}
        </span>
        <span className="text-xl font-bold text-brand leading-none">
          {format(checkIn, 'd')}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">
          {booking.guest.firstName} {booking.guest.lastName}
        </p>
        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
          <BedDouble className="w-3.5 h-3.5" />
          {booking.room?.property?.name ?? ''} — {booking.room?.name ?? ''}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {format(checkIn, 'd MMM', { locale: nl })} → {format(checkOut, 'd MMM', { locale: nl })} · {nights} nacht{nights !== 1 ? 'en' : ''}
        </p>
      </div>

      {/* Prijs */}
      <div className="text-right shrink-0">
        <p className="font-bold text-slate-900">€{Number(booking.totalPrice).toFixed(0)}</p>
        <p className="text-xs text-slate-400">{booking.numGuests} gast{booking.numGuests !== 1 ? 'en' : ''}</p>
      </div>
    </div>
  );
}

// ── Pending request card ───────────────────────────────────────────────────
function PendingCard({ booking, onConfirm, onReject, isPending }: {
  booking: any;
  onConfirm: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const checkIn  = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights   = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);

  return (
    <div className="bg-brand-light border-2 border-brand/20 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
            {booking.guest.firstName[0]}{booking.guest.lastName[0]}
          </div>
          <div>
            <p className="font-bold text-slate-900">
              {booking.guest.firstName} {booking.guest.lastName}
            </p>
            <p className="text-sm text-slate-500">{booking.room?.property?.name} — {booking.room?.name}</p>
          </div>
        </div>
        <p className="text-xl font-bold text-slate-900 shrink-0">
          €{Number(booking.totalPrice).toFixed(0)}
        </p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl px-3 py-2.5">
          <p className="text-xs text-slate-400 font-medium">Inchecken</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {format(checkIn, 'd MMM yyyy', { locale: nl })}
          </p>
        </div>
        <div className="bg-white rounded-xl px-3 py-2.5">
          <p className="text-xs text-slate-400 font-medium">Uitchecken</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {format(checkOut, 'd MMM yyyy', { locale: nl })}
          </p>
        </div>
        <div className="bg-white rounded-xl px-3 py-2.5">
          <p className="text-xs text-slate-400 font-medium">Duur</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {nights} nacht{nights !== 1 ? 'en' : ''}
          </p>
        </div>
      </div>

      {/* Knoppen */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
        >
          <Check className="w-4 h-4" />
          ✅ Accepteren
        </button>
        <button
          onClick={onReject}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-red-200 hover:text-red-600 disabled:opacity-60 text-slate-600 font-bold py-3.5 rounded-xl text-sm transition-colors"
        >
          ✗ Weigeren
        </button>
      </div>

      {booking.guestMessage && (
        <div className="mt-3 bg-white rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400 font-medium mb-1">Bericht van gast</p>
          <p className="text-sm text-slate-600 italic">"{booking.guestMessage}"</p>
        </div>
      )}
    </div>
  );
}

// ── Hoofdpagina ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  });

  const { data: pendingBookings = [], refetch: refetchPending } = useQuery<any[]>({
    queryKey: ['pending-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { status: 'PENDING' } }).then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
  });

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/bookings/${id}/status`, { status });
    refetch();
    refetchPending();
  };

  if (isLoading) return <Skeleton />;

  const stats = data?.stats;
  const showOnboarding = !isLoading && (stats?.totalProperties ?? 0) === 0;
  const upcoming: any[] = data?.upcomingBookings ?? [];

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Onboarding */}
      {showOnboarding && <OnboardingBanner locale={locale} />}

      {/* Actie vereist banner */}
      {pendingBookings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-slate-900">
              Actie vereist — {pendingBookings.length} openstaande aanvra{pendingBookings.length === 1 ? 'ag' : 'gen'}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingBookings.map((b: any) => (
              <PendingCard
                key={b.id}
                booking={b}
                onConfirm={() => handleStatus(b.id, 'CONFIRMED')}
                onReject={() => handleStatus(b.id, 'REJECTED')}
                isPending={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Statistieken — 3 kaarten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Boekingen deze maand"
          value={stats?.confirmedBookings ?? 0}
          icon={CalendarCheck}
          sublabel="bevestigd"
        />
        <StatCard
          label="Opbrengst deze maand"
          value={`€${(stats?.revenueThisMonth ?? 0).toFixed(0)}`}
          icon={TrendingUp}
          sublabel="excl. transactiekosten"
        />
        <StatCard
          label="Gasten dit jaar"
          value={stats?.totalGuests ?? 0}
          icon={Users}
          sublabel="unieke gasten"
        />
      </div>

      {/* Aankomende boekingen */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand" />
              <h2 className="text-base font-bold text-slate-900">Aankomende inchecks</h2>
            </div>
            <Link
              href={`/${locale}/bookings`}
              className="text-sm font-semibold text-brand hover:text-brand-600 flex items-center gap-1"
            >
              Alles bekijken <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {upcoming.slice(0, 5).map((b: any) => (
              <UpcomingCard key={b.id} booking={b} />
            ))}
          </div>
        </div>
      )}

      {/* Lege staat als er helemaal niets is */}
      {!showOnboarding && pendingBookings.length === 0 && upcoming.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-brand" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Geen aankomende boekingen</h3>
          <p className="text-slate-500 mt-2 text-sm">
            Zodra gasten een boeking maken, ziet u dat hier direct.
          </p>
        </div>
      )}
    </div>
  );
}
