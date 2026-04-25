'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Search, Plus, Pencil, Trash2, X, Save, AlertCircle, CheckCircle2,
  FileText, RefreshCw, DatabaseZap,
} from 'lucide-react';
import { DEFAULT_COPY } from '@/lib/constants/defaultCopy';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CopyEntry {
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Edit/Create Modal ────────────────────────────────────────────────────────

function CopyModal({
  entry,
  onClose,
  onSave,
  saving,
}: {
  entry: CopyEntry | null;  // null = create new
  onClose: () => void;
  onSave: (key: string, value: string, description: string) => void;
  saving: boolean;
}) {
  const isNew = entry === null;
  const [key, setKey] = useState(entry?.key ?? '');
  const [value, setValue] = useState(entry?.value ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    onSave(key.trim(), value, description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {isNew ? 'Nieuwe tekst toevoegen' : 'Tekst bewerken'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Key */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Key <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!isNew}
              placeholder="bijv. dashboard.title"
              className={cn(
                'w-full font-mono text-sm px-4 py-2.5 border rounded-xl outline-none transition-colors',
                isNew
                  ? 'border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand'
                  : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed',
              )}
            />
            {isNew && (
              <p className="mt-1.5 text-xs text-slate-400">
                Gebruik dot-notatie, bijv. <code className="bg-slate-100 px-1 rounded">dashboard.welcome_title</code>
              </p>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Tekst <span className="text-red-400">*</span>
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder="De tekst die getoond wordt..."
              className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors resize-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Beschrijving <span className="text-slate-300">(optioneel)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bijv. Hoofdtitel op de dashboard pagina"
              className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving || !key.trim() || !value.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({
  entry,
  onClose,
  onConfirm,
  deleting,
}: {
  entry: CopyEntry;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Key verwijderen?</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{entry.key}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Dit kan niet ongedaan worden gemaakt. Componenten die deze key gebruiken vallen terug op de standaard fallback-tekst.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
          >
            {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CopyManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editEntry, setEditEntry] = useState<CopyEntry | null | undefined>(undefined); // undefined=closed, null=new, entry=edit
  const [deleteEntry, setDeleteEntry] = useState<CopyEntry | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery<CopyEntry[]>({
    queryKey: ['admin-dynamic-copy'],
    queryFn: () => api.get('/admin/dynamic-copy').then((r) => r.data.data ?? []),
  });

  const upsertMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description: string }) =>
      api.post('/admin/dynamic-copy', { key, value, description: description || undefined }),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['admin-dynamic-copy'] });
      // Also invalidate the public copy cache so widgets pick up the new value
      qc.invalidateQueries({ queryKey: ['dynamic-copy'] });
      setEditEntry(undefined);
      setSaveNotice(`"${key}" opgeslagen`);
      setTimeout(() => setSaveNotice(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => api.delete(`/admin/dynamic-copy/${encodeURIComponent(key)}`),
    onSuccess: (_, key) => {
      qc.invalidateQueries({ queryKey: ['admin-dynamic-copy'] });
      qc.invalidateQueries({ queryKey: ['dynamic-copy'] });
      setDeleteEntry(null);
      setSaveNotice(`"${key}" verwijderd`);
      setTimeout(() => setSaveNotice(null), 3000);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/sync-copy', { entries: DEFAULT_COPY }).then((r) => r.data.data as { inserted: number; skipped: number; total: number }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin-dynamic-copy'] });
      qc.invalidateQueries({ queryKey: ['dynamic-copy'] });
      setSaveNotice(
        result.inserted > 0
          ? `${result.inserted} tekst${result.inserted !== 1 ? 'en' : ''} toegevoegd, ${result.skipped} al aanwezig.`
          : `Alles al gesynchroniseerd — ${result.skipped} teksten ongewijzigd.`,
      );
      setTimeout(() => setSaveNotice(null), 4000);
    },
  });

  const filtered = entries.filter((e) =>
    !search ||
    e.key.toLowerCase().includes(search.toLowerCase()) ||
    e.value.toLowerCase().includes(search.toLowerCase()) ||
    (e.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tekst beheer</h1>
          <p className="text-slate-400 mt-1">Beheer dashboard teksten zonder code te deployen</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sync default texts */}
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-brand hover:text-brand text-slate-600 text-sm font-semibold px-4 py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {syncMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <DatabaseZap className="w-4 h-4" />
            )}
            {syncMutation.isPending ? 'Synchroniseren…' : 'Synchroniseer Standaard Teksten'}
          </button>

          {/* New entry */}
          <button
            onClick={() => setEditEntry(null)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors shadow-sm shadow-brand/20"
          >
            <Plus className="w-4 h-4" />
            Nieuwe tekst
          </button>
        </div>
      </div>

      {/* Save notice */}
      {saveNotice && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-800">{saveNotice}</span>
        </div>
      )}

      {/* Info card */}
      <div className="bg-brand-light/40 border border-brand/10 rounded-2xl px-5 py-4">
        <p className="text-sm text-slate-700">
          <span className="font-bold">Caching:</span> Wijzigingen zijn direct zichtbaar na de eerstvolgende paginanavigatie.
          De frontend cached teksten <span className="font-bold">5 minuten</span> per sessie voor maximale prestaties.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op key, tekst of beschrijving..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-brand" />
            </div>
            <p className="font-bold text-slate-700">
              {search ? 'Geen resultaten gevonden' : 'Nog geen teksten aangemaakt'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? 'Probeer een andere zoekterm.' : 'Klik op "Nieuwe tekst" om te beginnen.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Key', 'Tekst', 'Beschrijving', 'Bijgewerkt', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((entry) => (
                  <tr key={entry.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-brand font-semibold whitespace-nowrap">
                      {entry.key}
                    </td>
                    <td className="px-5 py-4 text-slate-700 max-w-xs">
                      <p className="truncate">{entry.value}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs max-w-xs">
                      <p className="truncate">{entry.description ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(entry.updatedAt), 'd MMM yyyy', { locale: nl })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditEntry(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-light transition-colors"
                          title="Bewerken"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteEntry(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {filtered.length} van {entries.length} entries
        </p>
      )}

      {/* Edit / Create modal */}
      {editEntry !== undefined && (
        <CopyModal
          entry={editEntry}
          onClose={() => setEditEntry(undefined)}
          onSave={(key, value, description) =>
            upsertMutation.mutate({ key, value, description })
          }
          saving={upsertMutation.isPending}
        />
      )}

      {/* Delete confirm modal */}
      {deleteEntry && (
        <DeleteModal
          entry={deleteEntry}
          onClose={() => setDeleteEntry(null)}
          onConfirm={() => deleteMutation.mutate(deleteEntry.key)}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
