'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { FeedbackButton } from '@/components/feedback/feedback-button';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['nl', 'en']),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user, refetchUser } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      preferredLanguage: (user?.preferredLanguage as 'nl' | 'en') ?? 'nl',
    },
  });

  const update = useMutation({
    mutationFn: (data: FormValues) => api.patch('/users/me', data),
    onSuccess: () => refetchUser?.(),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{t('profile')}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('firstName')}</label>
              <input
                {...register('firstName')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('lastName')}</label>
              <input
                {...register('lastName')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
            <input
              value={user?.email}
              disabled
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">{t('emailNotEditable')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('phone')}</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('language')}</label>
            <select
              {...register('preferredLanguage')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {update.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-green-700 text-sm">{t('savedSuccess')}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isDirty || update.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {update.isPending ? t('saving') : t('save')}
        </button>
      </form>

      {/* Beta feedback */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">{t('betaFeedback')}</h2>
        <p className="text-slate-500 text-sm mb-4">{t('betaFeedbackDescription')}</p>
        <FeedbackButton />
      </div>
    </div>
  );
}
