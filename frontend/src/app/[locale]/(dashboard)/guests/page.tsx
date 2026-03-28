'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Mail, Phone, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function GuestsPage() {
  const t = useTranslations('guests');
  const [search, setSearch] = useState('');

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', search],
    queryFn: () =>
      api
        .get('/guests', { params: search ? { search } : {} })
        .then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : guests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">{search ? t('noResults') : t('empty')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('name')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t('contact')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">{t('bookings')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">{t('since')}</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest: any) => (
                <tr key={guest.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-semibold text-xs shrink-0">
                        {guest.firstName[0]}{guest.lastName[0]}
                      </div>
                      <span className="font-medium text-slate-900">
                        {guest.firstName} {guest.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {guest.email}
                      </span>
                      {guest.phone && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {guest.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                      {guest._count?.bookings ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500">
                    {format(new Date(guest.createdAt), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
