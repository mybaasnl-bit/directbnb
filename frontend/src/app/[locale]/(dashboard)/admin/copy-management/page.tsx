'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DEFAULT_COPY } from '@/lib/constants/defaultCopy';
import { cn } from '@/lib/utils';
import {
  DatabaseZap, RefreshCw, CheckCircle2, AlertCircle,
  Save, Search, ChevronDown, ChevronUp, RotateCcw, Plus, X,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CopyEntry {
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTION_CONFIG: Record<string, { label: string; emoji: string }> = {
  dashboard:      { label: 'Dashboard',       emoji: '🏠' },
  bookings:       { label: 'Boekingen',       emoji: '📋' },
  agenda:         { label: 'Agenda',          emoji: '📅' },
  emails:         { label: 'E-mails',         emoji: '✉️' },
  payouts:        { label: 'Uitbetalingen',   emoji: '💰' },
  settings:       { label: 'Instellingen',    emoji: '⚙️' },
  rooms:          { label: 'Kamers',          emoji: '🛏' },
  guests:         { label: 'Gasten',          emoji: '👥' },
  'email-editor': { label: 'E-mail Editor',   emoji: '✏️' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Turn a dot-notation suffix into a readable label: "button.google" → "Knop Google" */
function rowLabel(key: string): string {
  const parts = key.split('.').slice(1);
  return parts
    .join(' › ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isJsonKey(key: string) {
  return key.endsWith('.steps');
}

function isLongValue(val: string) {
  return val.length > 80;
}

// ─── CopyRow ──────────────────────────────────────────────────────────────────

function CopyRow({
  defKey,
  defValue,
  description,
  dbValue,
  onSave,
  onReset,
}: {
  defKey: string;
  defValue: string;
  description: string;
  dbValue?: string;
  onSave: (key: string, value: string) => Promise<void>;
  onReset: (key: string) => Promise<void>;
}) {
  const storedValue = dbValue ?? defValue;
  const isOverridden = dbValue !== undefined;
  const isJson = isJsonKey(defKey);
  const isMultiline = isLongValue(defValue) || isJson;

  const [localValue, setLocalValue] = useState(storedValue);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const isDirty = localValue !== storedValue;

  // JSON validation
  let jsonError = '';
  if (isJson && localValue.trim()) {
    try {
      const parsed = JSON.parse(localValue);
      if (!Array.isArray(parsed)) jsonError = 'Moet een JSON-array zijn';
    } catch {
      jsonError = 'Ongeldige JSON syntax';
    }
  }

  const handleSave = async () => {
    if (!isDirty || jsonError) return;
    setStatus('saving');
    try {
      await onSave(defKey, localValue);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleReset = async () => {
    setStatus('saving');
    try {
      await onReset(defKey);
      setLocalValue(defValue);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-0 border-b border-slate-50 last:border-0 transition-colors',
        isDirty ? 'bg-amber-50/40' : 'hover:bg-slate-50/40',
      )}
    >
      {/* Left column — 30% */}
      <div className="w-[30%] shrink-0 px-5 py-4 border-r border-slate-50">
        <p className="text-sm font-semibold text-slate-700 leading-snug">
          {description || rowLabel(defKey)}
        </p>
        <p className="font-mono text-[10px] text-slate-400 mt-1 break-all leading-relaxed">
          {defKey}
        </p>
        {isOverridden && (
          <span className="inline-block mt-1.5 text-[10px] bg-brand/10 text-brand font-bold px-1.5 py-0.5 rounded-md">
            Aangepast
          </span>
        )}
      </div>

      {/* Right column — 70% */}
      <div className="flex-1 min-w-0 px-5 py-4">
        {isMultiline ? (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            rows={isJson ? 5 : 3}
            spellCheck={!isJson}
            className={cn(
              'w-full text-sm px-3 py-2 border rounded-xl resize-y outline-none transition-colors',
              isJson && 'font-mono text-xs',
              isDirty
                ? 'border-amber-300 bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-400'
                : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand',
              jsonError && '!border-red-300 focus:ring-red-200',
            )}
          />
        ) : (
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className={cn(
              'w-full text-sm px-3 py-2.5 border rounded-xl outline-none transition-colors',
              isDirty
                ? 'border-amber-300 bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-400'
                : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand',
            )}
          />
        )}

        {/* JSON error */}
        {jsonError && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {jsonError}
          </p>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3 mt-2 min-h-[24px]">
          {isDirty && (
            <>
              <button
                onClick={handleSave}
                disabled={status === 'saving' || !!jsonError}
                className="flex items-center gap-1.5 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                {status === 'saving' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Opslaan
              </button>
              <button
                onClick={() => setLocalValue(storedValue)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Annuleren
              </button>
            </>
          )}

          {!isDirty && isOverridden && status === 'idle' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
              title={`Reset naar standaard: "${defValue.slice(0, 60)}${defValue.length > 60 ? '…' : ''}"`}
            >
              <RotateCcw className="w-3 h-3" />
              Reset naar standaard
            </button>
          )}

          {status === 'saved' && !isDirty && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Opgeslagen
            </span>
          )}

          {status === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              Opslaan mislukt
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  label,
  emoji,
  rows,
  dbEntries,
  onSave,
  onReset,
  search,
}: {
  sectionKey: string;
  label: string;
  emoji: string;
  rows: typeof DEFAULT_COPY;
  dbEntries: CopyEntry[];
  onSave: (key: string, value: string) => Promise<void>;
  onReset: (key: string) => Promise<void>;
  search: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const overriddenCount = rows.filter((r) =>
    dbEntries.some((e) => e.key === r.key),
  ).length;

  const q = search.toLowerCase();
  const filteredRows = q
    ? rows.filter(
        (r) =>
          r.key.toLowerCase().includes(q) ||
          r.value.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (dbEntries.find((e) => e.key === r.key)?.value ?? '').toLowerCase().includes(q),
      )
    : rows;

  if (filteredRows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">{emoji}</span>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredRows.length} tekst{filteredRows.length !== 1 ? 'en' : ''}
              {overriddenCount > 0 && (
                <span className="ml-1.5 text-brand font-semibold">
                  · {overriddenCount} aangepast
                </span>
              )}
            </p>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Column header */}
      {!collapsed && (
        <>
          <div className="flex border-t border-b border-slate-50 bg-slate-50/60">
            <div className="w-[30%] shrink-0 px-5 py-2 border-r border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Omschrijving / Key
              </p>
            </div>
            <div className="flex-1 px-5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Tekst (bewerkbaar)
              </p>
            </div>
          </div>

          {filteredRows.map((row) => {
            const dbEntry = dbEntries.find((e) => e.key === row.key);
            return (
              <CopyRow
                key={row.key}
                defKey={row.key}
                defValue={row.value}
                description={row.description}
                dbValue={dbEntry?.value}
                onSave={onSave}
                onReset={onReset}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Add Custom Key Modal ─────────────────────────────────────────────────────

function AddKeyModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (key: string, value: string, description: string) => void;
  saving: boolean;
}) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Nieuwe tekst toevoegen</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!key.trim() || !value.trim()) return;
            onSave(key.trim(), value, description);
          }}
          className="p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Key <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="bijv. dashboard.welcome_title"
              className="w-full font-mono text-sm px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
            />
            <p className="mt-1 text-xs text-slate-400">
              Gebruik dot-notatie, bijv.{' '}
              <code className="bg-slate-100 px-1 rounded">dashboard.welcome_title</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Tekst <span className="text-red-400">*</span>
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              placeholder="De tekst die getoond wordt..."
              className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Beschrijving{' '}
              <span className="text-slate-300 normal-case font-normal">(optioneel)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bijv. Hoofdtitel op de dashboardpagina"
              className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
            />
          </div>

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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CopyManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [syncNotice, setSyncNotice] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Queries & mutations ──────────────────────────────────────────────────────

  const { data: dbEntries = [], isLoading } = useQuery<CopyEntry[]>({
    queryKey: ['admin-dynamic-copy'],
    queryFn: () => api.get('/admin/dynamic-copy').then((r) => r.data.data ?? []),
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      api
        .post('/admin/sync-copy', { entries: DEFAULT_COPY })
        .then((r) => r.data.data as { inserted: number; skipped: number; total: number }),
    onSuccess: ({ inserted, skipped }) => {
      qc.invalidateQueries({ queryKey: ['admin-dynamic-copy'] });
      qc.invalidateQueries({ queryKey: ['dynamic-copy'] });
      setSyncNotice(
        inserted > 0
          ? `${inserted} nieuwe teksten gesynchroniseerd, ${skipped} al aanwezig.`
          : `Alles al gesynchroniseerd — ${skipped} teksten ongewijzigd.`,
      );
      setTimeout(() => setSyncNotice(''), 4000);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) =>
      api.post('/admin/dynamic-copy', { key, value, description: description || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dynamic-copy'] });
      qc.invalidateQueries({ queryKey: ['dynamic-copy'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) =>
      api.delete(`/admin/dynamic-copy/${encodeURIComponent(key)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dynamic-copy'] });
      qc.invalidateQueries({ queryKey: ['dynamic-copy'] });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  /** Called by each CopyRow's "Opslaan" button */
  const handleRowSave = async (key: string, value: string) => {
    const def = DEFAULT_COPY.find((d) => d.key === key);
    await upsertMutation.mutateAsync({ key, value, description: def?.description });
  };

  /** Called by each CopyRow's "Reset naar standaard" button */
  const handleRowReset = async (key: string) => {
    await deleteMutation.mutateAsync(key);
  };

  /** Called by the Add Custom Key modal */
  const handleAddKey = (key: string, value: string, description: string) => {
    upsertMutation.mutate(
      { key, value, description },
      { onSuccess: () => setShowAddModal(false) },
    );
  };

  // ── Group DEFAULT_COPY by first key segment ──────────────────────────────────

  const sections = useMemo(() => {
    const map: Record<string, typeof DEFAULT_COPY> = {};
    for (const entry of DEFAULT_COPY) {
      const sk = entry.key.split('.')[0];
      if (!map[sk]) map[sk] = [];
      map[sk].push(entry);
    }
    return Object.entries(map).map(([key, rows]) => ({
      key,
      ...(SECTION_CONFIG[key] ?? { label: key, emoji: '📄' }),
      rows,
    }));
  }, []);

  // DB-only entries — keys in DB but not in DEFAULT_COPY registry
  const extraDbEntries = dbEntries.filter(
    (e) => !DEFAULT_COPY.find((d) => d.key === e.key),
  );

  // Totals
  const overriddenTotal = dbEntries.filter((e) =>
    DEFAULT_COPY.find((d) => d.key === e.key),
  ).length;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tekst beheer</h1>
          <p className="text-slate-400 mt-1">
            Beheer alle dashboard teksten zonder code te deployen
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-brand hover:text-brand text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {syncMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <DatabaseZap className="w-4 h-4" />
            )}
            {syncMutation.isPending ? 'Synchroniseren…' : 'Sync standaard teksten'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-brand/20"
          >
            <Plus className="w-4 h-4" />
            Nieuwe tekst
          </button>
        </div>
      </div>

      {/* ── Sync notice ───────────────────────────────────────────────────────── */}
      {syncNotice && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-800">{syncNotice}</span>
        </div>
      )}

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Geregistreerde teksten', value: DEFAULT_COPY.length },
          { label: 'Aangepast in database', value: overriddenTotal, accent: overriddenTotal > 0 },
          { label: 'Extra (buiten registry)', value: extraDbEntries.length },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
            <p className={cn('text-2xl font-bold', accent ? 'text-brand' : 'text-slate-900')}>
              {value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Info ─────────────────────────────────────────────────────────────── */}
      <div className="bg-brand-light/40 border border-brand/10 rounded-2xl px-5 py-4 flex items-start gap-3">
        <span className="text-lg shrink-0">💡</span>
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="font-bold">Hoe werkt dit?</span> Elk tekstveld is vooraf gevuld met de
          standaard fallback-tekst. Pas een waarde aan en klik <strong>Opslaan</strong> om het
          direct actief te maken.{' '}
          <span className="inline-block bg-brand/10 text-brand text-xs font-bold px-1.5 py-0.5 rounded">
            Aangepast
          </span>{' '}
          geeft aan dat een waarde is overschreven. Gebruik{' '}
          <em>Reset naar standaard</em> om de originele tekst terug te zetten.
          Wijzigingen zijn zichtbaar na de eerstvolgende paginanavigatie (cache: 5 min).
        </p>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op key, tekst of beschrijving…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Loading skeleton ──────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Section cards ────────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="space-y-4">
          {sections.map((s) => (
            <SectionCard
              key={s.key}
              sectionKey={s.key}
              label={s.label}
              emoji={s.emoji}
              rows={s.rows}
              dbEntries={dbEntries}
              onSave={handleRowSave}
              onReset={handleRowReset}
              search={search}
            />
          ))}

          {/* Extra DB-only entries */}
          {extraDbEntries.length > 0 && !search && (
            <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50 bg-amber-50/40">
                <span className="text-xl">🔧</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    Extra (buiten standaard registry)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {extraDbEntries.length} handmatig toegevoegde teksten
                  </p>
                </div>
              </div>
              <div className="flex border-b border-slate-50 bg-slate-50/60">
                <div className="w-[30%] shrink-0 px-5 py-2 border-r border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Omschrijving / Key
                  </p>
                </div>
                <div className="flex-1 px-5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Tekst (bewerkbaar)
                  </p>
                </div>
              </div>
              {extraDbEntries.map((e) => (
                <CopyRow
                  key={e.key}
                  defKey={e.key}
                  defValue={e.value}
                  description={e.description ?? ''}
                  dbValue={e.value}
                  onSave={handleRowSave}
                  onReset={handleRowReset}
                />
              ))}
            </div>
          )}

          {/* Empty search state */}
          {search &&
            sections.every((s) => {
              const q = search.toLowerCase();
              return !s.rows.some(
                (r) =>
                  r.key.toLowerCase().includes(q) ||
                  r.value.toLowerCase().includes(q) ||
                  r.description.toLowerCase().includes(q),
              );
            }) && (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-700">Geen resultaten gevonden</p>
                <p className="text-sm text-slate-400 mt-1">
                  Probeer een andere zoekterm of{' '}
                  <button
                    onClick={() => setSearch('')}
                    className="text-brand hover:underline font-medium"
                  >
                    wis de zoekopdracht
                  </button>
                  .
                </p>
              </div>
            )}
        </div>
      )}

      {/* ── Add custom key modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <AddKeyModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddKey}
          saving={upsertMutation.isPending}
        />
      )}
    </div>
  );
}
