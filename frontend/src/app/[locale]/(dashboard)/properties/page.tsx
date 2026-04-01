'use client';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Globe, Edit, ExternalLink, Building2 } from 'lucide-react';

export default function PropertiesPage() {
  const t = useTranslations('properties');
  const { locale } = useParams();
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data.data),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/properties/${id}`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-slate-400 text-sm">{t('subtitle')}</p>
          </div>
        </div>
        <Link
          href={`/${locale}/properties/new`}
          className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-2xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addProperty')}
        </Link>
      </div>

      {/* Inhoud */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-brand" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">{t('emptyTitle')}</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">{t('emptySubtitle')}</p>
          <Link
            href={`/${locale}/properties/new`}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-2xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addFirstProperty')}
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {properties.map((property: any) => (
            <div key={property.id} className="bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Foto */}
              {property.photos?.[0] ? (
                <img
                  src={property.photos[0].url}
                  alt={property.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-brand-light flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-brand/40" />
                </div>
              )}

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{property.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {property.addressCity} · {property._count?.rooms ?? 0} {t('rooms')}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePublish.mutate({ id: property.id, isPublished: !property.isPublished })}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                      property.isPublished
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {property.isPublished ? t('published') : t('draft')}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/properties/${property.id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand bg-slate-100 hover:bg-brand-light px-4 py-2 rounded-xl transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {t('edit')}
                  </Link>
                  {property.isPublished && (
                    <a
                      href={`/${locale}/bnb/${property.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-600 bg-brand-light hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t('viewPage')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
