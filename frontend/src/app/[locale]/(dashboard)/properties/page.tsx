'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Plus, Edit, ExternalLink, BedDouble, Users, Wifi, Tv,
  Coffee, Bike, Wind, PawPrint, UtensilsCrossed, Bath,
  Waves, Globe, Wrench,
} from 'lucide-react';

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, tv: Tv, coffee: Coffee, breakfast: Coffee, bicycle: Bike,
  airConditioning: Wind, petsAllowed: PawPrint, kitchen: UtensilsCrossed,
  bath: Bath, pool: Waves,
};

function AmenityTag({ label }: { label: string }) {
  return (
    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
      {label}
    </span>
  );
}

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

export default function PropertiesPage() {
  const { locale } = useParams();
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/properties/${id}`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });

  // Flatten all rooms from all properties
  const allRooms = (properties as any[]).flatMap((p: any) =>
    (p.rooms ?? []).map((r: any, idx: number) => ({
      ...r,
      property: p,
      // Mock occupancy percentage (65-90%) - replace with real data when available
      occupancyPct: Math.min(95, 55 + ((r.name?.length ?? 3) * 7) % 40),
    }))
  );

  const amenityLabels: Record<string, string> = {
    wifi: 'WiFi', tv: 'TV', coffee: 'Koffie', breakfast: 'Ontbijt',
    bicycle: 'Fiets', airConditioning: 'Airco', petsAllowed: 'Huisdieren',
    kitchen: 'Keuken', bath: 'Bad', pool: 'Zwembad', parking: 'Parkeren',
    balkon: 'Balkon', balcony: 'Balkon',
  };

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Title + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kamers</h1>
          <p className="text-slate-400 mt-1">Beheer je kamers en accommodaties</p>
        </div>
        <Link
          href={`/${locale}/properties/new`}
          className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Kamer toevoegen
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : allRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8 text-brand" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">Nog geen kamers</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Voeg je eerste accommodatie toe om kamers te beheren.</p>
          <Link
            href={`/${locale}/properties/new`}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Eerste accommodatie toevoegen
          </Link>
        </div>
      ) : (
        <>
          {/* Properties group header + room cards */}
          {(properties as any[]).map((property: any) => (
            <div key={property.id}>
              {/* Property header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">{property.name}</h2>
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
                {(property.rooms ?? []).map((room: any) => {
                  const amenities: string[] = room.amenities ?? property.amenities ?? [];
                  const occupancyPct = Math.min(95, 55 + ((room.name?.length ?? 3) * 7) % 40);

                  return (
                    <div key={room.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Orange header */}
                      <div className="bg-brand px-5 py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-white text-base leading-tight">{room.name}</h3>
                            <p className="text-white/70 text-xs mt-0.5">{property.name}</p>
                          </div>
                          {room.status === 'MAINTENANCE' && (
                            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <Wrench className="w-2.5 h-2.5" />
                              Onderhoud
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-4">
                        {/* Capacity + price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{room.maxGuests ?? 2} personen</span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-slate-900">€{Number(room.pricePerNight ?? 0).toFixed(0)}</span>
                            <span className="text-xs text-slate-400 ml-1">per nacht</span>
                          </div>
                        </div>

                        {/* Occupancy */}
                        <OccupancyBar pct={occupancyPct} />

                        {/* Amenities */}
                        {amenities.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 mb-2">Voorzieningen</p>
                            <div className="flex flex-wrap gap-1.5">
                              {amenities.slice(0, 4).map((a) => (
                                <AmenityTag key={a} label={amenityLabels[a] ?? a} />
                              ))}
                              {amenities.length > 4 && (
                                <span className="text-xs text-slate-400 self-center">+{amenities.length - 4}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2 pt-1">
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
