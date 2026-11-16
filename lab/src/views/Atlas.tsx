import { useEffect, useMemo, useRef, useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Kv, Num, PageHeader, Section, Select, StatusBadge, StatusSelect, Tabs, Text, Toggle } from '../components/ui';
import { LinkList } from '../components/links';
import { RuntimeError, useRuntime } from '../components/sprites';
import { svgToImage, type Runtime } from '../lib/runtime';
import { buildWorld, DISTRICT_NAME } from '../lib/compose';
import { DEFAULT_PARAMS } from '../seed/seed';
import { href, setQuery, useRoute } from '../lib/router';
import { now, uid } from '../lib/util';
import { snapshot } from '../seed/snapshot';
import type { Landmark, StoryMoment, Zone, ZoneKind } from '../types';

const ZONE_STYLE: Record<ZoneKind, string> = { boundary: '#3E2723', entrance: '#00A152', path: '#C86D51', crowd: '#1E88E5', 'prop-restriction': '#B3261E', hiding: '#7C4DFF', 'occlusion-review': '#FFB300' };
const ZONE_LABEL: Record<ZoneKind, string> = { boundary: 'Spatial boundary', entrance: 'Entrance', path: 'Path', crowd: 'Crowd movement zone', 'prop-restriction': 'Prop restriction', hiding: 'Target hiding zone', 'occlusion-review': 'Occlusion review' };

const BRIEF_DISTRICTS = [
  { key: 'A', name: 'SCAD Poetter Hall', focus: 'Red-brick architecture, students, visitors, academic activity.', current: null, note: 'Not in the current build. v1 had it as two boxes. Needs a district or a deliberate decision to drop it.' },
  { key: 'B', name: 'Forsyth Park Fountain', focus: 'Fountain, walking paths, trees, outdoor activities, park visitors.', current: 'forsyth', note: 'Built (y 4300–6700). Checkpoint 2 scene.' },
  { key: 'C', name: 'Factors Walk & River Street', focus: 'Historic warehouses, iron bridges, stairs, riverfront movement, tourists.', current: 'riverfront', note: 'Built as River Street (y 0–1500), warehouses drawn from the Bay Street side.' },
  { key: 'D', name: 'Festival Pier & Squares', focus: 'The stylised festival environment.', current: 'squares', note: 'Split in the build: the pier is part of River Street; the two squares are their own district. The festival is composite or invented, not a verified Savannah landmark.' },
] as const;

export default function Atlas() {
  const ws = useWs();
  const route = useRoute();
  const { rt, err } = useRuntime();
  const tab = route.q.get('tab') ?? 'map';
  const sel = route.id ? (ws.landmarks[route.id] ? { kind: 'landmark' as const, id: route.id } : ws.zones[route.id] ? { kind: 'zone' as const, id: route.id } : ws.stories[route.id] ? { kind: 'story' as const, id: route.id } : null) : null;
  return (
    <div>
      <PageHeader eyebrow="Savannah Atlas" title="Landmarks, districts and story moments" lede="One continuous 3200 × 6700 world, north at the top (docs/savannah-blueprint.md). Each landmark keeps its own provenance and says whether it is a real place, a composite, or still unresearched.">
        <Tabs label="Atlas" value={tab} onChange={(t) => setQuery('tab', t)} tabs={[{ value: 'map', label: 'Map' }, { value: 'districts', label: 'Districts' }, { value: 'stories', label: 'Story moments' }]} />
      </PageHeader>
      {err && <RuntimeError err={err} />}
      {tab === 'map' && rt && <MapView rt={rt} sel={sel} />}
      {tab === 'districts' && <Districts />}
      {tab === 'stories' && <Stories selId={sel?.kind === 'story' ? sel.id : null} />}
    </div>
  );
}

function MapView({ rt, sel }: { rt: Runtime; sel: { kind: 'landmark' | 'zone' | 'story'; id: string } | null }) {
  const ws = useWs();
  const world = useMemo(() => buildWorld(rt, DEFAULT_PARAMS), [rt]);
  const [img, setImg] = useState<string | null>(null);
  const [show, setShow] = useState({ spots: true, stories: true, zones: true, landmarks: true });
  const [draw, setDraw] = useState<ZoneKind | null>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number; move?: string; ox?: number; oy?: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let live = true;
    svgToImage(rt.assets.svg[world.ground]).then((im) => {
      const c = document.createElement('canvas'); c.width = 640; c.height = 1340; c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      if (live) setImg(c.toDataURL('image/jpeg', 0.8));
    });
    return () => { live = false; };
  }, [rt, world.ground]);
  const spots = useMemo(() => Object.entries(window.WS?.districts ?? {}).flatMap(([id, fn]) => { const y0 = world.districts.find((d) => d.id === id)?.y0 ?? 0; try { return (fn as (y?: number) => { spots: { id: string; x: number; y: number; r: number; d: string[] }[] })(y0).spots.map((s) => ({ ...s, district: id })); } catch { return []; } }), [world]);
  const stories = useMemo(() => { const m = new Map<string, { x: number; y: number; n: number }>(); for (const e of world.entities) if (e.story) { const s = m.get(e.story) ?? { x: 0, y: 0, n: 0 }; s.x += e.x; s.y += e.y; s.n++; m.set(e.story, s); } return [...m].map(([id, s]) => ({ id, x: s.x / s.n, y: s.y / s.n, n: s.n })); }, [world]);
  const pt = (e: React.PointerEvent) => { const p = svgRef.current!.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const r = p.matrixTransform(svgRef.current!.getScreenCTM()!.inverse()); return { x: Math.round(r.x), y: Math.round(r.y) }; };
  const landmarks = Object.values(ws.landmarks).filter((l) => l.inBuild || l.w > 0);
  const zones = Object.values(ws.zones);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          {(['landmarks', 'zones', 'spots', 'stories'] as const).map((k) => <Toggle key={k} label={{ landmarks: 'Landmarks', zones: 'Zones', spots: 'Game hiding spots', stories: 'Game stories' }[k]} checked={show[k]} onChange={(v) => setShow({ ...show, [k]: v })} />)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted">Draw zone:</span>
          {(Object.keys(ZONE_LABEL) as ZoneKind[]).map((k) => <button key={k} aria-pressed={draw === k} onClick={() => setDraw(draw === k ? null : k)} className={`rounded border px-1.5 py-0.5 text-[11px] ${draw === k ? 'border-cocoa bg-cocoa text-cream' : 'border-line bg-cream'}`}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: ZONE_STYLE[k] }} />{ZONE_LABEL[k]}</button>)}
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-[#F6E7C8]">
          <svg ref={svgRef} viewBox={`0 0 ${world.w} ${world.h}`} className="block w-full" style={{ cursor: draw ? 'crosshair' : 'default', touchAction: 'none' }} role="img" aria-label="Map of the game world with landmarks, zones and hiding spots"
            onPointerDown={(e) => { if (!draw) return; const p = pt(e); setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); (e.target as Element).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => { if (!drag) return; const p = pt(e); setDrag({ ...drag, x1: p.x, y1: p.y }); }}
            onPointerUp={() => {
              if (!drag) return;
              if (drag.move) { const dx = drag.x1 - drag.x0, dy = drag.y1 - drag.y0; const id = drag.move; if (Math.abs(dx) + Math.abs(dy) > 4) mutate('move on map', (d) => { const r = d.landmarks[id] ?? d.zones[id]; if (r) { r.x += dx; r.y += dy; r.updatedAt = now(); } }); setDrag(null); return; }
              const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1), w = Math.abs(drag.x1 - drag.x0), h = Math.abs(drag.y1 - drag.y0);
              setDrag(null);
              if (w < 40 || h < 20 || !draw) return;
              const id = uid('zon'); const dist = world.districts.find((d) => y + h / 2 >= d.y0 && y + h / 2 < d.y0 + d.h)?.id ?? 'all';
              mutate('new zone', (d) => { d.zones[id] = { id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Drawn in the Atlas', rationale: null, tags: [], name: ZONE_LABEL[draw], kind: draw, district: dist, x, y, w, h, note: '' }; logActivity(d, 'Drew a zone in the Atlas', { kind: 'zone', id }); });
              location.hash = href('atlas', id);
            }}>
            {img && <image href={img} x={0} y={0} width={world.w} height={world.h} />}
            {world.districts.map((d) => <g key={d.id}><line x1={0} x2={world.w} y1={d.y0} y2={d.y0} stroke="#3E2723" strokeWidth={6} strokeDasharray="30 20" opacity={0.6} /><text x={40} y={d.y0 + 120} fontSize={110} fontFamily="Georgia, serif" fill="#3E2723" stroke="#FFFDF9" strokeWidth={14} paintOrder="stroke">{d.name}</text></g>)}
            {show.spots && spots.map((s) => <ellipse key={s.district + s.id} cx={s.x} cy={s.y} rx={s.r} ry={s.r * 0.5} fill="rgba(124,77,255,0.12)" stroke="#7C4DFF" strokeWidth={6}><title>{`Hiding spot ${s.id} (${s.d.join(', ')})`}</title></ellipse>)}
            {show.stories && stories.map((s) => <circle key={s.id} cx={s.x} cy={s.y} r={26} fill="#FFCA28" stroke="#3E2723" strokeWidth={5}><title>{`Story: ${s.id} (${s.n} sprites)`}</title></circle>)}
            {show.zones && zones.map((z) => <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} fill={ZONE_STYLE[z.kind]} fillOpacity={sel?.id === z.id ? 0.3 : 0.14} stroke={ZONE_STYLE[z.kind]} strokeWidth={sel?.id === z.id ? 14 : 8} strokeDasharray={z.kind === 'prop-restriction' ? '24 14' : undefined} className="cursor-move"
              onPointerDown={(e) => { if (draw) return; e.stopPropagation(); const p = pt(e); setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y, move: z.id }); (e.target as Element).setPointerCapture?.(e.pointerId); }}
              onClick={() => { location.hash = href('atlas', z.id); }}><title>{z.name}</title></rect>)}
            {show.landmarks && landmarks.map((l) => (
              <g key={l.id} className="cursor-move" onClick={() => { location.hash = href('atlas', l.id); }}
                onPointerDown={(e) => { if (draw) return; e.stopPropagation(); const p = pt(e); setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y, move: l.id }); (e.target as Element).setPointerCapture?.(e.pointerId); }}>
                <rect x={l.x - l.w / 2 + (drag?.move === l.id ? drag.x1 - drag.x0 : 0)} y={l.y - l.h + (drag?.move === l.id ? drag.y1 - drag.y0 : 0)} width={l.w} height={l.h} fill="none" stroke={l.status === 'Verified' ? '#3F6B3A' : l.status === 'Needs research' ? '#7C4DFF' : '#C86D51'} strokeWidth={sel?.id === l.id ? 18 : 10} strokeDasharray={l.composite ? '40 20' : undefined} />
                <text x={l.x - l.w / 2 + 10} y={l.y - l.h - 16} fontSize={70} fontWeight={700} fill="#3E2723" stroke="#FFFDF9" strokeWidth={10} paintOrder="stroke">{l.name}</text>
              </g>
            ))}
            {drag && !drag.move && <rect x={Math.min(drag.x0, drag.x1)} y={Math.min(drag.y0, drag.y1)} width={Math.abs(drag.x1 - drag.x0)} height={Math.abs(drag.y1 - drag.y0)} fill="none" stroke="#3E2723" strokeWidth={8} strokeDasharray="20 12" />}
          </svg>
        </div>
        <p className="text-[11.5px] text-muted">Ground: the game's own <span className="font-mono">environments/savannah/ground</span>. Hiding spots and stories are read live from the scene code and the SAV-2026 build. Landmark outlines: solid means verified, dashed means composite. Drag landmarks and zones to move them.</p>
      </div>
      <div className="flex flex-col gap-4">
        {sel?.kind === 'landmark' && <LandmarkEditor key={sel.id} l={ws.landmarks[sel.id]} />}
        {sel?.kind === 'zone' && <ZoneEditor key={sel.id} z={ws.zones[sel.id]} />}
        <Section title={`Landmarks (${Object.keys(ws.landmarks).length})`} actions={<Button small onClick={() => { const id = uid('lmk'); mutate('new landmark', (d) => { d.landmarks[id] = { id, createdAt: now(), updatedAt: now(), status: 'Needs research', source: null, rationale: null, tags: [], name: 'New landmark', district: 'forsyth', x: 1600, y: 5000, w: 300, h: 200, scale: 1, depthLayer: 60, assetId: null, inBuild: false, composite: false, history: '', composition: '', referenceIds: [] }; }); location.hash = href('atlas', id); }}>+ Landmark</Button>}>
          <ul className="grid gap-2 md:grid-cols-2">
            {Object.values(ws.landmarks).map((l) => (
              <li key={l.id}><a href={href('atlas', l.id)} className={`block rounded-md border p-2.5 ${sel?.id === l.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}>
                <p className="flex items-start justify-between gap-2 text-[13.5px] font-medium">{l.name}<StatusBadge status={l.status} small /></p>
                <p className="text-[11.5px] text-muted">{DISTRICT_NAME[l.district] ?? 'Not placed'} · {l.inBuild ? 'in the build' : 'not in the build'}{l.composite ? ' · composite / invented' : ''}</p>
                <p className="mt-1 line-clamp-2 text-[12px] text-muted">{l.history}</p>
              </a></li>
            ))}
          </ul>
        </Section>
        <Section title={`Zones (${zones.length})`}>
          {zones.length ? <ul className="flex flex-col gap-1">{zones.map((z) => <li key={z.id}><a className="flex items-center gap-2 text-[13px] hover:underline" href={href('atlas', z.id)}><span className="h-2.5 w-2.5 rounded-full" style={{ background: ZONE_STYLE[z.kind] }} />{z.name} <span className="text-muted">· {DISTRICT_NAME[z.district] ?? z.district}</span></a></li>)}</ul> : <p className="text-[13px] text-muted">No zones yet. Pick a zone type above and drag on the map.</p>}
        </Section>
      </div>
    </div>
  );
}

function LandmarkEditor({ l }: { l: Landmark }) {
  const set = <K extends keyof Landmark>(k: K, v: Landmark[K]) => mutate(`landmark ${l.id} ${String(k)}`, (d) => { (d.landmarks[l.id] as Landmark)[k] = v; d.landmarks[l.id].updatedAt = now(); });
  return (
    <Section title={l.name} actions={<StatusBadge status={l.status} small />}>
      <div className="grid gap-3 md:grid-cols-2">
        <Text label="Name" value={l.name} onChange={(v) => set('name', v)} />
        <Select label="District" value={l.district} options={['riverfront', 'market', 'squares', 'forsyth', 'none'].map((d) => ({ value: d, label: DISTRICT_NAME[d] ?? 'Not placed' }))} onChange={(v) => set('district', v)} />
        <div className="grid grid-cols-4 gap-2 md:col-span-2">
          <Num label="X" value={l.x} onChange={(v) => set('x', v ?? 0)} /><Num label="Y" value={l.y} onChange={(v) => set('y', v ?? 0)} />
          <Num label="Width" value={l.w} onChange={(v) => set('w', v ?? 0)} /><Num label="Height" value={l.h} onChange={(v) => set('h', v ?? 0)} />
          <Num label="Scale" value={l.scale} step={0.05} onChange={(v) => set('scale', v ?? 1)} /><Num label="Depth layer" value={l.depthLayer} onChange={(v) => set('depthLayer', v ?? 60)} hint="Engine: 10 far, 60 sorted world" />
        </div>
        <StatusSelect value={l.status} onChange={(v) => set('status', v)} label="Verification" />
        <div className="flex flex-col gap-2 pt-5"><Toggle label="Composite or invented" checked={l.composite} onChange={(v) => set('composite', v)} /><Toggle label="Exists in the current build" checked={l.inBuild} onChange={(v) => set('inBuild', v)} /></div>
        <Area label="Historical accuracy notes" value={l.history} onChange={(v) => set('history', v)} className="md:col-span-2" />
        <Area label="Visual composition notes" value={l.composition} onChange={(v) => set('composition', v)} className="md:col-span-2" />
        <LinkList kind="reference" label="Architectural references" ids={l.referenceIds} onChange={(v) => set('referenceIds', v)} />
        <dl className="text-[12.5px]"><Kv k="Asset">{l.assetId ? <a className="font-mono underline" href={href('assets', 'ast_' + l.assetId.replace(/[^a-z0-9]+/gi, '_'))}>{l.assetId}</a> : 'none'}</Kv><Kv k="Source">{l.source ?? '—'}</Kv></dl>
        <Button small kind="danger" onClick={async () => { if (await confirmAction('Delete landmark?', l.name, 'Delete')) { useLab.getState().remove('landmark', l.id); location.hash = href('atlas'); } }}>Delete</Button>
      </div>
    </Section>
  );
}

function ZoneEditor({ z }: { z: Zone }) {
  const set = <K extends keyof Zone>(k: K, v: Zone[K]) => mutate(`zone ${z.id} ${String(k)}`, (d) => { (d.zones[z.id] as Zone)[k] = v; d.zones[z.id].updatedAt = now(); });
  return (
    <Section title={z.name} actions={<span className="text-[12px] text-muted">{ZONE_LABEL[z.kind]}</span>}>
      <div className="grid gap-3 md:grid-cols-2">
        <Text label="Name" value={z.name} onChange={(v) => set('name', v)} />
        <Select label="Kind" value={z.kind} options={(Object.keys(ZONE_LABEL) as ZoneKind[]).map((k) => ({ value: k, label: ZONE_LABEL[k] }))} onChange={(v) => set('kind', v)} />
        <div className="grid grid-cols-4 gap-2 md:col-span-2"><Num label="X" value={z.x} onChange={(v) => set('x', v ?? 0)} /><Num label="Y" value={z.y} onChange={(v) => set('y', v ?? 0)} /><Num label="Width" value={z.w} onChange={(v) => set('w', v ?? 0)} /><Num label="Height" value={z.h} onChange={(v) => set('h', v ?? 0)} /></div>
        <Area label="Note" value={z.note} onChange={(v) => set('note', v)} className="md:col-span-2" hint="Zones are planning annotations. The game's own zones and spots live in src/scenes/*.js." />
        <Button small kind="danger" onClick={() => { useLab.getState().remove('zone', z.id); location.hash = href('atlas'); }}>Delete zone</Button>
      </div>
    </Section>
  );
}

function Districts() {
  const ws = useWs();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {BRIEF_DISTRICTS.map((d) => {
        const doc = d.current ? snapshot.districts?.find((x) => x.source.includes(d.current!)) : null;
        const lms = Object.values(ws.landmarks).filter((l) => (d.key === 'A' ? l.id === 'lmk_poetter' : l.district === d.current || (d.key === 'D' && l.id === 'lmk_pier')));
        return (
          <Section key={d.key} title={<><span className="text-terracotta">District {d.key}.</span> {d.name}</>} actions={d.current ? <StatusBadge status="Verified" small /> : <StatusBadge status="Needs research" small />}>
            <p className="text-[13px]"><b>Brief focus:</b> {d.focus}</p>
            <p className="mt-1 text-[13px]"><b>In the current build:</b> {d.note}</p>
            {doc && <p className="mt-1 text-[12.5px] text-muted">y {doc.y0}–{doc.y1}: {doc.contents} <span className="font-mono">({doc.doc}:{doc.line})</span></p>}
            <ul className="mt-2 flex flex-wrap gap-1">{lms.map((l) => <li key={l.id}><a className="rounded border border-line px-1.5 py-0.5 text-[12px] hover:border-cocoa/50" href={href('atlas', l.id)}>{l.name}{l.composite ? ' (composite)' : ''}</a></li>)}</ul>
            <Area label="Planning notes" value={ws.auditNotes['district-' + d.key] ?? ''} onChange={(v) => mutate('district note', (w) => { w.auditNotes['district-' + d.key] = v; })} rows={2} className="mt-3" />
          </Section>
        );
      })}
      <Section title="City Market (in the build, not in the brief)">
        <p className="text-[13px]">{snapshot.districts?.find((x) => x.source.includes('market'))?.contents ?? 'Market district.'}</p>
      </Section>
    </div>
  );
}

function Stories({ selId }: { selId: string | null }) {
  const ws = useWs();
  const list = Object.values(ws.stories);
  const sel = selId ? ws.stories[selId] : null;
  const set = <K extends keyof StoryMoment>(id: string, k: K, v: StoryMoment[K]) => mutate(`story ${id} ${String(k)}`, (d) => { (d.stories[id] as StoryMoment)[k] = v; d.stories[id].updatedAt = now(); });
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <Section title="Story moments" actions={<Button small onClick={() => { const id = uid('sto'); mutate('new story', (d) => { d.stories[id] = { id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: d.project.owner || 'Owner', rationale: null, tags: [], title: 'New story moment', district: 'forsyth', description: '', characterIds: [], inBuild: false }; }); location.hash = href('atlas', id, { tab: 'stories' }); }}>+ Story</Button>}>
        <p className="mb-3 text-[12.5px] text-muted">Original scene ideas to add authored variety. The six seeded ones come from the brief and are not claims about the game. The stories the build already has are plotted on the Map tab.</p>
        <ul className="grid gap-2 md:grid-cols-2">
          {list.map((s) => <li key={s.id}><a href={href('atlas', s.id, { tab: 'stories' })} className={`block rounded-md border p-2.5 ${selId === s.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}><p className="flex items-start justify-between gap-2 text-[13.5px] font-medium">{s.title}<StatusBadge status={s.status} small /></p><p className="text-[11.5px] text-muted">{DISTRICT_NAME[s.district]} · {s.inBuild ? 'in the build' : 'idea'}</p></a></li>)}
        </ul>
      </Section>
      {sel && (
        <Section title={sel.title}>
          <div className="flex flex-col gap-3">
            <Text label="Title" value={sel.title} onChange={(v) => set(sel.id, 'title', v)} />
            <Select label="District" value={sel.district} options={['riverfront', 'market', 'squares', 'forsyth'].map((d) => ({ value: d, label: DISTRICT_NAME[d] }))} onChange={(v) => set(sel.id, 'district', v)} />
            <Area label="Description" value={sel.description} onChange={(v) => set(sel.id, 'description', v)} />
            <LinkList kind="character" label="Characters involved" ids={sel.characterIds} onChange={(v) => set(sel.id, 'characterIds', v)} />
            <StatusSelect value={sel.status} onChange={(v) => set(sel.id, 'status', v)} />
            <Toggle label="Implemented in the build" checked={sel.inBuild} onChange={(v) => set(sel.id, 'inBuild', v)} hint="Tick only after it exists in src/scenes/." />
            <Button small kind="danger" onClick={() => { useLab.getState().remove('story', sel.id); location.hash = href('atlas', null, { tab: 'stories' }); }}>Delete</Button>
          </div>
        </Section>
      )}
    </div>
  );
}
