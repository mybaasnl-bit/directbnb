'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-brand-light text-brand-600',
  PAYMENT_PENDING: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
};

export function BookingStatusBadge({ status }: { status: string }) {
  const t = useTranslations('bookings.status');

  // Normalise to lowercase for JSON key lookup (e.g. PAYMENT_PENDING → payment_pending)
  const label = (() => {
    try {
      return t(status.toLowerCase() as any);
    } catch {
      return status;
    }
  })();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status] ?? 'bg-slate-100 text-slate-500',
      )}
    >
      {label}
    </span>
  );
}
