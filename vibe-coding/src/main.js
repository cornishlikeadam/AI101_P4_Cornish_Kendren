/* Page glue (Agent 3): INIT -> INTRO -> PLAYING -> WON, with FALLBACK from INIT, INTRO and PLAYING.
   Builds the world from the URL identity, loads sprites, places the target through the validator, and wires
   the timer, wrong guesses, hints, leaderboard and share links. DOM only; the canvas belongs to the engine.
   The player-facing text is short on purpose: the game is played by children. */
(function () {
  const WS = window.WS;
  const $ = (id) => document.getElementById(id);
  const fmt = (ms) => { const s = ms / 1000; return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0'); };
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let round = null;

  function toast(text, ms = 2200) {
    const t = $('toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), ms);
  }
  // A short word that floats up from where the player tapped.
  function pop(text, cx, cy, colour) {
    const el = document.createElement('div');
    el.className = 'pop'; el.textContent = text; el.style.left = cx + 'px'; el.style.top = cy + 'px';
    if (colour) el.style.background = colour;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  function show(id) {
    for (const el of document.querySelectorAll('.overlay')) el.hidden = el.id !== id;
    document.body.classList.toggle('playing', !id || id === 'won');
  }
  function fallback(reason) {
    if (round) round.state = 'FALLBACK';
    if (reason) console.warn('fallback:', reason);
    $('failText').textContent = reason && !/requested/.test(reason) ? reason : '';
    $('menu').hidden = true;
    show('failed');
    $('recoverBtn').focus();
  }
  function go(params) {
    const q = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(params)) { if (v == null) q.delete(k); else q.set(k, v); }
    q.delete('fallback');
    location.search = q.toString();
  }

  // Leaderboard list, built with textContent only (never innerHTML: names are user input).
  function renderBoard(highlight) {
    const ol = $('boardList');
    ol.textContent = '';
    const list = WS.leaderboard.load();
    $('boardEmpty').hidden = list.length > 0;
    list.forEach((r, i) => {
      const li = document.createElement('li');
      if (highlight && i + 1 === highlight) li.className = 'mine';
      const name = document.createElement('span'); name.className = 'name'; name.textContent = r.username;
      const meta = document.createElement('span'); meta.className = 'meta';
      meta.textContent = r.points.toLocaleString() + ' pts · ' + fmt(r.elapsedMs) + ' · ' + r.wrongGuesses + ' wrong' + (r.hints ? ' · ' + r.hints + ' hint' + (r.hints > 1 ? 's' : '') : '') + (r.difficulty ? ' · ' + r.difficulty : '');
      const seed = document.createElement('span'); seed.className = 'seed'; seed.textContent = r.seed;
      li.append(name, meta, seed);
      ol.appendChild(li);
    });
  }
  function drawPortrait(canvas, sprite) {
    const ctx = canvas.getContext('2d'), h = canvas.height, w = (sprite.vb[2] / sprite.vb[3]) * h;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sprite.img, (canvas.width - w) / 2, 0, w, h);
  }

  // Landmarks the second hint can point to, by asset.
  const LANDMARKS = {
    'environments/forsyth/fountain': 'the fountain', 'props/landmarks/obelisk': 'the tall obelisk', 'props/landmarks/pulaski-monument': 'the Pulaski Monument',
    'props/landmarks/city-hall-dome': 'City Hall\'s gold dome', 'props/landmarks/waving-girl': 'the Waving Girl statue', 'environments/monterey/temple': 'the temple',
    'environments/monterey/mercer-house': 'Mercer House', 'props/festival/tent': 'the festival tents', 'props/market/stall-peaches': 'the market stalls',
    'props/furniture/cafe-table': 'the café tables', 'props/river/riverboat': 'the riverboat', 'props/vehicles/trolley': 'a trolley', 'props/street/bus-stop': 'the bus stop',
    'props/furniture/park-bench': 'a park bench', 'props/river/talmadge-bridge': 'the Talmadge Bridge', 'props/landmarks/plant-riverside-stacks': 'Plant Riverside\'s smokestacks',
    'props/landmarks/old-harbor-light': 'the Old Harbor Light', 'environments/wings/first-african-baptist': 'First African Baptist Church', 'environments/wings/olde-pink-house': 'the Olde Pink House',
    'props/landmarks/wesley-statue': 'John Wesley\'s statue', 'environments/wings/cemetery-gate': 'the cemetery gate', 'props/landmarks/armillary-sphere': 'the armillary sphere',
    'environments/wings/gazebo': 'the gazebo', 'environments/wings/wesley-monumental': 'Wesley Monumental Church', 'props/street/lemonade-stand': 'the lemonade stand', 'props/river/container-ship': 'the container ship', 'props/vegetation/live-oak': 'a big oak tree', 'props/vegetation/live-oak-tall': 'a big oak tree',
  };

  async function main() {
    const t0 = performance.now();
    const identity = WS.gameplay.readIdentity(location.search);
    round = WS.gameplay.createRound();
    WS.game = { identity, round, timings: {} };
    $('seedLabel').textContent = 'Seed ' + identity.seed + (identity.crowd ? ' · crowd ' + identity.crowd : '');
    $('difficulty').value = identity.difficulty; $('introDifficulty').value = identity.difficulty;
    $('density').value = identity.density;
    renderBoard();
    wireMenu();
    if (identity.fallback) throw new Error('fallback requested by URL');

    const world = WS.scenes[identity.scene].build(identity);
    const canvas = $('scene');
    const engine = WS.engine.create(canvas, world, { beacon: identity.beacon });
    Object.assign(WS.game, { world, engine });
    engine.resize();
    // Rotation, window resizes and mobile toolbars showing or hiding all change the viewport; the camera
    // keeps its centre and recomputes its zoom floor and pan limits.
    const onResize = () => { engine.resize(); drawMinimap(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 150));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(canvas);

    const info = await engine.load((p) => { $('loadBar').style.width = Math.round(p * 100) + '%'; });
    WS.game.placement = engine.placeTarget();
    WS.game.timings.loadMs = performance.now() - t0;
    WS.game.timings.sprites = info.sprites;
    drawPortrait($('portrait'), world.target.sprite);
    drawPortrait($('bigPortrait'), world.target.sprite);

    engine.camera.reset();
    engine.renderNow();
    WS.game.timings.firstFrameMs = performance.now() - t0;
    engine.start();
    document.title = world.name + ' · Waldo\'s Savannah';
    round.state = 'INTRO';
    show('intro');
    $('startBtn').focus();

    // ---------- minimap: the whole city, with the view as a box; tap to jump ----------
    const mm = $('minimap'), mctx = mm.getContext('2d');
    function drawMinimap() {
      const g = engine.groundImage; if (!g) return;
      const W = mm.width, H = mm.height, sx = W / world.w, sy = H / world.h;
      mctx.drawImage(g, 0, 0, W, H);
      const [x0, y0, x1, y1] = engine.camera.visible();
      mctx.strokeStyle = '#FF6F61'; mctx.lineWidth = 3; mctx.strokeRect(x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy);
    }
    const jump = (e) => { const r = mm.getBoundingClientRect(); engine.camera.centerOn((e.clientX - r.left) / r.width * world.w, (e.clientY - r.top) / r.height * world.h); };
    mm.addEventListener('pointerdown', (e) => { mm.setPointerCapture(e.pointerId); jump(e); });
    mm.addEventListener('pointermove', (e) => { if (e.buttons) jump(e); });
    mm.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); engine.camera.reset(); } });

    let lastCam = '';
    engine.onFrame(() => {
      if (round.state === 'PLAYING') $('timer').textContent = fmt(round.elapsed());
      const c = engine.camera, key = c.x.toFixed(0) + ',' + c.y.toFixed(0) + ',' + c.zoom.toFixed(3);
      if (key !== lastCam) {
        lastCam = key; drawMinimap();
        const here = world.districts.find((d) => c.y >= d.y0 && c.y < d.y0 + d.h);
        const label = here ? '📍 ' + here.name : '';
        if ($('hereLabel').textContent !== label) $('hereLabel').textContent = label;
      }
      return false;
    });

    $('startBtn').addEventListener('click', () => {
      round.state = 'PLAYING'; round.startedAt = performance.now(); round.wrong = 0; round.hints = 0; round.saved = false;
      $('wrong').textContent = '0'; $('hintCount').textContent = '';
      show(null);
      canvas.focus();
    });
    $('introDifficulty').addEventListener('change', (e) => go({ difficulty: e.target.value }));
    $('zoomIn').addEventListener('click', () => engine.camera.zoomSmooth(1.4));
    $('zoomOut').addEventListener('click', () => engine.camera.zoomSmooth(1 / 1.4));
    $('zoomReset').addEventListener('click', () => engine.camera.reset());

    // ---------- hints: a district, then a landmark near him, then a pulsing circle round the area ----------
    let hintFx = null;
    const MAX_HINTS = 3;
    $('hintBtn').addEventListener('click', () => {
      if (round.state !== 'PLAYING') return;
      const t = world.target, rng = WS.rng.make(WS.rng.identityKey(identity) + '#hint');
      const district = world.districts.find((d) => t.y >= d.y0 && t.y < d.y0 + d.h);
      if (round.hints === 0) {
        round.hints = 1;
        toast('Hint: he is ' + world.area(t.x, t.y) + '.', 3200);
        // glide toward his part of the city: his band, and his third of the width
        const third = Math.floor(t.x / (world.w / 3)), cx = (third + 0.5) * world.w / 3;
        if (district) engine.camera.centerOn(cx, district.y0 + district.h / 2);
      } else if (round.hints === 1) {
        round.hints = 2;
        // the nearest named landmark that is not right on top of him
        let best = null;
        for (const e of world.entities) {
          const name = LANDMARKS[e.asset]; if (!name) continue;
          const d = Math.hypot(e.x - t.x, (e.y - t.y) * 1.6);
          if (d < 60 || d > 900) continue;
          if (!best || d < best.d) best = { e, d, name };
        }
        const a = rng() * Math.PI * 2, d = 80 + rng() * 120, cx = t.x + Math.cos(a) * d, cy = t.y - 40 + Math.sin(a) * d * 0.6;
        engine.camera.centerOn(cx, cy, Math.max(engine.camera.zoom, 1.6));
        toast(best ? 'Hint: look near ' + best.name + '.' : 'Hint: he is close to here.', 3200);
      } else if (round.hints === 2) {
        round.hints = 3;
        // a dashed ring that contains him but is not centred on him, pulsing for a few seconds
        const a = rng() * Math.PI * 2, d = 60 + rng() * 90, cx = t.x + Math.cos(a) * d, cy = t.y - 40 + Math.sin(a) * d * 0.6, r = 260, born = performance.now();
        engine.camera.centerOn(cx, cy, Math.max(engine.camera.zoom, 1.8));
        if (hintFx) engine.removeEffect(hintFx);
        hintFx = (ctx, z) => {
          const age = (performance.now() - born) / 1000;
          if (age > 8) { engine.removeEffect(hintFx); hintFx = null; return; }
          const pulse = reduced ? 1 : 1 + Math.sin(age * 5) * 0.04;
          ctx.save(); ctx.globalAlpha = age > 6 ? 1 - (age - 6) / 2 : 1;
          ctx.strokeStyle = 'rgba(255,111,97,.95)'; ctx.lineWidth = 4 / z; ctx.setLineDash([14 / z, 9 / z]);
          ctx.beginPath(); ctx.ellipse(cx, cy, r * pulse, r * 0.65 * pulse, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          engine.invalidate();
        };
        engine.addEffect(hintFx);
        toast('Hint: he is inside the circle!', 3200);
      } else { toast('No more hints. You can do it!'); return; }
      $('hintCount').textContent = round.hints + '/' + MAX_HINTS;
    });

    $('againBtn').addEventListener('click', () => go({ seed: WS.gameplay.newSeed() }));
    $('saveBtn').addEventListener('click', () => {
      if (round.saved) return;
      const name = $('nameInput').value.trim();
      if (!name) { $('nameInput').focus(); toast('Type a name first.'); return; }
      const res = WS.leaderboard.save({ username: name, elapsedMs: Math.round(round.elapsed()), wrongGuesses: round.wrong, seed: identity.seed, scene: identity.scene, difficulty: identity.difficulty, hints: round.hints, artVersion: identity.artVersion });
      if (!res.ok) { toast(res.list.length ? 'Not saved: storage is off.' : 'Not saved.'); return; }
      round.saved = true;
      $('saveBtn').disabled = true; $('nameInput').disabled = true;
      toast(res.rank ? 'Saved! You are #' + res.rank + '.' : 'Saved.');
      renderBoard(res.rank);
    });
    $('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('saveBtn').click(); });
    $('copyBtn').addEventListener('click', async () => {
      const url = $('shareBox').value;
      try { await navigator.clipboard.writeText(url); toast('Link copied.'); }
      catch (e) { $('shareBox').select(); toast('Select the link and copy it.'); }
    });

    // ---------- feedback on the canvas ----------
    function marker(wx, wy, ok) {
      const born = performance.now();
      const fx = (ctx, z) => {
        const a = 1 - (performance.now() - born) / 700;
        if (a <= 0) { engine.removeEffect(fx); return; }
        ctx.strokeStyle = ok ? 'rgba(0,200,110,' + a + ')' : 'rgba(229,57,53,' + a + ')';
        ctx.lineWidth = 3 / z;
        ctx.beginPath(); ctx.arc(wx, wy, (14 + (1 - a) * 16) / z, 0, Math.PI * 2); ctx.stroke();
        engine.invalidate();
      };
      engine.addEffect(fx);
    }
    // Confetti over the winner for two seconds (skipped with reduced motion).
    function confetti(wx, wy) {
      if (reduced) return;
      const born = performance.now(), cols = ['#FF6F61', '#FFCA28', '#1E88E5', '#1FA971', '#7C4DFF', '#FFFFFF'];
      const bits = Array.from({ length: 70 }, (_, i) => ({ a: (i / 70) * Math.PI * 2 + Math.random() * 0.3, v: 120 + Math.random() * 220, c: cols[i % cols.length], s: 3 + Math.random() * 4, r: Math.random() * 6 }));
      const fx = (ctx, z) => {
        const t = (performance.now() - born) / 1000;
        if (t > 2.2) { engine.removeEffect(fx); return; }
        ctx.save(); ctx.globalAlpha = Math.min(1, 2.2 - t);
        for (const b of bits) {
          const x = wx + Math.cos(b.a) * b.v * t, y = wy - 60 + Math.sin(b.a) * b.v * t * 0.7 + 260 * t * t;
          ctx.fillStyle = b.c; ctx.save(); ctx.translate(x, y); ctx.rotate(b.r + t * 8); ctx.fillRect(-b.s / z / 2, -b.s / z / 4, b.s / z, b.s / z / 2); ctx.restore();
        }
        ctx.restore(); engine.invalidate();
      };
      engine.addEffect(fx);
    }
    const MISS = ['Not Waldo!', 'Nope!', 'Try again!', 'So close!', 'Keep looking!'];

    WS.input.attach(canvas, engine, (cx, cy, opts) => {
      if (round.state !== 'PLAYING') return;
      const hit = engine.pick(cx, cy, opts);
      const r = canvas.getBoundingClientRect();
      const [wx, wy] = engine.camera.toWorld(cx - r.left, cy - r.top);
      if (hit && hit.isTarget) {
        round.state = 'WON'; round.endedAt = performance.now();
        if (hintFx) engine.removeEffect(hintFx);
        marker(wx, wy, true);
        const t = world.target;
        // frame him in the upper part of the screen, above the win card
        const zw = Math.max(engine.camera.zoom, 2.2), vh = canvas.getBoundingClientRect().height;
        engine.camera.centerOn(t.x, t.y - 40 + vh * 0.22 / (zw * engine.camera.ZOOM_BASE), zw);
        engine.setBeacon(true);
        confetti(t.x, t.y);
        pop('Found him!', cx, cy, '#1FA971');
        const pts = WS.leaderboard.points({ elapsedMs: round.elapsed(), wrongGuesses: round.wrong, hints: round.hints, difficulty: identity.difficulty });
        const secs = round.elapsed() / 1000;
        $('winStars').textContent = '⭐'.repeat(round.wrong + round.hints === 0 && secs < 120 ? 3 : round.wrong + round.hints <= 2 ? 2 : 1);
        $('winTime').textContent = fmt(round.elapsed());
        $('winPoints').textContent = pts.toLocaleString() + ' points';
        $('winText').textContent = round.wrong + ' wrong guess' + (round.wrong === 1 ? '' : 'es') + (round.hints ? ' · ' + round.hints + ' hint' + (round.hints > 1 ? 's' : '') : '');
        $('winSpot').textContent = 'He was ' + world.area(t.x, t.y) + '.';
        $('shareBox').value = WS.gameplay.shareUrl(identity, location.href);
        $('saveBtn').disabled = false; $('nameInput').disabled = false;
        // let the player see him first, then celebrate
        setTimeout(() => { show('won'); $('againBtn').focus(); }, reduced ? 200 : 1100);
      } else {
        round.wrong++;
        $('wrong').textContent = String(round.wrong);
        const s = $('wrongStat'); s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
        marker(wx, wy, false);
        pop(hit && hit.kind === 'person' ? MISS[round.wrong % MISS.length] : 'Nobody there!', cx, cy);
      }
    });
  }

  function wireMenu() {
    const menu = $('menu'), btn = $('menuBtn');
    const set = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => set(menu.hidden));
    document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); $('board').hidden = true; } });
    $('boardBtn').addEventListener('click', () => { set(false); renderBoard(); $('board').hidden = false; $('boardClose').focus(); });
    $('boardClose').addEventListener('click', () => { $('board').hidden = true; });
    $('boardClear').addEventListener('click', () => { WS.leaderboard.clear(); renderBoard(); toast('Scores cleared.'); });
    $('newRoundBtn').addEventListener('click', () => go({ seed: WS.gameplay.newSeed() }));
    $('difficulty').addEventListener('change', (e) => go({ difficulty: e.target.value }));
    $('density').addEventListener('change', (e) => go({ density: e.target.value }));
    $('testFallbackBtn').addEventListener('click', () => fallback('requested by the test button'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('recoverBtn').addEventListener('click', () => go({ seed: WS.gameplay.newSeed() }));
  });
  main().catch((err) => fallback(String(err && err.message ? err.message : err)));
})();
