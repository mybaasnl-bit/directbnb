'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  name:          z.string().min(1).max(200),
  descriptionNl: z.string().optional(),
  descriptionEn: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity:   z.string().optional(),
  addressZip:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputCls = 'w-full px-4 py-3 bg-brand-light/40 rounded-xl text-sm text-slate-800 border-0 outline-none focus:ring-2 focus:ring-brand/30 transition-all';
const textareaCls = `${inputCls} resize-none`;

export default function NewPropertyPage() {
  const t = useTranslations('properties');
  const { locale } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: (data: FormValues) => api.post('/properties', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.push(`/${locale}/properties/${res.data.data.id}`);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/properties`} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand-light transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('newTitle')}</h1>
            <p className="text-slate-400 text-sm">{t('newSubtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-5">

        {/* Basisgegevens */}
        <div className="bg-white rounded-3xl p-6 space-y-5">
          <h2 className="font-bold text-slate-900">{t('basicInfo')}</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t('name')} *</label>
            <input {...register('name')} placeholder="Canal House Amsterdam" className={inputCls} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              {t('descriptionNl')} <span className="text-slate-400 font-normal">(NL)</span>
            </label>
            <textarea {...register('descriptionNl')} rows={4} placeholder="Een prachtig pand aan de gracht..." className={textareaCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              {t('descriptionEn')} <span className="text-slate-400 font-normal">(EN)</span>
            </label>
            <textarea {...register('descriptionEn')} rows={4} placeholder="A beautiful property on the canal..." className={textareaCls} />
          </div>
        </div>

        {/* Adres */}
        <div className="bg-white rounded-3xl p-6 space-y-5">
          <h2 className="font-bold text-slate-900">{t('address')}</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t('street')}</label>
            <input {...register('addressStreet')} placeholder="Prinsengracht 123" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t('city')}</label>
              <input {...register('addressCity')} placeholder="Amsterdam" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t('zip')}</label>
              <input {...register('addressZip')} placeholder="1015 DX" className={inputCls} />
            </div>
          </div>
        </div>

        {create.isError && (
          <div className="bg-red-50 rounded-2xl px-5 py-4">
            <p className="text-red-600 text-sm font-semibold">{t('createError')}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 bg-white text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || create.isPending}
            className="flex-1 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
          >
            {create.isPending ? t('creating') : t('createProperty')}
          </button>
        </div>
      </form>
    </div>
  );
}
