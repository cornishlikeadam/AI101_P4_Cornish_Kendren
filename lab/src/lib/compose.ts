/* Scene composition model. The base layout is the game's own world for the replay identity
   (WS.scenes.savannah.build). Lab adjustments are applied on top, deterministically, and every derived item
   says whether it came from the game or from the lab. */
import type { Placement, SceneMetrics, SceneParams } from '../types';
import type { Entity, Runtime, World } from './runtime';
import type { LayerId } from '../seed/seed';

export interface Item {
  id: string; asset: string; x: number; y: number; k: number; flip: 0 | 1;
  colours: Record<string, string> | null; kit?: Entity['kit']; kit2?: Entity['kit2'];
  layer: LayerId; gameLayer: string; kind: string; traits: string[]; story?: string; isTarget?: boolean; zone?: string;
  origin: 'game' | 'lab-duplicate' | 'lab-swap' | 'lab-added'; baseId: string;
  w: number; h: number; ax: number; ay: number;   // world-unit size and anchor fraction
}

export const DISTRICT_IDS = ['riverfront', 'market', 'squares', 'monterey', 'forsyth', 'all'] as const;
export const DISTRICT_NAME: Record<string, string> = { riverfront: 'River Street & Festival Pier', market: 'City Market & Johnson Square', squares: 'Pulaski & Lafayette Squares', monterey: 'Jones Street & Monterey Square', forsyth: 'Forsyth Park', all: 'Whole city' };

const worldCache = new Map<string, World>();
export function buildWorld(rt: Runtime, p: SceneParams): World {
  const id = { seed: p.seed, scene: 'savannah', difficulty: p.difficulty, density: p.density, crowd: p.crowd, artVersion: rt.assets.artVersion };
  const key = rt.WS.rng.identityKey(id);
  let w = worldCache.get(key);
  if (!w) { w = rt.WS.scenes.savannah.build(id); worldCache.set(key, w); if (worldCache.size > 6) worldCache.delete(worldCache.keys().next().value!); }
  return w;
}

export function boundsOf(world: World, district: string) {
  const d = world.districts.find((x) => x.id === district);
  return d ? { x: 0, y: d.y0, w: world.w, h: d.h } : { x: 0, y: 0, w: world.w, h: world.h };
}

function layerFor(e: Entity, b: { y: number; h: number }): LayerId {
  if (e.isTarget || (e.kind === 'person' && (e.traits?.length ?? 0) > 0)) return 'target';
  if (e.layer === 'far') return 'distant';
  if (e.layer === 'ground') return 'terrain';
  if (e.kind === 'person') { const t = (e.y - b.y) / b.h; return t < 0.34 ? 'crowd-bg' : t < 0.67 ? 'crowd-mid' : 'crowd-fg'; }
  if (e.kind === 'animal' || e.story) return 'interactive';
  if (/^(environments\/|props\/landmarks\/)/.test(e.asset)) return 'landmarks';
  if (e.asset.startsWith('props/vegetation/')) return 'vegetation';
  return 'props';
}

const STORY_POOL = ['painter', 'saxophonist', 'tourist-photographer', 'juggler', 'dancer', 'scad-student-portfolio', 'elder-pigeon-feeder', 'kid-balloon', 'dog-walker', 'tour-guide', 'reader-seated', 'child-bubbles'].map((a) => 'characters/archetypes/' + a);

export interface Composed { items: Item[]; bounds: { x: number; y: number; w: number; h: number }; world: World; metrics: SceneMetrics; target: Item | null }

export function composeScene(rt: Runtime, p: SceneParams, edits: { moved: Record<string, { dx: number; dy: number }>; added: Placement[]; removed: string[] }): Composed {
  const world = buildWorld(rt, p);
  const b = boundsOf(world, p.district);
  const rng = rt.WS.rng.make('lab|' + rt.WS.rng.identityKey({ seed: p.seed, scene: 'savannah', difficulty: p.difficulty, density: p.density, crowd: p.crowd, artVersion: rt.assets.artVersion }));
  const meta = rt.assets.meta;
  const inside = (e: { x: number; y: number; layer?: string }) => e.layer === 'ground' ? false : e.y >= b.y - (e.layer === 'far' ? 0 : 20) && e.y <= b.y + b.h + (e.layer === 'far' ? 420 : 20);
  const mk = (e: Entity, origin: Item['origin'], over: Partial<Item> = {}): Item | null => {
    const m = meta[e.asset]; if (!m) return null;
    const k = over.k ?? e.k;
    return {
      id: e.id, baseId: e.id, asset: e.asset, x: e.x, y: e.y, k, flip: e.flip, colours: e.colours, kit: e.kit, kit2: e.kit2,
      layer: layerFor(e, b), gameLayer: e.layer, kind: e.kind, traits: e.traits ?? [], story: e.story, isTarget: e.isTarget, zone: e.zone, origin,
      w: m.viewBox[2] * k, h: m.viewBox[3] * k, ax: (m.anchor[0] - m.viewBox[0]) / m.viewBox[2], ay: (m.anchor[1] - m.viewBox[1]) / m.viewBox[3], ...over,
    };
  };
  const base = world.entities.filter(inside);
  const stories = base.filter((e) => e.story).map((e) => [e.x, e.y] as const);
  const out: Item[] = [];
  for (const e of base) {
    const filler = e.kind === 'person' && !e.story && !e.isTarget;
    const prop = e.kind === 'prop' && !e.story && (e.asset.startsWith('props/') && !e.asset.startsWith('props/landmarks/') && !e.asset.startsWith('props/river/'));
    let it = mk(e, 'game');
    if (!it) continue;
    if (filler) {
      if (p.crowdScale < 1 && rng() > p.crowdScale) continue;
      if (p.varietyBias > 0 && rng() < p.varietyBias * 0.5) {
        const a = rng.pick(STORY_POOL); const m = rt.WS.characters.make(rng, a);
        it = mk({ ...e, asset: a, colours: m.colours, kit: m.kit, kit2: m.kit2, traits: m.traits }, 'lab-swap');
        if (!it) continue;
      }
      if (p.decoyBoost > 0 && it.traits.length === 0 && rng() < p.decoyBoost * 0.5) {
        const m = rt.WS.characters.make(rng, it.asset, { decoys: rng.chance(0.5) ? 2 : 1 });
        it = { ...it, colours: m.colours, kit: m.kit, traits: m.traits, layer: m.traits.length ? 'target' : it.layer, origin: it.origin === 'game' ? 'lab-swap' : it.origin };
      }
      if (p.overlap > 0 && stories.length) {
        let best = stories[0], bd = Infinity;
        for (const s of stories) { const d = (s[0] - it.x) ** 2 + (s[1] - it.y) ** 2; if (d < bd) { bd = d; best = s; } }
        const f = p.overlap * 0.6;
        it = { ...it, x: Math.round(it.x + (best[0] - it.x) * f + (rng() - 0.5) * 60), y: Math.round(it.y + (best[1] - it.y) * f + (rng() - 0.5) * 24) };
      }
    }
    if (prop && p.propScale < 1 && rng() > p.propScale) continue;
    if (it.layer === 'landmarks' && p.landmarkProminence !== 1) it = { ...it, k: it.k * p.landmarkProminence, w: it.w * p.landmarkProminence, h: it.h * p.landmarkProminence };
    out.push(it);
    if (filler && p.crowdScale > 1 && rng() < p.crowdScale - 1) {
      const m = rt.WS.characters.make(rng, e.asset);
      const dup = mk({ ...e, id: e.id + '~d', colours: m.colours, kit: m.kit, kit2: m.kit2, traits: m.traits, x: Math.round(e.x + (rng() - 0.5) * 90), y: Math.round(e.y + (rng() - 0.5) * 36) }, 'lab-duplicate');
      if (dup) out.push(dup);
    }
    if (prop && p.propScale > 1 && rng() < p.propScale - 1) {
      const dup = mk({ ...e, id: e.id + '~p', x: Math.round(e.x + (rng() - 0.5) * 140), y: Math.round(e.y + (rng() - 0.5) * 50), flip: rng.chance(0.5) ? 1 : 0 }, 'lab-duplicate');
      if (dup) out.push(dup);
    }
  }
  // foreground emphasis: scale up the lowest third
  if (p.foregroundEmphasis > 0) for (const it of out) if ((it.y - b.y) / b.h > 0.67 && it.layer !== 'distant') { const s = 1 + 0.35 * p.foregroundEmphasis; it.k *= s; it.w *= s; it.h *= s; }
  // manual edits
  const removed = new Set(edits.removed);
  let items = out.filter((i) => !removed.has(i.id)).map((i) => (edits.moved[i.id] ? { ...i, x: i.x + edits.moved[i.id].dx, y: i.y + edits.moved[i.id].dy } : i));
  for (const a of edits.added) {
    if (removed.has(a.id)) continue;
    const isPerson = a.assetId.startsWith('characters/');
    const m = isPerson ? rt.WS.characters.make(rt.WS.rng.make(a.id), a.assetId) : null;
    const it = mk({ id: a.id, asset: a.assetId, x: a.x + (edits.moved[a.id]?.dx ?? 0), y: a.y + (edits.moved[a.id]?.dy ?? 0), k: a.k, flip: a.flip, layer: meta[a.assetId]?.layer === 'far' ? 'far' : 'world', kind: isPerson ? 'person' : 'prop', colours: m?.colours ?? null, kit: m?.kit, kit2: m?.kit2, traits: m?.traits ?? [] }, 'lab-added');
    if (it) items.push(it);
  }
  items = items.sort((a, c) => (a.gameLayer === 'far' ? 0 : 1) - (c.gameLayer === 'far' ? 0 : 1) || a.y - c.y || a.x - c.x || (a.id < c.id ? -1 : 1));
  const target = items.find((i) => i.isTarget) ?? null;
  return { items, bounds: b, world, metrics: metricsOf(items, b, target), target };
}

/** Alpha-sampled occlusion of the target, like the engine's validator: sample points on the target's own
    opaque pixels and test each against the opaque pixels of every sprite drawn in front of it. */
export type MaskFn = (i: Item) => { w: number; h: number; data: Uint8ClampedArray } | null;
export function alphaOcclusion(items: Item[], target: Item, mask: MaskFn): number | null {
  const tm = mask(target); if (!tm) return null;
  const tr = itemRect(target);
  const alphaAt = (i: Item, m: NonNullable<ReturnType<MaskFn>>, wx: number, wy: number) => {
    const r = itemRect(i); let u = (wx - r.x) / r.w; const v = (wy - r.y) / r.h;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return 0;
    if (i.flip) u = 1 - u;
    return m.data[(Math.floor(v * m.h) * m.w + Math.floor(u * m.w)) * 4 + 3];
  };
  const front = items.filter((o) => o !== target && o.gameLayer !== 'far' && (o.y > target.y || (o.y === target.y && o.id > target.id)));
  let own = 0, hidden = 0;
  const S = 14;
  for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
    const wx = tr.x + (sx + 0.5) * tr.w / S, wy = tr.y + (sy + 0.5) * tr.h / S;
    if (alphaAt(target, tm, wx, wy) < 128) continue;
    own++;
    for (const o of front) { const r = itemRect(o); if (wx < r.x || wx > r.x + r.w || wy < r.y || wy > r.y + r.h) continue; const m = mask(o); if (m && alphaAt(o, m, wx, wy) >= 128) { hidden++; break; } }
  }
  return own ? hidden / own : null;
}

export function difficultyIndex(m: SceneMetrics, nearby: number, nearDecoys: number) {
  return Math.min(1, 0.35 * Math.min(1, nearby / 14) + 0.25 * Math.min(1, nearDecoys / 4) + 0.25 * (m.targetOcclusion ?? 0) + 0.15 * (1 - m.emptyShare));
}

export function itemRect(i: Item) { return { x: i.x - i.w * i.ax, y: i.y - i.h * i.ay, w: i.w, h: i.h }; }

function metricsOf(items: Item[], b: { x: number; y: number; w: number; h: number }, target: Item | null): SceneMetrics {
  const people = items.filter((i) => i.kind === 'person');
  const props = items.filter((i) => i.kind !== 'person' && i.gameLayer !== 'far');
  const stories = new Set(items.filter((i) => i.story).map((i) => i.story)).size;
  // empty share: 50-unit cells whose centre no sprite rectangle covers (distant rows excluded)
  const C = 50, cols = Math.ceil(b.w / C), rows = Math.ceil(b.h / C);
  const covered = new Uint8Array(cols * rows);
  for (const i of items) {
    if (i.gameLayer === 'far') continue;
    const r = itemRect(i);
    const c0 = Math.max(0, Math.floor((r.x - b.x) / C)), c1 = Math.min(cols - 1, Math.floor((r.x + r.w - b.x) / C));
    const r0 = Math.max(0, Math.floor((r.y - b.y) / C)), r1 = Math.min(rows - 1, Math.floor((r.y + r.h - b.y) / C));
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) covered[y * cols + x] = 1;
  }
  let n = 0; for (const v of covered) n += v;
  const emptyShare = 1 - n / covered.length;
  const colourCount = new Set(people.map((p) => p.colours?.top).filter(Boolean)).size;
  const decoys = people.filter((p) => !p.isTarget && p.traits.length > 0).length;
  // target occlusion: share of the target's rectangle overlapped by rectangles drawn in front of it (approximation)
  // Target occlusion needs sprite alpha, so it is filled in by the view once images are decoded (alphaOcclusion).
  let nearby = 0, nearDecoys = 0;
  if (target) for (const p of people) { if (p === target) continue; const d = Math.hypot(p.x - target.x, (p.y - target.y) * 2.2); if (d < 300) { nearby++; if (p.traits.length) nearDecoys++; } }
  const m: SceneMetrics = { people: people.length, props: props.length, stories, emptyShare, colourCount, decoys, targetOcclusion: null, difficultyScore: 0, nearby, nearDecoys };
  // Tentative difficulty index, 0 (easy) .. 1 (hard). A heuristic for comparing iterations, never a player result.
  m.difficultyScore = difficultyIndex(m, nearby, nearDecoys);
  return m;
}

/** SVG text at a higher intrinsic resolution, for crisp sprites when zoomed in. */
export function upscaleSvg(svg: string, f: number) {
  if (f === 1) return svg;
  return svg.replace(/<svg([^>]*?)\swidth="([\d.]+)"([^>]*?)\sheight="([\d.]+)"/, (_m, a, w, b, h) => `<svg${a} width="${Number(w) * f}"${b} height="${Number(h) * f}"`);
}
