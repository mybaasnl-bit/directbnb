'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Mail, Phone, CalendarCheck, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function GuestsPage() {
  const t = useTranslations('guests');
  const [search, setSearch] = useState('');

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', search],
    queryFn: () =>
      api.get('/guests', { params: search ? { search } : {} }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
          <Users className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-400 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Zoekbalk */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl text-sm text-slate-700 placeholder-slate-400 border-0 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
        />
      </div>

      {/* Gasten */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : guests.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-brand" />
          </div>
          <p className="font-bold text-slate-700">
            {search ? t('noResults') : t('empty')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden">
          {/* Tabelheader */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-brand-light/40 border-b border-brand/10">
            <div className="col-span-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('name')}</div>
            <div className="col-span-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:block">{t('contact')}</div>
            <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">{t('bookings')}</div>
            <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:block">{t('since')}</div>
          </div>

          {/* Rijen */}
          <div className="divide-y divide-slate-50">
            {guests.map((guest: any) => (
              <div key={guest.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-brand-light/20 transition-colors items-center">
                {/* Naam */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {guest.firstName[0]}{guest.lastName[0]}
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">
                    {guest.firstName} {guest.lastName}
                  </span>
                </div>

                {/* Contact */}
                <div className="col-span-4 hidden md:flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-300" />
                    {guest.email}
                  </span>
                  {guest.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="w-3 h-3 text-slate-300" />
                      {guest.phone}
                    </span>
                  )}
                </div>

                {/* Boekingen */}
                <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
                  <CalendarCheck className="w-3.5 h-3.5 text-slate-300" />
                  {guest._count?.bookings ?? 0}
                </div>

                {/* Datum */}
                <div className="col-span-2 hidden lg:block text-sm text-slate-400">
                  {format(new Date(guest.createdAt), 'dd MMM yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
