'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Mail, Phone, MapPin, Star, X, BedDouble, CalendarDays, Euro, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { useDynamicCopy } from '@/components/providers/dynamic-copy-provider';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// ─── Guest Detail Modal ───────────────────────────────────────────────────────

function GuestDetailModal({ guest, onClose }: { guest: any; onClose: () => void }) {
  const bookings: any[] = guest.bookings ?? [];
  const totalSpent = bookings.reduce((s: number, b: any) => s + Number(b.totalPrice ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              {`${guest.firstName?.[0] ?? ''}${guest.lastName?.[0] ?? ''}`}
            </div>
            <div>
              <p className="font-bold text-slate-900">{guest.firstName} {guest.lastName}</p>
              <p className="text-xs text-slate-400">{guest.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Boekingen', value: bookings.length },
            { label: 'Totaal uitgegeven', value: `€${totalSpent.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}` },
            { label: 'Laatste bezoek', value: bookings[0] ? format(new Date(bookings[0].checkIn), 'd MMM yy', { locale: nl }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3 text-center">
              <p className="text-base font-extrabold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Contact info */}
        {(guest.phone || guest.city) && (
          <div className="px-6 py-3 border-b border-slate-50 flex flex-wrap gap-4">
            {guest.phone && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{guest.phone}</span>
              </div>
            )}
            {guest.city && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{guest.city}</span>
              </div>
            )}
          </div>
        )}

        {/* Bookings list */}
        <div className="overflow-y-auto flex-1">
          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <BedDouble className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Geen boekingen gevonden.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {bookings.map((b: any) => {
                const nights = b.checkIn && b.checkOut
                  ? Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86_400_000)
                  : null;
                return (
                  <div key={b.id} className="px-6 py-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-light rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BedDouble className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {b.room?.property?.name ?? b.room?.name ?? 'Kamer'}
                        {b.room?.name && b.room?.property?.name ? ` — ${b.room.name}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays className="w-3 h-3" />
                          {b.checkIn ? format(new Date(b.checkIn), 'd MMM yyyy', { locale: nl }) : '—'}
                          {nights ? ` · ${nights} nacht${nights !== 1 ? 'en' : ''}` : ''}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Euro className="w-3 h-3" />
                          {Number(b.totalPrice ?? 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                      b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {b.status === 'CONFIRMED' ? 'Bevestigd' :
                       b.status === 'CANCELLED' ? 'Geannuleerd' :
                       b.status === 'PENDING' ? 'In afwachting' : b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <a
            href={`mailto:${guest.email}`}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold py-3 rounded-2xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            Stuur bericht
          </a>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? 'text-brand fill-brand' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function GuestsPage() {
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);

  // Dynamic copy — falls back to hardcoded Dutch if key not in DB
  const pageTitle    = useDynamicCopy('guests.header.title', 'Gasten');
  const pageSubtitle = useDynamicCopy('guests.subtitle',     'Overzicht van al je gasten');

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', search],
    queryFn: () =>
      api.get('/guests', { params: search ? { search } : {} }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Title + search */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
            <Tooltip content="Overzicht van alle gasten die ooit een boeking hebben gemaakt." position="right">
              <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-default transition-colors" />
            </Tooltip>
          </div>
          <p className="text-slate-400 mt-1">{pageSubtitle}</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek gasten..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (guests as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <p className="font-bold text-slate-700">Geen gasten gevonden</p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Probeer een andere zoekterm.' : 'Zodra gasten boeken verschijnen ze hier.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(guests as any[]).map((guest: any) => {
            const initials = `${guest.firstName?.[0] ?? ''}${guest.lastName?.[0] ?? ''}`;
            const bookingCount = guest._count?.bookings ?? guest.bookings?.length ?? 0;
            const totalSpent = guest.bookings?.reduce((s: number, b: any) => s + Number(b.totalPrice ?? 0), 0) ?? 0;
            const lastBooking = guest.bookings?.[0];
            const lastVisit = lastBooking ? new Date(lastBooking.checkIn) : null;
            // Mock rating 3-5 based on initials for now
            const rating = 3 + (initials.charCodeAt(0) % 3);

            return (
              <div key={guest.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand text-white font-bold text-base flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 truncate">{guest.firstName} {guest.lastName}</p>
                      {bookingCount > 0 && (
                        <span className="flex-shrink-0 bg-brand-light text-brand text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {bookingCount} boeking{bookingCount !== 1 ? 'en' : ''}
                        </span>
                      )}
                    </div>
                    <StarRating rating={rating} />
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 mb-4">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.city && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{guest.city}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-3 border-t border-slate-50 mb-4">
                  <div>
                    <p className="text-xs text-slate-400">Totaal uitgegeven</p>
                    <p className="font-bold text-slate-900 text-sm">€{totalSpent.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Laatste bezoek</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {lastVisit ? format(lastVisit, 'd MMM yyyy', { locale: nl }) : '—'}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedGuest(guest)}
                    className="flex-1 bg-brand hover:bg-brand-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Details
                  </button>
                  <a
                    href={`mailto:${guest.email}`}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-colors text-center"
                  >
                    Bericht
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedGuest && (
        <GuestDetailModal guest={selectedGuest} onClose={() => setSelectedGuest(null)} />
      )}
    </div>
  );
}
