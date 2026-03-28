'use client';

import { useState, useRef, useCallback, useMemo, useEffect, memo, useDeferredValue } from 'react';

// Static data outside component — never recreated
const VARIABLES = [
  { label: '{{name}}', description: 'Naam gast/ontvanger' },
  { label: '{{bnb_name}}', description: 'Naam van de B&B' },
  { label: '{{owner_name}}', description: 'Naam eigenaar' },
  { label: '{{guest_name}}', description: 'Naam gast' },
  { label: '{{guest_email}}', description: 'E-mail gast' },
  { label: '{{property_name}}', description: 'Naam accommodatie' },
  { label: '{{room_name}}', description: 'Naam kamer' },
  { label: '{{check_in}}', description: 'Incheckdatum' },
  { label: '{{check_out}}', description: 'Uitcheckdatum' },
  { label: '{{total_price}}', description: 'Totaalprijs' },
  { label: '{{num_guests}}', description: 'Aantal gasten' },
  { label: '{{owner_email}}', description: 'E-mail eigenaar' },
  { label: '{{signup_date}}', description: 'Aanmelddatum' },
];

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  height?: number;
}

// React.memo: skip re-render when parent re-renders but value/onChange haven't changed
export const HtmlEditor = memo(function HtmlEditor({
  value,
  onChange,
  label,
  height = 400,
}: HtmlEditorProps) {
  const [showVars, setShowVars] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Internal local state — decouples typing from parent component re-renders
  const [localValue, setLocalValue] = useState(value);
  const localValueRef = useRef(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when parent changes value externally (e.g. language switch, template load)
  useEffect(() => {
    setLocalValue(value);
    localValueRef.current = value;
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Debounced parent notification (300ms) — typing feels instant, parent re-renders rarely
  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      localValueRef.current = newValue;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(newValue), 300);
    },
    [onChange],
  );

  // Stable cursor operations — use ref instead of state to avoid recreating on every keystroke
  const insertAtCursor = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newValue =
        localValueRef.current.substring(0, start) + text + localValueRef.current.substring(end);
      handleChange(newValue);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + text.length, start + text.length);
      });
    },
    [handleChange],
  );

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = localValueRef.current.substring(start, end) || 'tekst';
      const newText = before + selected + after;
      const newValue =
        localValueRef.current.substring(0, start) + newText + localValueRef.current.substring(end);
      handleChange(newValue);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + before.length, start + before.length + selected.length);
      });
    },
    [handleChange],
  );

  // Toolbar buttons: stable after mount because wrapSelection/insertAtCursor only depend on handleChange
  const toolbarButtons = useMemo(
    () => [
      { label: 'B', title: 'Bold', className: 'font-bold', action: () => wrapSelection('<strong>', '</strong>') },
      { label: 'I', title: 'Italic', className: 'italic', action: () => wrapSelection('<em>', '</em>') },
      { label: 'U', title: 'Underline', className: 'underline', action: () => wrapSelection('<u>', '</u>') },
      { label: 'H2', title: 'Heading', className: 'text-xs', action: () => wrapSelection('<h2>', '</h2>') },
      { label: 'P', title: 'Paragraph', className: 'text-xs', action: () => wrapSelection('<p>', '</p>') },
      { label: '🔗', title: 'Link', className: '', action: () => wrapSelection('<a href="https://">', '</a>') },
      {
        label: '⬜ Button',
        title: 'CTA Button',
        className: 'text-xs',
        action: () =>
          insertAtCursor(
            '<a href="https://directbnb.nl" class="button" style="display:inline-block;background:#FF5000;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Knoptekst</a>',
          ),
      },
      {
        label: '📋 Detail box',
        title: 'Detail table',
        className: 'text-xs',
        action: () =>
          insertAtCursor(
            `<div class="detail-box">\n  <div class="detail-row"><span class="detail-label">Label</span><span class="detail-value">Waarde</span></div>\n</div>`,
          ),
      },
    ],
    [wrapSelection, insertAtCursor],
  );

  // Deferred preview value — preview updates slightly after typing stops, never blocks the UI
  const deferredPreview = useDeferredValue(localValue);

  const handleVarClick = useCallback(
    (varLabel: string) => {
      insertAtCursor(varLabel);
      setShowVars(false);
    },
    [insertAtCursor],
  );

  const toggleVars = useCallback(() => setShowVars((v) => !v), []);

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'edit'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ✏️ Bewerken
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'preview'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          👁 Voorbeeld
        </button>
      </div>

      {activeTab === 'edit' ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            {toolbarButtons.map((btn) => (
              <button
                key={btn.title}
                type="button"
                title={btn.title}
                onClick={btn.action}
                className={`px-2.5 py-1 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 transition-colors ${btn.className}`}
              >
                {btn.label}
              </button>
            ))}

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Variable picker */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleVars}
                className="px-2.5 py-1 text-sm rounded-md border border-brand/20 bg-brand-light text-brand-600 hover:bg-brand-light transition-colors font-mono"
              >
                {'{{var}} ▾'}
              </button>
              {showVars && (
                <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Variabelen invoegen
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {VARIABLES.map((v) => (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => handleVarClick(v.label)}
                        className="w-full text-left px-3 py-2 hover:bg-brand-light transition-colors"
                      >
                        <span className="font-mono text-xs text-brand font-semibold">
                          {v.label}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">{v.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Textarea — uses localValue for instant feedback */}
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            className="w-full font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent leading-relaxed"
            style={{ height }}
          />
        </>
      ) : (
        /* Preview — uses deferred value to never block typing */
        <div
          className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100"
          style={{ height: height + 48 }}
        >
          <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 border-b border-slate-300">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-slate-500 font-mono">email preview</span>
          </div>
          <iframe
            srcDoc={deferredPreview || '<p style="padding:20px;color:#94a3b8">Geen inhoud…</p>'}
            className="w-full h-full bg-white"
            sandbox="allow-same-origin"
            title="Email preview"
          />
        </div>
      )}
    </div>
  );
});
