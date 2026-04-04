'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Mail, Phone, MapPin, Star } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
          <h1 className="text-3xl font-bold text-slate-900">Gasten</h1>
          <p className="text-slate-400 mt-1">Overzicht van al je gasten</p>
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
                  <button className="flex-1 bg-brand hover:bg-brand-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
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
    </div>
  );
}
