import { useMemo, useState } from 'react';
import type { Kind, Workspace } from '../types';
import { KIND_LABEL, KIND_TO_COLLECTION } from '../types';
import { useWs } from '../store/store';
import { href, KIND_VIEW } from '../lib/router';
import { Button, Modal, StatusBadge } from './ui';

type AnyRec = { id: string; status?: import('../types').Status; [k: string]: unknown };

export function recordsOf(ws: Workspace, kind: Kind): AnyRec[] {
  return Object.values(ws[KIND_TO_COLLECTION[kind]] as unknown as Record<string, AnyRec>);
}
export function titleOf(rec: AnyRec | undefined | null): string {
  if (!rec) return 'missing record';
  const code = (rec.code as string) || '';
  const t = (rec.title as string) || (rec.name as string) || (rec.label as string) || rec.id;
  return code ? `${code} · ${t}` : t;
}
export function findRec(ws: Workspace, kind: Kind, id: string): AnyRec | undefined {
  return (ws[KIND_TO_COLLECTION[kind]] as unknown as Record<string, AnyRec>)[id];
}
export function kindOfId(id: string): Kind | null {
  const p: Record<string, Kind> = { dec: 'decision', iss: 'issue', spr: 'sprint', chr: 'character', ast: 'asset', ref: 'reference', lmk: 'landmark', zon: 'zone', sto: 'story', scn: 'scene', itr: 'iteration', clu: 'clue', rev: 'review', cmp: 'comparison', brf: 'brief', mea: 'measurement', src: 'source' };
  return p[id.split('_')[0]] ?? null;
}

export function entityHref(kind: Kind, id: string) { return href(KIND_VIEW[kind] ?? 'command', id); }

export function EntityLink({ kind, id, showStatus }: { kind: Kind; id: string; showStatus?: boolean }) {
  const ws = useWs();
  const rec = findRec(ws, kind, id);
  return (
    <a href={entityHref(kind, id)} className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded border border-line bg-cream px-1.5 py-0.5 text-[12.5px] hover:border-cocoa/60 ${rec ? '' : 'line-through opacity-60'}`}>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">{KIND_LABEL[kind]}</span>
      <span className="truncate">{titleOf(rec)}</span>
      {showStatus && rec?.status && <span className="shrink-0"><StatusBadge status={rec.status} small /></span>}
    </a>
  );
}

/** Records in the workspace that mention this id anywhere. */
export function backlinks(ws: Workspace, id: string): { kind: Kind; rec: AnyRec }[] {
  const out: { kind: Kind; rec: AnyRec }[] = [];
  const mentions = (o: unknown): boolean => {
    if (o === id) return true;
    if (Array.isArray(o)) return o.some(mentions);
    if (o && typeof o === 'object') return Object.entries(o).some(([k, v]) => k !== 'id' && mentions(v));
    return false;
  };
  for (const kind of Object.keys(KIND_TO_COLLECTION) as Kind[]) {
    for (const rec of recordsOf(ws, kind)) if (rec.id !== id && mentions(rec)) out.push({ kind, rec });
  }
  return out;
}

export function Backlinks({ id }: { id: string }) {
  const ws = useWs();
  const list = useMemo(() => backlinks(ws, id), [ws, id]);
  if (!list.length) return <p className="text-[12.5px] text-muted">Nothing links here yet.</p>;
  return <div className="flex flex-wrap gap-1.5">{list.map(({ kind, rec }) => <EntityLink key={rec.id} kind={kind} id={rec.id} showStatus />)}</div>;
}

/** Show linked ids of one kind, with add/remove. */
export function LinkList({ kind, ids, onChange, label, filter }: { kind: Kind; ids: string[]; onChange(ids: string[]): void; label: string; filter?(r: AnyRec): boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {ids.map((id) => (
          <span key={id} className="inline-flex min-w-0 max-w-full items-center gap-0.5">
            <EntityLink kind={kind} id={id} />
            <button aria-label={`Unlink ${id}`} className="px-1 text-muted hover:text-coral" onClick={() => onChange(ids.filter((x) => x !== id))}>×</button>
          </span>
        ))}
        <Button small kind="ghost" onClick={() => setOpen(true)}>+ Link {KIND_LABEL[kind].toLowerCase()}</Button>
      </div>
      <LinkPicker open={open} onClose={() => setOpen(false)} kind={kind} selected={ids} onChange={onChange} filter={filter} />
    </div>
  );
}

export function LinkPicker({ open, onClose, kind, selected, onChange, filter }: { open: boolean; onClose(): void; kind: Kind; selected: string[]; onChange(ids: string[]): void; filter?(r: AnyRec): boolean }) {
  const ws = useWs();
  const [q, setQ] = useState('');
  const recs = recordsOf(ws, kind).filter((r) => (!filter || filter(r)) && titleOf(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title={`Link ${KIND_LABEL[kind].toLowerCase()}`}>
      <input className="input mb-3" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search records" />
      <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
        {recs.length === 0 && <li className="text-[13px] text-muted">No {KIND_LABEL[kind].toLowerCase()} records match.</li>}
        {recs.slice(0, 300).map((r) => {
          const on = selected.includes(r.id);
          return (
            <li key={r.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-sand">
                <input type="checkbox" className="accent-[#C86D51]" checked={on} onChange={() => onChange(on ? selected.filter((x) => x !== r.id) : [...selected, r.id])} />
                <span className="flex-1 truncate text-[13px]">{titleOf(r)}</span>
                {r.status && <StatusBadge status={r.status} small />}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex justify-end"><Button kind="primary" onClick={onClose}>Done</Button></div>
    </Modal>
  );
}

/** Repo file paths (from the snapshot) with free entry. */
export function FileList({ value, onChange, label = 'Files involved' }: { value: string[]; onChange(v: string[]): void; label?: string }) {
  const [t, setT] = useState('');
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</span>
      <ul className="flex flex-col gap-1">
        {value.map((f) => (
          <li key={f} className="flex items-center gap-2 font-mono text-[12px]">
            <span className="truncate">{f}</span>
            <button aria-label={`Remove ${f}`} className="text-muted hover:text-coral" onClick={() => onChange(value.filter((x) => x !== f))}>×</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5">
        <input list="repo-files" className="input font-mono text-[12px]" placeholder="vibe-coding/src/…" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && t.trim()) { onChange([...new Set([...value, t.trim()])]); setT(''); } }} aria-label="Add file path" />
        <Button small onClick={() => { if (t.trim()) { onChange([...new Set([...value, t.trim()])]); setT(''); } }}>Add</Button>
      </div>
    </div>
  );
}
