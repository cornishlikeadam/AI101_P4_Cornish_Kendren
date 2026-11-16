import { useMemo, useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, Kv, Num, PageHeader, Section, Select, StatusSelect, TagInput, Text } from '../components/ui';
import { Backlinks, LinkList } from '../components/links';
import { ImageDrop, Img } from '../components/images';
import { BACKGROUNDS, Backdrop, RuntimeError, Sprite, useRuntime } from '../components/sprites';
import { entitySvg, type Runtime } from '../lib/runtime';
import { go, href, useRoute } from '../lib/router';
import { fmtDate, now, uid } from '../lib/util';
import { repoAsset } from '../seed/snapshot';
import { reviewResult } from '../lib/readiness';
import { ASSET_STAGES, type Asset, type AssetStage } from '../types';

const STAGE_STYLE: Record<AssetStage, string> = {
  'Repo current': 'border-line text-muted', Placeholder: 'border-dashed border-violet/60 text-violet', Candidate: 'border-gold bg-gold/15 text-cocoa',
  'Approved production': 'border-moss bg-moss text-cream', Redesign: 'border-terracotta bg-terracotta/10 text-terracotta', Discard: 'border-[#B3261E] text-[#B3261E] line-through',
};
const CATS = ['Characters', 'Character parts', 'Clothing', 'Accessories', 'Architectural elements', 'Street furniture', 'Trees and plants', 'Vehicles', 'Festival props', 'Signage', 'Background elements', 'Interactive clues', 'Effects'];
function catLabel(c: string) {
  const map: Record<string, string> = { 'characters/archetypes': 'Characters', 'characters/bodies': 'Characters', 'characters/parts': 'Character parts', 'environments/forsyth': 'Architectural elements', 'environments/riverfront': 'Architectural elements', 'environments/market': 'Architectural elements', 'environments/squares': 'Architectural elements', 'environments/savannah': 'Background elements', 'props/furniture': 'Street furniture', 'props/vegetation': 'Trees and plants', 'props/vehicles': 'Vehicles', 'props/river': 'Vehicles', 'props/festival': 'Festival props', 'props/market': 'Festival props', 'props/landmarks': 'Architectural elements', 'props/animals': 'Interactive clues', 'props/food': 'Street furniture', effects: 'Effects' };
  return map[c] ?? map[c.split('/')[0]] ?? c;
}
export function StageBadge({ stage }: { stage: AssetStage }) { return <span className={`inline-flex rounded border px-1.5 text-[11px] font-medium ${STAGE_STYLE[stage]}`}>{stage}</span>; }

export function AssetThumb({ a, rt, height = 88, bg = 'checker' }: { a: Asset; rt: Runtime | null; height?: number; bg?: string }) {
  const svg = useMemo(() => { if (!rt || !a.repoId) return null; try { return entitySvg(rt, { asset: a.repoId }); } catch { return null; } }, [rt, a.repoId]);
  const meta = rt && a.repoId ? rt.assets.meta[a.repoId] : null;
  if (a.origin === 'upload') return <Img refx={a.image} alt={a.title} className="checker h-full w-full" />;
  if (!meta || !svg) return <div className="h-full w-full animate-pulse bg-sand" />;
  const big = meta.viewBox[2] > meta.viewBox[3] * 2.2;
  return <Backdrop bg={bg} className="flex h-full w-full items-end justify-center overflow-hidden"><Sprite svg={svg} height={big ? Math.min(height, (meta.viewBox[3] / meta.viewBox[2]) * 300) : height} title={a.title} /></Backdrop>;
}

export default function Assets() {
  const ws = useWs();
  const route = useRoute();
  const { rt, err } = useRuntime();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stage, setStage] = useState('');
  const [origin, setOrigin] = useState('');
  const [tag, setTag] = useState('');
  const all = Object.values(ws.assets);
  const tags = [...new Set(all.flatMap((a) => a.tags))].sort();
  const shown = all.filter((a) => (!q || (a.title + a.id + a.description + a.tags.join(' ')).toLowerCase().includes(q.toLowerCase())) && (!cat || catLabel(a.category) === cat) && (!stage || a.stage === stage) && (!origin || a.origin === origin) && (!tag || a.tags.includes(tag)))
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  const sel = route.id ? ws.assets[route.id] : null;

  function upload(refs: NonNullable<Asset['image']>[], files: File[]) {
    let first = '';
    mutate('upload asset', (d) => {
      refs.forEach((r, i) => {
        const id = uid('ast'); first ||= id;
        d.assets[id] = { id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Uploaded by ' + (d.project.owner || 'owner'), rationale: null, tags: [], title: files[i].name.replace(/\.[a-z]+$/i, ''), category: 'characters/uploads', origin: 'upload', repoId: null, image: r, file: null, creator: null, license: null, version: 1, description: '', stage: 'Candidate', dims: null, renderScale: null, landmarkIds: [], characterIds: [], palette: [], animation: '', implNotes: '', knownIssues: '', replaces: null };
        logActivity(d, `Uploaded asset ${files[i].name}`, { kind: 'asset', id });
      });
    });
    if (first) go('assets', first);
  }

  return (
    <div>
      <PageHeader eyebrow="Asset Library" title="Every visual component, with provenance" lede={<>{all.filter((a) => a.origin === 'repo').length} drawings from <span className="font-mono">vibe-coding/assets/</span>, rendered from the packed bundle the game loads. Uploads stay in this browser until someone adds them to the repository and the asset register.</>} />
      {err && <RuntimeError err={err} />}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <input aria-label="Search assets" className="input w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Category" className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Stage" className="input w-auto" value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{ASSET_STAGES.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Origin" className="input w-auto" value={origin} onChange={(e) => setOrigin(e.target.value)}><option value="">Repo and uploads</option><option value="repo">Repository</option><option value="upload">Uploads</option></select>
        {tags.length > 0 && <select aria-label="Tag" className="input w-auto" value={tag} onChange={(e) => setTag(e.target.value)}><option value="">Any tag</option>{tags.map((c) => <option key={c}>{c}</option>)}</select>}
        <span className="text-[12px] text-muted">{shown.length} shown</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6">
            <li className="col-span-2 sm:col-span-1"><ImageDrop multiple label="Upload asset" onAdd={upload} /></li>
            {shown.map((a) => (
              <li key={a.id}>
                <a href={href('assets', a.id)} className={`flex h-full flex-col overflow-hidden rounded-lg border bg-cream ${sel?.id === a.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}>
                  <div className="h-28"><AssetThumb a={a} rt={rt} /></div>
                  <div className="flex flex-1 flex-col gap-1 border-t border-line p-2">
                    <p className="truncate text-[12.5px] font-medium" title={a.title}>{a.title}</p>
                    <p className="truncate font-mono text-[10.5px] text-muted">{a.repoId ?? 'upload'}</p>
                    <div className="mt-auto flex flex-wrap gap-1"><StageBadge stage={a.stage} /></div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          {!shown.length && <Empty title="No assets match these filters" />}
        </div>
        {sel ? <AssetDetail key={sel.id} a={sel} rt={rt} /> : <div className="hidden xl:block"><Empty title="Select an asset">Each asset card records its source, licence, version, render scale and known issues. A placeholder and an approved production asset are labelled differently.</Empty></div>}
      </div>
    </div>
  );
}

function AssetDetail({ a, rt }: { a: Asset; rt: Runtime | null }) {
  const ws = useWs();
  const [bg, setBg] = useState('checker');
  const r = a.repoId ? repoAsset(a.repoId) : null;
  const meta = rt && a.repoId ? rt.assets.meta[a.repoId] : null;
  const set = <K extends keyof Asset>(k: K, v: Asset[K]) => mutate(`asset ${a.id} ${String(k)}`, (d) => { (d.assets[a.id] as Asset)[k] = v; d.assets[a.id].updatedAt = now(); });
  const reviews = Object.values(ws.reviews).filter((x) => x.subject.id === a.id);
  async function duplicate() {
    const id = uid('ast');
    mutate('duplicate asset', (d) => { d.assets[id] = { ...JSON.parse(JSON.stringify(d.assets[a.id])), id, title: a.title + ' (copy)', origin: a.origin, stage: 'Placeholder', version: 1, createdAt: now(), updatedAt: now(), replaces: null }; });
    go('assets', id);
  }
  async function del() {
    if (a.origin === 'repo') return;
    if (!(await confirmAction('Delete this upload?', 'The record is removed from the lab. The stored image stays in browser storage until you clear the workspace.', 'Delete'))) return;
    useLab.getState().remove('asset', a.id); go('assets');
  }
  return (
    <aside className="flex flex-col gap-4 xl:sticky xl:top-16 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto">
      <Section title={a.title} actions={<StageBadge stage={a.stage} />}>
        <div className="mb-2 flex justify-end"><select aria-label="Preview background" className="input w-auto py-0.5 text-[12px]" value={bg} onChange={(e) => setBg(e.target.value)}>{Object.entries(BACKGROUNDS).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}</select></div>
        <div className="h-64 overflow-hidden rounded-lg border border-line"><AssetThumb a={a} rt={rt} height={230} bg={bg} /></div>
        {meta && meta.head && <p className="mt-1.5 text-[11.5px] text-muted">Head assembled from the drawing's default kit ({meta.kit ?? 'none'}).</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button small onClick={() => set('stage', 'Redesign')}>Flag for redesign</Button>
          <Button small onClick={() => set('stage', 'Discard')}>Flag to discard</Button>
          <a className="inline-flex h-7 items-center rounded-md border border-line px-2 text-[12px] hover:border-cocoa/50" href={href('quality', null, { subject: 'asset:' + a.id })}>Quality review</a>
          <Button small onClick={duplicate}>Duplicate</Button>
          {a.origin === 'upload' && <Button small kind="danger" onClick={del}>Delete</Button>}
        </div>
      </Section>
      <Section title="Card">
        <div className="flex flex-col gap-3">
          <Text label="Title" value={a.title} onChange={(v) => set('title', v)} />
          <div className="grid grid-cols-2 gap-2">
            <Select label="Stage" value={a.stage} options={ASSET_STAGES} onChange={(v) => set('stage', v)} />
            <Num label="Version" value={a.version} onChange={(v) => set('version', v ?? 1)} />
          </div>
          <StatusSelect value={a.status} onChange={(v) => set('status', v)} label="Design status" />
          <Select label="Category" value={catLabel(a.category)} options={[...new Set([catLabel(a.category), ...CATS])]} onChange={(v) => set('category', v)} />
          <Area label="Design description" value={a.description} onChange={(v) => set('description', v)} />
          <Text label="Original creator" value={a.creator} onChange={(v) => set('creator', v)} />
          <Text label="License or ownership" value={a.license} onChange={(v) => set('license', v)} />
          <Text label="Intended rendering scale" value={a.renderScale} onChange={(v) => set('renderScale', v)} />
          <Text label="Animation" value={a.animation} onChange={(v) => set('animation', v)} />
          <TagInput label="Tags" value={a.tags} onChange={(v) => set('tags', v)} />
          <TagInput label="Colour palette" value={a.palette} onChange={(v) => set('palette', v)} placeholder="#hex and Enter" />
          <Area label="Implementation notes" value={a.implNotes} onChange={(v) => set('implNotes', v)} />
          <Area label="Known issues" value={a.knownIssues} onChange={(v) => set('knownIssues', v)} />
          <LinkList kind="character" label="Linked characters" ids={a.characterIds} onChange={(v) => set('characterIds', v)} />
          <LinkList kind="landmark" label="Linked landmarks" ids={a.landmarkIds} onChange={(v) => set('landmarkIds', v)} />
          <Select label="Replaces" value={a.replaces ?? ''} options={[{ value: '', label: 'Nothing' }, ...Object.values(ws.assets).filter((x) => x.id !== a.id && x.origin === 'repo').map((x) => ({ value: x.id, label: x.repoId ?? x.title }))]} onChange={(v) => set('replaces', v || null)} />
          {a.origin === 'upload' && <ImageDrop compact label="Replace the image" onAdd={(refs) => mutate('replace image', (d) => { d.assets[a.id].image = refs[0]; d.assets[a.id].version += 1; d.assets[a.id].updatedAt = now(); })} />}
        </div>
      </Section>
      <Section title="Provenance">
        <dl>
          <Kv k="Asset ID"><span className="font-mono text-[12px]">{a.repoId ?? a.id}</span></Kv>
          <Kv k="File">{a.file ? <span className="font-mono text-[12px]">{a.file}</span> : 'Uploaded to this browser only'}</Kv>
          {r && <Kv k="Bytes / sha">{r.bytes.toLocaleString()} · {r.sha}</Kv>}
          <Kv k="Dimensions">{a.dims ?? '—'}</Kv>
          {meta && <Kv k="Anchor">{meta.anchor?.join(', ')}</Kv>}
          {meta && <Kv k="Colour slots">{meta.slots.join(', ') || '—'}</Kv>}
          {meta && meta.traits.length > 0 && <Kv k="Target traits">{meta.traits.join(', ')}</Kv>}
          <Kv k="Register">{r?.register ? <>{r.register.origin}. {r.register.author}. <span className="text-muted">sources/asset-register.md:{r.register.line}</span></> : a.origin === 'repo' ? 'No register row found' : 'Not registered: add a row before it ships'}</Kv>
          <Kv k="Source">{a.source ?? '—'}</Kv>
          <Kv k="Reviews">{reviews.length ? reviews.map((x) => reviewResult(x).verdict).join(', ') : 'none'}</Kv>
          <Kv k="Updated">{fmtDate(a.updatedAt)}</Kv>
        </dl>
        <div className="mt-3"><p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Linked from</p><Backlinks id={a.id} /></div>
      </Section>
    </aside>
  );
}

