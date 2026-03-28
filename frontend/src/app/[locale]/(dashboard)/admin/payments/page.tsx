'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Euro, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  type: 'FULL' | 'DEPOSIT';
  provider: string;
  providerPaymentId: string | null;
  method: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  booking: {
    guest: { firstName: string; lastName: string; email: string };
    room: { name: string; property: { name: string } };
  };
}

const STATUS_CONFIG: Record<Payment['status'], { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Verwacht', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  PAID: { label: 'Betaald', color: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  FAILED: { label: 'Mislukt', color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  REFUNDED: { label: 'Terugbetaald', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: Payment['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | Payment['status']>('ALL');

  const { data: payments = [], isLoading, refetch } = useQuery<Payment[]>({
    queryKey: ['admin-payments', statusFilter],
    queryFn: () =>
      api
        .get('/admin/payments', { params: statusFilter !== 'ALL' ? { status: statusFilter } : {} })
        .then(r => r.data?.data ?? r.data),
  });

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Betalingen</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overzicht van alle betalingen via Mollie</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Vernieuwen
        </button>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Totaal ontvangen</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">€{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Aantal betaald</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{payments.filter(p => p.status === 'PAID').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Openstaand</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{payments.filter(p => p.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'ALL' ? 'Alle' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Euro className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Geen betalingen gevonden</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gast</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Accommodatie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bedrag</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Methode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {payment.booking.guest.firstName} {payment.booking.guest.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{payment.booking.guest.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{payment.booking.room.property.name}</div>
                      <div className="text-xs text-slate-400">{payment.booking.room.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        payment.type === 'FULL'
                          ? 'text-brand-600 bg-brand-light border-brand/20'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>
                        {payment.type === 'FULL' ? 'Volledig' : 'Aanbetaling'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      €{Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize">
                      {payment.method ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {payment.paidAt
                        ? format(new Date(payment.paidAt), 'd MMM yyyy', { locale: nl })
                        : format(new Date(payment.createdAt), 'd MMM yyyy', { locale: nl })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
