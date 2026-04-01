'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Euro, CheckCircle2, Clock, XCircle, RefreshCw, TrendingUp } from 'lucide-react';

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

const STATUS_CONFIG: Record<Payment['status'], { label: string; className: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Verwacht',     className: 'text-amber-700 bg-amber-50',   icon: <Clock       className="w-3 h-3" /> },
  PAID:     { label: 'Betaald',      className: 'text-emerald-700 bg-emerald-50', icon: <CheckCircle2 className="w-3 h-3" /> },
  FAILED:   { label: 'Mislukt',      className: 'text-red-700 bg-red-50',       icon: <XCircle     className="w-3 h-3" /> },
  REFUNDED: { label: 'Terugbetaald', className: 'text-slate-600 bg-slate-100',  icon: <RefreshCw   className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: Payment['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | Payment['status']>('ALL');

  const { data: payments = [], isLoading, refetch } = useQuery<Payment[]>({
    queryKey: ['admin-payments', statusFilter],
    queryFn: () =>
      api.get('/admin/payments', { params: statusFilter !== 'ALL' ? { status: statusFilter } : {} })
        .then(r => r.data?.data ?? r.data),
  });

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
            <Euro className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Betalingen</h1>
            <p className="text-slate-400 text-sm">Overzicht van alle betalingen via Mollie</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand bg-white px-4 py-2.5 rounded-xl hover:bg-brand-light transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Vernieuwen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-white/70" />
            <p className="text-xs text-white/70 font-semibold uppercase tracking-wide">Totaal ontvangen</p>
          </div>
          <p className="text-3xl font-bold text-white">€{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-brand-light rounded-3xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Betaald</p>
          <p className="text-3xl font-bold text-slate-900">{payments.filter(p => p.status === 'PAID').length}</p>
        </div>
        <div className="bg-brand-light rounded-3xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Openstaand</p>
          <p className="text-3xl font-bold text-slate-900">{payments.filter(p => p.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-brand text-white'
                : 'bg-white text-slate-500 hover:bg-brand-light hover:text-brand'
            }`}
          >
            {s === 'ALL' ? 'Alle' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Euro className="w-7 h-7 text-brand" />
          </div>
          <p className="font-bold text-slate-700">Geen betalingen gevonden</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-light/40">
                  {['Gast', 'Accommodatie', 'Type', 'Bedrag', 'Status', 'Methode', 'Datum'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-brand-light/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {payment.booking.guest.firstName} {payment.booking.guest.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{payment.booking.guest.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700 font-medium">{payment.booking.room.property.name}</div>
                      <div className="text-xs text-slate-400">{payment.booking.room.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        payment.type === 'FULL' ? 'text-brand bg-brand-light' : 'text-slate-500 bg-slate-100'
                      }`}>
                        {payment.type === 'FULL' ? 'Volledig' : 'Aanbetaling'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      €{Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500 capitalize">
                      {payment.method ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">
                      {format(new Date(payment.paidAt ?? payment.createdAt), 'd MMM yyyy', { locale: nl })}
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
