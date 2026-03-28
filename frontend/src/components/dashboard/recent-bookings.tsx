import { useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function RecentBookings({ bookings }: { bookings: any[] }) {
  const t = useTranslations('dashboard');
  const { locale } = useParams();

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">{t('recentBookings')}</h3>
        <Link href={`/${locale}/bookings`} className="text-xs text-brand hover:text-brand-600 font-medium">
          {t('viewAll')}
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {bookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">{t('noBookings')}</p>
        ) : (
          bookings.slice(0, 6).map((b: any) => (
            <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {b.guest.firstName} {b.guest.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{b.room.property.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BookingStatusBadge status={b.status} />
                <span className="text-xs text-slate-400">
                  {format(new Date(b.checkIn), 'dd MMM')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
