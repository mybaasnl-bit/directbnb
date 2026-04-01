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
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Beta Aanmeldingen</h1>
            <p className="text-slate-400 text-sm">Stuur uitnodigingen om accounts aan te maken</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand bg-white px-4 py-2.5 rounded-xl hover:bg-brand-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Vernieuwen
          </button>
          <button
            onClick={exportCsv}
            disabled={signups.length === 0}
            className="flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand rounded-3xl p-5">
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mb-2">Totaal aanmeldingen</p>
          <p className="text-3xl font-bold text-white">{loading ? '—' : signups.length}</p>
        </div>
        <div className="bg-brand-light rounded-3xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Nederlands</p>
          <p className="text-3xl font-bold text-slate-900">{loading ? '—' : signups.filter(s => s.language === 'nl').length}</p>
        </div>
        <div className="bg-brand-light rounded-3xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Uitgenodigd</p>
          <p className="text-3xl font-bold text-slate-900">{loading ? '—' : invited.size}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-500 hover:text-red-700 underline">
            Probeer opnieuw
          </button>
        </div>
      ) : signups.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-brand" />
          </div>
          <p className="font-bold text-slate-700">Nog geen aanmeldingen</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-brand-light/40 border-b border-brand/10">
            {['Naam / B&B', 'E-mail', 'Locatie', 'Taal', 'Datum', 'Actie'].map(h => (
              <div key={h} className={`${h === 'Naam / B&B' ? 'col-span-3' : h === 'E-mail' ? 'col-span-3' : 'col-span-2'} text-xs font-bold text-slate-500 uppercase tracking-wide`}>{h}</div>
            ))}
          </div>
          <div className="divide-y divide-slate-50">
            {signups.map((s) => {
              const isInviting = inviting === s.id;
              const wasInvited = invited.has(s.id);
              return (
                <div key={s.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-brand-light/20 transition-colors items-center">
                  <div className="col-span-3">
                    <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{s.bnbName}</p>
                  </div>
                  <div className="col-span-3">
                    <a href={`mailto:${s.email}`} className="text-brand hover:text-brand-600 text-sm font-semibold">
                      {s.email}
                    </a>
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-0.5">
                        <Globe className="w-3 h-3" />
                        {s.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      {s.location}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                      s.language === 'nl' ? 'bg-blue-100 text-blue-700' : 'bg-brand-light text-brand'
                    }`}>
                      {s.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => handleInvite(s.id, s.name)}
                      disabled={isInviting || wasInvited}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                        wasInvited
                          ? 'bg-emerald-50 text-emerald-600 cursor-default'
                          : 'bg-brand text-white hover:bg-brand-600 disabled:opacity-50'
                      }`}
                    >
                      {isInviting ? (
                        <><Loader2 className="w-3 h-3 animate-spin" />…</>
                      ) : wasInvited ? (
                        <><Check className="w-3 h-3" />Klaar</>
                      ) : (
                        <><Send className="w-3 h-3" />Stuur</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
