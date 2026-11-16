import { useMemo, useState } from 'react';
import type { Kind } from '../types';
import { KIND_LABEL, KIND_TO_COLLECTION } from '../types';
import { useWs } from '../store/store';
import { snapshot } from '../seed/snapshot';
import { href } from '../lib/router';
import { entityHref, recordsOf, titleOf } from './links';
import { Modal, StatusBadge } from './ui';

interface Hit { key: string; label: string; sub: string; to: string; status?: import('../types').Status }

export function SearchDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const ws = useWs();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const hits = useMemo<Hit[]>(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: Hit[] = [];
    for (const kind of Object.keys(KIND_TO_COLLECTION) as Kind[]) {
      if (kind === 'source') continue;
      for (const r of recordsOf(ws, kind)) {
        const hay = JSON.stringify(r).toLowerCase();
        if (hay.includes(s)) out.push({ key: kind + r.id, label: titleOf(r), sub: KIND_LABEL[kind], to: entityHref(kind, r.id), status: r.status });
      }
    }
    for (const d of snapshot.docs ?? []) {
      const i = d.text.toLowerCase().indexOf(s);
      if (i >= 0 || d.path.toLowerCase().includes(s)) {
        const line = i >= 0 ? d.text.slice(0, i).split('\n').length : 1;
        const excerpt = i >= 0 ? d.text.slice(Math.max(0, i - 40), i + 80).replace(/\s+/g, ' ') : d.title;
        out.push({ key: 'doc' + d.path, label: d.path.replace(/^vibe-coding\//, '') + (i >= 0 ? `:${line}` : ''), sub: 'Repo document · ' + excerpt, to: href('audit', null, { doc: d.path, line: String(line) }) });
      }
    }
    return out.slice(0, 60);
  }, [q, ws]);

  const pick = (h: Hit) => { location.hash = h.to; onClose(); setQ(''); };
  return (
    <Modal open={open} onClose={onClose} title="Search the lab and the repository" wide>
      <input autoFocus className="input mb-3 text-[15px]" placeholder="Type at least two characters…" value={q} aria-label="Search"
        onChange={(e) => { setQ(e.target.value); setSel(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((x) => Math.min(hits.length - 1, x + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((x) => Math.max(0, x - 1)); }
          else if (e.key === 'Enter' && hits[sel]) pick(hits[sel]);
        }} />
      <ul role="listbox" aria-label="Results" className="flex flex-col gap-0.5">
        {q.trim().length >= 2 && !hits.length && <li className="px-2 py-4 text-[13px] text-muted">No matches in workspace records or repository documents.</li>}
        {hits.map((h, i) => (
          <li key={h.key} role="option" aria-selected={i === sel}>
            <button onMouseEnter={() => setSel(i)} onClick={() => pick(h)} className={`flex w-full items-center gap-3 rounded px-2 py-1.5 text-left ${i === sel ? 'bg-sand' : ''}`}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px]">{h.label}</span>
                <span className="block truncate text-[11.5px] text-muted">{h.sub}</span>
              </span>
              {h.status && <StatusBadge status={h.status} small />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
