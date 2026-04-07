'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { GripVertical, Trash2, Plus } from 'lucide-react';

import type { Block, BlockType } from './types';
import { BLOCK_LABELS } from './types';
import { blocksToHtml, htmlToBlocks } from './blocks-to-html';
import { createDefaultBlock, bookingConfirmationTemplate } from './default-templates';
import { BlockRenderer } from './BlockRenderer';
import { BlockEditor } from './BlockEditor';
import { BlockPalette } from './BlockPalette';

interface Props {
  value: string;
  onChange: (html: string) => void;
  subject: string;
  onSubjectChange: (s: string) => void;
  variables?: string[];
}

export function EmailBuilder({ value, onChange, subject, onSubjectChange, variables = [] }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const parsed = htmlToBlocks(value);
    return parsed ?? bookingConfirmationTemplate();
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Re-parse blocks when value prop changes (language switch)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;
    const parsed = htmlToBlocks(value);
    if (parsed) {
      setBlocks(parsed);
      setSelectedId(null);
    }
  }, [value]);

  // Emit HTML whenever blocks change (debounced 300ms)
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  useEffect(() => {
    const timer = setTimeout(() => {
      const html = blocksToHtml(blocksRef.current);
      onChange(html);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const updateBlock = useCallback((updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }, []);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    const newBlock = createDefaultBlock(type);
    setBlocks((prev) => {
      if (!afterId) return [...prev, newBlock];
      const idx = prev.findIndex((b) => b.id === afterId);
      if (idx === -1) return [...prev, newBlock];
      return [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)];
    });
    setSelectedId(newBlock.id);
  }, []);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const isPalette = active.data.current?.isPalette;

    if (isPalette) {
      const blockType = active.data.current!.blockType as BlockType;
      const newBlock = createDefaultBlock(blockType);
      setBlocks((prev) => {
        const overId = over.id as string;
        const overIdx = prev.findIndex((b) => b.id === overId);
        if (overIdx === -1) return [...prev, newBlock];
        return [...prev.slice(0, overIdx + 1), newBlock, ...prev.slice(overIdx + 1)];
      });
      setSelectedId(newBlock.id);
    } else {
      if (active.id === over.id) return;
      setBlocks((prev) => {
        const oldIdx = prev.findIndex((b) => b.id === active.id);
        const newIdx = prev.findIndex((b) => b.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;
  const activeBlock = blocks.find((b) => b.id === activeId) ?? null;
  const activePaletteType = activeId?.startsWith('palette::')
    ? (activeId.replace('palette::', '') as BlockType)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {/* ── Left sidebar ── */}
        <div className="w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
          <BlockPalette onLoadTemplate={(tpl) => { setBlocks(tpl); setSelectedId(null); }} />
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6" onClick={() => setSelectedId(null)}>
          <div className="mx-auto" style={{ maxWidth: 600 }}>
            <Canvas
              blocks={blocks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={deleteBlock}
              onAdd={addBlock}
            />
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-72 shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
          {selectedBlock ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  {BLOCK_LABELS[selectedBlock.type]}
                </span>
                <button
                  type="button"
                  onClick={() => deleteBlock(selectedBlock.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <BlockEditor
                block={selectedBlock}
                onChange={updateBlock}
                subject={subject}
                onSubjectChange={onSubjectChange}
                variables={variables}
              />
            </>
          ) : (
            <div className="p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Instellingen</p>
              <p className="text-xs text-slate-400">Klik op een blok om het te bewerken.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activePaletteType && (
          <div className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl shadow-xl opacity-90 pointer-events-none">
            + {BLOCK_LABELS[activePaletteType]}
          </div>
        )}
        {activeBlock && !activePaletteType && (
          <div className="bg-white shadow-2xl rounded-xl overflow-hidden opacity-90 pointer-events-none" style={{ width: 540 }}>
            <BlockRenderer block={activeBlock} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/* ────────────────────────────────────────────
   Canvas — droppable sortable list
──────────────────────────────────────────── */

interface CanvasProps {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: BlockType, afterId?: string) => void;
}

function Canvas({ blocks, selectedId, onSelect, onDelete, onAdd }: CanvasProps) {
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  return (
    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className="bg-white rounded-xl overflow-hidden shadow-sm min-h-[200px]"
      >
        {blocks.length === 0 && (
          <EmptyState onAdd={onAdd} />
        )}
        {blocks.map((block) => (
          <SortableBlock
            key={block.id}
            block={block}
            isSelected={selectedId === block.id}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </SortableContext>
  );
}

function EmptyState({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="text-4xl mb-4">📧</div>
      <p className="text-slate-600 font-semibold mb-1">Begin met bouwen</p>
      <p className="text-slate-400 text-sm mb-6">Sleep blokken vanuit het linkerpaneel, of kies een startsjabloon.</p>
      <button
        type="button"
        onClick={() => onAdd('text')}
        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        <Plus className="w-4 h-4" /> Tekstblok toevoegen
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sortable block wrapper
──────────────────────────────────────────── */

interface SortableBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableBlock({ block, isSelected, onSelect, onDelete }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Selection / hover ring */}
      <div
        className={`absolute inset-0 pointer-events-none z-10 transition-all ${
          isSelected
            ? 'ring-2 ring-brand ring-inset'
            : 'ring-0 group-hover:ring-2 group-hover:ring-slate-300 group-hover:ring-inset'
        }`}
      />

      {/* Toolbar */}
      <div
        className={`absolute top-0 right-2 flex items-center gap-1 z-20 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ transform: 'translateY(-50%)' }}
      >
        <div
          {...listeners}
          {...attributes}
          className="flex items-center px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          className="flex items-center px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block content — clicking selects it */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
        className="cursor-pointer"
      >
        <BlockRenderer block={block} />
      </div>
    </div>
  );
}
