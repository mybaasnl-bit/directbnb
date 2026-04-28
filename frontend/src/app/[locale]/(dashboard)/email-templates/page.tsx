'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { EmailBuilder } from '@/components/email-builder';
import {
  Mail, CheckCircle, BookOpen, Save, Send, AlertCircle, CheckCircle2,
  Clock, Sparkles, RotateCcw, Eye, X, Info, FileText, TrendingUp, Pencil, ArrowLeft,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { useDynamicCopy } from '@/components/providers/dynamic-copy-provider';
import { OnboardingTrigger } from '@/components/onboarding/onboarding-popup';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_TYPES = [
  {
    name: 'booking_request_guest',
    label: 'Welkomstmail',
    description: 'Automatische welkomstmail voor nieuwe gasten',
    icon: Mail,
    variables: ['guest_name', 'property_name', 'room_name', 'check_in', 'check_out', 'num_guests', 'total_price'],
  },
  {
    name: 'booking_confirmed',
    label: 'Bevestigingsmail',
    description: 'Bevestig boekingen met alle details',
    icon: CheckCircle,
    variables: ['guest_name', 'property_name', 'room_name', 'check_in', 'check_out', 'total_price', 'owner_email'],
  },
  {
    name: 'booking_cancelled_guest',
    label: 'Boeking geannuleerd',
    description: 'Ontvangen door de gast wanneer de boeking wordt geannuleerd',
    icon: BookOpen,
    variables: ['guest_name', 'property_name', 'room_name', 'check_in', 'check_out'],
  },
] as const;

type TemplateName = (typeof TEMPLATE_TYPES)[number]['name'];

const AUTOSAVE_DELAY = 4000;

interface ResolvedTemplate {
  subjectNl: string;
  subjectEn: string;
  htmlNl: string;
  htmlEn: string;
  isCustomized: boolean;
  previewTextNl?: string;
}

type SaveStatus = 'idle' | 'success' | 'error' | 'autosaving';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sublabel, icon: Icon }: {
  label: string; value: string | number; sublabel?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuth();

  // ── Overview state ──────────────────────────────────────────────────────────
  const [customized, setCustomized] = useState<Set<string>>(new Set());
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailStats, setEmailStats] = useState<{ SENT?: number; FAILED?: number; total?: number } | null>(null);
  const [previewLog, setPreviewLog] = useState<any | null>(null);

  // ── Selected template (editor mode) ─────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName | null>(null);
  const selectedMeta = TEMPLATE_TYPES.find(t => t.name === selectedTemplate) ?? null;

  // ── Editor state ────────────────────────────────────────────────────────────
  const [subjectNl, setSubjectNl] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [previewTextNl, setPreviewTextNl] = useState('');
  const [htmlNl, setHtmlNl] = useState('');
  const [htmlEn, setHtmlEn] = useState('');
  const [isCustomized, setIsCustomized_] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [dirty, setDirty] = useState(false);

  // ── Test email state ────────────────────────────────────────────────────────
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testErrorMessage, setTestErrorMessage] = useState('');

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ subjectNl: '', subjectEn: '', htmlNl: '', htmlEn: '' });

  // ── Dynamic copy ────────────────────────────────────────────────────────────
  const pageTitle       = useDynamicCopy('emails.header.title',         'Emails');
  const pageSubtitle    = useDynamicCopy('emails.header.subtitle',      'Beheer je email communicatie');
  const statSentLabel   = useDynamicCopy('emails.stat.sent',            'Verzonden');
  const statSentSub     = useDynamicCopy('emails.stat.sent_sublabel',   'Totaal verstuurd');
  const statFailedLabel = useDynamicCopy('emails.stat.failed',          'Mislukt');
  const statFailedSub   = useDynamicCopy('emails.stat.failed_sublabel', 'Leveringsfouten');
  const statTplLabel    = useDynamicCopy('emails.stat.templates',       'Templates');
  const statTplSub      = useDynamicCopy('emails.stat.templates_sub',   'Aangepast');
  const recentTitle     = useDynamicCopy('emails.recent.title',         'Recente Emails');
  const filterAllLabel  = useDynamicCopy('emails.filter.all_statuses',  'Alle statussen');
  const filterSentLabel = useDynamicCopy('emails.filter.sent',          'Verzonden');
  const filterPlannedLabel = useDynamicCopy('emails.filter.planned',    'Gepland');
  const footerNote      = useDynamicCopy('emails.footer.note',          'Niet-aangepaste templates gebruiken de DirectBnB standaard e-mails. U kunt altijd resetten naar de standaard.');

  // ── Load overview data ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/email-templates/host/mine').then(({ data }) => {
      const list: { templateName: string }[] = data?.data ?? data ?? [];
      setCustomized(new Set(list.map(t => t.templateName)));
    }).catch(() => {}).finally(() => setOverviewLoading(false));

    api.get('/email-logs/my/stats')
      .then(({ data }) => setEmailStats(data?.data ?? data ?? null))
      .catch(() => {});

    api.get('/email-logs/my')
      .then(({ data }) => setEmailLogs(data?.data ?? data ?? []))
      .catch(() => {});
  }, []);

  // Pre-fill test email from user
  useEffect(() => {
    if (user?.email) setTestEmail(user.email);
  }, [user?.email]);

  // ── Load template when selected ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTemplate) return;
    setEditorLoading(true);
    setTemplateLoaded(false);
    setDirty(false);
    setSaveStatus('idle');
    api.get(`/email-templates/host/mine/${selectedTemplate}/resolved`)
      .then(({ data }) => {
        const tpl: ResolvedTemplate = data?.data ?? data;
        setSubjectNl(tpl.subjectNl ?? '');
        setSubjectEn(tpl.subjectEn ?? '');
        setPreviewTextNl(tpl.previewTextNl ?? '');
        setHtmlNl(tpl.htmlNl ?? '');
        setHtmlEn(tpl.htmlEn ?? '');
        setIsCustomized_(tpl.isCustomized ?? false);
        latestRef.current = {
          subjectNl: tpl.subjectNl ?? '',
          subjectEn: tpl.subjectEn ?? '',
          htmlNl: tpl.htmlNl ?? '',
          htmlEn: tpl.htmlEn ?? '',
        };
        setTemplateLoaded(true);
      })
      .catch(() => setTemplateLoaded(true))
      .finally(() => setEditorLoading(false));
  }, [selectedTemplate]);

  // Keep latest ref in sync
  useEffect(() => {
    latestRef.current = { subjectNl, subjectEn, htmlNl, htmlEn };
  }, [subjectNl, subjectEn, htmlNl, htmlEn]);

  // Cleanup on unmount
  useEffect(() => () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); }, []);

  // ── Save logic ──────────────────────────────────────────────────────────────
  const performSave = useCallback(async (isAuto = false) => {
    if (!templateLoaded || !selectedTemplate) return;
    const data = latestRef.current;
    if (!data.subjectNl || !data.htmlNl) return;

    if (isAuto) setSaveStatus('autosaving');
    else { setSaving(true); setSaveStatus('idle'); }

    try {
      await api.put(`/email-templates/host/mine/${selectedTemplate}`, {
        subjectNl: data.subjectNl,
        subjectEn: data.subjectEn || data.subjectNl,
        previewTextNl: previewTextNl || undefined,
        htmlNl: data.htmlNl,
        htmlEn: data.htmlEn || data.htmlNl,
      });
      setSaveStatus('success');
      setDirty(false);
      setIsCustomized_(true);
      setCustomized(prev => new Set([...prev, selectedTemplate]));
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      console.error('Save failed:', err);
    } finally {
      if (!isAuto) setSaving(false);
    }
  }, [templateLoaded, selectedTemplate, previewTextNl]);

  // Autosave
  useEffect(() => {
    if (!dirty || !templateLoaded) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => performSave(true), AUTOSAVE_DELAY);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [dirty, subjectNl, previewTextNl, htmlNl, performSave, templateLoaded]);

  const markDirty = useCallback((fn: () => void) => {
    fn();
    setDirty(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    performSave(false);
  }, [performSave]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail || !selectedTemplate) return;
    setTestSending(true);
    setTestStatus('idle');
    setTestErrorMessage('');
    try {
      await api.post(`/email-templates/host/mine/${selectedTemplate}/test`, { to: testEmail, language: 'nl' });
      setTestStatus('success');
      setTimeout(() => { setTestStatus('idle'); setShowTestModal(false); }, 2500);
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'Onbekende fout';
      setTestErrorMessage(msg);
      setTestStatus('error');
    } finally {
      setTestSending(false);
    }
  }, [testEmail, selectedTemplate]);

  const handleReset = async (templateName: string) => {
    if (!confirm('Weet u zeker dat u deze template wilt resetten naar de standaard? Uw aanpassingen gaan verloren.')) return;
    setResetting(templateName);
    try {
      await api.delete(`/email-templates/host/mine/${templateName}`);
      setCustomized(prev => { const next = new Set(prev); next.delete(templateName); return next; });
      if (selectedTemplate === templateName) {
        // Reload the editor with the default template
        setSelectedTemplate(null);
        setTimeout(() => setSelectedTemplate(templateName as TemplateName), 50);
      }
    } finally {
      setResetting(null);
    }
  };

  const filteredLogs = emailLogs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${log.templateName ?? ''} ${log.subject ?? ''} ${log.recipientEmail ?? ''} ${log.recipientName ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // ── EDITOR VIEW ─────────────────────────────────────────────────────────────
  if (selectedTemplate && selectedMeta) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <OnboardingTrigger pageKey="email-editor" />

        {/* Header */}
        <div className="flex items-center justify-between px-1 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="p-2 rounded-xl hover:bg-brand-light text-slate-500 hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{selectedMeta.label}</h1>
                {isCustomized ? (
                  <span className="text-xs bg-brand-light text-brand-600 font-medium px-2 py-0.5 rounded-full">Aangepast</span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Standaard
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{selectedMeta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'autosaving' && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <Clock className="w-3.5 h-3.5 animate-spin" /> Opslaan…
              </div>
            )}
            {saveStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Opgeslagen
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                <AlertCircle className="w-4 h-4" /> Fout bij opslaan
              </div>
            )}

            {isCustomized && (
              <Tooltip content="Reset naar standaard" position="bottom">
                <button
                  onClick={() => handleReset(selectedTemplate)}
                  disabled={resetting === selectedTemplate}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </Tooltip>
            )}

            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Stuur test e-mail</span>
              <span className="sm:hidden">Test</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-2 shrink-0">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Dit zijn automatische e-mails die zonder handmatige actie naar je gasten worden verzonden.
          </p>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3 px-1 pb-2 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap w-28 shrink-0">
            Onderwerp
          </label>
          <input
            type="text"
            value={subjectNl}
            onChange={(e) => markDirty(() => setSubjectNl(e.target.value))}
            placeholder="Bijv. Je boeking is bevestigd 🎉"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
          />
        </div>

        {/* Preview text */}
        <div className="flex items-center gap-3 px-1 pb-3 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap w-28 shrink-0">
            Voorvertoning
          </label>
          <input
            type="text"
            value={previewTextNl}
            onChange={(e) => markDirty(() => setPreviewTextNl(e.target.value))}
            placeholder="Korte tekst zichtbaar in inbox-overzicht…"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
          />
        </div>

        {/* Builder */}
        <div className="flex-1 overflow-hidden">
          {editorLoading ? (
            <div className="h-full bg-white rounded-2xl animate-pulse" />
          ) : (
            <EmailBuilder
              value={htmlNl}
              onChange={(html) => markDirty(() => setHtmlNl(html))}
              subject={subjectNl}
              onSubjectChange={(s) => markDirty(() => setSubjectNl(s))}
              variables={[...selectedMeta.variables]}
            />
          )}
        </div>

        {/* Test modal */}
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
                    className="w-full px-4 py-2.5 bg-brand-light/40 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                {testStatus === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Test e-mail verstuurd!
                  </div>
                )}
                {testStatus === 'error' && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Fout bij verzenden: </span>
                      {testErrorMessage || 'Onbekende fout'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowTestModal(false); setTestStatus('idle'); setTestErrorMessage(''); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSendTest}
                  disabled={!testEmail || testSending}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
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

  // ── OVERVIEW VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">

      {/* Email preview modal */}
      {previewLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewLog(null); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {previewLog.templateName ?? previewLog.subject ?? 'Email'}
                </h2>
                {previewLog.recipientEmail && (
                  <p className="text-sm text-slate-400 mt-0.5">Aan: {previewLog.recipientEmail}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewLog(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Status</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    previewLog.status === 'SENT'      ? 'bg-emerald-100 text-emerald-700' :
                    previewLog.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {previewLog.status === 'SENT' ? 'Verzonden' : previewLog.status === 'SCHEDULED' ? 'Gepland' : previewLog.status}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Verstuurd op</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {previewLog.sentAt ? format(new Date(previewLog.sentAt), 'd MMM yyyy, HH:mm', { locale: nl }) : '—'}
                  </p>
                </div>
              </div>
              {previewLog.subject && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Onderwerp</p>
                  <p className="text-sm font-semibold text-slate-800">{previewLog.subject}</p>
                </div>
              )}
              {previewLog.previewText && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Voorvertoning</p>
                  <p className="text-sm text-slate-600">{previewLog.previewText}</p>
                </div>
              )}
              {previewLog.htmlContent ? (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Inhoud</p>
                  <div
                    className="border border-slate-100 rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: previewLog.htmlContent }}
                  />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-400">
                  Geen HTML-inhoud beschikbaar voor deze log.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <OnboardingTrigger pageKey="emails" />

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="text-slate-400 mt-1">{pageSubtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={statSentLabel}   value={emailStats ? (emailStats.SENT   ?? 0) : '—'} sublabel={statSentSub}   icon={Mail} />
        <StatCard label={statFailedLabel} value={emailStats ? (emailStats.FAILED ?? 0) : '—'} sublabel={statFailedSub} icon={FileText} />
        <StatCard label={statTplLabel}    value={customized.size}                               sublabel={statTplSub}   icon={TrendingUp} />
        <StatCard label="Actieve templates" value={TEMPLATE_TYPES.length} sublabel="Totaal beschikbaar" icon={CheckCircle} />
      </div>

      {/* Template cards — click to open editor inline */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">E-mail templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATE_TYPES.map(({ name, label, description, icon: Icon }) => {
            const isCust = customized.has(name);
            return (
              <button
                key={name}
                onClick={() => setSelectedTemplate(name)}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-brand/30 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-600 transition-colors">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
                <p className="text-sm text-slate-400 mb-4">{description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    Bewerken
                  </span>
                  {isCust ? (
                    <span className="text-[10px] bg-brand-light text-brand-600 font-bold px-2 py-0.5 rounded-full">Aangepast</span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-400 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Standaard
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">{filterAllLabel}</option>
            <option value="SENT">{filterSentLabel}</option>
            <option value="SCHEDULED">{filterPlannedLabel}</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
        </div>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Zoek emails..."
          className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {/* Recent emails */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900">{recentTitle}</h3>
        </div>

        {filteredLogs.length === 0 && emailLogs.length > 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">Geen emails gevonden voor dit filter.</div>
        ) : emailLogs.length === 0 ? (
          <div className="px-6 py-10 space-y-4">
            {[{ subject: 'Welkomstmail', status: 'Verzonden', statusColor: 'bg-emerald-100 text-emerald-700', date: 'Geen logs beschikbaar' }].map((item, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 text-sm">{item.subject}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.statusColor}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredLogs.map((log: any, i: number) => (
              <div key={i} className="px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {log.templateName ?? log.subject ?? 'Email'}
                      {log.recipientName ? ` - ${log.recipientName}` : ''}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      log.status === 'SENT'      ? 'bg-emerald-100 text-emerald-700' :
                      log.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {log.status === 'SENT' ? 'Verzonden' : log.status === 'SCHEDULED' ? 'Gepland' : log.status}
                    </span>
                  </div>
                  {log.recipientEmail && <p className="text-xs text-slate-500 truncate">{log.recipientEmail}</p>}
                  {log.previewText && <p className="text-xs text-slate-400 mt-0.5 truncate">{log.previewText}</p>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    {log.sentAt ? format(new Date(log.sentAt), 'd MMM yyyy, HH:mm', { locale: nl }) : '—'}
                  </p>
                  <button
                    onClick={() => setPreviewLog(log)}
                    className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bekijken</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">{footerNote}</p>
    </div>
  );
}
