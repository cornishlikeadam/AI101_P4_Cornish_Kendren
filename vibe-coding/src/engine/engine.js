/* Engine (Agent 1): camera, ground tiles, depth-sorted sprite drawing, picking and the target validator.
   Canvas 2D behind the small interface in HANDOFF.md, so the renderer can be swapped later. */
(function () {
  const WS = (window.WS = window.WS || {});
  const S = () => WS.sprites;
  const ZOOM_BASE = 0.4;                 // 1.0x zoom = 0.4 CSS px per world unit (an adult is about 30 px tall)
  // Zoom limits depend on the viewport: the minimum is whatever keeps the whole screen covered by the
  // illustrated world (never below 0.5x, where people are still recognisable shapes); the maximum shows a
  // face about 60 px across, which the sprite and ground tiers render sharply.
  const ZOOM_FLOOR = 0.5, ZOOM_MAX = 5;
  const ZOOM_EASE_MS = 90;               // smooth zoom: time constant of the exponential approach
  const GROUND_TILE = 256;
  const GROUND_TIERS = [0.5, 1, 2, 3, 5];
  const SMOOTH = 'low';               // bilinear; sprite tiers are chosen near the target scale so this stays crisp

  function create(canvas, world, opts = {}) {
    const ctx = canvas.getContext('2d');
    const queue = S().makeQueue();
    const frameFns = [];
    const cam = { x: world.w / 2, y: world.h / 2, zoom: 1 };   // zoom multiplies ZOOM_BASE
    // The illustrated area the camera may show: the world minus a thin margin so no sprite edge or
    // half-drawn tile ever reaches the screen border.
    const EDGE = 6;
    const bounds = { x0: EDGE, y0: EDGE, x1: world.w - EDGE, y1: world.h - EDGE };
    let ease = null;                     // { target, sx, sy } while a smooth zoom is in flight
    let vw = 0, vh = 0, dpr = 1, dirty = true, beacon = !!opts.beacon, effects = [], lastT = 0;
    const perf = { frames: 0, times: [] };

    // ---------- world list in draw order ----------
    const LAYER_ORDER = { ground: 0, far: 1, world: 2, effects: 3 };
    let list = [];
    const cmpOrder = (a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || a.y - b.y || (a.x - b.x) || (a.id < b.id ? -1 : 1);
    function sortList() {
      if (list.length !== world.entities.length) {
        list = world.entities.slice().sort(cmpOrder);
      } else {
        for (let i = 1; i < list.length; i++) {
          const cur = list[i];
          let j = i - 1;
          while (j >= 0 && cmpOrder(list[j], cur) > 0) { list[j + 1] = list[j]; j--; }
          list[j + 1] = cur;
        }
      }
      for (let i = 0; i < list.length; i++) list[i].order = i;
    }
    function rectOf(e) {
      const s = e.sprite, [vx, vy, w, h] = s.vb, [ax, ay] = s.anchor, k = e.k;
      const left = e.flip ? e.x - (vx + w - ax) * k : e.x + (vx - ax) * k;
      return [left, e.y + (vy - ay) * k, w * k, h * k];
    }
    function updateRect(e) {
      if (!e.rect) { e.rect = rectOf(e); return; }
      const s = e.sprite, [vx, vy, w, ,] = s.vb, [ax, ay] = s.anchor, k = e.k;
      e.rect[0] = e.flip ? e.x - (vx + w - ax) * k : e.x + (vx - ax) * k;
      e.rect[1] = e.y + (vy - ay) * k;
    }
    // world point -> sprite SVG coordinates
    function local(e, wx, wy) {
      const [ax, ay] = e.sprite.anchor;
      return [e.flip ? ax - (wx - e.x) / e.k : ax + (wx - e.x) / e.k, ay + (wy - (e.y + (e.oy || 0))) / e.k];
    }

    // ---------- motion ----------
    // Procedural motion, not drawn frames: walkers bounce in step, standers breathe, kites sway, bubbles rise,
    // the fountain sparkles. Offsets never change placement, and prefers-reduced-motion freezes everything.
    const WALKERS = /bodies\/(walk|dress|tote|cane|child|umbrella|books)$|archetypes\/(jogger|tourist-photographer|scad-student-portfolio|dog-walker|parent-stroller|tour-guide|target-walker|cyclist)$/;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let motionOn = !reduced && opts.motion !== false;
    function assignMotion() {
      for (const e of world.entities) {
        const h = WS.rng.fnv1a(e.id) / 4294967296;
        e.phase = h * Math.PI * 2;
        e.motion = e.kind === 'person' ? (WALKERS.test(e.asset) ? (e.asset.endsWith('jogger') ? 'jog' : 'walk') : e.asset.endsWith('bodies/wave') ? 'wave' : 'idle')
          : e.asset === 'effects/kite' ? 'kite' : e.asset === 'effects/bubbles' ? 'rise' : e.asset.includes('animals') ? 'idle' : null;
        e.speed = 0.85 + h * 0.35;
        assignTravel(e, h);
      }
    }

    // ---------- locomotion ----------
    // Crowd people travel: along walks and streets (lanes), up and down the long paths, or wandering with
    // pauses on lawns and plazas. Story characters stay at their story; the target paces a few steps
    // around his validated hiding spot. Dogs on leads follow their walkers.
    const H_LANES = new Set(['wing-walk', 'north-walk', 'cross-walk', 'south-walk', 'riverwalk', 'river-street', 'factors-walk', 'market-front', 'congress-walk', 'square-sidewalks']);
    const V_LANES = new Set(['wing-ns', 'promenade', 'side-walks', 'between-squares', 'bull-walk']);
    const SPEED = (a) => /cyclist/.test(a) ? 85 : /jogger/.test(a) ? 55 : /child|cane/.test(a) ? 14 : /stroller/.test(a) ? 16 : 22;
    function assignTravel(e, h) {
      e.travel = null;
      // cars, carriages and trolleys drive along their street and come round again at the far edge
      if (e.drive) { e.travel = { kind: 'drive', v: e.drive }; return; }
      if (e.kind !== 'person' || e.motion !== 'walk' && e.motion !== 'jog') return;
      const r = WS.rng.mulberry32(WS.rng.fnv1a(e.id + '#walk'));
      const v = SPEED(e.asset) * (0.85 + r() * 0.3);
      e.hx = e.x; e.hy = e.y;
      if (e.isTarget) e.travel = { kind: 'wander', v: 9, r: 22, r_: r };
      else if (!e.zone) e.travel = null;
      else if (H_LANES.has(e.zone)) e.travel = { kind: 'h', v };
      else if (V_LANES.has(e.zone)) e.travel = { kind: 'v', v, y0: e.y - 380, y1: e.y + 380 };
      else if (!/cyclist|jogger/.test(e.asset)) e.travel = { kind: 'wander', v: v * 0.7, r: 80, r_: r };
      if (e.travel && e.travel.kind === 'wander') { e.travel.tx = e.x; e.travel.ty = e.y; e.travel.wait = r() * 3; }
    }
    let lastMove = 0, lastSort = 0;
    const blockedAt = (x, y) => (world.blocked ? world.blocked(x, y) : false);
    function travel(t) {
      const dt = lastMove ? Math.min(0.1, (t - lastMove) / 1000) : 0;
      lastMove = t;
      if (!dt) return;
      let movedY = false;
      for (const e of world.entities) {
        const T = e.travel;
        if (!T) continue;
        e.moving = true;
        if (T.kind === 'drive') {
          e.x += (e.flip ? -1 : 1) * T.v * dt;
          if (e.x > world.w + 160) e.x = -160; else if (e.x < -160) e.x = world.w + 160;
          updateRect(e);
          continue;
        }
        if (T.kind === 'h') {
          const dir = e.flip ? -1 : 1, nx = e.x + dir * T.v * dt;
          if (nx < 70 || nx > world.w - 70 || blockedAt(nx, e.y)) e.flip = e.flip ? 0 : 1; else e.x = nx;
        } else if (T.kind === 'v') {
          T.dir = T.dir || (e.flip ? -1 : 1);
          const ny = e.y + T.dir * T.v * dt;
          if (ny < T.y0 || ny > T.y1 || blockedAt(e.x, ny)) T.dir = -T.dir; else { e.y = ny; movedY = true; }
        } else {
          if (T.wait > 0) { T.wait -= dt; e.moving = false; continue; }
          const dx = T.tx - e.x, dy = T.ty - e.y, d = Math.hypot(dx, dy);
          if (d < 2) {
            const a = T.r_() * Math.PI * 2, rr = T.r * Math.sqrt(T.r_());
            const nx = e.hx + Math.cos(a) * rr, ny = e.hy + Math.sin(a) * rr * 0.5;
            if (!blockedAt(nx, ny)) { T.tx = nx; T.ty = ny; }
            T.wait = 0.5 + T.r_() * 3.5;
            e.moving = false;
            continue;
          }
          const step = Math.min(d, T.v * dt);
          e.x += (dx / d) * step; e.y += (dy / d) * step;
          if (Math.abs(dx) > 1) e.flip = dx < 0 ? 1 : 0;
          movedY = movedY || Math.abs(dy) > 0.01;
        }
        updateRect(e);
      }
      // dogs keep to their walkers
      for (const e of world.entities) {
        if (!e.leash || !e.leashTo) continue;
        const w = e.leashTo;
        e.flip = w.flip; e.x = w.x + (w.flip ? -84 : 84); e.y = w.y + 6; updateRect(e);
      }
      if (movedY && t - lastSort > 200) { sortList(); lastSort = t; }
    }
    function animate(t) {
      travel(t);
      const s = t / 1000;
      for (const e of list) {
        if (!e.motion) continue;
        const p = s * e.speed * Math.PI * 2 + e.phase;
        if ((e.motion === 'walk' || e.motion === 'jog') && e.travel && !e.moving) { e.oy = Math.sin(p * 0.25) * 0.5; if (e.sprite0) e.sprite = e.sprite0; continue; }
        if (e.motion === 'walk') {
          e.oy = -Math.abs(Math.sin(p * 0.9)) * 1.8;
          // stride at the bottom of the bounce, passing pose at the top: two drawn frames per step
          if (e.sprite1 && e.sprite1.img) e.sprite = Math.abs(Math.sin(p * 0.9)) > 0.5 ? e.sprite1 : e.sprite0;
        }
        else if (e.motion === 'jog') e.oy = -Math.abs(Math.sin(p * 1.4)) * 3.2;
        else if (e.motion === 'idle') e.oy = Math.sin(p * 0.25) * 0.5;
        else if (e.motion === 'wave') { e.oy = Math.sin(p * 0.25) * 0.5; if (e.sprite1 && e.sprite1.img) e.sprite = Math.sin(p * 1.6) > 0 ? e.sprite1 : e.sprite0; }
        else if (e.motion === 'kite') { e.oy = Math.sin(p * 0.35) * 6; e.rot = Math.sin(p * 0.27) * 0.08; }
        else if (e.motion === 'rise') e.oy = -((s * 6 + e.phase * 4) % 14);
      }
    }
    // Sparkle over a fountain basin; the basin ellipse is relative to the fountain sprite's anchor.
    function drawFountain(e, s) {
      const f = { x: e.x, y: e.y - 112 * e.k, rx: 270 * e.k, ry: 100 * e.k };
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39996 + s * 0.4, r = 0.25 + ((i * 0.37 + s * 0.15) % 0.7);
        const x = f.x + Math.cos(a) * f.rx * r, y = f.y + Math.sin(a) * f.ry * r;
        const tw = (Math.sin(s * 3 + i * 1.7) + 1) / 2;
        if (tw < 0.45) continue;
        ctx.globalAlpha = (tw - 0.45) * 1.6;
        ctx.beginPath(); ctx.ellipse(x, y, 4 * tw, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ---------- loading ----------
    // The ground can be one image or several seamless chunks ({ asset, x, y, w, h } in world units), so a
    // wide city never needs one giant image. `base` is a low-resolution copy of the whole ground, kept under
    // about 12 megapixels so phones (Safari caps a canvas near 16.7 MP) can hold it.
    const ground = { chunks: [], base: null, baseScale: 0.5, tiles: new Map() };
    let extraSprites = [];
    function decodeExtra() {
      if (!extraSprites.length) return;
      const pending = extraSprites;
      extraSprites = [];
      let i = 0;
      const batch = () => {
        const end = Math.min(pending.length, i + 20);
        const jobs = [];
        for (; i < end; i++) jobs.push(S().decode(pending[i]).catch(() => {}));
        Promise.all(jobs).then(() => { if (i < pending.length) setTimeout(batch, 12); });
      };
      setTimeout(batch, 0);
    }
    async function load(progress) {
      for (const e of world.entities) {
        e.sprite = e.sprite0 = S().forEntity(e);
        // walking figures with a drawn second frame get it as a separate sprite (not in stress crowds)
        if (window.WS_ASSETS.meta[e.asset].frames === 2 && world.people <= 2001) e.sprite1 = S().forEntity(e, 2);
      }
      const sprites0 = [...new Set(world.entities.map((e) => e.sprite0))];
      extraSprites = [...new Set(world.entities.filter((e) => e.sprite1).map((e) => e.sprite1))];
      let done = 0;
      const defs = world.grounds || [{ asset: world.ground, x: 0, y: 0, w: world.w, h: world.h }];
      ground.chunks = defs.map((d) => {
        const img = new Image(), url = URL.createObjectURL(new Blob([window.WS_ASSETS.svg[d.asset]], { type: 'image/svg+xml' }));
        img.src = url;
        return Object.assign({ img, url }, d);
      });
      const jobs = ground.chunks.map((c) => c.img.decode().then(() => URL.revokeObjectURL(c.url), (err) => { URL.revokeObjectURL(c.url); throw err; }))
        .concat(sprites0.map((s) => S().decode(s).then(() => { progress && progress(++done / sprites0.length); })));
      await Promise.all(jobs);
      ground.baseScale = Math.min(0.5, Math.sqrt(12e6 / (world.w * world.h)));
      ground.base = document.createElement('canvas');
      ground.base.width = Math.round(world.w * ground.baseScale); ground.base.height = Math.round(world.h * ground.baseScale);
      const bctx = ground.base.getContext('2d');
      for (const c of ground.chunks) bctx.drawImage(c.img, c.x * ground.baseScale, c.y * ground.baseScale, c.w * ground.baseScale, c.h * ground.baseScale);
      for (const e of world.entities) { e.rect = rectOf(e); e.pickable = e.layer === 'world' || e.layer === 'ground'; }
      assignMotion();
      for (const e of world.entities) if (e.leash) e.leashTo = world.entities.find((p) => p.id === e.leash);
      sortList();
      return { sprites: sprites0.length + extraSprites.length };
    }

    // ---------- camera ----------
    // cam.x/cam.y is the world point at the centre of the screen. The visible world rectangle is
    // [cam.x ± vw/2/scale] × [cam.y ± vh/2/scale]; it must stay inside `bounds`, which forces
    // scale ≥ max(vw / boundsWidth, vh / boundsHeight) — the viewport-cover zoom.
    const scale = () => cam.zoom * ZOOM_BASE;            // CSS px per world unit
    const minZoom = () => {
      if (!vw || !vh) return ZOOM_FLOOR;
      const cover = Math.max(vw / (bounds.x1 - bounds.x0), vh / (bounds.y1 - bounds.y0)) / ZOOM_BASE;
      return Math.max(ZOOM_FLOOR, cover * 1.0005);
    };
    const maxZoom = () => Math.max(ZOOM_MAX, minZoom() * 2);
    function clamp() {
      cam.zoom = Math.max(minZoom(), Math.min(maxZoom(), cam.zoom));
      const hw = vw / 2 / scale(), hh = vh / 2 / scale();
      cam.x = Math.max(bounds.x0 + hw, Math.min(bounds.x1 - hw, cam.x));
      cam.y = Math.max(bounds.y0 + hh, Math.min(bounds.y1 - hh, cam.y));
      dirty = true;
    }
    const toWorld = (sx, sy) => [cam.x + (sx - vw / 2) / scale(), cam.y + (sy - vh / 2) / scale()];
    const toScreen = (wx, wy) => [(wx - cam.x) * scale() + vw / 2, (wy - cam.y) * scale() + vh / 2];
    // Zoom so that the world point under screen point (sx, sy) stays under it.
    function zoomAround(z, sx, sy) {
      const [wx, wy] = toWorld(sx, sy);
      cam.zoom = Math.max(minZoom(), Math.min(maxZoom(), z));
      cam.x = wx - (sx - vw / 2) / scale(); cam.y = wy - (sy - vh / 2) / scale();
      clamp();
    }
    // One step of the smooth zoom, frame-rate independent: move a fraction 1 - e^(-dt/τ) of the way in log space.
    function stepEase(dt) {
      if (!ease) return;
      const k = 1 - Math.exp(-Math.max(0, dt) / ZOOM_EASE_MS);
      const z = Math.exp(Math.log(cam.zoom) + (Math.log(ease.target) - Math.log(cam.zoom)) * k);
      zoomAround(z, ease.sx, ease.sy);
      if (Math.abs(Math.log(cam.zoom / ease.target)) < 0.002) { zoomAround(ease.target, ease.sx, ease.sy); ease = null; }
    }
    const home = () => world.home || { x: world.w / 2, y: world.h / 2, zoom: 1.2 };
    const camera = {
      get zoom() { return cam.zoom; }, get x() { return cam.x; }, get y() { return cam.y; },
      get minZoom() { return minZoom(); }, get maxZoom() { return maxZoom(); },
      get ZOOM_MIN() { return minZoom(); }, get ZOOM_MAX() { return maxZoom(); }, ZOOM_BASE,
      get bounds() { return Object.assign({}, bounds); },
      /** The world rectangle currently on screen: [x0, y0, x1, y1]. */
      visible() { return [...toWorld(0, 0), ...toWorld(vw, vh)]; },
      panBy(dxCss, dyCss) { cam.x -= dxCss / scale(); cam.y -= dyCss / scale(); clamp(); },
      zoomAt(factor, sx = vw / 2, sy = vh / 2) { ease = null; zoomAround(cam.zoom * factor, sx, sy); },
      /** Smooth zoom toward the pointer; repeated calls (wheel ticks) accumulate into one target. */
      zoomSmooth(factor, sx = vw / 2, sy = vh / 2) {
        const base = ease ? ease.target : cam.zoom;
        ease = { target: Math.max(minZoom(), Math.min(maxZoom(), base * factor)), sx, sy };
        dirty = true;
      },
      get easing() { return !!ease; },
      centerOn(wx, wy, zoom) { ease = null; if (zoom) cam.zoom = zoom; clamp(); cam.x = wx; cam.y = wy; clamp(); },
      reset() { const h = home(); ease = null; cam.zoom = h.zoom; clamp(); cam.x = h.x; cam.y = h.y; clamp(); },
      fit() { ease = null; cam.zoom = minZoom(); cam.x = world.w / 2; cam.y = world.h / 2; clamp(); },
      toWorld, toScreen,
    };
    // Keeps the same world point at the centre of the screen across resizes and rotations; the zoom
    // floor and pan limits are recomputed for the new aspect ratio by clamp().
    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      vw = r.width; vh = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      clamp();
    }

    // ---------- ground ----------
    function groundTile(tx, ty, tier) {
      const key = tx + ',' + ty + '@' + tier;
      let c = ground.tiles.get(key);
      if (c) { ground.tiles.delete(key); ground.tiles.set(key, c); return c; }
      queue.add('ground:' + key, () => rasterGround(tx, ty, tier));
      return null;
    }
    function rasterGround(tx, ty, tier) {
      const c = document.createElement('canvas');
      const T = GROUND_TILE, px = Math.ceil(T * tier);
      c.width = px; c.height = px;
      const cx = c.getContext('2d'), k = px / T;
      // copy the part of every chunk that overlaps this tile (tiles may straddle a chunk seam)
      for (const g of ground.chunks) {
        const x0 = Math.max(tx * T, g.x), y0 = Math.max(ty * T, g.y), x1 = Math.min((tx + 1) * T, g.x + g.w), y1 = Math.min((ty + 1) * T, g.y + g.h);
        if (x1 <= x0 || y1 <= y0) continue;
        cx.drawImage(g.img, x0 - g.x, y0 - g.y, x1 - x0, y1 - y0, (x0 - tx * T) * k, (y0 - ty * T) * k, (x1 - x0) * k, (y1 - y0) * k);
      }
      ground.tiles.set(tx + ',' + ty + '@' + tier, c);
      if (ground.tiles.size > 400) { const first = ground.tiles.keys().next().value; ground.tiles.delete(first); }
    }
    function drawGround(view) {
      const need = scale() * dpr, bs = ground.baseScale;
      const sx = Math.max(0, Math.floor(view[0] * bs)), sy = Math.max(0, Math.floor(view[1] * bs));
      const sx1 = Math.min(ground.base.width, Math.ceil(view[2] * bs)), sy1 = Math.min(ground.base.height, Math.ceil(view[3] * bs));
      if (sx1 > sx && sy1 > sy) ctx.drawImage(ground.base, sx, sy, sx1 - sx, sy1 - sy, sx / bs, sy / bs, (sx1 - sx) / bs, (sy1 - sy) / bs);
      if (need <= bs * 1.1) return;
      const tier = GROUND_TIERS.find((t) => t >= need) || GROUND_TIERS[GROUND_TIERS.length - 1];
      const T = GROUND_TILE;
      for (let ty = Math.max(0, Math.floor(view[1] / T)); ty * T < Math.min(world.h, view[3]); ty++)
        for (let tx = Math.max(0, Math.floor(view[0] / T)); tx * T < Math.min(world.w, view[2]); tx++) {
          let c = groundTile(tx, ty, tier);
          if (!c) for (const t of GROUND_TIERS) { const k = ground.tiles.get(tx + ',' + ty + '@' + t); if (k) c = k; }
          if (c) ctx.drawImage(c, tx * T, ty * T, T, T);
        }
    }

    // ---------- frame ----------
    function drawEntity(e, need, now) {
      const c = S().canvasFor(e.sprite, need * e.k, queue, now);
      if (!c) return;
      const [x, y0, w, h] = e.rect, y = y0 + (e.oy || 0);
      if (e.rot) {
        ctx.save(); ctx.translate(e.x, e.y + (e.oy || 0)); ctx.rotate(e.rot); ctx.translate(-e.x, -e.y);
        if (e.flip) { ctx.translate(x + w, y0); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); } else ctx.drawImage(c, x, y0, w, h);
        ctx.restore();
      } else if (e.flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); ctx.restore(); }
      else ctx.drawImage(c, x, y, w, h);
    }
    function drawLeash(dog) {
      const walker = dog.leashTo;
      if (!walker) return;
      const wm = window.WS_ASSETS.meta[walker.asset], dm = window.WS_ASSETS.meta[dog.asset];
      if (!wm.hand || !dm.collar) return;
      const pt = (e, p) => [e.x + (e.flip ? -1 : 1) * (p[0] - e.sprite.anchor[0]) * e.k, e.y + (p[1] - e.sprite.anchor[1]) * e.k];
      const h = pt(walker, wm.hand), c = pt(dog, dm.collar);
      ctx.strokeStyle = '#C73E3A'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(h[0], h[1]); ctx.quadraticCurveTo((h[0] + c[0]) / 2, Math.max(h[1], c[1]) + 6, c[0], c[1]); ctx.stroke();
    }
    function render(now = false) {
      const t0 = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = world.background; ctx.fillRect(0, 0, vw, vh);
      const z = scale();
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - cam.x * z), dpr * (vh / 2 - cam.y * z));
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = SMOOTH;
      const [x0, y0] = toWorld(0, 0), [x1, y1] = toWorld(vw, vh);
      drawGround([x0, y0, x1, y1]);
      const need = z * dpr;
      let drawn = 0;
      for (const e of list) {
        const [x, y, w, h] = e.rect;
        if (x > x1 || y > y1 || x + w < x0 || y + h < y0) continue;
        drawEntity(e, need, now);
        if (e.leash) drawLeash(e);
        if (e.asset === 'environments/forsyth/fountain' && motionOn) drawFountain(e, performance.now() / 1000);
        drawn++;
      }
      for (const fx of effects) fx(ctx, z);
      if (beacon && world.target) {
        const [x, y, w, h] = world.target.rect;
        ctx.strokeStyle = '#FF6F61'; ctx.lineWidth = 4 / z; ctx.setLineDash([10 / z, 6 / z]);
        ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w * 0.9, h * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      dirty = false;
      return { drawn, ms: performance.now() - t0 };
    }
    function loop(t) {
      const dt = lastT ? t - lastT : 16;
      lastT = t;
      stepEase(dt);
      for (const fn of frameFns) if (fn({ t, dt })) dirty = true;
      if (motionOn) { animate(t); dirty = true; }
      const worked = queue.size ? queue.run(6) : false;
      if (dirty || worked) {
        const r = render();
        perf.frames++;
        perf.times.push(dt);
        if (perf.times.length > 2400) perf.times.shift();
        perf.last = r;
      }
      requestAnimationFrame(loop);
    }
    // ---------- picking ----------
    function pickWorld(wx, wy) {
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        if (!e.pickable) continue;
        const [x, y0, w, h] = e.rect, y = y0 + (e.oy || 0);
        if (wx < x || wy < y || wx > x + w || wy > y + h) continue;
        const [u, v] = local(e, wx, wy);
        if (S().alphaAt(e.sprite, u, v) > 40) return e;
      }
      return null;
    }
    // A tap picks what is drawn under it. If that is not a person, the nearest person within a small screen
    // radius wins instead (4 CSS px with a mouse, 12 with a finger), so tiny figures at low zoom are still
    // fair to tap. Rings are tested from the inside out, so a closer person always beats a farther one.
    function pick(clientX, clientY, opts = {}) {
      const r = canvas.getBoundingClientRect();
      const sx = clientX - r.left, sy = clientY - r.top;
      const [wx, wy] = toWorld(sx, sy);
      const hit = pickWorld(wx, wy);
      if (hit && hit.kind === 'person') return hit;
      const R = opts.touch ? 12 : 4, px = 1 / scale();
      for (let rr = 1; rr <= R; rr += 1) {                 // rings one CSS px apart: the nearest person wins
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2, p = pickWorld(wx + Math.cos(a) * rr * px, wy + Math.sin(a) * rr * px);
          if (p && p.kind === 'person') return p;
        }
      }
      return hit;
    }

    // ---------- validator (ADR-002 §7) ----------
    // Samples the target's own opaque pixels; a sample is hidden when anything drawn after the target
    // (people, props, trees, hedges) is opaque at that point. Effects (bubbles, kites) are ignored.
    function validateTarget(t = world.target) {
      const s = t.sprite, [vx, vy, vwid, vht] = s.vb, [ax, ay] = s.anchor;
      const headBottom = vy + vht * 0.36;
      const front = list.slice(t.order + 1).filter((e) => e.layer === 'world' && e.rect[0] < t.rect[0] + t.rect[2] && e.rect[0] + e.rect[2] > t.rect[0] && e.rect[1] < t.rect[1] + t.rect[3] && e.rect[1] + e.rect[3] > t.rect[1]);
      let head = 0, headVis = 0, all = 0, allVis = 0;
      for (let v = vy + 1; v < vy + vht; v += 2) for (let u = vx + 1; u < vx + vwid; u += 2) {
        if (S().alphaAt(s, u, v) < 120) continue;
        if (v > ay - 4) continue;                    // skip the ground shadow
        const wx = t.x + (t.flip ? -1 : 1) * (u - ax) * t.k, wy = t.y + (v - ay) * t.k;
        let hidden = false;
        for (const e of front) {
          const [x, y, w, h] = e.rect;
          if (wx < x || wy < y || wx > x + w || wy > y + h) continue;
          const [lu, lv] = local(e, wx, wy);
          if (S().alphaAt(e.sprite, lu, lv) > 60) { hidden = true; break; }
        }
        all++; if (!hidden) allVis++;
        if (v <= headBottom) { head++; if (!hidden) headVis++; }
      }
      const visibleShare = all ? allVis / all : 0, headShare = head ? headVis / head : 0;
      return { ok: headShare >= 0.6 && visibleShare >= 0.5, visibleShare, headShare, samples: all };
    }
    // The target paces around wherever he is finally placed, not where the first candidate put him.
    function settle(t) { t.hx = t.x; t.hy = t.y; if (t.travel) { t.travel.tx = t.x; t.travel.ty = t.y; } }
    // Walk the seeded candidates until one passes; difficulty decides how much may be hidden.
    function placeTarget() {
      const t = world.target, diff = world.identity.difficulty;
      const want = diff === 'easy' ? [0.92, 1.01] : diff === 'hard' ? [0.5, 0.86] : [0.7, 1.01];
      // Hard also needs company: a crowd close by and lookalikes within view. Normal needs some company.
      const need = diff === 'hard' ? { crowd: 6, decoys: 2 } : diff === 'normal' ? { crowd: 2, decoys: 0 } : { crowd: 0, decoys: 0 };
      const people = world.entities.filter((e) => e.kind === 'person' && !e.isTarget);
      const company = (c) => {
        let crowd = 0, decoys = 0;
        for (const p of people) {
          const d = Math.hypot(p.x - c.x, (p.y - c.y) * 2.2);
          if (d < 150) crowd++;
          if (d < 320 && p.traits && p.traits.length) decoys++;
        }
        return { crowd, decoys };
      };
      let fallback = null, best = null, tries = 0;
      for (const c of world.candidates) {
        tries++;
        t.x = c.x; t.y = c.y; t.flip = c.flip; t.spot = c.spot;
        t.rect = rectOf(t); sortList();
        const v = validateTarget(t);
        if (!v.ok) continue;
        const co = company(c);
        if (!fallback) fallback = { c, v };
        const inBand = v.visibleShare >= want[0] && v.visibleShare < want[1];
        if (inBand && co.crowd >= need.crowd && co.decoys >= need.decoys) { settle(t); return Object.assign({ tries, spot: c.spot }, co, v); }
        const score = (inBand ? 2 : 0) + Math.min(1, co.crowd / Math.max(1, need.crowd)) + Math.min(1, co.decoys / Math.max(1, need.decoys));
        if (!best || score > best.score) best = { c, v, score };
      }
      if (!fallback) throw new Error('no valid hiding spot for this seed');
      const { c } = best || fallback;
      t.x = c.x; t.y = c.y; t.flip = c.flip; t.spot = c.spot; t.rect = rectOf(t); sortList(); settle(t);
      return Object.assign({ tries, spot: c.spot, relaxed: true }, company(c), validateTarget(t));
    }

    // Test hook: move the target and report what the validator thinks of the new spot.
    function tryTarget(x, y, flip = 0) {
      const t = world.target;
      t.x = x; t.y = y; t.flip = flip; t.rect = rectOf(t); sortList(); dirty = true;
      return validateTarget(t);
    }

    return {
      load, resize, camera, pick, pickWorld, validateTarget, placeTarget, tryTarget, perf, list: () => list,
      onFrame(fn) { frameFns.push(fn); },
      addEffect(fn) { effects.push(fn); dirty = true; },
      removeEffect(fn) { effects = effects.filter((f) => f !== fn); dirty = true; },
      setBeacon(on) { beacon = on; dirty = true; },
      setMotion(on) { motionOn = on && !reduced; lastMove = 0; for (const e of world.entities) { e.oy = 0; e.rot = 0; if (e.sprite0) e.sprite = e.sprite0; } dirty = true; },
      get motion() { return motionOn; },
      invalidate() { dirty = true; },
      start() { decodeExtra(); requestAnimationFrame(loop); },
      renderNow() { return render(true); },
      get pendingWork() { return queue.size; },
      get viewport() { return { vw, vh, dpr }; },
      /** A small raster of the whole ground, for the minimap. */
      get groundImage() { return ground.base; },
    };
  }
  WS.engine = { create };
})();
