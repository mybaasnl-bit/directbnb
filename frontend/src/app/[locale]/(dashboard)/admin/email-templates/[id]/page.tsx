'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EmailBuilder } from '@/components/email-builder';
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

type Lang = 'nl' | 'en';

export default function EmailTemplateEditorPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subjectNl, setSubjectNl] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [htmlNl, setHtmlNl] = useState('');
  const [htmlEn, setHtmlEn] = useState('');
  const [lang, setLang] = useState<Lang>('nl');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Always-current ref — avoids stale closure in callbacks
  const latestRef = useRef({ subjectNl: '', subjectEn: '', htmlNl: '', htmlEn: '' });

  useEffect(() => {
    api
      .get(`/email-templates/${id}`)
      .then(({ data }) => {
        const tpl: EmailTemplate = data?.data ?? data;
        setTemplate(tpl);
        setSubjectNl(tpl.subjectNl ?? '');
        setSubjectEn(tpl.subjectEn ?? '');
        setHtmlNl(tpl.htmlNl ?? '');
        setHtmlEn(tpl.htmlEn ?? '');
        latestRef.current = {
          subjectNl: tpl.subjectNl ?? '',
          subjectEn: tpl.subjectEn ?? '',
          htmlNl: tpl.htmlNl ?? '',
          htmlEn: tpl.htmlEn ?? '',
        };
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Keep ref in sync
  useEffect(() => {
    latestRef.current = { subjectNl, subjectEn, htmlNl, htmlEn };
  }, [subjectNl, subjectEn, htmlNl, htmlEn]);

  const markDirty = useCallback((fn: () => void) => {
    fn();
    setDirty(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const data = latestRef.current;
      await api.patch(`/email-templates/${id}`, {
        subjectNl: data.subjectNl || undefined,  // send undefined if empty → skips MinLength(1)
        subjectEn: data.subjectEn || undefined,
        htmlNl: data.htmlNl || undefined,
        htmlEn: data.htmlEn || undefined,
      });
      setSaveStatus('success');
      setDirty(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      setSaveStatus('error');
      console.error('Admin template save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [id]);

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
      <div className="space-y-4 h-[calc(100vh-120px)]">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="flex-1 h-full bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!template) return null;

  const currentSubject = lang === 'nl' ? subjectNl : subjectEn;
  const currentHtml    = lang === 'nl' ? htmlNl    : htmlEn;

  const handleSubjectChange = (s: string) =>
    markDirty(() => (lang === 'nl' ? setSubjectNl(s) : setSubjectEn(s)));

  const handleHtmlChange = (html: string) =>
    markDirty(() => (lang === 'nl' ? setHtmlNl(html) : setHtmlEn(html)));

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/${locale}/admin/email-templates`)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{template.name}</h1>
            <p className="text-xs text-slate-400 font-mono">{template.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['nl', 'en'] as Lang[]).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {l === 'nl' ? '🇳🇱 NL' : '🇬🇧 EN'}
              </button>
            ))}
          </div>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Opgeslagen</div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium"><AlertCircle className="w-4 h-4" /> Fout bij opslaan</div>
          )}

          <button onClick={() => setShowTestModal(true)} className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
            <Send className="w-4 h-4" /> Test
          </button>

          <button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" /> {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Builder — key=lang forces fresh parse when language switches */}
      <div className="flex-1 overflow-hidden">
        <EmailBuilder
          key={lang}
          value={currentHtml}
          onChange={handleHtmlChange}
          subject={currentSubject}
          onSubjectChange={handleSubjectChange}
          variables={['guest_name', 'owner_name', 'property_name', 'room_name', 'check_in', 'check_out', 'num_guests', 'total_price', 'owner_email']}
        />
      </div>

      {/* Test modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Test e-mail versturen</h2>
            <p className="text-sm text-slate-500 mb-5">Stuur een voorbeeld naar een e-mailadres om te controleren hoe het eruitziet.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mailadres</label>
                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="jij@example.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              {testStatus === 'success' && <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Test verstuurd!</div>}
              {testStatus === 'error' && <div className="flex items-center gap-2 text-red-500 text-sm"><AlertCircle className="w-4 h-4" /> Versturen mislukt.</div>}
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
