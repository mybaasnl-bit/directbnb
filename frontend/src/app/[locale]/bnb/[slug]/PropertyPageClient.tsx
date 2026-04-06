'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import {
  MapPin, Users, ChevronLeft, ChevronRight, Check, Wifi, Car,
  Coffee, Wind, Thermometer, UtensilsCrossed, WashingMachine,
  Tv, Waves, Flower2, Sun, Bike, ArrowUpDown, Flame,
  Monitor, Lock, Droplets, Zap, Baby, Star, BedDouble,
  SquareStack, CheckCircle2, X, CalendarDays,
  MessageSquare, ChevronDown, ChevronUp, Minus, Plus,
  ArrowRight, Camera, Clock, Cigarette, PawPrint,
  Share2, ChevronDown as ChevronDownIcon, User, Copy, CheckCircle,
  Phone, Globe,
} from 'lucide-react';
import type { Property, Room } from '@/types';

// ─── Amenity configuration ───────────────────────────────────────────────────

const AMENITIES: Record<string, { labelNl: string; labelEn: string; icon: React.ElementType }> = {
  wifi:       { labelNl: 'WiFi',            labelEn: 'WiFi',             icon: Wifi },
  parking:    { labelNl: 'Parkeren',         labelEn: 'Parking',          icon: Car },
  breakfast:  { labelNl: 'Ontbijt',          labelEn: 'Breakfast',        icon: Coffee },
  airco:      { labelNl: 'Airconditioning',  labelEn: 'Air conditioning', icon: Wind },
  heating:    { labelNl: 'Verwarming',       labelEn: 'Heating',          icon: Thermometer },
  kitchen:    { labelNl: 'Keuken',           labelEn: 'Kitchen',          icon: UtensilsCrossed },
  washer:     { labelNl: 'Wasmachine',       labelEn: 'Washing machine',  icon: WashingMachine },
  tv:         { labelNl: 'Televisie',        labelEn: 'TV',               icon: Tv },
  pool:       { labelNl: 'Zwembad',          labelEn: 'Swimming pool',    icon: Waves },
  garden:     { labelNl: 'Tuin',             labelEn: 'Garden',           icon: Flower2 },
  terrace:    { labelNl: 'Terras',           labelEn: 'Terrace',          icon: Sun },
  bicycle:    { labelNl: 'Fietsen',          labelEn: 'Bicycles',         icon: Bike },
  elevator:   { labelNl: 'Lift',             labelEn: 'Elevator',         icon: ArrowUpDown },
  sauna:      { labelNl: 'Sauna',            labelEn: 'Sauna',            icon: Flame },
  fireplace:  { labelNl: 'Open haard',       labelEn: 'Fireplace',        icon: Flame },
  bbq:        { labelNl: 'BBQ',              labelEn: 'BBQ',              icon: Flame },
  desk:       { labelNl: 'Werkplek',         labelEn: 'Work desk',        icon: Monitor },
  safe:       { labelNl: 'Kluis',            labelEn: 'Safe',             icon: Lock },
  iron:       { labelNl: 'Strijkijzer',      labelEn: 'Iron',             icon: Zap },
  hairdryer:  { labelNl: 'Haardroger',       labelEn: 'Hair dryer',       icon: Wind },
  crib:       { labelNl: 'Kinderbedje',      labelEn: 'Crib',             icon: Baby },
  dishwasher: { labelNl: 'Vaatwasser',       labelEn: 'Dishwasher',       icon: Droplets },
  ev_charger: { labelNl: 'Laadpaal EV',      labelEn: 'EV charger',       icon: Zap },
};

// ─── Booking form schema ─────────────────────────────────────────────────────

const bookingSchema = z.object({
  roomId: z.string().uuid(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  numGuests: z.number().min(1),
  guestFirstName: z.string().min(1),
  guestLastName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  guestMessage: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

/** Toont prijzen zonder decimalen als het een heel getal is, anders met 2 decimalen */
function fmtPrice(price: number | string): string {
  const n = Number(price);
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating, max = 5, size = 'sm' }: { rating: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`${sz} ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score?: number | null }) {
  if (!score) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-light0 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-6">{score}</span>
    </div>
  );
}

// ─── CollapsibleSection ───────────────────────────────────────────────────────

function CollapsibleSection({
  children,
  expanded,
  maxCollapsedHeight = 'max-h-24',
}: {
  children: React.ReactNode;
  expanded: boolean;
  maxCollapsedHeight?: string;
}) {
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        expanded ? 'max-h-[9999px]' : maxCollapsedHeight
      }`}
    >
      {children}
    </div>
  );
}

// ─── GuestStepper ─────────────────────────────────────────────────────────────

function GuestStepper({
  value,
  min = 1,
  max = 10,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-11 h-11 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-700 disabled:opacity-30 active:scale-95 transition-transform"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-xl font-bold text-slate-900 w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-11 h-11 rounded-full border-2 border-brand bg-brand-light flex items-center justify-center text-brand-600 disabled:opacity-30 active:scale-95 transition-transform"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Mobile Hero Gallery ──────────────────────────────────────────────────────

function MobileHeroGallery({
  photos,
  name,
  avgRating,
  reviewCount,
  addressCity,
  addressCountry,
  isNl,
}: {
  photos: Property['photos'];
  name: string;
  avgRating?: number | null;
  reviewCount?: number;
  addressCity?: string;
  addressCountry: string;
  isNl: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.offsetWidth);
    setIndex(i);
  }, []);

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
  };

  if (!photos.length) return null;

  return (
    <>
      {/* ── Mobile hero (hidden on desktop) ── */}
      <div className="relative lg:hidden" style={{ height: '65vw', maxHeight: 420 }}>
        {/* Swipeable photo strip */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full h-full snap-x snap-mandatory overflow-x-scroll"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {photos.map((p, i) => (
            <div key={p.id} className="relative snap-start flex-shrink-0 w-full h-full">
              <Image
                src={p.url}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Photo counter top-right */}
        <button
          onClick={() => setShowAll(true)}
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs font-medium px-2.5 py-1.5 rounded-full backdrop-blur-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          {index + 1}/{photos.length}
        </button>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`rounded-full transition-all ${i === index ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Property info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
          <h1 className="text-xl font-extrabold text-white leading-tight drop-shadow-sm">{name}</h1>
          <div className="flex items-center justify-between mt-1">
            {addressCity && (
              <p className="flex items-center gap-1 text-white/80 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {addressCity}, {addressCountry}
              </p>
            )}
            {avgRating != null && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-white font-bold text-sm">{avgRating}</span>
                {reviewCount ? <span className="text-white/70 text-xs">({reviewCount})</span> : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop hero grid (hidden on mobile) ── */}
      <div className="hidden lg:block max-w-6xl mx-auto px-4 pt-6">
        <div className="relative">
          <div
            className="grid gap-2 rounded-2xl overflow-hidden cursor-pointer"
            style={{ gridTemplateColumns: '3fr 2fr', height: 420 }}
            onClick={() => setShowAll(true)}
          >
            {/* Main large photo */}
            <div className="relative">
              <Image src={photos[0]?.url ?? ''} alt={name} fill className="object-cover" priority sizes="60vw" />
            </div>
            {/* Right: 2x2 grid */}
            <div className="grid grid-cols-2 grid-rows-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative overflow-hidden">
                  {photos[i] ? (
                    <Image src={photos[i].url} alt={`${name} ${i + 1}`} fill className="object-cover" sizes="20vw" />
                  ) : (
                    <div className="w-full h-full bg-slate-100" />
                  )}
                  {/* Overlay on last cell */}
                  {i === 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                        <Camera className="w-4 h-4" />
                        {isNl ? "Alle foto's" : 'All photos'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* "Alle foto's bekijken" button overlay */}
          <button
            onClick={() => setShowAll(true)}
            className="absolute bottom-4 right-4 bg-white text-slate-800 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-colors"
          >
            <Camera className="w-4 h-4" />
            {isNl ? "Alle foto's bekijken" : 'View all photos'}
          </button>
        </div>
      </div>

      {/* ── Fullscreen gallery modal ── */}
      {showAll && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 shrink-0">
            <span className="text-white/70 text-sm">{index + 1} / {photos.length}</span>
            <button onClick={() => setShowAll(false)} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 flex snap-x snap-mandatory overflow-x-scroll"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {photos.map((p, i) => (
              <div key={p.id} className="snap-start flex-shrink-0 w-full h-full relative flex items-center justify-center">
                <Image src={p.url} alt={`${name} ${i + 1}`} fill className="object-contain" sizes="100vw" />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 p-4 shrink-0">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`rounded-full transition-all ${i === index ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Touch date-range picker ──────────────────────────────────────────────────

function TouchDateRangePicker({
  checkIn,
  checkOut,
  onCheckIn,
  onCheckOut,
  unavailableDates,
  locale,
}: {
  checkIn: string;
  checkOut: string;
  onCheckIn: (v: string) => void;
  onCheckOut: (v: string) => void;
  unavailableDates?: Set<string>;
  locale: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const isNl = locale === 'nl';

  const monthName = new Date(year, month, 1).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDayTap = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d < today) return;
    if (unavailableDates?.has(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onCheckIn(dateStr);
      onCheckOut('');
    } else {
      if (dateStr <= checkIn) {
        onCheckIn(dateStr);
        onCheckOut('');
      } else {
        onCheckOut(dateStr);
      }
    }
  };

  const inRange = (dateStr: string) =>
    checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

  const isStart = (dateStr: string) => dateStr === checkIn;
  const isEnd = (dateStr: string) => dateStr === checkOut;

  const dayLabels = isNl
    ? ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const phase = !checkIn || (checkIn && checkOut)
    ? (isNl ? 'Selecteer incheckdatum' : 'Select check-in date')
    : (isNl ? 'Selecteer uitcheckdatum' : 'Select check-out date');

  return (
    <div className="select-none">
      <p className="text-xs font-semibold text-brand mb-3 text-center uppercase tracking-wide">{phase}</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="font-semibold text-slate-900 capitalize text-base">{monthName}</span>
        <button
          onClick={nextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const d = new Date(dateStr);
          const isPast = d < today;
          const isUnavail = unavailableDates?.has(dateStr);
          const start = isStart(dateStr);
          const end = isEnd(dateStr);
          const range = inRange(dateStr);

          return (
            <button
              key={day}
              type="button"
              disabled={isPast || isUnavail}
              onClick={() => handleDayTap(dateStr)}
              className={[
                'relative flex items-center justify-center text-sm font-medium py-3 transition-colors',
                'disabled:cursor-not-allowed',
                isPast ? 'text-slate-300' : '',
                isUnavail && !isPast ? 'text-red-300 line-through' : '',
                start || end
                  ? 'text-white z-10'
                  : range
                  ? 'text-brand-600'
                  : !isPast && !isUnavail
                  ? 'text-slate-800 hover:bg-brand-light rounded-lg active:scale-95'
                  : '',
              ].join(' ')}
            >
              {/* Range background */}
              {range && (
                <span className="absolute inset-0 bg-brand-light" />
              )}
              {/* Start cap */}
              {start && (
                <>
                  {checkOut && <span className="absolute inset-y-0 right-0 w-1/2 bg-brand-light" />}
                  <span className="absolute inset-0 bg-brand rounded-lg" />
                </>
              )}
              {/* End cap */}
              {end && (
                <>
                  <span className="absolute inset-y-0 left-0 w-1/2 bg-brand-light" />
                  <span className="absolute inset-0 bg-brand rounded-lg" />
                </>
              )}
              <span className="relative z-10">{day}</span>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {checkIn && checkOut && (
        <div className="mt-4 bg-brand-light rounded-xl px-4 py-3 text-center">
          <p className="text-sm font-semibold text-brand-600">
            {fmt(checkIn, locale)} → {fmt(checkOut, locale)}
            <span className="text-brand font-normal ml-2">
              ({nightsBetween(checkIn, checkOut)} {isNl ? 'nachten' : 'nights'})
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Availability Calendar (desktop / read-only) ──────────────────────────────

function AvailabilityCalendar({ roomId, locale }: { roomId: string | null; locale: string }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data } = useQuery<{ unavailableDates: string[] }>({
    queryKey: ['availability', roomId, startDate],
    queryFn: () =>
      api.get('/availability', { params: { roomId, startDate, endDate } }).then(r => r.data?.data ?? r.data),
    enabled: !!roomId,
  });

  const unavailable = new Set(data?.unavailableDates ?? []);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const isNl = locale === 'nl';

  const monthName = new Date(year, month, 1).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const days = isNl ? ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <span className="font-semibold text-slate-900 capitalize">{monthName}</span>
        <button
          onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map(d => <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = new Date(dateStr) < today;
          const isUnavail = unavailable.has(dateStr);
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg font-medium
                ${isPast ? 'text-slate-300' : isUnavail ? 'bg-red-50 text-red-400 line-through' : 'text-slate-700'}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      {roomId && (
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
            {isNl ? 'Beschikbaar' : 'Available'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" />
            {isNl ? 'Bezet' : 'Unavailable'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Desktop booking widget ───────────────────────────────────────────────────

function BookingWidget({
  selectedRoom,
  checkIn,
  checkOut,
  numGuests,
  onCheckIn,
  onCheckOut,
  onGuests,
  onBook,
  locale,
  t,
}: {
  selectedRoom: Room | null;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  onCheckIn: (v: string) => void;
  onCheckOut: (v: string) => void;
  onGuests: (v: number) => void;
  onBook: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const nights = nightsBetween(checkIn, checkOut);
  const total = selectedRoom ? nights * Number(selectedRoom.pricePerNight) : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const isNl = locale === 'nl';

  const [guestsOpen, setGuestsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Price + rating header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-extrabold text-slate-900">
            €{selectedRoom ? fmtPrice(selectedRoom.pricePerNight) : '–'}
          </span>
          <span className="text-slate-500 text-sm">{isNl ? 'per nacht' : 'per night'}</span>
        </div>
        {selectedRoom && <p className="text-xs text-slate-400">{selectedRoom.name}</p>}
      </div>

      {/* Date pickers */}
      <div className="grid grid-cols-2 border-b border-slate-100">
        <div className="p-4 border-r border-slate-100 relative">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            {isNl ? 'Check-in' : 'Check-in'}
          </p>
          {checkIn ? (
            <p className="text-sm font-semibold text-slate-900">
              {new Date(checkIn).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          ) : (
            <p className="text-sm text-slate-400">{isNl ? 'Selecteer datum' : 'Select date'}</p>
          )}
          <input
            type="date"
            value={checkIn}
            min={todayStr}
            onChange={e => onCheckIn(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <div className="p-4 relative">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            {isNl ? 'Check-out' : 'Check-out'}
          </p>
          {checkOut ? (
            <p className="text-sm font-semibold text-slate-900">
              {new Date(checkOut).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          ) : (
            <p className="text-sm text-slate-400">{isNl ? 'Selecteer datum' : 'Select date'}</p>
          )}
          <input
            type="date"
            value={checkOut}
            min={checkIn || todayStr}
            onChange={e => onCheckOut(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Guests */}
      <div className="border-b border-slate-100">
        <button
          type="button"
          onClick={() => setGuestsOpen(o => !o)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{isNl ? 'Gasten' : 'Guests'}</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {numGuests} {numGuests === 1 ? (isNl ? 'gast' : 'guest') : (isNl ? 'gasten' : 'guests')}
            </p>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${guestsOpen ? 'rotate-180' : ''}`} />
        </button>
        {guestsOpen && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{isNl ? 'Gasten' : 'Guests'}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onGuests(Math.max(1, numGuests - 1))}
                  disabled={numGuests <= 1}
                  className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center font-bold text-slate-900">{numGuests}</span>
                <button
                  type="button"
                  onClick={() => onGuests(Math.min(selectedRoom?.maxGuests ?? 10, numGuests + 1))}
                  disabled={numGuests >= (selectedRoom?.maxGuests ?? 10)}
                  className="w-8 h-8 rounded-full border border-brand bg-brand-light flex items-center justify-center disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5 text-brand" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      {selectedRoom && nights > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-sm space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>€{fmtPrice(selectedRoom.pricePerNight)} × {nights} {nights === 1 ? (isNl ? 'nacht' : 'night') : (isNl ? 'nachten' : 'nights')}</span>
            <span>€{total.toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
            <span>Totaal</span>
            <span>€{total.toFixed(0)}</span>
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        <button
          onClick={onBook}
          disabled={!selectedRoom}
          className="w-full bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          {isNl ? 'Boek nu' : 'Book now'}
        </button>
        <p className="text-center text-xs text-slate-400">
          {isNl ? 'Je wordt nog niet meteen belast' : 'You won\'t be charged yet'}
        </p>
      </div>
    </div>
  );
}

// ─── Mobile booking sheet ─────────────────────────────────────────────────────

function BookingSheet({
  open,
  onClose,
  property,
  rooms,
  checkIn,
  checkOut,
  numGuests,
  selectedRoom,
  onCheckIn,
  onCheckOut,
  onGuests,
  onSelectRoom,
  initialStep,
  locale,
  t,
}: {
  open: boolean;
  onClose: () => void;
  property: Property;
  rooms: Room[];
  checkIn: string;
  checkOut: string;
  numGuests: number;
  selectedRoom: Room | null;
  onCheckIn: (v: string) => void;
  onCheckOut: (v: string) => void;
  onGuests: (v: number) => void;
  onSelectRoom: (r: Room) => void;
  initialStep: number;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [step, setStep] = useState(initialStep);
  const [success, setSuccess] = useState(false);
  const isNl = locale === 'nl';
  const nights = nightsBetween(checkIn, checkOut);
  const total = selectedRoom ? nights * Number(selectedRoom.pricePerNight) : 0;

  // Sync step when sheet opens
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setSuccess(false);
    }
  }, [open, initialStep]);

  // Availability for selected room (step 1)
  const { data: availData } = useQuery<{ unavailableDates: string[] }>({
    queryKey: ['availability', selectedRoom?.id ?? rooms[0]?.id, 'sheet'],
    queryFn: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
      const roomId = selectedRoom?.id ?? rooms[0]?.id;
      return api.get('/availability', { params: { roomId, startDate: start, endDate: end } }).then(r => r.data?.data ?? r.data);
    },
    enabled: open,
  });
  const unavailSet = new Set(availData?.unavailableDates ?? []);

  // Booking form
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: selectedRoom?.id ?? '',
      checkIn,
      checkOut,
      numGuests,
    },
  });

  // Keep roomId in sync with selectedRoom so zod validation passes
  useEffect(() => {
    if (selectedRoom?.id) {
      setValue('roomId', selectedRoom.id, { shouldValidate: false });
    }
  }, [selectedRoom?.id, setValue]);

  const submitMutation = useMutation({
    mutationFn: (data: BookingForm) =>
      api.post('/public/bookings', {
        ...data,
        roomId: selectedRoom!.id,
        checkIn,
        checkOut,
        numGuests,
      }),
    onSuccess: () => setSuccess(true),
  });

  const onSubmit: SubmitHandler<BookingForm> = (data) => submitMutation.mutate(data);

  const canProceedStep1 = checkIn && checkOut && nightsBetween(checkIn, checkOut) > 0;
  const canProceedStep2 = selectedRoom != null;

  const stepLabel = isNl
    ? [`Selecteer data`, `Kies kamer`, `Jouw gegevens`][step - 1]
    : [`Select dates`, `Choose room`, `Your details`][step - 1];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet — slides up on mobile, centered modal on desktop */}
      <div
        className={[
          'fixed z-50 bg-white shadow-2xl transition-all duration-300 ease-out',
          // Mobile: slide up from bottom
          'inset-x-0 bottom-0 rounded-t-3xl',
          open ? 'translate-y-0' : 'translate-y-full',
          // Desktop: centered modal, ignore slide
          'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:w-full lg:max-w-lg',
          !open ? 'lg:opacity-0 lg:pointer-events-none lg:scale-95' : 'lg:opacity-100 lg:scale-100',
        ].join(' ')}
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && !success && (
              <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {!success ? `${isNl ? 'Stap' : 'Step'} ${step} ${isNl ? 'van' : 'of'} 3` : ''}
              </p>
              <p className="font-bold text-slate-900 text-sm">{success ? (isNl ? 'Aanvraag verstuurd!' : 'Request sent!') : stepLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 110px)' }}>

          {/* ── SUCCESS ── */}
          {success && (
            <div className="flex flex-col items-center justify-center p-10 text-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t('successTitle')}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{t('successDescription')}</p>
              <button onClick={onClose} className="mt-2 bg-brand text-white font-semibold px-8 py-3 rounded-xl w-full">
                {isNl ? 'Sluiten' : 'Close'}
              </button>
            </div>
          )}

          {/* ── STEP 1: DATES ── */}
          {!success && step === 1 && (
            <div className="p-5 space-y-4">
              <TouchDateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckIn={onCheckIn}
                onCheckOut={onCheckOut}
                unavailableDates={unavailSet}
                locale={locale}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-brand hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
              >
                {isNl ? 'Volgende' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: ROOM + GUESTS ── */}
          {!success && step === 2 && (
            <div className="p-5 space-y-5">
              {/* Room cards */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  {isNl ? 'Kies een kamer' : 'Choose a room'}
                </p>
                <div className="space-y-3">
                  {rooms.map(room => {
                    const desc = isNl ? room.descriptionNl || room.descriptionEn : room.descriptionEn || room.descriptionNl;
                    const photo = room.photos?.[0];
                    const isSelected = selectedRoom?.id === room.id;
                    const nightsCount = nightsBetween(checkIn, checkOut);

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => onSelectRoom(room)}
                        className={`w-full text-left border-2 rounded-2xl overflow-hidden transition-all active:scale-[0.98] ${isSelected ? 'border-brand shadow-md' : 'border-slate-200'}`}
                      >
                        <div className="flex gap-0">
                          {photo && (
                            <div className="relative w-28 h-28 shrink-0">
                              <Image src={photo.url} alt={room.name} fill className="object-cover" sizes="112px" />
                            </div>
                          )}
                          <div className="p-3 flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-slate-900 text-sm leading-tight">{room.name}</p>
                              <div className="text-right shrink-0">
                                <p className="font-extrabold text-slate-900">€{fmtPrice(room.pricePerNight)}</p>
                                <p className="text-xs text-slate-400">{isNl ? '/nacht' : '/night'}</p>
                              </div>
                            </div>
                            {desc && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{desc}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.maxGuests}</span>
                              {room.beds && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{room.beds}</span>}
                              {room.sqm && <span className="flex items-center gap-1"><SquareStack className="w-3 h-3" />{room.sqm}m²</span>}
                            </div>
                            {nightsCount > 0 && isSelected && (
                              <p className="text-xs font-semibold text-brand mt-1.5">
                                €{fmtPrice(nightsCount * Number(room.pricePerNight))} {isNl ? 'totaal' : 'total'}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-brand-light border-t border-brand-light px-3 py-1.5 flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                            <Check className="w-3 h-3" />
                            {isNl ? 'Geselecteerd' : 'Selected'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guests stepper */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{isNl ? 'Aantal gasten' : 'Number of guests'}</p>
                    {selectedRoom && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isNl ? `Max. ${selectedRoom.maxGuests} gasten` : `Max. ${selectedRoom.maxGuests} guests`}
                      </p>
                    )}
                  </div>
                  <GuestStepper
                    value={numGuests}
                    min={1}
                    max={selectedRoom?.maxGuests ?? 10}
                    onChange={onGuests}
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="w-full bg-brand hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
              >
                {isNl ? 'Volgende' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 3: GUEST DETAILS ── */}
          {!success && step === 3 && (
            <div className="p-5">
              {/* Summary card */}
              {selectedRoom && (
                <div className="bg-slate-50 rounded-2xl p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedRoom.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmt(checkIn, locale)} → {fmt(checkOut, locale)} · {numGuests} {numGuests === 1 ? t('guest') : t('guestsPlural')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900">€{total.toFixed(0)}</p>
                      <p className="text-xs text-slate-400">{nights} {isNl ? 'nachten' : 'nights'}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register('roomId')} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('firstName')}</label>
                    <input
                      {...register('guestFirstName')}
                      autoComplete="given-name"
                      placeholder="Jan"
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    {errors.guestFirstName && <p className="text-red-500 text-xs mt-1">{errors.guestFirstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('lastName')}</label>
                    <input
                      {...register('guestLastName')}
                      autoComplete="family-name"
                      placeholder="de Vries"
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    {errors.guestLastName && <p className="text-red-500 text-xs mt-1">{errors.guestLastName.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('email')}</label>
                  <input
                    {...register('guestEmail')}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="jan@example.nl"
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('phone')} <span className="text-slate-400 font-normal">({t('optional')})</span>
                  </label>
                  <input
                    {...register('guestPhone')}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+31 6 12 34 56 78"
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('message')} <span className="text-slate-400 font-normal">({t('optional')})</span>
                  </label>
                  <textarea
                    {...register('guestMessage')}
                    rows={3}
                    placeholder={t('messagePlaceholder')}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  />
                </div>

                {submitMutation.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">
                      {(submitMutation.error as any)?.response?.data?.message || t('bookingError')}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors"
                >
                  {submitMutation.isPending
                    ? (isNl ? 'Versturen...' : 'Sending...')
                    : (isNl ? 'Verstuur aanvraag' : 'Send request')}
                </button>

                <div className="flex items-center justify-center gap-4 pt-1 pb-4">
                  {[
                    isNl ? '0% commissie' : '0% commission',
                    isNl ? 'Gratis aanvragen' : 'Free request',
                    isNl ? 'Geen verplichting' : 'No obligation',
                  ].map(label => (
                    <span key={label} className="flex items-center gap-1 text-xs text-slate-500">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {label}
                    </span>
                  ))}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sticky book bar (mobile) ─────────────────────────────────────────────────

function StickyBookBar({
  selectedRoom,
  checkIn,
  checkOut,
  numGuests,
  onOpen,
  locale,
}: {
  selectedRoom: Room | null;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  onOpen: (step: number) => void;
  locale: string;
}) {
  const isNl = locale === 'nl';
  const nights = nightsBetween(checkIn, checkOut);
  const total = selectedRoom && nights > 0 ? nights * Number(selectedRoom.pricePerNight) : null;

  const hasRoom = !!selectedRoom;
  const hasDates = !!(checkIn && checkOut && nights > 0);
  const ready = hasRoom && hasDates;

  const handleTap = () => {
    if (!hasDates) onOpen(1);
    else if (!hasRoom) onOpen(2);
    else onOpen(3);
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {ready && total ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">€{total.toFixed(0)}</span>
                <span className="text-slate-400 text-xs">{isNl ? 'totaal' : 'total'}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {fmt(checkIn, locale)} → {fmt(checkOut, locale)} · {numGuests}
                {numGuests === 1 ? (isNl ? ' gast' : ' guest') : (isNl ? ' gasten' : ' guests')}
              </p>
            </>
          ) : hasDates && !hasRoom ? (
            <>
              <p className="font-semibold text-slate-900 text-sm">{isNl ? 'Kies een kamer' : 'Choose a room'}</p>
              <p className="text-xs text-slate-400">
                {fmt(checkIn, locale)} → {fmt(checkOut, locale)}
              </p>
            </>
          ) : selectedRoom && !hasDates ? (
            <>
              <p className="font-semibold text-slate-900 text-sm">{selectedRoom.name}</p>
              <p className="text-xs text-slate-400">
                {isNl ? 'Selecteer data' : 'Select dates'}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-900 text-sm">{isNl ? 'Gratis aanvragen' : 'Free to request'}</p>
              <p className="text-xs text-slate-400">
                {isNl ? '0% commissie · direct bij eigenaar' : '0% commission · direct with owner'}
              </p>
            </>
          )}
        </div>

        {/* Right: CTA */}
        <button
          onClick={handleTap}
          className={`shrink-0 font-bold py-3 px-5 rounded-xl text-white text-sm transition-all active:scale-95 ${
            ready ? 'bg-brand hover:bg-brand-600 shadow-lg shadow-brand/20' : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          {ready
            ? (isNl ? 'Boek nu' : 'Book now')
            : hasDates
            ? (isNl ? 'Kies kamer' : 'Choose room')
            : (isNl ? 'Bekijk data' : 'Select dates')}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  property: Property;
}

export function PropertyPageClient({ property }: Props) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const isNl = locale === 'nl';

  const photos = property.photos ?? [];
  const rooms = property.rooms ?? [];
  const reviews = property.reviews ?? [];

  const description = isNl
    ? property.descriptionNl || property.descriptionEn
    : property.descriptionEn || property.descriptionNl;

  const avgRating = property.avgRating;
  const reviewCount = property.reviewCount ?? 0;

  // Booking state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numGuests, setNumGuests] = useState(1);

  // Mobile sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState(1);

  // Share state
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData = {
      title: property.name,
      text: isNl
        ? `Bekijk ${property.name} op DirectBnB`
        : `Check out ${property.name} on DirectBnB`,
      url,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        // Clipboard not available
      }
    }
  }, [property.name, isNl]);


  // UI toggles
  const [descExpanded, setDescExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  const openSheet = useCallback((step: number) => {
    setSheetStep(step);
    setSheetOpen(true);
  }, []);

  const handleSelectRoom = useCallback((room: Room) => {
    setSelectedRoom(room);
    setNumGuests(Math.min(numGuests, room.maxGuests));
  }, [numGuests]);

  const handleBook = () => {
    if (!selectedRoom) return;
    openSheet(3);
  };

  // Map coordinates — use stored lat/lng or geocode via Nominatim
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(
    property.latitude && property.longitude
      ? { lat: Number(property.latitude), lon: Number(property.longitude) }
      : null,
  );

  useEffect(() => {
    if (mapCoords) return; // Already have coordinates from DB
    const address = [property.addressStreet, property.addressCity, property.addressCountry]
      .filter(Boolean)
      .join(', ');
    if (!address) return;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'nl' } },
    )
      .then((r) => r.json())
      .then((results: any[]) => {
        if (results[0]) {
          setMapCoords({ lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) });
        }
      })
      .catch(() => {}); // Fail silently — map will just skip the marker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avg sub-scores
  const avgCleanliness = useMemo(() => {
    const rs = reviews.filter(r => r.cleanlinessRating);
    return rs.length ? Math.round(rs.reduce((s, r) => s + (r.cleanlinessRating ?? 0), 0) / rs.length * 10) / 10 : null;
  }, [reviews]);
  const avgLocation = useMemo(() => {
    const rs = reviews.filter(r => r.locationRating);
    return rs.length ? Math.round(rs.reduce((s, r) => s + (r.locationRating ?? 0), 0) / rs.length * 10) / 10 : null;
  }, [reviews]);
  const avgValue = useMemo(() => {
    const rs = reviews.filter(r => r.valueRating);
    return rs.length ? Math.round(rs.reduce((s, r) => s + (r.valueRating ?? 0), 0) / rs.length * 10) / 10 : null;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            Direct<span className="text-brand">BnB</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
            >
              {shareCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">{isNl ? 'Gekopieerd!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  {isNl ? 'Delen' : 'Share'}
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile hero gallery + Desktop hero grid ── */}
      <MobileHeroGallery
        photos={photos}
        name={property.name}
        avgRating={avgRating}
        reviewCount={reviewCount}
        addressCity={property.addressCity}
        addressCountry={property.addressCountry}
        isNl={isNl}
      />

      {/* ── Main content ── */}
      {/* pb-28 on mobile = space for sticky bottom bar */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-28 lg:pb-10">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── LEFT: Property details ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title + meta (desktop only — mobile shows in hero overlay) */}
            <div className="hidden lg:block pb-6 border-b border-slate-100">
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{property.name}</h1>
              {property.addressCity && (
                <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {property.addressCity}, {property.addressCountry}
                </p>
              )}
              {avgRating != null && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={avgRating} size="md" />
                  <span className="font-bold text-slate-900">{avgRating}</span>
                  <span className="text-slate-400 text-sm">({reviewCount} {isNl ? 'beoordelingen' : 'reviews'})</span>
                </div>
              )}
              {property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {property.amenities.slice(0, 5).map(key => {
                    const cfg = AMENITIES[key];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <span key={key} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                        <Icon className="w-3.5 h-3.5 text-brand" />
                        {isNl ? cfg.labelNl : cfg.labelEn}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile: title + rating strip */}
            <div className="lg:hidden pt-1">
              {avgRating != null && (
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={avgRating} size="sm" />
                  <span className="font-bold text-slate-900 text-sm">{avgRating}</span>
                  <span className="text-slate-400 text-xs">({reviewCount})</span>
                </div>
              )}
              {/* Quick stats strip */}
              {rooms.length > 0 && (
                <div className="flex items-center gap-4 py-3 border-y border-slate-100">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <BedDouble className="w-4 h-4 text-brand" />
                    <span>{rooms.length} {rooms.length === 1 ? (isNl ? 'kamer' : 'room') : (isNl ? 'kamers' : 'rooms')}</span>
                  </div>
                  {rooms[0]?.maxGuests && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-brand" />
                      <span>
                        {isNl ? 'Tot' : 'Up to'} {Math.max(...rooms.map(r => r.maxGuests))} {isNl ? 'gasten' : 'guests'}
                      </span>
                    </div>
                  )}
                  {property.amenities.includes('breakfast') && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Coffee className="w-4 h-4 text-brand" />
                      <span>{isNl ? 'Ontbijt' : 'Breakfast'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <section className="border-b border-slate-100 pb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">{t('aboutProperty')}</h2>
                <CollapsibleSection expanded={descExpanded} maxCollapsedHeight="max-h-[5.5rem]">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm lg:text-base">
                    {description}
                  </p>
                </CollapsibleSection>
                {description.length > 200 && (
                  <button
                    onClick={() => setDescExpanded(e => !e)}
                    className="flex items-center gap-1 text-brand text-sm font-semibold mt-3"
                  >
                    {descExpanded ? (isNl ? 'Minder tonen' : 'Show less') : (isNl ? 'Lees meer' : 'Read more')}
                    {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </section>
            )}

            {/* ── Amenities (Faciliteiten) — BEFORE rooms ── */}
            {property.amenities.length > 0 && (
              <section className="border-b border-slate-100 pb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{isNl ? 'Faciliteiten' : 'Amenities'}</h2>
                <CollapsibleSection expanded={amenitiesExpanded} maxCollapsedHeight="max-h-48">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {property.amenities.map(key => {
                      const cfg = AMENITIES[key];
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return (
                        <div key={key} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl">
                          <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-brand" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{isNl ? cfg.labelNl : cfg.labelEn}</span>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>
                {property.amenities.length > 6 && (
                  <button
                    onClick={() => setAmenitiesExpanded(e => !e)}
                    className="flex items-center gap-1.5 text-brand text-sm font-semibold mt-4"
                  >
                    {amenitiesExpanded
                      ? (isNl ? 'Minder tonen' : 'Show less')
                      : (isNl ? `Toon alle ${property.amenities.length} faciliteiten` : `Show all ${property.amenities.length} amenities`)}
                    {amenitiesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </section>
            )}

            {/* ── Rooms ── */}
            <section className="border-b border-slate-100 pb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{isNl ? 'Kies je kamer' : 'Choose your room'}</h2>

              {/* Mobile: horizontal scroll cards */}
              <div className="lg:hidden -mx-4 px-4">
                <div
                  className="flex gap-3 overflow-x-scroll snap-x snap-mandatory pb-3"
                  style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                >
                  {rooms.map(room => {
                    const roomDesc = isNl ? room.descriptionNl || room.descriptionEn : room.descriptionEn || room.descriptionNl;
                    const isSelected = selectedRoom?.id === room.id;
                    const photo = room.photos?.[0];

                    return (
                      <div
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`snap-start flex-shrink-0 w-72 border-2 rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${
                          isSelected ? 'border-brand shadow-md' : 'border-slate-200'
                        }`}
                      >
                        {photo && (
                          <div className="relative h-40">
                            <Image src={photo.url} alt={room.name} fill className="object-cover" sizes="288px" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-900 text-base leading-tight">{room.name}</h3>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-extrabold text-slate-900">€{fmtPrice(room.pricePerNight)}</p>
                              <p className="text-xs text-slate-400">{t('perNight')}</p>
                            </div>
                          </div>
                          {roomDesc && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{roomDesc}</p>}
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.maxGuests}</span>
                            {room.beds && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{room.beds}</span>}
                            {room.sqm && <span>{room.sqm}m²</span>}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); handleSelectRoom(room); openSheet(1); }}
                            className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                              isSelected
                                ? 'bg-brand text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected
                              ? (isNl ? '✓ Geselecteerd — Boek nu' : '✓ Selected — Book now')
                              : (isNl ? 'Selecteer kamer' : 'Select room')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: vertical stack */}
              <div className="hidden lg:block space-y-4">
                {rooms.map(room => {
                  const roomDesc = isNl ? room.descriptionNl || room.descriptionEn : room.descriptionEn || room.descriptionNl;
                  const isSelected = selectedRoom?.id === room.id;
                  const coverPhoto = room.photos?.[0];

                  return (
                    <div
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={`border-2 rounded-2xl overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'border-brand shadow-md' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex">
                        {coverPhoto && (
                          <div className="relative w-48 shrink-0">
                            <Image src={coverPhoto.url} alt={room.name} fill className="object-cover" sizes="192px" />
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-slate-900 text-lg">{room.name}</h3>
                                {roomDesc && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{roomDesc}</p>}
                                <div className="flex flex-wrap gap-3 mt-2">
                                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="w-3.5 h-3.5" />{room.maxGuests} {isNl ? 'gasten' : 'guests'}</span>
                                  {room.beds && <span className="flex items-center gap-1.5 text-xs text-slate-500"><BedDouble className="w-3.5 h-3.5" />{room.beds} {room.beds === 1 ? (isNl ? 'bed' : 'bed') : (isNl ? 'bedden' : 'beds')}</span>}
                                  {room.sqm && <span className="flex items-center gap-1.5 text-xs text-slate-500"><SquareStack className="w-3.5 h-3.5" />{room.sqm} m²</span>}
                                  {room.minStay > 1 && <span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="w-3.5 h-3.5" />{isNl ? `Min. ${room.minStay} nachten` : `Min. ${room.minStay} nights`}</span>}
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-3">
                                <div>
                                  <p className="text-2xl font-extrabold text-slate-900">€{fmtPrice(room.pricePerNight)}</p>
                                  <p className="text-xs text-slate-400">{t('perNight')}</p>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); handleSelectRoom(room); openSheet(1); }}
                                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
                                    isSelected
                                      ? 'bg-brand text-white'
                                      : 'bg-brand hover:bg-brand-600 text-white'
                                  }`}
                                >
                                  {isSelected ? (isNl ? '✓ Geselecteerd' : '✓ Selected') : (isNl ? 'Selecteer' : 'Select')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-brand-light border-t border-brand-light px-5 py-2.5 flex items-center gap-2 text-xs text-brand-600 font-medium">
                          <Check className="w-3.5 h-3.5" />
                          {isNl ? 'Geselecteerd' : 'Selected'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Availability calendar ── */}
            <section className="border-b border-slate-100 pb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">{isNl ? 'Beschikbaarheid' : 'Availability'}</h2>
              {!selectedRoom && (
                <p className="text-sm text-slate-400 mb-4">
                  {isNl ? 'Selecteer een kamer om beschikbaarheid te zien.' : 'Select a room to view availability.'}
                </p>
              )}
              <AvailabilityCalendar roomId={selectedRoom?.id ?? rooms[0]?.id ?? null} locale={locale} />
            </section>

            {/* ── Reviews ── */}
            <section className="border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-900">{isNl ? 'Gastenreviews' : 'Guest reviews'}</h2>
                {avgRating && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-sm">{(avgRating * 2).toFixed(1)}</span>
                    <span className="text-slate-400 text-xs">({reviewCount} {isNl ? 'reviews' : 'reviews'})</span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <>
                  <CollapsibleSection expanded={reviewsExpanded} maxCollapsedHeight="max-h-[500px]">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {reviews.slice(0, reviewsExpanded ? 20 : 6).map(review => (
                        <div key={review.id} className="border border-slate-100 rounded-2xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-brand font-bold text-sm shrink-0">
                                {review.guestFirstName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{review.guestFirstName}</p>
                                <p className="text-xs text-slate-400">
                                  {new Date(review.createdAt).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB', { month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="bg-slate-800 text-white text-sm font-bold w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                              {Math.round(review.rating * 2)}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                  {reviews.length > 6 && (
                    <button
                      onClick={() => setReviewsExpanded(e => !e)}
                      className="flex items-center gap-1.5 text-brand text-sm font-semibold mt-4"
                    >
                      {reviewsExpanded
                        ? (isNl ? 'Minder tonen' : 'Show less')
                        : (isNl ? `Bekijk alle ${reviewCount} reviews` : `View all ${reviewCount} reviews`)}
                      {reviewsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-5 text-slate-400">
                  <MessageSquare className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{isNl ? 'Nog geen beoordelingen. Wees de eerste!' : 'No reviews yet. Be the first!'}</p>
                </div>
              )}
            </section>

            {/* ── Ervaringen (Experiences) ── */}
            {property.showExtraServices !== false && <section className="border-b border-slate-100 pb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{isNl ? 'Ontdek extra ervaringen' : 'Discover extra experiences'}</h2>
              <p className="text-sm text-slate-400 mb-4">{isNl ? 'Maak je verblijf nog specialer' : 'Make your stay even more special'}</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { emoji: '🛶', title: isNl ? 'Kanotocht door de plassen' : 'Canoe trip through the lakes', desc: isNl ? '2 uur begeleide kanotocht' : '2-hour guided canoe trip', price: 35 },
                  { emoji: '🚲', title: isNl ? 'Fietstocht Groene Hart' : 'Cycling Green Heart', desc: isNl ? 'E-bike huren incl. route' : 'E-bike rental incl. route', price: 25 },
                  { emoji: '🧘', title: isNl ? 'Yoga in de natuur' : 'Yoga in nature', desc: isNl ? 'Ochtend yoga op het terras' : 'Morning yoga on the terrace', price: 20 },
                ].map((exp) => (
                  <div key={exp.title} className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-2xl">
                      {exp.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{exp.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.desc}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">€{exp.price} <span className="text-xs font-normal text-slate-400">p.p.</span></span>
                      <button className="text-xs font-bold text-brand border border-brand px-3 py-1.5 rounded-lg hover:bg-brand-light transition-colors">
                        {isNl ? 'Toevoegen' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>}

            {/* ── Policies ── */}
            {(property.checkInTime || property.checkOutTime || property.cancellationPolicy) && (
              <section className="border-b border-slate-100 pb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{isNl ? 'Huisregels & beleid' : 'House rules & policies'}</h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {property.checkInTime && (
                    <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                      <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{isNl ? 'Inchecken' : 'Check-in'}</p>
                        <p className="font-semibold text-slate-900 text-sm">{isNl ? 'Vanaf' : 'From'} {property.checkInTime}</p>
                      </div>
                    </div>
                  )}
                  {property.checkOutTime && (
                    <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                      <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{isNl ? 'Uitchecken' : 'Check-out'}</p>
                        <p className="font-semibold text-slate-900 text-sm">{isNl ? 'Voor' : 'Before'} {property.checkOutTime}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { allowed: property.smokingAllowed, labelNl: 'Roken toegestaan', labelEn: 'Smoking allowed', Icon: Cigarette },
                    { allowed: property.petsAllowed, labelNl: 'Huisdieren welkom', labelEn: 'Pets welcome', Icon: PawPrint },
                    { allowed: property.childrenAllowed, labelNl: 'Kinderen welkom', labelEn: 'Children welcome', Icon: Baby },
                  ].map(({ allowed, labelNl, labelEn, Icon }) => (
                    <span
                      key={labelNl}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border ${
                        allowed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {isNl ? labelNl : labelEn}
                    </span>
                  ))}
                </div>

                {property.cancellationPolicy && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">{isNl ? 'Annuleringsbeleid' : 'Cancellation policy'}</p>
                    <p className="text-sm text-amber-800">{property.cancellationPolicy}</p>
                  </div>
                )}
              </section>
            )}

            {/* ── Location ── */}
            {property.addressCity && (
              <section className="border-b border-slate-100 pb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-2">{isNl ? 'Locatie' : 'Location'}</h2>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{property.addressCity}, {property.addressCountry}</span>
                </div>
                {property.addressStreet && (
                  <p className="text-sm text-slate-400 mb-4">{property.addressStreet}</p>
                )}
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-52 mb-3">
                  {mapCoords ? (
                    <iframe
                      title="Location map"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        mapCoords.lon - 0.012
                      },${mapCoords.lat - 0.008},${mapCoords.lon + 0.012},${
                        mapCoords.lat + 0.008
                      }&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lon}`}
                      style={{ border: 0 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">
                          {property.addressCity}, {property.addressCountry}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.addressStreet ?? ''} ${property.addressCity}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Google Maps →
                </a>
              </section>
            )}

            {/* ── Host profile ── */}
            <section>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white text-xl font-bold shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    {isNl ? 'Eigenaar' : 'Host'}: {property.name.split(' ')[0]}
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span>{isNl ? 'Lid sinds' : 'Member since'} {new Date(property.createdAt).getFullYear()}</span>
                    {reviewCount > 0 && <span>{reviewCount} reviews</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    {isNl
                      ? `Welkom! Ik ben de eigenaar van ${property.name} en zorg graag dat uw verblijf perfect is. Of u nu lokale tips zoekt of vragen heeft, ik help u graag.`
                      : `Welcome! I'm the owner of ${property.name} and love making sure your stay is perfect. Whether you need local tips or have questions, I'm happy to help.`}
                  </p>
                  <button className="mt-4 flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    {isNl ? `Contact met eigenaar` : 'Contact host'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT: Desktop booking widget ── */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <BookingWidget
                selectedRoom={selectedRoom}
                checkIn={checkIn}
                checkOut={checkOut}
                numGuests={numGuests}
                onCheckIn={setCheckIn}
                onCheckOut={setCheckOut}
                onGuests={setNumGuests}
                onBook={handleBook}
                locale={locale}
                t={t}
              />

              {selectedRoom && (
                <div className="mt-4">
                  <AvailabilityCalendar roomId={selectedRoom.id} locale={locale} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA banner ── */}
      <div className="hidden lg:block bg-brand-light border-t border-brand-light/50">
        <div className="max-w-6xl mx-auto px-4 py-10 flex items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{isNl ? 'Reserveer jouw verblijf' : 'Reserve your stay'}</h3>
            <p className="text-slate-500 text-sm mt-1">
              {isNl ? 'Ontsnap naar rust en natuur. Beschikbare data vullen snel!' : 'Escape to peace and nature. Available dates fill up fast!'}
            </p>
          </div>
          <button
            onClick={() => openSheet(1)}
            className="shrink-0 bg-brand hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-brand/20"
          >
            {isNl ? 'Boek nu →' : 'Book now →'}
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white mt-0">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Col 1: B&B name + address */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">{property.name}</h4>
              {property.addressStreet && (
                <p className="text-slate-400 text-sm">{property.addressStreet}</p>
              )}
              {property.addressCity && (
                <p className="text-slate-400 text-sm">
                  {property.addressZip ? `${property.addressZip} ` : ''}{property.addressCity}
                </p>
              )}
              {property.addressCountry && (
                <p className="text-slate-400 text-sm">{property.addressCountry}</p>
              )}
              {(property.addressCity || property.addressStreet) && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [property.addressStreet, property.addressCity, property.addressCountry].filter(Boolean).join(', ')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-light transition-colors mt-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {isNl ? 'Bekijk op Google Maps' : 'View on Google Maps'}
                </a>
              )}
            </div>

            {/* Col 2: Check-in / check-out */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wide">
                {isNl ? 'Aankomst & vertrek' : 'Arrival & departure'}
              </h4>
              {property.checkInTime ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4 text-brand shrink-0" />
                  <span>{isNl ? `Inchecken vanaf ${property.checkInTime}` : `Check-in from ${property.checkInTime}`}</span>
                </div>
              ) : null}
              {property.checkOutTime ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays className="w-4 h-4 text-brand shrink-0" />
                  <span>{isNl ? `Uitchecken voor ${property.checkOutTime}` : `Check-out before ${property.checkOutTime}`}</span>
                </div>
              ) : null}
              {!property.checkInTime && !property.checkOutTime && (
                <p className="text-sm text-slate-500">{isNl ? 'Neem contact op voor tijden' : 'Contact host for times'}</p>
              )}
              <div className="pt-2 flex flex-wrap gap-2">
                {[
                  { key: 'smokingAllowed', val: property.smokingAllowed, labelNl: 'Roken toegestaan', labelEn: 'Smoking OK', Icon: Cigarette },
                  { key: 'petsAllowed', val: property.petsAllowed, labelNl: 'Huisdieren welkom', labelEn: 'Pets OK', Icon: PawPrint },
                  { key: 'childrenAllowed', val: property.childrenAllowed, labelNl: 'Kinderen welkom', labelEn: 'Children OK', Icon: Baby },
                ].filter(r => r.val).map(({ key, labelNl, labelEn, Icon }) => (
                  <span key={key} className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">
                    <Icon className="w-3 h-3" />
                    {isNl ? labelNl : labelEn}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 3: Rooms */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wide">
                {isNl ? 'Kamers' : 'Rooms'}
              </h4>
              {rooms.length > 0 ? (
                <div className="space-y-2">
                  {rooms.slice(0, 4).map(room => (
                    <div key={room.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 truncate pr-2">{room.name}</span>
                      <span className="text-white font-semibold shrink-0">
                        €{Number(room.pricePerNight).toFixed(0)}{isNl ? '/nacht' : '/night'}
                      </span>
                    </div>
                  ))}
                  {rooms.length > 4 && (
                    <p className="text-xs text-slate-500">
                      +{rooms.length - 4} {isNl ? 'meer' : 'more'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{isNl ? 'Geen kamers beschikbaar' : 'No rooms available'}</p>
              )}
            </div>

            {/* Col 4: DirectBnB + share */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-white tracking-tight">
                  Direct<span className="text-brand">BnB</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isNl
                  ? 'Direct reserveren bij de eigenaar — zonder commissie of tussenpersoon.'
                  : 'Book directly with the owner — no commission, no middleman.'}
              </p>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {shareCopied
                  ? <><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-green-400">{isNl ? 'Link gekopieerd!' : 'Link copied!'}</span></>
                  : <><Copy className="w-4 h-4" />{isNl ? 'Deel deze pagina' : 'Share this page'}</>
                }
              </button>
              <a
                href="https://directbnb.nl"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2"
              >
                <Globe className="w-3.5 h-3.5" />
                directbnb.nl
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} {property.name} · {isNl ? 'Alle rechten voorbehouden' : 'All rights reserved'}
            </p>
            <p className="text-xs text-slate-600">
              {isNl ? 'Aangedreven door' : 'Powered by'}{' '}
              <a href="https://directbnb.nl" className="text-brand hover:text-brand-light transition-colors font-medium">
                DirectBnB
              </a>
              {' '}— {isNl ? '0% commissie' : '0% commission'}
            </p>
          </div>
        </div>
      </footer>

      {/* ── Mobile: sticky bottom bar ── */}
      <StickyBookBar
        selectedRoom={selectedRoom}
        checkIn={checkIn}
        checkOut={checkOut}
        numGuests={numGuests}
        onOpen={openSheet}
        locale={locale}
      />

      {/* ── Mobile: booking sheet ── */}
      <BookingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        property={property}
        rooms={rooms}
        checkIn={checkIn}
        checkOut={checkOut}
        numGuests={numGuests}
        selectedRoom={selectedRoom}
        onCheckIn={setCheckIn}
        onCheckOut={setCheckOut}
        onGuests={setNumGuests}
        onSelectRoom={handleSelectRoom}
        initialStep={sheetStep}
        locale={locale}
        t={t}
      />

    </div>
  );
}
