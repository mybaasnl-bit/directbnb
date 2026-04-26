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
import { GripVertical, Trash2, Plus, LayoutGrid, Settings2, X, Undo2, Redo2 } from 'lucide-react';

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

const HISTORY_LIMIT = 50;

export function EmailBuilder({ value, onChange, subject, onSubjectChange, variables = [] }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const parsed = htmlToBlocks(value);
    return parsed ?? bookingConfirmationTemplate();
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'palette' | 'editor' | null>(null);

  // ── Undo/redo history ───────────────────────────────────────────────────────
  //
  // Root cause of previous breakage (two bugs, now fixed):
  //
  // Bug 1 — History never seeded: historyRef started empty (index = -1).
  //   After the first user edit, index jumped to 0, and the undo guard
  //   `index <= 0` immediately blocked it. Fix: seed history with the
  //   initial block state so the first edit lives at index 1, not 0.
  //
  // Bug 2 — onChange roundtrip wiped history: every edit emits HTML via
  //   onChange(html) → parent stores it → value prop changes → the
  //   "re-parse on value change" effect detected a change, cleared
  //   historyRef, and reset the index. Fix: track lastEmittedRef and skip
  //   the re-parse when the new value is exactly what we just emitted.

  const historyRef      = useRef<Block[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  const skipHistoryRef  = useRef<boolean>(false); // set true during undo/redo and initial loads

  // Tracks the last HTML string we ourselves emitted via onChange so we
  // can distinguish "our own change bouncing back" from a genuine external change.
  const lastEmittedRef = useRef<string>('');

  const pushHistory = useCallback((newBlocks: Block[]) => {
    if (skipHistoryRef.current) return;
    // Drop any future states if we've branched from a mid-history position
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1);
    stack.push(newBlocks);
    if (stack.length > HISTORY_LIMIT) stack.shift();
    historyRef.current = stack;
    historyIndexRef.current = stack.length - 1;
  }, []);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshUndoRedo = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Seed history once with the blocks that exist at mount-time.
  // This ensures the very first user edit lands at index 1, making
  // undo (which requires index > 0) immediately available.
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [blocks];
      historyIndexRef.current = 0;
      refreshUndoRedo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  const setBlocksWithHistory = useCallback((updater: Block[] | ((prev: Block[]) => Block[])) => {
    setBlocks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      setTimeout(refreshUndoRedo, 0);
      return next;
    });
  }, [pushHistory, refreshUndoRedo]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    skipHistoryRef.current = true;
    setBlocks(historyRef.current[historyIndexRef.current]);
    skipHistoryRef.current = false;
    setTimeout(refreshUndoRedo, 0);
  }, [refreshUndoRedo]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    skipHistoryRef.current = true;
    setBlocks(historyRef.current[historyIndexRef.current]);
    skipHistoryRef.current = false;
    setTimeout(refreshUndoRedo, 0);
  }, [refreshUndoRedo]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  // Re-parse blocks when value prop changes externally (e.g. language switch,
  // initial API load). Skip when the change is our own onChange output bouncing
  // back from the parent — that would wipe history on every single keystroke.
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    // Our own emission: ignore to preserve history
    if (value === lastEmittedRef.current) return;

    const parsed = htmlToBlocks(value);
    if (parsed) {
      skipHistoryRef.current = true;
      setBlocks(parsed);
      skipHistoryRef.current = false;
      // Seed fresh history for the newly loaded template — index 0 = baseline
      historyRef.current = [parsed];
      historyIndexRef.current = 0;
      refreshUndoRedo();
      setSelectedId(null);
    }
  }, [value, refreshUndoRedo]);

  // Emit HTML whenever blocks change (debounced 300ms).
  // Record what we emit so the value-change effect above can skip it.
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  useEffect(() => {
    const timer = setTimeout(() => {
      const html = blocksToHtml(blocksRef.current);
      lastEmittedRef.current = html; // ← mark as our own emission
      onChange(html);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const updateBlock = useCallback((updated: Block) => {
    setBlocksWithHistory((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, [setBlocksWithHistory]);

  const deleteBlock = useCallback((id: string) => {
    setBlocksWithHistory((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }, [setBlocksWithHistory]);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    const newBlock = createDefaultBlock(type);
    setBlocksWithHistory((prev) => {
      if (!afterId) return [...prev, newBlock];
      const idx = prev.findIndex((b) => b.id === afterId);
      if (idx === -1) return [...prev, newBlock];
      return [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)];
    });
    setSelectedId(newBlock.id);
  }, [setBlocksWithHistory]);

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
      setBlocksWithHistory((prev) => {
        const overId = over.id as string;
        const overIdx = prev.findIndex((b) => b.id === overId);
        if (overIdx === -1) return [...prev, newBlock];
        return [...prev.slice(0, overIdx + 1), newBlock, ...prev.slice(overIdx + 1)];
      });
      setSelectedId(newBlock.id);
    } else {
      if (active.id === over.id) return;
      setBlocksWithHistory((prev) => {
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

  const handleMobileAdd = useCallback((type: BlockType) => {
    addBlock(type);
    setMobilePanel(null);
  }, [addBlock]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

      {/* Undo/Redo toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-white shrink-0">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Ongedaan maken (Ctrl+Z)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Ongedaan
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Opnieuw uitvoeren (Ctrl+Shift+Z)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
          Opnieuw
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar (desktop only) ── */}
        <div className="hidden md:block w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
          <BlockPalette onLoadTemplate={(tpl) => { skipHistoryRef.current = true; setBlocks(tpl); skipHistoryRef.current = false; historyRef.current = []; historyIndexRef.current = -1; refreshUndoRedo(); setSelectedId(null); }} />
        </div>

        {/* ── Canvas ── */}
        <div
          className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 pb-20 md:pb-6"
          onClick={() => setSelectedId(null)}
        >
          <div className="mx-auto" style={{ maxWidth: 600 }}>
            <Canvas
              blocks={blocks}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); setMobilePanel('editor'); }}
              onDelete={deleteBlock}
              onAdd={addBlock}
            />
          </div>
        </div>

        {/* ── Right panel (desktop only) ── */}
        <div className="hidden md:block w-72 shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
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

      {/* ── Mobile bottom toolbar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex">
        <button
          type="button"
          onClick={() => setMobilePanel(mobilePanel === 'palette' ? null : 'palette')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
            mobilePanel === 'palette' ? 'text-brand' : 'text-slate-500'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          Blokken
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel(mobilePanel === 'editor' ? null : 'editor')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
            mobilePanel === 'editor' ? 'text-brand' : 'text-slate-500'
          }`}
        >
          <Settings2 className="w-5 h-5" />
          Bewerken
        </button>
      </div>

      {/* ── Mobile bottom sheet ── */}
      {mobilePanel !== null && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobilePanel(null)}
          />
          {/* Drawer */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col">
            {/* Handle bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-700">
                {mobilePanel === 'palette' ? 'Blokken toevoegen' : 'Blok bewerken'}
              </span>
              <button
                type="button"
                onClick={() => setMobilePanel(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {mobilePanel === 'palette' ? (
                <BlockPalette
                  onLoadTemplate={(tpl) => { skipHistoryRef.current = true; setBlocks(tpl); skipHistoryRef.current = false; historyRef.current = []; historyIndexRef.current = -1; refreshUndoRedo(); setSelectedId(null); setMobilePanel(null); }}
                  onAdd={handleMobileAdd}
                />
              ) : (
                selectedBlock ? (
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        {BLOCK_LABELS[selectedBlock.type]}
                      </span>
                      <button
                        type="button"
                        onClick={() => { deleteBlock(selectedBlock.id); setMobilePanel(null); }}
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
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-500">Tik op een blok in het canvas om het te bewerken.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

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
      </div>
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
