'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HtmlEditor } from '@/components/admin/html-editor';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subjectNl: string;
  subjectEn: string;
  htmlNl: string;
  htmlEn: string;
  updatedAt: string;
}

type ActiveLang = 'nl' | 'en';

export default function EmailTemplateEditorPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subjectNl, setSubjectNl] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [htmlNl, setHtmlNl] = useState('');
  const [htmlEn, setHtmlEn] = useState('');
  const [lang, setLang] = useState<ActiveLang>('nl');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef({ subjectNl: '', subjectEn: '', htmlNl: '', htmlEn: '' });

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    api
      .get(`/email-templates/${id}`)
      .then(({ data }) => {
        const tpl = data?.data ?? data;
        setTemplate(tpl);
        setSubjectNl(tpl.subjectNl);
        setSubjectEn(tpl.subjectEn);
        setHtmlNl(tpl.htmlNl);
        setHtmlEn(tpl.htmlEn);
        latestDataRef.current = {
          subjectNl: tpl.subjectNl, subjectEn: tpl.subjectEn,
          htmlNl: tpl.htmlNl, htmlEn: tpl.htmlEn,
        };
      })
      .catch(() => {
        // Template not found — template state stays null, page shows null guard below
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Keep ref in sync for autosave
  useEffect(() => {
    latestDataRef.current = { subjectNl, subjectEn, htmlNl, htmlEn };
  }, [subjectNl, subjectEn, htmlNl, htmlEn]);

  useEffect(() => {
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, []);

  const markDirty = useCallback((fn: () => void) => {
    fn();
    setDirty(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    setSaving(true);
    setSaveStatus('idle');
    try {
      await api.patch(`/email-templates/${id}`, latestDataRef.current);
      setSaveStatus('success');
      setDirty(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [id]);

  // Stable onChange handlers for HtmlEditor
  const handleHtmlNlChange = useCallback(
    (val: string) => markDirty(() => setHtmlNl(val)),
    [markDirty],
  );
  const handleHtmlEnChange = useCallback(
    (val: string) => markDirty(() => setHtmlEn(val)),
    [markDirty],
  );

  const handleSendTest = async () => {
    if (!testEmail) return;
    setTestSending(true);
    setTestStatus('idle');
    try {
      await api.post(`/email-templates/${id}/test`, { to: testEmail, language: lang });
      setTestStatus('success');
      setTimeout(() => { setTestStatus('idle'); setShowTestModal(false); }, 2500);
    } catch {
      setTestStatus('error');
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/admin/email-templates`)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
            <p className="text-sm text-slate-400 font-mono">{template.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {/* Test email button */}
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

      {/* Language selector */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {(['nl', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              lang === l
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {l === 'nl' ? '🇳🇱 Nederlands' : '🇬🇧 English'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Subject field */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Onderwerp ({lang === 'nl' ? 'Nederlands' : 'Engels'})
          </label>
          <input
            type="text"
            value={lang === 'nl' ? subjectNl : subjectEn}
            onChange={(e) =>
              markDirty(() =>
                lang === 'nl' ? setSubjectNl(e.target.value) : setSubjectEn(e.target.value),
              )
            }
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            placeholder={`E-mail onderwerp in het ${lang === 'nl' ? 'Nederlands' : 'Engels'}`}
          />
          <p className="mt-2 text-xs text-slate-400">
            Gebruik{' '}
            <code className="font-mono bg-slate-100 px-1 rounded">{'{{naam}}'}</code> voor variabelen.
          </p>
        </div>

        {/* HTML body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <HtmlEditor
            label={`HTML inhoud (${lang === 'nl' ? 'Nederlands' : 'Engels'})`}
            value={lang === 'nl' ? htmlNl : htmlEn}
            onChange={lang === 'nl' ? handleHtmlNlChange : handleHtmlEnChange}
            height={500}
          />
        </div>

        {/* Last updated */}
        <p className="text-xs text-slate-400 text-right">
          Laatst bijgewerkt:{' '}
          {new Date(template.updatedAt).toLocaleString('nl-NL', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </div>

      {/* Test email modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Test e-mail versturen</h2>
            <p className="text-sm text-slate-500 mb-5">
              Stuur een voorbeeld van deze template naar een e-mailadres om te controleren hoe het eruitziet.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="jij@example.com"
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
                        lang === l
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {l === 'nl' ? '🇳🇱 Nederlands' : '🇬🇧 English'}
                    </button>
                  ))}
                </div>
              </div>

              {testStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Test e-mail verstuurd!
                </div>
              )}
              {testStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Versturen mislukt. Controleer of RESEND_API_KEY is ingesteld.
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
