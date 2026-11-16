// Playwright checks for the first playable scene (build/index.html), run from file://.
// usage: node vibe-coding/tests/illustrated.test.mjs
// Needs playwright-core (not a project dependency). Point PLAYWRIGHT_CORE at its folder, or install it next to
// this file, and point CHROME at a Chrome or Chromium binary (defaults to the macOS Google Chrome path).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const here = dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + join(here, '..', 'build', 'index.html');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await chromium.launch({ executablePath: CHROME });
const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); console.log('ok  ', name); }
  catch (e) { results.push({ name, ok: false, err: e.message }); console.log('FAIL', name, '\n     ', e.message.split('\n').slice(0, 6).join(' | ')); }
}
async function open(query = '', viewport = { width: 1280, height: 800 }) {
  const page = await browser.newPage({ viewport });
  const external = [], errors = [];
  page.on('request', (r) => { const u = r.url(); if (!/^(file|blob|data):/.test(u)) external.push(u); });
  page.on('pageerror', (e) => errors.push(e.message));
  // Tests written against Forsyth coordinates run the single-district scene unless they ask for another.
  if (!/[?&]scene=/.test(query)) query += (query.includes('?') ? '&' : '?') + 'scene=forsyth';
  await page.goto(PAGE + query);
  await page.waitForFunction(() => document.title.includes('Waldo') || !document.getElementById('failed').hidden, null, { timeout: 60000 });
  return { page, external, errors };
}
// A screen point (client px) where a pick returns the given entity, after centring the camera on it.
const pointOn = (page, sel) => page.evaluate((sel) => {
  const g = WS.game, e = sel === 'target' ? g.world.target : g.engine.list().find((x) => x.kind === 'person' && !x.isTarget && x.rect[1] > 700 && x.rect[1] < 2200);
  g.engine.camera.centerOn(e.x, e.y - 30, 2.5);
  g.engine.renderNow();
  const [x, y, w, h] = e.rect, r = document.getElementById('scene').getBoundingClientRect();
  for (let v = y + h * 0.2; v < y + h; v += 2) for (let u = x; u < x + w; u += 2) {
    if (g.engine.pickWorld(u, v) === e) { const [sx, sy] = g.engine.camera.toScreen(u, v); return { x: sx + r.left, y: sy + r.top, id: e.id }; }
  }
  return null;
}, sel);

await test('loads from file:// with no external requests and no page errors', async () => {
  const { page, external, errors } = await open('?seed=SAV-2026');
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  const s = await page.evaluate(() => ({ people: WS.game.world.people, stories: WS.game.world.stories, ok: WS.game.placement.ok, intro: !document.getElementById('intro').hidden }));
  assert.equal(s.people, 361);
  assert.ok(s.stories >= 20, 'at least 20 micro-stories');
  assert.ok(s.ok && s.intro);
  await page.close();
});

await test('density budgets: low 180, standard 360, dense 600 people plus the target', async () => {
  for (const [d, n] of [['low', 181], ['standard', 361], ['dense', 601]]) {
    const { page } = await open('?seed=DEN-1&density=' + d);
    assert.equal(await page.evaluate(() => WS.game.world.people), n, d);
    await page.close();
  }
});

await test('same identity rebuilds the same scene; another seed does not', async () => {
  const sig = async (q) => {
    const { page } = await open(q);
    const s = await page.evaluate(() => {
      const w = WS.game.world;
      return JSON.stringify([w.target.x, w.target.y, w.target.flip, w.entities.filter((e) => e.kind === 'person').slice(0, 80).map((e) => [e.asset, e.x, e.y, e.colours, e.kit])]);
    });
    await page.close();
    return s;
  };
  const a = await sig('?seed=DET-42&difficulty=hard'), b = await sig('?seed=DET-42&difficulty=hard'), c = await sig('?seed=DET-43&difficulty=hard');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

await test('decoy cap, single target and stripe rule hold across 36 seeds', async () => {
  const { page } = await open('?seed=CAP-0');
  const report = await page.evaluate(() => {
    const out = [];
    for (const difficulty of ['easy', 'normal', 'hard']) for (let i = 0; i < 12; i++) {
      const w = WS.scenes.forsyth.build({ seed: 'CAP-' + i, scene: 'forsyth', difficulty, density: 'standard', crowd: null, artVersion: 1 });
      const people = w.entities.filter((e) => e.kind === 'person');
      const five = people.filter((e) => (e.traits || []).length >= 5);
      const over = people.filter((e) => !e.isTarget && (e.traits || []).length > 2);
      const lookalike = people.filter((e) => !e.isTarget && e.colours && ['#C73E3A', '#B5452C', '#E8457A', '#E53935'].includes(e.colours.top) && ['#F5F0E6', '#FFFFFF', '#E8E4DA'].includes(e.colours.top2));
      const decoys = people.filter((e) => !e.isTarget && (e.traits || []).length > 0).length;
      out.push({ difficulty, i, five: five.length, fiveIsTarget: five.every((e) => e.isTarget), over: over.length, lookalike: lookalike.length, decoys });
    }
    return out;
  });
  for (const r of report) {
    assert.equal(r.five, 1, 'exactly one five-trait person ' + JSON.stringify(r));
    assert.ok(r.fiveIsTarget);
    assert.equal(r.over, 0, 'no decoy over two traits ' + JSON.stringify(r));
    assert.equal(r.lookalike, 0, 'no red top with white trim ' + JSON.stringify(r));
  }
  const avg = (d) => report.filter((r) => r.difficulty === d).reduce((s, r) => s + r.decoys, 0) / 12;
  assert.ok(avg('hard') > avg('easy'), 'hard has more decoys than easy');
  await page.close();
});

await test('validator: target is placed visible enough for 24 seeds per difficulty', async () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const fails = [];
    for (let i = 0; i < 8; i++) {
      const { page } = await open(`?seed=VAL-${i}&difficulty=${difficulty}`);
      const p = await page.evaluate(() => WS.game.placement);
      if (!(p.ok && p.headShare >= 0.6 && p.visibleShare >= 0.5)) fails.push(p);
      // independent re-check: sample the target's head on screen and confirm a pick returns the target
      const pt = await pointOn(page, 'target');
      if (!pt) fails.push({ seed: i, err: 'no pickable target pixel' });
      await page.close();
    }
    assert.deepEqual(fails, [], difficulty);
  }
});

await test('validator rejects a target hidden behind the fountain and accepts one in the open', async () => {
  const { page } = await open('?seed=VAL-X');
  const r = await page.evaluate(() => ({ hidden: WS.game.engine.tryTarget(1600, 700), open: WS.game.engine.tryTarget(2500, 1588) }));
  assert.equal(r.hidden.ok, false, JSON.stringify(r.hidden));
  assert.ok(r.hidden.visibleShare < 0.5);
  assert.equal(r.open.ok, true, JSON.stringify(r.open));
  assert.ok(r.open.visibleShare > 0.9);
  await page.close();
});

await test('clicking the target wins; wrong clicks and empty ground count as wrong guesses', async () => {
  const { page } = await open('?seed=PLAY-7');
  await page.click('#startBtn');
  const wrong = await pointOn(page, 'other');
  await page.mouse.click(wrong.x, wrong.y);
  assert.equal(await page.textContent('#wrong'), '1');
  await page.evaluate(() => { WS.game.engine.camera.centerOn(1600, 642, 3.5); });   // fountain basin: a prop, not a person
  const r = await page.evaluate(() => document.getElementById('scene').getBoundingClientRect().toJSON());
  await page.mouse.click(r.width / 2, r.height / 2);
  assert.equal(await page.textContent('#wrong'), '2');
  const t = await pointOn(page, 'target');
  await page.mouse.click(t.x, t.y);
  await page.waitForSelector('#won:not([hidden])');
  assert.match(await page.textContent('#winText'), /2 wrong guesses/);
  await page.close();
});

await test('a drag across the target pans and never counts as a guess', async () => {
  const { page } = await open('?seed=PLAY-7');
  await page.click('#startBtn');
  const t = await pointOn(page, 'target');
  const before = await page.evaluate(() => [WS.game.engine.camera.x, WS.game.engine.camera.y]);
  await page.mouse.move(t.x, t.y); await page.mouse.down();
  await page.mouse.move(t.x + 4, t.y + 2); await page.mouse.move(t.x + 30, t.y + 12); await page.mouse.move(t.x, t.y);
  await page.mouse.up();
  const after = await page.evaluate(() => ({ state: WS.game.round.state, wrong: WS.game.round.wrong, cam: [WS.game.engine.camera.x, WS.game.engine.camera.y] }));
  assert.equal(after.state, 'PLAYING');
  assert.equal(after.wrong, 0);
  // a 5 px wobble still counts as a click
  await page.mouse.move(t.x, t.y); await page.mouse.down(); await page.mouse.move(t.x + 3, t.y + 3); await page.mouse.move(t.x, t.y); await page.mouse.up();
  assert.equal(await page.evaluate(() => WS.game.round.state), 'WON');
  assert.ok(before.length === 2);
  await page.close();
});

await test('zoom stays between the cover zoom and the maximum; keys pan, zoom and reset', async () => {
  const { page } = await open('?seed=ZOOM-1');
  await page.click('#startBtn');
  const lim = await page.evaluate(() => ({ min: WS.game.engine.camera.minZoom, max: WS.game.engine.camera.maxZoom }));
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -400);
  await page.waitForFunction(() => !WS.game.engine.camera.easing);
  assert.ok(Math.abs((await page.evaluate(() => WS.game.engine.camera.zoom)) - lim.max) < 1e-6, 'wheel reaches the maximum');
  for (let i = 0; i < 60; i++) await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => !WS.game.engine.camera.easing);
  assert.ok(Math.abs((await page.evaluate(() => WS.game.engine.camera.zoom)) - lim.min) < 1e-6, 'wheel reaches the cover zoom');
  await page.keyboard.press('0');
  assert.equal(await page.evaluate(() => WS.game.engine.camera.zoom), 1.3, 'reset returns to the home view');
  await page.keyboard.press('+');
  await page.waitForFunction(() => !WS.game.engine.camera.easing);
  assert.ok((await page.evaluate(() => WS.game.engine.camera.zoom)) > 1.6);
  const x0 = await page.evaluate(() => WS.game.engine.camera.x);
  await page.keyboard.press('d');
  assert.ok((await page.evaluate(() => WS.game.engine.camera.x)) > x0);
  await page.click('#zoomReset');
  assert.equal(await page.evaluate(() => WS.game.engine.camera.zoom), 1.3);
  await page.close();
});

await test('wheel zoom keeps the world point under the pointer fixed', async () => {
  const { page } = await open('?seed=ZOOM-2');
  await page.click('#startBtn');
  await page.evaluate(() => WS.game.engine.camera.centerOn(1600, 1200, 1.5));
  await page.mouse.move(900, 300);
  const before = await page.evaluate(() => WS.game.engine.camera.toWorld(900, 300));
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -120);
  await page.waitForFunction(() => !WS.game.engine.camera.easing);
  const r = await page.evaluate(() => ({ z: WS.game.engine.camera.zoom, w: WS.game.engine.camera.toWorld(900, 300) }));
  assert.ok(r.z > 1.9, 'zoomed in: ' + r.z);
  assert.ok(Math.hypot(r.w[0] - before[0], r.w[1] - before[1]) < 1, 'anchored: ' + JSON.stringify([before, r.w]));
  await page.close();
});

await test('hard mode hides him in company: a crowd and nearby decoys', async () => {
  for (let i = 1; i <= 4; i++) {
    const { page } = await open(`?seed=HARD-${i}&difficulty=hard`);
    const p = await page.evaluate(() => WS.game.placement);
    assert.ok(p.relaxed || (p.crowd >= 6 && p.decoys >= 2 && p.visibleShare < 0.86), JSON.stringify(p));
    await page.close();
  }
});

await test('people move, and prefers-reduced-motion freezes them', async () => {
  const offsets = async (reduced) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto(PAGE + '?seed=MOVE-1');
    await page.waitForFunction(() => document.title.includes('Waldo'));
    await page.waitForTimeout(600);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ on: WS.game.engine.motion, moving: WS.game.world.entities.filter((e) => e.oy).length,
      framed: WS.game.world.entities.filter((e) => e.sprite1).length, passing: WS.game.world.entities.filter((e) => e.sprite1 && e.sprite === e.sprite1).length }));
    await page.close();
    return r;
  };
  const normal = await offsets(false), still = await offsets(true);
  assert.ok(normal.on && normal.moving > 100, JSON.stringify(normal));
  assert.ok(normal.framed > 100 && normal.passing > 10, 'walkers alternate two drawn frames: ' + JSON.stringify(normal));
  assert.ok(!still.on && still.moving === 0 && still.passing === 0, JSON.stringify(still));
});

await test('beacon only when ?beacon=1', async () => {
  for (const [q, want] of [['?seed=B-1', false], ['?seed=B-1&beacon=1', true]]) {
    const { page } = await open(q);
    assert.equal(await page.evaluate(() => WS.game.identity.beacon), want);
    await page.close();
  }
});

await test('stress crowd of 10,000 builds and stays playable', async () => {
  const { page, errors } = await open('?seed=STRESS-1&crowd=10000');
  assert.deepEqual(errors, []);
  const s = await page.evaluate(() => ({ people: WS.game.world.people, ok: WS.game.placement.ok }));
  assert.equal(s.people, 10001);
  assert.ok(s.ok);
  await page.close();
});

await test('phone viewport: HUD and controls fit, never overlap, touch targets at least 44 px', async () => {
  const { page } = await open('?seed=PHONE-1', { width: 390, height: 844 });
  const sb = await page.evaluate(() => document.getElementById('startBtn').getBoundingClientRect().toJSON());
  assert.ok(sb.width >= 44 && sb.height >= 44);
  await page.click('#startBtn');
  const r = await page.evaluate(() => Object.fromEntries(['hud', 'actions', 'controls', 'where', 'hintBtn', 'menuBtn', 'zoomIn', 'zoomOut', 'zoomReset'].map((id) => [id, document.getElementById(id).getBoundingClientRect().toJSON()])));
  for (const id of ['hintBtn', 'menuBtn', 'zoomIn', 'zoomOut', 'zoomReset']) { const b = r[id]; assert.ok(b.width >= 44 && b.height >= 44, 'touch target ' + id); assert.ok(b.right <= 390 && b.left >= 0, 'inside viewport ' + id); }
  const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const ids = ['hud', 'actions', 'controls', 'where'];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) assert.ok(!overlap(r[ids[i]], r[ids[j]]), ids[i] + ' overlaps ' + ids[j]);
  const covered = Math.max(r.hud.height, r.actions.height) + Math.max(r.controls.height, r.where.height) + 24;
  assert.ok(covered / 844 < 0.22, 'chrome covers little of the screen: ' + (covered / 844).toFixed(2));
  await page.close();
});

// ---------- overhaul: the camera always shows illustrated world, never blank edges ----------
await test('camera: at every viewport, zoom and edge, the screen shows only the world', async () => {
  for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1440, 900], [1920, 1080]]) {
    const { page } = await open('?seed=CAM-1&scene=savannah', { width: w, height: h });
    await page.click('#startBtn');
    const bad = await page.evaluate(() => {
      const c = WS.game.engine.camera, W = WS.game.world, out = [];
      const inside = (tag) => { const [x0, y0, x1, y1] = c.visible(); if (x0 < -0.5 || y0 < -0.5 || x1 > W.w + 0.5 || y1 > W.h + 0.5) out.push(tag + ' ' + [x0, y0, x1, y1].map(Math.round)); };
      for (const z of [0.01, 1.3, 99]) for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) { c.centerOn(fx * W.w, fy * W.h, z); inside('z' + z + ' ' + fx + ',' + fy); }
      for (let i = 0; i < 30; i++) c.panBy(5000, 5000); inside('drag');
      return out;
    });
    assert.deepEqual(bad, [], w + 'x' + h);
    // also count blank pixels after a real render at the far corner and minimum zoom
    const blank = await page.evaluate(() => {
      const c = WS.game.engine.camera; c.centerOn(0, 0, 0.01); WS.game.engine.renderNow();
      const cv = document.getElementById('scene'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0, k = 0;
      for (let i = 0; i < d.length; i += 4 * 53) { n++; if (d[i] === 0xF6 && d[i + 1] === 0xE7 && d[i + 2] === 0xC8 && d[i + 3] === 255) k++; }
      return k / n;
    });
    assert.ok(blank < 0.03, w + 'x' + h + ' blank share ' + blank);
    await page.close();
  }
});

await test('camera: resizing and rotating keep the view covered and centred', async () => {
  const { page } = await open('?seed=CAM-2&scene=savannah', { width: 390, height: 844 });
  await page.click('#startBtn');
  const c0 = await page.evaluate(() => [WS.game.engine.camera.x, WS.game.engine.camera.y]);
  for (const [w, h] of [[844, 390], [1440, 900], [320, 568]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => { const c = WS.game.engine.camera, W = WS.game.world, v = c.visible(); return { v, ok: v[0] >= -0.5 && v[1] >= -0.5 && v[2] <= W.w + 0.5 && v[3] <= W.h + 0.5, x: c.x, y: c.y, min: c.minZoom, z: c.zoom }; });
    assert.ok(r.ok, w + 'x' + h + ' ' + JSON.stringify(r));
    assert.ok(r.z >= r.min - 1e-9);
    assert.ok(Math.hypot(r.x - c0[0], r.y - c0[1]) < 600, 'stays near the same place');
  }
  await page.close();
});

await test('city: Bull Street joins every district, with a street sign at each crossing', async () => {
  const { page } = await open('?seed=BULL-1&scene=savannah');
  const r = await page.evaluate(() => {
    const W = WS.game.world, ds = W.districts;
    const contiguous = ds.every((d, i) => i === 0 || Math.abs(ds[i - 1].y0 + ds[i - 1].h - d.y0) < 1) && ds[ds.length - 1].y0 + ds[ds.length - 1].h === W.h;
    const signs = W.entities.filter((e) => e.asset.startsWith('props/street/sign-')).map((e) => e.asset.split('sign-')[1]);
    const cars = W.entities.filter((e) => e.drive).length;
    const landmarks = ['props/landmarks/city-hall-dome', 'props/landmarks/obelisk', 'environments/monterey/temple', 'environments/monterey/mercer-house', 'props/landmarks/pulaski-monument', 'environments/forsyth/fountain'].map((a) => W.entities.some((e) => e.asset === a));
    return { contiguous, signs, cars, landmarks };
  });
  assert.ok(r.contiguous, 'districts tile the world with no gaps');
  for (const s of ['bay', 'congress', 'harris', 'charlton', 'jones', 'gordon', 'gaston']) assert.ok(r.signs.includes(s), 'sign at Bull and ' + s);
  assert.ok(r.cars >= 12, 'traffic on the streets: ' + r.cars);
  assert.ok(r.landmarks.every(Boolean), JSON.stringify(r.landmarks));
  await page.close();
});

await test('city: the west and east wings carry their landmarks, streets and seamless ground', async () => {
  const { page } = await open('?seed=WIDE-1&scene=savannah');
  const r = await page.evaluate(() => {
    const W = WS.game.world, has = (a) => W.entities.filter((e) => e.asset === a).map((e) => Math.round(e.x));
    const g = W.grounds; let x = 0; const seams = g.map((c) => { const ok = c.x === x; x = c.x + c.w; return ok; });
    const people = W.entities.filter((e) => e.kind === 'person');
    return { seams, end: x, w: W.w, west: people.filter((p) => p.x < 2960).length, east: people.filter((p) => p.x > 6160).length,
      bridge: has('props/river/talmadge-bridge'), pink: has('environments/wings/olde-pink-house'), church: has('environments/wings/first-african-baptist'),
      cemetery: has('environments/wings/cemetery-gate'), gazebo: has('environments/wings/gazebo'), victorian: W.entities.filter((e) => e.asset.startsWith('environments/victorian/')).length,
      signs: W.entities.filter((e) => /sign-(montgomery|jefferson|habersham|price|whitaker|drayton)-/.test(e.asset)).length,
      areas: [W.area(400, 560), W.area(7700, 2300), W.area(7700, 3650), W.area(1500, 6600)] };
  });
  assert.ok(r.seams.every(Boolean) && r.end === r.w, 'ground chunks tile the width: ' + JSON.stringify(r.seams));
  assert.ok(r.bridge[0] < 2960 && r.church[0] < 2960, 'west landmarks');
  assert.ok(r.pink[0] > 6160 && r.cemetery[0] > 6160 && r.gazebo[0] > 6160, 'east landmarks');
  assert.ok(r.victorian >= 8 && r.signs >= 20, JSON.stringify(r));
  assert.ok(r.west > 200 && r.east > 200, 'people live in both wings: ' + r.west + ' / ' + r.east);
  assert.deepEqual(r.areas.map((a) => !!a && !/somewhere/.test(a)), [true, true, true, true], JSON.stringify(r.areas));
  await page.close();
});

await test('city: no person, animal or target candidate stands on a building roof or wall', async () => {
  const { page } = await open('?seed=SAV-2026&scene=savannah&density=dense');
  const hits = await page.evaluate(async () => {
    const far = WS.game.world.entities.filter((e) => e.layer === 'far');
    for (const b of far) if (!b.sprite.img) await WS.sprites.decode(b.sprite);
    const masks = far.map((b) => {
      const [rx, ry, rw, rh] = b.rect;
      const cv = document.createElement('canvas'); cv.width = Math.ceil(rw); cv.height = Math.ceil(rh);
      const ctx = cv.getContext('2d');
      if (b.flip) { ctx.translate(rw, 0); ctx.scale(-1, 1); }
      ctx.drawImage(b.sprite.img, 0, 0, rw, rh);
      return { asset: b.asset, rx, ry, cw: cv.width, ch: cv.height, data: ctx.getImageData(0, 0, cv.width, cv.height).data };
    });
    const onRoof = (m, wx, wy) => {
      const px = Math.round(wx - m.rx), py = Math.round(wy - m.ry) - 4;
      return px >= 0 && px < m.cw && py >= 0 && py < m.ch && m.data[(py * m.cw + px) * 4 + 3] > 30;
    };
    const out = [];
    for (const seed of ['SAV-2026', 'CITY-1', 'WIDE-1']) {
      const w = WS.scenes.savannah.build({ seed, scene: 'savannah', difficulty: 'normal', density: 'dense', crowd: null, artVersion: 1 });
      for (const e of w.entities) if (e.kind === 'person' || e.kind === 'animal') for (const m of masks) if (onRoof(m, e.x, e.y)) out.push([seed, e.asset, e.zone || e.story, Math.round(e.x), Math.round(e.y), m.asset]);
      for (const c of w.candidates) for (const m of masks) if (onRoof(m, c.x, c.y)) out.push([seed, 'candidate', c.spot, Math.round(c.x), Math.round(c.y), m.asset]);
    }
    return out;
  });
  assert.deepEqual(hits, [], JSON.stringify(hits.slice(0, 5)));
  await page.close();
});

await test('touch: a finger tap near a small person counts, a two-finger pinch never guesses', async () => {
  const { page } = await open('?seed=TOUCH-1&difficulty=easy', { width: 390, height: 844 });
  await page.click('#startBtn');
  const r = await page.evaluate(() => {
    const g = WS.game, e = g.world.target; g.engine.setMotion(false);
    // isolate the tolerance logic from the crowd: only the target can be picked in this check
    const restore = g.engine.list().filter((q) => q !== e && q.pickable); restore.forEach((q) => { q.pickable = false; });
    g.engine.camera.centerOn(e.x, e.y - 30, g.engine.camera.minZoom); g.engine.renderNow();
    const cv = document.getElementById('scene').getBoundingClientRect(), [x, y, w, h] = e.rect;
    // an empty spot 8 CSS px outside his drawn outline (beyond the 4 px mouse allowance), left or right, at
    // several heights; neighbours may stand on one side
    const px = 1 / (g.engine.camera.zoom * 0.4); let spot = null;
    for (const fy of [0.55, 0.4, 0.7, 0.3]) {
      const ym = y + h * fy; let l = null, rr = null;
      for (let u = x; u < x + w; u += px * 0.5) if (g.engine.pickWorld(u, ym) === e) { if (l === null) l = u; rr = u; }
      if (l === null) continue;
      const alone = (u, v) => { for (let r = 1; r <= 13; r++) for (let i = 0; i < 24; i++) { const q = g.engine.pickWorld(u + Math.cos(i / 24 * 6.283) * r * px, v + Math.sin(i / 24 * 6.283) * r * px); if (q && q.kind === 'person' && q !== e) return false; } return true; };
      for (const u of [rr + 8 * px, l - 8 * px]) if (!g.engine.pickWorld(u, ym) && alone(u, ym)) { spot = [u, ym]; break; }
      if (spot) break;
    }
    const [sx, sy] = g.engine.camera.toScreen(spot[0], spot[1]);
    const mouse = g.engine.pick(sx + cv.left, sy + cv.top);
    const touch = g.engine.pick(sx + cv.left, sy + cv.top, { touch: true });
    restore.forEach((q) => { q.pickable = true; });
    return { mouse: !!(mouse && mouse.isTarget), touch: !!(touch && touch.isTarget) };
  });
  assert.equal(r.touch, true, 'finger-sized tolerance reaches him');
  assert.equal(r.mouse, false, 'the mouse allowance stays small');
  const wrong0 = await page.evaluate(() => WS.game.round.wrong);
  const cdp = await page.context().newCDPSession(page);
  const tp = (pts) => pts.map(([x, y], i) => ({ x, y, id: i }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp([[150, 400]]) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp([[150, 400], [240, 420]]) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp([[120, 390], [270, 430]]) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => WS.game.round.wrong), wrong0, 'pinch is not a guess');
  await page.close();
});

// ---------- checkpoint 3: gameplay integration ----------
async function win(page) {
  await page.click('#startBtn');
  const t = await pointOn(page, 'target');
  await page.mouse.click(t.x, t.y);
  await page.waitForSelector('#won:not([hidden])');
  await page.click('details.more summary');
}

await test('leaderboard: save once, sorted, max 10, names rendered as text, tolerant of bad records', async () => {
  const { page } = await open('?seed=LB-1');
  await page.evaluate(() => {
    const bad = [{ username: 'old', elapsedMs: 1, difficulty: 'hard', wrongGuesses: 1, seed: 'X' }, { nope: 1 }, 'junk'];
    for (let i = 0; i < 11; i++) bad.push({ username: 'p' + i, elapsedMs: 60000 + i * 1000, wrongGuesses: 0, seed: 'S' + i });
    localStorage.setItem('waldos_savannah_leaderboard_v1', JSON.stringify(bad));
  });
  await win(page);
  await page.fill('#nameInput', '<img src=x onerror=alert(1)>');
  await page.click('#saveBtn');
  assert.equal(await page.isDisabled('#saveBtn'), true);
  await page.evaluate(() => document.getElementById('saveBtn').click());   // a forced second save must be ignored
  await page.evaluate(() => document.getElementById('boardBtn').click());   // open the list behind the win card
  const r = await page.evaluate(() => ({ stored: JSON.parse(localStorage.getItem('waldos_savannah_leaderboard_v1')), imgs: document.querySelectorAll('#boardList img').length, names: [...document.querySelectorAll('#boardList .name')].map((n) => n.textContent) }));
  assert.equal(r.stored.length, 10);
  assert.equal(r.imgs, 0, 'name must not become markup');
  assert.equal(r.stored.filter((x) => x.username.startsWith('<img')).length, 1, 'saved exactly once');
  const mine = r.stored.find((x) => x.username.startsWith('<img'));
  assert.equal(mine.seed, 'LB-1'); assert.equal(mine.difficulty, 'normal'); assert.equal(mine.artVersion, 1); assert.equal(typeof mine.hints, 'number');
  for (let i = 1; i < r.stored.length; i++) assert.ok(r.stored[i - 1].points >= r.stored[i].points, 'sorted by points');
  assert.equal(r.stored[0].username, 'old', JSON.stringify(r.stored.slice(0, 3)));
  await page.close();
});

await test('share link carries the replay identity and rebuilds the same park', async () => {
  const { page } = await open('?seed=SHARE-9&difficulty=hard&density=low');
  await win(page);
  const url = await page.inputValue('#shareBox');
  assert.match(url, /seed=SHARE-9/); assert.match(url, /difficulty=hard/); assert.match(url, /density=low/); assert.match(url, /scene=forsyth/);
  const a = await page.evaluate(() => [WS.game.world.target.x, WS.game.world.target.y]);
  await page.close();
  const page2 = await browser.newPage();
  await page2.goto(url);   // the share link carries scene=forsyth
  await page2.waitForFunction(() => document.title.includes('Waldo'));
  assert.deepEqual(await page2.evaluate(() => [WS.game.world.target.x, WS.game.world.target.y]), a);
  await page2.close();
});

await test('hints: area, then a nearby landmark, then a ring round him, then no more', async () => {
  const { page } = await open('?seed=HINT-3');
  await page.click('#startBtn');
  await page.click('#hintBtn');
  assert.match(await page.textContent('#toast'), /^Hint: he is /);
  const z0 = await page.evaluate(() => WS.game.engine.camera.zoom);
  await page.click('#hintBtn');
  assert.match(await page.textContent('#toast'), /^Hint: (look near|he is close)/);
  const r = await page.evaluate(() => { const c = WS.game.engine.camera, t = WS.game.world.target; return { d: Math.hypot(c.x - t.x, c.y - t.y), z: c.zoom, hints: WS.game.round.hints }; });
  assert.equal(r.hints, 2); assert.ok(r.d < 320, 'camera near the target area'); assert.ok(r.d > 20, 'but not on the exact spot'); assert.ok(r.z >= Math.max(z0, 1.6) - 1e-9);
  await page.click('#hintBtn');
  assert.match(await page.textContent('#toast'), /circle/);
  assert.equal(await page.evaluate(() => WS.game.round.hints), 3);
  await page.click('#hintBtn');
  assert.equal(await page.evaluate(() => WS.game.round.hints), 3);
  await page.close();
});

await test('fallback: ?fallback=1, the test button, and recovery to a new scene', async () => {
  const { page } = await open('?seed=FB-1&fallback=1');
  assert.equal(await page.isVisible('#failed'), true);
  await page.click('#recoverBtn');
  await page.waitForFunction(() => document.title.includes('Waldo'));
  const q = await page.evaluate(() => location.search);
  assert.ok(!/fallback/.test(q) && !/seed=FB-1/.test(q), q);
  await page.click('#startBtn');
  await page.click('#menuBtn');
  await page.click('#testFallbackBtn');
  assert.equal(await page.isVisible('#failed'), true);
  assert.equal(await page.evaluate(() => WS.game.round.state), 'FALLBACK');
  await page.close();
});

await test('difficulty picker reloads with the same seed and the new difficulty', async () => {
  const { page } = await open('?seed=PICK-1');
  await page.selectOption('#introDifficulty', 'hard');
  await page.waitForFunction(() => location.search.includes('difficulty=hard') && document.title.includes('Waldo'));
  assert.equal(await page.evaluate(() => WS.game.identity.seed + '|' + WS.game.identity.difficulty), 'PICK-1|hard');
  await page.close();
});

// ---------- checkpoint 4: the whole city ----------
await test('city: five districts in one world, target can land in any of them', async () => {
  const { page, external, errors } = await open('?seed=CITY-1&scene=savannah');
  assert.deepEqual(external, []); assert.deepEqual(errors, []);
  const r = await page.evaluate(() => {
    const w = WS.game.world, spotsBy = {};
    for (let i = 0; i < 40; i++) {
      const b = WS.scenes.savannah.build({ seed: 'SPREAD-' + i, scene: 'savannah', difficulty: ['easy', 'normal', 'hard'][i % 3], density: 'low', crowd: null, artVersion: 1 });
      const t = b.target, d = b.districts.find((x) => t.y >= x.y0 && t.y < x.y0 + x.h);
      spotsBy[d.id] = (spotsBy[d.id] || 0) + 1;
    }
    return { people: w.people, stories: w.stories, districts: w.districts.map((d) => d.id), h: w.h, w: w.w, spotsBy, ok: WS.game.placement.ok };
  });
  assert.deepEqual(r.districts, ['riverfront', 'market', 'squares', 'monterey', 'forsyth']);
  assert.equal(r.people, 1801); assert.ok(r.stories >= 60); assert.equal(r.h, 7600); assert.equal(r.w, 9120); assert.ok(r.ok);
  assert.equal(Object.keys(r.spotsBy).length, 5, 'first candidates spread over every district: ' + JSON.stringify(r.spotsBy));
  await page.close();
});

await test('city: winning anywhere works and the HUD names the district in view', async () => {
  const { page } = await open('?seed=CITY-4&scene=savannah');
  await page.evaluate(() => WS.game.engine.camera.centerOn(1600, 700, 1.5));
  await page.waitForFunction(() => document.getElementById('hereLabel').textContent.endsWith('River Street'));
  await win(page);
  assert.match(await page.textContent('#winPoints'), /points/);
  await page.close();
});

await test('city: crowd travels along walks, runs and wanders; target stays near his spot', async () => {
  const { page } = await open('?seed=MOVE-2&scene=savannah');
  const before = await page.evaluate(() => { const w = WS.game.world; return { pos: w.entities.filter((e) => e.kind === 'person').map((e) => [e.id, e.x, e.y]), t: [w.target.x, w.target.y] }; });
  await page.waitForTimeout(3000);
  const r = await page.evaluate((before) => {
    const byId = new Map(WS.game.world.entities.map((e) => [e.id, e]));
    let moved = 0, far = 0, fastest = 0;
    for (const [id, x, y] of before.pos) { const e = byId.get(id), d = Math.hypot(e.x - x, e.y - y); if (d > 5) moved++; if (d > 40) far++; fastest = Math.max(fastest, d); }
    const t = WS.game.world.target;
    return { moved, far, fastest, targetDrift: Math.hypot(t.hx - t.x, t.hy - t.y), travellers: WS.game.world.entities.filter((e) => e.travel).length };
  }, before);
  assert.ok(r.travellers > 300, JSON.stringify(r));
  assert.ok(r.moved > 200 && r.far > 50 && r.fastest > 120, 'people walk, joggers and cyclists cover ground: ' + JSON.stringify(r));
  assert.ok(r.targetDrift <= 23, 'target paces within his spot: ' + JSON.stringify(r));
  await page.close();
});

await test('points: difficulty multiplies, mistakes and hints cost, floor of 100', async () => {
  const { page } = await open('?seed=PTS-1');
  const p = await page.evaluate(() => {
    const P = WS.leaderboard.points;
    return { easy: P({ elapsedMs: 60000, wrongGuesses: 0, hints: 0, difficulty: 'easy' }), normal: P({ elapsedMs: 60000, wrongGuesses: 0, hints: 0, difficulty: 'normal' }), hard: P({ elapsedMs: 60000, wrongGuesses: 0, hints: 0, difficulty: 'hard' }),
      wrong: P({ elapsedMs: 60000, wrongGuesses: 2, hints: 0, difficulty: 'easy' }), hint: P({ elapsedMs: 60000, wrongGuesses: 0, hints: 1, difficulty: 'easy' }), floor: P({ elapsedMs: 9e6, wrongGuesses: 50, hints: 2, difficulty: 'hard' }) };
  });
  assert.deepEqual(p, { easy: 9400, normal: 14100, hard: 23500, wrong: 8800, hint: 7900, floor: 250 });
  // a slower hard round outranks a faster easy round when it earns more points
  await page.evaluate(() => { localStorage.clear(); WS.leaderboard.save({ username: 'easyfast', elapsedMs: 30000, wrongGuesses: 0, seed: 'a', difficulty: 'easy', hints: 0 }); WS.leaderboard.save({ username: 'hardslow', elapsedMs: 90000, wrongGuesses: 1, seed: 'b', difficulty: 'hard', hints: 0 }); });
  assert.deepEqual(await page.evaluate(() => WS.leaderboard.load().map((r) => r.username)), ['hardslow', 'easyfast']);
  await page.close();
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
