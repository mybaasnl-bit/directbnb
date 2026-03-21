import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';

export function UpcomingBookings({ bookings }: { bookings: any[] }) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">{t('upcomingBookings')}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {bookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">{t('noUpcoming')}</p>
        ) : (
          bookings.map((b: any) => (
            <div key={b.id} className="px-5 py-3.5 flex items-start gap-4">
              <div className="w-10 text-center shrink-0">
                <p className="text-xs font-medium text-indigo-500 uppercase">
                  {format(new Date(b.checkIn), 'MMM', { locale: dateLocale })}
                </p>
                <p className="text-xl font-bold text-slate-900 leading-none">
                  {format(new Date(b.checkIn), 'd')}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {b.guest.firstName} {b.guest.lastName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {b.room.property.name} — {b.room.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(b.checkIn), 'dd MMM', { locale: dateLocale })}
                  {' → '}
                  {format(new Date(b.checkOut), 'dd MMM', { locale: dateLocale })}
                  {' · '}
                  {b.numGuests} {t('guestsShort')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
