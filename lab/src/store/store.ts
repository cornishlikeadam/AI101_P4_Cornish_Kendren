/* One store for the whole lab. Every edit goes through mutate(), which gives undo/redo, an updatedAt stamp
   and autosave to IndexedDB. Removing a record also unlinks it everywhere, so no view keeps a dangling id. */
import { create } from 'zustand';
import { produce, type Draft } from 'immer';
import type { Kind, Workspace } from '../types';
import { KIND_TO_COLLECTION } from '../types';
import { loadWorkspace, saveWorkspace } from '../lib/db';
import { initialWorkspace, mergeSnapshot } from '../seed/seed';
import { snapshot } from '../seed/snapshot';
import { now } from '../lib/util';

type SaveState = 'loading' | 'saved' | 'saving' | 'error' | 'unsaved';

interface LabState {
  ws: Workspace;
  ready: boolean;
  save: SaveState;
  savedAt: string | null;
  saveError: string | null;
  past: Workspace[];
  future: Workspace[];
  lastLabel: string | null;
  lastAt: number;
  init(): Promise<void>;
  mutate(label: string, fn: (d: Draft<Workspace>) => void): void;
  undo(): void;
  redo(): void;
  replace(ws: Workspace, label: string): void;
  remove(kind: Kind, id: string): void;
}

const HISTORY = 80;

export const useLab = create<LabState>((set, get) => ({
  ws: initialWorkspace(snapshot),
  ready: false,
  save: 'loading',
  savedAt: null,
  saveError: null,
  past: [],
  future: [],
  lastLabel: null,
  lastAt: 0,

  async init() {
    try {
      const stored = await loadWorkspace();
      const ws = stored ? produce(stored, (d) => { mergeSnapshot(d as Workspace, snapshot); }) : initialWorkspace(snapshot);
      set({ ws, ready: true, save: stored ? 'saved' : 'unsaved' });
      if (!stored) await saveWorkspace(ws).then(() => set({ save: 'saved', savedAt: now() }));
    } catch (e) {
      // IndexedDB blocked (private mode, policy): the lab still works for this session and says so.
      set({ ready: true, save: 'error', saveError: 'Browser storage is unavailable, so changes will not survive a reload. ' + String(e) });
    }
  },

  mutate(label, fn) {
    const { ws, past, lastLabel, lastAt } = get();
    const next = produce(ws, fn);
    if (next === ws) return;
    const t = Date.now();
    // Typing in one field coalesces into one undo step.
    const coalesce = label === lastLabel && t - lastAt < 1200;
    set({ ws: next, past: coalesce ? past : [...past.slice(-HISTORY + 1), ws], future: [], lastLabel: label, lastAt: t, save: 'unsaved' });
  },

  undo() {
    const { past, ws, future } = get();
    if (!past.length) return;
    set({ ws: past[past.length - 1], past: past.slice(0, -1), future: [ws, ...future].slice(0, HISTORY), lastLabel: null, save: 'unsaved' });
  },
  redo() {
    const { past, ws, future } = get();
    if (!future.length) return;
    set({ ws: future[0], future: future.slice(1), past: [...past, ws].slice(-HISTORY), lastLabel: null, save: 'unsaved' });
  },
  replace(ws, label) {
    const cur = get().ws;
    set({ ws, past: [...get().past, cur].slice(-HISTORY), future: [], lastLabel: label, save: 'unsaved' });
  },

  remove(kind, id) {
    get().mutate('remove ' + kind, (d) => {
      const coll = d[KIND_TO_COLLECTION[kind]] as Record<string, unknown>;
      delete coll[id];
      unlink(d as Workspace, id);
      d.activity.unshift({ at: now(), text: `Deleted ${kind} ${id}` });
    });
  },
}));

/** Drop an id from every string array and nullable id field in the workspace. */
function unlink(ws: Workspace, id: string) {
  const visit = (o: unknown) => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        if (v.length && typeof v[0] === 'string') (o as Record<string, unknown>)[k] = v.filter((x) => x !== id);
        else v.forEach(visit);
      } else if (v === id && /Id$|^supersedes$|^experimentOf$|^replaces$/.test(k)) (o as Record<string, unknown>)[k] = null;
      else if (v && typeof v === 'object') visit(v);
    }
  };
  for (const key of Object.values(KIND_TO_COLLECTION)) for (const rec of Object.values(ws[key] as Record<string, unknown>)) visit(rec);
  if (ws.project.currentChallenge?.id === id) ws.project.currentChallenge = null;
}

// ---------- autosave ----------
let timer: ReturnType<typeof setTimeout> | null = null;
useLab.subscribe((s, prev) => {
  if (!s.ready || s.ws === prev.ws || s.save === 'error') return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    useLab.setState({ save: 'saving' });
    try {
      await saveWorkspace(useLab.getState().ws);
      useLab.setState({ save: 'saved', savedAt: now(), saveError: null });
    } catch (e) {
      useLab.setState({ save: 'error', saveError: String(e) });
    }
  }, 350);
});

// Convenience selectors
export const useWs = () => useLab((s) => s.ws);
export const mutate = (label: string, fn: (d: Draft<Workspace>) => void) => useLab.getState().mutate(label, fn);

/** Stamp updatedAt on a record inside a mutate() callback. */
export function touch<T extends { updatedAt: string }>(rec: T) { rec.updatedAt = now(); return rec; }

export function logActivity(d: Draft<Workspace>, text: string, ref?: { kind: Kind; id: string }) {
  d.activity.unshift({ at: now(), text, ref });
  if (d.activity.length > 300) d.activity.length = 300;
}
