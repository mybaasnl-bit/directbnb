'use client';

import { useAuth } from '@/hooks/use-auth';
import { LanguageSwitcher } from './language-switcher';
import { Bell, X, CalendarDays, Check, XCircle, ArrowRight, BedDouble, Search, Menu } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Booking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  createdAt: string;
  guest: { firstName: string; lastName: string; email: string };
  room: { name: string; property: { name: string; id: string } };
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Goedemorgen, ${name} 👋`;
  if (hour < 18) return `Goedemiddag, ${name} 👋`;
  return `Goedenavond, ${name} 👋`;
}

// ── Zoekbalk ─────────────────────────────────────────────────────────────
function SearchBar() {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();

  // Sluit op klik buiten
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/bookings', { params: { search: q } });
      setResults((data?.data ?? []).slice(0, 6));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/${locale}/bookings?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => { if (query) setOpen(true); }}
            placeholder="Zoek naar boekingen, gasten..."
            className="w-full pl-11 pr-4 py-2.5 bg-page border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          />
        </div>
      </form>

      {/* Zoekresultaten dropdown */}
      {open && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-6 text-center">
              <div className="inline-block w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-slate-400">Geen resultaten gevonden voor &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {results.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/${locale}/bookings`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-xs flex-shrink-0">
                      {b.guest.firstName[0]}{b.guest.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {b.guest.firstName} {b.guest.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {b.room?.property?.name} — {fmt(b.checkIn)} → {fmt(b.checkOut)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 shrink-0">
                      €{Number(b.totalPrice).toFixed(0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              onClick={handleSubmit as any}
              className="text-xs font-semibold text-brand hover:text-brand-600 flex items-center gap-1"
            >
              Bekijk alle resultaten voor &ldquo;{query}&rdquo;
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const currentLocale = useLocale();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = (user as any)?.role === 'ADMIN';

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [notifOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setNotifOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const { data: pendingBookings = [] } = useQuery<Booking[]>({
    queryKey: ['pending-bookings'],
    queryFn: () =>
      api.get('/bookings', { params: { status: 'PENDING' } }).then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
    enabled: !isAdmin,
  });

  const pendingCount = pendingBookings.length;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const dateLocale = currentLocale === 'nl' ? 'nl-NL' : 'en-GB';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  const nights = (ci: string, co: string) =>
    Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <header className="bg-white border-b border-slate-100 px-4 md:px-6 h-16 flex items-center gap-3 md:gap-4 shrink-0">

      {/* Hamburger menu — alleen zichtbaar op mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Begroeting (links, verborgen op kleine schermen) */}
      <div className="hidden lg:block shrink-0">
        {user && (
          <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            {getGreeting(user.firstName)}
          </p>
        )}
      </div>

      {/* Scheidingslijn */}
      <div className="hidden lg:block w-px h-6 bg-slate-200 shrink-0" />

      {/* Zoekbalk (neemt beschikbare ruimte) */}
      <SearchBar />

      {/* Rechtergedeelte */}
      <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">

        {/* Taalwisselaar */}
        <LanguageSwitcher />

        {/* Notificaties */}
        {!isAdmin && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(v => !v)}
              className={`relative p-2.5 rounded-xl transition-colors ${
                notifOpen ? 'bg-slate-100' : 'hover:bg-slate-100'
              }`}
              aria-label="Meldingen"
            >
              <Bell className={`w-5 h-5 ${pendingCount > 0 ? 'text-slate-700' : 'text-slate-400'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Boekingsaanvragen</h3>
                    {pendingCount > 0 && (
                      <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="max-h-[480px] overflow-y-auto">
                  {pendingBookings.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-500">Geen openstaande aanvragen</p>
                      <p className="text-sm text-slate-400 mt-1">Alles is bijgewerkt!</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {pendingBookings.map((booking) => (
                        <li key={booking.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
                                {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">
                                  {booking.guest.firstName} {booking.guest.lastName}
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                  <BedDouble className="w-3 h-3 flex-shrink-0" />
                                  {booking.room.property.name} · {booking.room.name}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                              €{Number(booking.totalPrice).toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 bg-slate-50 px-3 py-2 rounded-lg">
                            <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>{fmt(booking.checkIn)} → {fmt(booking.checkOut)}</span>
                            <span className="text-slate-400">({nights(booking.checkIn, booking.checkOut)} nachten)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" /> Accepteren
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ id: booking.id, status: 'REJECTED' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-red-200 hover:text-red-600 text-slate-600 text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" /> Weigeren
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-slate-100 px-5 py-3">
                  <Link
                    href={`/${locale}/bookings`}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-between text-sm font-semibold text-brand hover:text-brand-600 group"
                  >
                    Alle boekingen bekijken
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm cursor-pointer hover:ring-2 hover:ring-brand/30 transition-all">
          {initials}
        </div>
      </div>
    </header>
  );
}
