'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Star, MapPin, Users, ChevronRight, Loader2, ChevronLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://directbnb-production.up.railway.app/api/v1';

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

// ── Mini availability calendar ───────────────────────────────────────────────

const DAYS_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS_NL = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function toYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

interface MiniCalendarProps {
  roomId: string;
  checkIn: string;
  checkOut: string;
  onSelect: (checkIn: string, checkOut: string) => void;
  isNl: boolean;
}

function MiniCalendar({ roomId, checkIn, checkOut, onSelect, isNl }: MiniCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [selectingCheckout, setSelectingCheckout] = useState(false);

  // Fetch unavailable dates for this month when roomId or month changes
  useEffect(() => {
    if (!roomId) return;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startDate = toYMD(start);
    const endDate = toYMD(end);

    fetch(`${API}/availability?roomId=${roomId}&startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((r) => {
        const dates: string[] = r?.data?.unavailableDates ?? r?.unavailableDates ?? [];
        setUnavailable(new Set(dates));
      })
      .catch(() => {});
  }, [roomId, year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid (Mon-first)
  const firstDay = new Date(year, month, 1);
  // JS: 0=Sun,1=Mon,...6=Sat → convert to Mon-first: (day+6)%7
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    const ymd = toYMD(date);
    if (date < today) return;
    if (unavailable.has(ymd)) return;

    if (!checkIn || selectingCheckout === false && !checkIn) {
      // Set check-in
      onSelect(ymd, '');
      setSelectingCheckout(true);
    } else if (!checkOut || !selectingCheckout) {
      // First click after reset — set check-in
      onSelect(ymd, '');
      setSelectingCheckout(true);
    } else {
      // Second click — set check-out (must be after check-in)
      if (ymd <= checkIn) {
        onSelect(ymd, '');
        setSelectingCheckout(true);
      } else {
        // Check no unavailable dates in range
        let hasUnavailable = false;
        const ci = new Date(checkIn);
        const co = new Date(ymd);
        for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
          if (unavailable.has(toYMD(d))) { hasUnavailable = true; break; }
        }
        if (hasUnavailable) {
          onSelect(ymd, '');
          setSelectingCheckout(true);
        } else {
          onSelect(checkIn, ymd);
          setSelectingCheckout(false);
        }
      }
    }
  };

  const isInRange = (ymd: string) => {
    if (!checkIn || !checkOut) return false;
    return ymd > checkIn && ymd < checkOut;
  };
  const isStart = (ymd: string) => ymd === checkIn;
  const isEnd   = (ymd: string) => ymd === checkOut;

  const dayLabels = isNl ? DAYS_NL : DAYS_EN;
  const monthName = (isNl ? MONTHS_NL : MONTHS_EN)[month];

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-slate-700">{monthName} {year}</span>
        <button
          onClick={nextMonth}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const date = new Date(year, month, day);
          const ymd = toYMD(date);
          const isPast = date < today;
          const isUnavail = unavailable.has(ymd);
          const disabled = isPast || isUnavail;
          const start = isStart(ymd);
          const end = isEnd(ymd);
          const inRange = isInRange(ymd);
          const isToday = ymd === toYMD(today);

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={[
                'relative text-center text-xs py-1.5 leading-none transition-colors',
                disabled ? 'text-slate-300 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-brand/10',
                start || end ? 'bg-[#FF5000] text-white rounded-lg font-bold hover:bg-[#FF5000]' : '',
                inRange ? 'bg-[#FF5000]/15 text-[#FF5000] rounded-none' : '',
                isToday && !start && !end ? 'font-bold text-[#FF5000]' : '',
                !start && !end && !inRange && !disabled ? 'text-slate-700' : '',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selection hint */}
      <p className="text-[10px] text-slate-400 text-center mt-2">
        {!checkIn
          ? (isNl ? 'Kies aankomstdatum' : 'Select check-in date')
          : !checkOut
          ? (isNl ? 'Kies vertrekdatum' : 'Select check-out date')
          : (isNl ? `${checkIn} → ${checkOut}` : `${checkIn} → ${checkOut}`)}
      </p>
    </div>
  );
}

// ── Main embed page ──────────────────────────────────────────────────────────

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

  useEffect(() => {
    fetch(`${API}/public/properties/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((r) => {
        setProperty(r.data ?? r);
        const rooms = r.data?.rooms ?? r.rooms ?? [];
        if (rooms.length) setRoomId(rooms[0].id);
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

  const handleCalendarSelect = useCallback((ci: string, co: string) => {
    setCheckIn(ci);
    setCheckOut(co);
  }, []);

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

        {/* Room selector */}
        {showRooms && property.rooms && property.rooms.length > 1 && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              {isNl ? 'Kamer' : 'Room'}
            </label>
            <select
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setCheckIn(''); setCheckOut(''); }}
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

        {/* Availability calendar */}
        {roomId && (
          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              {isNl ? 'Beschikbaarheid' : 'Availability'}
            </p>
            <MiniCalendar
              roomId={roomId}
              checkIn={checkIn}
              checkOut={checkOut}
              onSelect={handleCalendarSelect}
              isNl={isNl}
            />
          </div>
        )}

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
