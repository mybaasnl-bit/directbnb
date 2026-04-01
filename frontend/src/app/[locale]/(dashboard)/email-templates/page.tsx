'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, BookOpen, CheckCircle, XCircle, ChevronRight, RotateCcw, Pencil } from 'lucide-react';

interface HostTemplate {
  templateName: string;
}

const TEMPLATE_TYPES = [
  {
    name: 'booking_request_guest',
    label: 'Boekingsaanvraag ontvangen',
    description: 'Gestuurd aan de gast nadat ze een boekingsaanvraag hebben ingediend.',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    name: 'booking_confirmed',
    label: 'Boeking bevestigd',
    description: 'Gestuurd aan de gast wanneer u hun boeking bevestigt.',
    icon: CheckCircle,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    name: 'booking_cancelled_guest',
    label: 'Boeking geannuleerd',
    description: 'Gestuurd aan de gast wanneer de boeking wordt geannuleerd.',
    icon: XCircle,
    color: 'bg-red-50 text-red-600',
  },
];

export default function EmailTemplatesPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [customized, setCustomized] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    api.get('/email-templates/host/mine').then(({ data }) => {
      const list: HostTemplate[] = data?.data ?? data ?? [];
      setCustomized(new Set(list.map((t) => t.templateName)));
      setLoading(false);
    });
  }, []);

  const handleReset = async (templateName: string) => {
    if (!confirm('Weet u zeker dat u deze template wilt resetten naar de standaard? Uw aanpassingen gaan verloren.')) return;
    setResetting(templateName);
    try {
      await api.delete(`/email-templates/host/mine/${templateName}`);
      setCustomized((prev) => {
        const next = new Set(prev);
        next.delete(templateName);
        return next;
      });
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-mail Templates</h1>
          <p className="text-slate-400 text-sm">Personaliseer de automatische e-mails naar uw gasten</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-brand-light rounded-2xl p-5 flex gap-4">
        <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-1">Variabelen gebruiken</p>
          <p className="text-sm text-slate-500">
            Gebruik{' '}
            <code className="font-mono bg-white px-1.5 py-0.5 rounded-lg text-xs text-brand font-bold">{'{{guest_name}}'}</code>{' '}
            <code className="font-mono bg-white px-1.5 py-0.5 rounded-lg text-xs text-brand font-bold">{'{{property_name}}'}</code>{' '}
            <code className="font-mono bg-white px-1.5 py-0.5 rounded-lg text-xs text-brand font-bold">{'{{check_in}}'}</code>{' '}
            om automatisch de juiste gegevens in te vullen.
          </p>
        </div>
      </div>

      {/* Template cards */}
      <div className="space-y-3">
        {TEMPLATE_TYPES.map(({ name, label, description, icon: Icon, color }) => {
          const isCustomized = customized.has(name);
          return (
            <div
              key={name}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-slate-900 text-sm">{label}</p>
                  {isCustomized ? (
                    <span className="text-xs bg-brand-light text-brand font-bold px-2.5 py-0.5 rounded-xl">
                      Aangepast
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-100 text-slate-400 font-bold px-2.5 py-0.5 rounded-xl">
                      Standaard
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isCustomized && (
                  <button
                    onClick={() => handleReset(name)}
                    disabled={resetting === name}
                    title="Reset naar standaard"
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                {loading ? (
                  <div className="w-24 h-9 bg-brand-light rounded-xl animate-pulse" />
                ) : (
                  <button
                    onClick={() => router.push(`/${locale}/email-templates/${name}`)}
                    className="flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Bewerken
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Niet-aangepaste templates gebruiken de DirectBnB standaard e-mails. U kunt altijd resetten naar de standaard.
      </p>
    </div>
  );
}
