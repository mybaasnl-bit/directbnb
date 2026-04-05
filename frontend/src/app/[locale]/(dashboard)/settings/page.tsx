'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Home, User, Bell, ShieldCheck, CheckCircle2, Coffee, Clock } from 'lucide-react';

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

  const [name, setName]             = useState(property?.name ?? '');
  const [city, setCity]             = useState(property?.addressCity ?? '');
  const [address, setAddress]       = useState(property?.addressLine1 ?? '');
  const [description, setDescription] = useState(property?.descriptionNl ?? '');
  const [checkIn, setCheckIn]       = useState(property?.checkInTime ?? '14:00');
  const [checkOut, setCheckOut]     = useState(property?.checkOutTime ?? '10:00');
  const [saved, setSaved]           = useState(false);

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
      {activeTab === 'meldingen' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Meldingsinstellingen komen binnenkort beschikbaar.</p>
        </div>
      )}
      {activeTab === 'beveiliging' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Beveiliging & betalingsinstellingen komen binnenkort beschikbaar.</p>
        </div>
      )}
    </div>
  );
}
