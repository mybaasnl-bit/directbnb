'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Euro, BedDouble, BookOpen, Users,
  TrendingUp, AlertCircle, Clock,
} from 'lucide-react';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sublabel, icon: Icon, accent }: {
  label: string; value: string | number; sublabel?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-10 h-10 ${accent ?? 'bg-brand'} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// ─── Payout row ───────────────────────────────────────────────────────────────

function PayoutRow({ booking, variant }: { booking: any; variant: 'upcoming' | 'failed' }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${variant === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {booking.owner?.firstName} {booking.owner?.lastName}
          <span className="text-slate-400 font-normal ml-1">— {booking.room?.property?.name}</span>
        </p>
        <p className="text-xs text-slate-400 truncate">
          {booking.guest?.firstName} {booking.guest?.lastName} &bull;{' '}
          {format(new Date(booking.checkIn), 'd MMM yyyy', { locale: nl })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900">
          €{Number(booking.payoutAmount ?? booking.totalPrice).toFixed(2)}
        </p>
        {variant === 'failed' && (
          <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Mislukt</span>
        )}
        {variant === 'upcoming' && (
          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Gepland</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery<{
    upcoming: any[]; failed: any[];
  }>({
    queryKey: ['admin-payouts-overview'],
    queryFn: () => api.get('/admin/payouts/overview').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Platform overzicht en financiële KPI's</p>
      </div>

      {/* KPI cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Commissie deze maand"
              value={`€${(stats?.commissionThisMonth ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sublabel="Afgedragen platform fee"
              icon={Euro}
              accent="bg-emerald-500"
            />
            <StatCard
              label="Actieve B&B's"
              value={stats?.activeBnbs ?? 0}
              sublabel="Gepubliceerde accommodaties"
              icon={BedDouble}
            />
            <StatCard
              label="Actieve kamers"
              value={stats?.activeRooms ?? 0}
              sublabel="Beschikbare kamers"
              icon={TrendingUp}
            />
            <StatCard
              label="Totale boekingen"
              value={stats?.totalBookings ?? 0}
              sublabel="Alle tijden"
              icon={BookOpen}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Hosts"
              value={stats?.totalUsers ?? 0}
              sublabel="Geregistreerde verhuurders"
              icon={Users}
            />
            <StatCard
              label="Uitbetalingen gepland"
              value={stats?.pendingPayouts ?? 0}
              sublabel="Na check-in te verwerken"
              icon={Clock}
              accent="bg-amber-500"
            />
            <StatCard
              label="Mislukte uitbetalingen"
              value={stats?.failedPayouts ?? 0}
              sublabel="Vereisen aandacht"
              icon={AlertCircle}
              accent="bg-red-500"
            />
          </div>
        </>
      )}

      {/* Payout tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900">Aanstaande uitbetalingen</h3>
            <span className="ml-auto text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
              {payouts?.upcoming?.length ?? 0}
            </span>
          </div>
          <div className="px-6">
            {payoutsLoading ? (
              <div className="space-y-3 py-4">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : !payouts?.upcoming?.length ? (
              <p className="text-sm text-slate-400 py-8 text-center">Geen aanstaande uitbetalingen</p>
            ) : (
              payouts.upcoming.map((b: any) => (
                <PayoutRow key={b.id} booking={b} variant="upcoming" />
              ))
            )}
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900">Mislukte uitbetalingen</h3>
            <span className="ml-auto text-xs font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
              {payouts?.failed?.length ?? 0}
            </span>
          </div>
          <div className="px-6">
            {payoutsLoading ? (
              <div className="space-y-3 py-4">
                {[1,2].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : !payouts?.failed?.length ? (
              <p className="text-sm text-slate-400 py-8 text-center">Geen mislukte uitbetalingen ✅</p>
            ) : (
              payouts.failed.map((b: any) => (
                <PayoutRow key={b.id} booking={b} variant="failed" />
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
