/* Loads the game's own classic scripts (asset bundle, PRNG, character composer and factory, scene builder)
   into the lab page, exactly as build/index.html loads them. Previews and baseline layouts therefore come
   from the real game code. The copies are made by scripts/ingest.mjs from vibe-coding/. */

export interface WSAssets { artVersion: number; svg: Record<string, string>; meta: Record<string, AssetMeta> }
export interface AssetMeta { viewBox: number[]; anchor: number[]; layer: string; slots: string[]; traits: string[]; head: number[] | null; head2: number[] | null; kit: string | null; kit2: string | null; hats: string[] | null; author: string | null }
export interface Kit { face?: string; hair?: string; hat?: string; glasses?: string; beard?: string }
export interface Made { asset: string; colours: Record<string, string>; kit?: Kit; kit2?: Kit; traits: string[] }
export interface Identity { seed: string; scene: string; difficulty: string; density: string; crowd: number | null; artVersion: number }
export interface Entity { id: string; asset: string; x: number; y: number; k: number; flip: 0 | 1; layer: string; kind: string; colours: Record<string, string> | null; kit?: Kit; kit2?: Kit; traits?: string[]; story?: string; isTarget?: boolean; zone?: string; spot?: string }
export interface World { id: string; w: number; h: number; ground: string; entities: Entity[]; target: Entity; candidates: { spot: string; x: number; y: number }[]; districts: { id: string; name: string; y0: number; h: number }[]; people: number; stories: number; area(x: number, y: number): string }
export interface District { id: string; name: string; y0: number; h: number; spots: { id: string; x: number; y: number; r: number; d: string[] }[]; zones: { id: string; w: number; path?: boolean }[] }

interface WSGlobal {
  rng: { make(seed: string): Rng; identityKey(id: Identity): string };
  characters: {
    compose(asset: string, colours: Record<string, string> | null, kit?: Kit, kit2?: Kit, frame?: number): string;
    make(rng: Rng, asset: string, opts?: { decoys?: number; child?: boolean }): Made;
    traitsOf(e: { asset: string; kit?: Kit; colours?: Record<string, string> }): string[];
    defaultKit(asset: string, n: number): Kit;
    PAL: Record<string, string[]>;
    TARGET_BLUE: string;
  };
  scenes: Record<string, { build(id: Identity): World }>;
  districts: Record<string, (y0?: number) => District>;
}
export interface Rng { (): number; int(n: number): number; pick<T>(a: T[]): T; chance(p: number): boolean; range(a: number, b: number): number }

declare global { interface Window { WS?: WSGlobal; WS_ASSETS?: WSAssets } }

const SCRIPTS = [
  'repo/build/js/assets.bundle.js', 'repo/src/utilities/rng.js', 'repo/src/characters/compose.js', 'repo/src/characters/make.js',
  'repo/src/scenes/build.js', 'repo/src/scenes/streets.js', 'repo/src/scenes/riverfront.js', 'repo/src/scenes/market.js', 'repo/src/scenes/squares.js',
  'repo/src/scenes/monterey.js', 'repo/src/scenes/forsyth.js', 'repo/src/scenes/savannah.js',
];

export interface Runtime { assets: WSAssets; WS: WSGlobal }
let loading: Promise<Runtime> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = (import.meta.env.BASE_URL || './') + src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load ' + src + '. Run `npm run ingest` in lab/ to copy the game runtime.'));
    document.head.appendChild(s);
  });
}

export function loadRuntime(): Promise<Runtime> {
  if (!loading) {
    loading = (async () => {
      for (const s of SCRIPTS) await loadScript(s);
      if (!window.WS_ASSETS || !window.WS?.characters) throw new Error('Game runtime loaded but did not register window.WS');
      return { assets: window.WS_ASSETS, WS: window.WS };
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

// ---------- SVG → image, cached ----------
const imgCache = new Map<string, Promise<HTMLImageElement>>();
function hash(s: string) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + ':' + s.length; }

export function svgToImage(svg: string): Promise<HTMLImageElement> {
  const key = hash(svg);
  let p = imgCache.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('SVG decode failed'));
      img.src = url;
    });
    imgCache.set(key, p);
    if (imgCache.size > 1500) imgCache.delete(imgCache.keys().next().value!);
  }
  return p;
}

/** SVG text for an entity, composed exactly as the game's sprite cache does it (src/engine/sprites.js forEntity). */
export function entitySvg(rt: Runtime, e: { asset: string; colours?: Record<string, string> | null; kit?: Kit; kit2?: Kit }, frame = 1) {
  const m = rt.assets.meta[e.asset];
  if (!m) return null;
  return m.head || m.head2 || e.colours || frame === 2 ? rt.WS.characters.compose(e.asset, e.colours ?? null, e.kit, e.kit2, frame) : rt.assets.svg[e.asset];
}

/** Compose with an adjusted head scale (Character Workshop proportion preview). Edits a copy of the meta only. */
export function composeWithHeadScale(rt: Runtime, asset: string, colours: Record<string, string> | null, kit: Kit | undefined, headScale: number, frame = 1) {
  const m = rt.assets.meta[asset];
  if (!m?.head || headScale === 1) return rt.WS.characters.compose(asset, colours, kit, undefined, frame);
  const saved = m.head;
  const [dx, dy, s] = saved;
  // Keep the neck point fixed: the head frame's centre is (33.8, 21), its chin about 36 below the top.
  const ns = s * headScale;
  m.head = [dx - 33.8 * (ns - s), dy - 36 * (ns - s), ns];
  try { return rt.WS.characters.compose(asset, colours, kit, undefined, frame); } finally { m.head = saved; }
}

export const TRAIT_LABEL: Record<string, string> = { stripes: 'Red-and-white striped shirt', bobble: 'Striped bobble hat with pom-pom', glasses: 'Round glasses', blue: 'Blue trousers', stick: 'Wooden walking stick' };
export const TRAITS = ['stripes', 'bobble', 'glasses', 'blue', 'stick'] as const;

/** Pixel filters for the readability previews. */
export function filterCanvas(c: HTMLCanvasElement, mode: 'normal' | 'outline' | 'silhouette') {
  if (mode === 'normal') return;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const im = ctx.getImageData(0, 0, c.width, c.height);
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (!a) continue;
    if (mode === 'silhouette') { d[i] = 43; d[i + 1] = 29; d[i + 2] = 22; d[i + 3] = a > 40 ? 255 : a; continue; }
    // outline: keep pixels close to the ink colour #2B1D16, blank the fills
    const dist = Math.abs(d[i] - 43) + Math.abs(d[i + 1] - 29) + Math.abs(d[i + 2] - 22);
    if (dist < 90) { d[i] = 43; d[i + 1] = 29; d[i + 2] = 22; } else { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; }
  }
  ctx.putImageData(im, 0, 0);
}
