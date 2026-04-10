'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { IcalRoomCard } from '@/components/ical/ical-room-card';
import {
  ArrowLeft, Globe, Save, Plus, Trash2, BedDouble,
  ExternalLink, Loader2, Check, Users, Euro,
  Wifi, Car, Coffee, Wind, Thermometer, UtensilsCrossed,
  WashingMachine, Tv, Waves, Flower2, Sun, Bike,
  ArrowUpDown, Flame, Monitor, Lock, Droplets, Zap,
  Baby, ShieldCheck, Pencil, X, Sparkles,
  CalendarDays, Copy, RefreshCw, Link2,
} from 'lucide-react';

// Predefined amenity list
const AMENITY_LIST = [
  { key: 'wifi',       labelNl: 'WiFi',            icon: Wifi },
  { key: 'parking',    labelNl: 'Parkeren',         icon: Car },
  { key: 'breakfast',  labelNl: 'Ontbijt',          icon: Coffee },
  { key: 'airco',      labelNl: 'Airconditioning',  icon: Wind },
  { key: 'heating',    labelNl: 'Verwarming',       icon: Thermometer },
  { key: 'kitchen',    labelNl: 'Keuken',           icon: UtensilsCrossed },
  { key: 'washer',     labelNl: 'Wasmachine',       icon: WashingMachine },
  { key: 'tv',         labelNl: 'Televisie',        icon: Tv },
  { key: 'pool',       labelNl: 'Zwembad',          icon: Waves },
  { key: 'garden',     labelNl: 'Tuin',             icon: Flower2 },
  { key: 'terrace',    labelNl: 'Terras',           icon: Sun },
  { key: 'bicycle',    labelNl: 'Fietsen',          icon: Bike },
  { key: 'elevator',   labelNl: 'Lift',             icon: ArrowUpDown },
  { key: 'sauna',      labelNl: 'Sauna',            icon: Flame },
  { key: 'fireplace',  labelNl: 'Open haard',       icon: Flame },
  { key: 'bbq',        labelNl: 'BBQ',              icon: Flame },
  { key: 'desk',       labelNl: 'Werkplek',         icon: Monitor },
  { key: 'safe',       labelNl: 'Kluis',            icon: Lock },
  { key: 'iron',       labelNl: 'Strijkijzer',      icon: Zap },
  { key: 'hairdryer',  labelNl: 'Haardroger',       icon: Wind },
  { key: 'crib',       labelNl: 'Kinderbedje',      icon: Baby },
  { key: 'dishwasher', labelNl: 'Vaatwasser',       icon: Droplets },
  { key: 'ev_charger', labelNl: 'Laadpaal EV',      icon: Zap },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Photo { id: string; url: string; altText?: string; isCover: boolean; }
interface Room {
  id: string; name: string; descriptionNl?: string; descriptionEn?: string;
  pricePerNight: number; maxGuests: number; isActive: boolean;
  photos: Photo[];
}
interface Property {
  id: string; name: string; slug: string; isPublished: boolean;
  descriptionNl?: string; descriptionEn?: string;
  addressStreet?: string; addressCity?: string; addressZip?: string; addressCountry?: string;
  amenities: string[];
  checkInTime?: string; checkOutTime?: string; cancellationPolicy?: string;
  smokingAllowed: boolean; petsAllowed: boolean; childrenAllowed: boolean;
  showExtraServices?: boolean;
  photos: Photo[]; rooms: Room[];
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function SaveButton({ pending, saved }: { pending: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors ${
        saved ? 'bg-emerald-500 text-white' : 'bg-brand hover:bg-brand-600 disabled:opacity-50 text-white'
      }`}
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {pending ? 'Opslaan…' : saved ? 'Opgeslagen!' : 'Opslaan'}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const qc = useQueryClient();

  // Fetch property + upload status in parallel
  const { data: property, isLoading, isError } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`).then(r => r.data.data),
  });
  const { data: uploadStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ['upload-status'],
    queryFn: () => api.get('/upload/status').then(r => r.data?.data ?? r.data),
    staleTime: Infinity,
  });

  const updateProperty = useMutation({
    mutationFn: (dto: Partial<Property>) => api.patch(`/properties/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  // ── Details form state ──
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [detailsForm, setDetailsForm] = useState<Partial<Property> | null>(null);

  // ── Photo mutations ──
  const addPhoto = useMutation({
    mutationFn: (url: string) =>
      api.post(`/properties/${id}/photos`, { url, isCover: (property?.photos.length ?? 0) === 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['property', id] }),
  });
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const deletePhoto = useMutation({
    mutationFn: (photoId: string) => {
      setDeletingPhotoId(photoId);
      return api.delete(`/properties/photos/${photoId}`);
    },
    onSettled: () => setDeletingPhotoId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['property', id] }),
  });

  // ── Amenities saved state ──
  const [amenitiesSaved, setAmenitiesSaved] = useState(false);
  const toggleAmenity = async (key: string) => {
    const current: string[] = property?.amenities ?? [];
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    await updateProperty.mutateAsync({ amenities: next } as any);
    setAmenitiesSaved(true);
    setTimeout(() => setAmenitiesSaved(false), 2000);
  };

  // ── Extra services toggle ──
  const [showExtraServices, setShowExtraServices] = useState<boolean | null>(null);
  const extraServicesValue = showExtraServices !== null ? showExtraServices : (property?.showExtraServices !== false);
  const [extraServicesSaved, setExtraServicesSaved] = useState(false);

  // ── Policies form state ──
  const [policiesSaved, setPoliciesSaved] = useState(false);
  const [policiesForm, setPoliciesForm] = useState<Partial<Property> | null>(null);
  const handlePoliciesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policiesForm) return;
    await updateProperty.mutateAsync(policiesForm as any);
    setPoliciesSaved(true);
    setPoliciesForm(null);
    setTimeout(() => setPoliciesSaved(false), 2000);
  };
  const handlePolicyField = (field: string, value: any) => {
    setPoliciesForm(prev => ({ ...(prev ?? {}), [field]: value }));
    setPoliciesSaved(false);
  };
  const policiesData = policiesForm ?? {
    checkInTime: property?.checkInTime ?? '',
    checkOutTime: property?.checkOutTime ?? '',
    cancellationPolicy: property?.cancellationPolicy ?? '',
    smokingAllowed: property?.smokingAllowed ?? false,
    petsAllowed: property?.petsAllowed ?? false,
    childrenAllowed: property?.childrenAllowed ?? true,
  };

  // ── Room add ──
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', pricePerNight: '', maxGuests: '2', beds: '', sqm: '', minStay: '1' });
  const [roomError, setRoomError] = useState('');

  // ── Room edit ──
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomForm, setEditRoomForm] = useState({ name: '', pricePerNight: '', maxGuests: '2', beds: '', sqm: '', minStay: '1' });
  const [editRoomError, setEditRoomError] = useState('');

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditRoomForm({
      name: room.name,
      pricePerNight: String(room.pricePerNight),
      maxGuests: String(room.maxGuests),
      beds: '',
      sqm: '',
      minStay: '1',
    });
    setEditRoomError('');
  };

  const updateRoom = useMutation({
    mutationFn: (roomId: string) => api.patch(`/rooms/${roomId}`, {
      name: editRoomForm.name,
      pricePerNight: parseFloat(editRoomForm.pricePerNight),
      maxGuests: parseInt(editRoomForm.maxGuests),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      setEditingRoomId(null);
      setEditRoomError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setEditRoomError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Er is een fout opgetreden');
    },
  });

  const addRoom = useMutation({
    mutationFn: () => api.post('/rooms', {
      propertyId: id,
      name: roomForm.name,
      pricePerNight: parseFloat(roomForm.pricePerNight),
      maxGuests: parseInt(roomForm.maxGuests),
      ...(roomForm.beds ? { beds: parseInt(roomForm.beds) } : {}),
      ...(roomForm.sqm ? { sqm: parseInt(roomForm.sqm) } : {}),
      minStay: parseInt(roomForm.minStay) || 1,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      setShowAddRoom(false);
      setRoomForm({ name: '', pricePerNight: '', maxGuests: '2', beds: '', sqm: '', minStay: '1' });
      setRoomError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setRoomError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Er is een fout opgetreden');
    },
  });
  const deleteRoom = useMutation({
    mutationFn: (roomId: string) => api.delete(`/rooms/${roomId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['property', id] }),
  });

  // ── Loading / error ──
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-48 bg-brand-light rounded-2xl animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
        <div className="h-48 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">Accommodatie niet gevonden.</p>
        <Link href={`/${locale}/properties`} className="text-brand hover:underline text-sm">← Terug naar overzicht</Link>
      </div>
    );
  }

  // ── Derive form values ──
  const form = detailsForm ?? {
    name: property.name,
    descriptionNl: property.descriptionNl ?? '',
    descriptionEn: property.descriptionEn ?? '',
    addressStreet: property.addressStreet ?? '',
    addressCity: property.addressCity ?? '',
    addressZip: property.addressZip ?? '',
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProperty.mutateAsync(form);
    setDetailsSaved(true);
    setDetailsForm(null);
    setTimeout(() => setDetailsSaved(false), 2000);
  };

  const handleField = (field: string, value: string) => {
    setDetailsForm(prev => ({ ...(prev ?? form), [field]: value }));
    setDetailsSaved(false);
  };

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${locale}/properties`} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{property.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">/{property.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {property.isPublished && (
            <a
              href={`/${locale}/bnb/${property.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-600"
            >
              <ExternalLink className="w-4 h-4" />
              Bekijken
            </a>
          )}
          <button
            onClick={() => updateProperty.mutate({ isPublished: !property.isPublished })}
            disabled={updateProperty.isPending}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl transition-colors ${
              property.isPublished
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            {property.isPublished ? 'Gepubliceerd' : 'Concept'}
          </button>
        </div>
      </div>

      {/* ── Details ── */}
      <form onSubmit={handleDetailsSubmit} className="bg-white rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Gegevens</h2>
          <SaveButton pending={updateProperty.isPending} saved={detailsSaved} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Naam *</label>
          <input
            value={form.name ?? ''}
            onChange={e => handleField('name', e.target.value)}
            required
            className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Beschrijving <span className="text-slate-400">(NL)</span></label>
            <textarea
              value={form.descriptionNl ?? ''}
              onChange={e => handleField('descriptionNl', e.target.value)}
              rows={4}
              placeholder="Een prachtig pand..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400">(EN)</span></label>
            <textarea
              value={form.descriptionEn ?? ''}
              onChange={e => handleField('descriptionEn', e.target.value)}
              rows={4}
              placeholder="A beautiful property..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Straat</label>
          <input
            value={form.addressStreet ?? ''}
            onChange={e => handleField('addressStreet', e.target.value)}
            placeholder="Prinsengracht 123"
            className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Stad</label>
            <input
              value={form.addressCity ?? ''}
              onChange={e => handleField('addressCity', e.target.value)}
              placeholder="Amsterdam"
              className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Postcode</label>
            <input
              value={form.addressZip ?? ''}
              onChange={e => handleField('addressZip', e.target.value)}
              placeholder="1015 DX"
              className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>
      </form>

      {/* ── Rooms ── */}
      <div className="bg-white rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Kamers</h2>
          <button
            onClick={() => setShowAddRoom(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-600 px-3 py-1.5 rounded-xl hover:bg-brand-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Kamer toevoegen
          </button>
        </div>

        {showAddRoom && (
          <div className="bg-brand-light rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Nieuwe kamer</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
              <input
                value={roomForm.name}
                onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Garden Suite"
                className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Prijs per nacht (€) *</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={roomForm.pricePerNight}
                  onChange={e => setRoomForm(f => ({ ...f, pricePerNight: e.target.value }))}
                  placeholder="125.00"
                  className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Max. gasten</label>
                <input
                  type="number" min="1"
                  value={roomForm.maxGuests}
                  onChange={e => setRoomForm(f => ({ ...f, maxGuests: e.target.value }))}
                  className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bedden</label>
                <input
                  type="number" min="1"
                  value={roomForm.beds}
                  onChange={e => setRoomForm(f => ({ ...f, beds: e.target.value }))}
                  placeholder="2"
                  className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Opp. (m²)</label>
                <input
                  type="number" min="1"
                  value={roomForm.sqm}
                  onChange={e => setRoomForm(f => ({ ...f, sqm: e.target.value }))}
                  placeholder="25"
                  className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min. nachten</label>
                <input
                  type="number" min="1"
                  value={roomForm.minStay}
                  onChange={e => setRoomForm(f => ({ ...f, minStay: e.target.value }))}
                  className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
            {roomError && <p className="text-red-600 text-xs">{roomError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddRoom(false);
                  setRoomForm({ name: '', pricePerNight: '', maxGuests: '2', beds: '', sqm: '', minStay: '1' });
                  setRoomError('');
                }}
                className="px-3 py-2 text-sm text-slate-600 bg-white rounded-xl hover:bg-slate-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  if (!roomForm.name || !roomForm.pricePerNight) {
                    setRoomError('Naam en prijs zijn verplicht');
                    return;
                  }
                  addRoom.mutate();
                }}
                disabled={addRoom.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl transition-colors"
              >
                {addRoom.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Opslaan
              </button>
            </div>
          </div>
        )}

        {property.rooms.length === 0 && !showAddRoom ? (
          <div className="text-center py-8 text-slate-400">
            <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nog geen kamers toegevoegd</p>
          </div>
        ) : (
          <div className="space-y-2">
            {property.rooms.map(room => (
              <div key={room.id}>
                {editingRoomId === room.id ? (
                  // ── Inline edit form ──
                  <div className="bg-brand-light rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700">Kamer bewerken</h3>
                      <button onClick={() => setEditingRoomId(null)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Naam *</label>
                      <input
                        value={editRoomForm.name}
                        onChange={e => setEditRoomForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Prijs per nacht (€) *</label>
                        <input
                          type="number" min="0.01" step="0.01"
                          value={editRoomForm.pricePerNight}
                          onChange={e => setEditRoomForm(f => ({ ...f, pricePerNight: e.target.value }))}
                          className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Max. gasten</label>
                        <input
                          type="number" min="1"
                          value={editRoomForm.maxGuests}
                          onChange={e => setEditRoomForm(f => ({ ...f, maxGuests: e.target.value }))}
                          className="w-full px-3 py-2 bg-white rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </div>
                    </div>
                    {editRoomError && <p className="text-red-600 text-xs">{editRoomError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRoomId(null)}
                        className="px-3 py-2 text-sm text-slate-600 bg-white rounded-xl hover:bg-slate-50"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={() => {
                          if (!editRoomForm.name || !editRoomForm.pricePerNight) {
                            setEditRoomError('Naam en prijs zijn verplicht');
                            return;
                          }
                          updateRoom.mutate(room.id);
                        }}
                        disabled={updateRoom.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl transition-colors"
                      >
                        {updateRoom.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Opslaan
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── Normal row ──
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-brand-light/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-4 h-4 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{room.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Euro className="w-3 h-3" />€{Number(room.pricePerNight).toFixed(2)} / nacht
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Users className="w-3 h-3" />max. {room.maxGuests}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditRoom(room)}
                        className="text-slate-400 hover:text-brand transition-colors p-1.5 rounded-lg hover:bg-brand-light"
                        title="Kamer bewerken"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Kamer "${room.name}" verwijderen?`)) deleteRoom.mutate(room.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Kamer verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── iCal synchronisatie ── */}
      {property.rooms.length > 0 && (
        <div className="bg-white rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Kalender synchronisatie (iCal)</h2>
              <p className="text-xs text-slate-400">Synchroniseer beschikbaarheid met Airbnb, Booking.com en Google Calendar</p>
            </div>
          </div>
          <div className="space-y-2">
            {property.rooms.map(room => (
              <IcalRoomCard key={room.id} roomId={room.id} roomName={room.name} />
            ))}
          </div>
        </div>
      )}

      {/* ── Amenities ── */}
      <div className="bg-white rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Faciliteiten</h2>
          {amenitiesSaved && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <Check className="w-3.5 h-3.5" /> Opgeslagen
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">Klik op een faciliteit om aan/uit te zetten. Wijzigingen worden direct opgeslagen.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITY_LIST.map(({ key, labelNl, icon: Icon }) => {
            const active = (property.amenities ?? []).includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleAmenity(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  active
                    ? 'border-brand/20 bg-brand-light text-brand-600'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand' : 'text-slate-300'}`} />
                {labelNl}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Policies ── */}
      <form onSubmit={handlePoliciesSubmit} className="bg-white rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Huisregels & beleid</h2>
          <SaveButton pending={updateProperty.isPending} saved={policiesSaved} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Inchecken vanaf</label>
            <input
              type="time"
              value={policiesData.checkInTime ?? ''}
              onChange={e => handlePolicyField('checkInTime', e.target.value)}
              className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Uitchecken voor</label>
            <input
              type="time"
              value={policiesData.checkOutTime ?? ''}
              onChange={e => handlePolicyField('checkOutTime', e.target.value)}
              className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Annuleringsbeleid</label>
          <textarea
            rows={2}
            value={policiesData.cancellationPolicy ?? ''}
            onChange={e => handlePolicyField('cancellationPolicy', e.target.value)}
            placeholder="Bijv. Gratis annuleren tot 48 uur voor aankomst..."
            className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30 resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { field: 'smokingAllowed', label: 'Roken toegestaan' },
            { field: 'petsAllowed', label: 'Huisdieren welkom' },
            { field: 'childrenAllowed', label: 'Kinderen welkom' },
          ].map(({ field, label }) => (
            <button
              key={field}
              type="button"
              onClick={() => handlePolicyField(field, !(policiesData as any)[field])}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                (policiesData as any)[field]
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${(policiesData as any)[field] ? 'text-green-600' : 'text-slate-300'}`} />
              {label}
            </button>
          ))}
        </div>
      </form>

      {/* ── Extra Experiences ── */}
      <div className="bg-white rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Extra Ervaringen</h2>
              <p className="text-xs text-slate-400">Toon of verberg de ervaringsmodule op je boekingspagina</p>
            </div>
          </div>
          {extraServicesSaved && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <Check className="w-3.5 h-3.5" /> Opgeslagen
            </span>
          )}
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Ontdek extra ervaringen</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Laat gasten extra activiteiten ontdekken op je boekingspagina
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !extraServicesValue;
              setShowExtraServices(next);
              updateProperty.mutate({ showExtraServices: next } as any, {
                onSuccess: () => {
                  setExtraServicesSaved(true);
                  setTimeout(() => setExtraServicesSaved(false), 2000);
                },
              });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              extraServicesValue ? 'bg-brand' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                extraServicesValue ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {extraServicesValue ? '✅ Zichtbaar voor gasten' : '🚫 Verborgen voor gasten'}
        </p>
      </div>

      {/* ── Photos ── */}
      <div className="bg-white rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Foto&apos;s</h2>
        <PhotoUpload
          photos={property.photos}
          uploadEnabled={uploadStatus?.enabled ?? false}
          onUpload={async url => { await addPhoto.mutateAsync(url); }}
          onDelete={photoId => deletePhoto.mutate(photoId)}
          deletingId={deletingPhotoId}
        />
      </div>

    </div>
  );
}
