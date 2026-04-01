'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CalendarCheck,
  TrendingUp,
  Users,
  AlertCircle,
  Plus,
  ArrowRight,
  Check,
  X,
  BedDouble,
  CalendarDays,
  Sparkles,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// ── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-brand-light/60 rounded-3xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-white rounded-3xl animate-pulse" />
        <div className="h-80 bg-brand-light/60 rounded-3xl animate-pulse" />
      </div>
    </div>
  );
}

// ── Onboarding banner ────────────────────────────────────────────────────────
function OnboardingBanner({ locale }: { locale: string }) {
  const steps = [
    { label: 'Account aangemaakt', done: true },
    { label: 'Accommodatie toevoegen', done: false },
    { label: 'Eerste kamer instellen', done: false },
    { label: 'Klaar voor boekingen!', done: false },
  ];

  return (
    <div className="bg-brand rounded-3xl p-7 text-white">
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Welkom bij DirectBnB! 🎉</h2>
          <p className="text-white/70 mt-1 text-sm">Volg deze stappen om uw B&B klaar te zetten voor gasten.</p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  step.done
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  step.done ? 'bg-white text-brand' : 'bg-white/20 text-white/60'
                }`}>
                  {step.done ? '✓' : i + 1}
                </span>
                <span className="leading-tight text-xs">{step.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href={`/${locale}/properties/new`}
              className="inline-flex items-center gap-2 bg-white text-brand text-sm font-bold px-5 py-3 rounded-xl hover:bg-white/90 transition-colors"
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

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
  sublabel?: string;
}) {
  return (
    <div className={`rounded-3xl p-6 flex flex-col gap-4 ${accent ? 'bg-brand' : 'bg-brand-light'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-brand'}`}>
        <Icon className={`w-6 h-6 ${accent ? 'text-white' : 'text-white'}`} />
      </div>
      <div>
        <p className={`text-3xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        <p className={`text-sm font-semibold mt-1 ${accent ? 'text-white/80' : 'text-slate-600'}`}>{label}</p>
        {sublabel && (
          <p className={`text-xs mt-0.5 ${accent ? 'text-white/60' : 'text-slate-400'}`}>{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ── Upcoming check-in row ────────────────────────────────────────────────────
function UpcomingRow({ booking }: { booking: any }) {
  const checkIn  = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights   = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);

  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
      {/* Datum blok */}
      <div className="w-12 h-12 bg-brand-light rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-brand uppercase leading-none">
          {format(checkIn, 'MMM', { locale: nl })}
        </span>
        <span className="text-lg font-bold text-brand leading-none mt-0.5">
          {format(checkIn, 'd')}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm">
          {booking.guest.firstName} {booking.guest.lastName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <BedDouble className="w-3 h-3" />
          {booking.room?.property?.name} — {booking.room?.name}
        </p>
      </div>

      {/* Meta */}
      <div className="text-right shrink-0">
        <p className="font-bold text-slate-900 text-sm">€{Number(booking.totalPrice).toFixed(0)}</p>
        <p className="text-xs text-slate-400">{nights} nacht{nights !== 1 ? 'en' : ''}</p>
      </div>
    </div>
  );
}

// ── Pending request card ─────────────────────────────────────────────────────
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
    <div className="bg-brand-light rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
            {booking.guest.firstName[0]}{booking.guest.lastName[0]}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">
              {booking.guest.firstName} {booking.guest.lastName}
            </p>
            <p className="text-xs text-slate-500">{booking.room?.property?.name} — {booking.room?.name}</p>
          </div>
        </div>
        <p className="text-lg font-bold text-slate-900 shrink-0">
          €{Number(booking.totalPrice).toFixed(0)}
        </p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Inchecken</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            {format(checkIn, 'd MMM', { locale: nl })}
          </p>
        </div>
        <div className="bg-white rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Uitchecken</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            {format(checkOut, 'd MMM', { locale: nl })}
          </p>
        </div>
        <div className="bg-white rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Duur</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            {nights}n
          </p>
        </div>
      </div>

      {/* Knoppen */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          <Check className="w-4 h-4" /> Accepteren
        </button>
        <button
          onClick={onReject}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-white border-2 border-transparent hover:border-red-200 hover:text-red-600 disabled:opacity-60 text-slate-500 font-bold py-3 rounded-xl text-sm transition-colors"
        >
          <X className="w-4 h-4" /> Weigeren
        </button>
      </div>

      {booking.guestMessage && (
        <div className="mt-3 bg-white rounded-xl px-4 py-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Bericht van gast</p>
          <p className="text-sm text-slate-600 italic">"{booking.guestMessage}"</p>
        </div>
      )}
    </div>
  );
}

// ── Hoofdpagina ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  });

  const { data: pendingBookings = [] } = useQuery<any[]>({
    queryKey: ['pending-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { status: 'PENDING' } }).then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  if (isLoading) return <Skeleton />;

  const stats = data?.stats;
  const showOnboarding = !isLoading && (stats?.totalProperties ?? 0) === 0;
  const upcoming: any[] = data?.upcomingBookings ?? [];

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Onboarding */}
      {showOnboarding && <OnboardingBanner locale={locale} />}

      {/* ── Statistieken ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Opbrengst deze maand"
          value={`€${(stats?.revenueThisMonth ?? 0).toFixed(0)}`}
          icon={TrendingUp}
          accent
          sublabel="excl. kosten"
        />
        <StatCard
          label="Boekingen deze maand"
          value={stats?.confirmedBookings ?? 0}
          icon={CalendarCheck}
          sublabel="bevestigd"
        />
        <StatCard
          label="Gasten dit jaar"
          value={stats?.totalGuests ?? 0}
          icon={Users}
          sublabel="unieke gasten"
        />
        <StatCard
          label="Open aanvragen"
          value={pendingBookings.length}
          icon={Clock}
          sublabel={pendingBookings.length === 1 ? 'wacht op actie' : 'wachten op actie'}
        />
      </div>

      {/* ── Hoofdcontent: Agenda + Aankomende gast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Aankomende inchecks */}
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-light rounded-2xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Aankomende inchecks</h2>
                <p className="text-xs text-slate-400">De eerstvolgende boekingen</p>
              </div>
            </div>
            <Link
              href={`/${locale}/bookings`}
              className="text-sm font-semibold text-brand hover:text-brand-600 flex items-center gap-1"
            >
              Alles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="px-6">
            {upcoming.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-7 h-7 text-brand" />
                </div>
                <p className="font-bold text-slate-700">Geen aankomende boekingen</p>
                <p className="text-sm text-slate-400 mt-1">Zodra gasten boeken ziet u dat hier.</p>
              </div>
            ) : (
              upcoming.slice(0, 6).map((b: any) => (
                <UpcomingRow key={b.id} booking={b} />
              ))
            )}
          </div>
        </div>

        {/* Vereiste acties / open aanvragen */}
        <div className="bg-brand-light rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-brand/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Vereiste acties</h2>
                <p className="text-xs text-slate-500">
                  {pendingBookings.length === 0
                    ? 'Alles bijgewerkt'
                    : `${pendingBookings.length} openstaande aanvra${pendingBookings.length === 1 ? 'ag' : 'gen'}`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {pendingBookings.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-brand" />
                </div>
                <p className="text-sm font-bold text-slate-700">Niets te doen!</p>
                <p className="text-xs text-slate-400 mt-1">Geen openstaande aanvragen.</p>
              </div>
            ) : (
              pendingBookings.map((b: any) => (
                <PendingCard
                  key={b.id}
                  booking={b}
                  onConfirm={() => updateStatus.mutate({ id: b.id, status: 'CONFIRMED' })}
                  onReject={() => updateStatus.mutate({ id: b.id, status: 'REJECTED' })}
                  isPending={updateStatus.isPending}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
