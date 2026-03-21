'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface FormData {
  name: string;
  email: string;
  bnbName: string;
  location: string;
  website: string;
}

const initialState: FormData = {
  name: '',
  email: '',
  bnbName: '',
  location: '',
  website: '',
};

export default function SignupForm() {
  const t = useTranslations('form');
  const [data, setData] = useState<FormData>(initialState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setData(initialState);
    } catch {
      setStatus('error');
    }
  };

  const fields = [
    { name: 'name', label: t('nameLabel'), placeholder: t('namePlaceholder'), required: true, type: 'text' },
    { name: 'email', label: t('emailLabel'), placeholder: t('emailPlaceholder'), required: true, type: 'email' },
    { name: 'bnbName', label: t('bnbNameLabel'), placeholder: t('bnbNamePlaceholder'), required: true, type: 'text' },
    { name: 'location', label: t('locationLabel'), placeholder: t('locationPlaceholder'), required: true, type: 'text' },
    { name: 'website', label: t('websiteLabel'), placeholder: t('websitePlaceholder'), required: false, type: 'url' },
  ] as const;

  return (
    <section id="signup" className="bg-slate-50 py-24 lg:py-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="brand" className="mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            {t('headline')}
          </h2>
          <p className="text-slate-500 leading-relaxed">{t('subheadline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/60 p-8 sm:p-10">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('successTitle')}</h3>
              <p className="text-slate-500">{t('successMessage')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    {field.label}
                    {!field.required && (
                      <span className="ml-1.5 text-slate-400 font-normal text-xs">(optioneel)</span>
                    )}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    required={field.required}
                    value={data[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all duration-150"
                  />
                </div>
              ))}

              {status === 'error' && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{t('errorMessage')}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={status === 'loading'}
                className="w-full"
              >
                {status === 'loading' ? t('submitting') : t('submitButton')}
              </Button>

              <p className="text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('privacy')}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
