'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HtmlEditor } from '@/components/admin/html-editor';
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Send, RotateCcw, Sparkles, Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type ActiveLang = 'nl' | 'en';
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
    description: 'Ontvangen door de gast nadat ze een boekingsaanvraag hebben ingediend.',
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

// Autosave after 3s of inactivity
const AUTOSAVE_DELAY = 3000;

export default function HostEmailTemplateEditorPage() {
  const { templateName, locale } = useParams<{ templateName: string; locale: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [subjectNl, setSubjectNl] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [htmlNl, setHtmlNl] = useState('');
  const [htmlEn, setHtmlEn] = useState('');
  const [isCustomized, setIsCustomized] = useState(false);
  const [lang, setLang] = useState<ActiveLang>('nl');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [dirty, setDirty] = useState(false);

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Autosave timer
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef({ subjectNl, subjectEn, htmlNl, htmlEn });

  const meta = TEMPLATE_META[templateName];

  useEffect(() => {
    api
      .get(`/email-templates/host/mine/${templateName}/resolved`)
      .then(({ data }) => {
        const tpl: ResolvedTemplate = data?.data ?? data;
        setSubjectNl(tpl.subjectNl);
        setSubjectEn(tpl.subjectEn);
        setHtmlNl(tpl.htmlNl);
        setHtmlEn(tpl.htmlEn);
        setIsCustomized(tpl.isCustomized);
      })
      .catch(() => {
        // Endpoint not available yet (e.g. backend not deployed) — use empty defaults
        setSubjectNl('');
        setSubjectEn('');
        setHtmlNl('');
        setHtmlEn('');
      })
      .finally(() => setLoading(false));
  }, [templateName]);

  useEffect(() => {
    if (user?.email) setTestEmail(user.email);
  }, [user?.email]);

  // Keep latest data in ref for autosave
  useEffect(() => {
    latestDataRef.current = { subjectNl, subjectEn, htmlNl, htmlEn };
  }, [subjectNl, subjectEn, htmlNl, htmlEn]);

  // Cleanup autosave timer
  useEffect(() => {
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, []);

  const performSave = useCallback(async (data: {
    subjectNl: string; subjectEn: string; htmlNl: string; htmlEn: string;
  }, isAuto = false) => {
    if (isAuto) setSaveStatus('autosaving');
    else { setSaving(true); setSaveStatus('idle'); }
    try {
      await api.put(`/email-templates/host/mine/${templateName}`, data);
      setSaveStatus('success');
      setDirty(false);
      setIsCustomized(true);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      if (!isAuto) setSaving(false);
    }
  }, [templateName]);

  // Schedule autosave whenever dirty state changes
  useEffect(() => {
    if (!dirty) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      performSave(latestDataRef.current, true);
    }, AUTOSAVE_DELAY);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [dirty, subjectNl, subjectEn, htmlNl, htmlEn, performSave]);

  const markDirty = useCallback((fn: () => void) => {
    fn();
    setDirty(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    performSave(latestDataRef.current, false);
  }, [performSave]);

  // Stable onChange handlers — prevent HtmlEditor from re-rendering when parent re-renders
  const handleHtmlNlChange = useCallback(
    (val: string) => markDirty(() => setHtmlNl(val)),
    [markDirty],
  );
  const handleHtmlEnChange = useCallback(
    (val: string) => markDirty(() => setHtmlEn(val)),
    [markDirty],
  );

  const handleReset = useCallback(async () => {
    if (!confirm('Weet u zeker dat u wilt resetten naar de standaard DirectBnB template? Uw aanpassingen gaan verloren.')) return;
    try {
      await api.delete(`/email-templates/host/mine/${templateName}`);
      const { data } = await api.get(`/email-templates/host/mine/${templateName}/resolved`);
      const tpl: ResolvedTemplate = data?.data ?? data;
      setSubjectNl(tpl.subjectNl);
      setSubjectEn(tpl.subjectEn);
      setHtmlNl(tpl.htmlNl);
      setHtmlEn(tpl.htmlEn);
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
      await api.post(`/email-templates/host/mine/${templateName}/test`, { to: testEmail, language: lang });
      setTestStatus('success');
      setTimeout(() => { setTestStatus('idle'); setShowTestModal(false); }, 2500);
    } catch {
      setTestStatus('error');
    } finally {
      setTestSending(false);
    }
  }, [testEmail, lang, templateName]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-slate-500">Template niet gevonden.</p>
        <button onClick={() => router.push(`/${locale}/email-templates`)} className="mt-4 text-indigo-600 hover:underline text-sm">
          Terug naar overzicht
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/email-templates`)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{meta.label}</h1>
              {isCustomized ? (
                <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">Aangepast</span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />Standaard
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'autosaving' && (
            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              Opslaan…
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Opgeslagen
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Fout bij opslaan
            </div>
          )}

          {isCustomized && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}

          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Test versturen
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Available variables */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Beschikbare variabelen</p>
        <div className="flex flex-wrap gap-2">
          {meta.variables.map((v) => (
            <code key={v} className="text-xs font-mono bg-white border border-slate-200 text-indigo-700 px-2 py-1 rounded-lg">
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {(['nl', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {l === 'nl' ? '🇳🇱 Nederlands' : '🇬🇧 English'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Subject */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Onderwerp ({lang === 'nl' ? 'Nederlands' : 'Engels'})
          </label>
          <input
            type="text"
            value={lang === 'nl' ? subjectNl : subjectEn}
            onChange={(e) =>
              markDirty(() => (lang === 'nl' ? setSubjectNl(e.target.value) : setSubjectEn(e.target.value)))
            }
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            placeholder={`E-mail onderwerp in het ${lang === 'nl' ? 'Nederlands' : 'Engels'}`}
          />
        </div>

        {/* HTML body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <HtmlEditor
            label={`E-mail inhoud (${lang === 'nl' ? 'Nederlands' : 'Engels'})`}
            value={lang === 'nl' ? htmlNl : htmlEn}
            onChange={lang === 'nl' ? handleHtmlNlChange : handleHtmlEnChange}
            height={500}
          />
        </div>
      </div>

      {/* Test email modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Test e-mail versturen</h2>
            <p className="text-sm text-slate-500 mb-5">
              Stuur een voorbeeld naar uzelf om te controleren hoe de e-mail eruitziet voor uw gasten.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mailadres</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="uw@emailadres.nl"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Taal</label>
                <div className="flex gap-2">
                  {(['nl', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        lang === l ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {l === 'nl' ? '🇳🇱 Nederlands' : '🇬🇧 English'}
                    </button>
                  ))}
                </div>
              </div>

              {testStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />Test e-mail verstuurd!
                </div>
              )}
              {testStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />Versturen mislukt. Probeer het opnieuw.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowTestModal(false); setTestStatus('idle'); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSendTest}
                disabled={!testEmail || testSending}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
                {testSending ? 'Versturen…' : 'Verstuur test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
