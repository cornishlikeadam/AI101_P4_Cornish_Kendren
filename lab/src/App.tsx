import { Fragment, lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useLab, useWs } from './store/store';
import { go, href, useRoute } from './lib/router';
import { ConfirmHost, Modal, ToastHost } from './components/ui';
import { snapshot } from './seed/snapshot';
import { fmtTime } from './lib/util';
import { SearchDialog } from './components/search';

const V = (f: () => Promise<{ default: ComponentType }>) => lazy(f);
export const NAV: { group: string; items: { id: string; label: string; key?: string; C: ComponentType }[] }[] = [
  { group: 'Overview', items: [
    { id: 'command', label: 'Command Center', key: '1', C: V(() => import('./views/CommandCenter')) },
    { id: 'audit', label: 'Project Audit', key: '2', C: V(() => import('./views/Audit')) },
  ] },
  { group: 'Direction', items: [
    { id: 'references', label: 'Reference Studio', key: '3', C: V(() => import('./views/References')) },
    { id: 'rules', label: 'Design Rules', key: '4', C: V(() => import('./views/Rules')) },
  ] },
  { group: 'Workbenches', items: [
    { id: 'characters', label: 'Character Workshop', key: '5', C: V(() => import('./views/Characters')) },
    { id: 'composer', label: 'Scene Composer', key: '6', C: V(() => import('./views/Composer')) },
    { id: 'atlas', label: 'Savannah Atlas', key: '7', C: V(() => import('./views/Atlas')) },
    { id: 'clues', label: 'Clue & Difficulty Lab', key: '8', C: V(() => import('./views/Clues')) },
    { id: 'assets', label: 'Asset Library', key: '9', C: V(() => import('./views/Assets')) },
  ] },
  { group: 'Evaluate', items: [
    { id: 'compare', label: 'Comparison Studio', C: V(() => import('./views/Compare')) },
    { id: 'quality', label: 'Quality Control', C: V(() => import('./views/Quality')) },
    { id: 'issues', label: 'Issue Tracker', C: V(() => import('./views/Issues')) },
  ] },
  { group: 'Deliver', items: [
    { id: 'sprints', label: 'Build Sprints', C: V(() => import('./views/Sprints')) },
    { id: 'demo', label: 'Demo Theater', C: V(() => import('./views/Demo')) },
    { id: 'export', label: 'Export Center', C: V(() => import('./views/Export')) },
  ] },
];
const FLAT = NAV.flatMap((g) => g.items);

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

export default function App() {
  const route = useRoute();
  const ready = useLab((s) => s.ready);
  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [help, setHelp] = useState(false);
  const item = FLAT.find((i) => i.id === route.view) ?? FLAT[0];

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); return; }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) useLab.getState().redo(); else useLab.getState().undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); useLab.getState().redo(); return; }
      if (mod || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); setSearch(true); }
      else if (e.key === '?') setHelp(true);
      else if (e.key === '[' || e.key === ']') {
        const i = FLAT.findIndex((x) => x.id === item.id);
        go(FLAT[(i + (e.key === ']' ? 1 : -1) + FLAT.length) % FLAT.length].id);
      } else { const t = FLAT.find((x) => x.key === e.key); if (t && route.view !== 'demo') go(t.id); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [item.id, route.view]);

  useEffect(() => { setNavOpen(false); window.scrollTo(0, 0); }, [route.view]);
  useEffect(() => { document.title = `${item.label} · Waldo's Savannah Build Lab`; }, [item.label]);

  const fileOptions = useMemo(() => [...new Set([...(snapshot.sourceFiles ?? []).map((f) => f.path), ...(snapshot.docs ?? []).map((d) => d.path), ...(snapshot.assets ?? []).map((a) => a.file)])], []);

  if (route.view === 'demo') {
    return (<><Suspense fallback={<Loading />}><item.C /></Suspense><ConfirmHost /><ToastHost /></>);
  }

  return (
    <div className="flex min-h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-cocoa focus:px-3 focus:py-2 focus:text-cream">Skip to content</a>
      <aside className={`no-print fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-line bg-cream transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${navOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <a href={href('command')} className="block border-b border-line px-5 py-4">
            <p className="font-display text-[19px] leading-tight">Waldo's Savannah</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">Art Direction & Build Lab</p>
          </a>
          <nav aria-label="Lab sections" className="flex-1 overflow-y-auto px-3 py-3">
            {NAV.map((g) => (
              <div key={g.group} className="mb-3">
                <p className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{g.group}</p>
                {g.items.map((i) => {
                  const active = i.id === item.id;
                  return (
                    <a key={i.id} href={href(i.id)} aria-current={active ? 'page' : undefined}
                      className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-[13.5px] ${active ? 'bg-cocoa text-cream' : 'hover:bg-sand'}`}>
                      <span>{i.label}</span>
                      {i.key && <kbd className={`font-mono text-[10px] ${active ? 'text-cream/60' : 'text-muted/70'}`}>{i.key}</kbd>}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
          <RepoFooter />
        </div>
      </aside>
      {navOpen && <div className="fixed inset-0 z-30 bg-cocoa/30 lg:hidden" onClick={() => setNavOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setNavOpen(true)} onSearch={() => setSearch(true)} onHelp={() => setHelp(true)} />
        <main id="main" className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 md:px-7">
          {!ready ? <Loading /> : <Suspense fallback={<Loading />}><item.C key={item.id} /></Suspense>}
        </main>
      </div>
      <datalist id="repo-files">{fileOptions.map((f) => <option key={f} value={f} />)}</datalist>
      <SearchDialog open={search} onClose={() => setSearch(false)} />
      <HelpDialog open={help} onClose={() => setHelp(false)} />
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}

function Loading() { return <div className="flex h-48 items-center justify-center text-[13px] text-muted">Loading…</div>; }

function TopBar({ onMenu, onSearch, onHelp }: { onMenu(): void; onSearch(): void; onHelp(): void }) {
  const save = useLab((s) => s.save), savedAt = useLab((s) => s.savedAt), saveError = useLab((s) => s.saveError);
  const past = useLab((s) => s.past.length), future = useLab((s) => s.future.length);
  const ws = useWs();
  const label = { loading: 'Loading…', saved: `Saved ${savedAt ? fmtTime(savedAt) : 'in this browser'}`, saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Not saving' }[save];
  return (
    <div className="no-print sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-line bg-sand/90 px-3 backdrop-blur md:px-5">
      <button className="rounded p-1.5 lg:hidden" aria-label="Open navigation" onClick={onMenu}>☰</button>
      <button onClick={onSearch} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-cream px-2.5 text-left text-[13px] text-muted hover:border-cocoa/40 md:max-w-md">
        <span aria-hidden>⌕</span><span className="truncate">Search decisions, issues, assets, docs…</span><kbd className="ml-auto hidden font-mono text-[10.5px] sm:inline">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <button className="rounded px-2 py-1 text-[13px] disabled:opacity-30 hover:bg-cream" disabled={!past} onClick={() => useLab.getState().undo()} title="Undo (⌘Z)" aria-label="Undo">↶</button>
        <button className="rounded px-2 py-1 text-[13px] disabled:opacity-30 hover:bg-cream" disabled={!future} onClick={() => useLab.getState().redo()} title="Redo (⇧⌘Z)" aria-label="Redo">↷</button>
        <span title={saveError ?? 'Autosaves to IndexedDB in this browser'} className={`hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] sm:inline-flex ${save === 'error' ? 'bg-coral text-white' : 'text-muted'}`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${save === 'saved' ? 'bg-moss' : save === 'error' ? 'bg-white' : 'bg-gold'}`} />{label}
        </span>
        <span className="hidden text-[11.5px] text-muted xl:inline">· {ws.project.owner ? `Owner: ${ws.project.owner}` : 'Owner not set'}</span>
        <button className="rounded px-2 py-1 text-[13px] hover:bg-cream" onClick={onHelp} aria-label="Keyboard shortcuts">?</button>
      </div>
    </div>
  );
}

function RepoFooter() {
  const g = snapshot.git;
  return (
    <div className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-muted">
      {snapshot.available ? (
        <>
          <p>Repo snapshot <span className="font-mono">{g?.head ?? '?'}</span>{g?.dirty ? ' (uncommitted changes)' : ''}</p>
          <p className="truncate" title={g?.subject ?? ''}>{g?.branch} · read {fmtTime(snapshot.generatedAt)}</p>
          <p>Read-only. The lab never writes to the game.</p>
        </>
      ) : <p>No repository snapshot. Use Project Audit → Import.</p>}
    </div>
  );
}

function HelpDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const rows: [string, string][] = [['⌘K or /', 'Search everything'], ['1 – 9', 'Jump to a section'], ['[ and ]', 'Previous or next section'], ['⌘Z / ⇧⌘Z', 'Undo / redo workspace edits'], ['?', 'This help'], ['Esc', 'Close dialogs and presentation'], ['← →', 'Demo Theater slides'], ['F', 'Demo Theater fullscreen']];
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-[13.5px]">{rows.map(([k, v]) => <Fragment key={k}><dt><kbd className="rounded border border-line bg-sand px-1.5 font-mono text-[12px]">{k}</kbd></dt><dd>{v}</dd></Fragment>)}</dl>
      <p className="mt-4 text-[12.5px] text-muted">Everything you edit is saved automatically in this browser (IndexedDB). Use Export Center → Workspace backup to move it to another machine.</p>
    </Modal>
  );
}
