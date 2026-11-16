/* Forsyth Park, the benchmark scene (Agent 2). Geography and stories are fixed; the replay identity
   decides everyone's looks, the filler crowd and the order of target hiding candidates.
   Layout constants mirror tools/author/forsyth-ground-full.mjs. See docs/forsyth-blueprint.md. */
(function () {
  const WS = (window.WS = window.WS || {});
  const W = 3200, H = 2400, P = 0.8;
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const PLAZA = { cx: 1600, cy: 640, rx: 430, ry: 172 };
  const BASIN = { cx: 1600, cy: 640, rx: 300, ry: 124 };
  const PLAY = { cx: 820, cy: 1900, rx: 250, ry: 110 };

  const inEll = (x, y, e, pad = 0) => ((x - e.cx) / (e.rx + pad)) ** 2 + ((y - e.cy) / (e.ry + pad)) ** 2 < 1;
  const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];

  // ---- fixed geography: [asset, x, y, scale, flip, extra] ----
  function geography() {
    const g = [];
    const add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/forsyth/gaston-street-houses', 0, 270, 1, 0, { layer: 'far' });
    add('environments/forsyth/gaston-street-houses', 3200, 270, 1, 1, { layer: 'far' });
    // perimeter azalea beds along the north fence, open at the gate
    for (let x = 70; x < 3200; x += 150) if (x < 1440 || x > 1760) add('props/vegetation/azalea-bush', x, 406 + ((x / 150) % 2) * 2, 0.9 + ((x / 150) % 3) * 0.05, (x / 150) % 2);
    // fountain plaza
    add('environments/forsyth/fountain', 1600, 742, 1);
    add('props/vegetation/azalea-bush', 1460, 486, 0.85); add('props/vegetation/azalea-bush', 1740, 486, 0.85, 1);
    for (const [x, y] of [[1250, 610], [1950, 610], [1512, 840], [1690, 840], [1540, 1500], [1660, 1500], [1540, 2200], [1660, 2200]]) add('props/furniture/lamp-post', x, y, 0.95);
    for (const [x, y, k] of [[1210, 712, 0.9], [1990, 714, 0.9], [1360, 476, 0.85], [1500, 1180, 0.85], [1700, 1360, 0.85], [1500, 1760, 0.85], [2500, 1700, 0.85], [700, 1700, 0.85]]) add('props/furniture/park-bench', x, y, k);
    // live oaks: plaza frame, the promenade alley, park edges and lawns
    const OAKS = ['props/vegetation/live-oak', 'props/vegetation/live-oak-tall', 'props/vegetation/live-oak-lean'];
    for (const [x, y, k, f, v] of [[920, 640, 0.95, 0, 0], [2300, 700, 0.9, 1, 2], [950, 1060, 1.05, 1, 1], [2260, 1040, 0.95, 0, 0],
      [180, 700, 0.9, 0, 1], [3020, 820, 0.9, 1, 2], [190, 1720, 1, 1, 0], [3010, 1760, 0.95, 0, 1], [240, 2200, 0.9, 0, 2], [2980, 2200, 0.95, 1, 0], [1180, 2120, 0.85, 1, 1], [2120, 2160, 0.9, 0, 2]]) add(OAKS[v], x, y, k, f);
    let side = 0;
    for (const y of [1120, 1300, 1470, 1760, 1940, 2120]) { add(OAKS[side % 3], 1452, y, 0.68, side % 2); add(OAKS[(side + 1) % 3], 1748, y + 30, 0.68, (side + 1) % 2); side++; }
    for (const [x, y] of [[380, 1132], [1124, 1142], [1830, 1102], [3010, 1120], [600, 2060]]) add('props/vegetation/palmetto', x, y, 0.75);
    // cafe patio tables and the chess table
    let u = 0;
    for (const [x, y] of [[520, 1222], [700, 1212], [880, 1226], [560, 1352], [760, 1364], [960, 1346]]) add('props/furniture/cafe-table', x, y, 0.9, u % 2, { tint: { umb: ['#2F5D50', '#C73E3A', '#2F7FA8', '#E8C872', '#7D5BA6', '#E07A3F'][u++], umb2: '#F5F0E6' } });
    // farmers market: two rows of stalls
    const kinds = ['peaches', 'flowers', 'honey'], awn = ['#2F7FA8', '#3E8E7E', '#E07A3F', '#7D5BA6', '#2F5D50', '#E8457A'], cloth = ['#F2D55C', '#F5F0E6', '#F4A3B5', '#9EC3B5'];
    let s = 0;
    for (const y of [1210, 1400]) for (const x of [2000, 2200, 2400, 2600, 2800]) { add('props/market/stall-' + kinds[s % 3], x, y, 1.05, 0, { tint: { awn: awn[s % 6], awn2: '#F5F0E6', cloth: cloth[s % 4] }, stall: true }); s++; }
    // flower beds
    for (const [x, y, k] of [[2950, 1690, 0.9], [3040, 1702, 0.8], [2870, 1712, 0.85], [420, 1560, 0.8], [1280, 1980, 0.85], [2440, 2050, 0.85]]) add('props/vegetation/azalea-bush', x, y, k, x % 2);
    // foreground hedges along the south edge, open at the promenade
    for (let x = 140; x < 3200; x += 290) if (x < 1440 || x > 1760) add('props/vegetation/hedge', x, 2398, 1.25, (x / 290) % 2);
    return g;
  }

  // ---- hand-placed stories: [asset, x, y, flip, extra] (people at scale P unless k given) ----
  // Each story id is listed in docs/forsyth-blueprint.md.
  function stories() {
    const st = [];
    const s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
    // 1 painter at an easel painting the fountain
    s('painter', C + 'painter', 1276, 646); s('painter', 'props/furniture/easel-fountain-painting', 1336, 648, 0, { k: 0.85 });
    // 2 saxophone busker with tip hat and listeners
    s('busker', C + 'saxophonist', 1860, 474, 1); s('busker', 'props/furniture/tip-hat', 1812, 482, 0, { k: 0.9 });
    s('busker', C + 'scad-student-portfolio', 1762, 490); s('busker', C + 'elder-pigeon-feeder', 1918, 500, 1); s('busker', B + 'child', 1806, 516, 0); s('busker', B + 'coffee', 1730, 510, 0);
    // 3 wedding photo in front of the fountain
    s('wedding', C + 'groom', 1542, 800); s('wedding', C + 'bride', 1586, 802, 1); s('wedding', C + 'tourist-photographer', 1700, 880, 1);
    // 4 dog runs off with a picnic sandwich
    s('picnic-raid', 'props/food/picnic-blanket', 1900, 948, 0, { k: 1.1 }); s('picnic-raid', C + 'picnicker-startled', 1852, 936); s('picnic-raid', 'props/animals/dog-sandwich-thief', 2040, 976, 0, { k: 0.95 });
    // 5 pigeons and crumbs
    s('pigeons', C + 'elder-pigeon-feeder', 1220, 902);
    for (const [x, y, f] of [[1286, 908, 0], [1308, 922, 1], [1270, 928, 1], [1320, 900, 0], [1294, 940, 0], [1250, 946, 1]]) s('pigeons', 'props/animals/pigeon', x, y, f, { k: 0.9 });
    // 6 child chasing bubbles
    s('bubbles', C + 'child-bubbles', 1412, 884); s('bubbles', 'effects/bubbles', 1440, 846, 0, { k: 0.9 });
    // 7 dachshund towing its walker
    s('dachshund', C + 'dog-walker', 1586, 972, 0, { id: 'walker7' }); s('dachshund', 'props/animals/dog-dachshund', 1670, 978, 0, { k: 0.9, leash: 'walker7' });
    // 8 walking tour behind a raised umbrella
    s('tour', C + 'tour-guide', 1986, 818); s('tour', C + 'tourist-photographer', 2036, 826, 1); s('tour', B + 'walk', 2080, 812, 1); s('tour', C + 'scad-student-portfolio', 2122, 832, 1); s('tour', B + 'dress', 2124, 796, 1); s('tour', B + 'tote', 2166, 820, 1);
    // 9 queue at the praline cart; 10 a balloon slipping away
    s('pralines', C + 'praline-vendor', 2100, 478, 1); s('pralines', B + 'coffee', 2026, 494); s('pralines', B + 'phone', 1990, 486); s('balloon', C + 'kid-balloon', 2170, 500);
    // 11 cyclists on Gaston Street
    s('cyclists', C + 'cyclist', 1100, 334); s('cyclists', C + 'cyclist', 2060, 318, 1); s('cyclists', C + 'cyclist', 640, 326, 1);
    // 12 reader on a bench
    s('reader', C + 'reader-seated', 1980, 718); s('reader', C + 'reader-seated', 1348, 480, 1);
    // 13 sculptor carving a bust on the west lawn, with an onlooker
    s('sculptor', C + 'sculptor', 300, 1480); s('sculptor', B + 'phone', 420, 1500, 1);
    // 14 chess game with kibitzers by the patio
    s('chess', C + 'chess-players', 1250, 1300); s('chess', B + 'coffee', 1196, 1262); s('chess', B + 'cane', 1318, 1270, 1); s('chess', B + 'walk', 1290, 1236, 1);
    // 15 juggler with a ring of watchers on the south lawn
    s('juggler', C + 'juggler', 2000, 1800);
    for (const [a, x, y, f] of [[B + 'child', 1940, 1840, 0], [B + 'child', 2060, 1846, 1], [B + 'coffee', 1912, 1800, 0], [B + 'phone', 2090, 1790, 1], [B + 'dress', 1960, 1870, 0], [B + 'tote', 2040, 1880, 1]]) s('juggler', a, x, y, f);
    // 16 dancer twirling while a friend films
    s('dancer', C + 'dancer', 2400, 1850); s('dancer', B + 'phone', 2470, 1860, 1);
    // 17 gardener planting azaleas by the east bed
    s('gardener', C + 'gardener', 2860, 1760);
    // 18 maintenance worker raking a leaf pile (and a child about to jump in it)
    s('leaves', C + 'maintenance-worker', 560, 2210); s('leaves', B + 'child', 680, 2236, 1);
    // 19 queue at the peach stall
    s('market-queue', B + 'tote', 2010, 1262); s('market-queue', B + 'dress', 2050, 1270); s('market-queue', B + 'cane', 2090, 1266, 1); s('market-queue', B + 'walk', 2130, 1272, 1);
    // 20 kite flyers on the south lawn
    s('kites', B + 'child', 1040, 2060); s('kites', 'effects/kite', 1050, 2020, 0, { k: 1.3, tint: { kite: '#E8457A', kite2: '#F7C548' } });
    s('kites', B + 'walk', 2620, 2080, 1); s('kites', 'effects/kite', 2606, 2026, 1, { k: 1.4, tint: { kite: '#2F7FA8', kite2: '#F2D55C' } });
    // 21 playground: kids on the sand, parents on the rim
    for (const [a, x, y, f] of [[B + 'child', 760, 1880, 0], [B + 'child', 860, 1920, 1], [C + 'child-bubbles', 700, 1940, 0], [B + 'child', 930, 1870, 1], [C + 'kid-balloon', 820, 1980, 0], [C + 'parent-stroller', 560, 1900, 0], [B + 'coffee', 1080, 1920, 1], [B + 'phone', 640, 1830, 0]]) s('playground', a, x, y, f);
    // 26 cafe customers seated at the tables (left chair faces in, right chair mirrored)
    for (const [x, y, both] of [[520, 1222, 1], [700, 1212, 0], [880, 1226, 1], [560, 1352, 0], [760, 1364, 1], [960, 1346, 1]]) {
      s('cafe', B + 'seated', x - 24, y + 3, 0);
      if (both) s('cafe', B + 'seated', x + 26, y + 4, 1);
    }
    // 22 two friends chatting over coffee on the patio
    s('coffee-chat', B + 'coffee', 640, 1290); s('coffee-chat', B + 'coffee', 690, 1296, 1);
    // 23 someone glued to their phone, about to walk into a lamp post
    s('phone-walk', B + 'phone', 1520, 1514, 0);
    // 24 market vendors behind their counters (only head and shoulders show above the goods)
    let v = 0;
    for (const y of [1210, 1400]) for (const x of [2000, 2200, 2400, 2600, 2800]) s('market-vendors', [B + 'coffee', B + 'walk', B + 'dress'][v % 3], x + (v++ % 2 ? 22 : -18), y - 14, v % 2);
    // 25 picnics on the south lawn
    for (const [x, y, group] of [[2620, 1990, [[B + 'coffee', -50, -8, 0], [B + 'child', 46, 4, 1], [B + 'dress', 62, -10, 1]]], [1320, 2190, [[B + 'phone', -56, -4, 0], [B + 'tote', 58, -2, 1]]], [2300, 2240, [[B + 'walk', -54, -6, 0], [B + 'coffee', 56, -8, 1], [B + 'child', 20, 18, 0]]]]) {
      s('picnics', 'props/food/picnic-blanket', x, y, 0, { k: 1.05 });
      for (const [a, dx, dy, f] of group) s('picnics', a, x + dx, y + dy, f);
    }
    // 26 a dog racing after a runaway sun hat, its owner hurrying behind and a girl pointing
    s('hat-chase', 'props/street/lost-hat', 2880, 880, 0, { k: 1.1 });
    s('hat-chase', 'props/animals/dog-dachshund', 2810, 892, 0, { k: 0.9 });
    s('hat-chase', B + 'walk', 2730, 886, 0); s('hat-chase', B + 'wave', 2960, 930, 1);
    // 27 a painter who has just knocked over the easel and dropped every brush
    s('dropped-brushes', C + 'painter', 600, 840, 1); s('dropped-brushes', 'props/furniture/dropped-brushes', 650, 862, 0, { k: 1.1 });
    s('dropped-brushes', 'props/furniture/easel-fountain-painting', 540, 846, 1, { k: 0.85 }); s('dropped-brushes', B + 'books', 700, 850, 1);
    // 28 a tourist family lining up for a group photograph, one of them still waving at someone
    s('group-photo', C + 'tourist-photographer', 1360, 1010, 1);
    for (const [a, dx, dy, f] of [[B + 'wave', -170, -6, 0], [B + 'dress', -140, 2, 0], [B + 'child', -118, 10, 0], [B + 'umbrella', -96, -2, 1], [B + 'walk', -70, 4, 1]]) s('group-photo', a, 1360 + dx, 1010 + dy, f);
    return st;
  }

  // ---- spawn zones for the filler crowd ----
  const ZONES = [
    { id: 'plaza-ring', w: 18, path: false, pt: (r) => { const a = r() * Math.PI * 2, t = 0.74 + r() * 0.24; return [PLAZA.cx + Math.cos(a) * PLAZA.rx * t, PLAZA.cy + Math.sin(a) * PLAZA.ry * t]; } },
    { id: 'north-walk', w: 6, path: true, pt: (r) => [80 + r() * 3040, 382 + r() * 16] },
    { id: 'promenade', w: 12, path: true, pt: (r) => [1548 + r() * 104, 820 + r() * 1560] },
    { id: 'cross-walk', w: 8, path: true, pt: (r) => [90 + r() * 3020, 1570 + r() * 36] },
    { id: 'south-walk', w: 5, path: true, pt: (r) => [90 + r() * 3020, 2306 + r() * 22] },
    { id: 'side-walks', w: 4, path: true, pt: (r) => [r() < 0.5 ? 48 + r() * 20 : 3132 + r() * 20, 420 + r() * 1960] },
    { id: 'patio', w: 7, path: false, pt: (r) => [430 + r() * 660, 1170 + r() * 240] },
    { id: 'market', w: 12, path: false, pt: (r) => [1890 + r() * 1060, r() < 0.6 ? 1240 + r() * 120 : 1424 + r() * 44] },
    { id: 'lawns', w: 28, path: false, pt: (r) => [90 + r() * 3020, 430 + r() * 1860] },
  ];

  // Ground-contact footprints nobody may stand on.
  function blocked(x, y) {
    if (y < 376 || y > 2392 || x < 30 || x > 3170) return true;
    if (inEll(x, y, BASIN, 6)) return true;
    for (const [cx, cy] of [[2000, 1210], [2200, 1210], [2400, 1210], [2600, 1210], [2800, 1210], [2000, 1400], [2200, 1400], [2400, 1400], [2600, 1400], [2800, 1400]]) if (inRect(x, y, [cx - 62, cy - 26, cx + 62, cy + 4])) return true;
    for (const [cx, cy] of [[520, 1222], [700, 1212], [880, 1226], [560, 1352], [760, 1364], [960, 1346]]) if (inRect(x, y, [cx - 40, cy - 12, cx + 40, cy + 6])) return true;
    return false;
  }

  // Hiding spots for the target. Each lists the difficulties it suits; the validator still has the last word.
  const SPOTS = [
    { id: 'plaza-nw', x: 1330, y: 560, r: 60, d: ['easy'] },
    { id: 'playground-rim', x: 1070, y: 1880, r: 40, d: ['easy'] },
    { id: 'promenade-north', x: 1600, y: 960, r: 40, d: ['easy', 'normal'] },
    { id: 'cross-walk', x: 2500, y: 1588, r: 90, d: ['easy'] },
    { id: 'south-walk', x: 900, y: 2318, r: 120, d: ['easy', 'normal'] },
    { id: 'busker-crowd', x: 1840, y: 500, r: 40, d: ['normal'] },
    { id: 'tour-group', x: 2070, y: 830, r: 40, d: ['normal'] },
    { id: 'cafe-tables', x: 740, y: 1290, r: 100, d: ['normal', 'hard'] },
    { id: 'juggler-ring', x: 2000, y: 1850, r: 50, d: ['normal'] },
    { id: 'market-aisle', x: 2400, y: 1300, r: 160, d: ['normal', 'hard'] },
    { id: 'picnic', x: 1940, y: 970, r: 60, d: ['normal'] },
    { id: 'oak-alley', x: 1600, y: 1650, r: 260, d: ['hard'] },
    { id: 'market-back', x: 2400, y: 1440, r: 180, d: ['hard'] },
    { id: 'behind-lamp', x: 1950, y: 590, r: 18, d: ['hard'] },
    { id: 'hedge-line', x: 1600, y: 2370, r: 1300, d: ['hard'] },
    { id: 'plaza-crowd', x: 1600, y: 520, r: 260, d: ['hard', 'normal'] },
  ];
  // Forsyth as a district placed with its north edge at world y = OY.
  function district(OY = 0) {
    const sh = (o) => Object.assign({}, o, { y: o.y + OY });
    return {
      id: 'forsyth', name: 'Forsyth Park', y0: OY, h: H,
      // In the city, Bull Street reaches the park gate between the two halves of the Gaston Street row,
      // and Gaston Street carries traffic.
      geography: () => {
        const g = geography().map(sh);
        if (OY > 0 && WS.streets) {
          for (const e of g) if (e.asset === 'environments/forsyth/gaston-street-houses') e.x = e.flip ? 3285 : -85;
          const add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
          WS.streets.street(add, OY + 270, 72, { parked: [] });
          WS.streets.bull(add, OY, OY + 270, { noTrees: true });
          add('props/street/sign-gaston', 1715, OY + 368, 0.9);
        }
        return g;
      },
      stories: () => stories().map(sh),
      zones: ZONES.map((z) => Object.assign({}, z, { pt: (r) => { const [x, y] = z.pt(r); return [x, y + OY]; } })),
      blocked: (x, y) => blocked(x, y - OY),
      spots: SPOTS.map(sh),
      fountain: { x: 1600, y: 630 + OY, rx: 270, ry: 100 },
      area(x, y) {
        y -= OY;
        if (y < 0 || y >= H) return null;
        if (((x - 1600) / 430) ** 2 + ((y - 640) / 172) ** 2 < 1) return 'around the Forsyth Park fountain';
        if (y < 470) return 'along Gaston Street at the top of Forsyth Park';
        if (x > 1850 && x < 3000 && y > 1100 && y < 1480) return 'in the Forsyth farmers market';
        if (x > 380 && x < 1120 && y > 1140 && y < 1430) return 'on the Forsyth café patio';
        if (((x - 820) / 260) ** 2 + ((y - 1900) / 120) ** 2 < 1) return 'by the Forsyth playground';
        if (x > 1440 && x < 1760 && y > 1000) return 'under the oak alley in Forsyth Park';
        if (y > 2280) return 'along the south edge of Forsyth Park';
        return 'on the ' + (x < 1600 ? 'west' : 'east') + ' side of Forsyth Park';
      },
    };
  }
  WS.districts = Object.assign(WS.districts || {}, { forsyth: district });
  WS.scenes = Object.assign(WS.scenes || {}, { forsyth: { build: (identity) => WS.buildScene(identity, { id: 'forsyth', name: 'Forsyth Park', w: W, h: H, ground: 'environments/forsyth/ground', districts: [district(0)], budget: { low: 180, standard: 360, dense: 600 }, home: { x: 1600, y: 830, zoom: 1.3 } }) } });
})();
