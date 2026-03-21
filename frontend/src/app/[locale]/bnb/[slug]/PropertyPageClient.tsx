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
  SquareStack, Shield, CheckCircle2, X, CalendarDays,
  MessageSquare, ChevronDown, ChevronUp, Minus, Plus,
  ArrowRight, Camera, Clock, Cigarette, PawPrint,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
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
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
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
        className="w-11 h-11 rounded-full border-2 border-indigo-500 bg-indigo-50 flex items-center justify-center text-indigo-700 disabled:opacity-30 active:scale-95 transition-transform"
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
        <div
          className="grid gap-2 rounded-2xl overflow-hidden cursor-pointer"
          style={{
            gridTemplateColumns: photos.length >= 3 ? '2fr 1fr' : '1fr',
            gridTemplateRows: 'auto',
          }}
          onClick={() => setShowAll(true)}
        >
          <div className="relative" style={{ aspectRatio: '4/3' }}>
            <Image src={photos[0].url} alt={name} fill className="object-cover" priority sizes="(min-width: 1024px) 66vw, 100vw" />
          </div>
          {photos.length >= 3 && (
            <div className="grid grid-rows-2 gap-2">
              {photos.slice(1, 3).map((p, i) => (
                <div key={p.id} className="relative">
                  <Image src={p.url} alt={`${name} ${i + 2}`} fill className="object-cover" sizes="33vw" />
                  {i === 1 && photos.length > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                        <Camera className="w-4 h-4" />
                        +{photos.length - 3} {isNl ? "foto's" : 'photos'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
      <p className="text-xs font-semibold text-indigo-600 mb-3 text-center uppercase tracking-wide">{phase}</p>

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
                  ? 'text-indigo-700'
                  : !isPast && !isUnavail
                  ? 'text-slate-800 hover:bg-indigo-50 rounded-lg active:scale-95'
                  : '',
              ].join(' ')}
            >
              {/* Range background */}
              {range && (
                <span className="absolute inset-0 bg-indigo-50" />
              )}
              {/* Start cap */}
              {start && (
                <>
                  {checkOut && <span className="absolute inset-y-0 right-0 w-1/2 bg-indigo-50" />}
                  <span className="absolute inset-0 bg-indigo-600 rounded-lg" />
                </>
              )}
              {/* End cap */}
              {end && (
                <>
                  <span className="absolute inset-y-0 left-0 w-1/2 bg-indigo-50" />
                  <span className="absolute inset-0 bg-indigo-600 rounded-lg" />
                </>
              )}
              <span className="relative z-10">{day}</span>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {checkIn && checkOut && (
        <div className="mt-4 bg-indigo-50 rounded-xl px-4 py-3 text-center">
          <p className="text-sm font-semibold text-indigo-800">
            {fmt(checkIn, locale)} → {fmt(checkOut, locale)}
            <span className="text-indigo-500 font-normal ml-2">
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
      {selectedRoom ? (
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">€{Number(selectedRoom.pricePerNight).toFixed(0)}</span>
            <span className="text-slate-500 text-sm">{t('perNight')}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{selectedRoom.name}</p>
        </div>
      ) : (
        <p className="text-slate-600 font-medium text-sm">{t('selectRoomFirst')}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">{t('checkIn')}</label>
          <input type="date" value={checkIn} min={todayStr} onChange={e => onCheckIn(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">{t('checkOut')}</label>
          <input type="date" value={checkOut} min={checkIn || todayStr} onChange={e => onCheckOut(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t('guests')}</label>
        <select value={numGuests} onChange={e => onGuests(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          {Array.from({ length: selectedRoom?.maxGuests ?? 4 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n} {n === 1 ? t('guest') : t('guestsPlural')}</option>
          ))}
        </select>
      </div>

      {selectedRoom && nights > 0 && (
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>€{Number(selectedRoom.pricePerNight).toFixed(0)} × {nights} {nights === 1 ? (isNl ? 'nacht' : 'night') : (isNl ? 'nachten' : 'nights')}</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          <hr className="border-slate-200" />
          <div className="flex justify-between font-semibold text-slate-900">
            <span>{isNl ? 'Totaal' : 'Total'}</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={onBook}
        disabled={!selectedRoom}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
      >
        {isNl ? 'Boek nu — gratis aanvragen' : 'Book now — request for free'}
      </button>

      <div className="space-y-1.5 pt-1">
        {[
          isNl ? '0% commissie — betaal de eigenaar direct' : '0% commission — pay the owner directly',
          isNl ? 'Directe reservering bij de eigenaar' : 'Direct booking with the owner',
          isNl ? 'Gratis aanvragen, geen verplichtingen' : 'Free to request, no obligations',
        ].map(msg => (
          <div key={msg} className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <span>{msg}</span>
          </div>
        ))}
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
  const { register, handleSubmit, formState: { errors } } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: selectedRoom?.id ?? '',
      checkIn,
      checkOut,
      numGuests,
    },
  });

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
              <button onClick={onClose} className="mt-2 bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl w-full">
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
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
                        className={`w-full text-left border-2 rounded-2xl overflow-hidden transition-all active:scale-[0.98] ${isSelected ? 'border-indigo-500 shadow-md' : 'border-slate-200'}`}
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
                                <p className="font-extrabold text-slate-900">€{Number(room.pricePerNight).toFixed(0)}</p>
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
                              <p className="text-xs font-semibold text-indigo-600 mt-1.5">
                                €{(nightsCount * Number(room.pricePerNight)).toFixed(0)} {isNl ? 'totaal' : 'total'}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-indigo-50 border-t border-indigo-100 px-3 py-1.5 flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
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
                <input type="hidden" {...register('roomId')} value={selectedRoom?.id ?? ''} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('firstName')}</label>
                    <input
                      {...register('guestFirstName')}
                      autoComplete="given-name"
                      placeholder="Jan"
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.guestFirstName && <p className="text-red-500 text-xs mt-1">{errors.guestFirstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('lastName')}</label>
                    <input
                      {...register('guestLastName')}
                      autoComplete="family-name"
                      placeholder="de Vries"
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors"
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
            ready ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-slate-800 hover:bg-slate-700'
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
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            Direct<span className="text-indigo-600">BnB</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              {isNl ? 'Boek direct bij de eigenaar' : 'Book direct with the owner'}
            </div>
            <LanguageSwitcher />
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
                        <Icon className="w-3.5 h-3.5 text-indigo-600" />
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
                    <BedDouble className="w-4 h-4 text-indigo-500" />
                    <span>{rooms.length} {rooms.length === 1 ? (isNl ? 'kamer' : 'room') : (isNl ? 'kamers' : 'rooms')}</span>
                  </div>
                  {rooms[0]?.maxGuests && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>
                        {isNl ? 'Tot' : 'Up to'} {Math.max(...rooms.map(r => r.maxGuests))} {isNl ? 'gasten' : 'guests'}
                      </span>
                    </div>
                  )}
                  {property.amenities.includes('breakfast') && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Coffee className="w-4 h-4 text-indigo-500" />
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
                    className="flex items-center gap-1 text-indigo-600 text-sm font-semibold mt-3"
                  >
                    {descExpanded ? (isNl ? 'Minder tonen' : 'Show less') : (isNl ? 'Lees meer' : 'Read more')}
                    {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </section>
            )}

            {/* ── Rooms ── */}
            <section className="border-b border-slate-100 pb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t('availableRooms')}</h2>

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
                          isSelected ? 'border-indigo-500 shadow-md' : 'border-slate-200'
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
                              <p className="text-xl font-extrabold text-slate-900">€{Number(room.pricePerNight).toFixed(0)}</p>
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
                                ? 'bg-indigo-600 text-white'
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
                        isSelected ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300'
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
                              <h3 className="font-bold text-slate-900 text-lg">{room.name}</h3>
                              <div className="text-right shrink-0">
                                <p className="text-2xl font-extrabold text-slate-900">€{Number(room.pricePerNight).toFixed(0)}</p>
                                <p className="text-xs text-slate-400">{t('perNight')}</p>
                              </div>
                            </div>
                            {roomDesc && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{roomDesc}</p>}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="w-3.5 h-3.5" />{t('maxGuests', { count: room.maxGuests })}</span>
                            {room.beds && <span className="flex items-center gap-1.5 text-xs text-slate-500"><BedDouble className="w-3.5 h-3.5" />{room.beds} {room.beds === 1 ? (isNl ? 'bed' : 'bed') : (isNl ? 'bedden' : 'beds')}</span>}
                            {room.sqm && <span className="flex items-center gap-1.5 text-xs text-slate-500"><SquareStack className="w-3.5 h-3.5" />{room.sqm} m²</span>}
                            {room.minStay > 1 && <span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="w-3.5 h-3.5" />{isNl ? `Min. ${room.minStay} nachten` : `Min. ${room.minStay} nights`}</span>}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-indigo-50 border-t border-indigo-100 px-5 py-2.5 flex items-center gap-2 text-xs text-indigo-700 font-medium">
                          <Check className="w-3.5 h-3.5" />
                          {isNl ? 'Geselecteerd' : 'Selected'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Amenities ── */}
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
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-indigo-600" />
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
                    className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold mt-4"
                  >
                    {amenitiesExpanded
                      ? (isNl ? 'Minder tonen' : 'Show less')
                      : (isNl ? `Toon alle ${property.amenities.length} faciliteiten` : `Show all ${property.amenities.length} amenities`)}
                    {amenitiesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </section>
            )}

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
                <h2 className="text-lg font-bold text-slate-900">{isNl ? 'Beoordelingen' : 'Reviews'}</h2>
                {avgRating && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={avgRating} size="sm" />
                    <span className="font-bold text-slate-900 text-sm">{avgRating}</span>
                    <span className="text-slate-400 text-xs">({reviewCount})</span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <>
                  {(avgCleanliness || avgLocation || avgValue) && (
                    <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-3">
                      <ScoreBar label={isNl ? 'Netheid' : 'Cleanliness'} score={avgCleanliness} />
                      <ScoreBar label={isNl ? 'Locatie' : 'Location'} score={avgLocation} />
                      <ScoreBar label={isNl ? 'Prijs/kwaliteit' : 'Value'} score={avgValue} />
                    </div>
                  )}
                  <CollapsibleSection expanded={reviewsExpanded} maxCollapsedHeight="max-h-[500px]">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {reviews.slice(0, reviewsExpanded ? 20 : 4).map(review => (
                        <div key={review.id} className="border border-slate-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {review.guestFirstName[0]}
                              </div>
                              <span className="font-semibold text-slate-900 text-sm">{review.guestFirstName}</span>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{review.comment}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(review.createdAt).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                  {reviews.length > 4 && (
                    <button
                      onClick={() => setReviewsExpanded(e => !e)}
                      className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold mt-4"
                    >
                      {reviewsExpanded
                        ? (isNl ? 'Minder tonen' : 'Show less')
                        : (isNl ? `Alle ${reviewCount} beoordelingen tonen` : `Show all ${reviewCount} reviews`)}
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
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">{isNl ? 'Locatie' : 'Location'}</h2>
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-52">
                  <iframe
                    title="Location map"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    frameBorder="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      property.longitude
                        ? `${Number(property.longitude) - 0.01},${Number(property.latitude) - 0.01},${Number(property.longitude) + 0.01},${Number(property.latitude) + 0.01}`
                        : '4.85,52.35,4.95,52.40'
                    }&layer=mapnik${property.latitude && property.longitude ? `&marker=${property.latitude},${property.longitude}` : ''}`}
                    style={{ border: 0 }}
                  />
                </div>
                {property.addressStreet && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-3">
                    <MapPin className="w-4 h-4" />
                    {property.addressStreet}, {property.addressCity}
                  </p>
                )}
              </section>
            )}
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
