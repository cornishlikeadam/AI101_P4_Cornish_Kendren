import { useEffect, useMemo, useRef, useState } from 'react';
import { logActivity, mutate, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, Num, PageHeader, Section, Select, Slider, StatusBadge, StatusSelect, Tabs, Text, toast, Toggle } from '../components/ui';
import { Backlinks, LinkList } from '../components/links';
import { ImageDrop, Img, storeFile, useImageUrl } from '../components/images';
import { Backdrop, BACKGROUNDS, canvasBlob, gameplayHeight, RuntimeError, Sprite, useRuntime, type PreviewMode } from '../components/sprites';
import { composeWithHeadScale, svgToImage, TRAIT_LABEL, TRAITS, type Kit, type Runtime } from '../lib/runtime';
import { href, setQuery, useRoute } from '../lib/router';
import { download, now, uid } from '../lib/util';
import { reviewResult } from '../lib/readiness';
import type { Candidate, Character } from '../types';

const FACES = ['smile', 'neutral', 'talk', 'happy', 'surprised'];
const HAIRS = ['crop', 'sidepart', 'bob', 'long', 'bun', 'afro', 'ponytail', 'bald', 'locs', 'curly'];
const HATS = ['cap', 'sunhat', 'boater', 'beanie', 'bobble', 'bucket', 'fedora', 'headwrap', 'tophat'];

/** Default colour of each slot, read from the SVG's var(--slot,#hex) fallbacks. */
function slotDefaults(svg: string | undefined) {
  const out: Record<string, string> = {};
  for (const m of (svg ?? '').matchAll(/var\(--([a-z0-9]+),\s*(#[0-9a-fA-F]{3,8})\)/g)) if (!out[m[1]]) out[m[1]] = m[2];
  return out;
}
function kitOf(c: Character): Kit {
  const p = c.params, k: Kit = {};
  if (p.expression) k.face = p.expression;
  if (p.hair) k.hair = p.hair;
  if (p.headwear) k.hat = p.headwear;
  if (p.glasses) k.glasses = p.glasses;
  if (p.beard) k.beard = p.beard;
  return k;
}

export default function Characters() {
  const ws = useWs();
  const route = useRoute();
  const { rt, err } = useRuntime();
  const list = Object.values(ws.characters);
  const sel = route.id ? ws.characters[route.id] : list[0];
  const tab = route.q.get('tab') ?? 'preview';
  return (
    <div>
      <PageHeader eyebrow="Character Workshop" title="Readable illustrated figures" lede="Previews below are the repository's own SVG drawings, composed by the game's own compose.js. Gameplay scale uses the engine's numbers: zoom 1.0 = 0.4 CSS px per world unit, people at 0.8 world units per SVG unit.">
        <Tabs label="Workshop" value={tab} onChange={(t) => setQuery('tab', t)} tabs={[{ value: 'preview', label: 'Character' }, { value: 'grid', label: 'Comparison grid' }, { value: 'decoys', label: 'Decoy designer' }]} />
      </PageHeader>
      {err && <RuntimeError err={err} />}
      {tab === 'grid' && rt && <ComparisonGrid rt={rt} />}
      {tab === 'decoys' && rt && <DecoyDesigner rt={rt} />}
      {tab === 'preview' && (
        <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
          <nav aria-label="Character families" className="flex flex-col gap-1">
            {list.map((c) => (
              <a key={c.id} href={href('characters', c.id)} className={`rounded-md border px-2.5 py-2 ${sel?.id === c.id ? 'border-cocoa bg-cream ring-1 ring-cocoa' : 'border-transparent hover:bg-cream'}`}>
                <p className="text-[13.5px] font-medium leading-snug">{c.name}{c.isTarget && <span className="ml-1 rounded bg-coral px-1 text-[10px] font-bold uppercase text-white">target</span>}</p>
                <p className="text-[11.5px] text-muted">{c.assetIds.length} drawing(s) · {c.candidates.length} candidate(s)</p>
              </a>
            ))}
          </nav>
          {sel && rt ? <Workbench key={sel.id} c={sel} rt={rt} /> : !err && <Empty title="Loading the game runtime…" />}
        </div>
      )}
    </div>
  );
}

function Workbench({ c, rt }: { c: Character; rt: Runtime }) {
  const ws = useWs();
  const [subject, setSubject] = useState<string>(c.primaryAsset ?? c.assetIds[0] ?? '');   // repo asset id or "cand:<id>"
  const [zoom, setZoom] = useState(2);
  const [bg, setBg] = useState('white');
  const [mode, setMode] = useState<PreviewMode>('normal');
  const [frame, setFrame] = useState<1 | 2>(1);
  const [flip, setFlip] = useState(false);
  const [vseed, setVseed] = useState(1);
  const cand = subject.startsWith('cand:') ? c.candidates.find((x) => x.id === subject.slice(5)) ?? null : null;
  const asset = cand ? null : subject;
  const meta = asset ? rt.assets.meta[asset] : null;
  const defaults = useMemo(() => slotDefaults(asset ? rt.assets.svg[asset] : undefined), [asset, rt]);
  const colours = useMemo(() => { const o: Record<string, string> = {}; for (const s of meta?.slots ?? []) if (c.params.colours[s]) o[s] = c.params.colours[s]; return Object.keys(o).length ? o : null; }, [meta, c.params.colours]);
  const svg = useMemo(() => {
    if (cand) return cand.svgText;
    if (!asset || !meta) return null;
    try { return composeWithHeadScale(rt, asset, colours, meta.head ? kitOf(c) : undefined, c.params.headScale, frame); } catch (e) { return null; }
  }, [cand, asset, meta, colours, c, frame, rt]);
  const candUrl = useImageUrl(cand && !cand.svgText ? cand.image : null);
  const units = cand ? cand.units : meta ? meta.viewBox[3] : 100;
  const hasFrame2 = !!asset && rt.assets.svg[asset]?.includes('data-frame="2"');
  const setP = <K extends keyof Character['params']>(k: K, v: Character['params'][K]) => mutate(`char ${c.id} ${String(k)}`, (d) => { d.characters[c.id].params[k] = v; d.characters[c.id].updatedAt = now(); });
  const set = <K extends keyof Character>(k: K, v: Character[K]) => mutate(`char ${c.id} ${String(k)}`, (d) => { (d.characters[c.id] as Character)[k] = v; d.characters[c.id].updatedAt = now(); });

  async function addCandidate(files: File[], refs: import('../types').ImageRef[]) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i], image = refs[i];
      const isSvg = f.type === 'image/svg+xml' || f.name.endsWith('.svg');
      const text = isSvg ? await f.text() : null;
      if (isSvg && !/<svg[\s>]/.test(text ?? '')) { toast(`${f.name} is not an SVG`); continue; }
      // SVG: its viewBox height. Raster: assume the family's drawing frame until the owner sets it.
      const vb = text?.match(/viewBox="([^"]+)"/)?.[1]?.split(/[\s,]+/).map(Number);
      const h = vb?.[3] || (c.assetIds[0] ? rt.assets.meta[c.assetIds[0]]?.viewBox[3] : 0) || 100;
      const cd: Candidate = { id: uid('cand'), name: f.name.replace(/\.[a-z]+$/i, ''), image, uploadedAt: now(), approval: 'Candidate', note: '', captures: [], approvedAt: null, approvedBy: null, units: h, svgText: text };
      mutate('add candidate', (d) => { d.characters[c.id].candidates.push(cd); logActivity(d, `Candidate "${cd.name}" uploaded for ${c.name}`, { kind: 'character', id: c.id }); });
      setSubject('cand:' + cd.id);
    }
  }
  const setCand = (id: string, patch: Partial<Candidate>) => mutate('candidate ' + id, (d) => { const x = d.characters[c.id].candidates.find((y) => y.id === id); if (x) Object.assign(x, patch); d.characters[c.id].updatedAt = now(); });

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-5 2xl:grid-cols-[1fr_22rem]">
        <Section title="Preview" actions={<StatusBadge status={c.status} small />}>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Subject
              <select className="input w-auto normal-case tracking-normal" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <optgroup label="Repository drawings">{c.assetIds.map((a) => <option key={a} value={a}>{a.split('/').pop()}</option>)}</optgroup>
                {c.candidates.length > 0 && <optgroup label="Uploaded candidates">{c.candidates.map((x) => <option key={x.id} value={'cand:' + x.id}>{x.name} ({x.approval})</option>)}</optgroup>}
              </select>
            </label>
            <div role="group" aria-label="Zoom" className="flex rounded-md bg-sand p-0.5">{[1, 2, 4].map((z) => <button key={z} aria-pressed={zoom === z} onClick={() => setZoom(z)} className={`rounded px-2.5 py-1 text-[12.5px] ${zoom === z ? 'bg-cream shadow-sm' : 'text-muted'}`}>{z * 100}%</button>)}</div>
            <div role="group" aria-label="View mode" className="flex rounded-md bg-sand p-0.5">{(['normal', 'outline', 'silhouette'] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={`rounded px-2.5 py-1 text-[12.5px] capitalize ${mode === m ? 'bg-cream shadow-sm' : 'text-muted'}`}>{m === 'outline' ? 'Outline only' : m === 'silhouette' ? 'Silhouette only' : 'Colour'}</button>)}</div>
            <select aria-label="Background" className="input w-auto" value={bg} onChange={(e) => setBg(e.target.value)}>{Object.entries(BACKGROUNDS).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}</select>
            {hasFrame2 && <div role="group" aria-label="Frame" className="flex rounded-md bg-sand p-0.5">{[1, 2].map((f) => <button key={f} aria-pressed={frame === f} onClick={() => setFrame(f as 1 | 2)} className={`rounded px-2.5 py-1 text-[12.5px] ${frame === f ? 'bg-cream shadow-sm' : 'text-muted'}`}>Frame {f}</button>)}</div>}
            <Toggle label="Mirror" checked={flip} onChange={setFlip} />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <Backdrop bg={bg} className="flex min-h-[26rem] items-end justify-center overflow-auto rounded-lg border border-line p-6">
              {(svg || candUrl) ? <Sprite svg={svg} url={candUrl} height={units * zoom} mode={mode} flip={flip} title={`${subject} at ${zoom * 100}%`} /> : <p className="text-muted">No preview.</p>}
            </Backdrop>
            <div className="flex flex-col gap-2">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Gameplay scale</p>
              {[0.6, 1, 2, 3.5].map((z) => (
                <Backdrop key={z} bg={bg === 'white' || bg === 'checker' ? 'lawn' : bg} className="flex h-[8.5rem] w-40 items-end justify-center gap-3 rounded border border-line pb-2">
                  {(svg || candUrl) && <Sprite svg={svg} url={candUrl} height={gameplayHeight(units, z)} mode={mode} flip={flip} />}
                  <span className="self-start pt-1 font-mono text-[10.5px] text-cocoa/80">{z}× · {gameplayHeight(units, z).toFixed(0)} px</span>
                </Backdrop>
              ))}
              <p className="w-40 text-[11px] text-muted">At 0.6× an adult is about {gameplayHeight(92, 0.6).toFixed(0)} px tall; the art direction drops face detail below about 18 px.</p>
            </div>
          </div>

          {asset && meta?.head && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between"><p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Pose and look variations (game factory, seed {vseed})</p><Button small kind="ghost" onClick={() => setVseed((s) => s + 1)}>Reroll</Button></div>
              <Variations rt={rt} asset={asset} seed={vseed} mode={mode} bg={bg} />
            </div>
          )}
        </Section>

        <Section title="Parameters">
          <div className="flex flex-col gap-3">
            <Area label="Silhouette" value={c.params.silhouette} onChange={(v) => setP('silhouette', v)} rows={2} />
            <Area label="Body proportions" value={c.params.proportions} onChange={(v) => setP('proportions', v)} rows={2} />
            <Slider label="Head-to-body (preview)" min={0.7} max={1.4} step={0.05} value={c.params.headScale} onChange={(v) => setP('headScale', v)} format={(v) => '×' + v.toFixed(2)} hint={meta?.head ? 'Live: scales the head socket in the composed drawing.' : 'Only drawings with a head socket can be previewed. Others are spec only.'} />
            <div className="grid grid-cols-2 gap-2">
              <Select label="Expression" value={c.params.expression} options={['', ...FACES].map((f) => ({ value: f, label: f || 'drawing default' }))} onChange={(v) => setP('expression', v)} />
              <Select label="Hair" value={c.params.hair} options={['', ...HAIRS].map((f) => ({ value: f, label: f || 'drawing default' }))} onChange={(v) => setP('hair', v)} />
              <Select label="Headwear" value={c.params.headwear} options={['', 'none', ...HATS].map((f) => ({ value: f, label: f || 'drawing default' }))} onChange={(v) => setP('headwear', v)} />
              <Select label="Glasses" value={c.params.glasses} options={['', 'none', 'round', 'square', 'sun'].map((f) => ({ value: f, label: f || 'drawing default' }))} onChange={(v) => setP('glasses', v)} />
              <Select label="Beard" value={c.params.beard} options={['', 'none', 'full', 'moustache'].map((f) => ({ value: f, label: f || 'drawing default' }))} onChange={(v) => setP('beard', v)} />
              <Num label="World scale" value={c.params.scale} step={0.05} onChange={(v) => setP('scale', v ?? 0.8)} />
            </div>
            {c.isTarget && (c.params.glasses && c.params.glasses !== 'round' || c.params.headwear && c.params.headwear !== 'bobble') && <p role="alert" className="rounded bg-coral/15 p-2 text-[12.5px]">This changes one of the target's five binding traits (ADR-002 §4). Preview only; the game's target is unaffected.</p>}
            {meta && meta.slots.length > 0 && (
              <div>
                <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Colour slots (live)</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {meta.slots.map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-[12px]">
                      <input type="color" className="h-6 w-8 cursor-pointer rounded border border-line" value={c.params.colours[s] ?? defaults[s] ?? '#888888'} onChange={(e) => setP('colours', { ...c.params.colours, [s]: e.target.value })} />
                      <span className="truncate">{s}</span>
                    </label>
                  ))}
                </div>
                {Object.keys(c.params.colours).length > 0 && <Button small kind="ghost" onClick={() => setP('colours', {})}>Reset colours</Button>}
              </div>
            )}
            <Area label="Pose" value={c.params.pose} onChange={(v) => setP('pose', v)} rows={2} />
            <Area label="Clothing layers" value={c.params.clothing} onChange={(v) => setP('clothing', v)} rows={2} />
            <Area label="Accessories" value={c.params.accessories} onChange={(v) => setP('accessories', v)} rows={2} />
            <Area label="Outline thickness" value={c.params.outline} onChange={(v) => setP('outline', v)} rows={2} hint="Spec only: the preview never rewrites authored strokes." />
            <Area label="Animation states" value={c.params.animation} onChange={(v) => setP('animation', v)} rows={2} />
            <Area label="Screen-space readability" value={c.params.readability} onChange={(v) => setP('readability', v)} rows={2} />
            <StatusSelect value={c.status} onChange={(v) => set('status', v)} />
          </div>
        </Section>
      </div>

      <Section title="Crowd context">
        <CrowdContext rt={rt} svg={svg} url={candUrl} units={units} label={cand ? cand.name : asset ?? ''} onCapture={cand ? async (blob) => {
          const ref = await storeFile(blob, `${cand.name}-gameplay-capture.png`);
          setCand(cand.id, { captures: [...cand.captures, ref] });
          mutate('capture log', (d) => logActivity(d, `Gameplay-scale capture saved for "${cand.name}"`, { kind: 'character', id: c.id }));
          toast('Capture saved to the candidate');
        } : undefined} />
      </Section>

      <Section title={`Candidates (${c.candidates.length})`}>
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="flex flex-col gap-2">
            <ImageDrop multiple label="Upload a replacement SVG or raster" onAdd={(refs, files) => addCandidate(files, refs)} />
            <p className="text-[11.5px] text-muted">SVG keeps its viewBox height as the game-unit height. For rasters, set the height in game units after upload so gameplay-scale previews are correct.</p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {c.candidates.map((x) => {
              const reviews = Object.values(ws.reviews).filter((r) => r.subject.id === x.id);
              return (
                <li key={x.id} className="rounded-lg border border-line p-3">
                  <div className="flex gap-3">
                    <Img refx={x.image} alt={x.name} className="checker h-28 w-24 shrink-0 rounded" />
                    <div className="min-w-0 flex-1">
                      <input aria-label="Candidate name" className="input mb-1 py-0.5 font-medium" value={x.name} onChange={(e) => setCand(x.id, { name: e.target.value })} />
                      <p className="text-[12px]"><span className={`font-semibold ${x.approval === 'Approved' ? 'text-moss' : x.approval === 'Rejected' ? 'text-[#B3261E]' : ''}`}>{x.approval === 'Approved' ? '✓ ' : x.approval === 'Rejected' ? '✗ ' : '◇ '}{x.approval}</span>{x.approvedBy ? ` by ${x.approvedBy}` : ''}</p>
                      <Num label="Height (game SVG units)" value={x.units} onChange={(v) => setCand(x.id, { units: v ?? 100 })} />
                      <p className="mt-1 text-[11.5px] text-muted">{x.captures.length} capture(s) · {reviews.length ? reviews.map((r) => reviewResult(r).verdict).join(', ') : 'not reviewed'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button small onClick={() => setSubject('cand:' + x.id)}>Preview</Button>
                    <a className="inline-flex h-7 items-center rounded-md border border-line px-2 text-[12px] hover:border-cocoa/50" href={href('quality', null, { subject: 'candidate:' + x.id + ':' + c.id })}>Review</a>
                    <a className="inline-flex h-7 items-center rounded-md border border-line px-2 text-[12px] hover:border-cocoa/50" href={href('compare', null, { new: 'candidate:' + x.id + ':' + c.id })}>Compare with current</a>
                    <Button small kind="primary" disabled={x.approval === 'Approved'} onClick={async () => {
                      const pass = reviews.some((r) => reviewResult(r).verdict === 'Pass');
                      if (!pass && !(await confirmAction('No passing review', 'This candidate has no passing quality review. Approving records your judgement without checklist evidence. Approve anyway?', 'Approve', false))) return;
                      setCand(x.id, { approval: 'Approved', approvedAt: now(), approvedBy: ws.project.owner || 'Owner' });
                      mutate('approve cand', (d) => logActivity(d, `Approved candidate "${x.name}"`, { kind: 'character', id: c.id }));
                    }}>Approve</Button>
                    <Button small onClick={() => setCand(x.id, { approval: 'Rejected', approvedAt: null, approvedBy: null })}>Reject</Button>
                  </div>
                  {x.captures.length > 0 && <div className="mt-2 flex gap-1.5 overflow-x-auto">{x.captures.map((r, i) => <Img key={i} refx={r} alt="capture" className="h-14 w-24 shrink-0 rounded border border-line" fit="cover" />)}</div>}
                </li>
              );
            })}
            {!c.candidates.length && <li className="text-[13px] text-muted md:col-span-2">No candidates yet. Upload a redrawn character to start Sprint 01's evidence chain.</li>}
          </ul>
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Notes and links">
          <div className="flex flex-col gap-3">
            <Text label="Family name" value={c.name} onChange={(v) => set('name', v)} />
            <Area label="Notes" value={c.notes} onChange={(v) => set('notes', v)} />
            <LinkList kind="decision" label="Design rules" ids={c.decisionIds} onChange={(v) => set('decisionIds', v)} />
            <div>
              <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Repository drawings</p>
              <ul className="flex flex-wrap gap-1">{c.assetIds.map((a) => <li key={a}><a className="rounded border border-line px-1.5 py-0.5 font-mono text-[11.5px] hover:border-cocoa/50" href={href('assets', 'ast_' + a.replace(/[^a-z0-9]+/gi, '_'))}>{a.split('/').pop()}</a></li>)}</ul>
            </div>
          </div>
        </Section>
        <Section title="Issues, sprints and reviews that reference this family"><Backlinks id={c.id} /></Section>
      </div>
    </div>
  );
}

function Variations({ rt, asset, seed, mode, bg }: { rt: Runtime; asset: string; seed: number; mode: PreviewMode; bg: string }) {
  const vs = useMemo(() => {
    const rng = rt.WS.rng.make('lab-variations-' + seed + '-' + asset);
    return Array.from({ length: 10 }, () => { const m = rt.WS.characters.make(rng, asset); return { svg: rt.WS.characters.compose(asset, m.colours, m.kit, m.kit2), traits: m.traits }; });
  }, [rt, asset, seed]);
  return (
    <Backdrop bg={bg} className="flex flex-wrap items-end gap-3 rounded-lg border border-line p-3">
      {vs.map((v, i) => <figure key={i} className="flex flex-col items-center"><Sprite svg={v.svg} height={rt.assets.meta[asset].viewBox[3] * 0.9} mode={mode} />{v.traits.length > 0 && <figcaption className="text-[10px] text-cocoa/70">decoy: {v.traits.join('+')}</figcaption>}</figure>)}
    </Backdrop>
  );
}

/** The subject among a seeded crowd of real crowd bodies, drawn at gameplay scale. */
function CrowdContext({ rt, svg, url, units, label, onCapture }: { rt: Runtime; svg: string | null; url: string | null; units: number; label: string; onCapture?(b: Blob): void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [seed, setSeed] = useState(3);
  const [mark, setMark] = useState(false);
  const [n, setN] = useState(36);
  const W = 640, H = 300;
  useEffect(() => {
    let live = true;
    (async () => {
      const c = ref.current; if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = W * dpr; c.height = H * dpr;
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#8DBA5A'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#E8D6B0'; ctx.fillRect(0, H * 0.42, W, H * 0.2);
      const rng = rt.WS.rng.make('lab-crowd-' + seed);
      const pool = ['walk', 'dress', 'phone', 'coffee', 'tote', 'cane', 'child'].map((b) => 'characters/bodies/' + b).concat(['characters/archetypes/jogger', 'characters/archetypes/tourist-photographer', 'characters/archetypes/scad-student-portfolio']);
      const s = 0.8 * 0.4 * zoom;
      const items: { y: number; draw(): Promise<void> }[] = [];
      for (let i = 0; i < n; i++) {
        const a = rng.pick(pool); const m = rt.WS.characters.make(rng, a, { decoys: rng.chance(0.16) ? 1 : 0 });
        const x = rng() * W, y = 40 + rng() * (H - 30), flip = rng.chance(0.5);
        const meta = rt.assets.meta[a];
        items.push({ y, draw: async () => { const img = await svgToImage(rt.WS.characters.compose(a, m.colours, m.kit, m.kit2)); drawAt(ctx, img, x, y, meta.viewBox[2] * s, meta.viewBox[3] * s, meta.anchor[0] / meta.viewBox[2], flip); } });
      }
      const sx = W * 0.52, sy = H * 0.66;
      if (svg || url) items.push({ y: sy, draw: async () => {
        const img = svg ? await svgToImage(svg) : await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url!; });
        const h = units * s, w = h * (img.naturalWidth / img.naturalHeight || 1);
        drawAt(ctx, img, sx, sy, w, h, 0.5, false);
        if (mark) { ctx.strokeStyle = '#FF6F61'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(sx - w / 2 - 4, sy - h - 4, w + 8, h + 8); ctx.setLineDash([]); }
      } });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) { if (!live) return; await it.draw(); }
    })();
    return () => { live = false; };
  }, [rt, svg, url, units, zoom, seed, mark, n]);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Crowd zoom" className="flex rounded-md bg-sand p-0.5">{[0.6, 1, 2].map((z) => <button key={z} aria-pressed={zoom === z} onClick={() => setZoom(z)} className={`rounded px-2.5 py-1 text-[12.5px] ${zoom === z ? 'bg-cream shadow-sm' : 'text-muted'}`}>{z}×</button>)}</div>
        <label className="flex items-center gap-2 text-[12.5px]">People <input type="range" min={10} max={90} value={n} onChange={(e) => setN(Number(e.target.value))} /> <span className="w-6 tabular-nums">{n}</span></label>
        <Button small kind="ghost" onClick={() => setSeed((s) => s + 1)}>New crowd</Button>
        <Toggle label="Mark the subject" checked={mark} onChange={setMark} />
        <div className="ml-auto flex gap-1.5">
          <Button small onClick={async () => ref.current && download(`crowd-context-${label.split('/').pop()}-${zoom}x.png`, await canvasBlob(ref.current), 'image/png')}>Download PNG</Button>
          {onCapture && <Button small kind="primary" onClick={async () => ref.current && onCapture(await canvasBlob(ref.current))}>Save gameplay-scale capture</Button>}
        </div>
      </div>
      <canvas ref={ref} role="img" aria-label={`${label} among ${n} crowd characters at zoom ${zoom}`} className="w-full max-w-[640px] rounded-lg border border-line" style={{ aspectRatio: `${W}/${H}` }} />
      <p className="mt-1.5 text-[11.5px] text-muted">Crowd bodies and colours come from the game's factory (make.js) with about 16% decoys, as at normal difficulty. Ground colours follow art-direction.md. This is a lab composite, not a game screenshot.</p>
    </div>
  );
}
function drawAt(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, ax: number, flip: boolean) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(img, -w * ax, -h, w, h); ctx.restore();
}

function ComparisonGrid({ rt }: { rt: Runtime }) {
  const ws = useWs();
  const [mode, setMode] = useState<PreviewMode>('silhouette');
  const [zoom, setZoom] = useState(1);
  const items = Object.values(ws.characters).flatMap((c) => c.assetIds.map((a) => ({ c, a })));
  return (
    <Section title="Every drawing side by side" actions={<>
      <div role="group" aria-label="View mode" className="flex rounded-md bg-sand p-0.5">{(['normal', 'outline', 'silhouette'] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={`rounded px-2.5 py-1 text-[12.5px] capitalize ${mode === m ? 'bg-cream shadow-sm' : 'text-muted'}`}>{m}</button>)}</div>
      <div role="group" aria-label="Scale" className="flex rounded-md bg-sand p-0.5">{[1, 2, 3.5].map((z) => <button key={z} aria-pressed={zoom === z} onClick={() => setZoom(z)} className={`rounded px-2.5 py-1 text-[12.5px] ${zoom === z ? 'bg-cream shadow-sm' : 'text-muted'}`}>{z}× game</button>)}</div>
    </>}>
      <p className="mb-3 text-[12.5px] text-muted">Silhouette mode answers VIS-003: if two drawings read the same in solid ink at gameplay scale, players cannot tell them apart in a crowd.</p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-5 rounded-lg bg-white p-4">
        {items.map(({ c, a }) => {
          const m = rt.assets.meta[a]; if (!m) return null;
          let svg: string | null = null;
          try { svg = m.head || m.head2 ? rt.WS.characters.compose(a, null) : rt.assets.svg[a]; } catch { svg = null; }
          return (
            <a key={a} href={href('characters', c.id)} className="flex flex-col items-center gap-1" title={a}>
              <Sprite svg={svg} height={gameplayHeight(m.viewBox[3], zoom)} mode={mode} />
              <span className="max-w-[5.5rem] truncate text-[10px] text-muted">{a.split('/').pop()}</span>
            </a>
          );
        })}
      </div>
    </Section>
  );
}

function DecoyDesigner({ rt }: { rt: Runtime }) {
  const ws = useWs();
  const cfg = Object.values(ws.clues)[0];
  const [shared, setShared] = useState(2);
  const [allowed, setAllowed] = useState<Record<string, boolean>>({ stripes: false, bobble: true, glasses: true, blue: true, stick: true });
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState<PreviewMode>('normal');
  const approvedExperimental = !!cfg?.experimentalApproved;
  const limit = approvedExperimental ? 4 : 2;
  const target = useMemo(() => rt.WS.characters.compose('characters/archetypes/target-walker', null), [rt]);
  const decoys = useMemo(() => {
    const rng = rt.WS.rng.make('lab-decoys-' + seed);
    const bodies = ['walk', 'dress', 'tote', 'phone', 'coffee', 'cane'].map((b) => 'characters/bodies/' + b);
    const n = Math.min(shared, limit);
    return bodies.map((asset) => {
      const m = rt.WS.characters.make(rng, asset);
      const kit: Kit = { ...(m.kit ?? {}) }, col = { ...m.colours };
      delete kit.glasses; if (kit.hat === 'bobble') delete kit.hat;
      const options = (Object.keys(allowed) as (keyof typeof TRAIT_LABEL)[]).filter((t) => allowed[t] && (t !== 'stick' || asset.endsWith('cane')));
      const picked: string[] = [];
      while (picked.length < n && options.length) picked.push(options.splice(rng.int(options.length), 1)[0]);
      for (const t of picked) {
        if (t === 'glasses') kit.glasses = 'round';
        if (t === 'bobble') { kit.hat = 'bobble'; kit.hair = 'crop'; }
        if (t === 'blue') col.bottom = rt.WS.characters.TARGET_BLUE;
        if (t === 'stick') col.acc = '#8D6E63';
        if (t === 'stripes') { col.top = '#E53935'; col.top2 = '#FFFFFF'; }
      }
      // Count what is actually drawn: the game's own trait accounting, plus the stripe rule it bans outright.
      const counted = new Set(rt.WS.characters.traitsOf({ asset, kit, colours: col }));
      if (col.top === '#E53935' && col.top2 === '#FFFFFF') counted.add('stripes');
      const traits = [...counted];
      return { asset, svg: traits.length >= 5 ? null : rt.WS.characters.compose(asset, col, kit), traits };
    });
  }, [rt, seed, shared, allowed, limit]);
  return (
    <div className="grid gap-5 xl:grid-cols-[20rem_1fr]">
      <Section title="Settings">
        <div className="flex flex-col gap-3">
          <Slider label="Traits shared with the target" min={0} max={4} step={1} value={shared} onChange={setShared} format={(v) => String(v)} hint={shared > 2 ? (approvedExperimental ? 'Experimental setting approved in the Clue Lab.' : 'Above two breaks HARNESS hard rule 4. Capped at 2 until approved in the Clue Lab.') : 'Game default: at most two (make.js enforces it).'} />
          <p className="text-[12.5px] font-semibold">Traits decoys may borrow</p>
          {TRAITS.map((t) => <Toggle key={t} label={TRAIT_LABEL[t]} checked={!!allowed[t]} onChange={(v) => setAllowed({ ...allowed, [t]: v })} hint={t === 'stripes' ? 'The game never gives decoys red-and-white stripes (art-direction.md).' : t === 'stick' ? 'Only the cane body can carry it.' : undefined} />)}
          <div role="group" aria-label="View mode" className="flex rounded-md bg-sand p-0.5">{(['normal', 'silhouette'] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={`flex-1 rounded px-2.5 py-1 text-[12.5px] capitalize ${mode === m ? 'bg-cream shadow-sm' : 'text-muted'}`}>{m}</button>)}</div>
          <Button onClick={() => setSeed((s) => s + 1)}>New decoys</Button>
          <a className="text-[12.5px] underline" href={href('clues')}>Open the Clue & Difficulty Lab</a>
        </div>
      </Section>
      <Section title="Target and decoys">
        <div className="flex flex-wrap items-end gap-5 rounded-lg p-4" style={{ background: '#E8D6B0' }}>
          <figure className="flex flex-col items-center gap-1"><Sprite svg={target} height={150} mode={mode} /><figcaption className="text-[11.5px] font-semibold">Target · 5 of 5</figcaption></figure>
          <span className="h-40 w-px bg-cocoa/20" />
          {decoys.map((d, i) => (
            <figure key={i} className="flex flex-col items-center gap-1">
              {d.svg ? <Sprite svg={d.svg} height={150} mode={mode} /> : <div className="flex h-[150px] w-20 items-center justify-center rounded border-2 border-coral text-center text-[11px]">Refused: would be a second target</div>}
              <figcaption className="text-[11.5px]">{d.asset.split('/').pop()} · {d.traits.length} of 5</figcaption>
            </figure>
          ))}
        </div>
        <table className="mt-4 w-full text-[12.5px]">
          <thead><tr className="text-left text-muted"><th className="py-1">Trait</th><th>Target</th>{decoys.map((d, i) => <th key={i} className="font-normal">{d.asset.split('/').pop()}</th>)}</tr></thead>
          <tbody>
            {TRAITS.map((t) => <tr key={t} className="border-t border-line"><td className="py-1">{TRAIT_LABEL[t]}</td><td>✓</td>{decoys.map((d, i) => <td key={i} className={d.traits.includes(t) ? 'font-semibold text-terracotta' : 'text-muted'}>{d.traits.includes(t) ? '✓ shared' : '·'}</td>)}</tr>)}
          </tbody>
        </table>
        <p className="mt-2 text-[11.5px] text-muted">Trait counts come from the game's traitsOf(). A configuration that would give a decoy all five traits is refused here. Changing the game itself goes through an approved ADR-V006 and a sprint.</p>
      </Section>
    </div>
  );
}

