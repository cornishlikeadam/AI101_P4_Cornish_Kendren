import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, PageHeader, Section, Select, Slider, Tabs, Text, toast, Toggle } from '../components/ui';
import { RuntimeError, useRuntime } from '../components/sprites';
import { LinkList } from '../components/links';
import { alphaOcclusion, composeScene, difficultyIndex, DISTRICT_IDS, DISTRICT_NAME, itemRect, upscaleSvg, type Composed, type Item } from '../lib/compose';
import { entitySvg, svgToImage, type Runtime } from '../lib/runtime';
import { defaultLayers, LAYERS, PRESETS, DEFAULT_PARAMS, type LayerId } from '../seed/seed';
import { go, href, setQuery, useRoute } from '../lib/router';
import { download, fmtTime, now, round, uid } from '../lib/util';
import type { Scene, SceneIteration, SceneMetrics, SceneParams } from '../types';

export default function Composer() {
  const ws = useWs();
  const route = useRoute();
  const { rt, err } = useRuntime();
  const scenes = Object.values(ws.scenes);
  const scene = (route.id && ws.scenes[route.id]) || (route.id && ws.iterations[route.id] ? ws.scenes[ws.iterations[route.id].sceneId] : null) || scenes[0];
  function newScene() {
    const id = uid('scn');
    mutate('new scene', (d) => { d.scenes[id] = { id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Lab', rationale: null, tags: [], name: 'New scene', preset: 'Illustrated Savannah', params: { ...DEFAULT_PARAMS, seed: 'SAV-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0') }, layers: defaultLayers(), moved: {}, added: [], removed: [], baselineIterationId: null, preferredIterationId: null, decisionIds: [] }; });
    go('composer', id);
  }
  return (
    <div>
      <PageHeader eyebrow="Scene Composer" title="Composition editor" lede="The layout is the game's own world for this replay identity, built by the repository's scene code. Lab adjustments and drag edits are a labelled simulation on top. They never change the game.">
        <select aria-label="Scene" className="input w-auto" value={scene?.id ?? ''} onChange={(e) => go('composer', e.target.value)}>{scenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <Button onClick={newScene}>+ Scene</Button>
      </PageHeader>
      {err && <RuntimeError err={err} />}
      {scene && rt ? <Editor key={scene.id} s={scene} rt={rt} /> : !err && <Empty title="Loading the game runtime…" />}
    </div>
  );
}

interface Cam { x: number; y: number; z: number }

/** Alpha masks of decoded sprites, about 96 px tall, for occlusion sampling. */
const maskCache = new Map<string, { w: number; h: number; data: Uint8ClampedArray }>();
function useMetrics(rt: Runtime, composed: Composed | Error): SceneMetrics | null {
  const [occ, setOcc] = useState<{ key: Composed; v: number | null } | null>(null);
  useEffect(() => {
    if (composed instanceof Error || !composed.target) return;
    let live = true;
    const t = composed.target, tr = itemRect(t);
    const front = composed.items.filter((o) => o === t || (o.gameLayer !== 'far' && o.y >= t.y && (() => { const r = itemRect(o); return r.x < tr.x + tr.w && r.x + r.w > tr.x && r.y < tr.y + tr.h && r.y + r.h > tr.y; })()));
    const keyOf = (i: Item) => i.asset + JSON.stringify(i.colours) + JSON.stringify(i.kit ?? '') + JSON.stringify(i.kit2 ?? '');
    Promise.all(front.map(async (i) => {
      const k = keyOf(i); if (maskCache.has(k)) return;
      const svg = entitySvg(rt, i); if (!svg) return;
      const img = await svgToImage(svg);
      const h = 96, w = Math.max(1, Math.round(h * img.naturalWidth / img.naturalHeight));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0, w, h);
      maskCache.set(k, { w, h, data: ctx.getImageData(0, 0, w, h).data });
    })).then(() => { if (live) setOcc({ key: composed, v: alphaOcclusion(composed.items, t, (i) => maskCache.get(keyOf(i)) ?? null) }); });
    return () => { live = false; };
  }, [rt, composed]);
  if (composed instanceof Error) return null;
  const m = { ...composed.metrics };
  if (occ && occ.key === composed) { m.targetOcclusion = occ.v; m.difficultyScore = difficultyIndex(m, m.nearby ?? 0, m.nearDecoys ?? 0); }
  return m;
}   // world point at canvas top-left, CSS px per world unit

function Editor({ s, rt }: { s: Scene; rt: Runtime }) {
  const ws = useWs();
  const route = useRoute();
  const tab = route.q.get('tab') ?? 'compose';
  const composed = useMemo(() => { try { return composeScene(rt, s.params, s); } catch (e) { return e as Error; } }, [rt, s]);
  const setP = (patch: Partial<SceneParams>, label = 'scene params') => mutate(label, (d) => { Object.assign(d.scenes[s.id].params, patch); d.scenes[s.id].updatedAt = now(); });
  const setS = <K extends keyof Scene>(k: K, v: Scene[K]) => mutate(`scene ${String(k)}`, (d) => { (d.scenes[s.id] as Scene)[k] = v; d.scenes[s.id].updatedAt = now(); });
  const [selId, setSelId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState({ thirds: false, grid: false, spots: false, beacon: false, labels: true });
  const [diag, setDiag] = useState(false);
  const canvasApi = useRef<{ snapshot(w: number): string | null; fit(): void } | null>(null);
  const metrics = useMetrics(rt, composed);
  const its = Object.values(ws.iterations).filter((i) => i.sceneId === s.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (composed instanceof Error) return <RuntimeError err={'The game scene builder failed for this identity: ' + composed.message} />;
  const sel = selId ? composed.items.find((i) => i.id === selId) ?? null : null;

  function applyPreset(name: string) {
    const pr = PRESETS[name];
    mutate('preset', (d) => { d.scenes[s.id].preset = name; Object.assign(d.scenes[s.id].params, pr.params); d.scenes[s.id].updatedAt = now(); });
  }
  function saveIteration(name?: string) {
    const id = uid('itr');
    const thumb = canvasApi.current?.snapshot(480) ?? null;
    const c = composed as Composed;
    mutate('save iteration', (d) => {
      d.iterations[id] = { id, sceneId: s.id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Scene Composer', rationale: null, tags: [], name: name || `${s.preset} · ${s.params.seed} · ${fmtTime(now())}`, params: { ...s.params }, layers: JSON.parse(JSON.stringify(s.layers)), moved: { ...s.moved }, added: [...s.added], removed: [...s.removed], thumbnail: thumb, metrics: metrics ?? c.metrics, note: '' };
      if (!d.scenes[s.id].baselineIterationId) d.scenes[s.id].baselineIterationId = id;
      logActivity(d, `Saved scene iteration "${d.iterations[id].name}"`, { kind: 'iteration', id });
    });
    toast(its.length ? 'Iteration saved' : 'Saved as the baseline iteration');
  }
  function restore(it: SceneIteration) {
    mutate('restore iteration', (d) => { const x = d.scenes[s.id]; x.params = { ...it.params }; x.layers = JSON.parse(JSON.stringify(it.layers)); x.moved = { ...it.moved }; x.added = [...it.added]; x.removed = [...it.removed]; x.updatedAt = now(); });
    toast('Iteration loaded into the editor');
  }
  function exportParams(it?: SceneIteration) {
    const src = it ?? { name: s.name, params: s.params, layers: s.layers, moved: s.moved, added: s.added, removed: s.removed, metrics: metrics ?? (composed as Composed).metrics };
    const preferred = s.preferredIterationId === (it?.id ?? '');
    download(`composition-${s.params.seed}-${(it?.name ?? s.name).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`, JSON.stringify({
      generatedBy: "Waldo's Savannah Build Lab", generatedAt: now(), scene: s.name, iteration: it?.name ?? '(current editor state)', preferred,
      replayIdentity: { seed: src.params.seed, scene: 'savannah', difficulty: src.params.difficulty, density: src.params.density, crowd: src.params.crowd, artVersion: rt.assets.artVersion },
      district: src.params.district,
      labAdjustments: { note: 'Simulated in the lab. The game has no such parameters; implementing them needs a sprint.', crowdScale: src.params.crowdScale, propScale: src.params.propScale, varietyBias: src.params.varietyBias, overlap: src.params.overlap, foregroundEmphasis: src.params.foregroundEmphasis, decoyBoost: src.params.decoyBoost, landmarkProminence: src.params.landmarkProminence },
      manualEdits: { moved: src.moved, added: src.added, removed: src.removed }, layers: src.layers, metrics: src.metrics,
    }, null, 2), 'application/json');
  }

  const m = metrics ?? composed.metrics;
  const preset = PRESETS[s.preset];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs label="Composer mode" value={tab} onChange={(t) => setQuery('tab', t)} tabs={[{ value: 'compose', label: 'Compose' }, { value: 'live', label: 'Live game' }, { value: 'compare', label: 'Compare iterations' }]} />
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button small kind="primary" onClick={() => saveIteration()}>Save iteration</Button>
          <Button small onClick={() => exportParams()}>Export parameters</Button>
        </div>
      </div>

      {tab === 'live' && <LiveGame s={s} rt={rt} />}
      {tab === 'compare' && <CompareIterations s={s} its={its} exportParams={exportParams} />}
      {tab === 'compose' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_19rem]">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-line bg-cream px-3 py-1.5 text-[12px]">
              <span><b className="tabular-nums">{m.people}</b> people</span>
              <span><b className="tabular-nums">{m.props}</b> props</span>
              <span><b className="tabular-nums">{m.stories}</b> stories</span>
              <span><b className="tabular-nums">{Math.round(m.emptyShare * 100)}%</b> empty</span>
              <span><b className="tabular-nums">{m.colourCount}</b> top colours</span>
              <span><b className="tabular-nums">{m.decoys}</b> decoys</span>
              <span title="Share of the target's opaque pixels covered by opaque pixels of sprites drawn in front, sampled like the engine's validator. Motion and the validator's head weighting are not modelled."><b className="tabular-nums">{!composed.target ? 'no target here' : m.targetOcclusion == null ? '…' : Math.round(m.targetOcclusion * 100) + '%'}</b> target hidden</span>
              <span title="Heuristic index for comparing iterations. Tentative until playtests support it."><b className="tabular-nums">{m.difficultyScore.toFixed(2)}</b> difficulty (tentative)</span>
            </div>
            <SceneCanvas rt={rt} s={s} composed={composed} selId={selId} onSelect={setSelId} overlays={overlays} diag={diag} apiRef={canvasApi} />
            <div className="flex flex-wrap items-center gap-3 text-[12px]">
              {(['thirds', 'grid', 'spots', 'labels'] as const).map((k) => <Toggle key={k} label={{ thirds: 'Rule of thirds', grid: '100-unit grid', spots: 'Hiding spots', labels: 'District labels' }[k]} checked={overlays[k]} onChange={(v) => setOverlays({ ...overlays, [k]: v })} />)}
              <Toggle label="Developer target beacon" checked={overlays.beacon} onChange={(v) => setOverlays({ ...overlays, beacon: v })} hint="Debug only. Never shown in play." />
              <Toggle label="Draw strictly by layer order" checked={diag} onChange={setDiag} hint="Diagnostic; the game sorts by ground position." />
            </div>
            <p className="text-[11.5px] text-muted">Drag empty ground to pan, wheel to zoom, click to select, drag a selected sprite to move it, Delete to remove it. Locked layers ignore clicks. Edits are recorded as lab overrides and can be undone (⌘Z).</p>
            <Timeline s={s} its={its} restore={restore} exportParams={exportParams} />
          </div>
          <div className="flex flex-col gap-4">
            <Section title="Replay identity">
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-[1fr_auto] items-end gap-1.5">
                  <Text label="Seed" value={s.params.seed} onChange={(v) => setP({ seed: v.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'SAV-0000' }, 'seed')} mono />
                  <Button small onClick={() => setP({ seed: 'SAV-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0') })}>New</Button>
                </div>
                {its.length > 0 && <Select label="Saved seeds" value="" onChange={(v) => v && setP({ seed: v })} options={[{ value: '', label: 'Pick a saved seed…' }, ...[...new Set(its.map((i) => i.params.seed))].map((x) => ({ value: x, label: x }))]} />}
                <Select label="District" value={s.params.district} options={DISTRICT_IDS.map((d) => ({ value: d, label: DISTRICT_NAME[d] }))} onChange={(v) => setP({ district: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Difficulty" value={s.params.difficulty} options={['easy', 'normal', 'hard'] as const} onChange={(v) => setP({ difficulty: v })} />
                  <Select label="Density" value={s.params.density} options={['low', 'standard', 'dense'] as const} onChange={(v) => setP({ density: v })} />
                </div>
                <p className="text-[11.5px] text-muted">These four values are the game's own parameters: the same values in the game rebuild this exact layout.</p>
              </div>
            </Section>
            <Section title="Preset">
              <Select label="Starting configuration" value={s.preset} options={Object.keys(PRESETS)} onChange={applyPreset} />
              <p className="mt-1.5 text-[12px] text-muted">{preset?.note}</p>
            </Section>
            <Section title="Lab adjustments (simulated)">
              <div className="flex flex-col gap-2">
                <Slider label="Crowd count" min={0.25} max={2} step={0.05} value={s.params.crowdScale} onChange={(v) => setP({ crowdScale: v, }, 'crowd')} format={(v) => '×' + v.toFixed(2)} />
                <Slider label="Character variety" min={0} max={1} value={s.params.varietyBias} onChange={(v) => setP({ varietyBias: v }, 'variety')} format={(v) => Math.round(v * 100) + '%'} hint="Swaps filler bodies for story archetypes." />
                <Slider label="Clustering / overlap" min={0} max={1} value={s.params.overlap} onChange={(v) => setP({ overlap: v }, 'overlap')} format={(v) => Math.round(v * 100) + '%'} hint="Pulls filler people toward story clusters." />
                <Slider label="Prop density" min={0} max={2} step={0.05} value={s.params.propScale} onChange={(v) => setP({ propScale: v }, 'props')} format={(v) => '×' + v.toFixed(2)} />
                <Slider label="Foreground emphasis" min={0} max={1} value={s.params.foregroundEmphasis} onChange={(v) => setP({ foregroundEmphasis: v }, 'fg')} format={(v) => Math.round(v * 100) + '%'} />
                <Slider label="Decoy frequency" min={0} max={1} value={s.params.decoyBoost} onChange={(v) => setP({ decoyBoost: v }, 'decoys')} format={(v) => '+' + Math.round(v * 50) + '%'} hint="Extra decoys are made by the game factory, so the two-trait cap still holds." />
                <Slider label="Landmark prominence" min={0.6} max={1.6} value={s.params.landmarkProminence} onChange={(v) => setP({ landmarkProminence: v }, 'landmark')} format={(v) => '×' + v.toFixed(2)} />
                <Button small kind="ghost" onClick={() => setP({ crowdScale: 1, propScale: 1, varietyBias: 0, overlap: 0, foregroundEmphasis: 0, decoyBoost: 0, landmarkProminence: 1 })}>Reset to the game's layout</Button>
              </div>
            </Section>
            <Layers s={s} composed={composed} />
            <Inventory rt={rt} s={s} composed={composed} />
            {sel && <Inspector item={sel} s={s} onClear={() => setSelId(null)} />}
            <Section title="Scene record">
              <div className="flex flex-col gap-2.5">
                <Text label="Name" value={s.name} onChange={(v) => setS('name', v)} />
                <LinkList kind="decision" label="Related rules" ids={s.decisionIds} onChange={(v) => setS('decisionIds', v)} />
                <Button small kind="danger" onClick={async () => { if (await confirmAction('Delete scene?', 'Its iterations stay in the workspace but lose their scene.', 'Delete')) { useLab.getState().remove('scene', s.id); go('composer'); } }}>Delete scene</Button>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- canvas ----------
function SceneCanvas({ rt, s, composed, selId, onSelect, overlays, diag, apiRef }: { rt: Runtime; s: Scene; composed: Composed; selId: string | null; onSelect(id: string | null): void; overlays: Record<string, boolean>; diag: boolean; apiRef: React.MutableRefObject<{ snapshot(w: number): string | null; fit(): void } | null> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 0.25 });
  const [tick, setTick] = useState(0);
  const imgs = useRef(new Map<string, HTMLImageElement | 'loading'>());
  const ground = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ mode: 'pan' | 'move'; sx: number; sy: number; cam: Cam; id?: string; moved: number; ox?: number; oy?: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const b = composed.bounds;
  const layerOrder = useMemo(() => Object.fromEntries(Object.entries(s.layers).map(([k, v]) => [k, v.order])), [s.layers]);

  const fit = useCallback(() => { const z = Math.min(size.w / b.w, size.h / b.h); setCam({ x: b.x - (size.w / z - b.w) / 2, y: b.y - (size.h / z - b.h) / 2, z }); }, [size, b.x, b.y, b.w, b.h]);
  useEffect(() => { fit(); }, [b.y, b.h, size.w, size.h]); // eslint-disable-line
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(320, e.contentRect.width), h: Math.max(320, Math.min(760, e.contentRect.width * 0.62)) }));
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  // ground: rasterize once at half resolution, as the engine does
  useEffect(() => {
    let live = true;
    svgToImage(rt.assets.svg[composed.world.ground]).then((img) => {
      if (!live) return;
      const c = document.createElement('canvas'); c.width = composed.world.w * 0.5; c.height = composed.world.h * 0.5;
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); ground.current = c; setTick((t) => t + 1);
    });
    return () => { live = false; };
  }, [rt, composed.world.ground, composed.world.w, composed.world.h]);

  const hiRes = cam.z > 0.9 ? 2 : 1;
  const imgFor = useCallback((i: Item) => {
    const key = i.asset + '|' + JSON.stringify(i.colours) + JSON.stringify(i.kit ?? '') + JSON.stringify(i.kit2 ?? '') + '@' + hiRes;
    const got = imgs.current.get(key);
    if (got && got !== 'loading') return got;
    if (!got) {
      imgs.current.set(key, 'loading');
      const svg = entitySvg(rt, i);
      if (svg) svgToImage(upscaleSvg(svg, hiRes)).then((im) => { imgs.current.set(key, im); setTick((t) => t + 1); }, () => {});
    }
    return null;
  }, [rt, hiRes]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, c: Cam, W: number, H: number, forThumb = false) => {
    ctx.fillStyle = '#F6E7C8'; ctx.fillRect(0, 0, W, H);
    const L = s.layers;
    const toS = (x: number, y: number) => [(x - c.x) * c.z, (y - c.y) * c.z] as const;
    if (ground.current && L.background.visible) {
      ctx.globalAlpha = L.background.opacity;
      const [gx, gy] = toS(0, 0);
      ctx.drawImage(ground.current, gx, gy, composed.world.w * c.z, composed.world.h * c.z);
      ctx.globalAlpha = 1;
    }
    let list = composed.items;
    if (diag) list = [...list].sort((a, z) => (layerOrder[a.layer] ?? 0) - (layerOrder[z.layer] ?? 0) || a.y - z.y);
    const vx0 = c.x - 400, vx1 = c.x + W / c.z + 400, vy0 = c.y - 400, vy1 = c.y + H / c.z + 600;
    for (const i of list) {
      const ls = L[i.layer]; if (!ls?.visible) continue;
      if (i.x < vx0 - i.w || i.x > vx1 + i.w || i.y < vy0 || i.y > vy1 + i.h) continue;
      const im = imgFor(i); if (!im) continue;
      const off = dragOffset && dragOffset.id === i.id ? dragOffset : null;
      const r = itemRect(i);
      const [sx, sy] = toS(r.x + (off?.dx ?? 0), r.y + (off?.dy ?? 0));
      ctx.globalAlpha = ls.opacity;
      if (i.flip) { ctx.save(); ctx.translate(sx + r.w * c.z, sy); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, r.w * c.z, r.h * c.z); ctx.restore(); }
      else ctx.drawImage(im, sx, sy, r.w * c.z, r.h * c.z);
      ctx.globalAlpha = 1;
      if (!forThumb && i.origin !== 'game' && L.overlay.visible) { ctx.fillStyle = i.origin === 'lab-added' ? '#7C4DFF' : '#FFCA28'; ctx.fillRect(sx + r.w * c.z / 2 - 2, sy - 5, 4, 4); }
    }
    if (forThumb || !L.overlay.visible) return;
    const [bx, by] = toS(b.x, b.y);
    if (overlays.thirds) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]); for (const f of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(bx + b.w * c.z * f, by); ctx.lineTo(bx + b.w * c.z * f, by + b.h * c.z); ctx.moveTo(bx, by + b.h * c.z * f); ctx.lineTo(bx + b.w * c.z, by + b.h * c.z * f); ctx.stroke(); } ctx.setLineDash([]); }
    if (overlays.grid) { ctx.strokeStyle = 'rgba(43,29,22,0.15)'; ctx.lineWidth = 1; for (let x = 0; x <= composed.world.w; x += 100) { const [px] = toS(x, 0); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); } for (let y = Math.floor(c.y / 100) * 100; y < c.y + H / c.z; y += 100) { const [, py] = toS(0, y); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); } }
    if (overlays.labels) { ctx.font = '600 12px ui-sans-serif, system-ui'; for (const d of composed.world.districts) { const [, py] = toS(0, d.y0); ctx.fillStyle = 'rgba(62,39,35,0.75)'; ctx.fillRect(6, py + 6, ctx.measureText(d.name).width + 12, 20); ctx.fillStyle = '#FFFDF9'; ctx.fillText(d.name, 12, py + 20); ctx.strokeStyle = 'rgba(62,39,35,0.5)'; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); } }
    if (overlays.spots && window.WS?.districts) {
      ctx.strokeStyle = 'rgba(124,77,255,0.8)'; ctx.fillStyle = 'rgba(124,77,255,0.08)'; ctx.lineWidth = 1.5;
      for (const [id, fn] of Object.entries(window.WS.districts)) {
        const y0 = composed.world.districts.find((d) => d.id === id)?.y0 ?? 0;
        let spots: { x: number; y: number; r: number; id: string; d: string[] }[] = [];
        try { spots = (fn as (y?: number) => { spots: typeof spots })(y0).spots; } catch { spots = []; }
        for (const sp of spots) { const [px, py] = toS(sp.x, sp.y); ctx.beginPath(); ctx.ellipse(px, py, sp.r * c.z, sp.r * c.z * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (c.z > 0.15) { ctx.fillStyle = '#4527A0'; ctx.font = '11px ui-sans-serif'; ctx.fillText(sp.id + ' · ' + sp.d.join('/'), px + 4, py); ctx.fillStyle = 'rgba(124,77,255,0.08)'; } }
      }
    }
    if (overlays.beacon && composed.target) { const [px, py] = toS(composed.target.x, composed.target.y - composed.target.h / 2); ctx.strokeStyle = '#FF6F61'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, Math.max(14, composed.target.h * c.z), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#FF6F61'; ctx.font = '700 11px ui-sans-serif'; ctx.fillText('TARGET (debug)', px + 16, py - 16); }
    if (selId) { const it = composed.items.find((i) => i.id === selId); if (it) { const r = itemRect(it); const off = dragOffset?.id === it.id ? dragOffset : null; const [sx, sy] = toS(r.x + (off?.dx ?? 0), r.y + (off?.dy ?? 0)); ctx.strokeStyle = '#FF6F61'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(sx - 2, sy - 2, r.w * c.z + 4, r.h * c.z + 4); ctx.setLineDash([]); } }
  }, [s.layers, composed, diag, layerOrder, imgFor, overlays, selId, dragOffset, b]);

  useEffect(() => {
    const c = cv.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr; c.height = size.h * dpr;
    const ctx = c.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingQuality = 'high';
    draw(ctx, cam, size.w, size.h);
  }, [draw, cam, size, tick]);

  apiRef.current = {
    fit,
    snapshot(w: number) {
      const h = Math.round(w * (b.h / b.w));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const z = w / b.w; draw(c.getContext('2d')!, { x: b.x, y: b.y, z }, w, h, true);
      try { return c.toDataURL('image/jpeg', 0.82); } catch { return null; }
    },
  };

  const toWorld = (e: React.PointerEvent | React.WheelEvent) => { const r = cv.current!.getBoundingClientRect(); return { x: cam.x + (e.clientX - r.left) / cam.z, y: cam.y + (e.clientY - r.top) / cam.z }; };
  const hit = (wx: number, wy: number) => {
    for (let n = composed.items.length - 1; n >= 0; n--) {
      const i = composed.items[n]; const ls = s.layers[i.layer]; if (!ls?.visible || ls.locked) continue;
      const r = itemRect(i); if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) return i;
    }
    return null;
  };
  return (
    <div ref={wrap} className="relative">
      <canvas ref={cv} tabIndex={0} aria-label={`Composition canvas: ${DISTRICT_NAME[s.params.district]}, seed ${s.params.seed}. ${composed.metrics.people} people.`} role="img"
        style={{ width: size.w, height: size.h, touchAction: 'none' }} className="rounded-lg border border-line bg-[#F6E7C8] outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          const w = toWorld(e); const it = hit(w.x, w.y);
          if (it && it.id === selId) dragRef.current = { mode: 'move', sx: e.clientX, sy: e.clientY, cam, id: it.id, moved: 0 };
          else dragRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, cam, moved: 0 };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current; if (!d) return;
          const dx = e.clientX - d.sx, dy = e.clientY - d.sy; d.moved = Math.max(d.moved, Math.hypot(dx, dy));
          if (d.mode === 'pan') setCam({ ...d.cam, x: d.cam.x - dx / cam.z, y: d.cam.y - dy / cam.z });
          else if (d.moved >= 4) setDragOffset({ id: d.id!, dx: dx / cam.z, dy: dy / cam.z });
        }}
        onPointerUp={(e) => {
          const d = dragRef.current; dragRef.current = null;
          if (!d) return;
          if (d.moved < 6) { const w = toWorld(e); onSelect(hit(w.x, w.y)?.id ?? null); setDragOffset(null); return; }
          if (d.mode === 'move' && dragOffset) {
            const off = dragOffset; setDragOffset(null);
            mutate('move sprite', (w) => { const m = w.scenes[s.id].moved[off.id] ?? { dx: 0, dy: 0 }; w.scenes[s.id].moved[off.id] = { dx: Math.round(m.dx + off.dx), dy: Math.round(m.dy + off.dy) }; w.scenes[s.id].updatedAt = now(); });
          }
        }}
        onWheel={(e) => { const w = toWorld(e); const z = Math.max(0.04, Math.min(4, cam.z * Math.exp(-e.deltaY * 0.0015))); setCam({ z, x: w.x - (w.x - cam.x) * cam.z / z, y: w.y - (w.y - cam.y) * cam.z / z }); }}
        onKeyDown={(e) => {
          const step = 80 / cam.z;
          if (e.key === 'ArrowLeft') setCam({ ...cam, x: cam.x - step }); else if (e.key === 'ArrowRight') setCam({ ...cam, x: cam.x + step });
          else if (e.key === 'ArrowUp') setCam({ ...cam, y: cam.y - step }); else if (e.key === 'ArrowDown') setCam({ ...cam, y: cam.y + step });
          else if (e.key === '+' || e.key === '=') setCam({ ...cam, z: Math.min(4, cam.z * 1.25) }); else if (e.key === '-') setCam({ ...cam, z: Math.max(0.04, cam.z / 1.25) });
          else if (e.key === '0') fit();
          else if ((e.key === 'Delete' || e.key === 'Backspace') && selId) { mutate('remove sprite', (w) => { w.scenes[s.id].removed.push(selId); }); onSelect(null); }
          else return;
          e.preventDefault();
        }} />
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button aria-label="Zoom in" className="h-8 w-8 rounded bg-cream/95 text-[16px] shadow" onClick={() => setCam({ ...cam, z: Math.min(4, cam.z * 1.25) })}>+</button>
        <button aria-label="Zoom out" className="h-8 w-8 rounded bg-cream/95 text-[16px] shadow" onClick={() => setCam({ ...cam, z: Math.max(0.04, cam.z / 1.25) })}>−</button>
        <button aria-label="Fit" className="h-8 w-8 rounded bg-cream/95 text-[11px] shadow" onClick={fit}>Fit</button>
      </div>
      <p className="absolute bottom-2 left-2 rounded bg-cocoa/80 px-2 py-0.5 font-mono text-[11px] text-cream">{round(cam.z / 0.4, 2)}× game zoom · {round(cam.z, 3)} px/unit</p>
      <p className="absolute bottom-2 right-2 rounded bg-cream/90 px-2 py-0.5 text-[10.5px]"><span className="mr-1 inline-block h-2 w-2 bg-gold" />lab change <span className="ml-2 mr-1 inline-block h-2 w-2 bg-violet" />lab-added</p>
    </div>
  );
}

function Layers({ s, composed }: { s: Scene; composed: Composed }) {
  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const i of composed.items) c[i.layer] = (c[i.layer] ?? 0) + 1; return c; }, [composed]);
  const ordered = [...LAYERS].sort((a, b) => s.layers[a[0]].order - s.layers[b[0]].order);
  const setL = (id: LayerId, patch: Partial<Scene['layers'][string]>) => mutate('layer ' + id, (d) => { Object.assign(d.scenes[s.id].layers[id], patch); });
  const move = (idx: number, dir: -1 | 1) => { const a = ordered[idx][0], b = ordered[idx + dir]?.[0]; if (!b) return; mutate('layer order', (d) => { const L = d.scenes[s.id].layers; const t = L[a].order; L[a].order = L[b].order; L[b].order = t; }); };
  return (
    <Section title="Layers">
      <ol className="flex flex-col gap-0.5">
        {ordered.map(([id, label], idx) => {
          const l = s.layers[id];
          return (
            <li key={id} className="flex items-center gap-1.5 text-[12px]">
              <input type="checkbox" aria-label={`Show ${label}`} checked={l.visible} onChange={(e) => setL(id, { visible: e.target.checked })} className="accent-[#C86D51]" />
              <span className={`flex-1 truncate ${l.visible ? '' : 'text-muted line-through'}`}>{label} <span className="text-muted">{id === 'background' ? '' : counts[id] ?? 0}</span></span>
              <input type="range" aria-label={`${label} opacity`} min={0} max={1} step={0.1} value={l.opacity} onChange={(e) => setL(id, { opacity: Number(e.target.value) })} className="w-14" />
              <button aria-label={l.locked ? `Unlock ${label}` : `Lock ${label}`} aria-pressed={l.locked} onClick={() => setL(id, { locked: !l.locked })} className={`w-5 ${l.locked ? 'text-cocoa' : 'text-muted/60'}`}>{l.locked ? '🔒' : '🔓'}</button>
              <button aria-label={`Move ${label} up`} onClick={() => move(idx, -1)} disabled={!idx} className="text-muted disabled:opacity-20">▲</button>
              <button aria-label={`Move ${label} down`} onClick={() => move(idx, 1)} disabled={idx === ordered.length - 1} className="text-muted disabled:opacity-20">▼</button>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function Inventory({ rt, s, composed }: { rt: Runtime; s: Scene; composed: Composed }) {
  const [q, setQ] = useState('');
  const groups: [string, RegExp][] = [['Landmarks', /^props\/landmarks|^environments\/forsyth\/fountain/], ['Vegetation', /^props\/vegetation/], ['Props', /^props\/(furniture|market|festival|food|vehicles|river)|^effects/], ['Animals', /^props\/animals/], ['Characters', /^characters\/(archetypes|bodies)/]];
  const ids = Object.keys(rt.assets.meta).filter((a) => !/ground|parts\//.test(a) && rt.assets.meta[a].layer !== 'far' && a.includes(q));
  function add(assetId: string) {
    const cx = composed.bounds.x + composed.bounds.w / 2, cy = composed.bounds.y + composed.bounds.h / 2;
    const id = uid('add');
    mutate('add sprite', (d) => { d.scenes[s.id].added.push({ id, assetId, x: Math.round(cx), y: Math.round(cy), k: assetId.startsWith('characters/') ? 0.8 : 1, flip: 0, layer: 'world' }); d.scenes[s.id].updatedAt = now(); });
    toast('Added at the centre of the district. Click it, then drag to place.');
  }
  return (
    <aside className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto rounded-lg border border-line bg-cream p-3">
      <p className="font-display text-[16px]">Asset and landmark inventory</p>
      <input aria-label="Filter inventory" className="input py-1 text-[12px]" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
      {groups.map(([label, re]) => {
        const list = ids.filter((a) => re.test(a));
        if (!list.length) return null;
        return (
          <div key={label}>
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
            <ul className="flex flex-col">{list.map((a) => <li key={a}><button onClick={() => add(a)} className="w-full truncate rounded px-1.5 py-0.5 text-left text-[12px] hover:bg-sand" title={'Add ' + a}>+ {a.split('/').pop()}</button></li>)}</ul>
          </div>
        );
      })}
      <p className="text-[11px] text-muted">Added sprites are lab-only and marked in violet on the canvas.</p>
    </aside>
  );
}

function Inspector({ item, s, onClear }: { item: Item; s: Scene; onClear(): void }) {
  const added = s.added.find((a) => a.id === item.id);
  const moved = s.moved[item.id];
  return (
    <Section title="Selected sprite" actions={<button className="text-[12px] text-muted" onClick={onClear}>Clear</button>}>
      <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-[12.5px]">
        <dt className="text-muted">Asset</dt><dd className="truncate font-mono text-[11.5px]"><a className="underline" href={href('assets', 'ast_' + item.asset.replace(/[^a-z0-9]+/gi, '_'))}>{item.asset}</a></dd>
        <dt className="text-muted">Origin</dt><dd>{item.origin === 'game' ? 'Game layout' : item.origin === 'lab-added' ? 'Added in the lab' : item.origin === 'lab-swap' ? 'Lab swap/decoy (simulated)' : 'Lab duplicate (simulated)'}</dd>
        <dt className="text-muted">Layer</dt><dd>{LAYERS.find((l) => l[0] === item.layer)?.[1]}</dd>
        <dt className="text-muted">Position</dt><dd className="tabular-nums">{Math.round(item.x)}, {Math.round(item.y)}{moved ? ` (moved ${moved.dx}, ${moved.dy})` : ''}</dd>
        {item.story && <><dt className="text-muted">Story</dt><dd>{item.story}</dd></>}
        {item.zone && <><dt className="text-muted">Zone</dt><dd>{item.zone}</dd></>}
        {item.kind === 'person' && <><dt className="text-muted">Target traits</dt><dd>{item.isTarget ? 'all five (target)' : item.traits.join(', ') || 'none'}</dd></>}
      </dl>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {moved && <Button small onClick={() => mutate('reset move', (d) => { delete d.scenes[s.id].moved[item.id]; })}>Reset position</Button>}
        {added && <Button small onClick={() => mutate('flip', (d) => { const a = d.scenes[s.id].added.find((x) => x.id === item.id)!; a.flip = a.flip ? 0 : 1; })}>Flip</Button>}
        {added && <Button small onClick={() => mutate('scale', (d) => { const a = d.scenes[s.id].added.find((x) => x.id === item.id)!; a.k = round(a.k * 1.15, 3); })}>Larger</Button>}
        {added && <Button small onClick={() => mutate('scale', (d) => { const a = d.scenes[s.id].added.find((x) => x.id === item.id)!; a.k = round(a.k / 1.15, 3); })}>Smaller</Button>}
        {!item.isTarget && <Button small kind="danger" onClick={() => { mutate('remove sprite', (d) => { if (added) d.scenes[s.id].added = d.scenes[s.id].added.filter((x) => x.id !== item.id); else d.scenes[s.id].removed.push(item.id); }); onClear(); }}>Remove</Button>}
      </div>
      {item.isTarget && <p className="mt-2 text-[11.5px] text-muted">The target cannot be removed: every playable scene has exactly one.</p>}
      {s.removed.length > 0 && <Button small kind="ghost" onClick={() => mutate('restore removed', (d) => { d.scenes[s.id].removed = []; })}>Restore {s.removed.length} removed sprite(s)</Button>}
    </Section>
  );
}

function Timeline({ s, its, restore, exportParams }: { s: Scene; its: SceneIteration[]; restore(i: SceneIteration): void; exportParams(i: SceneIteration): void }) {
  const set = (k: 'baselineIterationId' | 'preferredIterationId', v: string) => mutate(k, (d) => { d.scenes[s.id][k] = v; logActivity(d, k === 'preferredIterationId' ? 'Marked preferred composition' : 'Marked baseline composition', { kind: 'iteration', id: v }); });
  return (
    <div className="rounded-lg border border-line bg-cream p-3">
      <p className="mb-2 flex items-center justify-between text-[12px] font-semibold">Iteration history <span className="font-normal text-muted">{its.length} saved</span></p>
      {its.length === 0 ? <p className="text-[12.5px] text-muted">Nothing saved yet. Save the game's own layout first: it becomes the baseline every density experiment is compared against.</p> : (
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {its.map((it) => (
            <li key={it.id} className={`w-48 shrink-0 rounded-md border p-1.5 ${s.preferredIterationId === it.id ? 'border-moss ring-1 ring-moss' : 'border-line'}`}>
              {it.thumbnail ? <img src={it.thumbnail} alt={it.name} className="h-24 w-full rounded object-cover" /> : <div className="h-24 rounded bg-sand" />}
              <p className="mt-1 truncate text-[11.5px] font-medium" title={it.name}>{it.name}</p>
              <p className="text-[10.5px] text-muted">{s.baselineIterationId === it.id ? 'Baseline · ' : ''}{s.preferredIterationId === it.id ? 'Preferred ★ · ' : ''}{it.metrics?.people} people</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <button className="text-[11px] underline" onClick={() => restore(it)}>Load</button>
                <button className="text-[11px] underline" onClick={() => set('baselineIterationId', it.id)}>Baseline</button>
                <button className="text-[11px] underline" onClick={() => set('preferredIterationId', it.id)}>Prefer</button>
                <button className="text-[11px] underline" onClick={() => exportParams(it)}>Export</button>
                <button className="text-[11px] text-muted underline" onClick={async () => { if (await confirmAction('Delete iteration?', it.name, 'Delete')) useLab.getState().remove('iteration', it.id); }}>Delete</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CompareIterations({ s, its, exportParams }: { s: Scene; its: SceneIteration[]; exportParams(i: SceneIteration): void }) {
  const [a, setA] = useState(s.baselineIterationId ?? its[0]?.id ?? '');
  const [b, setB] = useState(its.find((i) => i.id !== a)?.id ?? '');
  const A = its.find((i) => i.id === a), B = its.find((i) => i.id === b);
  if (its.length < 2) return <Empty title="Save at least two iterations to compare">Save the baseline, change the density settings, then save again.</Empty>;
  const rows: [keyof SceneMetrics, string, (v: number) => string][] = [['people', 'People', (v) => String(v)], ['props', 'Props', (v) => String(v)], ['stories', 'Stories', (v) => String(v)], ['emptyShare', 'Empty share', (v) => Math.round(v * 100) + '%'], ['colourCount', 'Top colours', (v) => String(v)], ['decoys', 'Decoys', (v) => String(v)], ['targetOcclusion', 'Target hidden (alpha sampled)', (v) => Math.round(v * 100) + '%'], ['difficultyScore', 'Difficulty index (tentative)', (v) => v.toFixed(2)]];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {([[a, setA, A], [b, setB, B]] as const).map(([v, setV, it], n) => (
          <div key={n} className="flex flex-col gap-2">
            <select aria-label={n ? 'Right iteration' : 'Left iteration'} className="input" value={v} onChange={(e) => setV(e.target.value)}>{its.map((i) => <option key={i.id} value={i.id}>{i.name}{s.baselineIterationId === i.id ? ' (baseline)' : ''}</option>)}</select>
            {it?.thumbnail ? <img src={it.thumbnail} alt={it.name} className="w-full rounded-lg border border-line" /> : <div className="h-48 rounded bg-sand" />}
            {it && <p className="text-[12px] text-muted">Seed {it.params.seed} · {DISTRICT_NAME[it.params.district]} · {it.params.density} · crowd ×{it.params.crowdScale} · variety {it.params.varietyBias} · clustering {it.params.overlap}</p>}
            {it && <div className="flex gap-1.5"><Button small kind={s.preferredIterationId === it.id ? 'primary' : 'secondary'} onClick={() => mutate('prefer', (d) => { d.scenes[s.id].preferredIterationId = it.id; logActivity(d, `Preferred composition: ${it.name}`, { kind: 'iteration', id: it.id }); })}>{s.preferredIterationId === it.id ? '★ Preferred' : 'Prefer this composition'}</Button><Button small onClick={() => exportParams(it)}>Export parameters</Button></div>}
          </div>
        ))}
      </div>
      {A?.metrics && B?.metrics && (
        <table className="w-full max-w-2xl text-[13px]">
          <thead><tr className="text-left text-[11.5px] uppercase tracking-wide text-muted"><th className="py-1">Metric</th><th>Left</th><th>Right</th><th>Change</th></tr></thead>
          <tbody>{rows.map(([k, l, f]) => { const x = A.metrics![k] as number | null, y = B.metrics![k] as number | null; return <tr key={k} className="border-t border-line"><td className="py-1">{l}</td><td className="tabular-nums">{x == null ? '—' : f(x)}</td><td className="tabular-nums">{y == null ? '—' : f(y)}</td><td className="tabular-nums text-muted">{x == null || y == null ? '' : (y - x > 0 ? '+' : '') + (k === 'emptyShare' || k === 'targetOcclusion' ? Math.round((y - x) * 100) + ' pts' : k === 'difficultyScore' ? (y - x).toFixed(2) : String(y - x))}</td></tr>; })}</tbody>
        </table>
      )}
      <Area label="Why the preferred composition is preferred" value={(s.preferredIterationId && its.find((i) => i.id === s.preferredIterationId)?.note) || ''} onChange={(v) => s.preferredIterationId && mutate('iteration note', (d) => { d.iterations[s.preferredIterationId!].note = v; })} hint={s.preferredIterationId ? undefined : 'Prefer one composition first.'} />
      <p className="text-[12px] text-muted">To compare against an actual screenshot of the game, capture it in the Live game tab and use Comparison Studio.</p>
    </div>
  );
}

function LiveGame({ s, rt }: { s: Scene; rt: Runtime }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const v1 = PRESETS[s.preset]?.live === 'v1';
  const [which, setWhich] = useState<'game' | 'v1'>(v1 ? 'v1' : 'game');
  const [info, setInfo] = useState<string | null>(null);
  const q = new URLSearchParams({ seed: s.params.seed, scene: 'savannah', difficulty: s.params.difficulty, density: s.params.density });
  if (s.params.crowd) q.set('crowd', String(s.params.crowd));
  const src = which === 'game' ? `${import.meta.env.BASE_URL}repo/build/index.html?${q}` : `${import.meta.env.BASE_URL}repo/v1/index.html?seed=${encodeURIComponent(s.params.seed)}`;
  function centre() {
    try {
      const W = (frame.current?.contentWindow as Window & { WS?: { game?: { engine?: { camera: { centerOn(x: number, y: number): void } }; world?: { districts: { id: string; y0: number; h: number }[] } } } })?.WS;
      const d = W?.game?.world?.districts.find((x) => x.id === s.params.district);
      if (!W?.game?.engine || !d) { setInfo('The game has not finished loading, or this district is not in the world.'); return; }
      W.game.engine.camera.centerOn(1600, d.y0 + d.h / 2); setInfo('Centred on ' + DISTRICT_NAME[s.params.district] + '.');
    } catch (e) { setInfo('Could not reach the game frame: ' + String(e)); }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs label="Which build" value={which} onChange={(v) => setWhich(v as "game" | "v1")} tabs={[{ value: 'game', label: 'Current illustrated build' }, { value: 'v1', label: 'Version 1 (archived)' }]} />
        {which === 'game' && <Button small onClick={centre}>Centre on {DISTRICT_NAME[s.params.district]}</Button>}
        <a className="text-[12px] underline" href={src} target="_blank" rel="noreferrer">Open in a new tab</a>
        <span className="text-[12px] text-muted">Art version {rt.assets.artVersion}. The real renderer, running from the lab's copy of build/.</span>
      </div>
      {which === 'v1' && <p className="rounded bg-gold/20 p-2 text-[12px]">Version 1 loads Google Fonts (docs/audit.md §4), so it makes external requests. Its seed generator differs, so the layout is not comparable seed-for-seed with the current build.</p>}
      {info && <p className="text-[12px] text-muted">{info}</p>}
      <iframe ref={frame} key={src} title={which === 'game' ? 'Current game' : 'Version 1 game'} src={src} className="h-[72vh] w-full rounded-lg border border-line bg-white" />
    </div>
  );
}
