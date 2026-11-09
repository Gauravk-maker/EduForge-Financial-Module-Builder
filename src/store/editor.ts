import { create } from 'zustand';
import { createModule, createBlock } from '../lib/document';
import type { Block, BlockType, ModuleDocument } from '../types';
type Snapshot = { doc: ModuleDocument; label: string };
type EditorState = {
  doc: ModuleDocument;
  past: Snapshot[];
  future: Snapshot[];
  selectedId: string | null;
  device: 'desktop' | 'tablet' | 'mobile';
  darkPreview: boolean;
  toast: string;
  dirty: boolean;
  setToast: (s: string) => void;
  markSaved:()=>void;
  setTitle: (s: string) => void;
  addBlock: (t: BlockType, index?: number) => void;
  updateBlock: (id: string, patch: Partial<Block> | { content: Record<string, unknown> }) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, to: number) => void;
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;
  undo: () => void;
  redo: () => void;
  load: (d: ModuleDocument) => void;
  select: (id: string | null) => void;
  setDevice: (d: 'desktop' | 'tablet' | 'mobile') => void;
  togglePreviewDark: () => void;
};
const makeId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const snapshot = (s: EditorState, label: string) => ({ doc: structuredClone(s.doc), label });
export const useEditor = create<EditorState>((set, get) => ({
  doc: createModule(),
  past: [],
  future: [],
  selectedId: null,
  device: 'desktop',
  darkPreview: false,
  toast: '',
  dirty: false,
  setToast: (toast) => set({ toast }),
  markSaved:()=>set({dirty:false}),
  setTitle: (title) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s, 'Update module title')].slice(-50),
      future: [],
      doc: { ...s.doc, title, updatedAt: new Date().toISOString() },
      dirty: true,
    });
  },
  addBlock: (type, index) => {
    const s = get();
    const at = index ?? s.doc.blocks.length;
    const blocks = [...s.doc.blocks];
    blocks.splice(at, 0, createBlock(type, at));
    set({
      past: [...s.past, snapshot(s, `Add ${type}`)].slice(-50),
      future: [],
      doc: { ...s.doc, blocks: blocks.map((b, i) => ({ ...b, order: i })) },
      selectedId: blocks[at].id,
      dirty: true,
    });
  },
  updateBlock: (id, patch) => {
    const s = get();
    if (s.doc.blocks.find((b) => b.id === id)?.settings.isLocked) return;
    set({
      past: [...s.past, snapshot(s, 'Edit block')].slice(-50),
      future: [],
      doc: {
        ...s.doc,
        blocks: s.doc.blocks.map((b) =>
          b.id === id
            ? {
                ...b,
                ...patch,
                content: patch.content ? { ...b.content, ...patch.content } : b.content,
              }
            : b,
        ),
      },
      dirty: true,
    });
  },
  removeBlock: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s, 'Delete block')].slice(-50),
      future: [],
      doc: {
        ...s.doc,
        blocks: s.doc.blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })),
      },
      selectedId: null,
      dirty: true,
    });
  },
  duplicateBlock: (id) => {
    const s = get();
    const i = s.doc.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = { ...structuredClone(s.doc.blocks[i]), id: makeId() };
    const blocks = [...s.doc.blocks];
    blocks.splice(i + 1, 0, copy);
    set({
      past: [...s.past, snapshot(s, 'Duplicate block')].slice(-50),
      future: [],
      doc: { ...s.doc, blocks: blocks.map((b, n) => ({ ...b, order: n })) },
      selectedId: copy.id,
      dirty: true,
    });
  },
  moveBlock: (id, to) => {
    const s = get();
    const from = s.doc.blocks.findIndex((b) => b.id === id);
    if (from < 0 || to < 0 || to >= s.doc.blocks.length || from === to) return;
    const blocks = [...s.doc.blocks];
    const [item] = blocks.splice(from, 1);
    blocks.splice(to, 0, item);
    set({
      past: [...s.past, snapshot(s, 'Reorder block')].slice(-50),
      future: [],
      doc: { ...s.doc, blocks: blocks.map((b, i) => ({ ...b, order: i })) },
      dirty: true,
    });
  },
  toggleLock: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s, 'Toggle block lock')].slice(-50),
      future: [],
      doc: {
        ...s.doc,
        blocks: s.doc.blocks.map((b) =>
          b.id === id ? { ...b, settings: { ...b.settings, isLocked: !b.settings.isLocked } } : b,
        ),
      },
      dirty: true,
    });
  },
  toggleVisibility: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s, 'Toggle block visibility')].slice(-50),
      future: [],
      doc: {
        ...s.doc,
        blocks: s.doc.blocks.map((b) =>
          b.id === id ? { ...b, settings: { ...b.settings, isVisible: !b.settings.isVisible } } : b,
        ),
      },
      dirty: true,
    });
  },
  undo: () => {
    const s = get();
    if (!s.past.length) return;
    const previous = s.past[s.past.length - 1];
    set({
      doc: previous.doc,
      past: s.past.slice(0, -1),
      future: [{ doc: structuredClone(s.doc), label: previous.label }, ...s.future].slice(0, 50),
      dirty: true,
    });
  },
  redo: () => {
    const s = get();
    if (!s.future.length) return;
    const next = s.future[0];
    set({
      doc: next.doc,
      past: [...s.past, { doc: structuredClone(s.doc), label: next.label }].slice(-50),
      future: s.future.slice(1),
      dirty: true,
    });
  },
  load: (doc) => set({ doc, past: [], future: [], selectedId: null, dirty: false }),
  select: (selectedId) => set({ selectedId }),
  setDevice: (device) => set({ device }),
  togglePreviewDark: () => set((s) => ({ darkPreview: !s.darkPreview })),
}));
