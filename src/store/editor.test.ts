import { beforeEach, describe, it, expect } from 'vitest';
import { useEditor } from './editor';
import { createModule } from '../lib/document';
describe('editor history and operations', () => {
  beforeEach(() => useEditor.getState().load(createModule()));
  it('adds and undoes a block', () => {
    const s = useEditor.getState();
    const n = s.doc.blocks.length;
    s.addBlock('callout');
    expect(useEditor.getState().doc.blocks).toHaveLength(n + 1);
    useEditor.getState().undo();
    expect(useEditor.getState().doc.blocks).toHaveLength(n);
  });
  it('redos an undone block addition', () => {
    useEditor.getState().addBlock('callout');
    useEditor.getState().undo();
    useEditor.getState().redo();
    expect(useEditor.getState().doc.blocks.at(-1)?.type).toBe('callout');
  });
  it('duplicates with a new id', () => {
    const s = useEditor.getState();
    const id = s.doc.blocks[0].id;
    s.duplicateBlock(id);
    const blocks = useEditor.getState().doc.blocks;
    expect(blocks[1].id).not.toBe(id);
  });
  it('deletes and restores a block', () => {
    const s = useEditor.getState();
    const id = s.doc.blocks[0].id;
    s.removeBlock(id);
    expect(useEditor.getState().doc.blocks.some((b) => b.id === id)).toBe(false);
    useEditor.getState().undo();
    expect(useEditor.getState().doc.blocks.some((b) => b.id === id)).toBe(true);
  });
  it('reorders blocks', () => {
    const s = useEditor.getState();
    const id = s.doc.blocks[0].id;
    s.moveBlock(id, 2);
    expect(useEditor.getState().doc.blocks[2].id).toBe(id);
  });
  it('prunes redo branch after a new action', () => {
    const s = useEditor.getState();
    s.addBlock('callout');
    s.undo();
    s.addBlock('divider');
    expect(useEditor.getState().future).toHaveLength(0);
  });
  it('caps history at 50 entries', () => {
    for (let i = 0; i < 60; i++) useEditor.getState().addBlock('divider');
    expect(useEditor.getState().past).toHaveLength(50);
  });
  it('does not move outside bounds', () => {
    const s = useEditor.getState();
    s.moveBlock(s.doc.blocks[0].id, -1);
    expect(useEditor.getState().past).toHaveLength(0);
  });
  it('toggles block lock', () => {
    const id = useEditor.getState().doc.blocks[0].id;
    useEditor.getState().toggleLock(id);
    expect(useEditor.getState().doc.blocks[0].settings.isLocked).toBe(true);
  });
  it('does not edit locked blocks', () => {
    const id = useEditor.getState().doc.blocks[0].id;
    useEditor.getState().toggleLock(id);
    const before = useEditor.getState().doc.blocks[0].title;
    useEditor.getState().updateBlock(id, { title: 'changed' });
    expect(useEditor.getState().doc.blocks[0].title).toBe(before);
  });
  it('toggles visibility', () => {
    const id = useEditor.getState().doc.blocks[0].id;
    useEditor.getState().toggleVisibility(id);
    expect(useEditor.getState().doc.blocks[0].settings.isVisible).toBe(false);
  });
  it('updates module title', () => {
    useEditor.getState().setTitle('New lesson');
    expect(useEditor.getState().doc.title).toBe('New lesson');
  });
  it('updates an unlocked block', () => {
  const id = useEditor.getState().doc.blocks[0].id;

  useEditor.getState().updateBlock(id, {
    title: 'Updated lesson title',
  });

  expect(useEditor.getState().doc.blocks[0].title).toBe(
    'Updated lesson title',
  );
});

it('updates block content', () => {
  const id = useEditor.getState().doc.blocks[0].id;

  useEditor.getState().updateBlock(id, {
    content: { html: '<p>Updated content</p>' },
  });

  expect(useEditor.getState().doc.blocks[0].content.html).toBe(
    '<p>Updated content</p>',
  );
});

it('does not duplicate a missing block', () => {
  const before = useEditor.getState().doc.blocks.length;

  useEditor.getState().duplicateBlock('missing-id');

  expect(useEditor.getState().doc.blocks).toHaveLength(before);
});

it('does not move a missing block', () => {
  const before = useEditor.getState().doc.blocks;

  useEditor.getState().moveBlock('missing-id', 1);

  expect(useEditor.getState().doc.blocks).toEqual(before);
});

it('does not move a block to the same position', () => {
  const id = useEditor.getState().doc.blocks[0].id;

  useEditor.getState().moveBlock(id, 0);

  expect(useEditor.getState().past).toHaveLength(0);
});

it('handles undo when history is empty', () => {
  useEditor.getState().undo();

  expect(useEditor.getState().past).toHaveLength(0);
});

it('handles redo when future history is empty', () => {
  useEditor.getState().redo();

  expect(useEditor.getState().future).toHaveLength(0);
});

it('sets toast message', () => {
  useEditor.getState().setToast('Changes saved');

  expect(useEditor.getState().toast).toBe('Changes saved');
});

it('selects and clears a block selection', () => {
  const id = useEditor.getState().doc.blocks[0].id;

  useEditor.getState().select(id);
  expect(useEditor.getState().selectedId).toBe(id);

  useEditor.getState().select(null);
  expect(useEditor.getState().selectedId).toBeNull();
});

it('changes preview device', () => {
  useEditor.getState().setDevice('mobile');

  expect(useEditor.getState().device).toBe('mobile');
});

it('toggles preview dark mode', () => {
  const initial = useEditor.getState().darkPreview;

  useEditor.getState().togglePreviewDark();

  expect(useEditor.getState().darkPreview).toBe(!initial);
});

it('loads a module and resets editor history', () => {
  const module = createModule();

  useEditor.getState().addBlock('callout');
  useEditor.getState().load(module);

  expect(useEditor.getState().doc.moduleId).toBe(module.moduleId);
  expect(useEditor.getState().past).toHaveLength(0);
  expect(useEditor.getState().future).toHaveLength(0);
  expect(useEditor.getState().selectedId).toBeNull();
  expect(useEditor.getState().dirty).toBe(false);
});
});
