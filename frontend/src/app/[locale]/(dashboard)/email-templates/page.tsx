'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, BookOpen, CheckCircle, XCircle, Send, FileText, Clock, TrendingUp, Pencil, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface HostTemplate {
  templateName: string;
}

const TEMPLATE_TYPES = [
  {
    name: 'booking_request_guest',
    label: 'Welkomstmail',
    description: 'Automatische welkomstmail voor nieuwe gasten',
    icon: Mail,
  },
  {
    name: 'booking_confirmed',
    label: 'Bevestigingsmail',
    description: 'Bevestig boekingen met alle details',
    icon: CheckCircle,
  },
  {
    name: 'booking_cancelled_guest',
    label: 'Check-in Info',
    description: 'Stuur check-in instructies en details',
    icon: BookOpen,
  },
];

function StatCard({ label, value, sublabel, icon: Icon }: {
  label: string; value: string | number; sublabel?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function EmailTemplatesPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [customized, setCustomized] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get('/email-templates/host/mine').then(({ data }) => {
      const list: HostTemplate[] = data?.data ?? data ?? [];
      setCustomized(new Set(list.map((t) => t.templateName)));
      setLoading(false);
    });

    // Load recent email logs
    api.get('/email-logs', { params: { limit: 5 } })
      .then(({ data }) => setEmailLogs(data?.data ?? []))
      .catch(() => {});
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
    <div className="space-y-6 max-w-5xl">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Emails</h1>
        <p className="text-slate-400 mt-1">Beheer je email communicatie</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Verzonden" value="248" sublabel="Deze maand" icon={Send} />
        <StatCard label="Concepten" value="5" icon={FileText} />
        <StatCard label="Gepland" value="12" icon={Clock} />
        <StatCard label="Open Rate" value="78%" icon={TrendingUp} />
      </div>

      {/* Filter + search bar */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <select className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-brand/30">
            <option>Alle statussen</option>
            <option>Verzonden</option>
            <option>Gepland</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
        </div>
        <input placeholder="Zoek emails..." className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30" />
        <button className="ml-auto bg-brand hover:bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0">
          + Nieuwe Email
        </button>
      </div>

      {/* Email template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEMPLATE_TYPES.map(({ name, label, description, icon: Icon }) => {
          const isCustomized = customized.has(name);
          return (
            <div key={name} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
              <p className="text-sm text-slate-400 mb-4">{description}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push(`/${locale}/email-templates/${name}`)}
                  className="text-sm font-bold text-brand hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Sjabloon bewerken →
                </button>
                {isCustomized && (
                  <button
                    onClick={() => handleReset(name)}
                    disabled={resetting === name}
                    className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                    title="Reset naar standaard"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent emails */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900">Recente Emails</h3>
        </div>

        {emailLogs.length === 0 ? (
          <div className="px-6 py-10 space-y-4">
            {/* Static examples matching Figma when no real data */}
            {[
              { subject: 'Welkomstmail', recipient: 'Gast', status: 'Verzonden', statusColor: 'bg-emerald-100 text-emerald-700', date: 'Geen logs beschikbaar' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 text-sm">{item.subject}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.statusColor}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {emailLogs.map((log: any, i: number) => (
              <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {log.templateName ?? log.subject ?? 'Email'}
                      {log.recipientName ? ` - ${log.recipientName}` : ''}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      log.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                      log.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {log.status === 'SENT' ? 'Verzonden' : log.status === 'SCHEDULED' ? 'Gepland' : log.status}
                    </span>
                  </div>
                  {log.recipientEmail && (
                    <p className="text-xs text-slate-500">{log.recipientEmail}</p>
                  )}
                  {log.previewText && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{log.previewText}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">
                    {log.sentAt ? format(new Date(log.sentAt), 'd MMM yyyy, HH:mm', { locale: nl }) : '—'}
                  </p>
                  <button className="mt-1 text-xs font-bold text-brand hover:underline">Bekijken</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Niet-aangepaste templates gebruiken de DirectBnB standaard e-mails. U kunt altijd resetten naar de standaard.
      </p>
    </div>
  );
}
