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
} from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });

  const allRooms = properties.flatMap((p: any) =>
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

  const monthStart    = startOfMonth(currentDate);
  const monthEnd      = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd   = endOfWeek(monthEnd, { weekStartsOn: 1 });
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

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-400 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Kamer selector */}
      <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-600 shrink-0">Kamer:</label>
        <select
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="flex-1 appearance-none bg-brand-light text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 border-0 outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
        >
          <option value="">{t('selectRoom')}</option>
          {allRooms.map((room: any) => (
            <option key={room.id} value={room.id}>
              {room.propertyName} — {room.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kalender */}
      <div className="bg-white rounded-3xl overflow-hidden">
        {/* Maand navigatie */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
            className="w-9 h-9 flex items-center justify-center bg-brand-light hover:bg-brand hover:text-white text-brand rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-bold text-slate-900 text-lg capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(year, month, 1))}
            className="w-9 h-9 flex items-center justify-center bg-brand-light hover:bg-brand hover:text-white text-brand rounded-xl transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dagnamen */}
        <div className="grid grid-cols-7 bg-brand-light/40">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => (
            <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Dagen grid */}
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
                  relative aspect-square flex flex-col items-center justify-center text-sm border-b border-r border-slate-50 transition-all
                  ${!inMonth ? 'opacity-25' : ''}
                  ${today ? 'font-bold ring-2 ring-brand ring-inset rounded-none' : ''}
                  ${booking ? 'bg-brand-light text-brand cursor-default' : ''}
                  ${isBlocked && !booking ? 'bg-slate-100 text-slate-400' : ''}
                  ${!isBlocked && !booking && inMonth && selectedRoomId ? 'hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer' : ''}
                  ${!selectedRoomId ? 'cursor-not-allowed' : ''}
                `}
              >
                <span className="font-semibold">{format(day, 'd')}</span>
                {booking && (
                  <span className="text-[9px] text-brand mt-0.5 max-w-full truncate px-1 font-semibold">
                    {booking.guest?.firstName}
                  </span>
                )}
                {isBlocked && !booking && (
                  <span className="text-[10px] text-slate-400 mt-0.5">✕</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-6 px-6 py-4 border-t border-slate-50 bg-slate-50/50">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-4 h-4 rounded-lg bg-brand-light border border-brand/20 flex-shrink-0" />
            {t('legendBooked')}
          </span>
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-4 h-4 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0" />
            {t('legendBlocked')}
          </span>
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-4 h-4 rounded-lg bg-emerald-50 border border-emerald-200 flex-shrink-0" />
            {t('legendAvailable')}
          </span>
        </div>
      </div>
    </div>
  );
}
