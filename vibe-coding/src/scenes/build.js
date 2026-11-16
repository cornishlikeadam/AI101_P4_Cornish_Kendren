/* Generic scene builder (Agent 2). Assembles districts (geography, stories, crowd zones, hiding spots)
   into one world. The replay identity decides looks, the filler crowd and target candidate order. */
(function () {
  const WS = (window.WS = window.WS || {});
  const P = 0.8, C = 'characters/archetypes/', B = 'characters/bodies/';
  const DECOY_RATE = { easy: 0.06, normal: 0.16, hard: 0.32 };

  function buildScene(identity, scene) {
    const districts = scene.districts, BUDGET = scene.budget;
    const blocked = (x, y) => { const d = districtAt(x, y); return !d || d.blocked(x, y); };
    const districtAt = (x, y) => districts.find((d) => y >= d.y0 && y < d.y0 + d.h);
    const rng = WS.rng.make(WS.rng.identityKey(identity));
    const make = WS.characters.make;
    const entities = [];
    let n = 0;
    const isPerson = (asset) => asset.startsWith('characters/');
    const push = (o) => { const e = Object.assign({ k: o.k || (isPerson(o.asset) ? P : 1), flip: o.flip ? 1 : 0, layer: o.layer || (window.WS_ASSETS.meta[o.asset].layer === 'world' ? 'world' : window.WS_ASSETS.meta[o.asset].layer) }, o); if (!e.id) e.id = 'e' + n++; entities.push(e); return e; };
    const people = [];
    const grid = new Map(), CELL = 64;                       // spatial hash for spacing checks
    const cellKey = (cx, cy) => cx + ',' + cy;
    const decoyRate = DECOY_RATE[identity.difficulty] || DECOY_RATE.normal;
    const total = identity.crowd ? Math.max(20, Math.min(10000, identity.crowd)) : BUDGET[identity.density] || BUDGET.standard;
    // Stress crowds reuse a fixed set of looks so thousands of people do not mean thousands of sprite decodes.
    const templates = total > 3200 ? new Map() : null;
    const person = (asset, x, y, flip, extra = {}) => {
      let c;
      if (templates) {
        const list = templates.get(asset) || templates.set(asset, []).get(asset);
        if (list.length < 24) { c = make(rng, asset, { decoys: rng.chance(decoyRate) ? 1 : 0 }); list.push(c); } else c = rng.pick(list);
      } else c = make(rng, asset, { decoys: rng.chance(decoyRate) ? (rng.chance(0.45) ? 2 : 1) : 0 });
      const e = push(Object.assign({ asset, x, y, flip, kind: 'person', colours: c.colours, kit: c.kit, kit2: c.kit2, traits: c.traits }, extra));
      people.push(e);
      const k = cellKey(Math.floor(x / CELL), Math.floor(y / CELL));
      (grid.get(k) || grid.set(k, []).get(k)).push(e);
      return e;
    };

    for (const g of districts.flatMap((d) => d.geography())) push(Object.assign({ kind: 'prop', colours: g.tint || null }, g, { tint: undefined }));
    const allStories = districts.flatMap((d) => d.stories());
    for (const s of allStories) {
      if (isPerson(s.asset)) person(s.asset, s.x, s.y, s.flip, { story: s.story, id: s.id });
      else push({ asset: s.asset, x: s.x, y: s.y, k: s.k, flip: s.flip, kind: s.asset.includes('animals') ? 'animal' : 'prop', story: s.story, leash: s.leash, colours: s.tint || null });
    }

    // spacing grid: people keep apart; the y distance counts double because the ground is foreshortened
    const near = (x, y, d) => {
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      for (let i = cx - 1; i <= cx + 1; i++) for (let j = cy - 1; j <= cy + 1; j++) {
        const cell = grid.get(cellKey(i, j));
        if (cell && cell.some((p) => Math.hypot(p.x - x, (p.y - y) * 2.2) < d)) return true;
      }
      return false;
    };
    const fill = Math.max(0, total - people.length);
    // spacing depends on crowd density: the count as if spread over the original 3200 x 6700 city
    const dense = total * Math.min(1, (3200 * 6700) / (scene.w * scene.h));
    const spacing = dense > 3000 ? 8 : dense > 1600 ? 18 : 30;
    const POOL_PATH = [[B + 'walk', 12], [B + 'dress', 11], [B + 'tote', 6], [B + 'umbrella', 7], [B + 'books', 7], [B + 'phone', 7], [B + 'cane', 5], [B + 'child', 6], [C + 'jogger', 7], [C + 'tourist-photographer', 5], [C + 'scad-student-portfolio', 4], [C + 'dog-walker', 3], [C + 'parent-stroller', 3], [C + 'cyclist', 2]];
    const POOL_STAND = [[B + 'coffee', 12], [B + 'phone', 10], [B + 'wave', 9], [B + 'books', 6], [B + 'walk', 6], [B + 'dress', 9], [B + 'tote', 4], [B + 'umbrella', 3], [B + 'child', 7], [B + 'cane', 4], [C + 'tourist-photographer', 5], [C + 'scad-student-portfolio', 3]];
    const zonePairs = districts.flatMap((d) => d.zones.map((z) => [z, z.w]));
    for (let placed = 0, tries = 0; placed < fill && tries < fill * 60; tries++) {
      const z = rng.weighted(zonePairs);
      const [x, y] = z.pt(rng);
      if (blocked(x, y) || near(x, y, spacing)) continue;
      const asset = rng.weighted(z.path ? POOL_PATH : POOL_STAND);
      if (asset === C + 'cyclist' && z.id === 'promenade' && rng.chance(0.5)) continue;
      const e = person(asset, Math.round(x), Math.round(y), rng.chance(0.5) ? 1 : 0, { zone: z.id });
      if (asset === C + 'dog-walker') push({ asset: 'props/animals/dog-dachshund', x: e.x + (e.flip ? -84 : 84), y: e.y + 6, k: 0.9, flip: e.flip, kind: 'animal', leash: e.id });
      placed++;
    }

    // Target candidates in seeded order: spots for this difficulty first, then any spot.
    const diff = identity.difficulty || 'normal';
    const SPOTS = districts.flatMap((d) => d.spots.map((s) => Object.assign({ district: d.id }, s)));
    const mine = SPOTS.filter((s) => s.d.includes(diff)), rest = SPOTS.filter((s) => !s.d.includes(diff));
    const candidates = [];
    for (const pool of [mine, mine, mine, rest]) {
      for (let i = 0, guard = 0; i < 12 + 4 * districts.length && guard < 800; guard++) {
        const s = rng.pick(pool);
        const a = rng() * Math.PI * 2, t = Math.sqrt(rng());
        const x = Math.round(s.x + Math.cos(a) * s.r * t), y = Math.round(s.y + Math.sin(a) * s.r * t * 0.5);
        if (blocked(x, y) || near(x, y, 18)) continue;
        candidates.push({ spot: s.id, x, y, flip: rng.chance(0.5) ? 1 : 0 });
        i++;
      }
    }
    const target = push({ id: 'target', asset: C + 'target-walker', x: candidates[0].x, y: candidates[0].y, flip: candidates[0].flip, kind: 'person', isTarget: true, colours: null, traits: ['stripes', 'bobble', 'glasses', 'blue', 'stick'], spot: candidates[0].spot });

    const area = (x, y) => { for (const d of districts) { const a = d.area(x, y); if (a) return a; } return 'somewhere in Savannah'; };
    return { blocked, id: scene.id, name: scene.name, w: scene.w, h: scene.h, home: scene.home || null, grounds: scene.grounds || null, ground: scene.ground, background: '#F6E7C8', fountains: districts.flatMap((d) => d.fountains || (d.fountain ? [d.fountain] : [])), districts: districts.map((d) => ({ id: d.id, name: d.name, y0: d.y0, h: d.h })), area, entities, target, candidates, identity, people: people.length + 1, stories: new Set(allStories.map((s) => s.story)).size };
  }

  WS.buildScene = buildScene;
})();
