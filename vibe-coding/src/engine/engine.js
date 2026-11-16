/* Engine (Agent 1): camera, ground tiles, depth-sorted sprite drawing, picking and the target validator.
   Canvas 2D behind the small interface in HANDOFF.md, so the renderer can be swapped later. */
(function () {
  const WS = (window.WS = window.WS || {});
  const S = () => WS.sprites;
  const ZOOM_BASE = 0.4;                 // 1.0x zoom = 0.4 CSS px per world unit (an adult is about 30 px tall)
  const ZOOM_MIN = 0.6, ZOOM_MAX = 3.5;  // the directive's 0.6x to 3.5x range
  const GROUND_TILE = 256;
  const GROUND_TIERS = [0.5, 1, 2, 3, 5];
  const SMOOTH = 'low';               // bilinear; sprite tiers are chosen near the target scale so this stays crisp

  function create(canvas, world, opts = {}) {
    const ctx = canvas.getContext('2d');
    const queue = S().makeQueue();
    const frameFns = [];
    const cam = { x: world.w / 2, y: world.h / 2, zoom: 1 };   // zoom is the 0.6x..3.5x multiplier
    let vw = 0, vh = 0, dpr = 1, dirty = true, beacon = !!opts.beacon, effects = [], lastT = 0;
    const perf = { frames: 0, times: [] };

    // ---------- world list in draw order ----------
    const LAYER_ORDER = { ground: 0, far: 1, world: 2, effects: 3 };
    let list = [];
    function sortList() {
      list = world.entities.slice().sort((a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || a.y - b.y || (a.x - b.x) || (a.id < b.id ? -1 : 1));
      list.forEach((e, i) => (e.order = i));
    }
    function rectOf(e) {
      const s = e.sprite, [vx, vy, w, h] = s.vb, [ax, ay] = s.anchor, k = e.k;
      const left = e.flip ? e.x - (vx + w - ax) * k : e.x + (vx - ax) * k;
      return [left, e.y + (vy - ay) * k, w * k, h * k];
    }
    // world point -> sprite SVG coordinates
    function local(e, wx, wy) {
      const [ax, ay] = e.sprite.anchor;
      return [e.flip ? ax - (wx - e.x) / e.k : ax + (wx - e.x) / e.k, ay + (wy - (e.y + (e.oy || 0))) / e.k];
    }

    // ---------- motion ----------
    // Procedural motion, not drawn frames: walkers bounce in step, standers breathe, kites sway, bubbles rise,
    // the fountain sparkles. Offsets never change placement, and prefers-reduced-motion freezes everything.
    const WALKERS = /bodies\/(walk|dress|tote|cane|child)$|archetypes\/(jogger|tourist-photographer|scad-student-portfolio|dog-walker|parent-stroller|tour-guide|target-walker|cyclist)$/;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let motionOn = !reduced && opts.motion !== false;
    function assignMotion() {
      for (const e of world.entities) {
        const h = WS.rng.fnv1a(e.id) / 4294967296;
        e.phase = h * Math.PI * 2;
        e.motion = e.kind === 'person' ? (WALKERS.test(e.asset) ? (e.asset.endsWith('jogger') ? 'jog' : 'walk') : 'idle')
          : e.asset === 'effects/kite' ? 'kite' : e.asset === 'effects/bubbles' ? 'rise' : e.asset.includes('animals') ? 'idle' : null;
        e.speed = 0.85 + h * 0.35;
      }
    }
    function animate(t) {
      const s = t / 1000;
      for (const e of list) {
        if (!e.motion) continue;
        const p = s * e.speed * Math.PI * 2 + e.phase;
        if (e.motion === 'walk') e.oy = -Math.abs(Math.sin(p * 0.9)) * 1.8;
        else if (e.motion === 'jog') e.oy = -Math.abs(Math.sin(p * 1.4)) * 3.2;
        else if (e.motion === 'idle') e.oy = Math.sin(p * 0.25) * 0.5;
        else if (e.motion === 'kite') { e.oy = Math.sin(p * 0.35) * 6; e.rot = Math.sin(p * 0.27) * 0.08; }
        else if (e.motion === 'rise') e.oy = -((s * 6 + e.phase * 4) % 14);
      }
    }
    function drawFountain(s) {
      const f = world.fountain;
      if (!f) return;
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
    const ground = { img: null, base: null, tiles: new Map() };
    async function load(progress) {
      for (const e of world.entities) e.sprite = S().forEntity(e);
      const sprites = [...new Set(world.entities.map((e) => e.sprite))];
      let done = 0;
      const gsvg = window.WS_ASSETS.svg[world.ground];
      ground.img = new Image();
      ground.img.src = URL.createObjectURL(new Blob([gsvg], { type: 'image/svg+xml' }));
      const jobs = [ground.img.decode()].concat(sprites.map((s) => S().decode(s).then(() => { S().buildMask(s); progress && progress(++done / sprites.length); })));
      await Promise.all(jobs);
      ground.base = document.createElement('canvas');
      ground.base.width = world.w * 0.5; ground.base.height = world.h * 0.5;
      ground.base.getContext('2d').drawImage(ground.img, 0, 0, ground.base.width, ground.base.height);
      for (const e of world.entities) { e.rect = rectOf(e); e.pickable = e.layer === 'world' || e.layer === 'ground'; }
      assignMotion();
      sortList();
      return { sprites: sprites.length };
    }

    // ---------- camera ----------
    const scale = () => cam.zoom * ZOOM_BASE;            // CSS px per world unit
    function clamp() {
      cam.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, cam.zoom));
      const hw = vw / 2 / scale(), hh = vh / 2 / scale();
      cam.x = hw * 2 >= world.w ? world.w / 2 : Math.max(hw, Math.min(world.w - hw, cam.x));
      cam.y = hh * 2 >= world.h ? world.h / 2 : Math.max(hh, Math.min(world.h - hh, cam.y));
      dirty = true;
    }
    const toWorld = (sx, sy) => [cam.x + (sx - vw / 2) / scale(), cam.y + (sy - vh / 2) / scale()];
    const toScreen = (wx, wy) => [(wx - cam.x) * scale() + vw / 2, (wy - cam.y) * scale() + vh / 2];
    const camera = {
      get zoom() { return cam.zoom; }, get x() { return cam.x; }, get y() { return cam.y; },
      ZOOM_MIN, ZOOM_MAX, ZOOM_BASE,
      panBy(dxCss, dyCss) { cam.x -= dxCss / scale(); cam.y -= dyCss / scale(); clamp(); },
      zoomAt(factor, sx = vw / 2, sy = vh / 2) {
        const [wx, wy] = toWorld(sx, sy);
        cam.zoom *= factor; clamp();
        const [nx, ny] = toWorld(sx, sy);
        cam.x += wx - nx; cam.y += wy - ny; clamp();
      },
      centerOn(wx, wy, zoom) { if (zoom) cam.zoom = zoom; cam.x = wx; cam.y = wy; clamp(); },
      reset() { cam.zoom = 1; cam.x = world.w / 2; cam.y = world.h / 2; clamp(); },
      fit() { cam.zoom = Math.max(ZOOM_MIN, Math.min(vw / world.w, vh / world.h) / ZOOM_BASE); cam.x = world.w / 2; cam.y = world.h / 2; clamp(); },
      toWorld, toScreen,
    };
    function resize() {
      const r = canvas.getBoundingClientRect();
      vw = r.width; vh = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      clamp();
    }

    // ---------- ground ----------
    function groundTile(tx, ty, tier) {
      const key = tx + ',' + ty + '@' + tier;
      let c = ground.tiles.get(key);
      if (c) return c;
      queue.add('ground:' + key, () => rasterGround(tx, ty, tier));
      return null;
    }
    function rasterGround(tx, ty, tier) {
      const c = document.createElement('canvas');
      const T = GROUND_TILE, px = Math.ceil(T * tier);
      c.width = px; c.height = px;
      c.getContext('2d').drawImage(ground.img, tx * T, ty * T, T, T, 0, 0, px, px);
      ground.tiles.set(tx + ',' + ty + '@' + tier, c);
      if (ground.tiles.size > 260) { const first = ground.tiles.keys().next().value; ground.tiles.delete(first); }
    }
    function drawGround(view) {
      const need = scale() * dpr;
      ctx.drawImage(ground.base, 0, 0, world.w, world.h);
      if (need <= 0.55) return;
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
      const walker = world.entities.find((p) => p.id === dog.leash);
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
        if (e.asset === 'environments/forsyth/fountain' && motionOn) drawFountain(performance.now() / 1000);
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
    function pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const sx = clientX - r.left, sy = clientY - r.top;
      const [wx, wy] = toWorld(sx, sy);
      let hit = pickWorld(wx, wy);
      if (!hit) {                                   // forgive a near miss of up to 4 CSS px
        const d = 4 / scale();
        for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]]) { hit = pickWorld(wx + ox, wy + oy); if (hit) break; }
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
        if (inBand && co.crowd >= need.crowd && co.decoys >= need.decoys) return Object.assign({ tries, spot: c.spot }, co, v);
        const score = (inBand ? 2 : 0) + Math.min(1, co.crowd / Math.max(1, need.crowd)) + Math.min(1, co.decoys / Math.max(1, need.decoys));
        if (!best || score > best.score) best = { c, v, score };
      }
      if (!fallback) throw new Error('no valid hiding spot for this seed');
      const { c } = best || fallback;
      t.x = c.x; t.y = c.y; t.flip = c.flip; t.spot = c.spot; t.rect = rectOf(t); sortList();
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
      setMotion(on) { motionOn = on && !reduced; for (const e of world.entities) { e.oy = 0; e.rot = 0; } dirty = true; },
      get motion() { return motionOn; },
      invalidate() { dirty = true; },
      start() { requestAnimationFrame(loop); },
      renderNow() { return render(true); },
      get pendingWork() { return queue.size; },
      get viewport() { return { vw, vh, dpr }; },
    };
  }
  WS.engine = { create };
})();
