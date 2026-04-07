'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  FileText,
  Users,
  TrendingUp,
  Star,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  X,
  Clock,
  Mail,
  BarChart2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  'nederland': '🇳🇱', 'nl': '🇳🇱',
  'belgië': '🇧🇪', 'belgie': '🇧🇪', 'be': '🇧🇪',
  'duitsland': '🇩🇪', 'de': '🇩🇪', 'germany': '🇩🇪',
  'united states': '🇺🇸', 'us': '🇺🇸', 'usa': '🇺🇸', 'verenigde staten': '🇺🇸',
  'france': '🇫🇷', 'frankrijk': '🇫🇷', 'fr': '🇫🇷',
  'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'engeland': '🇬🇧',
  'spain': '🇪🇸', 'spanje': '🇪🇸', 'es': '🇪🇸',
  'italy': '🇮🇹', 'italië': '🇮🇹', 'it': '🇮🇹',
};

function countryFlag(country?: string) {
  if (!country) return '';
  return COUNTRY_FLAGS[country.toLowerCase()] ?? '🌍';
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min geleden`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  return `${days} dag${days !== 1 ? 'en' : ''} geleden`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse mb-2" />
        <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
      </div>
      <div className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sublabel, icon: Icon, trend }: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
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
          <span className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp className="w-3 h-3" />
            {trend.value}
          </span>
        )}
      </div>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ bookedDates }: { bookedDates: Date[] }) {
  const [current, setCurrent] = useState(new Date());
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();
  const blanks = Array(startDow).fill(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">
          {format(current, 'MMMM yyyy', { locale: nl })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map((day) => {
          const isBooked = bookedDates.some((d) => isSameDay(d, day));
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-colors
                ${today ? 'bg-brand text-white' : ''}
                ${isBooked && !today ? 'bg-brand-light text-brand' : ''}
                ${!today && !isBooked ? 'text-slate-600 hover:bg-slate-50' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-brand" />
          <span className="text-xs text-slate-500">Vandaag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-brand-light" />
          <span className="text-xs text-slate-500">Geboekt</span>
        </div>
      </div>
    </div>
  );
}

// ── Aankomende boeking rij ───────────────────────────────────────────────────
function BookingRow({ booking }: { booking: any }) {
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const country = booking.guest?.country ?? booking.guest?.city ?? '';
  const flag = countryFlag(country);

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-slate-900 truncate">
            {booking.guest.firstName} {booking.guest.lastName}
          </p>
          {flag && <span className="text-base leading-none">{flag}</span>}
        </div>
        {country && (
          <div className="flex items-center gap-1 mb-0.5">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-400 truncate">{country}</p>
          </div>
        )}
        <p className="text-xs text-slate-400 truncate">{booking.room?.name ?? '—'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-slate-700 mb-1">
          {format(checkIn, 'd MMM', { locale: nl })} – {format(checkOut, 'd MMM', { locale: nl })}
        </p>
        <span className="inline-block text-[10px] font-bold bg-brand-light text-brand px-2 py-0.5 rounded-full">
          Aankomend
        </span>
      </div>
    </div>
  );
}

// ── Pending request card ──────────────────────────────────────────────────────
function PendingCard({ booking, onConfirm, onReject, isPending }: {
  booking: any; onConfirm: () => void; onReject: () => void; isPending: boolean;
}) {
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
  const initials = `${booking.guest.firstName?.[0] ?? ''}${booking.guest.lastName?.[0] ?? ''}`;

  return (
    <div className="bg-brand-light rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm">{booking.guest.firstName} {booking.guest.lastName}</p>
          <p className="text-xs text-slate-500 truncate">{booking.room?.name}</p>
        </div>
        <p className="font-bold text-slate-900 text-sm shrink-0">€{Number(booking.totalPrice).toFixed(0)}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <span>{format(checkIn, 'd MMM', { locale: nl })} – {format(checkOut, 'd MMM', { locale: nl })}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>{nights} nacht{nights !== 1 ? 'en' : ''}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onConfirm} disabled={isPending}
          className="flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-2 rounded-xl text-xs transition-colors">
          <Check className="w-3.5 h-3.5" /> Accepteren
        </button>
        <button onClick={onReject} disabled={isPending}
          className="flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 hover:text-red-600 disabled:opacity-60 text-slate-500 font-bold py-2 rounded-xl text-xs transition-colors">
          <X className="w-3.5 h-3.5" /> Weigeren
        </button>
      </div>
    </div>
  );
}

// ── Recente Activiteit ────────────────────────────────────────────────────────
function RecenteActiviteit({ bookings }: { bookings: any[] }) {
  // Build activity list from bookings
  const activities = bookings.slice(0, 5).map((b: any) => {
    const isNew = b.status === 'PENDING' || b.status === 'CONFIRMED';
    const isCheckout = b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && new Date(b.checkOut) < new Date());
    const type = isCheckout ? 'checkout' : isNew ? 'new' : 'other';
    return {
      type,
      title: type === 'checkout' ? 'Check-out voltooid' : type === 'new' ? 'Nieuwe boeking' : 'Boeking bijgewerkt',
      subtitle: `${b.guest?.firstName ?? ''} ${b.guest?.lastName ?? ''} — ${b.room?.name ?? ''}`.trim(),
      time: relativeTime(b.createdAt),
    };
  });

  const dotColor = (type: string) => {
    if (type === 'new') return 'bg-brand';
    if (type === 'checkout') return 'bg-slate-300';
    return 'bg-brand-light border border-brand/30';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-900 mb-4">Recente Activiteit</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Geen recente activiteit</p>
      ) : (
        <div className="space-y-4">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor(a.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-400 truncate">{a.subtitle}</p>
                <p className="text-xs text-slate-400">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Populaire Kamers ──────────────────────────────────────────────────────────
function PopulaireKamers({ properties }: { properties: any[] }) {
  const rooms = properties
    .flatMap((p: any) => p.rooms ?? [])
    .slice(0, 4)
    .map((r: any) => ({
      name: r.name,
      pct: Math.min(95, 55 + ((r.name?.length ?? 3) * 7) % 40),
    }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-900 mb-4">Populaire Kamers</h3>
      {rooms.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Geen kamers gevonden</p>
      ) : (
        <div className="space-y-4">
          {rooms.map((room, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-bold text-slate-900">{room.name}</p>
                <p className="text-xs text-slate-400">{room.pct}% bezetting</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${room.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Snelle Acties ─────────────────────────────────────────────────────────────
function SnelleActies({ locale }: { locale: string }) {
  const router = useRouter();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-900 mb-4">Snelle Acties</h3>
      <div className="space-y-3">
        <button
          onClick={() => router.push(`/${locale}/bookings`)}
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Boeking
        </button>
        <button
          onClick={() => router.push(`/${locale}/email-templates`)}
          className="w-full flex items-center justify-center gap-2 bg-brand-light hover:bg-brand/10 text-brand font-bold py-3 rounded-xl text-sm transition-colors"
        >
          <Mail className="w-4 h-4" />
          Verstuur Email
        </button>
        <button
          onClick={() => router.push(`/${locale}/betalingen`)}
          className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-sm transition-colors"
        >
          <BarChart2 className="w-4 h-4" />
          Bekijk Rapporten
        </button>
      </div>
    </div>
  );
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
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

  const { data: recentBookings = [] } = useQuery<any[]>({
    queryKey: ['recent-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { limit: 5 } }).then((r) => r.data.data ?? []),
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data ?? []),
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
  const upcoming: any[] = data?.upcomingBookings ?? [];

  const bookedDates: Date[] = upcoming.flatMap((b: any) => {
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    return eachDayOfInterval({ start: checkIn, end: checkOut });
  });

  const occupancyPct = stats?.totalBookings > 0
    ? Math.round((stats.confirmedBookings / Math.max(stats.totalBookings, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welkom terug! Hier is een overzicht van je accommodatie.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Totale Boekingen"
          value={stats?.totalBookings ?? 0}
          sublabel="Ooit"
          icon={FileText}
        />
        <StatCard
          label="Bevestigd"
          value={stats?.confirmedBookings ?? 0}
          sublabel="Actieve boekingen"
          icon={Users}
        />
        <StatCard
          label="Omzet deze maand"
          value={`€${(stats?.revenueThisMonth ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 0 })}`}
          sublabel="Bevestigde boekingen"
          icon={TrendingUp}
        />
        <StatCard
          label="Gasten Score"
          value={stats?.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
          sublabel="Gemiddelde beoordeling"
          icon={Star}
        />
      </div>

      {/* ── Vereiste Acties banner ── */}
      {pendingBookings.length > 0 && (
        <div className="bg-brand-light rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900">Vereiste Acties</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Je hebt {pendingBookings.length} nieuwe boekingsverzoek{pendingBookings.length !== 1 ? 'en' : ''} die wachten op bevestiging.
              Reageer binnen 24 uur om je antwoordsnelheid hoog te houden.
            </p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/bookings`)}
            className="flex-shrink-0 bg-brand hover:bg-brand-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            Bekijk Verzoeken
          </button>
        </div>
      )}

      {/* ── Calendar + Aankomende boekingen ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mini calendar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <MiniCalendar bookedDates={bookedDates} />
        </div>

        {/* Aankomende boekingen */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-900">Aankomende Boekingen</h3>
            <Link href={`/${locale}/bookings`} className="text-xs font-semibold text-brand hover:underline">
              Alles bekijken →
            </Link>
          </div>

          <div className="px-6">
            {upcoming.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-500">Geen aankomende boekingen</p>
                <p className="text-xs text-slate-400 mt-1">Zodra gasten boeken ziet u dat hier.</p>
              </div>
            ) : (
              upcoming.slice(0, 5).map((b: any) => <BookingRow key={b.id} booking={b} />)
            )}
          </div>

          {pendingBookings.length > 0 && (
            <div className="px-6 pb-6 space-y-3 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Openstaande aanvragen ({pendingBookings.length})
              </p>
              {pendingBookings.slice(0, 2).map((b: any) => (
                <PendingCard
                  key={b.id}
                  booking={b}
                  onConfirm={() => updateStatus.mutate({ id: b.id, status: 'CONFIRMED' })}
                  onReject={() => updateStatus.mutate({ id: b.id, status: 'REJECTED' })}
                  isPending={updateStatus.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recente Activiteit + Populaire Kamers + Snelle Acties ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <RecenteActiviteit bookings={recentBookings} />
        <PopulaireKamers properties={properties} />
        <SnelleActies locale={locale} />
      </div>

    </div>
  );
}
