'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, RefreshCw, Download, MapPin, Globe, Calendar, Send, Check, Loader2 } from 'lucide-react';

interface BetaSignup {
  id: string;
  name: string;
  email: string;
  bnbName: string;
  location: string;
  website?: string;
  language: string;
  createdAt: string;
}

export default function BetaSignupsPage() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState<string | null>(null); // id being invited
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/beta-signups');
      setSignups(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setError('Kon aanmeldingen niet laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (id: string, name: string) => {
    if (!confirm(`Uitnodigingsemail versturen naar ${name}?`)) return;
    setInviting(id);
    try {
      await api.post(`/beta-signups/${id}/invite`);
      setInvited(prev => new Set(Array.from(prev).concat(id)));
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Uitnodiging versturen mislukt';
      alert(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setInviting(null);
    }
  };

  const exportCsv = () => {
    const headers = ['Naam', 'E-mail', 'B&B naam', 'Locatie', 'Website', 'Taal', 'Datum'];
    const rows = signups.map(s => [
      s.name, s.email, s.bnbName, s.location, s.website ?? '',
      s.language.toUpperCase(),
      new Date(s.createdAt).toLocaleDateString('nl-NL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `directbnb-beta-aanmeldingen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beta Aanmeldingen</h1>
          <p className="text-slate-500 mt-1">
            Overzicht van alle aanmeldingen. Stuur een uitnodiging om een account aan te maken.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Vernieuwen
          </button>
          <button
            onClick={exportCsv}
            disabled={signups.length === 0}
            className="flex items-center gap-2 text-sm bg-brand hover:bg-brand-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Totaal aanmeldingen', value: signups.length, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Nederlands', value: signups.filter(s => s.language === 'nl').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Uitgenodigd', value: invited.size, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-slate-100`}>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-500 hover:text-red-700 underline">
            Probeer opnieuw
          </button>
        </div>
      ) : signups.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nog geen aanmeldingen</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Naam / B&B</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">E-mail</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Locatie</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Taal</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Datum</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Actie</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s, i) => {
                const isInviting = inviting === s.id;
                const wasInvited = invited.has(s.id);
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === signups.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.bnbName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`mailto:${s.email}`} className="text-brand hover:text-brand-600 hover:underline">
                        {s.email}
                      </a>
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          {s.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {s.location}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.language === 'nl' ? 'bg-blue-100 text-blue-700' : 'bg-brand-light text-brand'
                      }`}>
                        {s.language.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(s.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleInvite(s.id, s.name)}
                        disabled={isInviting || wasInvited}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          wasInvited
                            ? 'bg-emerald-50 text-emerald-600 cursor-default'
                            : 'bg-brand-light hover:bg-brand-light text-brand disabled:opacity-50'
                        }`}
                      >
                        {isInviting ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />Versturen…</>
                        ) : wasInvited ? (
                          <><Check className="w-3 h-3" />Verstuurd</>
                        ) : (
                          <><Send className="w-3 h-3" />Uitnodigen</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
