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
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });

  // Flatten all rooms for selector
  const allRooms = properties.flatMap((p: any) =>
    (p.rooms ?? []).map((r: any) => ({ ...r, propertyName: p.name })),
  );

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', selectedRoomId, year, month],
    queryFn: () =>
      api
        .get('/availability/calendar', { params: { roomId: selectedRoomId, year, month } })
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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
    if (bookedDatesMap.has(key)) return; // can't unblock booked dates

    if (blockedDatesSet.has(key)) {
      unblockDate.mutate(date);
    } else {
      blockDate.mutate(date);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Room selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">{t('selectRoom')}</option>
          {allRooms.map((room: any) => (
            <option key={room.id} value={room.id}>
              {room.propertyName} — {room.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-slate-900">
            {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(year, month, 1))}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const isBlocked = blockedDatesSet.has(key);
            const booking = bookedDatesMap.get(key);
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                disabled={!selectedRoomId}
                className={`
                  relative aspect-square flex flex-col items-center justify-center text-sm border-b border-r border-slate-50 transition-colors
                  ${!inMonth ? 'opacity-30' : ''}
                  ${today ? 'font-bold ring-2 ring-brand ring-inset' : ''}
                  ${booking ? 'bg-indigo-50 text-indigo-700 cursor-default' : ''}
                  ${isBlocked && !booking ? 'bg-slate-100 text-slate-400' : ''}
                  ${!isBlocked && !booking && inMonth ? 'hover:bg-green-50 hover:text-green-700 cursor-pointer' : ''}
                  ${!selectedRoomId ? 'cursor-not-allowed' : ''}
                `}
              >
                <span>{format(day, 'd')}</span>
                {booking && (
                  <span className="text-[10px] text-indigo-500 mt-0.5 max-w-full truncate px-1">
                    {booking.guest?.firstName}
                  </span>
                )}
                {isBlocked && !booking && (
                  <span className="text-[10px] text-slate-400">✕</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-200" />
            {t('legendBooked')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
            {t('legendBlocked')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white border border-slate-200" />
            {t('legendAvailable')}
          </span>
        </div>
      </div>
    </div>
  );
}
