'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, BedDouble, Check, AlertCircle, Plus } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITIES = [
  { key: 'wifi',    label: 'WiFi' },
  { key: 'tv',      label: 'TV' },
  { key: 'coffee',  label: 'Koffie/thee' },
  { key: 'airco',   label: 'Airconditioning' },
  { key: 'bath',    label: 'Eigen badkamer' },
  { key: 'parking', label: 'Parkeren' },
];

const BED_TYPES = [
  { value: 'single', label: 'Eenpersoonesbed' },
  { value: 'double', label: 'Tweepersoonesbed' },
  { value: 'queen',  label: 'Queen bed' },
  { value: 'king',   label: 'King bed' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewRoomPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Step: 'property' = select property, 'room' = fill room details
  const [step, setStep] = useState<'property' | 'room'>('property');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  const [form, setForm] = useState({
    name: '',
    descriptionNl: '',
    pricePerNight: '',
    maxGuests: '2',
    bedType: '',
    bedCount: '1',
    amenities: [] as string[],
  });
  const [apiError, setApiError] = useState('');

  // ── Data ──
  const { data: properties = [], isLoading } = useQuery<any[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
    // Auto-select if only one property
    select: (data) => data,
  });

  // Auto-advance past property step if there's exactly one property
  const handlePropertyLoad = (data: any[]) => {
    if (data.length === 1) {
      setSelectedPropertyId(data[0].id);
      setStep('room');
    }
  };

  const { data: propertiesData = [] } = useQuery<any[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => {
      const d = r.data.data;
      handlePropertyLoad(d);
      return d;
    }),
    staleTime: 30_000,
  });

  const createRoom = useMutation({
    mutationFn: () =>
      api.post('/rooms', {
        propertyId: selectedPropertyId,
        name: form.name.trim(),
        ...(form.descriptionNl.trim() && { descriptionNl: form.descriptionNl.trim() }),
        pricePerNight: parseFloat(form.pricePerNight),
        maxGuests: parseInt(form.maxGuests),
        minStay: 1,
        ...(form.amenities.length > 0 && { amenities: form.amenities }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      router.push(`/${locale}/properties/${selectedPropertyId}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Er is een fout opgetreden');
    },
  });

  const toggleAmenity = (key: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }));
  };

  const canSave =
    form.name.trim().length > 0 &&
    form.pricePerNight.trim().length > 0 &&
    parseFloat(form.pricePerNight) > 0;

  const inp = 'w-full px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-slate-400';

  // ── Render ──

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/properties`}
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand-light border border-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-sm text-slate-400">Terug naar kamers</p>
          <h1 className="text-2xl font-bold text-slate-900">Nieuwe kamer toevoegen</h1>
          <p className="text-slate-400 text-sm mt-0.5">Voeg alle details toe om je kamer online te zetten</p>
        </div>
      </div>

      {/* ── Step 1: Select property ── */}
      {step === 'property' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg mb-1">Kies een accommodatie</h2>
            <p className="text-sm text-slate-400">
              Aan welke accommodatie wil je deze kamer toevoegen?
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : propertiesData.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BedDouble className="w-7 h-7 text-brand" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Nog geen accommodaties</p>
              <p className="text-slate-400 text-sm mb-5">
                Maak eerst een accommodatie aan voordat je kamers toevoegt.
              </p>
              <Link
                href={`/${locale}/properties/new`}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Accommodatie aanmaken
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {(propertiesData as any[]).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedPropertyId === p.id
                        ? 'border-brand bg-brand-light/30'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedPropertyId === p.id ? 'bg-brand' : 'bg-white border border-slate-200'
                    }`}>
                      {selectedPropertyId === p.id
                        ? <Check className="w-5 h-5 text-white" />
                        : <BedDouble className="w-5 h-5 text-slate-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                      {p.addressCity && (
                        <p className="text-xs text-slate-400 mt-0.5">{p.addressCity}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {p.rooms?.length ?? 0} {(p.rooms?.length ?? 0) === 1 ? 'kamer' : 'kamers'}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('room')}
                disabled={!selectedPropertyId}
                className="w-full bg-brand hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl text-sm transition-colors"
              >
                Volgende →
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Room details ── */}
      {step === 'room' && (
        <>
          {/* Basis informatie */}
          <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">Basis informatie</h2>
              <p className="text-sm text-slate-400">Geef je kamer een naam en beschrijving</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Naam van de kamer <span className="text-brand">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Kies een herkenbare naam die de kamer goed beschrijft"
                className={inp}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Beschrijving</label>
              <textarea
                value={form.descriptionNl}
                onChange={(e) => setForm((f) => ({ ...f, descriptionNl: e.target.value }))}
                placeholder="Help gasten zich een voorstelling te maken van de kamer"
                rows={3}
                className={`${inp} resize-none`}
              />
            </div>
          </div>

          {/* Prijs en capaciteit */}
          <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">Prijs en capaciteit</h2>
              <p className="text-sm text-slate-400">Stel de prijs en aantal gasten in</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prijs per nacht <span className="text-brand">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold pointer-events-none">
                    €
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricePerNight}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                    placeholder="95"
                    className={`${inp} pl-8`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Maximaal aantal gasten
                </label>
                <select
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  className={inp}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'gast' : 'gasten'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bed configuratie */}
          <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">Bed configuratie</h2>
              <p className="text-sm text-slate-400">Welke bedden heeft deze kamer?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Type bed</label>
                <select
                  value={form.bedType}
                  onChange={(e) => setForm((f) => ({ ...f, bedType: e.target.value }))}
                  className={inp}
                >
                  <option value="">Kies type</option>
                  {BED_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Aantal bedden</label>
                <select
                  value={form.bedCount}
                  onChange={(e) => setForm((f) => ({ ...f, bedCount: e.target.value }))}
                  className={inp}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'bed' : 'bedden'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Voorzieningen */}
          <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">Voorzieningen</h2>
              <p className="text-sm text-slate-400">Selecteer alle voorzieningen die beschikbaar zijn</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map((a) => {
                const active = form.amenities.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAmenity(a.key)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                      active
                        ? 'border-brand bg-brand-light/30 text-brand'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      active ? 'bg-brand' : 'bg-white border border-slate-300'
                    }`}>
                      {active && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Foto's info */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-slate-700">Foto's toevoegen</p>
              <p className="text-sm text-slate-400 mt-0.5">
                Na het aanmaken kun je foto's toevoegen via de kamer bewerkingspagina.
                Voeg minimaal 5 foto's toe voor de beste presentatie.
              </p>
            </div>
          </div>

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-3 bg-red-50 rounded-2xl px-5 py-4 border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{apiError}</p>
            </div>
          )}

          {/* Validation hint */}
          {!canSave && (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Vul minimaal de naam en prijs in om de kamer op te slaan
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('property')}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={() => { setApiError(''); createRoom.mutate(); }}
              disabled={!canSave || createRoom.isPending}
              className="flex-1 bg-brand hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl text-sm transition-colors"
            >
              {createRoom.isPending ? 'Bezig...' : 'Kamer opslaan'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
