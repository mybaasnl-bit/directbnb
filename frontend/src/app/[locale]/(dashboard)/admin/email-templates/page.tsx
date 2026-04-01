'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, ChevronRight, RefreshCw } from 'lucide-react';

interface TemplateListItem {
  id: string;
  name: string;
  subjectNl: string;
  subjectEn: string;
  updatedAt: string;
}

const TEMPLATE_LABELS: Record<string, { nl: string; description: string }> = {
  beta_signup_confirmation: {
    nl: 'Beta aanmelding bevestiging',
    description: 'Verstuurd na aanmelding voor de beta',
  },
  booking_request_owner: {
    nl: 'Boekingsaanvraag — eigenaar',
    description: 'Verstuurd naar eigenaar bij nieuwe aanvraag',
  },
  booking_request_guest: {
    nl: 'Boekingsaanvraag — gast',
    description: 'Bevestiging aan gast bij nieuwe aanvraag',
  },
  booking_confirmed: {
    nl: 'Boeking bevestigd',
    description: 'Verstuurd aan gast bij bevestiging',
  },
  booking_cancelled: {
    nl: 'Boeking geannuleerd',
    description: 'Verstuurd aan gast bij annulering',
  },
};

export default function EmailTemplatesPage() {
  const { locale } = useParams();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/email-templates');
      // TransformInterceptor wraps response: { success, data, statusCode }
      setTemplates(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setError('Kon templates niet laden. Controleer of je adminrechten hebt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">E-mail Templates</h1>
            <p className="text-slate-400 text-sm">Beheer de systeemberichten die naar gebruikers worden verstuurd</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand bg-white px-4 py-2.5 rounded-xl hover:bg-brand-light transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Vernieuwen
        </button>
      </div>

      {/* Info */}
      <div className="bg-brand-light rounded-2xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-sm">💡</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-1">Dynamische variabelen</p>
          <p className="text-sm text-slate-500">
            Gebruik <code className="bg-white px-1.5 py-0.5 rounded-lg font-mono text-xs text-brand font-bold">{'{{naam}}'}</code> notatie.
            Het systeem vervangt deze automatisch met echte gegevens bij het versturen.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-500 hover:text-red-700 underline">Probeer opnieuw</button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const meta = TEMPLATE_LABELS[tpl.name];
            return (
              <Link
                key={tpl.id}
                href={`/${locale}/admin/email-templates/${tpl.id}`}
                className="group flex items-center gap-4 bg-white hover:shadow-sm rounded-2xl p-5 transition-all"
              >
                <div className="w-11 h-11 bg-brand-light group-hover:bg-brand rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Mail className="w-5 h-5 text-brand group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm">{meta?.nl ?? tpl.name}</h3>
                    <code className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded-lg">{tpl.name}</code>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{meta?.description ?? tpl.subjectNl}</p>
                  <p className="text-xs text-slate-400 mt-1">Onderwerp: <span className="text-slate-600 font-medium">{tpl.subjectNl}</span></p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">{new Date(tpl.updatedAt).toLocaleDateString('nl-NL')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
