'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, LogIn, LogOut, Wrench, Plus, X, Lock } from 'lucide-react';

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventStartDate, setEventStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventEndDate, setEventEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventReason, setEventReason] = useState('');

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });

  const allRooms = (properties as any[]).flatMap((p: any) =>
    (p.rooms ?? []).map((r: any) => ({ ...r, propertyName: p.name })),
  );

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', selectedRoomId, year, month],
    queryFn: () =>
      api.get('/availability/calendar', { params: { roomId: selectedRoomId, year, month } })
        .then((r) => r.data.data),
    enabled: !!selectedRoomId,
  });

  const blockDate = useMutation({
    mutationFn: (date: Date) =>
      api.post('/availability/block', {
        roomId: selectedRoomId,
        dates: [format(date, 'yyyy-MM-dd')],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar'] }),
  });

  const unblockDate = useMutation({
    mutationFn: (date: Date) =>
      api.delete('/availability/unblock', {
        data: { roomId: selectedRoomId, dates: [format(date, 'yyyy-MM-dd')] },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar'] }),
  });

  const blockRange = useMutation({
    mutationFn: ({ start, end, reason }: { start: string; end: string; reason: string }) => {
      const dates: string[] = [];
      const cur = new Date(start);
      const endD = new Date(end);
      while (cur <= endD) {
        dates.push(format(cur, 'yyyy-MM-dd'));
        cur.setDate(cur.getDate() + 1);
      }
      return api.post('/availability/block', { roomId: selectedRoomId, dates, reason: reason || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setShowEventModal(false);
      setEventReason('');
    },
  });

  const monthStart    = startOfMonth(currentDate);
  const monthEnd      = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd   = endOfWeek(monthEnd,   { weekStartsOn: 0 });
  const calendarDays  = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const blockedDatesSet = new Set(
    (calendarData?.blockedDates ?? []).map((d: any) =>
      format(new Date(d.blockedDate), 'yyyy-MM-dd'),
    ),
  );

  const bookedDatesMap = new Map<string, any>();
  (calendarData?.bookings ?? []).forEach((b: any) => {
    const cur = new Date(b.checkIn);
    while (cur < new Date(b.checkOut)) {
      bookedDatesMap.set(format(cur, 'yyyy-MM-dd'), b);
      cur.setDate(cur.getDate() + 1);
    }
  });

  const handleDayClick = (date: Date) => {
    if (!selectedRoomId) return;
    const key = format(date, 'yyyy-MM-dd');
    if (bookedDatesMap.has(key)) return;
    if (blockedDatesSet.has(key)) {
      unblockDate.mutate(date);
    } else {
      blockDate.mutate(date);
    }
  };

  // Build events for right panel from bookings
  const bookings: any[] = calendarData?.bookings ?? [];
  const upcomingEvents = bookings
    .flatMap((b: any) => [
      { type: 'checkin',  date: new Date(b.checkIn),  booking: b },
      { type: 'checkout', date: new Date(b.checkOut), booking: b },
    ])
    .filter((e) => isSameMonth(e.date, currentDate))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const isCheckIn  = (day: Date) => bookings.some(b => isSameDay(new Date(b.checkIn),  day));
  const isCheckOut = (day: Date) => bookings.some(b => isSameDay(new Date(b.checkOut), day));

  return (
    <div className="space-y-4 max-w-6xl">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
        <p className="text-slate-400 mt-1">Beheer je beschikbaarheid en boekingen</p>
      </div>

      {/* Kamer selector */}
      <div className="bg-white rounded-2xl border border-slate-100 px-5 py-3.5 flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-600 shrink-0">Kamer:</label>
        <div className="relative flex-1 max-w-xs">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full appearance-none bg-brand-light/40 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 border-0 outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
          >
            <option value="">{t('selectRoom')}</option>
            {allRooms.map((room: any) => (
              <option key={room.id} value={room.id}>
                {room.propertyName} — {room.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
        </div>
      </div>

      {/* Two-column: Calendar + Events panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900 text-lg capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-bold text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key       = format(day, 'yyyy-MM-dd');
              const isBlocked = blockedDatesSet.has(key);
              const booking   = bookedDatesMap.get(key);
              const inMonth   = isSameMonth(day, currentDate);
              const today     = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => handleDayClick(day)}
                  disabled={!selectedRoomId}
                  className={`
                    relative min-h-[72px] p-1.5 flex flex-col items-start border-b border-r border-slate-50 transition-all
                    ${!inMonth ? 'opacity-30' : ''}
                    ${!booking && !isBlocked && selectedRoomId ? 'hover:bg-slate-50 cursor-pointer' : ''}
                    ${!selectedRoomId ? 'cursor-default' : ''}
                  `}
                >
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-xl mb-1
                    ${today ? 'bg-brand text-white' : 'text-slate-600'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {booking && (
                    <div className="w-full bg-brand text-white text-[10px] font-bold px-1.5 py-1 rounded-lg leading-tight truncate">
                      {booking.room?.name?.split(' ')[0] ?? ''}
                      <div className="font-normal opacity-90 truncate">{booking.guest?.firstName}</div>
                    </div>
                  )}
                  {isBlocked && !booking && (
                    <div className="w-full bg-slate-100 text-slate-400 text-[10px] font-semibold px-1.5 py-1 rounded-lg text-center">
                      Geblokkeerd
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-6 py-3 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-brand" /> Geboekt
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-full bg-brand border-2 border-brand" /> Vandaag
            </span>
          </div>
        </div>

        {/* Events panel */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-900">Aankomende Events</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {selectedRoomId ? 'Geen events deze maand' : 'Selecteer een kamer'}
              </p>
            ) : (
              upcomingEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    ev.type === 'checkin' ? 'bg-brand text-white' : 'bg-brand-light text-brand'
                  }`}>
                    {ev.type === 'checkin'
                      ? <LogIn className="w-4 h-4" />
                      : <LogOut className="w-4 h-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      {ev.type === 'checkin' ? 'Check-in' : 'Check-out'}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{ev.booking.guest?.firstName} {ev.booking.guest?.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{ev.booking.room?.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 shrink-0">
                    {format(ev.date, 'd MMM', { locale: dateLocale })}
                  </span>
                </div>
              ))
            )}

            {/* Kamer schoonmaak placeholder */}
            {selectedRoomId && (
              <div className="bg-brand-light rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Kamer schoonmaak</p>
                  <p className="text-xs text-slate-500">Alle kamers</p>
                  <p className="text-xs text-slate-400">10:00 – 14:00</p>
                </div>
                <span className="text-xs font-semibold text-brand ml-auto shrink-0">Vandaag</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-50">
            <button
              onClick={() => setShowEventModal(true)}
              disabled={!selectedRoomId}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Event
            </button>
          </div>
        </div>
      </div>

      {/* ── Nieuw Event modal ── */}
      {showEventModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowEventModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold text-slate-900">Datums blokkeren</h2>
              </div>
              <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Van</label>
                  <input
                    type="date"
                    value={eventStartDate}
                    onChange={e => setEventStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tot en met</label>
                  <input
                    type="date"
                    value={eventEndDate}
                    min={eventStartDate}
                    onChange={e => setEventEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reden (optioneel)</label>
                <input
                  value={eventReason}
                  onChange={e => setEventReason(e.target.value)}
                  placeholder="Bijv. Onderhoud, privégebruik…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              {blockRange.isError && (
                <p className="text-red-500 text-xs">Blokkeren mislukt. Probeer opnieuw.</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => blockRange.mutate({ start: eventStartDate, end: eventEndDate, reason: eventReason })}
                disabled={blockRange.isPending || !eventStartDate || !eventEndDate}
                className="flex-1 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                {blockRange.isPending ? 'Blokkeren…' : 'Blokkeer datums'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
