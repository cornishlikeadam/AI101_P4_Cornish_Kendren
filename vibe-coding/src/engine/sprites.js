/* Sprite cache (Agent 1). Each distinct SVG variant is decoded once, rasterized lazily per zoom tier into
   an offscreen canvas, and evicted least-recently-used when the pixel budget is exceeded. An alpha mask at
   about one pixel per SVG unit serves hit testing and the target visibility validator. */
(function () {
  const WS = (window.WS = window.WS || {});
  const TIERS = [0.25, 0.5, 1, 2, 4, 8];
  const MAX_SIDE = 8192;          // largest raster side for one sprite tier
  const MAX_AREA = 4.2e6;         // largest raster area for one sprite tier (about 17 MB)
  const BUDGET_PX = 48e6;         // about 190 MB of RGBA across all tiers
  const byKey = new Map();
  const lru = new Map();          // 'key@tier' -> pixels, in recency order
  let usedPx = 0;
  const stats = { decoded: 0, rasterized: 0, evicted: 0 };

  function variantKey(e) {
    return e.asset + (e.colours ? '|' + JSON.stringify(e.colours) : '') + (e.kit ? '|' + JSON.stringify(e.kit) : '') + (e.kit2 ? '|' + JSON.stringify(e.kit2) : '');
  }
  function forEntity(e, frame = 1) {
    const key = variantKey(e) + (frame === 2 ? '|f2' : '');
    let s = byKey.get(key);
    if (!s) {
      const m = window.WS_ASSETS.meta[e.asset];
      const svg = m.head || m.head2 || e.colours || frame === 2 ? WS.characters.compose(e.asset, e.colours, e.kit, e.kit2, frame) : window.WS_ASSETS.svg[e.asset];
      s = { key, svg, vb: m.viewBox, anchor: m.anchor, img: null, tiers: new Map(), mask: null };
      // cap a tier by side length and by area, so long building rows can still render sharp up close
      s.maxTier = Math.min(MAX_SIDE / Math.max(s.vb[2], s.vb[3]), Math.sqrt(MAX_AREA / (s.vb[2] * s.vb[3])));
      byKey.set(key, s);
    }
    return s;
  }
  function decode(s) {
    if (s.loading) return s.loading;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([s.svg], { type: 'image/svg+xml' }));
    img.src = url;
    s.loading = img.decode().then(() => { s.img = img; stats.decoded++; }, () => { throw new Error('could not decode ' + s.key.split('|')[0]); });
    return s.loading;
  }
  const pickTier = (s, pxPerUnit) => {
    const cap = s.maxTier;
    for (const t of TIERS) if (t >= pxPerUnit || t * 2 > cap) return Math.min(t, cap);
    return Math.min(TIERS[TIERS.length - 1], cap);
  };
  function rasterize(s, tier) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(s.vb[2] * tier));
    c.height = Math.max(1, Math.ceil(s.vb[3] * tier));
    c.getContext('2d').drawImage(s.img, 0, 0, c.width, c.height);
    s.tiers.set(tier, c);
    const px = c.width * c.height;
    lru.set(s.key + '@' + tier, px);
    usedPx += px;
    stats.rasterized++;
    while (usedPx > BUDGET_PX && lru.size > 1) {
      const [k, p] = lru.entries().next().value;
      lru.delete(k);
      const at = k.lastIndexOf('@'), victim = byKey.get(k.slice(0, at));
      if (victim) victim.tiers.delete(Number(k.slice(at + 1)));
      usedPx -= p;
      stats.evicted++;
    }
    return c;
  }
  // Best canvas for this scale right now. Missing tiers are queued unless `now` asks for them immediately.
  function canvasFor(s, pxPerUnit, queue, now) {
    if (!s.img) return null;
    const tier = pickTier(s, pxPerUnit);
    const lk = s.key + '@' + tier;
    let c = s.tiers.get(tier);
    if (c) { const p = lru.get(lk); lru.delete(lk); lru.set(lk, p); return c; }
    if (now) return rasterize(s, tier);
    queue.add(lk, () => { if (!s.tiers.has(tier) && s.img) rasterize(s, tier); });
    let best = null, bestT = 0;                       // nearest tier we already have, preferring sharper
    for (const [t, cv] of s.tiers) if (!best || Math.abs(Math.log(t / tier)) < Math.abs(Math.log(bestT / tier))) { best = cv; bestT = t; }
    return best || rasterize(s, Math.min(tier, 0.5));
  }
  function buildMask(s) {
    const mt = Math.min(1, 512 / Math.max(s.vb[2], s.vb[3]));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(s.vb[2] * mt));
    c.height = Math.max(1, Math.ceil(s.vb[3] * mt));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(s.img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const a = new Uint8Array(c.width * c.height);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
    s.mask = { w: c.width, h: c.height, t: mt, a };
  }
  // Alpha (0..255) of sprite s at SVG coordinates (u, v).
  function alphaAt(s, u, v) {
    const m = s.mask;
    if (!m) return 0;
    const x = Math.floor((u - s.vb[0]) * m.t), y = Math.floor((v - s.vb[1]) * m.t);
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return 0;
    return m.a[y * m.w + x];
  }
  // Deferred raster work (sprite tiers and ground tiles), run inside a per-frame time budget.
  function makeQueue() {
    const jobs = new Map();
    return {
      add(key, fn) { if (!jobs.has(key)) jobs.set(key, fn); },
      get size() { return jobs.size; },
      run(budgetMs) {
        const t0 = performance.now();
        let did = false;
        for (const [k, fn] of jobs) {
          jobs.delete(k);
          fn(); did = true;
          if (performance.now() - t0 > budgetMs) break;
        }
        return did;
      },
    };
  }
  WS.sprites = { forEntity, decode, canvasFor, buildMask, alphaAt, makeQueue, pickTier, stats, all: () => byKey, usedPx: () => usedPx };
})();
