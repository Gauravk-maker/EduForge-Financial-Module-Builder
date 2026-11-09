import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Eye,
  FileDown,
  FileUp,
  GripVertical,
  History,
  Lock,
  Monitor,
  Plus,
  Redo2,
  Smartphone,
  Tablet,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Unlock,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  HelpCircle,
  PanelRightClose,
  Sparkles,
  ChevronDown,
  Keyboard,
  Play,
  Image as ImageIcon,
  Video,
  Calculator,
  Code,
  Trophy,
  ListChecks,
  Text,
  Minus,
  Lightbulb,
  Layers,
  Cloud,
  FolderOpen,
  X,
} from 'lucide-react';
import { useEditor } from './store/editor';
import { type Block, type BlockType } from './types';
import { exportModule, importModule, validateModule } from './lib/document';
import { saveModuleToCloud } from './lib/moduleStorage';
import { MyModules } from './components/MyModules';
import { EmiCalculator, SipCalculator, CompoundCalculator } from './components/Calculators';
import { RichTextEditor } from './components/RichTextEditor';
import type { LucideIcon } from 'lucide-react';
import { filterBlockTypes } from './lib/finance';
type CatalogItem = {
  type: BlockType;
  label: string;
  desc: string;
  keywords: string[];
  icon: LucideIcon;
};

const catalog: CatalogItem[] = (
  [
    [
      'rich-text',
      'Rich text',
      'Headings, lists and formatted lesson copy',
      ['text', 'writing', 'paragraph'],
      Text,
    ],
    ['image', 'Image', 'Add an image with alt text and caption', ['photo', 'picture'], ImageIcon],
    [
      'video',
      'Video embed',
      'Embed YouTube or Vimeo content',
      ['youtube', 'vimeo', 'media'],
      Video,
    ],
    [
      'quiz-mcq',
      'Multiple choice quiz',
      'Check learner understanding',
      ['quiz', 'question', 'mcq'],
      CheckCircle2,
    ],
    [
      'quiz-true-false',
      'True / false quiz',
      'A quick knowledge check',
      ['quiz', 'binary', 'question'],
      CheckCircle2,
    ],
    [
      'emi-calculator',
      'EMI calculator',
      'Explore loan repayments',
      ['loan', 'home loan', 'calculator', 'calc'],
      Calculator,
    ],
    [
      'sip-calculator',
      'SIP calculator',
      'Explore monthly investing',
      ['investment', 'mutual fund', 'calculator', 'calc'],
      Calculator,
    ],
    [
      'compound-interest',
      'Compound interest',
      'Visualise long-term growth',
      ['growth', 'interest', 'calculator', 'calc'],
      Calculator,
    ],
    ['callout', 'Callout', 'Highlight a useful insight', ['tip', 'warning', 'info'], Lightbulb],
    ['divider', 'Divider', 'Separate lesson sections', ['line', 'separator'], Minus],
    [
      'accordion',
      'Accordion / FAQ',
      'Group expandable information',
      ['faq', 'expand', 'collapse'],
      Layers,
    ],
    [
      'progress-tracker',
      'Progress tracker',
      'Show lesson milestones',
      ['steps', 'progress'],
      ListChecks,
    ],
    [
      'achievement-badge',
      'Achievement badge',
      'Celebrate learner progress',
      ['reward', 'trophy', 'badge'],
      Trophy,
    ],
    ['code-snippet', 'Code snippet', 'Share a formatted example', ['code', 'json', 'python'], Code],
    [
      'concept-explainer',
      'Concept explainer',
      'Teach a concept step by step',
      ['animation', 'steps', 'explain'],
      Sparkles,
    ],
  ] as [BlockType, string, string, string[], LucideIcon][]
).map(([type, label, desc, keywords, icon]) => ({
  type,
  label,
  desc,
  keywords,
  icon,
}));
function App() {
  const s = useEditor();
  const [palette, setPalette] = useState(false);
  const [search, setSearch] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMyModules, setShowMyModules] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [, setSlash] = useState(false);
  const [tutorial, setTutorial] = useState(!localStorage.getItem('eduforge-tutorial'));
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const errors = useMemo(() => validateModule(s.doc), [s.doc]);
  const filtered = filterBlockTypes(search, catalog);
  const selected = s.doc.blocks.find((b) => b.id === s.selectedId);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          s.redo();
        } else {
          s.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
      } else if (!typing && e.altKey && e.key === 'ArrowUp' && s.selectedId) {
        e.preventDefault();
        const i = s.doc.blocks.findIndex((b) => b.id === s.selectedId);
        s.moveBlock(s.selectedId, i - 1);
      } else if (!typing && e.altKey && e.key === 'ArrowDown' && s.selectedId) {
        e.preventDefault();
        const i = s.doc.blocks.findIndex((b) => b.id === s.selectedId);
        s.moveBlock(s.selectedId, i + 1);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && s.selectedId) {
        e.preventDefault();
        s.duplicateBlock(s.selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace' && s.selectedId) {
        e.preventDefault();
        if (confirm('Delete this block? You can undo this action.')) s.removeBlock(s.selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l' && s.selectedId) {
        e.preventDefault();
        s.toggleLock(s.selectedId);
      } else if (e.key === 'Escape') {
        setPalette(false);
        setSlash(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [s]);
  function add(type: BlockType) {
    s.addBlock(type);
    setPalette(false);
    setSlash(false);
    setSearch('');
    s.setToast(`${catalog.find((x) => x.type === type)?.label ?? type} added`);
  }
  function onDragEnd(e: DragEndEvent) {
    if (e.over && e.active.id !== e.over.id) {
      const to = s.doc.blocks.findIndex((b) => b.id === e.over?.id);
      s.moveBlock(String(e.active.id), to);
    }
  }
  function exportJson() {
    try {
      const data = exportModule(s.doc);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = `${s.doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      s.setToast('Module exported successfully');
    } catch (e) {
      s.setToast(e instanceof Error ? e.message : 'Export failed');
    }
  }
  async function importJson(file: File) {
    try {
      const doc = importModule(await file.text());
      if (s.dirty && !confirm('You have unsaved changes. Replace the current module?')) return;
      s.load(doc);
      s.setToast('Module imported successfully');
    } catch (e) {
      s.setToast(e instanceof Error ? e.message : 'Import failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  async function handleCloudSave() {
    setCloudSaving(true);

    try {
      await saveModuleToCloud(s.doc);
      s.markSaved();
      s.setToast('Module saved to cloud successfully');
    } catch (error) {
      s.setToast(error instanceof Error ? error.message : 'Cloud save failed');
    } finally {
      setCloudSaving(false);
    }
  }

  function handleCloudLoad(document: import('./types').ModuleDocument) {
    if (s.dirty && !confirm('You have unsaved changes. Replace the current module?')) {
      return;
    }

    s.load(document);
    setShowMyModules(false);
    s.setToast('Cloud module loaded successfully');
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Layers size={20} />
          </div>
          <div>
            <strong>
              eduforge<span>.</span>
            </strong>
            <small>CONTENT STUDIO</small>
          </div>
        </div>
        <div className="breadcrumb">
          <span>Workspace</span>
          <b>/</b>
          <span>Financial education</span>
          <b>/</b>
          <strong>Module builder</strong>
        </div>
        <div className="top-actions">
          <span className="saved-status">
            <i /> {s.dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
          <button
            className="icon-btn"
            title="Keyboard shortcuts"
            onClick={() => setShowShortcuts(true)}
          >
            <Keyboard size={17} />
          </button>
          <button className="avatar" title="Creator profile">
            GK
          </button>
        </div>
      </header>
      <div className="workspace-head">
        <div className="title-area">
          <div className="eyebrow">
            MODULE WORKSPACE <span>â€¢</span> DRAFT
          </div>
          <input
            aria-label="Module title"
            className="module-title"
            value={s.doc.title}
            onChange={(e) => s.setTitle(e.target.value)}
            maxLength={200}
          />
          <p>{s.doc.description}</p>
        </div>
        <div className="workspace-actions">
          <button
            className="btn btn-quiet"
            disabled={!s.past.length}
            onClick={s.undo}
            title="Undo (Ctrl+Z)"
          >
            <ArrowUp className="rotate-45" size={15} /> Undo
          </button>
          <button
            className="btn btn-quiet"
            disabled={!s.future.length}
            onClick={s.redo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} /> Redo
          </button>
          <button className="btn btn-quiet" onClick={() => setShowHistory(!showHistory)}>
            <History size={15} /> History <span className="count">{s.past.length}/50</span>
          </button>
          <button className="btn btn-outline" onClick={() => setShowMyModules(true)}>
            <FolderOpen size={15} />
            My Modules
          </button>

          <button
            className="btn btn-primary"
            onClick={() => void handleCloudSave()}
            disabled={cloudSaving}
          >
            <Cloud size={15} />
            {cloudSaving ? 'Saving...' : 'Save to Cloud'}
          </button>
          <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>
            <FileUp size={15} /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && void importJson(e.target.files[0])}
          />
          <button className="btn btn-primary" onClick={exportJson}>
            <FileDown size={15} /> Export module
          </button>
        </div>
      </div>
      <div className="main-layout">
        <aside className="left-rail">
          <div className="rail-heading">
            <span>BUILD</span>
            <button className="tiny-icon" onClick={() => setPalette(!palette)} title="Add a block">
              <Plus size={16} />
            </button>
          </div>
          <button className="rail-item active" onClick={() => setPalette(!palette)}>
            <Layers size={17} /> <span>Content blocks</span>
            <span className="rail-count">15</span>
          </button>
          <button className="rail-item" onClick={() => setShowHistory(!showHistory)}>
            <History size={17} /> <span>History</span>
          </button>
          <button className="rail-item" onClick={() => setShowGuide(true)}>
            <HelpCircle size={17} /> <span>Creator guide</span>
          </button>
          <div className="rail-bottom">
            <div className="help-card">
              <Sparkles size={17} />
              <b>Need a hand?</b>
              <p>Explore the quick guide to get started.</p>
              <button onClick={() => setShowGuide(true)}>
                Open guide <span>â†—</span>
              </button>
            </div>
            <small>EDUFORGE STUDIO Â· V1.0</small>
          </div>
        </aside>
        <main className="editor-column">
          <div className="panel-top">
            <div>
              <span className="panel-title">Your module</span>
              <span className="subtle">{s.doc.blocks.length} blocks</span>
            </div>
            <div className="panel-controls">
              <button className="tiny-icon" title="Add block" onClick={() => setPalette(true)}>
                <Plus size={17} />
              </button>
              <button className="tiny-icon" title="Help" onClick={() => setShowGuide(true)}>
                <HelpCircle size={16} />
              </button>
            </div>
          </div>
          {palette && (
            <div className="palette">
              <div className="palette-top">
                <div>
                  <b>Add a building block</b>
                  <small>Choose a block to add to your lesson</small>
                </div>
                <button className="tiny-icon" onClick={() => setPalette(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="search-box">
                <Search size={15} />
                <input
                  autoFocus
                  placeholder="Search blocksâ€¦ (e.g. calculator)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="palette-grid">
                {filtered.map((item) => (
                  <button key={item.type} className="palette-option" onClick={() => add(item.type)}>
                    <span className="palette-icon">
                      <item.icon size={17} />
                    </span>
                    <span>
                      <b>{item.label}</b>
                      <small>{item.desc}</small>
                    </span>
                    <Plus size={15} />
                  </button>
                ))}
              </div>
              {!filtered.length && (
                <p className="empty-note">No blocks match â€œ{search}â€. Try another keyword.</p>
              )}
            </div>
          )}
          <div
            className="canvas"
            role="application"
            aria-label="Module Editor"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === '/' && e.target === e.currentTarget) {
                e.preventDefault();
                setPalette(true);
                setSlash(true);
              }
            }}
          >
            <div className="canvas-intro">
              <span className="eyebrow">LESSON CONTENT</span>
              <h2>Build something valuable.</h2>
              <p>Add blocks, arrange your story, and see the learner experience update live.</p>
            </div>
            {s.doc.blocks.length === 0 ? (
              <div className="empty-canvas">
                <div className="empty-icon">
                  <BookOpen size={25} />
                </div>
                <h3>Your canvas is ready</h3>
                <p>Start with a text block, or add an interactive calculator or quiz.</p>
                <button className="btn btn-primary" onClick={() => setPalette(true)}>
                  <Plus size={16} /> Add your first block
                </button>
              </div>
            ) : (
              <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <SortableContext
                  items={s.doc.blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {s.doc.blocks.map((b, i) => (
                    <SortableBlock
                      key={b.id}
                      block={b}
                      index={i}
                      total={s.doc.blocks.length}
                      selected={s.selectedId === b.id}
                      onSelect={() => s.select(b.id)}
                      onAdd={() => {
                        s.select(b.id);
                        setPalette(true);
                      }}
                      onDuplicate={() => s.duplicateBlock(b.id)}
                      onDelete={() => {
                        if (confirm('Delete this block? You can undo this action.'))
                          s.removeBlock(b.id);
                      }}
                      onMove={(delta) => s.moveBlock(b.id, i + delta)}
                      onLock={() => s.toggleLock(b.id)}
                      onVisible={() => s.toggleVisibility(b.id)}
                      onUpdate={(patch) => s.updateBlock(b.id, patch)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
            <button className="add-another" onClick={() => setPalette(true)}>
              <Plus size={16} /> Add another block
            </button>
            <div className="canvas-foot">
              <span>âœ¨ Looking good! Your learners are going to love this.</span>
              <span>{s.doc.blocks.length} / 200 blocks</span>
            </div>
          </div>
        </main>
        <section className="preview-column">
          <div className="preview-head">
            <div>
              <span className="panel-title">Live preview</span>
              <span className="live-dot">LIVE</span>
            </div>
            <button className="tiny-icon" title="Preview help" onClick={() => setShowGuide(true)}>
              <HelpCircle size={16} />
            </button>
          </div>
          <div className="preview-toolbar">
            <div className="device-switch" role="radiogroup" aria-label="Preview device">
              <button
                aria-label="Desktop preview"
                aria-checked={s.device === 'desktop'}
                className={s.device === 'desktop' ? 'chosen' : ''}
                onClick={() => s.setDevice('desktop')}
              >
                <Monitor size={15} />
              </button>
              <button
                aria-label="Tablet preview"
                aria-checked={s.device === 'tablet'}
                className={s.device === 'tablet' ? 'chosen' : ''}
                onClick={() => s.setDevice('tablet')}
              >
                <Tablet size={15} />
              </button>
              <button
                aria-label="Mobile preview"
                aria-checked={s.device === 'mobile'}
                className={s.device === 'mobile' ? 'chosen' : ''}
                onClick={() => s.setDevice('mobile')}
              >
                <Smartphone size={15} />
              </button>
            </div>
            <button
              className="tiny-icon"
              onClick={s.togglePreviewDark}
              title="Toggle preview theme"
            >
              â—
            </button>
          </div>
          <div className="preview-stage">
            <motion.div
              layout
              className={`preview-device ${s.device} ${s.darkPreview ? 'preview-dark' : ''}`}
            >
              <div className="preview-sitebar">
                <div className="preview-logo">
                  EF<span>.</span>
                </div>
                <span>FINANCIAL LEARNING</span>
                <span className="preview-avatar">JD</span>
              </div>
              <div className="preview-progress">
                <i style={{ width: `${Math.min(100, s.doc.blocks.length * 10)}%` }} />
              </div>
              <article className="preview-content">
                <div className="preview-kicker">
                  PERSONAL FINANCE Â· {s.doc.metadata.difficulty.toUpperCase()}
                </div>
                <h2>{s.doc.title}</h2>
                <p className="preview-description">{s.doc.description}</p>
                {s.doc.blocks
                  .filter((b) => b.settings.isVisible)
                  .map((b) => (
                    <PreviewBlock key={b.id} block={b} />
                  ))}
              </article>
              <div className="preview-bottom">
                <span>EDUFORGE FINANCIAL LEARNING</span>
                <button>
                  Continue <span>â†’</span>
                </button>
              </div>
            </motion.div>
          </div>
          <div className="preview-footer">
            <span>
              <i /> Preview updates automatically
            </span>
            <button onClick={() => setActiveTab(activeTab === 'editor' ? 'preview' : 'editor')}>
              <Eye size={14} /> Learner view
            </button>
          </div>
        </section>
        {showHistory && (
          <aside className="history-drawer">
            <div className="drawer-head">
              <div>
                <b>Version history</b>
                <small>Your last 50 changes</small>
              </div>
              <button className="tiny-icon" onClick={() => setShowHistory(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="history-list">
              {s.past.length === 0 ? (
                <p className="empty-note">Your changes will appear here.</p>
              ) : (
                [...s.past].reverse().map((x, i) => (
                  <div className="history-entry" key={`${x.label}-${i}`}>
                    <span className="history-dot" />
                    <div>
                      <b>{x.label}</b>
                      <small>{i === 0 ? 'Most recent change' : `${i + 1} changes ago`}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="drawer-actions">
              <button className="btn btn-outline" disabled={!s.past.length} onClick={s.undo}>
                Undo last change
              </button>
              <button className="btn btn-outline" disabled={!s.future.length} onClick={s.redo}>
                Redo
              </button>
            </div>
          </aside>
        )}
        {selected && (
          <aside className="settings-drawer">
            <div className="drawer-head">
              <div>
                <b>Block settings</b>
                <small>{selected.title}</small>
              </div>
              <button className="tiny-icon" onClick={() => s.select(null)}>
                <PanelRightClose size={16} />
              </button>
            </div>
            <BlockSettings
              block={selected}
              onUpdate={(patch) => s.updateBlock(selected.id, patch)}
            />
          </aside>
        )}
      </div>
      {errors.length > 0 && (
        <div className="validation-strip">
          <AlertCircle size={15} />
          <span>
            {errors.length} validation {errors.length === 1 ? 'item' : 'items'} to review before
            export
          </span>
          <button onClick={() => setShowGuide(true)}>Review guidance</button>
        </div>
      )}
      {showMyModules && (
  <Modal
    title="My Cloud Modules"
    close={() => setShowMyModules(false)}
  >
    <MyModules onLoad={handleCloudLoad} />
  </Modal>
)}
      {showGuide && (
        <Modal title="Creator quick guide" close={() => setShowGuide(false)}>
          <div className="guide-content">
            <div className="guide-step">
              <span>01</span>
              <div>
                <b>Add a block</b>
                <p>
                  Choose the + button, then select text, quiz, image, or one of the financial
                  calculators.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <span>02</span>
              <div>
                <b>Make it yours</b>
                <p>
                  Select any block to open its settings. Use plain language and keep each lesson
                  focused.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <span>03</span>
              <div>
                <b>Arrange your lesson</b>
                <p>
                  Drag the grip handle to reorder blocks. Duplicate or remove blocks from the
                  toolbar. Undo is always available.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <span>04</span>
              <div>
                <b>Preview every screen</b>
                <p>
                  Use the desktop, tablet, and mobile buttons to check how learners will see the
                  module.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <span>05</span>
              <div>
                <b>Export your module</b>
                <p>
                  Resolve blocking validation messages, then choose Export module to download a
                  portable JSON file.
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowGuide(false)}>
              Got it
            </button>
          </div>
        </Modal>
      )}
      {showShortcuts && (
        <Modal title="Keyboard shortcuts" close={() => setShowShortcuts(false)}>
          <div className="shortcut-list">
            {[
              ['Undo', 'Ctrl + Z'],
              ['Redo', 'Ctrl + Shift + Z / Ctrl + Y'],
              ['Duplicate selected block', 'Ctrl + D'],
              ['Delete selected block', 'Ctrl + Backspace'],
              ['Move block up', 'Alt + â†‘'],
              ['Move block down', 'Alt + â†“'],
              ['Lock / unlock block', 'Ctrl + L'],
              ['Open block palette', '+ button'],
              ['Dismiss menus', 'Escape'],
            ].map((x) => (
              <div key={x[0]}>
                <span>{x[0]}</span>
                <kbd>{x[1]}</kbd>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {tutorial && (
        <div className="tutorial-banner">
          <Sparkles size={16} />
          <div>
            <b>Welcome to EduForge Studio</b>
            <span>Your lesson workspace is ready. Add a block to begin building.</span>
          </div>
          <button
            onClick={() => {
              setTutorial(false);
              localStorage.setItem('eduforge-tutorial', '1');
            }}
          >
            Got it
          </button>
        </div>
      )}
      {s.toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="toast"
          role="status"
        >
          <CheckCircle2 size={16} />
          {s.toast}
          <button onClick={() => s.setToast('')}>
            <X size={14} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
function SortableBlock({
  block,
  index,
  total,
  selected,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  onLock,
  onVisible,
  onUpdate,
}: {
  block: Block;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (d: number) => void;
  onLock: () => void;
  onVisible: () => void;
  onUpdate: (p: Partial<Block>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: block.settings.isLocked,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const meta = catalog.find((x) => x.type === block.type)!;
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`block-card ${selected ? 'selected' : ''} ${block.settings.isLocked ? 'locked' : ''}`}
      onClick={onSelect}
      role="group"
      aria-label={`${meta.label} block, position ${index + 1} of ${total}`}
    >
      <div className="block-toolbar">
        <button className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          <GripVertical size={17} />
        </button>
        <span className="block-kind">{meta.label.toUpperCase()}</span>
        <div className="toolbar-actions">
          <button
            title="Move up"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMove(-1);
            }}
          >
            <ArrowUp size={14} />
          </button>
          <button
            title="Move down"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMove(1);
            }}
          >
            <ArrowDown size={14} />
          </button>
          <button
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy size={14} />
          </button>
          <button
            title={block.settings.isLocked ? 'Unlock' : 'Lock'}
            onClick={(e) => {
              e.stopPropagation();
              onLock();
            }}
          >
            {block.settings.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          </button>
          <button
            title={block.settings.isVisible ? 'Hide in preview' : 'Show in preview'}
            onClick={(e) => {
              e.stopPropagation();
              onVisible();
            }}
          >
            {block.settings.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="block-body">
        <BlockEditor block={block} onUpdate={onUpdate} />
      </div>
      {block.settings.isLocked && (
        <span className="locked-label">
          <Lock size={12} /> Locked
        </span>
      )}
      <button
        className="block-add"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
      >
        <Plus size={14} /> Add below
      </button>
    </motion.div>
  );
}
function BlockEditor({ block, onUpdate }: { block: Block; onUpdate: (p: Partial<Block>) => void }) {
  const c = block.content;
  const set = (key: string, value: unknown) => onUpdate({ content: { [key]: value } });
  if (block.settings.isLocked)
    return <p className="muted">This block is locked. Unlock it to make changes.</p>;
  switch (block.type) {
    case 'rich-text':
      return (
        <div>
          <input
            className="block-title-input"
            aria-label="Rich text heading"
            value={String(c.heading ?? '')}
            placeholder="Add a headingâ€¦"
            onChange={(e) => set('heading', e.target.value)}
          />
          <RichTextEditor
            value={String(c.html ?? '<p>Start writing your lessonâ€¦</p>')}
            onChange={(html) => set('html', html)}
          />
        </div>
      );
    case 'image':
      return (
        <div className="simple-fields">
          <input
            aria-label="Image URL"
            placeholder="Paste image URL"
            value={String(c.url ?? '')}
            onChange={(e) => set('url', e.target.value)}
          />
          <input
            aria-label="Image alt text"
            placeholder="Describe the image (required)"
            value={String(c.alt ?? '')}
            onChange={(e) => set('alt', e.target.value)}
          />
          <input
            aria-label="Image caption"
            placeholder="Caption (optional)"
            value={String(c.caption ?? '')}
            onChange={(e) => set('caption', e.target.value)}
          />
        </div>
      );
    case 'video':
      return (
        <div className="simple-fields">
          <input
            aria-label="Video URL"
            value={String(c.url ?? '')}
            placeholder="YouTube or Vimeo URL"
            onChange={(e) => set('url', e.target.value)}
          />
          <div className="embed-placeholder">
            <Play size={18} /> Video preview appears in learner view
          </div>
        </div>
      );
    case 'quiz-mcq':
      return (
        <div className="simple-fields">
          <input
            aria-label="Quiz question"
            value={String(c.question ?? '')}
            onChange={(e) => set('question', e.target.value)}
          />
          {((c.options as { text: string; isCorrect: boolean }[]) ?? []).map((o, i) => (
            <div className="option-edit" key={i}>
              <input
                aria-label={`Option ${i + 1}`}
                value={o.text}
                onChange={(e) =>
                  set(
                    'options',
                    (c.options as { text: string; isCorrect: boolean }[]).map((v, j) =>
                      j === i ? { ...v, text: e.target.value } : v,
                    ),
                  )
                }
              />
              <label>
                <input
                  type="checkbox"
                  checked={o.isCorrect}
                  onChange={(e) =>
                    set(
                      'options',
                      (c.options as { text: string; isCorrect: boolean }[]).map((v, j) =>
                        j === i ? { ...v, isCorrect: e.target.checked } : v,
                      ),
                    )
                  }
                />{' '}
                Correct
              </label>
              <button
                className="tiny-icon"
                onClick={() =>
                  set(
                    'options',
                    (c.options as { text: string; isCorrect: boolean }[]).filter((_, j) => j !== i),
                  )
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            className="text-button"
            onClick={() =>
              set(
                'options',
                [
                  ...((c.options as { text: string; isCorrect: boolean }[]) ?? []),
                  { text: `Option ${(c.options as unknown[]).length + 1}`, isCorrect: false },
                ].slice(0, 6),
              )
            }
          >
            + Add option
          </button>
        </div>
      );
    case 'quiz-true-false':
      return (
        <div className="simple-fields">
          <input
            aria-label="True false question"
            value={String(c.question ?? '')}
            onChange={(e) => set('question', e.target.value)}
          />
          <label className="inline-field">
            Correct answer{' '}
            <select
              value={String(c.answer)}
              onChange={(e) => set('answer', e.target.value === 'true')}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
          <input
            aria-label="Answer explanation"
            placeholder="Explain the answer"
            value={String(c.explanation ?? '')}
            onChange={(e) => set('explanation', e.target.value)}
          />
        </div>
      );
    case 'emi-calculator':
      return (
        <div className="block-summary">
          <Calculator size={20} />
          <div>
            <b>Home loan EMI planner</b>
            <span>
              Principal â‚¹{Number(c.principal).toLocaleString('en-IN')} Â· {String(c.rate)}% Â·{' '}
              {String(c.months)} months
            </span>
          </div>
          <span className="pill">Interactive</span>
        </div>
      );
    case 'sip-calculator':
      return (
        <div className="block-summary">
          <Calculator size={20} />
          <div>
            <b>Monthly SIP planner</b>
            <span>
              â‚¹{Number(c.monthly).toLocaleString('en-IN')} / month Â· {String(c.rate)}% Â·{' '}
              {String(c.years)} years
            </span>
          </div>
          <span className="pill">Interactive</span>
        </div>
      );
    case 'compound-interest':
      return (
        <div className="block-summary">
          <Calculator size={20} />
          <div>
            <b>Compound growth explorer</b>
            <span>
              â‚¹{Number(c.principal).toLocaleString('en-IN')} Â· {String(c.rate)}% Â·{' '}
              {String(c.years)} years
            </span>
          </div>
          <span className="pill">Interactive</span>
        </div>
      );
    case 'callout':
      return (
        <div className={`callout-edit ${String(c.variant)}`}>
          <select
            aria-label="Callout style"
            value={String(c.variant)}
            onChange={(e) => set('variant', e.target.value)}
          >
            <option value="tip">Tip</option>
            <option value="info">Information</option>
            <option value="warning">Warning</option>
            <option value="important">Important</option>
            <option value="danger">Caution</option>
          </select>
          <textarea
            aria-label="Callout text"
            value={String(c.text ?? '')}
            onChange={(e) => set('text', e.target.value)}
          />
        </div>
      );
    case 'divider':
      return (
        <div className="simple-fields">
          <label>
            Divider style{' '}
            <select value={String(c.style)} onChange={(e) => set('style', e.target.value)}>
              <option>solid</option>
              <option>dashed</option>
              <option>dotted</option>
              <option>gradient</option>
            </select>
          </label>
          <hr />
        </div>
      );
    case 'accordion':
      return (
        <div className="simple-fields">
          {((c.items as { title: string; body: string }[]) ?? []).map((x, i) => (
            <div className="accordion-edit" key={i}>
              <input
                aria-label={`Accordion title ${i + 1}`}
                value={x.title}
                onChange={(e) =>
                  set(
                    'items',
                    (c.items as { title: string; body: string }[]).map((v, j) =>
                      j === i ? { ...v, title: e.target.value } : v,
                    ),
                  )
                }
              />
              <input
                aria-label={`Accordion body ${i + 1}`}
                value={x.body}
                onChange={(e) =>
                  set(
                    'items',
                    (c.items as { title: string; body: string }[]).map((v, j) =>
                      j === i ? { ...v, body: e.target.value } : v,
                    ),
                  )
                }
              />
            </div>
          ))}
          <button
            className="text-button"
            onClick={() =>
              set('items', [
                ...((c.items as { title: string; body: string }[]) ?? []),
                { title: 'New question', body: 'Add an answer' },
              ])
            }
          >
            + Add FAQ item
          </button>
        </div>
      );
    case 'progress-tracker':
      return (
        <div className="simple-fields">
          <label>
            Total steps{' '}
            <input
              type="number"
              min="2"
              max="30"
              value={Number(c.total)}
              onChange={(e) => set('total', Math.max(2, +e.target.value))}
            />
          </label>
          <label>
            Current step{' '}
            <input
              type="number"
              min="1"
              max={Number(c.total)}
              value={Number(c.current)}
              onChange={(e) => set('current', +e.target.value)}
            />
          </label>
        </div>
      );
    case 'achievement-badge':
      return (
        <div className="block-summary">
          <span className="badge-emoji">{String(c.icon ?? 'ðŸ†')}</span>
          <div>
            <b>{String(c.title)}</b>
            <span>{String(c.description)}</span>
          </div>
          <span className="pill">{c.unlocked ? 'Unlocked' : 'Locked'}</span>
        </div>
      );
    case 'code-snippet':
      return (
        <div className="simple-fields">
          <select
            aria-label="Code language"
            value={String(c.language)}
            onChange={(e) => set('language', e.target.value)}
          >
            <option>json</option>
            <option>javascript</option>
            <option>python</option>
            <option>sql</option>
          </select>
          <textarea
            className="code-input"
            aria-label="Code content"
            value={String(c.code)}
            onChange={(e) => set('code', e.target.value)}
          />
        </div>
      );
    case 'concept-explainer':
      return (
        <div className="simple-fields">
          <input
            aria-label="Explainer title"
            value={String(c.title)}
            onChange={(e) => set('title', e.target.value)}
          />
          <span className="muted">
            {((c.steps as { title: string }[]) ?? []).length} learning steps Â· Configure each step
            in the settings panel.
          </span>
        </div>
      );
    default:
      return null;
  }
}
function BlockSettings({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (p: Partial<Block>) => void;
}) {
  const c = block.content;
  const [advanced, setAdvanced] = useState(false);
  const update = (key: string, value: unknown) => onUpdate({ content: { [key]: value } });
  return (
    <div className="settings-content">
      <p className="muted">
        Fine-tune this building block. Changes appear in the preview instantly.
      </p>
      {block.type === 'emi-calculator' && (
        <>
          <Field label="Loan principal (â‚¹)">
            <input
              type="number"
              min="10000"
              max="100000000"
              value={Number(c.principal)}
              onChange={(e) => update('principal', +e.target.value)}
            />
          </Field>
          <Field label="Annual interest (%)">
            <input
              type="number"
              min="1"
              max="36"
              step="0.1"
              value={Number(c.rate)}
              onChange={(e) => update('rate', +e.target.value)}
            />
          </Field>
          <Field label="Tenure (months)">
            <input
              type="number"
              min="1"
              max="360"
              value={Number(c.months)}
              onChange={(e) => update('months', +e.target.value)}
            />
          </Field>
        </>
      )}
      {block.type === 'sip-calculator' && (
        <>
          <Field label="Monthly investment (â‚¹)">
            <input
              type="number"
              min="500"
              max="1000000"
              value={Number(c.monthly)}
              onChange={(e) => update('monthly', +e.target.value)}
            />
          </Field>
          <Field label="Expected return (%)">
            <input
              type="number"
              min="1"
              max="30"
              step="0.5"
              value={Number(c.rate)}
              onChange={(e) => update('rate', +e.target.value)}
            />
          </Field>
          <Field label="Duration (years)">
            <input
              type="number"
              min="1"
              max="40"
              value={Number(c.years)}
              onChange={(e) => update('years', +e.target.value)}
            />
          </Field>
        </>
      )}
      {block.type === 'compound-interest' && (
        <>
          <Field label="Principal (â‚¹)">
            <input
              type="number"
              value={Number(c.principal)}
              onChange={(e) => update('principal', +e.target.value)}
            />
          </Field>
          <Field label="Annual rate (%)">
            <input
              type="number"
              value={Number(c.rate)}
              onChange={(e) => update('rate', +e.target.value)}
            />
          </Field>
          <Field label="Years">
            <input
              type="number"
              value={Number(c.years)}
              onChange={(e) => update('years', +e.target.value)}
            />
          </Field>
          <Field label="Compounding">
            <select
              value={Number(c.frequency)}
              onChange={(e) => update('frequency', +e.target.value)}
            >
              <option value="1">Annually</option>
              <option value="2">Half-yearly</option>
              <option value="4">Quarterly</option>
              <option value="12">Monthly</option>
            </select>
          </Field>
        </>
      )}
      {block.type === 'achievement-badge' && (
        <>
          <Field label="Badge title">
            <input value={String(c.title)} onChange={(e) => update('title', e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea
              value={String(c.description)}
              onChange={(e) => update('description', e.target.value)}
            />
          </Field>
          <Field label="Unlock condition">
            <input
              value={String(c.condition)}
              onChange={(e) => update('condition', e.target.value)}
            />
          </Field>
          <label className="check-setting">
            <input
              type="checkbox"
              checked={c.unlocked === true}
              onChange={(e) => update('unlocked', e.target.checked)}
            />{' '}
            Mark as unlocked
          </label>
        </>
      )}
      {block.type === 'concept-explainer' && (
        <>
          <Field label="Explainer title">
            <input value={String(c.title)} onChange={(e) => update('title', e.target.value)} />
          </Field>
          {((c.steps as { title: string; description: string }[]) ?? []).map((step, i) => (
            <div className="step-settings" key={i}>
              <b>Step {i + 1}</b>
              <input
                value={step.title}
                aria-label={`Step ${i + 1} title`}
                onChange={(e) =>
                  update(
                    'steps',
                    (c.steps as { title: string; description: string }[]).map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x,
                    ),
                  )
                }
              />
              <textarea
                value={step.description}
                aria-label={`Step ${i + 1} description`}
                onChange={(e) =>
                  update(
                    'steps',
                    (c.steps as { title: string; description: string }[]).map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
          <button
            className="text-button"
            onClick={() =>
              update(
                'steps',
                [
                  ...((c.steps as { title: string; description: string }[]) ?? []),
                  { title: 'New step', description: 'Describe this step' },
                ].slice(0, 10),
              )
            }
          >
            + Add step
          </button>
        </>
      )}
      {block.type.startsWith('quiz') && (
        <>
          <Field label="Points">
            <input
              type="number"
              min="0"
              value={Number(c.points ?? 10)}
              onChange={(e) => update('points', +e.target.value)}
            />
          </Field>
          <Field label="Attempt limit">
            <select
              value={Number(c.attemptLimit ?? 1)}
              onChange={(e) => update('attemptLimit', +e.target.value)}
            >
              <option value="1">1 attempt</option>
              <option value="2">2 attempts</option>
              <option value="3">3 attempts</option>
              <option value="0">Unlimited</option>
            </select>
          </Field>
          <Field label="Timer">
            <select value={Number(c.timer ?? 0)} onChange={(e) => update('timer', +e.target.value)}>
              <option value="0">No timer</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
              <option value="120">120 seconds</option>
            </select>
          </Field>
        </>
      )}
      {![
        'emi-calculator',
        'sip-calculator',
        'compound-interest',
        'achievement-badge',
        'concept-explainer',
      ].includes(block.type) &&
        !block.type.startsWith('quiz') && (
          <Field label="Block title">
            <input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} />
          </Field>
        )}
      <div className="advanced-settings">
        <button onClick={() => setAdvanced(!advanced)}>
          Advanced settings <ChevronDown size={14} />
        </button>
        {advanced && (
          <>
            <Field label="Custom CSS class">
              <input
                value={block.settings.customCss}
                onChange={(e) =>
                  onUpdate({ settings: { ...block.settings, customCss: e.target.value } })
                }
              />
            </Field>
            <label className="check-setting">
              <input
                type="checkbox"
                checked={block.settings.isVisible}
                onChange={() =>
                  onUpdate({
                    settings: { ...block.settings, isVisible: !block.settings.isVisible },
                  })
                }
              />{' '}
              Visible in learner preview
            </label>
          </>
        )}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="setting-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function PreviewBlock({ block }: { block: Block }) {
  const c = block.content;
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  switch (block.type) {
    case 'rich-text':
      return (
        <section className="learner-block">
          <h3>{String(c.heading || block.title)}</h3>
          <div
            className="learner-rich-html"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                String(
                  c.html ??
                    '<p>Explore this idea and reflect on how it applies to your financial goals.</p>',
                ),
              ),
            }}
          />
        </section>
      );
    case 'image':
      return (
        <figure className="learner-block">
          {c.url ? (
            <img
              src={String(c.url)}
              alt={String(c.alt)}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).alt = 'Image not found at provided URL';
              }}
            />
          ) : (
            <div className="image-placeholder">
              <ImageIcon />
              <span>Add an image URL in block settings</span>
            </div>
          )}
          <figcaption>{String(c.caption || c.alt || '')}</figcaption>
        </figure>
      );
    case 'video':
      return (
        <div className="video-preview">
          <Play size={25} />
          <span>Video lesson</span>
          <small>{String(c.url)}</small>
        </div>
      );
    case 'emi-calculator':
      return (
        <EmiCalculator
          principal={Number(block.content.principal ?? 500000)}
          rate={Number(block.content.rate ?? 8.5)}
          months={Number(block.content.months ?? 240)}
        />
      );

    case 'sip-calculator':
      return (
        <SipCalculator
          monthly={Number(block.content.monthly ?? 5000)}
          rate={Number(block.content.rate ?? 12)}
          years={Number(block.content.years ?? 10)}
        />
      );

    case 'compound-interest':
      return (
        <CompoundCalculator
          principal={Number(block.content.principal ?? 100000)}
          rate={Number(block.content.rate ?? 8)}
          years={Number(block.content.years ?? 10)}
          frequency={Number(block.content.frequency ?? 4) as 1 | 2 | 4 | 12}
        />
      );
    case 'quiz-mcq': {
      const options =
        (c.options as { text: string; isCorrect: boolean; explanation?: string }[]) ?? [];
      return (
        <div className="learner-quiz">
          <span className="eyebrow">KNOWLEDGE CHECK Â· {Number(c.points ?? 10)} POINTS</span>
          <h3>{String(c.question)}</h3>
          {options.map((o, i) => (
            <button
              key={i}
              disabled={submitted}
              className={`quiz-choice ${submitted && o.isCorrect ? 'correct' : ''} ${answer === i ? 'chosen' : ''}`}
              onClick={() => setAnswer(i)}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {o.text}
            </button>
          ))}
          <button
            className="btn btn-primary"
            disabled={answer === null || submitted}
            onClick={() => setSubmitted(true)}
          >
            Submit answer
          </button>
          {submitted && (
            <p className={options[answer ?? 0]?.isCorrect ? 'success-text' : 'error-text'}>
              {options[answer ?? 0]?.isCorrect ? 'Correct! ' : 'Not quite. '}
              {options[answer ?? 0]?.explanation}
            </p>
          )}
        </div>
      );
    }
    case 'quiz-true-false':
      return (
        <div className="learner-quiz">
          <span className="eyebrow">TRUE OR FALSE</span>
          <h3>{String(c.question)}</h3>
          <div className="tf-options">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                className={`quiz-choice ${answer === (v ? 1 : 0) ? 'chosen' : ''}`}
                disabled={submitted}
                onClick={() => setAnswer(v ? 1 : 0)}
              >
                {v ? 'True' : 'False'}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            disabled={answer === null || submitted}
            onClick={() => setSubmitted(true)}
          >
            Submit answer
          </button>
          {submitted && (
            <p className="success-text">
              {(answer === 1) === Boolean(c.answer) ? 'Correct! ' : 'Try again next time. '}
              {String(c.explanation)}
            </p>
          )}
        </div>
      );
    case 'callout':
      return (
        <div className={`learner-callout ${String(c.variant)}`}>
          <Lightbulb size={17} />
          <p>{String(c.text)}</p>
        </div>
      );
    case 'divider':
      return <hr className={`learner-divider ${String(c.style)}`} />;
    case 'accordion':
      return (
        <div className="learner-accordion">
          {((c.items as { title: string; body: string }[]) ?? []).map((x, i) => (
            <details key={i}>
              <summary>{x.title}</summary>
              <p>{x.body}</p>
            </details>
          ))}
        </div>
      );
    case 'progress-tracker': {
      const total = Math.max(2, Number(c.total));
      const current = Math.min(total, Math.max(1, Number(c.current)));
      return (
        <div className="learner-progress">
          <div>
            <b>Your learning journey</b>
            <span>
              Step {current} of {total}
            </span>
          </div>
          <div className="progress-track">
            <i style={{ width: `${(current / total) * 100}%` }} />
          </div>
          <div className="progress-labels">
            {((c.labels as string[]) ?? []).slice(0, total).map((x, i) => (
              <span key={i}>{x}</span>
            ))}
          </div>
        </div>
      );
    }
    case 'achievement-badge':
      return (
        <div className={`learner-badge ${c.unlocked ? 'unlocked' : ''}`}>
          <span>{String(c.icon ?? 'ðŸ†')}</span>
          <div>
            <b>{String(c.title)}</b>
            <p>{String(c.description)}</p>
            <small>
              {c.unlocked ? 'Achievement unlocked' : 'Complete the condition to unlock'}
            </small>
          </div>
        </div>
      );
    case 'code-snippet':
      return (
        <pre className="learner-code">
          <code>{String(c.code)}</code>
        </pre>
      );
    case 'concept-explainer': {
      const steps = (c.steps as { title: string; description: string }[]) ?? [];
      return (
        <div className="concept-card">
          <span className="eyebrow">STEP-BY-STEP EXPLAINER</span>
          <h3>{String(c.title)}</h3>
          <div className="concept-step">
            <span>{step + 1}</span>
            <div>
              <b>{steps[step]?.title}</b>
              <p>{steps[step]?.description}</p>
            </div>
          </div>
          <div className="concept-controls">
            <button disabled={step === 0} onClick={() => setStep(step - 1)}>
              Previous
            </button>
            <span>
              {step + 1} / {steps.length}
            </span>
            <button disabled={step >= steps.length - 1} onClick={() => setStep(step + 1)}>
              Next
            </button>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="tiny-icon" onClick={close}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export default App;
