'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Bug, Sparkles, Palette, MessageSquare, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type FeedbackStatus = 'NEW' | 'REVIEWED' | 'RESOLVED';
type FeedbackCategory = 'BUG' | 'FEATURE' | 'UX' | 'GENERAL';

interface FeedbackItem {
  id: string;
  message: string;
  category: FeedbackCategory | null;
  status: FeedbackStatus;
  createdAt: string;
  screenshotUrl?: string;
  owner: { firstName: string; lastName: string; email: string };
}

// ─── Kanban config ────────────────────────────────────────────────────────────

const COLUMNS: { key: FeedbackStatus; label: string; color: string; dot: string }[] = [
  { key: 'NEW',      label: 'Te doen',        color: 'bg-slate-50 border-slate-200',    dot: 'bg-slate-400' },
  { key: 'REVIEWED', label: 'In behandeling', color: 'bg-amber-50 border-amber-200',    dot: 'bg-amber-400' },
  { key: 'RESOLVED', label: 'Opgelost',       color: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-400' },
];

const CATEGORY_META: Record<FeedbackCategory, { label: string; icon: React.ElementType; cls: string }> = {
  BUG:     { label: 'Bug',       icon: Bug,          cls: 'bg-red-50 text-red-600' },
  FEATURE: { label: 'Feature',   icon: Sparkles,     cls: 'bg-purple-50 text-purple-600' },
  UX:      { label: 'UX',        icon: Palette,      cls: 'bg-blue-50 text-blue-600' },
  GENERAL: { label: 'Algemeen',  icon: MessageSquare,cls: 'bg-slate-50 text-slate-500' },
};

// ─── Status select ────────────────────────────────────────────────────────────

function StatusSelect({ item }: { item: FeedbackItem }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (status: FeedbackStatus) =>
      api.patch(`/admin/feedback/${item.id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-feedback'] });
      setOpen(false);
    },
  });

  const current = COLUMNS.find(c => c.key === item.status)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        {current.label}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            {COLUMNS.map(col => (
              <button
                key={col.key}
                onClick={() => mutation.mutate(col.key)}
                disabled={mutation.isPending || col.key === item.status}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors text-left',
                  col.key === item.status && 'opacity-40 cursor-default',
                )}
              >
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                {col.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Feedback card ────────────────────────────────────────────────────────────

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const cat = item.category ? CATEGORY_META[item.category] : CATEGORY_META.GENERAL;
  const CatIcon = cat.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg', cat.cls)}>
          <CatIcon className="w-3 h-3" />
          {cat.label}
        </span>
        <StatusSelect item={item} />
      </div>

      {/* Message */}
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{item.message}</p>

      {/* Screenshot */}
      {item.screenshotUrl && (
        <a
          href={item.screenshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-slate-100 hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.screenshotUrl} alt="Screenshot" className="w-full h-24 object-cover" />
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <div>
          <p className="text-xs font-semibold text-slate-700">
            {item.owner.firstName} {item.owner.lastName}
          </p>
          <p className="text-xs text-slate-400">{item.owner.email}</p>
        </div>
        <p className="text-xs text-slate-400">
          {format(new Date(item.createdAt), 'd MMM', { locale: nl })}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const { data: items = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ['admin-feedback'],
    queryFn: () => api.get('/admin/feedback').then((r) => r.data.data),
  });

  const grouped = COLUMNS.reduce(
    (acc, col) => ({ ...acc, [col.key]: items.filter(i => i.status === col.key) }),
    {} as Record<FeedbackStatus, FeedbackItem[]>,
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Feedback board</h1>
          <p className="text-slate-400 mt-1">{items.length} inzendingen totaal</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {COLUMNS.map(col => (
            <div key={col.key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              {col.label}
              <span className="font-bold text-slate-700 ml-0.5">
                {grouped[col.key]?.length ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              {[1,2,3].map(j => <div key={j} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {COLUMNS.map(col => (
            <div key={col.key} className={cn('rounded-2xl border p-4 space-y-3', col.color)}>

              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-bold text-slate-900 text-sm">{col.label}</h3>
                </div>
                <span className="text-xs font-bold bg-white/80 text-slate-500 px-2 py-0.5 rounded-full">
                  {grouped[col.key]?.length ?? 0}
                </span>
              </div>

              {/* Cards */}
              {grouped[col.key]?.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400">Niets hier</p>
                </div>
              ) : (
                grouped[col.key].map(item => (
                  <FeedbackCard key={item.id} item={item} />
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
