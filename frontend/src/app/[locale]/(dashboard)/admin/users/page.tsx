'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useImpersonation } from '@/components/admin/impersonation-banner';
import {
  Search, UserX, UserCheck, Eye, CheckCircle2,
  Clock, XCircle, AlertCircle, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  properties: Array<{
    id: string;
    name: string;
    isPublished: boolean;
    rooms: Array<{ id: string }>;
  }>;
  paymentAccount: {
    status: string;
    detailsSubmitted: boolean;
    payoutsEnabled: boolean;
  } | null;
}

// ─── Stripe status badge ──────────────────────────────────────────────────────

function StripeBadge({ account }: { account: AdminUser['paymentAccount'] }) {
  if (!account) return <span className="text-xs text-slate-400">Niet gekoppeld</span>;
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    PENDING:    { label: 'Wachtend',    cls: 'bg-slate-100 text-slate-500',   icon: Clock },
    ONBOARDING: { label: 'Bezig',       cls: 'bg-amber-50 text-amber-700',    icon: Clock },
    VERIFIED:   { label: 'Geverifieerd',cls: 'bg-emerald-50 text-emerald-700',icon: CheckCircle2 },
    REJECTED:   { label: 'Afgewezen',   cls: 'bg-red-50 text-red-600',        icon: XCircle },
    SUSPENDED:  { label: 'Gesuspend',   cls: 'bg-red-50 text-red-600',        icon: XCircle },
  };
  const c = map[account.status] ?? map.PENDING;
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold', c.cls)}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
}

// ─── B&B status badge ─────────────────────────────────────────────────────────

function BnbBadge({ property }: { property: AdminUser['properties'][0] | undefined }) {
  if (!property) return <span className="text-xs text-slate-400">Geen B&B</span>;
  return property.isPublished
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Live</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500"><Clock className="w-3 h-3" /> Concept</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmSuspend, setConfirmSuspend] = useState<AdminUser | null>(null);
  const { startImpersonation } = useImpersonation();

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmSuspend(null);
    },
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.properties[0]?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gebruikersbeheer</h1>
          <p className="text-slate-400 mt-1">
            {users.length} geregistreerde verhuurders
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, email of B&B…"
            className="pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">Geen gebruikers gevonden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Gebruiker', 'B&B', 'Kamers', 'Geregistreerd', 'B&B Status', 'Stripe', 'Acties'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => {
                  const property = u.properties[0];
                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        'hover:bg-slate-50/50 transition-colors',
                        !u.isActive && 'opacity-50',
                      )}
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-brand">
                              {u.firstName[0]}{u.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* B&B name */}
                      <td className="px-5 py-4">
                        {property ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 font-medium truncate max-w-[160px]">
                              {property.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Room count */}
                      <td className="px-5 py-4 text-slate-500 text-center">
                        {property?.rooms?.length ?? 0}
                      </td>

                      {/* Registration date */}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {format(new Date(u.createdAt), 'd MMM yyyy', { locale: nl })}
                      </td>

                      {/* B&B status */}
                      <td className="px-5 py-4">
                        <BnbBadge property={property} />
                      </td>

                      {/* Stripe status */}
                      <td className="px-5 py-4">
                        <StripeBadge account={u.paymentAccount} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startImpersonation(u.id, `${u.firstName} ${u.lastName}`)}
                            title="Bekijk als gebruiker"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-light text-brand hover:bg-brand hover:text-white rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Bekijk als
                          </button>

                          <button
                            onClick={() => setConfirmSuspend(u)}
                            title={u.isActive ? 'Suspendeer gebruiker' : 'Activeer gebruiker'}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                              u.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                            )}
                          >
                            {u.isActive
                              ? <><UserX className="w-3.5 h-3.5" /> Suspend</>
                              : <><UserCheck className="w-3.5 h-3.5" /> Activeer</>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend confirm modal */}
      {confirmSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${confirmSuspend.isActive ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {confirmSuspend.isActive
                  ? <UserX className="w-5 h-5 text-red-600" />
                  : <UserCheck className="w-5 h-5 text-emerald-600" />
                }
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {confirmSuspend.isActive ? 'Gebruiker suspenderen?' : 'Gebruiker activeren?'}
                </p>
                <p className="text-sm text-slate-500">
                  {confirmSuspend.firstName} {confirmSuspend.lastName}
                </p>
              </div>
            </div>

            {confirmSuspend.isActive && (
              <p className="text-sm text-slate-500 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                Dit blokkeert de inlog van deze gebruiker en haalt hun B&B pagina offline.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSuspend(null)}
                className="flex-1 py-2.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => suspendMutation.mutate(confirmSuspend.id)}
                disabled={suspendMutation.isPending}
                className={cn(
                  'flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50',
                  confirmSuspend.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600',
                )}
              >
                {suspendMutation.isPending ? 'Bezig…' : confirmSuspend.isActive ? 'Suspenderen' : 'Activeren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
