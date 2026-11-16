/* Automated checks the lab can actually run, against the game's own code and art. Each returns what it
   measured and how; none of them stands in for the owner's visual judgement. */
import type { CheckRun } from '../types';
import { entitySvg, svgToImage, type Runtime } from './runtime';
import { buildWorld } from './compose';
import { DEFAULT_PARAMS } from '../seed/seed';
import { probeGame, probeHitAndNetwork } from './gameFrame';
import { now } from './util';

type Result = Omit<CheckRun, 'id' | 'at' | 'name'>;
export interface CheckDef { id: string; name: string; area: 'Visual' | 'Engineering'; run(rt: Runtime, progress: (s: string) => void): Promise<Result> }

async function mask(svg: string, h: number) {
  const img = await svgToImage(svg);
  const w = Math.max(1, Math.round(h * img.naturalWidth / img.naturalHeight));
  const c = document.createElement('canvas'); c.width = 48; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, (48 - w) / 2, 0, w, h);   // centre on a fixed frame so silhouettes line up by their anchors
  const d = x.getImageData(0, 0, 48, h).data; const m = new Uint8Array(48 * h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
  return m;
}

export const CHECKS: CheckDef[] = [
  {
    id: 'silhouette', name: 'Character silhouette differentiation', area: 'Visual',
    async run(rt, progress) {
      const ids = Object.keys(rt.assets.meta).filter((a) => /^characters\/(archetypes|bodies)\//.test(a));
      const masks: [string, Uint8Array][] = [];
      for (const a of ids) { progress(`Rasterizing ${a.split('/').pop()}…`); const m = rt.assets.meta[a]; masks.push([a, await mask(m.head || m.head2 ? rt.WS.characters.compose(a, null) : rt.assets.svg[a], 36)]); }
      const pairs: [string, string, number][] = [];
      for (let i = 0; i < masks.length; i++) for (let j = i + 1; j < masks.length; j++) {
        let inter = 0, uni = 0; const A = masks[i][1], B = masks[j][1];
        for (let k = 0; k < A.length; k++) { inter += A[k] & B[k]; uni += A[k] | B[k]; }
        pairs.push([masks[i][0], masks[j][0], uni ? inter / uni : 0]);
      }
      pairs.sort((a, b) => b[2] - a[2]);
      const close = pairs.filter((p) => p[2] >= 0.8);
      return { ok: close.length === 0, summary: `${ids.length} drawings, ${pairs.length} pairs compared at 36 px tall. ${close.length} pair(s) overlap 80% or more in silhouette.`, details: pairs.slice(0, 12).map(([a, b, v]) => `${a.split('/').pop()} vs ${b.split('/').pop()}: ${(v * 100).toFixed(0)}% overlap`), method: 'Alpha masks of each drawing (its own default head kit, no recolour) at 36 px, aligned on a 48 px frame; intersection over union per pair. Crowd bodies have no default kit, so they are compared with bare heads; hair and hats add some difference in play.' };
    },
  },
  {
    id: 'repetition', name: 'Nearby repetition in the crowd', area: 'Visual',
    async run(rt) {
      const w = buildWorld(rt, { ...DEFAULT_PARAMS, district: 'all' });
      const people = w.entities.filter((e) => e.kind === 'person' && !e.isTarget);
      const key = (e: typeof people[number]) => e.asset + JSON.stringify(e.colours) + JSON.stringify(e.kit ?? '');
      let twins = 0, sameBody = 0; const examples: string[] = [];
      for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
        const a = people[i], b = people[j];
        if (Math.abs(a.y - b.y) > 90 || Math.hypot(a.x - b.x, (a.y - b.y) * 2.2) > 200) continue;
        if (a.asset === b.asset) sameBody++;
        if (key(a) === key(b)) { twins++; if (examples.length < 6) examples.push(`${a.asset.split('/').pop()} at (${a.x}, ${a.y}) and (${b.x}, ${b.y})`); }
      }
      return { ok: twins === 0, summary: `Seed ${DEFAULT_PARAMS.seed}, standard density, whole city: ${people.length} people. ${twins} identical-looking pair(s) within 200 units; ${sameBody} nearby pairs share the same body drawing.`, details: examples, method: 'Game scene builder output; identical = same asset, colours and head kit. Distance uses the engine\'s 2.2× vertical spacing factor.' };
    },
  },
  {
    id: 'missing', name: 'Missing-asset detection', area: 'Visual',
    async run(rt) {
      const missing = new Set<string>();
      for (const scene of ['savannah', 'forsyth']) {
        const w = rt.WS.scenes[scene].build({ seed: 'LAB-CHECK', scene, difficulty: 'normal', density: 'standard', crowd: null, artVersion: rt.assets.artVersion });
        for (const e of w.entities) if (!rt.assets.svg[e.asset]) missing.add(e.asset);
        if (!rt.assets.svg[w.ground]) missing.add(w.ground);
      }
      return { ok: missing.size === 0, summary: missing.size ? `${missing.size} asset id(s) used by the scenes are not in the bundle.` : 'Every asset the two scenes place exists in the packed bundle.', details: [...missing], method: 'Built both scenes with the game\'s builder and looked up every entity asset in WS_ASSETS.' };
    },
  },
  {
    id: 'outline', name: 'Outline consistency', area: 'Visual',
    async run(rt) {
      // The drawings declare their ink line as CSS classes: .o (outline), .l (inner lines), .fold (folds).
      // Limbs and canes use a double stroke (wide ink under a narrower colour), so element-level ink widths are
      // not the visible outline and are only counted here.
      const groups = new Map<string, string[]>(); const outlines: number[] = []; let doubles = 0; const missing: string[] = [];
      for (const [id, svg] of Object.entries(rt.assets.svg)) {
        if (!id.startsWith('characters/archetypes/') && !id.startsWith('characters/bodies/')) continue;
        const cls: string[] = []; let o: number | null = null;
        for (const m of svg.matchAll(/\.([\w-]+)\{([^}]*)\}/g)) if (/stroke:\s*#2B1D16/i.test(m[2])) { const w = m[2].match(/stroke-width:\s*([\d.]+)/); if (w) { cls.push(`.${m[1]} ${w[1]}`); if (m[1] === 'o') o = Number(w[1]); } }
        doubles += [...svg.matchAll(/<[a-z]+\b[^>]*stroke="#2B1D16"[^>]*>/gi)].length;
        if (o == null) missing.push(id.split('/').pop()!); else outlines.push(o);
        const k = cls.join(', ') || 'no ink classes';
        (groups.get(k) || groups.set(k, []).get(k)!).push(id.split('/').pop()!);
      }
      const mode = outlines.sort((a, b) => outlines.filter((x) => x === b).length - outlines.filter((x) => x === a).length)[0];
      const odd = outlines.filter((x) => Math.abs(x - mode) > 0.15).length;
      return {
        ok: !missing.length && !odd && mode * 0.8 >= 0.9 && mode * 0.8 <= 1.4,
        summary: `Main outline .o is ${mode} SVG units (${(mode * 0.8).toFixed(2)} world units at 0.8 scale; art direction asks about 1.1) in ${outlines.filter((x) => x === mode).length} of ${outlines.length + missing.length} drawings. ${odd} differ by more than 0.15; ${missing.length} declare no .o outline. ${doubles} element-level ink strokes (double-stroked limbs, canes, props) not judged.`,
        details: [...[...groups].map(([k, v]) => `${k}: ${v.length} drawing(s) (${v.slice(0, 5).join(', ')}${v.length > 5 ? '…' : ''})`), ...missing.map((m) => 'no .o outline class: ' + m)],
        method: 'Read the ink-coloured (#2B1D16) CSS classes inside each character SVG. Visible width of double strokes is not measured.',
      };
    },
  },
  {
    id: 'empty', name: 'Unintentional empty regions', area: 'Visual',
    async run(rt) {
      const w = buildWorld(rt, { ...DEFAULT_PARAMS, district: 'all' });
      const C = 200; const rows: string[] = []; let worst = 0;
      for (const d of w.districts) {
        const cols = Math.ceil(w.w / C), rr = Math.ceil(d.h / C); const occ = new Uint8Array(cols * rr);
        for (const e of w.entities) { if (e.layer !== 'world' || e.y < d.y0 || e.y >= d.y0 + d.h) continue; occ[Math.floor((e.y - d.y0) / C) * cols + Math.min(cols - 1, Math.floor(e.x / C))] = 1; }
        let empty = 0; occ.forEach((v) => { if (!v) empty++; });
        const share = empty / occ.length; worst = Math.max(worst, share);
        rows.push(`${d.name}: ${Math.round(share * 100)}% of 200-unit cells hold no person, prop or tree`);
      }
      return { ok: null, summary: `Largest empty share ${Math.round(worst * 100)}%. Some emptiness is intended (river, streets, lawns), so this needs the owner's eye; see the Scene Composer.`, details: rows, method: 'Seed SAV-2026, standard density. Cells with no sorted-world entity anchor.' };
    },
  },
  {
    id: 'determinism', name: 'Deterministic scene reproduction', area: 'Engineering',
    async run(rt) {
      const id = { seed: 'LAB-DET', scene: 'savannah', difficulty: 'normal', density: 'standard', crowd: null, artVersion: rt.assets.artVersion };
      const sig = (w: ReturnType<Runtime['WS']['scenes'][string]['build']>) => w.entities.map((e) => e.asset + e.x + ',' + e.y + JSON.stringify(e.colours)).join('|');
      const a = sig(rt.WS.scenes.savannah.build(id)), b = sig(rt.WS.scenes.savannah.build(id)), c = sig(rt.WS.scenes.savannah.build({ ...id, seed: 'LAB-DET-2' }));
      return { ok: a === b && a !== c, summary: a === b ? (a !== c ? 'Same identity rebuilt the same world; a different seed did not.' : 'Same world for two different seeds.') : 'The same identity produced two different worlds.', details: [`signature length ${a.length}`], method: 'Built the city three times in this page with the game\'s builder and compared every entity\'s asset, position and colours.' };
    },
  },
  {
    id: 'validator', name: 'Target visibility across seeds', area: 'Visual',
    async run(_rt, progress) {
      const rows: string[] = []; let fails = 0, n = 0;
      for (const difficulty of ['easy', 'normal', 'hard']) for (const k of [1, 2, 3]) {
        const seed = `LAB-VIS-${k}`; progress(`Running the game: ${seed} ${difficulty}…`);
        const r = await probeGame({ seed, scene: 'savannah', difficulty, density: 'standard' });
        n++; if (!r.placement?.ok) fails++;
        rows.push(`${seed} ${difficulty}: ${r.placement ? `${r.placement.ok ? 'pass' : 'FAIL'}, visible ${Math.round(r.placement.visibleShare * 100)}%, head ${Math.round(r.placement.headShare * 100)}%, ${r.district}` : 'fallback'}`);
      }
      return { ok: fails === 0, summary: `${n - fails} of ${n} game rounds placed a target that passed the engine's validator.`, details: rows, method: 'Loaded the lab\'s copy of the game off-screen for each seed and read WS.game.placement.' };
    },
  },
  {
    id: 'hit', name: 'Hit-test correctness and offline behaviour', area: 'Engineering',
    async run(_rt, progress) {
      progress('Running the game…');
      const r = await probeHitAndNetwork({ seed: 'SAV-2026', scene: 'savannah', difficulty: 'easy', density: 'standard' });
      return { ok: r.hits > 0 && r.external.length === 0, summary: `engine.pick() returned the target at ${r.hits} of ${r.samples} points on his body (the rest hit what is drawn in front, or missed the moving sprite). ${r.external.length} request(s) left the lab's origin out of ${r.resources}.`, details: [...Object.entries(r.picked).map(([k, v]) => `missed points picked ${k} ×${v}`), ...r.external.map((u) => 'external: ' + u)], method: 'Centred the real game on the target at 2.5×, called the engine\'s pick() through screen coordinates, and read the Resource Timing list.' };
    },
  },
];

export async function runCheck(def: CheckDef, rt: Runtime, progress: (s: string) => void): Promise<CheckRun> {
  const t0 = performance.now();
  try {
    const r = await def.run(rt, progress);
    return { id: def.id, at: now(), name: def.name, ...r, method: r.method + ` Took ${((performance.now() - t0) / 1000).toFixed(1)} s in ${navigator.userAgent.match(/(Chrome|Firefox|Safari|Edg)\/[\d.]+/)?.[0] ?? 'this browser'}.` };
  } catch (e) {
    return { id: def.id, at: now(), name: def.name, ok: false, summary: 'The check could not run: ' + String((e as Error).message ?? e), details: [], method: '' };
  }
}

export { entitySvg };
