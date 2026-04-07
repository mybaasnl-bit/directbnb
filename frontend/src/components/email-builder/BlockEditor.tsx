'use client';

import { useRef, useState, type ReactNode } from 'react';
import type { Block, Align, BlockType } from './types';
import { ChevronDown } from 'lucide-react';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
  subject: string;
  onSubjectChange: (s: string) => void;
  variables: string[];
}

export function BlockEditor({ block, onChange, subject, onSubjectChange, variables }: Props) {
  const set = (props: Partial<typeof block.props>) =>
    onChange({ ...block, props: { ...block.props, ...props } as never });

  return (
    <div className="space-y-5 p-4">
      {/* Block-specific controls */}
      {block.type === 'header' && (
        <>
          <Section label="Titel">
            <TextWithVars value={block.props.title} onChange={(v) => set({ title: v })} variables={variables} rows={1} />
          </Section>
          <Section label="Subtitel">
            <TextWithVars value={block.props.subtitle} onChange={(v) => set({ subtitle: v })} variables={variables} rows={1} />
          </Section>
          <Row label="Achtergrond">
            <ColorPicker value={block.props.bgColor} onChange={(v) => set({ bgColor: v })} />
          </Row>
          <Row label="Tekstkleur">
            <ColorPicker value={block.props.textColor} onChange={(v) => set({ textColor: v })} />
          </Row>
        </>
      )}

      {block.type === 'text' && (
        <>
          <Section label="Tekst">
            <TextWithVars value={block.props.content} onChange={(v) => set({ content: v })} variables={variables} rows={6} />
          </Section>
          <Row label="Grootte">
            <select
              value={block.props.fontSize}
              onChange={(e) => set({ fontSize: Number(e.target.value) })}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value={13}>Klein (13px)</option>
              <option value={15}>Normaal (15px)</option>
              <option value={16}>Middel (16px)</option>
              <option value={18}>Groot (18px)</option>
              <option value={22}>Extra groot (22px)</option>
            </select>
          </Row>
          <Row label="Uitlijning">
            <AlignPicker value={block.props.align} onChange={(v) => set({ align: v })} />
          </Row>
          <Row label="Vet">
            <Toggle value={block.props.bold} onChange={(v) => set({ bold: v })} />
          </Row>
          <Row label="Kleur">
            <ColorPicker value={block.props.color} onChange={(v) => set({ color: v })} />
          </Row>
        </>
      )}

      {block.type === 'button' && (
        <>
          <Section label="Knoptekst">
            <input
              type="text"
              value={block.props.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder="Klik hier"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            />
          </Section>
          <Section label="Link (URL)">
            <input
              type="url"
              value={block.props.url}
              onChange={(e) => set({ url: e.target.value })}
              placeholder="https://..."
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            />
          </Section>
          <Row label="Uitlijning">
            <AlignPicker value={block.props.align} onChange={(v) => set({ align: v })} />
          </Row>
          <Row label="Achtergrond">
            <ColorPicker value={block.props.bgColor} onChange={(v) => set({ bgColor: v })} />
          </Row>
          <Row label="Tekstkleur">
            <ColorPicker value={block.props.textColor} onChange={(v) => set({ textColor: v })} />
          </Row>
        </>
      )}

      {block.type === 'image' && (
        <>
          <Section label="Afbeelding URL">
            <input
              type="url"
              value={block.props.src}
              onChange={(e) => set({ src: e.target.value })}
              placeholder="https://..."
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            />
          </Section>
          <Section label="Alt-tekst">
            <input
              type="text"
              value={block.props.alt}
              onChange={(e) => set({ alt: e.target.value })}
              placeholder="Beschrijving van de afbeelding"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            />
          </Section>
          <Row label="Breedte">
            <select
              value={block.props.width}
              onChange={(e) => set({ width: Number(e.target.value) as 25 | 50 | 75 | 100 })}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
            </select>
          </Row>
          <Row label="Uitlijning">
            <AlignPicker value={block.props.align} onChange={(v) => set({ align: v })} />
          </Row>
        </>
      )}

      {block.type === 'divider' && (
        <>
          <Row label="Kleur">
            <ColorPicker value={block.props.color} onChange={(v) => set({ color: v })} />
          </Row>
          <Row label="Dikte">
            <select
              value={block.props.thickness}
              onChange={(e) => set({ thickness: Number(e.target.value) as 1 | 2 | 3 })}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value={1}>Dun (1px)</option>
              <option value={2}>Normaal (2px)</option>
              <option value={3}>Dik (3px)</option>
            </select>
          </Row>
        </>
      )}

      {block.type === 'spacer' && (
        <Row label="Hoogte">
          <select
            value={block.props.height}
            onChange={(e) => set({ height: Number(e.target.value) as 8 | 16 | 32 | 48 })}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value={8}>Heel klein (8px)</option>
            <option value={16}>Klein (16px)</option>
            <option value={32}>Normaal (32px)</option>
            <option value={48}>Groot (48px)</option>
          </select>
        </Row>
      )}

      {block.type === 'footer' && (
        <>
          <Section label="Tekst">
            <TextWithVars value={block.props.text} onChange={(v) => set({ text: v })} variables={variables} rows={4} />
          </Section>
          <Row label="Achtergrond">
            <ColorPicker value={block.props.bgColor} onChange={(v) => set({ bgColor: v })} />
          </Row>
          <Row label="Tekstkleur">
            <ColorPicker value={block.props.textColor} onChange={(v) => set({ textColor: v })} />
          </Row>
        </>
      )}

      {block.type === 'booking_details' && (
        <>
          <Section label="Toon velden">
            <div className="space-y-2">
              {([
                ['showProperty', 'Accommodatienaam'],
                ['showRoom', 'Kamernaam'],
                ['showCheckin', 'Aankomstdatum'],
                ['showCheckout', 'Vertrekdatum'],
                ['showGuests', 'Aantal gasten'],
                ['showPrice', 'Totaalbedrag'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={block.props[key]}
                    onChange={(e) => set({ [key]: e.target.checked })}
                    className="w-4 h-4 rounded text-brand focus:ring-brand"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </Section>
          <Row label="Achtergrond">
            <ColorPicker value={block.props.bgColor} onChange={(v) => set({ bgColor: v })} />
          </Row>
        </>
      )}
    </div>
  );
}

/* ---- Helper components ---- */

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 text-xs font-mono px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
      />
    </div>
  );
}

function AlignPicker({ value, onChange }: { value: Align; onChange: (v: Align) => void }) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {(['left', 'center', 'right'] as Align[]).map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={`flex-1 py-1.5 text-sm transition-colors ${value === a ? 'bg-brand text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          {a === 'left' ? '◀' : a === 'center' ? '≡' : '▶'}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${value ? 'bg-brand text-white border-brand' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
    >
      B
    </button>
  );
}

function TextWithVars({
  value,
  onChange,
  variables,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  variables: string[];
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);

  const insert = (varName: string) => {
    const el = textareaRef.current;
    const tag = `{{${varName}}}`;
    if (!el) {
      onChange(value + tag);
      setOpen(false);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = value.slice(0, start) + tag + value.slice(end);
    onChange(newVal);
    setOpen(false);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + tag.length;
    }, 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white resize-none"
      />
      {variables.length > 0 && (
        <div className="relative mt-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-brand hover:text-brand-600 font-medium"
          >
            {'{'}{'{'}{'}'}{'}'}variabele invoegen <ChevronDown className="w-3 h-3" />
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-48">
              {variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insert(v)}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-brand-light hover:text-brand-600 text-slate-700"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { BlockType };
