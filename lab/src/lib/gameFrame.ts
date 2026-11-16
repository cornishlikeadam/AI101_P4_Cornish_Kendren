/* Drives the real game (the lab's copy of build/) in a hidden same-origin iframe, to read the target
   validator result and to measure frame timing. Only reads what the game exposes on window.WS.game. */

export interface GameProbe {
  placement: { ok: boolean; spot: string; visibleShare: number; headShare: number; tries: number } | null;
  timings: { loadMs?: number; firstFrameMs?: number; sprites?: number } | null;
  people: number | null;
  district: string | null;
  identity: Record<string, unknown> | null;
  fallback: boolean;
}

type GameWin = Window & { WS?: { game?: { placement?: GameProbe['placement']; timings?: GameProbe['timings']; world?: { people: number; area(x: number, y: number): string; target: { x: number; y: number } }; identity?: Record<string, unknown> } } };

export function gameUrl(params: Record<string, string | number | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') q.set(k, String(v));
  return `${import.meta.env.BASE_URL}repo/build/index.html?${q}`;
}

export function openGameFrame(url: string, width = 1280, height = 800, visible = false): { frame: HTMLIFrameElement; win(): GameWin | null; dispose(): void } {
  const f = document.createElement('iframe');
  f.src = url;
  f.title = 'Game probe';
  f.setAttribute('aria-hidden', 'true');
  // Visible runs render at full size and are scaled down on screen, so the game's viewport is the stated one.
  Object.assign(f.style, visible
    ? { position: 'fixed', right: '16px', bottom: '16px', width: width + 'px', height: height + 'px', transform: 'scale(0.28)', transformOrigin: 'bottom right', zIndex: '70', border: '6px solid #3E2723', borderRadius: '20px', background: '#fff' }
    : { position: 'fixed', left: '-10000px', top: '0', width: width + 'px', height: height + 'px', border: '0' });
  document.body.appendChild(f);
  return { frame: f, win: () => f.contentWindow as GameWin | null, dispose: () => f.remove() };
}

export async function waitFor<T>(fn: () => T | null | undefined, timeoutMs = 20000, every = 100): Promise<T> {
  const t0 = performance.now();
  for (;;) {
    try { const v = fn(); if (v) return v; } catch { /* frame not ready */ }
    if (performance.now() - t0 > timeoutMs) throw new Error('Timed out waiting for the game');
    await new Promise((r) => setTimeout(r, every));
  }
}

export async function probeGame(params: Record<string, string | number | null | undefined>): Promise<GameProbe> {
  const g = openGameFrame(gameUrl(params));
  try {
    await waitFor(() => g.win()?.document?.readyState === 'complete', 20000);
    const w = await waitFor(() => { const W = g.win(); return W?.WS?.game?.placement || W?.document.querySelector('#fallback:not([hidden]), .fallback.show') ? W : null; }, 25000);
    const game = w.WS?.game;
    const t = game?.world?.target;
    return {
      placement: game?.placement ?? null, timings: game?.timings ?? null, people: game?.world?.people ?? null,
      district: t && game?.world ? game.world.area(t.x, t.y) : null, identity: game?.identity ?? null, fallback: !game?.placement,
    };
  } finally { g.dispose(); }
}

/** Measure requestAnimationFrame deltas inside the game frame while it pans and zooms on a fixed script. */
export async function benchmarkGame(params: Record<string, string | number | null | undefined>, seconds: number, onProgress?: (s: string) => void) {
  const vw = 1280, vh = 800;
  const g = openGameFrame(gameUrl(params), vw, vh, true);
  try {
    onProgress?.('Loading the game…');
    const w = await waitFor(() => { const W = g.win(); return W?.WS?.game?.placement ? W : null; }, 30000);
    const game = w.WS!.game as unknown as { engine: { camera: { panBy(x: number, y: number): void; zoomAt(f: number, x: number, y: number): void } }; timings: GameProbe['timings']; world: { people: number }; placement: GameProbe['placement'] };
    // start the round if the intro card is up, so the scene is in its playing state
    (w.document.querySelector('#startBtn') as HTMLButtonElement | null)?.click();
    await new Promise((r) => setTimeout(r, 400));
    onProgress?.(`Measuring for ${seconds} s…`);
    let hidden = false;
    const onVis = () => { if (document.hidden) hidden = true; };
    document.addEventListener('visibilitychange', onVis);
    const deltas: number[] = [];
    await new Promise<void>((resolve) => {
      let last = 0; const t0 = w.performance.now(); let n = 0;
      const step = (t: number) => {
        if (last) deltas.push(t - last);
        last = t; n++;
        const el = (t - t0) / 1000;
        // scripted tour: pan in a slow figure eight and breathe the zoom between 0.8x and 2.2x
        try { game.engine.camera.panBy(Math.cos(el * 0.9) * 6, Math.sin(el * 1.3) * 4); if (n % 3 === 0) game.engine.camera.zoomAt(1 + Math.sin(el * 0.7) * 0.012, vw / 2, vh / 2); } catch { /* engine API missing */ }
        if (el < seconds) w.requestAnimationFrame(step); else resolve();
      };
      w.requestAnimationFrame(step);
    });
    document.removeEventListener('visibilitychange', onVis);
    const sorted = [...deltas].sort((a, b) => a - b);
    const avg = deltas.reduce((s, x) => s + x, 0) / Math.max(1, deltas.length);
    const sd = Math.sqrt(deltas.reduce((s, x) => s + (x - avg) ** 2, 0) / Math.max(1, deltas.length));
    const mem = (w.performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return {
      frames: deltas.length, avgFrameMs: avg, p95FrameMs: sorted[Math.floor(sorted.length * 0.95)] ?? avg, worstFrameMs: sorted[sorted.length - 1] ?? avg, stdevMs: sd, fps: 1000 / avg,
      viewport: `${vw}×${vh} CSS px game viewport (shown scaled down)`, dpr: w.devicePixelRatio, heapMB: mem ? mem.usedJSHeapSize / 1048576 : null,
      loadMs: game.timings?.loadMs ?? null, firstFrameMs: game.timings?.firstFrameMs ?? null, people: game.world?.people ?? null,
      validator: game.placement ? { ok: game.placement.ok, visibleShare: game.placement.visibleShare, headShare: game.placement.headShare } : null, hidden,
    };
  } finally { g.dispose(); }
}

/** In the real game: click-test points on the target through the engine's own pick(), and list every
    resource the page loaded from another origin. */
export async function probeHitAndNetwork(params: Record<string, string | number | null | undefined>) {
  const g = openGameFrame(gameUrl(params));
  try {
    const w = await waitFor(() => { const W = g.win(); return W?.WS?.game?.placement ? W : null; }, 30000);
    const game = w.WS!.game as unknown as { engine: { camera: { centerOn(x: number, y: number, z?: number): void; toScreen(x: number, y: number): [number, number] }; pick(cx: number, cy: number): { id: string; isTarget?: boolean; asset: string } | null; renderNow(): void }; world: { target: { x: number; y: number } } };
    const t = game.world.target;
    game.engine.camera.centerOn(t.x, t.y - 40, 2.5);
    game.engine.renderNow();
    await new Promise((r) => setTimeout(r, 300));
    const canvas = w.document.getElementById('scene') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    let hits = 0, samples = 0; const picked: Record<string, number> = {};
    for (const dy of [-18, -30, -42, -54]) for (const dx of [-4, 0, 4]) {
      const [sx, sy] = game.engine.camera.toScreen(t.x + dx, t.y + dy);
      const e = game.engine.pick(rect.left + sx, rect.top + sy);
      samples++;
      if (e?.isTarget) hits++; else { const k = e ? e.asset.split('/').pop()! : 'nothing'; picked[k] = (picked[k] ?? 0) + 1; }
    }
    const origin = w.location.origin;
    const external = (w.performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map((r) => r.name).filter((u) => !u.startsWith(origin) && !/^(blob|data):/.test(u));
    return { hits, samples, picked, external, resources: w.performance.getEntriesByType('resource').length };
  } finally { g.dispose(); }
}
