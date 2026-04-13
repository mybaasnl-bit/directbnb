'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Home, User, Bell, ShieldCheck, CheckCircle2, Coffee, Clock, Banknote, ArrowRight, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { key: 'bnb',      label: 'B&B Instellingen',    icon: Home },
  { key: 'account',  label: 'Account',               icon: User },
  { key: 'meldingen',label: 'Meldingen',             icon: Bell },
  { key: 'beveiliging', label: 'Beveiliging & Betalingen', icon: ShieldCheck },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const profileSchema = z.object({
  firstName:         z.string().min(1),
  lastName:          z.string().min(1),
  phone:             z.string().optional(),
  preferredLanguage: z.enum(['nl', 'en']),
});

type ProfileValues = z.infer<typeof profileSchema>;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm text-slate-500 mb-1.5">{children}</label>;
}

function TextField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        {...props}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── B&B Instellingen tab ─────────────────────────────────────────────────────
function BnbTab() {
  const qc = useQueryClient();
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });
  const property = (properties as any[])[0];

  const [name, setName]             = useState('');
  const [city, setCity]             = useState('');
  const [address, setAddress]       = useState('');
  const [description, setDescription] = useState('');
  const { locale } = useParams<{ locale: string }>();
  const [checkIn, setCheckIn]           = useState('14:00');
  const [checkOut, setCheckOut]         = useState('10:00');
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    if (property) {
      setName(property.name ?? '');
      setCity(property.addressCity ?? '');
      setAddress(property.addressLine1 ?? '');
      setDescription(property.descriptionNl ?? '');
      setCheckIn(property.checkInTime ?? '14:00');
      setCheckOut(property.checkOutTime ?? '10:00');
    }
  }, [property?.id]);

  const { data: paymentAccount } = useQuery<{ status: string; payoutsEnabled: boolean } | null>({
    queryKey: ['payout-account-status'],
    queryFn: () => api.get('/payouts/account-status').then((r) => r.data.data).catch(() => null),
  });

  const update = useMutation({
    mutationFn: (data: any) => api.patch(`/properties/${property?.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!property) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
        <p className="text-slate-500 text-sm">Voeg eerst een accommodatie toe via het Kamers-menu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard icon={Home} title="Algemene Informatie" subtitle="Basisgegevens van je accommodatie">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Naam B&B" value={name} onChange={e => setName(e.target.value)} />
          <TextField label="Stad" value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <TextField label="Adres" value={address} onChange={e => setAddress(e.target.value)} />
        <div>
          <FieldLabel>Korte Beschrijving</FieldLabel>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => update.mutate({ name, addressCity: city, addressLine1: address, descriptionNl: description })}
            disabled={update.isPending}
            className="bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {update.isPending ? 'Opslaan…' : 'Wijzigingen Opslaan'}
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title="Check-in & Check-out Tijden" subtitle="Standaard aankomst en vertrek tijden">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Check-in vanaf', value: checkIn, set: setCheckIn },
            { label: 'Check-in tot',   value: '20:00', set: () => {} },
            { label: 'Check-out tot',  value: checkOut, set: setCheckOut },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <div className="relative">
                <select
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => update.mutate({ checkInTime: checkIn, checkOutTime: checkOut })}
            disabled={update.isPending}
            className="bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Wijzigingen Opslaan
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={Coffee} title="Services & Voorzieningen" subtitle="Wat bied je aan je gasten?">
        <p className="text-sm text-slate-400">Beheer voorzieningen via de Kamers pagina bij het bewerken van een accommodatie.</p>
      </SectionCard>

      {/* Betalingen */}
      <SectionCard icon={Banknote} title="Betalingen" subtitle="Ontvang betalingen direct op je bankrekening">
        {paymentAccount?.payoutsEnabled ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Betalingen actief ✅</p>
                <p className="text-xs text-slate-400 mt-0.5">Je ontvangt betalingen automatisch na check-in</p>
              </div>
            </div>
            <Link
              href={`/${locale}/betalingen`}
              className="text-sm font-bold text-brand hover:underline"
            >
              Beheren →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Koppel je bankrekening om betalingen van gasten te ontvangen — direct na elke check-in.
            </p>
            <Link
              href={`/${locale}/betalingen`}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Koppel mijn bankrekening
            </Link>
          </div>
        )}
      </SectionCard>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-emerald-700 text-sm font-semibold">Wijzigingen opgeslagen!</p>
        </div>
      )}
    </div>
  );
}

// ── Account tab ──────────────────────────────────────────────────────────────
function AccountTab() {
  const t = useTranslations('settings');
  const { user, refetchUser } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName:         user?.firstName ?? '',
      lastName:          user?.lastName ?? '',
      phone:             user?.phone ?? '',
      preferredLanguage: (user?.preferredLanguage as 'nl' | 'en') ?? 'nl',
    },
  });

  const update = useMutation({
    mutationFn: (data: ProfileValues) => api.patch('/users/me', data),
    onSuccess: () => refetchUser?.(),
  });

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit((d) => update.mutate(d))}>
        <SectionCard icon={User} title={t('profile')} subtitle="Persoonlijke accountgegevens">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>{t('firstName')}</FieldLabel>
              <input {...register('firstName')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <FieldLabel>{t('lastName')}</FieldLabel>
              <input {...register('lastName')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
          <div>
            <FieldLabel>{t('email')}</FieldLabel>
            <input value={user?.email} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-400 cursor-not-allowed" />
            <p className="text-xs text-slate-400 mt-1.5">{t('emailNotEditable')}</p>
          </div>
          <div>
            <FieldLabel>{t('phone')}</FieldLabel>
            <input {...register('phone')} type="tel" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div>
            <FieldLabel>{t('language')}</FieldLabel>
            <div className="relative">
              <select {...register('preferredLanguage')} className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer">
                <option value="nl">🇳🇱 Nederlands</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
            </div>
          </div>

          {update.isSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-emerald-700 text-sm font-semibold">{t('savedSuccess')}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty || update.isPending}
              className="bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {update.isPending ? t('saving') : 'Wijzigingen Opslaan'}
            </button>
          </div>
        </SectionCard>
      </form>

      <div className="bg-brand-light rounded-2xl p-6">
        <h2 className="font-bold text-slate-900 mb-1">{t('betaFeedback')}</h2>
        <p className="text-slate-500 text-sm mb-4">{t('betaFeedbackDescription')}</p>
        <FeedbackButton />
      </div>
    </div>
  );
}

// ── Meldingen tab ────────────────────────────────────────────────────────────
function MeldingenTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null);
  const [saved, setSaved] = useState(false);

  useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.get('/users/me/notification-preferences').then(r => {
      setPrefs(r.data.data);
      return r.data.data;
    }),
  });

  const updatePrefs = useMutation({
    mutationFn: (data: Record<string, boolean>) => api.patch('/users/me/notification-preferences', data),
    onSuccess: (res) => {
      setPrefs(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggle = (key: string) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    updatePrefs.mutate(next);
  };

  const ITEMS = [
    { key: 'emailNewBooking',       label: 'Email bij nieuwe boeking',    desc: 'Ontvang een melding wanneer een gast een boeking aanvraagt.' },
    { key: 'emailBookingCancelled', label: 'Email bij annulering',        desc: 'Ontvang een melding wanneer een boeking wordt geannuleerd.' },
    { key: 'emailBookingReminder',  label: 'Email bij check-in herinnering', desc: 'Ontvang 24 uur voor check-in een herinnering.' },
    { key: 'emailPaymentReceived',  label: 'Email bij betaling ontvangen', desc: 'Ontvang een bevestiging wanneer een betaling is verwerkt.' },
  ];

  return (
    <div className="space-y-4">
      <SectionCard icon={Bell} title="E-mailmeldingen" subtitle="Kies welke meldingen je per e-mail ontvangt">
        {prefs === null ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-slate-50">
            {ITEMS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    prefs[key] ? 'bg-brand' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    prefs[key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-emerald-700 text-sm font-semibold">Voorkeuren opgeslagen!</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Beveiliging & Betalingen tab ─────────────────────────────────────────────
function BeveiligingTab() {
  const { locale } = useParams<{ locale: string }>();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const { data: paymentAccount } = useQuery<{ status: string; payoutsEnabled: boolean; chargesEnabled: boolean } | null>({
    queryKey: ['payout-account-status'],
    queryFn: () => api.get('/payouts/account-status').then(r => r.data.data).catch(() => null),
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setPwError(Array.isArray(msg) ? msg[0] : (msg ?? 'Wachtwoord wijzigen mislukt.'));
    },
  });

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) { setPwError('Nieuw wachtwoord moet minimaal 8 tekens bevatten.'); return; }
    if (newPw !== confirmPw) { setPwError('Wachtwoorden komen niet overeen.'); return; }
    changePassword.mutate({ currentPassword: currentPw, newPassword: newPw });
  };

  const statusColors: Record<string, string> = {
    VERIFIED: 'bg-emerald-100 text-emerald-700',
    ONBOARDING: 'bg-amber-100 text-amber-700',
    PENDING: 'bg-slate-100 text-slate-500',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  };
  const statusLabels: Record<string, string> = {
    VERIFIED: 'Geverifieerd', ONBOARDING: 'In behandeling',
    PENDING: 'Nog niet ingesteld', REJECTED: 'Afgewezen', SUSPENDED: 'Opgeschort',
  };

  return (
    <div className="space-y-5">
      {/* Payments status */}
      <SectionCard icon={Banknote} title="Betalingsstatus" subtitle="Stripe Connect account voor uitbetalingen">
        {paymentAccount ? (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[paymentAccount.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {statusLabels[paymentAccount.status] ?? paymentAccount.status}
                </span>
                {paymentAccount.chargesEnabled && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Betalingen actief
                  </span>
                )}
              </div>
              {paymentAccount.payoutsEnabled && (
                <p className="text-xs text-slate-400">Uitbetalingen naar je bankrekening zijn ingeschakeld.</p>
              )}
            </div>
            <Link href={`/${locale}/betalingen`} className="text-sm font-bold text-brand hover:underline">
              Beheren →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Koppel je bankrekening via Stripe Connect om betalingen te ontvangen.</p>
            <Link
              href={`/${locale}/betalingen`}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <ArrowRight className="w-4 h-4" /> Betalingen instellen
            </Link>
          </div>
        )}
      </SectionCard>

      {/* Change password */}
      <form onSubmit={handleChangePw}>
        <SectionCard icon={KeyRound} title="Wachtwoord wijzigen" subtitle="Gebruik een sterk en uniek wachtwoord">
          <div className="space-y-3">
            <div>
              <FieldLabel>Huidig wachtwoord</FieldLabel>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <FieldLabel>Nieuw wachtwoord (min. 8 tekens)</FieldLabel>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <FieldLabel>Bevestig nieuw wachtwoord</FieldLabel>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            {pwError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-700 text-sm">{pwError}</p>
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-emerald-700 text-sm font-semibold">Wachtwoord succesvol gewijzigd!</p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={changePassword.isPending || !currentPw || !newPw || !confirmPw}
              className="bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {changePassword.isPending ? 'Opslaan…' : 'Wachtwoord wijzigen'}
            </button>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('bnb');

  return (
    <div className="max-w-3xl space-y-6">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Instellingen</h1>
        <p className="text-slate-400 mt-1">Beheer je B&B en account voorkeuren</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 px-1 py-1 flex items-center gap-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-brand text-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'bnb'      && <BnbTab />}
      {activeTab === 'account'  && <AccountTab />}
      {activeTab === 'meldingen' && <MeldingenTab />}
      {activeTab === 'beveiliging' && <BeveiligingTab />}
    </div>
  );
}
