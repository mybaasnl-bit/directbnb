'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, MapPin, CalendarDays, Users, ChevronRight, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Room {
  id: string;
  name: string;
  pricePerNight: number;
  maxGuests: number;
}

interface Property {
  id: string;
  slug: string;
  name: string;
  addressCity?: string;
  avgRating?: number | null;
  reviewCount?: number;
  rooms?: Room[];
  photos?: { url: string; isCover?: boolean }[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function EmbedPage() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const searchParams = useSearchParams();

  // Config from URL params — all default to true
  const showPhoto   = searchParams.get('photo')   !== '0';
  const showPrice   = searchParams.get('price')   !== '0';
  const showRooms   = searchParams.get('rooms')   !== '0';
  const showReviews = searchParams.get('reviews') !== '0';
  const lang        = searchParams.get('lang') ?? locale ?? 'nl';
  const isNl        = lang === 'nl';

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests,   setGuests]   = useState(2);
  const [roomId,   setRoomId]   = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch(`${API}/public/properties/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((r) => {
        setProperty(r.data);
        if (r.data?.rooms?.length) setRoomId(r.data.rooms[0].id);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const cover = property?.photos?.find((p) => p.isCover) ?? property?.photos?.[0];
  const selectedRoom = property?.rooms?.find((r) => r.id === roomId);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;
  const totalPrice = selectedRoom ? nights * Number(selectedRoom.pricePerNight) : 0;

  const frontendBase = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://directbnb.nl';
  const bookUrl = `${frontendBase}/${lang}/bnb/${slug}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}` : ''}`;

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white">
        <Loader2 className="w-6 h-6 text-[#FF5000] animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-32 bg-white text-sm text-slate-400 px-4 text-center">
        {isNl ? 'Kon de accommodatie niet laden.' : 'Could not load the property.'}
      </div>
    );
  }

  return (
    <div className="bg-white font-sans text-slate-800 text-sm antialiased" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Cover photo */}
      {showPhoto && cover && (
        <div className="w-full h-36 overflow-hidden">
          <img
            src={cover.url}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 space-y-4">

        {/* Property name + location + rating */}
        <div>
          <h2 className="font-bold text-base text-slate-900 leading-tight">{property.name}</h2>

          {property.addressCity && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
              <MapPin className="w-3 h-3" />
              {property.addressCity}
            </div>
          )}

          {showReviews && property.avgRating && (
            <div className="flex items-center gap-1.5 mt-1">
              <Stars rating={property.avgRating} />
              <span className="text-xs text-slate-500 font-semibold">
                {property.avgRating.toFixed(1)}
                {property.reviewCount ? ` (${property.reviewCount})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Date pickers */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              {isNl ? 'Check-in' : 'Check-in'}
            </label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              {isNl ? 'Check-out' : 'Check-out'}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              disabled={!checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000] disabled:opacity-40"
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {isNl ? 'Gasten' : 'Guests'}
            </span>
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 bg-white"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? (isNl ? 'gast' : 'guest') : (isNl ? 'gasten' : 'guests')}</option>
            ))}
          </select>
        </div>

        {/* Room selector */}
        {showRooms && property.rooms && property.rooms.length > 1 && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              {isNl ? 'Kamer' : 'Room'}
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 bg-white"
            >
              {property.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — €{Number(r.pricePerNight).toFixed(0)}{isNl ? '/nacht' : '/night'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price estimate */}
        {showPrice && nights > 0 && selectedRoom && (
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between border border-slate-100">
            <span className="text-xs text-slate-500">
              €{Number(selectedRoom.pricePerNight).toFixed(0)} × {nights} {isNl ? (nights === 1 ? 'nacht' : 'nachten') : (nights === 1 ? 'night' : 'nights')}
            </span>
            <span className="font-bold text-slate-900 text-sm">€{totalPrice.toFixed(0)}</span>
          </div>
        )}

        {/* CTA button */}
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FF5000' }}
        >
          {isNl ? 'Boek nu' : 'Book now'}
          <ChevronRight className="w-4 h-4" />
        </a>

        {/* Powered by */}
        <div className="text-center">
          <a
            href="https://directbnb.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-300 hover:text-slate-400 transition-colors"
          >
            Powered by DirectBnB
          </a>
        </div>
      </div>
    </div>
  );
}
