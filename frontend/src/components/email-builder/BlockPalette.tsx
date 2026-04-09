'use client';

import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from './types';
import { BLOCK_LABELS } from './types';
import { STARTER_TEMPLATES } from './default-templates';
import type { Block } from './types';

const PALETTE_ITEMS: { type: BlockType; icon: string; desc: string }[] = [
  { type: 'header', icon: '⬛', desc: 'Titel bovenaan' },
  { type: 'text', icon: '📝', desc: 'Tekst alinea' },
  { type: 'button', icon: '🔲', desc: 'Klikbare knop' },
  { type: 'image', icon: '🖼', desc: 'Foto of logo' },
  { type: 'booking_details', icon: '📋', desc: 'Boekingsinfo' },
  { type: 'divider', icon: '—', desc: 'Scheidingslijn' },
  { type: 'spacer', icon: '⬜', desc: 'Lege ruimte' },
  { type: 'footer', icon: '▬', desc: 'Voettekst' },
];

interface Props {
  onLoadTemplate: (blocks: Block[]) => void;
  onAdd?: (type: BlockType) => void;
}

export function BlockPalette({ onLoadTemplate, onAdd }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Blokken</p>
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_ITEMS.map((item) => (
            <PaletteItem key={item.type} type={item.type} icon={item.icon} desc={item.desc} onAdd={onAdd} />
          ))}
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Startsjablonen</p>
        <div className="space-y-2">
          {STARTER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                if (confirm('Huidig ontwerp wissen en dit sjabloon laden?')) {
                  onLoadTemplate(tpl.create());
                }
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-200 hover:border-brand/20 hover:bg-brand-light text-sm text-slate-700 font-medium transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaletteItem({ type, icon, desc, onAdd }: { type: BlockType; icon: string; desc: string; onAdd?: (type: BlockType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette::${type}`,
    data: { isPalette: true, blockType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAdd?.(type)}
      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging
          ? 'opacity-40 border-brand/20 bg-brand-light'
          : 'border-slate-200 bg-white hover:border-brand/20 hover:bg-brand-light hover:shadow-sm'
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">{BLOCK_LABELS[type]}</span>
      <span className="text-[10px] text-slate-400 text-center leading-tight">{desc}</span>
    </div>
  );
}
