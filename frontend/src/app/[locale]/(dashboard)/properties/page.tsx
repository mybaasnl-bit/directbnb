'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Globe, Edit, ExternalLink } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
        </div>
        <Link
          href={`/${locale}/properties/new`}
          className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addProperty')}
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <Building2Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">{t('emptyTitle')}</h3>
          <p className="text-slate-400 text-sm mb-6">{t('emptySubtitle')}</p>
          <Link
            href={`/${locale}/properties/new`}
            className="inline-flex items-center gap-2 bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            {t('addFirstProperty')}
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {properties.map((property: any) => (
            <div key={property.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
              {property.photos?.[0] ? (
                <img
                  src={property.photos[0].url}
                  alt={property.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                  <Building2Icon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{property.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {property.addressCity}
                      {' · '}
                      {property._count?.rooms ?? 0} {t('rooms')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePublish.mutate({ id: property.id, isPublished: !property.isPublished })}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        property.isPublished
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      {property.isPublished ? t('published') : t('draft')}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Link
                    href={`/${locale}/properties/${property.id}`}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {t('edit')}
                  </Link>
                  {property.isPublished && (
                    <a
                      href={`/${locale}/bnb/${property.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-600"
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

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
