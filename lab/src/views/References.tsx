import { useRef, useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Modal, PageHeader, Section, Select, Slider, StatusSelect, TagInput, Text, toast } from '../components/ui';
import { LinkList } from '../components/links';
import { ImageDrop, Img, useImageUrl } from '../components/images';
import { go, href, useRoute } from '../lib/router';
import { fmtDate, now, uid } from '../lib/util';
import { COLLECTIONS, type CollectionKey, type ImageRef, type Pin, type Reference } from '../types';

const COLLECTION_NOTES: Record<CollectionKey, string> = {
  A: 'Density, crowd variation, expressive posing, micro-stories and coherent hand-drawn composition. Study through legitimate copies and your own notes; do not upload scanned book spreads into anything that ships.',
  B: 'Historic architecture, squares, live oaks, fountains, riverfront details and local cultural activity. Your own photos are ideal.',
  C: 'Readable miniature figures, outfit differentiation, gestures, hair shapes, hats, glasses, accessories and silhouette clarity.',
  D: 'Trees, signs, buildings, streets, stalls, vehicles, fences and architecture.',
  E: 'Storybook navigation, art-director workspaces, annotation tools and comparison viewers.',
  F: 'Examples that feel too blocky, synthetic, generic, empty or repetitive. Repository screenshots of version 1 belong here.',
};

function blank(collection: CollectionKey, image: ImageRef | null, url: string | null, title: string): Reference {
  return { id: uid('ref'), createdAt: now(), updatedAt: now(), status: 'Tentative', source: url ?? (image?.kind === 'evidence' ? image.path : 'Uploaded file'), rationale: '', tags: [], title, collection, image, url, creator: null, license: image?.kind === 'evidence' ? 'Project-owned capture (repository)' : null, intendedUse: 'Study only', works: '', avoid: '', colorNotes: '', lineNotes: '', relevance: null, pinned: false, decisionIds: [], characterIds: [], sceneIds: [], pins: [], crop: null };
}

export default function References() {
  const ws = useWs();
  const route = useRoute();
  const [coll, setColl] = useState<CollectionKey | ''>('');
  const [tag, setTag] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState<CollectionKey>('A');
  const [cmp, setCmp] = useState<string[]>([]);
  const all = Object.values(ws.references);
  const tags = [...new Set(all.flatMap((r) => r.tags))].sort();
  const sel = route.id ? ws.references[route.id] : null;

  function add(refs: ImageRef[], files: File[]) {
    mutate('add references', (d) => { refs.forEach((r, i) => { const rec = blank(target, r, null, files[i]?.name.replace(/\.[a-z]+$/i, '') ?? 'Reference'); d.references[rec.id] = rec; logActivity(d, `Reference added to ${COLLECTIONS[target]}`, { kind: 'reference', id: rec.id }); }); });
    toast(`${refs.length} reference(s) added. Record source and rights for each.`);
  }
  function addUrl() {
    if (!/^https?:\/\//.test(url)) { toast('Paste a full http(s) URL'); return; }
    const rec = blank(target, null, url, new URL(url).hostname);
    mutate('add url reference', (d) => { d.references[rec.id] = rec; });
    setUrl(''); go('references', rec.id);
  }
  return (
    <div>
      <PageHeader eyebrow="Reference Studio" title="Visual reference board" lede="Collections start empty on purpose: the lab never invents reference images. Add your own photos, licensed images, or repository screenshots, and record where each came from.">
        {cmp.length === 2 && <Button kind="primary" onClick={() => go('references', null, { compare: cmp.join(',') })}>Compare selected</Button>}
      </PageHeader>
      <div className="mb-5 grid gap-3 rounded-lg border border-line bg-cream p-3 md:grid-cols-[14rem_1fr_1fr]">
        <Select label="Add to collection" value={target} onChange={(v) => setTarget(v as CollectionKey)} options={(Object.keys(COLLECTIONS) as CollectionKey[]).map((k) => ({ value: k, label: `${k}. ${COLLECTIONS[k]}` }))} />
        <ImageDrop multiple compact onAdd={add} label="Drop images, paste, or browse" />
        <div className="flex flex-col gap-1">
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Or paste a source URL</span>
          <div className="flex gap-1.5"><input aria-label="Reference URL" className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()} /><Button onClick={addUrl}>Add</Button></div>
          <span className="text-[11.5px] text-muted">The link is stored as-is. The lab does not download it.</span>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => setColl('')} className={`rounded-full border px-2.5 py-0.5 text-[12px] ${!coll ? 'border-cocoa bg-cocoa text-cream' : 'border-line bg-cream'}`}>All ({all.length})</button>
        {(Object.keys(COLLECTIONS) as CollectionKey[]).map((k) => <button key={k} onClick={() => setColl(k)} className={`rounded-full border px-2.5 py-0.5 text-[12px] ${coll === k ? 'border-cocoa bg-cocoa text-cream' : 'border-line bg-cream'}`}>{k}. {COLLECTIONS[k]} ({all.filter((r) => r.collection === k).length})</button>)}
        {tags.length > 0 && <select aria-label="Tag filter" className="input w-auto py-0.5 text-[12px]" value={tag} onChange={(e) => setTag(e.target.value)}><option value="">Any tag</option>{tags.map((t) => <option key={t}>{t}</option>)}</select>}
      </div>

      {all.some((r) => r.pinned) && (
        <Section title="Pinned" className="mb-5">
          <div className="flex gap-3 overflow-x-auto">{all.filter((r) => r.pinned).map((r) => <Card key={r.id} r={r} cmp={cmp} setCmp={setCmp} />)}</div>
        </Section>
      )}
      <div className="flex flex-col gap-6">
        {(Object.keys(COLLECTIONS) as CollectionKey[]).filter((k) => !coll || coll === k).map((k) => {
          const list = all.filter((r) => r.collection === k && (!tag || r.tags.includes(tag)));
          return (
            <section key={k} aria-labelledby={'col-' + k}>
              <div className="mb-2 flex items-baseline gap-3 border-b border-line pb-1.5">
                <h2 id={'col-' + k} className="font-display text-[19px]"><span className="text-terracotta">{k}.</span> {COLLECTIONS[k]}</h2>
                <span className="text-[12px] text-muted">{list.length}</span>
              </div>
              <p className="mb-3 max-w-3xl text-[12.5px] text-muted">{COLLECTION_NOTES[k]}</p>
              {list.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{list.map((r) => <Card key={r.id} r={r} cmp={cmp} setCmp={setCmp} />)}</div>
                : <p className="rounded-lg border border-dashed border-line px-4 py-5 text-center text-[12.5px] text-muted">No references yet. Choose collection {k} above and add one.</p>}
            </section>
          );
        })}
      </div>
      {sel && <RefViewer key={sel.id} r={sel} />}
      {route.q.get('compare') && <CompareRefs ids={route.q.get('compare')!.split(',')} />}
    </div>
  );
}

function Card({ r, cmp, setCmp }: { r: Reference; cmp: string[]; setCmp(v: string[]): void }) {
  const on = cmp.includes(r.id);
  return (
    <figure className={`group relative w-full min-w-[10rem] overflow-hidden rounded-lg border bg-cream ${on ? 'border-violet ring-1 ring-violet' : 'border-line'}`}>
      <a href={href('references', r.id)} className="block">
        {r.image ? <Img refx={r.image} alt={r.title} className="aspect-[4/3] w-full bg-sand" fit="cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-sand p-3 text-center text-[11.5px] text-muted">Link only<br />{r.url}</div>}
        <figcaption className="p-2">
          <p className="truncate text-[12.5px] font-medium">{r.title}</p>
          <p className="truncate text-[11px] text-muted">{r.license ? 'Rights: ' + r.license : 'Rights not recorded'}{r.relevance != null ? ` · relevance ${r.relevance}/5` : ''}</p>
        </figcaption>
      </a>
      <div className="absolute right-1 top-1 flex gap-1">
        <button aria-label={r.pinned ? 'Unpin' : 'Pin'} aria-pressed={r.pinned} onClick={() => mutate('pin', (d) => { d.references[r.id].pinned = !r.pinned; })} className={`rounded bg-cream/90 px-1.5 text-[13px] ${r.pinned ? 'text-terracotta' : 'text-muted opacity-0 group-hover:opacity-100 focus:opacity-100'}`}>★</button>
        <button aria-label="Select for comparison" aria-pressed={on} onClick={() => setCmp(on ? cmp.filter((x) => x !== r.id) : [...cmp.slice(-1), r.id])} className={`rounded bg-cream/90 px-1.5 text-[11px] ${on ? 'text-violet' : 'text-muted opacity-0 group-hover:opacity-100 focus:opacity-100'}`}>⇆</button>
      </div>
    </figure>
  );
}

function RefViewer({ r }: { r: Reference }) {
  const ws = useWs();
  const url = useImageUrl(r.image);
  const [zoom, setZoom] = useState(1);
  const [cropMode, setCropMode] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Reference>(k: K, v: Reference[K]) => mutate(`ref ${r.id} ${String(k)}`, (d) => { (d.references[r.id] as Reference)[k] = v; d.references[r.id].updatedAt = now(); });
  const frac = (e: React.PointerEvent) => { const b = box.current!.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }; };
  const close = () => go('references');

  function toDecision(text: string) {
    const id = uid('dec');
    mutate('observation to decision', (d) => {
      d.decisions[id] = { id, code: 'ADR-V' + String(Object.keys(d.decisions).length + 1).padStart(3, '0'), createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Reference: ' + r.title, tags: [], title: text.slice(0, 70) || 'Rule from reference ' + r.title, category: 'From reference', originalRule: '', proposedReplacement: text, rationale: `Observed in reference "${r.title}".`, evidence: `Reference ${r.title} (${r.source ?? 'unknown source'})`, evidenceType: 'Visual evidence', expectedVisual: '', expectedCost: '', compatibility: '', sourceRef: r.url ?? r.source ?? '', owner: d.project.owner, priority: 50, workflow: 'Proposed', lineage: 'experimental', currentApproved: null, supersedes: null, experimentOf: null, history: [{ at: now(), action: 'Created from reference', by: d.project.owner || 'Owner', note: r.title }], versions: [], relatedFiles: [], referenceIds: [r.id], assetIds: [], issueIds: [], sprintIds: [], tests: [] };
      d.references[r.id].decisionIds.push(id);
      logActivity(d, 'Observation moved into a design rule', { kind: 'decision', id });
    });
    go('rules', id);
  }
  function toIssue(text: string) {
    const id = uid('iss');
    mutate('observation to issue', (d) => {
      const n = Math.max(0, ...Object.values(d.issues).map((i) => Number(i.code.match(/\d+/)?.[0] ?? 0))) + 1;
      d.issues[id] = { id, code: 'VIS-' + String(n).padStart(3, '0'), createdAt: now(), updatedAt: now(), status: 'Needs research', source: 'Reference: ' + r.title, rationale: null, tags: [], title: text.slice(0, 70) || 'Issue from reference', description: text, category: 'From reference', severity: 'Minor', priority: Object.keys(d.issues).length + 1, stage: 'Backlog', reportedBy: d.project.owner || 'Owner', evidence: r.image ? [r.image] : [], assetIds: [], characterIds: [], sceneId: null, district: null, decisionIds: [], sprintIds: [], comparisonIds: [], rootCause: '', proposedChange: '', steps: '', codePaths: [], acceptance: '', testEvidence: '' };
      logActivity(d, 'Observation moved into an issue', { kind: 'issue', id });
    });
    go('issues', id);
  }
  async function del() { if (await confirmAction('Delete this reference?', 'Its links from decisions are removed too.', 'Delete')) { useLab.getState().remove('reference', r.id); close(); } }

  const crop = r.crop;
  return (
    <Modal open onClose={close} title={r.title} wide>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {[0.5, 1, 2, 3].map((z) => <Button key={z} small kind={zoom === z ? 'primary' : 'secondary'} onClick={() => setZoom(z)}>{z * 100}%</Button>)}
            <Button small kind={cropMode ? 'primary' : 'secondary'} onClick={() => setCropMode(!cropMode)}>{cropMode ? 'Drag to crop…' : 'Crop'}</Button>
            {crop && <Button small kind="ghost" onClick={() => set('crop', null)}>Clear crop</Button>}
            <span className="text-[11.5px] text-muted">{cropMode ? 'Drag a rectangle.' : 'Click the image to add an annotation pin.'}</span>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-line bg-sand">
            {url ? (
              <div ref={box} className="relative" style={{ width: `${zoom * 100}%`, cursor: cropMode ? 'crosshair' : 'copy' }}
                onPointerDown={(e) => { if (!cropMode) return; const p = frac(e); setDrag({ x: p.x, y: p.y, w: 0, h: 0 }); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
                onPointerMove={(e) => { if (!drag) return; const p = frac(e); setDrag({ ...drag, w: p.x - drag.x, h: p.y - drag.y }); }}
                onPointerUp={(e) => {
                  if (cropMode && drag) { const c = { x: Math.min(drag.x, drag.x + drag.w), y: Math.min(drag.y, drag.y + drag.h), w: Math.abs(drag.w), h: Math.abs(drag.h) }; if (c.w > 0.02 && c.h > 0.02) set('crop', c); setDrag(null); setCropMode(false); return; }
                  const p = frac(e); const text = prompt('Annotation'); if (text) set('pins', [...r.pins, { id: uid('pin'), x: p.x, y: p.y, text }]);
                }}>
                <img src={url} alt={r.title} className="block w-full select-none" draggable={false} />
                {crop && <div className="pointer-events-none absolute border-2 border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }} />}
                {drag && <div className="pointer-events-none absolute border-2 border-dashed border-gold" style={{ left: `${Math.min(drag.x, drag.x + drag.w) * 100}%`, top: `${Math.min(drag.y, drag.y + drag.h) * 100}%`, width: `${Math.abs(drag.w) * 100}%`, height: `${Math.abs(drag.h) * 100}%` }} />}
                {r.pins.map((p, i) => <PinMark key={p.id} p={p} n={i + 1} />)}
              </div>
            ) : <p className="p-6 text-center text-[13px] text-muted">{r.url ? <>Link reference: <a className="underline" href={r.url} target="_blank" rel="noreferrer noopener">{r.url}</a></> : 'No image.'}</p>}
          </div>
          {r.pins.length > 0 && (
            <ol className="mt-3 flex flex-col gap-1.5">
              {r.pins.map((p, i) => (
                <li key={p.id} className="flex items-start gap-2 text-[13px]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[11px] font-bold">{i + 1}</span>
                  <span className="flex-1">{p.text}</span>
                  <Button small kind="ghost" onClick={() => toDecision(p.text)}>→ Rule</Button>
                  <Button small kind="ghost" onClick={() => toIssue(p.text)}>→ Issue</Button>
                  <button aria-label="Delete pin" className="text-muted hover:text-coral" onClick={() => set('pins', r.pins.filter((x) => x.id !== p.id))}>×</button>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Text label="Title" value={r.title} onChange={(v) => set('title', v)} />
          <Select label="Collection" value={r.collection} onChange={(v) => set('collection', v)} options={(Object.keys(COLLECTIONS) as CollectionKey[]).map((k) => ({ value: k, label: `${k}. ${COLLECTIONS[k]}` }))} />
          <Text label="Creator or publisher" value={r.creator} onChange={(v) => set('creator', v)} />
          <Text label="Copyright / usage rights" value={r.license} onChange={(v) => set('license', v)} hint="Required before anything derived from it ships." />
          <Text label="Source URL" value={r.url} onChange={(v) => set('url', v || null)} />
          <Text label="Intended use" value={r.intendedUse} onChange={(v) => set('intendedUse', v)} />
          <Area label="What works visually" value={r.works} onChange={(v) => set('works', v)} />
          <Area label="What to avoid" value={r.avoid} onChange={(v) => set('avoid', v)} />
          <Area label="Colour observations" value={r.colorNotes} onChange={(v) => set('colorNotes', v)} rows={2} />
          <Area label="Line-work observations" value={r.lineNotes} onChange={(v) => set('lineNotes', v)} rows={2} />
          <Area label="Rationale" value={r.rationale} onChange={(v) => set('rationale', v)} rows={2} />
          <Slider label="Relevance" min={0} max={5} step={1} value={r.relevance ?? 0} onChange={(v) => set('relevance', v)} format={(v) => (r.relevance == null ? 'unset' : v + '/5')} />
          <TagInput label="Tags" value={r.tags} onChange={(v) => set('tags', v)} />
          <StatusSelect value={r.status} onChange={(v) => set('status', v)} label="Confidence / status" />
          <LinkList kind="decision" label="Applicable design rules" ids={r.decisionIds} onChange={(v) => set('decisionIds', v)} />
          <LinkList kind="character" label="Linked characters" ids={r.characterIds} onChange={(v) => set('characterIds', v)} />
          <LinkList kind="scene" label="Linked scenes" ids={r.sceneIds} onChange={(v) => set('sceneIds', v)} />
          <div className="flex flex-wrap gap-1.5">
            <Button small onClick={() => toDecision(r.works || r.title)}>New rule from this</Button>
            <Button small onClick={() => toIssue(r.avoid || r.title)}>New issue from this</Button>
            <Button small kind="danger" onClick={del}>Delete</Button>
          </div>
          <p className="text-[11.5px] text-muted">Source: {r.source ?? 'unknown'} · updated {fmtDate(r.updatedAt)} · {ws.project.owner || 'owner not set'}</p>
        </div>
      </div>
    </Modal>
  );
}

function PinMark({ p, n }: { p: Pin; n: number }) {
  return <span title={p.text} className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gold text-[11px] font-bold text-cocoa shadow" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>{n}</span>;
}

function CompareRefs({ ids }: { ids: string[] }) {
  const ws = useWs();
  const rs = ids.map((id) => ws.references[id]).filter(Boolean);
  return (
    <Modal open onClose={() => go('references')} title="Side-by-side references" wide>
      <div className="grid gap-3 md:grid-cols-2">
        {rs.map((r) => (
          <figure key={r.id} className="flex flex-col gap-2">
            <Img refx={r.image} alt={r.title} className="max-h-[55vh] w-full rounded bg-sand" />
            <figcaption className="text-[13px]"><b>{r.title}</b><br /><span className="text-muted">Works: {r.works || '—'} · Avoid: {r.avoid || '—'}</span></figcaption>
          </figure>
        ))}
      </div>
    </Modal>
  );
}
