/* Page glue (Agent 3): INIT -> INTRO -> PLAYING -> WON, with FALLBACK from INIT, INTRO and PLAYING.
   Builds the world from the URL identity, loads sprites, places the target through the validator, and wires
   the timer, wrong guesses, hints, leaderboard and share links. DOM only; the canvas belongs to the engine. */
(function () {
  const WS = window.WS;
  const $ = (id) => document.getElementById(id);
  const fmt = (ms) => { const s = ms / 1000; return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0'); };
  let round = null;

  function toast(text) {
    const t = $('toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 1600);
  }
  function show(id) { for (const el of document.querySelectorAll('.overlay')) el.hidden = el.id !== id; }
  function fallback(reason) {
    if (round) round.state = 'FALLBACK';
    if (reason) console.warn('fallback:', reason);
    $('failText').textContent = reason && !/requested/.test(reason) ? 'Details: ' + reason : '';
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

  async function main() {
    const t0 = performance.now();
    const identity = WS.gameplay.readIdentity(location.search);
    round = WS.gameplay.createRound();
    WS.game = { identity, round, timings: {} };
    $('seedLabel').textContent = identity.seed + ' · ' + identity.difficulty + (identity.crowd ? ' · stress ' + identity.crowd : '');
    $('difficulty').value = identity.difficulty;
    $('density').value = identity.density;
    renderBoard();
    if (identity.fallback) throw new Error('fallback requested by URL');

    const world = WS.scenes[identity.scene].build(identity);
    const canvas = $('scene');
    const engine = WS.engine.create(canvas, world, { beacon: identity.beacon });
    Object.assign(WS.game, { world, engine });
    engine.resize();
    window.addEventListener('resize', () => engine.resize());

    const info = await engine.load((p) => { $('loadBar').style.width = Math.round(p * 100) + '%'; });
    WS.game.placement = engine.placeTarget();
    WS.game.timings.loadMs = performance.now() - t0;
    WS.game.timings.sprites = info.sprites;

    const pc = $('portrait'), s = world.target.sprite, pctx = pc.getContext('2d');
    const ph = pc.height, pw = (s.vb[2] / s.vb[3]) * ph;
    pctx.drawImage(s.img, (pc.width - pw) / 2, 0, pw, ph);

    engine.camera.reset();
    engine.renderNow();
    WS.game.timings.firstFrameMs = performance.now() - t0;
    engine.start();
    document.title = world.name + ' · Waldo\'s Savannah';
    $('sceneName').textContent = world.name;
    round.state = 'INTRO';
    show('intro');
    $('startBtn').focus();

    engine.onFrame(() => {
      if (round.state === 'PLAYING') $('timer').textContent = fmt(round.elapsed());
      $('zoomLabel').textContent = engine.camera.zoom.toFixed(1) + 'x';
      const here = world.districts.find((d) => engine.camera.y >= d.y0 && engine.camera.y < d.y0 + d.h);
      if (here && $('hereLabel').textContent !== here.name) $('hereLabel').textContent = here.name;
      return false;
    });

    $('startBtn').addEventListener('click', () => {
      round.state = 'PLAYING'; round.startedAt = performance.now(); round.wrong = 0; round.hints = 0; round.saved = false;
      $('wrong').textContent = '0'; $('hintCount').textContent = '';
      show(null);
      canvas.focus();
    });
    $('zoomIn').addEventListener('click', () => engine.camera.zoomAt(1.3));
    $('zoomOut').addEventListener('click', () => engine.camera.zoomAt(1 / 1.3));
    $('zoomReset').addEventListener('click', () => engine.camera.reset());

    // Hints: the first names the area, the second pans there and rings a wide circle (never the exact spot).
    let hintFx = null;
    $('hintBtn').addEventListener('click', () => {
      if (round.state !== 'PLAYING') return;
      const t = world.target, rng = WS.rng.make(WS.rng.identityKey(identity) + '#hint');
      if (round.hints === 0) {
        round.hints = 1;
        toast('Hint: he is ' + world.area(t.x, t.y) + '.');
      } else if (round.hints === 1) {
        round.hints = 2;
        const a = rng() * Math.PI * 2, d = 80 + rng() * 120, cx = t.x + Math.cos(a) * d, cy = t.y - 40 + Math.sin(a) * d * 0.6, r = 300;
        engine.camera.centerOn(cx, cy, Math.max(engine.camera.zoom, 1.6));
        if (hintFx) engine.removeEffect(hintFx);
        hintFx = (ctx, z) => { ctx.save(); ctx.strokeStyle = 'rgba(255,111,97,.9)'; ctx.lineWidth = 3 / z; ctx.setLineDash([12 / z, 8 / z]); ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.65, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
        engine.addEffect(hintFx);
        toast('Hint: look inside the dashed circle.');
      } else { toast('No more hints this round.'); return; }
      $('hintCount').textContent = round.hints + '/2';
    });

    $('boardBtn').addEventListener('click', () => { renderBoard(); $('board').hidden = false; $('boardClose').focus(); });
    $('boardClose').addEventListener('click', () => { $('board').hidden = true; });
    $('boardClear').addEventListener('click', () => { WS.leaderboard.clear(); renderBoard(); toast('Leaderboard cleared.'); });

    $('difficulty').addEventListener('change', (e) => go({ difficulty: e.target.value }));
    $('density').addEventListener('change', (e) => go({ density: e.target.value }));
    $('testFallbackBtn').addEventListener('click', () => fallback('requested by the test button'));
    $('againBtn').addEventListener('click', () => go({ seed: WS.gameplay.newSeed() }));

    $('saveBtn').addEventListener('click', () => {
      if (round.saved) return;
      const name = $('nameInput').value.trim();
      if (!name) { $('nameInput').focus(); toast('Type a name first.'); return; }
      const res = WS.leaderboard.save({ username: name, elapsedMs: Math.round(round.elapsed()), wrongGuesses: round.wrong, seed: identity.seed, scene: identity.scene, difficulty: identity.difficulty, hints: round.hints, artVersion: identity.artVersion });
      if (!res.ok) { toast(res.list.length ? 'Not saved: storage is unavailable.' : 'Not saved.'); return; }
      round.saved = true;
      $('saveBtn').disabled = true; $('nameInput').disabled = true;
      toast(res.rank ? 'Saved: #' + res.rank + ' on this device.' : 'Saved, but not in the top ' + WS.leaderboard.MAX + '.');
      renderBoard(res.rank);
    });
    $('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('saveBtn').click(); });
    $('copyBtn').addEventListener('click', async () => {
      const url = $('shareBox').value;
      try { await navigator.clipboard.writeText(url); toast('Link copied.'); }
      catch (e) { $('shareBox').select(); toast('Select the link and copy it.'); }
    });

    function marker(wx, wy, ok) {
      const born = performance.now();
      const fx = (ctx, z) => {
        const a = 1 - (performance.now() - born) / 700;
        if (a <= 0) { engine.removeEffect(fx); return; }
        ctx.strokeStyle = ok ? 'rgba(0,200,110,' + a + ')' : 'rgba(229,57,53,' + a + ')';
        ctx.lineWidth = 3 / z;
        ctx.beginPath(); ctx.arc(wx, wy, (14 + (1 - a) * 16) / z, 0, Math.PI * 2); ctx.stroke();
      };
      engine.addEffect(fx);
    }

    WS.input.attach(canvas, engine, (cx, cy) => {
      if (round.state !== 'PLAYING') return;
      const hit = engine.pick(cx, cy);
      const r = canvas.getBoundingClientRect();
      const [wx, wy] = engine.camera.toWorld(cx - r.left, cy - r.top);
      if (hit && hit.isTarget) {
        round.state = 'WON'; round.endedAt = performance.now();
        marker(wx, wy, true);
        if (hintFx) engine.removeEffect(hintFx);
        const pts = WS.leaderboard.points({ elapsedMs: round.elapsed(), wrongGuesses: round.wrong, hints: round.hints, difficulty: identity.difficulty });
        $('winPoints').textContent = pts.toLocaleString() + ' points' + (identity.difficulty !== 'easy' ? ' (×' + WS.leaderboard.MULT[identity.difficulty] + ' for ' + identity.difficulty + ')' : '');
        $('winText').textContent = 'You found him in ' + fmt(round.elapsed()) + ' with ' + round.wrong + ' wrong guess' + (round.wrong === 1 ? '' : 'es') + (round.hints ? ' and ' + round.hints + ' hint' + (round.hints > 1 ? 's' : '') : '') + '.';
        $('winSpot').textContent = 'He was ' + world.area(world.target.x, world.target.y) + '.';
        $('shareBox').value = WS.gameplay.shareUrl(identity, location.href);
        $('saveBtn').disabled = false; $('nameInput').disabled = false;
        engine.setBeacon(true);
        show('won');
        $('nameInput').focus();
      } else {
        round.wrong++;
        $('wrong').textContent = String(round.wrong);
        marker(wx, wy, false);
        toast(hit && hit.kind === 'person' ? 'Not him. Keep looking.' : 'Nobody there.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('recoverBtn').addEventListener('click', () => go({ seed: WS.gameplay.newSeed() }));
  });
  main().catch((err) => fallback(String(err && err.message ? err.message : err)));
})();
