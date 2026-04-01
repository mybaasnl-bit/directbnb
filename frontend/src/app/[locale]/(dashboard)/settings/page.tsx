'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Settings, CheckCircle2, User } from 'lucide-react';

const schema = z.object({
  firstName:         z.string().min(1),
  lastName:          z.string().min(1),
  phone:             z.string().optional(),
  preferredLanguage: z.enum(['nl', 'en']),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user, refetchUser } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName:         user?.firstName ?? '',
      lastName:          user?.lastName ?? '',
      phone:             user?.phone ?? '',
      preferredLanguage: (user?.preferredLanguage as 'nl' | 'en') ?? 'nl',
    },
  });

  const update = useMutation({
    mutationFn: (data: FormValues) => api.patch('/users/me', data),
    onSuccess: () => refetchUser?.(),
  });

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-400 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Profiel kaart */}
      <form onSubmit={handleSubmit((d) => update.mutate(d))}>
        <div className="bg-white rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
            <div className="w-9 h-9 bg-brand-light rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-brand" />
            </div>
            <h2 className="font-bold text-slate-900">{t('profile')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t('firstName')}</label>
              <input
                {...register('firstName')}
                className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t('lastName')}</label>
              <input
                {...register('lastName')}
                className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t('email')}</label>
            <input
              value={user?.email}
              disabled
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1.5">{t('emailNotEditable')}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t('phone')}</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t('language')}</label>
            <select
              {...register('preferredLanguage')}
              className="w-full appearance-none px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer"
            >
              <option value="nl">🇳🇱 Nederlands</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          {update.isSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-emerald-700 text-sm font-semibold">{t('savedSuccess')}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty || update.isPending}
              className="bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors"
            >
              {update.isPending ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </form>

      {/* Beta feedback */}
      <div className="bg-brand-light rounded-3xl p-6">
        <h2 className="font-bold text-slate-900 mb-1">{t('betaFeedback')}</h2>
        <p className="text-slate-500 text-sm mb-4">{t('betaFeedbackDescription')}</p>
        <FeedbackButton />
      </div>
    </div>
  );
}
