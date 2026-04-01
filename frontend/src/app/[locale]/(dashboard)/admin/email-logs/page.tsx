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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-mail Logs</h1>
          <p className="text-slate-500 mt-1">
            Overzicht van alle verstuurde en mislukte e-mails.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Vernieuwen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Totaal verzonden', value: logs.length, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Succesvol', value: sentCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Mislukt', value: failedCount, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-slate-100`}>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-500">Filter:</span>
        {(['ALL', 'SENT', 'FAILED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'ALL' ? 'Alles' : f === 'SENT' ? 'Succesvol' : 'Mislukt'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-500 hover:text-red-700 underline">
            Probeer opnieuw
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Geen e-mail logs gevonden</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {logs.map((log, i) => (
            <div key={log.id}>
              <div
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  i < logs.length - 1 ? 'border-b border-slate-100' : ''
                }`}
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                {/* Status icon */}
                {log.status === 'SENT' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 text-sm truncate">
                      {log.recipientEmail}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'SENT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status === 'SENT' ? 'Verstuurd' : 'Mislukt'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {TEMPLATE_LABELS[log.templateName] ?? log.templateName}
                    {' · '}
                    {log.language.toUpperCase()}
                  </p>
                </div>

                {/* Date */}
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString('nl-NL', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Expanded detail */}
              {expandedId === log.id && (
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 text-xs space-y-2">
                  {log.providerMessageId && (
                    <div>
                      <span className="font-semibold text-slate-600">Resend Message ID: </span>
                      <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {log.providerMessageId}
                      </code>
                    </div>
                  )}
                  {log.errorMessage && (
                    <div>
                      <span className="font-semibold text-red-600">Foutmelding: </span>
                      <span className="text-red-700">{log.errorMessage}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-600">Template: </span>
                    <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {log.templateName}
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Log ID: </span>
                    <code className="text-slate-500 font-mono">{log.id}</code>
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
