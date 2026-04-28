'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, BookOpen, CheckCircle, XCircle, Send, FileText, Clock, TrendingUp, Pencil, RotateCcw, Eye, X } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { useDynamicCopy } from '@/components/providers/dynamic-copy-provider';
import { OnboardingTrigger } from '@/components/onboarding/onboarding-popup';
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
    label: 'Boeking geannuleerd',
    description: 'Ontvangen door de gast wanneer de boeking wordt geannuleerd',
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailStats, setEmailStats] = useState<{ SENT?: number; FAILED?: number; total?: number } | null>(null);
  const [previewLog, setPreviewLog] = useState<any | null>(null);

  // ── Dynamic copy ──────────────────────────────────────────────────────────────
  const pageTitle         = useDynamicCopy('emails.header.title',          'Emails');
  const pageSubtitle      = useDynamicCopy('emails.header.subtitle',       'Beheer je email communicatie');
  const statSentLabel     = useDynamicCopy('emails.stat.sent',             'Verzonden');
  const statSentSub       = useDynamicCopy('emails.stat.sent_sublabel',    'Totaal verstuurd');
  const statFailedLabel   = useDynamicCopy('emails.stat.failed',           'Mislukt');
  const statFailedSub     = useDynamicCopy('emails.stat.failed_sublabel',  'Leveringsfouten');
  const statTotalLabel    = useDynamicCopy('emails.stat.total',            'Totaal');
  const statTotalSub      = useDynamicCopy('emails.stat.total_sublabel',   'Alle emails');
  const statTplLabel      = useDynamicCopy('emails.stat.templates',        'Templates');
  const statTplSub        = useDynamicCopy('emails.stat.templates_sub',    'Aangepast');
  const filterAllLabel    = useDynamicCopy('emails.filter.all_statuses',   'Alle statussen');
  const filterSentLabel   = useDynamicCopy('emails.filter.sent',           'Verzonden');
  const filterPlannedLabel= useDynamicCopy('emails.filter.planned',        'Gepland');
  const recentTitle       = useDynamicCopy('emails.recent.title',          'Recente Emails');
  const editTemplateBtn   = useDynamicCopy('emails.button.edit_template',  'Sjabloon bewerken →');
  const footerNote        = useDynamicCopy('emails.footer.note',           'Niet-aangepaste templates gebruiken de DirectBnB standaard e-mails. U kunt altijd resetten naar de standaard.');

  useEffect(() => {
    api.get('/email-templates/host/mine').then(({ data }) => {
      const list: HostTemplate[] = data?.data ?? data ?? [];
      setCustomized(new Set(list.map((t) => t.templateName)));
    }).catch(() => {
      // API unavailable — show templates with default (non-customized) state
    }).finally(() => {
      setLoading(false);
    });

    // Load host-scoped email stats
    api.get('/email-logs/my/stats')
      .then(({ data }) => setEmailStats(data?.data ?? data ?? null))
      .catch(() => {});

    // Load recent host email logs
    api.get('/email-logs/my')
      .then(({ data }) => setEmailLogs(data?.data ?? data ?? []))
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

  const filteredLogs = emailLogs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const haystack = `${log.templateName ?? ''} ${log.subject ?? ''} ${log.recipientEmail ?? ''} ${log.recipientName ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Email preview modal */}
      {previewLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewLog(null); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {previewLog.templateName ?? previewLog.subject ?? 'Email'}
                </h2>
                {previewLog.recipientEmail && (
                  <p className="text-sm text-slate-400 mt-0.5">Aan: {previewLog.recipientEmail}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewLog(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Status</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    previewLog.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                    previewLog.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {previewLog.status === 'SENT' ? 'Verzonden' : previewLog.status === 'SCHEDULED' ? 'Gepland' : previewLog.status}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Verstuurd op</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {previewLog.sentAt ? format(new Date(previewLog.sentAt), 'd MMM yyyy, HH:mm', { locale: nl }) : '—'}
                  </p>
                </div>
              </div>
              {previewLog.subject && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Onderwerp</p>
                  <p className="text-sm font-semibold text-slate-800">{previewLog.subject}</p>
                </div>
              )}
              {previewLog.previewText && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Voorvertoning</p>
                  <p className="text-sm text-slate-600">{previewLog.previewText}</p>
                </div>
              )}
              {previewLog.htmlContent ? (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Inhoud</p>
                  <div
                    className="border border-slate-100 rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: previewLog.htmlContent }}
                  />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-400">
                  Geen HTML-inhoud beschikbaar voor deze log.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <OnboardingTrigger pageKey="emails" />

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="text-slate-400 mt-1">{pageSubtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={statSentLabel}
          value={emailStats ? (emailStats.SENT ?? 0) : '—'}
          sublabel={statSentSub}
          icon={Send}
        />
        <StatCard
          label={statFailedLabel}
          value={emailStats ? (emailStats.FAILED ?? 0) : '—'}
          sublabel={statFailedSub}
          icon={FileText}
        />
        <StatCard
          label={statTotalLabel}
          value={emailStats ? (emailStats.total ?? 0) : '—'}
          sublabel={statTotalSub}
          icon={Clock}
        />
        <StatCard
          label={statTplLabel}
          value={customized.size}
          sublabel={statTplSub}
          icon={TrendingUp}
        />
      </div>

      {/* Filter + search bar */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">{filterAllLabel}</option>
            <option value="SENT">{filterSentLabel}</option>
            <option value="SCHEDULED">{filterPlannedLabel}</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
        </div>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Zoek emails..."
          className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30"
        />
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
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => router.push(`/${locale}/email-templates/${name}`)}
                  className="text-sm font-bold text-brand hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {editTemplateBtn}
                </button>
                {isCustomized && (
                  <Tooltip content="Reset naar standaard" position="top">
                    <button
                      onClick={() => handleReset(name)}
                      disabled={resetting === name}
                      className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent emails */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900">{recentTitle}</h3>
        </div>

        {filteredLogs.length === 0 && emailLogs.length > 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">Geen emails gevonden voor dit filter.</div>
        ) : emailLogs.length === 0 ? (
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
            {filteredLogs.map((log: any, i: number) => (
              /* px-4 on mobile, px-6 on sm+; gap-3 on mobile, gap-4 on sm+ */
              <div key={i} className="px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
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
                    <p className="text-xs text-slate-500 truncate">{log.recipientEmail}</p>
                  )}
                  {log.previewText && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{log.previewText}</p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {/* whitespace-nowrap prevents the date from wrapping on narrow screens */}
                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    {log.sentAt ? format(new Date(log.sentAt), 'd MMM yyyy, HH:mm', { locale: nl }) : '—'}
                  </p>
                  <button
                    onClick={() => setPreviewLog(log)}
                    className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                    title="E-mail bekijken"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {/* Label hidden on very narrow screens to save horizontal space */}
                    <span className="hidden sm:inline">Bekijken</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        {footerNote}
      </p>
    </div>
  );
}
