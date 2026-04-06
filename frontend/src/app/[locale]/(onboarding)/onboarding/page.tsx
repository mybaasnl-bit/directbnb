'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Check, ChevronLeft, Copy, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingState {
  completed: boolean;
  step: number;      // 1–7
  propertyId: string | null;
  propertySlug: string | null;
  data: {
    bnbName: string;
    location: string;
    description: string;
    pricePerNight: string;
    maxGuests: string;
    numRooms: string;
    blockedDates: string[];
    iban: string;
    ibanHolder: string;
  };
}

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  step: 1,
  propertyId: null,
  propertySlug: null,
  data: {
    bnbName: '',
    location: '',
    description: '',
    pricePerNight: '',
    maxGuests: '2',
    numRooms: '1',
    blockedDates: [],
    iban: '',
    ibanHolder: '',
  },
};

function storageKey(userId: string) {
  return `onboarding_${userId}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / (total - 1)) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Stap {step} van {total}
        </span>
        <span className="text-xs font-bold text-brand">{pct}% voltooid</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeatureBadge({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-400 leading-snug">{desc}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [copied, setCopied] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(storageKey(user.id));
      if (saved) {
        const parsed: OnboardingState = JSON.parse(saved);
        // If already completed, redirect to dashboard
        if (parsed.completed) {
          router.replace(`/${locale}/dashboard`);
          return;
        }
        setState(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
  }, [user?.id, locale, router]);

  // Persist state to localStorage whenever it changes
  const save = useCallback(
    (next: OnboardingState) => {
      setState(next);
      if (user?.id) {
        localStorage.setItem(storageKey(user.id), JSON.stringify(next));
      }
    },
    [user?.id]
  );

  const setStep = (step: number) => save({ ...state, step });
  const updateData = (patch: Partial<OnboardingState['data']>) =>
    save({ ...state, data: { ...state.data, ...patch } });

  // ── Mutations ──

  const createProperty = useMutation({
    mutationFn: () =>
      api.post('/properties', {
        name: state.data.bnbName.trim(),
        addressCity: state.data.location.trim(),
        ...(state.data.description.trim() && { descriptionNl: state.data.description.trim() }),
      }),
    onSuccess: (res) => {
      const prop = res.data.data;
      const next = { ...state, step: 3, propertyId: prop.id, propertySlug: prop.slug };
      save(next);
      setApiError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Er is een fout opgetreden');
    },
  });

  const createRoom = useMutation({
    mutationFn: () =>
      api.post(`/properties/${state.propertyId}/rooms`, {
        name: state.data.bnbName.trim()
          ? `Kamer ${state.data.bnbName}`
          : 'Standaard Kamer',
        pricePerNight: parseFloat(state.data.pricePerNight) || 100,
        maxGuests: parseInt(state.data.maxGuests) || 2,
        minStay: 1,
      }),
    onSuccess: () => {
      save({ ...state, step: 4 });
      setApiError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Er is een fout opgetreden');
    },
  });

  // ── Validation ──

  const validate = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 2) {
      if (!state.data.bnbName.trim()) errs.bnbName = 'Naam is verplicht';
      if (!state.data.location.trim()) errs.location = 'Locatie is verplicht';
    }
    if (step === 3) {
      if (!state.data.pricePerNight || parseFloat(state.data.pricePerNight) <= 0)
        errs.pricePerNight = 'Voer een geldige prijs in';
    }
    if (step === 5) {
      if (!state.data.iban.trim()) errs.iban = 'IBAN is verplicht';
      if (!state.data.ibanHolder.trim()) errs.ibanHolder = 'Naam rekeninghouder is verplicht';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Next handler ──

  const handleNext = () => {
    setApiError('');
    if (!validate(state.step)) return;

    if (state.step === 2) {
      createProperty.mutate();
      return;
    }
    if (state.step === 3) {
      createRoom.mutate();
      return;
    }
    if (state.step === 7) {
      const completed = { ...state, completed: true };
      save(completed);
      router.push(`/${locale}/dashboard`);
      return;
    }
    setStep(state.step + 1);
  };

  const handlePrev = () => {
    if (state.step > 1) setStep(state.step - 1);
  };

  const copyLink = () => {
    const link = `directbnb.nl/${state.propertySlug ?? 'jouw-bnb'}`;
    navigator.clipboard.writeText(`https://${link}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Styles ──

  const inp = 'w-full px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-slate-400';
  const isPending = createProperty.isPending || createRoom.isPending;

  // ── Render ──

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">
            Direct<span className="text-brand">BnB</span>
          </span>
        </div>
        {state.step > 1 && state.step < 7 && (
          <span className="text-xs font-semibold text-slate-400">Setup wizard</span>
        )}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-brand">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400">Eigenaar</p>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">

          {/* Progress (shown on steps 2–6) */}
          {state.step >= 2 && state.step <= 6 && (
            <ProgressBar step={state.step} total={7} />
          )}

          {/* ── Step 1: Welcome ── */}
          {state.step === 1 && (
            <div className="space-y-6">
              <div className="text-center pt-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                  Welkom bij DirectBnB 👋
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed max-w-sm mx-auto">
                  Zet je B&amp;B in 5 minuten online en ontvang directe boekingen zonder commissie.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FeatureBadge icon="💰" title="Geen commissies" desc="Houd 100% van je inkomsten" />
                <FeatureBadge icon="⚡" title="5 minuten setup" desc="Simpel en snel aan de slag" />
                <FeatureBadge icon="🚀" title="Direct live" desc="Ontvang meteen boekingen" />
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-brand hover:bg-brand-600 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-brand/20"
              >
                Start setup
              </button>

              <p className="text-center text-xs text-slate-400">
                Je kunt op elk moment pauzeren en later verdergaan
              </p>
            </div>
          )}

          {/* ── Step 2: B&B info ── */}
          {state.step === 2 && (
            <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Vertel ons over je B&amp;B</h2>
                <p className="text-sm text-slate-400">
                  We hebben wat basisinformatie nodig om je pagina te maken
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Naam van je B&amp;B
                </label>
                <input
                  value={state.data.bnbName}
                  onChange={(e) => updateData({ bnbName: e.target.value })}
                  placeholder="Bijvoorbeeld: De Groene Oase"
                  className={inp}
                />
                {fieldErrors.bnbName && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.bnbName}</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">
                  Deze naam zien je gasten op de boekingspagina
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Locatie</label>
                <input
                  value={state.data.location}
                  onChange={(e) => updateData({ location: e.target.value })}
                  placeholder="Bijvoorbeeld: Amsterdam, Nederland"
                  className={inp}
                />
                {fieldErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">
                  Stad of regio waar je B&amp;B zich bevindt
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Korte beschrijving
                </label>
                <textarea
                  value={state.data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                  placeholder="Vertel gasten waarom ze voor jouw B&B moeten kiezen"
                  rows={3}
                  className={`${inp} resize-none`}
                />
              </div>

              {apiError && (
                <div className="bg-red-50 rounded-xl px-4 py-3 text-red-600 text-sm border border-red-100">
                  {apiError}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Prices ── */}
          {state.step === 3 && (
            <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Prijzen en capaciteit</h2>
                <p className="text-sm text-slate-400">Stel je basisprijzen en capaciteit in</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prijs per nacht
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold pointer-events-none">
                    €
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={state.data.pricePerNight}
                    onChange={(e) => updateData({ pricePerNight: e.target.value })}
                    placeholder="125"
                    className={`${inp} pl-8`}
                  />
                </div>
                {fieldErrors.pricePerNight && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.pricePerNight}</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">
                  Dit is je standaard prijs. Je kunt later seizoensprijzen instellen
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Aantal gasten per kamer
                </label>
                <select
                  value={state.data.maxGuests}
                  onChange={(e) => updateData({ maxGuests: e.target.value })}
                  className={inp}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'gast' : 'gasten'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1.5">Gemiddeld aantal gasten per kamer</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Aantal kamers
                </label>
                <select
                  value={state.data.numRooms}
                  onChange={(e) => updateData({ numRooms: e.target.value })}
                  className={inp}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'kamer' : 'kamers'}
                    </option>
                  ))}
                  <option value="6">6+</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5">Hoeveel kamers verhuur je?</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
                <span className="text-lg">💡</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">Handig om te weten:</strong> Je kunt dit later
                  altijd aanpassen. Je kunt ook verschillende prijzen per kamer instellen in het
                  dashboard.
                </p>
              </div>

              {apiError && (
                <div className="bg-red-50 rounded-xl px-4 py-3 text-red-600 text-sm border border-red-100">
                  {apiError}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Availability ── */}
          {state.step === 4 && (
            <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Beschikbaarheid</h2>
                <p className="text-sm text-slate-400">
                  Geef aan wanneer je kamers beschikbaar zijn
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Standaard ben je altijd beschikbaar
                  </p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Je kunt in het dashboard specifieke datums blokkeren wanneer je niet beschikbaar
                    bent.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
                <p className="text-sm text-slate-500 mb-1 font-semibold">
                  📅 Beschikbaarheidskalender
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Na het instellen kun je in het dashboard je agenda beheren, specifieke datums
                  blokkeren en je seizoensrooster instellen.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
                <span className="text-lg">😌</span>
                <div>
                  <p className="text-sm font-bold text-slate-700">Geen zorgen!</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Je kunt je beschikbaarheid op elk moment aanpassen in het dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Payments ── */}
          {state.step === 5 && (
            <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Betalingen instellen</h2>
                <p className="text-sm text-slate-400">
                  Ontvang je inkomsten direct op je eigen rekening
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                <span className="text-lg">🔒</span>
                <div>
                  <p className="text-sm font-bold text-slate-700">Veilig en betrouwbaar</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Je betaalgegevens worden veilig opgeslagen. Gasten betalen direct op jouw
                    rekening na hun check-in. Geen commissies, geen wachttijden.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  IBAN nummer
                </label>
                <input
                  value={state.data.iban}
                  onChange={(e) => updateData({ iban: e.target.value })}
                  placeholder="NL00 ABCD 0123 4567 89"
                  className={inp}
                />
                {fieldErrors.iban && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.iban}</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">
                  Je Nederlandse of Europese bankrekeningnummer
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Naam rekeninghouder
                </label>
                <input
                  value={state.data.ibanHolder}
                  onChange={(e) => updateData({ ibanHolder: e.target.value })}
                  placeholder={user ? `${user.firstName} ${user.lastName}` : 'Naam op je bankrekening'}
                  className={inp}
                />
                {fieldErrors.ibanHolder && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.ibanHolder}</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">
                  Naam zoals vermeld op je bankrekening
                </p>
              </div>

              {/* Payment info */}
              <div className="border border-slate-100 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Hoe werken betalingen?
                </p>
                {[
                  'Gasten betalen bij het boeken',
                  'Geld wordt automatisch overgeboekt na check-in',
                  'Geen commissies — je ontvangt 100%',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>🔐</span>
                <span>Beveiligd met 256-bit encryptie</span>
              </div>
            </div>
          )}

          {/* ── Step 6: Automatic emails ── */}
          {state.step === 6 && (
            <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Automatische emails</h2>
                <p className="text-sm text-slate-400">
                  We sturen automatisch bevestigingen naar je gasten
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Goed nieuws!</p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    We hebben alvast een professionele email template voor je gemaakt. Deze wordt
                    automatisch verstuurd naar gasten wanneer ze boeken.
                  </p>
                </div>
              </div>

              {/* Email preview */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Bedankt voor je boeking! 🎉</p>
                    <p className="text-xs text-slate-400">{state.data.bnbName || 'Jouw B&B'}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Beste [Gastnaam], wat leuk dat je hebt geboekt bij{' '}
                  <strong>{state.data.bnbName || 'je B&B'}</strong>! We kijken er naar uit om je te
                  verwelkomen.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Check-in', value: '[Datum]' },
                    { label: 'Check-out', value: '[Datum]' },
                    { label: 'Aantal gasten', value: '[Aantal]' },
                    { label: 'Totaalprijs', value: '€[Prijs]' },
                  ].map((r) => (
                    <div key={r.label} className="bg-white rounded-xl p-2.5 border border-slate-100">
                      <p className="text-[10px] text-slate-400">{r.label}</p>
                      <p className="text-xs font-bold text-slate-800">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email schedule */}
              <div className="space-y-2.5">
                {[
                  { icon: '⚡', label: 'Automatisch verstuurd', sub: 'Direct na boeking' },
                  { icon: '⏰', label: 'Herinneringen', sub: '1 week voor aankomst' },
                  { icon: '⭐', label: 'Bedankmail', sub: 'Na check-out' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100"
                  >
                    <span className="text-lg w-8 text-center">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 text-center">
                Wil je de email aanpassen? Dat kan later in het dashboard.
              </p>
            </div>
          )}

          {/* ── Step 7: Complete ── */}
          {state.step === 7 && (
            <div className="space-y-6 text-center">
              <div className="pt-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-4xl">🚀</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
                  Je B&amp;B is nu live!
                </h1>
                <p className="text-slate-500 text-lg">
                  Gefeliciteerd! Je kunt nu directe boekingen ontvangen zonder commissies.
                </p>
              </div>

              {/* Booking link */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 text-left space-y-3">
                <p className="text-sm font-semibold text-slate-500">
                  Jouw persoonlijke boekingslink:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 overflow-hidden text-ellipsis">
                    directbnb.nl/{state.propertySlug ?? 'jouw-bnb'}
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors flex-shrink-0 ${
                      copied
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-brand text-white hover:bg-brand-600'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Gekopieerd' : 'Kopieer'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Deel deze link om boekingen te ontvangen</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {state.propertySlug && (
                  <a
                    href={`/${locale}/bnb/${state.propertySlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-brand hover:text-brand text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Bekijk je boekingspagina
                  </a>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 bg-brand hover:bg-brand-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-lg shadow-brand/20"
                >
                  Ga naar dashboard →
                </button>
              </div>

              {/* Tips */}
              <div className="grid grid-cols-3 gap-3 text-left">
                {[
                  { icon: '📱', title: 'Deel je link', desc: 'Zet de link op je website, social media en in je email signature' },
                  { icon: '🎨', title: 'Personaliseer', desc: "Pas je pagina verder aan in het dashboard voor een perfecte uitstraling" },
                  { icon: '📊', title: 'Monitor', desc: 'Volg je boekingen en inkomsten realtime in je dashboard' },
                ].map((tip) => (
                  <div key={tip.title} className="bg-white rounded-2xl p-4 border border-slate-100">
                    <span className="text-xl block mb-2">{tip.icon}</span>
                    <p className="text-sm font-bold text-slate-800 mb-1">{tip.title}</p>
                    <p className="text-xs text-slate-400 leading-snug">{tip.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-brand/5 border border-brand/20 rounded-2xl px-5 py-4">
                <p className="text-sm font-bold text-brand">
                  Je bespaart vanaf nu €20–30 per boeking! 💰
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Geen commissies meer. Al je inkomsten komen direct op jouw rekening.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation buttons (steps 2–6) ── */}
          {state.step >= 2 && state.step <= 6 && (
            <div className="flex gap-3">
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Vorige
              </button>
              <button
                onClick={handleNext}
                disabled={isPending}
                className="flex-1 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
              >
                {isPending ? 'Bezig...' : 'Volgende stap'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
