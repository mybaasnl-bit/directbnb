'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MessageSquarePlus, X } from 'lucide-react';

interface FeedbackButtonProps {
  compact?: boolean;
}

export function FeedbackButton({ compact = false }: FeedbackButtonProps) {
  const t = useTranslations('feedback');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<string>('GENERAL');

  const submit = useMutation({
    mutationFn: () => api.post('/feedback', { message, category }),
    onSuccess: () => {
      setMessage('');
      setOpen(false);
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors ${
          compact
            ? 'p-2 hover:bg-slate-100 rounded-lg'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium'
        }`}
      >
        <MessageSquarePlus className="w-4 h-4" />
        {!compact && t('buttonLabel')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="BUG">{t('categories.bug')}</option>
                  <option value="FEATURE">{t('categories.feature')}</option>
                  <option value="UX">{t('categories.ux')}</option>
                  <option value="GENERAL">{t('categories.general')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('message')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder={t('messagePlaceholder')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {submit.isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <p className="text-green-700 text-sm">{t('successMessage')}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => submit.mutate()}
                  disabled={!message.trim() || submit.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  {submit.isPending ? t('sending') : t('send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
