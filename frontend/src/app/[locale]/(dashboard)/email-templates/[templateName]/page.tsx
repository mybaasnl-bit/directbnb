'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EmailBuilder } from '@/components/email-builder';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Send, RotateCcw, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type SaveStatus = 'idle' | 'success' | 'error' | 'autosaving';

interface ResolvedTemplate {
  subjectNl: string;
  subjectEn: string;
  htmlNl: string;
  htmlEn: string;
  isCustomized: boolean;
}

const TEMPLATE_META: Record<string, { label: string; description: string; variables: string[] }> = {
  booking_request_guest: {
    label: 'Boekingsaanvraag ontvangen',
    description: 'Ontvangen door de gast nadat ze een aanvraag hebben ingediend.',
    variables: ['guest_name', 'property_name', 'room_name', 'check_in', 'check_out', 'num_guests', 'total_price'],
  },
  booking_confirmed: {
    label: 'Boeking bevestigd',
    description: 'Ontvangen door de gast wanneer u hun boeking bevestigt.',
    variables: ['guest_name', 'property_name', 'room_name', 'check_in', 'check_out', 'total_price', 'owner_email'],
  },
  booking_cancelled_guest: {
    label: 'Boeking geannuleerd',
    description: 'Ontvangen door de gast wanneer de boeking wordt geannuleerd.',
    variables: ['guest_name', 'property_name', 'room_name', 'check_in', 'check_out'],
  },
};

const AUTOSAVE_DELAY = 4000;

export default function HostEmailTemplateEditorPage() {
  const { templateName, locale } = useParams<{ templateName: string; locale: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // All 4 fields stored — NL is edited by builder, EN is kept from API
  const [subjectNl, setSubjectNl] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [htmlNl, setHtmlNl] = useState('');
  const [htmlEn, setHtmlEn] = useState('');
  const [isCustomized, setIsCustomized] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false); // Guard: don't save before load
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [dirty, setDirty] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the very-latest values in a ref so autosave closure never goes stale
  const latestRef = useRef({ subjectNl: '', subjectEn: '', htmlNl: '', htmlEn: '' });

  const meta = TEMPLATE_META[templateName];

  // ── Load template ──────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get(`/email-templates/host/mine/${templateName}/resolved`)
      .then(({ data }) => {
        const tpl: ResolvedTemplate = data?.data ?? data;
        setSubjectNl(tpl.subjectNl ?? '');
        setSubjectEn(tpl.subjectEn ?? '');
        setHtmlNl(tpl.htmlNl ?? '');
        setHtmlEn(tpl.htmlEn ?? '');
        setIsCustomized(tpl.isCustomized ?? false);
        latestRef.current = {
          subjectNl: tpl.subjectNl ?? '',
          subjectEn: tpl.subjectEn ?? '',
          htmlNl: tpl.htmlNl ?? '',
          htmlEn: tpl.htmlEn ?? '',
        };
        setTemplateLoaded(true);
      })
      .catch(() => {
        // Endpoint not yet deployed — allow editing anyway, save will fail gracefully
        setTemplateLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [templateName]);

  useEffect(() => {
    if (user?.email) setTestEmail(user.email);
  }, [user?.email]);

  // Sync latest ref
  useEffect(() => {
    latestRef.current = { subjectNl, subjectEn, htmlNl, htmlEn };
  }, [subjectNl, subjectEn, htmlNl, htmlEn]);

  // Cleanup on unmount
  useEffect(() => () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); }, []);

  // ── Save logic ─────────────────────────────────────────────────────────────
  const performSave = useCallback(async (isAuto = false) => {
    // Never save before the template has loaded — would overwrite with empty data
    if (!templateLoaded) return;

    const data = latestRef.current;
    // Don't save empty subjects — backend rejects them
    if (!data.subjectNl || !data.htmlNl) return;

    if (isAuto) setSaveStatus('autosaving');
    else { setSaving(true); setSaveStatus('idle'); }

    try {
      await api.put(`/email-templates/host/mine/${templateName}`, {
        subjectNl: data.subjectNl,
        subjectEn: data.subjectEn || data.subjectNl, // fallback NL→EN
        htmlNl: data.htmlNl,
        htmlEn: data.htmlEn || data.htmlNl,           // fallback NL→EN
      });
      setSaveStatus('success');
      setDirty(false);
      setIsCustomized(true);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      setSaveStatus('error');
      console.error('Save failed:', err);
    } finally {
      if (!isAuto) setSaving(false);
    }
  }, [templateName, templateLoaded]);

  // Autosave: triggers only after template is loaded AND dirty
  useEffect(() => {
    if (!dirty || !templateLoaded) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => performSave(true), AUTOSAVE_DELAY);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [dirty, subjectNl, htmlNl, performSave, templateLoaded]);

  const markDirty = useCallback((fn: () => void) => {
    fn();
    setDirty(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    performSave(false);
  }, [performSave]);

  const handleReset = useCallback(async () => {
    if (!confirm('Weet u zeker dat u wilt resetten naar de standaard DirectBnB template? Uw aanpassingen gaan verloren.')) return;
    try {
      await api.delete(`/email-templates/host/mine/${templateName}`);
      const { data } = await api.get(`/email-templates/host/mine/${templateName}/resolved`);
      const tpl: ResolvedTemplate = data?.data ?? data;
      setSubjectNl(tpl.subjectNl ?? '');
      setSubjectEn(tpl.subjectEn ?? '');
      setHtmlNl(tpl.htmlNl ?? '');
      setHtmlEn(tpl.htmlEn ?? '');
      latestRef.current = { subjectNl: tpl.subjectNl ?? '', subjectEn: tpl.subjectEn ?? '', htmlNl: tpl.htmlNl ?? '', htmlEn: tpl.htmlEn ?? '' };
      setIsCustomized(false);
      setDirty(false);
    } catch {
      alert('Resetten mislukt. Probeer het opnieuw.');
    }
  }, [templateName]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail) return;
    setTestSending(true);
    setTestStatus('idle');
    try {
      await api.post(`/email-templates/host/mine/${templateName}/test`, { to: testEmail, language: 'nl' });
      setTestStatus('success');
      setTimeout(() => { setTestStatus('idle'); setShowTestModal(false); }, 2500);
    } catch {
      setTestStatus('error');
    } finally {
      setTestSending(false);
    }
  }, [testEmail, templateName]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 h-[calc(100vh-120px)]">
        <div className="h-10 w-64 bg-brand-light rounded-2xl animate-pulse" />
        <div className="flex-1 h-full bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-slate-500">Template niet gevonden.</p>
        <button onClick={() => router.push(`/${locale}/email-templates`)} className="mt-4 text-brand hover:underline text-sm">
          Terug naar overzicht
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/${locale}/email-templates`)} className="p-2 rounded-xl hover:bg-brand-light text-slate-500 hover:text-brand transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{meta.label}</h1>
              {isCustomized ? (
                <span className="text-xs bg-brand-light text-brand-600 font-medium px-2 py-0.5 rounded-full">Aangepast</span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Standaard
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'autosaving' && (
            <div className="flex items-center gap-1.5 text-slate-400 text-sm"><Clock className="w-3.5 h-3.5 animate-spin" /> Opslaan…</div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Opgeslagen</div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium"><AlertCircle className="w-4 h-4" /> Fout bij opslaan</div>
          )}

          {isCustomized && (
            <button onClick={handleReset} className="flex items-center gap-2 border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}

          <button onClick={() => setShowTestModal(true)} className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
            <Send className="w-4 h-4" /> Test
          </button>

          <button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" /> {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <EmailBuilder
          value={htmlNl}
          onChange={(html) => markDirty(() => setHtmlNl(html))}
          subject={subjectNl}
          onSubjectChange={(s) => markDirty(() => setSubjectNl(s))}
          variables={meta.variables}
        />
      </div>

      {/* Test modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Test e-mail versturen</h2>
            <p className="text-sm text-slate-500 mb-5">Stuur een voorbeeld naar uzelf om te controleren hoe de e-mail eruitziet voor uw gasten.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mailadres</label>
                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="uw@emailadres.nl" className="w-full px-4 py-2.5 bg-brand-light/40 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              {testStatus === 'success' && <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Test e-mail verstuurd!</div>}
              {testStatus === 'error' && <div className="flex items-center gap-2 text-red-500 text-sm"><AlertCircle className="w-4 h-4" /> Versturen mislukt. Probeer het opnieuw.</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowTestModal(false); setTestStatus('idle'); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Annuleren</button>
              <button onClick={handleSendTest} disabled={!testEmail || testSending} className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <Send className="w-4 h-4" /> {testSending ? 'Versturen…' : 'Verstuur test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
