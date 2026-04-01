'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Mail, RefreshCw, CheckCircle, XCircle, Filter } from 'lucide-react';

interface EmailLog {
  id: string;
  recipientEmail: string;
  templateName: string;
  language: string;
  status: 'SENT' | 'FAILED';
  providerMessageId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  beta_signup_confirmation: 'Beta bevestiging',
  booking_request_owner: 'Boekingsaanvraag — eigenaar',
  booking_request_guest: 'Boekingsaanvraag — gast',
  booking_confirmed: 'Boeking bevestigd',
  booking_cancelled: 'Boeking geannuleerd',
};

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/email-logs${params}`);
      setLogs(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setError('Kon e-mail logs niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const sentCount = logs.filter(l => l.status === 'SENT').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">E-mail Logs</h1>
            <p className="text-slate-400 text-sm">Overzicht van alle verstuurde en mislukte e-mails</p>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand rounded-3xl p-5">
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mb-2">Totaal</p>
          <p className="text-3xl font-bold text-white">{loading ? '—' : logs.length}</p>
        </div>
        <div className="bg-brand-light rounded-3xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Succesvol</p>
          <p className="text-3xl font-bold text-emerald-600">{loading ? '—' : sentCount}</p>
        </div>
        <div className="bg-brand-light rounded-3xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Mislukt</p>
          <p className="text-3xl font-bold text-red-500">{loading ? '—' : failedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['ALL', 'SENT', 'FAILED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === f
                ? 'bg-brand text-white'
                : 'bg-white text-slate-500 hover:bg-brand-light hover:text-brand'
            }`}
          >
            {f === 'ALL' ? 'Alles' : f === 'SENT' ? 'Succesvol' : 'Mislukt'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-500 hover:text-red-700 underline">Probeer opnieuw</button>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-brand" />
          </div>
          <p className="font-bold text-slate-700">Geen e-mail logs gevonden</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden">
          {logs.map((log, i) => (
            <div key={log.id}>
              <div
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-brand-light/20 transition-colors ${i < logs.length - 1 ? 'border-b border-slate-50' : ''}`}
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${log.status === 'SENT' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {log.status === 'SENT'
                    ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                    : <XCircle className="w-5 h-5 text-red-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm truncate">{log.recipientEmail}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-bold ${
                      log.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {log.status === 'SENT' ? 'Verstuurd' : 'Mislukt'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {TEMPLATE_LABELS[log.templateName] ?? log.templateName} · {log.language.toUpperCase()}
                  </p>
                </div>

                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {expandedId === log.id && (
                <div className="px-5 py-4 bg-brand-light/30 border-b border-brand/10 text-xs space-y-2">
                  {log.providerMessageId && (
                    <div><span className="font-bold text-slate-600">Resend ID: </span>
                      <code className="text-slate-700 bg-white px-1.5 py-0.5 rounded-lg font-mono">{log.providerMessageId}</code>
                    </div>
                  )}
                  {log.errorMessage && (
                    <div><span className="font-bold text-red-600">Fout: </span><span className="text-red-700">{log.errorMessage}</span></div>
                  )}
                  <div><span className="font-bold text-slate-600">Template: </span>
                    <code className="text-slate-700 bg-white px-1.5 py-0.5 rounded-lg font-mono">{log.templateName}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
