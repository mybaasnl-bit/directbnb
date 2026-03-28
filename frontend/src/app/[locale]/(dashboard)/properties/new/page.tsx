'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1).max(200),
  descriptionNl: z.string().optional(),
  descriptionEn: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressZip: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('newTitle')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('newSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{t('basicInfo')}</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('name')} *</label>
            <input
              {...register('name')}
              placeholder="Canal House Amsterdam"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('descriptionNl')} <span className="text-slate-400">(NL)</span>
            </label>
            <textarea
              {...register('descriptionNl')}
              rows={4}
              placeholder="Een prachtig pand aan de gracht..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('descriptionEn')} <span className="text-slate-400">(EN)</span>
            </label>
            <textarea
              {...register('descriptionEn')}
              rows={4}
              placeholder="A beautiful property on the canal..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{t('address')}</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('street')}</label>
            <input
              {...register('addressStreet')}
              placeholder="Prinsengracht 123"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('city')}</label>
              <input
                {...register('addressCity')}
                placeholder="Amsterdam"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('zip')}</label>
              <input
                {...register('addressZip')}
                placeholder="1015 DX"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {create.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">{t('createError')}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || create.isPending}
            className="flex-1 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {create.isPending ? t('creating') : t('createProperty')}
          </button>
        </div>
      </form>
    </div>
  );
}
