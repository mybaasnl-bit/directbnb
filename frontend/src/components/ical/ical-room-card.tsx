'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Copy, RefreshCw, Plus, Trash2, Check, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IcalRoomCardProps {
  roomId: string;
  roomName: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function IcalRoomCard({ roomId, roomName }: IcalRoomCardProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState('');

  const { data, isLoading } = useQuery<{ importUrls: string[]; exportToken: string | null }>({
    queryKey: ['ical-room', roomId],
    queryFn: () => api.get(`/ical/rooms/${roomId}`).then(r => r.data),
    enabled: open,
  });

  const createToken = useMutation({
    mutationFn: () => api.post(`/ical/rooms/${roomId}/export-token`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ical-room', roomId] }),
  });

  const addUrl = useMutation({
    mutationFn: (url: string) => api.post(`/ical/rooms/${roomId}/import-urls`, { url }),
    onSuccess: () => {
      setNewUrl('');
      setUrlError('');
      qc.invalidateQueries({ queryKey: ['ical-room', roomId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setUrlError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Ongeldige URL'));
    },
  });

  const removeUrl = useMutation({
    mutationFn: (url: string) => api.delete(`/ical/rooms/${roomId}/import-urls`, { data: { url } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ical-room', roomId] }),
  });

  const syncNow = useMutation({
    mutationFn: () => api.post(`/ical/rooms/${roomId}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ical-room', roomId] }),
  });

  const exportUrl = data?.exportToken
    ? `${API_URL.replace('/api/v1', '')}/api/v1/ical/export/${data.exportToken}`
    : null;

  const handleCopy = () => {
    if (!exportUrl) return;
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header — toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-brand" />
          </div>
          <span className="text-sm font-semibold text-slate-800">{roomName}</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Laden…
            </div>
          ) : (
            <>
              {/* ── Export ── */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Export URL (jouw kalender, voor externe platforms)
                </p>
                {exportUrl ? (
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={exportUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-light text-brand hover:bg-brand hover:text-white'
                      )}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Gekopieerd!' : 'Kopieer'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => createToken.mutate()}
                    disabled={createToken.isPending}
                    className="flex items-center gap-2 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
                  >
                    {createToken.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Export URL aanmaken
                  </button>
                )}
                <p className="text-xs text-slate-400">
                  Plak deze URL in Airbnb, Booking.com of Google Calendar om beschikbaarheid te synchroniseren.
                </p>
              </div>

              {/* ── Import ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Import URLs (externe platforms → blokkeer datums)
                  </p>
                  <button
                    onClick={() => syncNow.mutate()}
                    disabled={syncNow.isPending || (data?.importUrls.length ?? 0) === 0}
                    className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    <RefreshCw className={cn('w-3 h-3', syncNow.isPending && 'animate-spin')} />
                    Nu synchroniseren
                  </button>
                </div>

                {(data?.importUrls ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400">Nog geen import URLs. Voeg de iCal URL van Airbnb of Booking.com hieronder toe.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data!.importUrls.map(url => (
                      <li key={url} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                        <span className="flex-1 text-xs text-slate-600 font-mono truncate">{url}</span>
                        <button
                          onClick={() => removeUrl.mutate(url)}
                          disabled={removeUrl.isPending}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-start gap-2 pt-1">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={newUrl}
                      onChange={e => { setNewUrl(e.target.value); setUrlError(''); }}
                      placeholder="https://airbnb.com/calendar/ical/…"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newUrl.trim()) addUrl.mutate(newUrl.trim()); } }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {urlError && <p className="text-red-500 text-xs mt-1">{urlError}</p>}
                  </div>
                  <button
                    onClick={() => { if (newUrl.trim()) addUrl.mutate(newUrl.trim()); }}
                    disabled={!newUrl.trim() || addUrl.isPending}
                    className="px-3 py-2 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
                  >
                    {addUrl.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
