'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import {
  Check, X, Link2, Loader2, CheckCircle2, CalendarDays,
  BedDouble, Users, Clock, Filter, FileText, TrendingUp, Plus,
  AlertCircle,
} from 'lucide-react';

const STATUS_FILTERS = [
  { key: 'all',             label: 'Alle statussen' },
  { key: 'PENDING',         label: 'In afwachting' },
  { key: 'CONFIRMED',       label: 'Bevestigd' },
  { key: 'PAYMENT_PENDING', label: 'Wacht op betaling' },
  { key: 'PAID',            label: 'Betaald' },
  { key: 'COMPLETED',       label: 'Afgerond' },
  { key: 'CANCELLED',       label: 'Geannuleerd' },
] as const;

type FilterKey = (typeof STATUS_FILTERS)[number]['key'];

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ── Manual booking modal ──────────────────────────────────────────────────────

interface Room { id: string; name: string; pricePerNight: number; property: { name: string } }

function ManualBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ['properties-with-rooms'],
    queryFn: () => api.get('/properties').then(r => r.data.data ?? []),
  });

  const allRooms: Room[] = (properties as any[]).flatMap(p =>
    (p.rooms ?? []).map((r: any) => ({ ...r, property: { name: p.name } }))
  );

  const today = new Date().toISOString().split('T')[0];

  const [roomId,     setRoomId]     = useState('');
  const [checkIn,    setCheckIn]    = useState('');
  const [checkOut,   setCheckOut]   = useState('');
  const [numGuests,  setNumGuests]  = useState(1);
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [message,    setMessage]    = useState('');
  const [error,      setError]      = useState('');

  const selectedRoom = allRooms.find(r => r.id === roomId);
  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000))
    : 0;
  const totalPrice = selectedRoom ? nights * Number(selectedRoom.pricePerNight) : 0;

  const create = useMutation({
    mutationFn: () => api.post('/bookings/manual', {
      roomId, checkIn, checkOut,
      numGuests: Number(numGuests),
      guestFirstName: firstName.trim(),
      guestLastName:  lastName.trim(),
      guestEmail:     email.trim(),
      guestPhone:     phone.trim() || undefined,
      guestMessage:   message.trim() || undefined,
    }),
    onSuccess: () => { onCreated(); onClose(); },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Er is iets misgegaan.'));
    },
  });

  const canSubmit = roomId && checkIn && checkOut && nights > 0 && firstName && lastName && email && !create.isPending;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Boeking handmatig toevoegen</h2>
            <p className="text-xs text-slate-400 mt-0.5">Voeg een directe boeking toe die meteen bevestigd wordt.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Room */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Kamer *
            </label>
            {allRooms.length === 0 ? (
              <p className="text-sm text-slate-400">Geen kamers beschikbaar. Voeg eerst een accommodatie toe.</p>
            ) : (
              <select
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
              >
                <option value="">Selecteer een kamer…</option>
                {allRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.property.name} — {r.name} (€{Number(r.pricePerNight).toFixed(0)}/nacht)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Check-in *</label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Check-out *</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                disabled={!checkIn}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-40"
              />
            </div>
          </div>

          {/* Guests count */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Aantal gasten *</label>
            <select
              value={numGuests}
              onChange={e => setNumGuests(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
            >
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'gast' : 'gasten'}</option>)}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Gastgegevens</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Voornaam *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jan"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Achternaam *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="de Vries"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-slate-500 mb-1">E-mailadres *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan@voorbeeld.nl"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-slate-500 mb-1">Telefoonnummer <span className="text-slate-400">(optioneel)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+31 6 12345678"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-slate-500 mb-1">Notitie <span className="text-slate-400">(optioneel)</span></label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                placeholder="Bijzonderheden of wensen van de gast…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
              />
            </div>
          </div>

          {/* Price summary */}
          {nights > 0 && selectedRoom && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between border border-slate-100">
              <span className="text-sm text-slate-500">
                €{Number(selectedRoom.pricePerNight).toFixed(0)} × {nights} nacht{nights !== 1 ? 'en' : ''}
              </span>
              <span className="font-bold text-slate-900">€{totalPrice.toFixed(0)}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Annuleren
          </button>
          <button
            onClick={() => { setError(''); create.mutate(); }}
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold transition-colors"
          >
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {create.isPending ? 'Opslaan…' : 'Boeking aanmaken'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const locale = useLocale();
  const dateLocale = locale === 'nl' ? nl : enUS;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sentLinks, setSentLinks] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', filter],
    queryFn: () =>
      api.get('/bookings', { params: filter !== 'all' ? { status: filter } : {} })
        .then((r) => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
    },
  });

  const sendPaymentLink = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      api.post(`/mollie/send-link/${id}?method=${method}`).then(r => r.data?.data ?? r.data),
    onSuccess: (_data, variables) => {
      setSentLinks(prev => new Set(Array.from(prev).concat(variables.id)));
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleCreated = () => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['pending-bookings'] });
  };

  const allBookings = bookings as any[];
  const totalCount = allBookings.length;
  const confirmedCount = allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED').length;
  const pendingCount = allBookings.filter(b => b.status === 'PENDING').length;
  const cancelledCount = allBookings.filter(b => b.status === 'CANCELLED').length;

  const fmt = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: dateLocale });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Modal */}
      {showModal && (
        <ManualBookingModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Boekingen</h1>
        <p className="text-slate-400 mt-1">Beheer al je reserveringen</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Totale Boekingen" value={totalCount} icon={FileText} />
        <StatCard label="Bevestigd" value={confirmedCount} icon={CheckCircle2} />
        <StatCard label="In afwachting" value={pendingCount} icon={Clock} />
        <StatCard label="Geannuleerd" value={cancelledCount} icon={TrendingUp} />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 cursor-pointer">
          <Filter className="w-4 h-4" />
          Filter
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
          >
            {STATUS_FILTERS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Boeking
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : allBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-brand" />
          </div>
          <p className="font-bold text-slate-700">Geen boekingen gevonden</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'all' ? 'U heeft nog geen boekingen ontvangen.' : 'Geen boekingen met dit filter.'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Boeking handmatig toevoegen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.6fr_1fr_0.7fr_0.6fr] gap-3 px-5 py-3 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
            <div>Gast</div>
            <div>Kamer</div>
            <div>Check-in</div>
            <div>Check-out</div>
            <div>Gasten</div>
            <div>Status</div>
            <div>Totaal</div>
            <div>Acties</div>
          </div>

          {/* Pending bookings — actionable rows first */}
          {filter === 'all' && allBookings.filter(b => b.status === 'PENDING').map((booking: any) => (
            <div key={booking.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.6fr_1fr_0.7fr_0.6fr] gap-3 px-5 py-4 border-b border-slate-50 hover:bg-brand-light/10 transition-colors items-center bg-amber-50/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                </div>
                <span className="font-semibold text-sm text-slate-900 truncate">{booking.guest.firstName} {booking.guest.lastName}</span>
              </div>
              <div className="text-sm text-slate-600 truncate">{booking.room?.name}</div>
              <div className="text-sm text-slate-600">{fmt(booking.checkIn)}</div>
              <div className="text-sm text-slate-600">{fmt(booking.checkOut)}</div>
              <div className="text-sm text-slate-600">{booking.numGuests}</div>
              <div><BookingStatusBadge status={booking.status} /></div>
              <div className="font-bold text-sm text-slate-900">€{Number(booking.totalPrice).toFixed(0)}</div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                  disabled={updateStatus.isPending}
                  title="Accepteren"
                  className="w-7 h-7 bg-brand hover:bg-brand-600 text-white rounded-lg flex items-center justify-center disabled:opacity-60 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: booking.id, status: 'REJECTED' })}
                  disabled={updateStatus.isPending}
                  title="Weigeren"
                  className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center disabled:opacity-60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Regular rows */}
          {(filter === 'all' ? allBookings.filter(b => b.status !== 'PENDING') : allBookings).map((booking: any) => {
            const linkSent = sentLinks.has(booking.id);
            const isSending = sendPaymentLink.isPending && sendPaymentLink.variables?.id === booking.id;
            return (
              <div key={booking.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.6fr_1fr_0.7fr_0.6fr] gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors items-center">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                  </div>
                  <span className="font-semibold text-sm text-slate-900 truncate">{booking.guest.firstName} {booking.guest.lastName}</span>
                </div>
                <div className="text-sm text-slate-600 truncate">{booking.room?.name}</div>
                <div className="text-sm text-slate-600">{fmt(booking.checkIn)}</div>
                <div className="text-sm text-slate-600">{fmt(booking.checkOut)}</div>
                <div className="text-sm text-slate-600">{booking.numGuests}</div>
                <div><BookingStatusBadge status={booking.status} /></div>
                <div className="font-bold text-sm text-slate-900">€{Number(booking.totalPrice).toFixed(0)}</div>
                <div>
                  {booking.status === 'CONFIRMED' && (
                    linkSent ? (
                      <span className="text-xs font-semibold text-emerald-600">✓ Verstuurd</span>
                    ) : (
                      <button
                        onClick={() => sendPaymentLink.mutate({ id: booking.id, method: 'ideal' })}
                        disabled={isSending}
                        className="text-xs font-bold text-brand hover:underline disabled:opacity-60"
                      >
                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Betaallink'}
                      </button>
                    )
                  )}
                  {booking.status !== 'CONFIRMED' && (
                    <span className="text-xs font-bold text-brand cursor-pointer hover:underline">Details</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
