'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

const schema = z.object({ email: z.string().email() });
type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const { locale } = useParams();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordForm> = async (data) => {
    await api.post('/auth/forgot-password', data).catch(() => {});
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('resetEmailSentTitle')}</h2>
          <p className="text-slate-500 text-sm">{t('resetEmailSentBody')}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-block mt-6 text-brand text-sm font-medium"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('forgotPasswordTitle')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('forgotPasswordSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
            <input
              {...register('email')}
              type="email"
              placeholder="jan@example.nl"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {t('sendResetLink')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href={`/${locale}/login`} className="text-sm text-brand hover:text-brand-600">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
