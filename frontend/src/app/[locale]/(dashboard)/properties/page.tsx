'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Edit, ExternalLink, BedDouble, Users, Globe, Wrench, TrendingUp } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi', tv: 'TV', coffee: 'Koffie', breakfast: 'Ontbijt',
  bicycle: 'Fiets', airco: 'Airco', airConditioning: 'Airco',
  petsAllowed: 'Huisdieren', kitchen: 'Keuken', bath: 'Bad',
  balkon: 'Balkon', balcony: 'Balkon', pool: 'Zwembad', parking: 'Parkeren',
};

// Derive a display type from room name
function getRoomType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('suite')) return 'Suite';
  if (n.includes('familie') || n.includes('family')) return 'Familie';
  if (n.includes('deluxe')) return 'Deluxe';
  if (n.includes('budget')) return 'Budget';
  return 'Standaard';
}

// Derive mock status: isActive=false → Onderhoud, else alternate Beschikbaar/Bezet
function getRoomStatus(room: any, index: number): 'Beschikbaar' | 'Bezet' | 'Onderhoud' {
  if (!room.isActive) return 'Onderhoud';
  // Use name-length as deterministic mock (replace with real booking status later)
  const pct = Math.min(95, 55 + ((room.name?.length ?? 3) * 7) % 40);
  if (pct > 80) return 'Bezet';
  return 'Beschikbaar';
}

const STATUS_STYLES: Record<string, string> = {
  Beschikbaar: 'bg-emerald-100 text-emerald-700',
  Bezet:       'bg-red-100 text-red-600',
  Onderhoud:   'bg-amber-100 text-amber-700',
};

function OccupancyBar({ pct }: { pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500">Bezettingsgraad</span>
        <span className="text-xs font-bold text-slate-900">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const { locale } = useParams<{ locale: string }>();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: properties = [], isLoading } = useQuery<any[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/properties/${id}`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });

  // Flatten all rooms with derived status/type
  const allRooms = useMemo(() =>
    (properties as any[]).flatMap((p: any, pi: number) =>
      (p.rooms ?? []).map((r: any, ri: number) => ({
        ...r,
        property: p,
        status: getRoomStatus(r, pi * 10 + ri),
        type: getRoomType(r.name ?? ''),
        occupancyPct: Math.min(95, 55 + ((r.name?.length ?? 3) * 7) % 40),
        amenities: r.amenities ?? p.amenities ?? [],
      }))
    ),
    [properties]
  );

  // Stats
  const totalRooms = allRooms.length;
  const beschikbaar = allRooms.filter(r => r.status === 'Beschikbaar').length;
  const bezet = allRooms.filter(r => r.status === 'Bezet').length;
  const avgPrice = totalRooms > 0
    ? Math.round(allRooms.reduce((s, r) => s + Number(r.pricePerNight ?? 0), 0) / totalRooms)
    : 0;

  // Filtered rooms
  const filtered = allRooms.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    return true;
  });

  const selectCls = 'text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20 hover:border-slate-300 transition-colors';

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kamers</h1>
          <p className="text-slate-400 mt-1">Beheer je accommodaties</p>
        </div>
        <Link
          href={`/${locale}/properties/rooms/new`}
          className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors shadow-sm shadow-brand/20"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Kamer
        </Link>
      </div>

      {/* Stats bar */}
      {!isLoading && totalRooms > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Totale Kamers', value: totalRooms, icon: BedDouble, color: 'text-slate-700', tooltip: 'Totaal aantal verhuurbare kamers in je accommodatie.' },
            { label: 'Beschikbaar',   value: beschikbaar, icon: TrendingUp, color: 'text-emerald-600', tooltip: 'Kamers die momenteel beschikbaar zijn voor nieuwe boekingen.' },
            { label: 'Bezet',        value: bezet,        icon: Users,      color: 'text-red-500',    tooltip: 'Kamers die momenteel bezet zijn of onderhoud ondergaan.' },
            { label: 'Gem. Prijs',   value: `€${avgPrice}`, icon: null,    color: 'text-brand',      tooltip: 'Gemiddelde prijs per nacht over alle kamers.' },
          ].map(({ label, value, icon: Icon, color, tooltip }) => (
            <div key={label} className="bg-white rounded-2xl px-5 py-4 border border-slate-100 flex items-center gap-3">
              {Icon && (
                <Tooltip content={tooltip} position="top">
                  <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center cursor-default">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </Tooltip>
              )}
              <div>
                <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : allRooms.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8 text-brand" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">Nog geen kamers</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Voeg je eerste kamer toe om boekingen te ontvangen.
          </p>
          <Link
            href={`/${locale}/properties/rooms/new`}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Eerste kamer toevoegen
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectCls}
            >
              <option value="all">Alle statussen</option>
              <option value="Beschikbaar">Beschikbaar</option>
              <option value="Bezet">Bezet</option>
              <option value="Onderhoud">Onderhoud</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={selectCls}
            >
              <option value="all">Alle types</option>
              <option value="Suite">Suite</option>
              <option value="Standaard">Standaard</option>
              <option value="Familie">Familie</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Budget">Budget</option>
            </select>

            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                className="text-sm text-slate-400 hover:text-slate-600 font-semibold px-2"
              >
                Wis filters
              </button>
            )}
          </div>

          {/* Properties with rooms */}
          {(properties as any[]).map((property: any) => {
            const propertyRooms = filtered.filter(r => r.property.id === property.id);
            if (propertyRooms.length === 0) return null;

            return (
              <div key={property.id}>
                {/* Property header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-slate-800">{property.name}</h2>
                    {property.addressCity && (
                      <span className="text-sm text-slate-400">{property.addressCity}</span>
                    )}
                    <button
                      onClick={() => togglePublish.mutate({ id: property.id, isPublished: !property.isPublished })}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                        property.isPublished
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      {property.isPublished ? 'Gepubliceerd' : 'Concept'}
                    </button>
                  </div>
                  <Link
                    href={`/${locale}/properties/${property.id}`}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    Accommodatie bewerken →
                  </Link>
                </div>

                {/* Room cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {propertyRooms.map((room: any) => (
                    <div
                      key={room.id}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Card header */}
                      <div className="px-5 pt-5 pb-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[room.status]}`}>
                                {room.status}
                              </span>
                              {room.status === 'Onderhoud' && (
                                <Wrench className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                              {room.name}
                            </h3>
                            <span className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md mt-1">
                              {room.type}
                            </span>
                          </div>
                        </div>

                        {/* Capacity + price */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Users className="w-4 h-4 text-slate-300" />
                            <span>{room.maxGuests ?? 2} personen</span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-extrabold text-slate-900">
                              €{Number(room.pricePerNight ?? 0).toFixed(0)}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">per nacht</span>
                          </div>
                        </div>

                        {/* Occupancy */}
                        <OccupancyBar pct={room.occupancyPct} />
                      </div>

                      {/* Amenities */}
                      {room.amenities.length > 0 && (
                        <div className="px-5 pb-4">
                          <p className="text-xs font-semibold text-slate-400 mb-2">Voorzieningen</p>
                          <div className="flex flex-wrap gap-1.5">
                            {room.amenities.slice(0, 4).map((a: string) => (
                              <span
                                key={a}
                                className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg"
                              >
                                {AMENITY_LABELS[a] ?? a}
                              </span>
                            ))}
                            {room.amenities.length > 4 && (
                              <span className="text-xs text-slate-400 self-center">
                                +{room.amenities.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="px-5 pb-5 flex gap-2">
                        <Link
                          href={`/${locale}/properties/${property.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Bewerken
                        </Link>
                        {property.isPublished && (
                          <a
                            href={`/${locale}/bnb/${property.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Details
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
