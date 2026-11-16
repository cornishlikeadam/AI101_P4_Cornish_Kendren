/* The west and east wings of the city (Agent 2): two 2960-wide strips either side of the original 3200,
   which now sits at world x 2960-6160 (Bull Street at x 4560). Each band continues across the full width at
   the same y, with real places in their real order (distances compressed):
     river:   Talmadge Bridge, Plant Riverside (west); Cotton Exchange, Emmet Park and the Old Harbor Light (east)
     market:  Franklin Square and First African Baptist Church (west); Reynolds Square, the Olde Pink House,
              John Wesley's statue and Warren Square (east)
     squares: Chatham Square (west); Colonial Park Cemetery and Troup Square (east)
     Jones:   front gardens and a pocket playground (west); Calhoun Square with Wesley Monumental Church and
              Whitefield Square's gazebo (east)
     Forsyth: the Victorian District on both sides of the park, with Whitaker and Drayton Streets on its edges
   All coordinates here are world coordinates. Mirrors tools/author/savannah-wings.mjs. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const E = 6160;                                   // east wing origin
  const NS = { west: [700, 2100], east: [E + 840, E + 2240] };
  const EDGE = { west: 2905, east: E + 75 };        // Whitaker / Drayton, Forsyth band only
  const NS_NAMES = { 700: 'montgomery', 2100: 'jefferson', [E + 840]: 'habersham', [E + 2240]: 'price', 2905: 'whitaker', [E + 75]: 'drayton' };
  const ROADS = [[1400, 80, 'bay'], [2700, 80, 'congress'], [3220, 70, 'harris'], [4040, 70, 'charlton'], [4560, 80, 'jones'], [5470, 72, 'gaston'], [6200, 70, 'hall'], [6900, 70, 'parkave'], [7520, 70, null]];
  const CAR_COLOURS = ['#2F7FA8', '#C73E3A', '#F5F0E6', '#3E8E7E', '#F2D55C', '#2B2B2B', '#E07A3F', '#7D5BA6', '#8DBA5A', '#3D4F6E'];
  const OAK = ['props/vegetation/live-oak', 'props/vegetation/live-oak-tall', 'props/vegetation/live-oak-lean'];
  const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const nsOf = (side, y) => (y >= 5200 ? [...NS[side], EDGE[side]] : NS[side]);
  const x0 = (side) => (side === 'west' ? 0 : E), x1 = (side) => (side === 'west' ? 2960 : 9120);
  let ci = 0;

  // ---------- shared street furniture ----------
  function streetLife(add, side, y, h, name) {
    const xs = nsOf(side, y), a = x0(side), b = x1(side);
    for (let x = a + 120; x < b - 80; x += 330) {
      if (xs.some((c) => Math.abs(x - c) < 190)) continue;
      add(ci % 3 === 2 ? 'props/vehicles/car-small' : 'props/vehicles/car', x, y + h - 3, 0.72, (x / 330) % 2 > 1 ? 1 : 0, { tint: { car: CAR_COLOURS[ci++ % 10], car2: '#F5F0E6' }, parked: true });
    }
    add('props/vehicles/car', a + 600 + (y % 700), y + h * 0.5 - 2, 0.72, 1, { tint: { car: CAR_COLOURS[ci++ % 10], car2: '#F5F0E6' }, drive: 44 + (y % 17) });
    add('props/vehicles/car-small', a + 1900 - (y % 500), y + h * 0.78, 0.72, 0, { tint: { car: CAR_COLOURS[ci++ % 10], car2: '#F5F0E6' }, drive: 50 + (y % 13) });
    if (name) for (const c of xs) add('props/street/sign-' + NS_NAMES[c] + '-' + name, c + 110, y + h + 22, 0.9);
    for (const c of xs) { add('props/street/hydrant', c - 100, y + h + 18, 0.9); add('props/street/bin', c + 150, y + h + 20, 0.9); }
  }
  // oaks in the tree pits and lamps along a north-south street, between two cross streets
  function avenue(add, c, y0, y1, k = 0.42) {
    let i = 0;
    for (let y = y0 + 90; y < y1 - 60; y += 170, i++) {
      add(OAK[i % 3], i % 2 ? c + 70 : c - 70, y + 4, k, i % 2);
      add('props/furniture/lamp-post', i % 2 ? c - 72 : c + 72, y + 70, 0.8);
    }
  }
  function squareDress(add, cx, cy, hw, hh, opts = {}) {
    [[-hw + 90, -hh + 70], [hw - 90, -hh + 70], [-hw + 90, hh - 40], [hw - 90, hh - 40]].forEach(([dx, dy], i) => add(OAK[i % 3], cx + dx, cy + dy, opts.oak || 0.6, i % 2));
    for (const [dx, dy] of [[-hw * 0.45, -60], [hw * 0.45, -60], [-hw * 0.45, 70], [hw * 0.45, 70]]) add('props/furniture/park-bench', cx + dx, cy + dy, 0.85);
    for (const dx of [-hw * 0.32, hw * 0.32]) add('props/furniture/lamp-post', cx + dx, cy - 40, 0.9);
    if (!opts.noAzaleas) for (const dx of [-hw + 40, hw - 40]) add('props/vegetation/azalea-bush', cx + dx, cy + 10, 0.85, dx > 0 ? 1 : 0);
  }
  // A garden lot behind a low fence: two loose rows of oaks, azalea beds and a bench, so no lot is bare lawn.
  function garden(add, a, b, y0, y1) {
    let i = 0;
    for (let x = a + 70; x < b - 50; x += 210, i++) {
      add(OAK[(i + y0) % 3], x, y0 + (y1 - y0) * 0.45 + (i % 2) * 18, 0.46, i % 2);
      add('props/vegetation/azalea-bush', x + 100, y1 - 12, 0.8, i % 2);
      if (i % 3 === 1) add('props/furniture/park-bench', x + 60, y0 + (y1 - y0) * 0.8, 0.8);
    }
    for (let x = a + 160; x < b - 60; x += 340) add('props/vegetation/azalea-bush', x, y0 + 30, 0.75, 1);
  }
  const gardenZone = (a, b, y0, y1) => ({ id: 'garden', w: Math.max(2, Math.round((b - a) / 300)), path: false, pt: (r) => [a + 30 + r() * (b - a - 60), y0 + 40 + r() * (y1 - y0 - 70)] });
  const inGardenFence = (x, y, a, b, y1) => x > a && x < b && y > y1 - 14 && y < y1 + 2;
  const sqWalk = (id, cx, cy, hw, hh, w = 12) => ({ id, w, path: true, pt: (r) => (r() < 0.5 ? [cx - hw + 30 + r() * (hw * 2 - 60), cy - 16 + r() * 32] : [cx - 16 + r() * 32, cy - hh + 30 + r() * (hh * 2 - 60)]) });
  const sqLawn = (id, cx, cy, hw, hh, w = 6) => ({ id, w, path: false, pt: (r) => [cx - hw + 30 + r() * (hw * 2 - 60), cy - hh + 30 + r() * (hh * 2 - 60)] });
  const walkH = (side, y0, y1, w = 8) => ({ id: 'wing-walk', w, path: true, pt: (r) => [x0(side) + 40 + r() * 2880, y0 + r() * (y1 - y0)] });
  const walkNS = (side, y0, y1, w = 4) => ({ id: 'wing-ns', w, path: true, pt: (r) => { const xs = NS[side], c = xs[Math.floor(r() * xs.length)], y = y0 + 40 + r() * (y1 - y0 - 80); return [c + (y >= 7200 || r() >= 0.5 ? 62 : -76) + r() * 14, y]; } });
  const inNSGap = (side, x, y) => (y >= 7240 ? NS[side].some((c) => x >= c + 58 && x <= c + 78) : nsOf(side, y).some((c) => Math.abs(x - c) < (c === 2905 || c === E + 75 ? 52 : 80)));
  const onRoad = (side, x, y) => ROADS.some(([ry, h]) => y > ry - 4 && y < ry + h + 4) || (y > 1476 && nsOf(side, y).some((c) => Math.abs(x - c) < 60));
  const part = (side, o) => Object.assign({ side, geography: () => [], stories: () => [], zones: [], spots: [], blocked: () => false, area: () => null }, o);

  // ---------- river band ----------
  const river = {
    west: () => part('west', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/riverfront/warehouse-row-west', 0, 1350, 1, 0, { layer: 'far' });
        add('props/landmarks/plant-riverside-stacks', 460, 1350, 1);
        add('props/river/talmadge-bridge', 1350, 250, 1, 0, { layer: 'far' });
        add('props/river/container-ship', 600, 360, 1, 0, { drive: 11 });
        for (let x = 120; x < 2960; x += 260) add('props/furniture/lamp-post', x, 452, 0.95);
        for (const x of [1180, 1700, 2300]) add('props/furniture/park-bench', x, 470, 0.9);
        for (let x = 80; x < 2960; x += 380) add('props/furniture/lamp-post', x, 1046, 0.9);
        for (const [x, y] of [[180, 520], [930, 520], [180, 588], [930, 588]]) add('props/vegetation/palmetto', x, y, 0.7, x > 500 ? 1 : 0);
        for (const [x, y] of [[420, 540], [600, 552], [760, 540]]) add('props/furniture/cafe-table', x, y, 0.9, 0, { tint: { umb: ['#2F5D50', '#C73E3A', '#E8C872'][x % 3], umb2: '#F5F0E6' } });
        streetLife(add, 'west', 1400, 80, 'bay');
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a saxophonist on the Plant Riverside terrace with listeners
        s('plant-busker', C + 'saxophonist', 300, 560, 1); s('plant-busker', 'props/furniture/tip-hat', 250, 568, 0, { k: 0.9 });
        for (const [x, f] of [[200, 0], [360, 1], [380, 1], [170, 0]]) s('plant-busker', [B + 'coffee', B + 'wave', B + 'dress', B + 'umbrella'][x % 4], x, 590 + (x % 3) * 6, f);
        // children at the rail waving at the container ship
        for (const [x, a] of [[1240, B + 'child'], [1280, B + 'wave'], [1320, B + 'child'], [1360, C + 'parent-stroller']]) s('ship-wave', a, x, 462, 0);
        // a tourist photographing the bridge
        s('bridge-photo', C + 'tourist-photographer', 1600, 470, 0); s('bridge-photo', B + 'phone', 1660, 476, 1);
        return st;
      },
      zones: [
        { id: 'riverwalk', w: 16, path: true, pt: (r) => [40 + r() * 2880, 470 + r() * 420] },
        { id: 'river-street', w: 8, path: true, pt: (r) => [40 + r() * 2880, 906 + r() * 110] },
        { id: 'factors-walk', w: 4, path: true, pt: (r) => [40 + r() * 2880, 1356 + r() * 40] },
      ],
      blocked: (x, y) => y < 456 || (y > 1018 && y < 1350) || (y > 1400 && y < 1480),
      spots: [
        { id: 'plant-terrace', x: 500, y: 540, r: 300, d: ['easy', 'normal'] },
        { id: 'plant-busker', x: 280, y: 580, r: 70, d: ['hard'] },
        { id: 'river-street-west', x: 1500, y: 970, r: 1300, d: ['easy', 'normal'] },
        { id: 'ship-watchers', x: 1300, y: 470, r: 80, d: ['normal', 'hard'] },
      ],
      area: (x, y) => (y >= 1350 ? 'on Bay Street, at the west end' : y >= 900 ? 'on River Street, near Plant Riverside' : x < 1000 ? 'on the Plant Riverside terrace' : 'on the riverwalk, looking at the Talmadge Bridge'),
    }),
    east: () => part('east', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/riverfront/warehouse-row-east', E, 1350, 1, 0, { layer: 'far' });
        add('props/landmarks/old-harbor-light', E + 1750, 500, 0.95);
        for (let x = E + 120; x < 9120; x += 260) if (x < E + 1480 || x > E + 2720) add('props/furniture/lamp-post', x, 452, 0.95);
        for (let x = E + 80; x < 9120; x += 380) add('props/furniture/lamp-post', x, 1046, 0.9);
        for (const x of [E + 1560, E + 2040, E + 2500]) add(OAK[x % 3], x, 470, 0.5, x % 2);
        for (const x of [E + 1650, E + 1880, E + 2300]) add('props/furniture/park-bench', x, 520, 0.85);
        add('props/river/tugboat', E + 900, 330, 0.9, 1);
        streetLife(add, 'east', 1400, 80, 'bay');
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a picnic in Emmet Park under the Old Harbor Light
        s('emmet-picnic', 'props/food/picnic-blanket', E + 2150, 530, 0, { k: 1 });
        for (const [dx, a, f] of [[-50, B + 'coffee', 0], [50, B + 'child', 1], [20, B + 'books', 1]]) s('emmet-picnic', a, E + 2150 + dx, 524, f);
        // a praline cart on River Street with a queue
        s('east-pralines', C + 'praline-vendor', E + 1200, 980); for (const [dx, a] of [[-60, B + 'child'], [-100, B + 'dress'], [-140, B + 'umbrella']]) s('east-pralines', a, E + 1200 + dx, 984, 0);
        // a tour guide at the Cotton Exchange
        s('cotton-tour', C + 'tour-guide', E + 760, 1390, 1); for (const [dx, a] of [[60, B + 'walk'], [90, C + 'tourist-photographer'], [120, B + 'dress']]) s('cotton-tour', a, E + 760 + dx, 1394, 1);
        return st;
      },
      zones: [
        { id: 'riverwalk', w: 16, path: true, pt: (r) => [E + 40 + r() * 2880, 470 + r() * 420] },
        { id: 'river-street', w: 8, path: true, pt: (r) => [E + 40 + r() * 2880, 906 + r() * 110] },
        { id: 'factors-walk', w: 4, path: true, pt: (r) => [E + 40 + r() * 2880, 1356 + r() * 40] },
        { id: 'emmet-park', w: 6, path: false, pt: (r) => [E + 1520 + r() * 1160, 450 + r() * 100] },
      ],
      blocked: (x, y) => y < 456 || (y > 1018 && y < 1350) || (y > 1400 && y < 1480) || inRect(x, y, [E + 940, 968, E + 1030, 1025]) || inRect(x, y, [E + 1730, 490, E + 1770, 506]),
      spots: [
        { id: 'emmet-park', x: E + 2000, y: 510, r: 450, d: ['normal', 'hard'] },
        { id: 'harbor-light', x: E + 1750, y: 520, r: 90, d: ['easy'] },
        { id: 'river-street-east', x: E + 1500, y: 970, r: 1300, d: ['easy', 'normal'] },
        { id: 'cotton-tour', x: E + 820, y: 1392, r: 60, d: ['hard'] },
      ],
      area: (x, y) => (y >= 1350 ? 'on Bay Street, by the Cotton Exchange' : y >= 900 ? 'on River Street, at the east end' : x > E + 1450 && x < E + 2750 && y < 600 ? 'in Emmet Park, by the Old Harbor Light' : 'on the riverwalk, at the east end'),
    }),
  };

  // ---------- market band ----------
  const FRANKLIN = [1400, 2265, 520, 360], REYNOLDS = [E + 1540, 2265, 560, 360], WARREN = [E + 2600, 2265, 300, 300];
  const WSTALLS = [[2300, 2060], [2520, 2060], [2740, 2060], [2400, 2560], [2700, 2560]];
  const market = {
    west: () => part('west', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/market/market-row-west', 0, 1830, 1, 0, { layer: 'far' });
        add('environments/wings/first-african-baptist', FRANKLIN[0], 2035, 0.9);
        squareDress(add, FRANKLIN[0], FRANKLIN[1] + 60, FRANKLIN[2], FRANKLIN[3] - 60);
        const kinds = ['peaches', 'flowers', 'honey'];
        WSTALLS.forEach(([x, y], i) => add('props/market/stall-' + kinds[i % 3], x, y, 1.05, 0, { tint: { awn: ['#2F7FA8', '#E8457A', '#3E8E7E', '#E07A3F', '#7D5BA6'][i], awn2: '#F5F0E6', cloth: '#F5F0E6' } }));
        for (const [x, y] of [[2350, 2320], [2560, 2340], [2780, 2320]]) add('props/furniture/cafe-table', x, y, 0.9, 0, { tint: { umb: ['#7D5BA6', '#2F5D50', '#C73E3A'][x % 3], umb2: '#F5F0E6' } });
        for (const c of NS.west) avenue(add, c, 1480, 2700);
        for (let x = 200; x < 2960; x += 420) add('props/furniture/lamp-post', x, 1850, 0.95);
        streetLife(add, 'west', 2700, 80, 'congress');
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a history tour outside First African Baptist Church
        s('church-tour', C + 'historian', 1250, 2130); for (const [dx, a] of [[-60, B + 'walk'], [-90, B + 'books'], [-130, C + 'tourist-photographer'], [-40, B + 'child']]) s('church-tour', a, 1250 + dx, 2150 + (dx % 3) * 4, 0);
        // kids chasing pigeons across Franklin Square
        for (const [x, y, f] of [[1600, 2420, 0], [1650, 2440, 1], [1700, 2410, 0]]) s('pigeon-chase', 'props/animals/pigeon', x, y, f, { k: 0.9 });
        s('pigeon-chase', B + 'child', 1540, 2430, 0); s('pigeon-chase', B + 'wave', 1490, 2420, 0);
        for (const [i, [x, y]] of WSTALLS.entries()) s('west-vendors', [B + 'coffee', B + 'dress', B + 'walk'][i % 3], x + 20, y - 14, i % 2);
        return st;
      },
      zones: [
        sqWalk('franklin-paths', FRANKLIN[0], FRANKLIN[1] + 60, FRANKLIN[2], FRANKLIN[3] - 60), sqLawn('franklin-lawn', FRANKLIN[0], FRANKLIN[1] + 60, FRANKLIN[2], FRANKLIN[3] - 60),
        { id: 'west-market', w: 16, path: false, pt: (r) => [2200 + r() * 740, 1880 + r() * 780] },
        walkH('west', 1840, 1874), walkH('west', 2788, 2890), walkNS('west', 1480, 2700),
      ],
      blocked: (x, y) => y < 1836 || (y > 2910 && !inNSGap('west', x, y)) || onRoad('west', x, y) || inRect(x, y, [FRANKLIN[0] - 170, 1960, FRANKLIN[0] + 170, 2045]) || WSTALLS.some(([sx, sy]) => inRect(x, y, [sx - 62, sy - 26, sx + 62, sy + 4])),
      spots: [
        { id: 'franklin-square', x: FRANKLIN[0], y: 2330, r: 420, d: ['easy', 'normal'] },
        { id: 'church-tour', x: 1170, y: 2150, r: 70, d: ['hard'] },
        { id: 'west-market', x: 2560, y: 2300, r: 300, d: ['normal', 'hard'] },
      ],
      area: (x, y) => (y < 1880 ? 'along the shops west of City Market' : y > 2690 ? 'on Congress Street, west side' : x > 2150 ? 'in the west end of City Market' : x > 860 && x < 1940 ? 'in Franklin Square, by First African Baptist Church' : 'on Montgomery Street'),
    }),
    east: () => part('east', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/market/market-row-east', E, 1830, 1, 0, { layer: 'far' });
        add('environments/wings/olde-pink-house', REYNOLDS[0], 2035, 0.95);
        add('props/landmarks/wesley-statue', REYNOLDS[0], 2330, 0.95);
        squareDress(add, REYNOLDS[0], REYNOLDS[1] + 60, REYNOLDS[2], REYNOLDS[3] - 60);
        squareDress(add, WARREN[0], WARREN[1], WARREN[2], WARREN[3], { oak: 0.5, noAzaleas: true });
        for (const c of NS.east) avenue(add, c, 1480, 2700);
        for (let x = E + 200; x < 9120; x += 420) add('props/furniture/lamp-post', x, 1850, 0.95);
        streetLife(add, 'east', 2700, 80, 'congress');
        add('props/vehicles/carriage', E + 600, 2730, 0.95, 1, { drive: 22 });
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a wedding photo on the Pink House steps
        s('pink-wedding', C + 'bride', REYNOLDS[0] - 30, 2080); s('pink-wedding', C + 'groom', REYNOLDS[0] + 20, 2082, 1); s('pink-wedding', C + 'tourist-photographer', REYNOLDS[0] + 140, 2150, 1);
        // a painter painting John Wesley, and a juggler in Warren Square with an audience
        s('wesley-painter', C + 'painter', REYNOLDS[0] - 220, 2380); s('wesley-painter', 'props/furniture/easel-fountain-painting', REYNOLDS[0] - 168, 2382, 0, { k: 0.85 });
        s('warren-juggler', C + 'juggler', WARREN[0], 2300); for (const [dx, a, f] of [[-60, B + 'child', 0], [60, B + 'child', 1], [-30, B + 'wave', 0], [90, B + 'coffee', 1]]) s('warren-juggler', a, WARREN[0] + dx, 2340 + (dx % 4), f);
        return st;
      },
      zones: [
        sqWalk('reynolds-paths', REYNOLDS[0], REYNOLDS[1] + 60, REYNOLDS[2], REYNOLDS[3] - 60), sqLawn('reynolds-lawn', REYNOLDS[0], REYNOLDS[1] + 60, REYNOLDS[2], REYNOLDS[3] - 60),
        sqWalk('warren-paths', ...WARREN), walkH('east', 1840, 1874), walkH('east', 2788, 2890), walkNS('east', 1480, 2700),
        { id: 'east-sidewalks', w: 6, path: false, pt: (r) => [E + 40 + r() * 600, 1900 + r() * 760] },
      ],
      blocked: (x, y) => y < 1836 || (y > 2910 && !inNSGap('east', x, y)) || onRoad('east', x, y) || inRect(x, y, [REYNOLDS[0] - 200, 1960, REYNOLDS[0] + 200, 2045]) || ((x - REYNOLDS[0]) / 30) ** 2 + ((y - 2330) / 14) ** 2 < 1,
      spots: [
        { id: 'reynolds-square', x: REYNOLDS[0], y: 2330, r: 420, d: ['easy', 'normal'] },
        { id: 'pink-wedding', x: REYNOLDS[0], y: 2100, r: 90, d: ['normal', 'hard'] },
        { id: 'warren-juggler', x: WARREN[0], y: 2320, r: 80, d: ['hard'] },
      ],
      area: (x, y) => (y < 1880 ? 'along the shops on Bay Lane, east side' : y > 2690 ? 'on Congress Street, east side' : Math.abs(x - REYNOLDS[0]) < REYNOLDS[2] ? 'in Reynolds Square, by the Olde Pink House' : Math.abs(x - WARREN[0]) < WARREN[2] ? 'in Warren Square' : 'on Habersham Street'),
    }),
  };

  // ---------- squares band ----------
  const CHATHAM = [1400, 3655, 520, 325], CEM = [E + 960, 3330, E + 2120, 4000], TROUP = [E + 2620, 3655, 280, 280];
  const TOMBS = [];
  for (let i = 0; i < 26; i++) { const x = CEM[0] + 70 + ((i * 397) % 1020), y = CEM[1] + 60 + ((i * 211) % 560); if (Math.abs(x - (E + 1540)) > 40 && Math.abs(y - 3660) > 30) TOMBS.push([x, y, i % 3 === 0 ? 'props/landmarks/tomb-box' : 'props/landmarks/tomb-stones']); }
  const squares = {
    west: () => part('west', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/squares/row-houses-west', 0, 3220, 1, 0, { layer: 'far' });
        squareDress(add, ...CHATHAM);
        for (const [dx, dy] of [[-80, -30], [80, -30], [-80, 40], [80, 40]]) add('props/vegetation/azalea-bush', CHATHAM[0] + dx, CHATHAM[1] + dy, 0.8, dx > 0 ? 1 : 0);
        garden(add, 60, 560, 3340, 3980); garden(add, 2240, 2900, 3340, 3980);
        for (const c of NS.west) { avenue(add, c, 2780, 3220); avenue(add, c, 3290, 4040); avenue(add, c, 4110, 4560); }
        streetLife(add, 'west', 3220, 70, 'harris'); streetLife(add, 'west', 4040, 70, 'charlton');
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        s('chatham-chess', C + 'chess-players', CHATHAM[0] + 200, 3760); s('chatham-chess', B + 'cane', CHATHAM[0] + 260, 3732, 1); s('chatham-chess', B + 'books', CHATHAM[0] + 140, 3740, 0);
        s('chatham-dog', C + 'dog-walker', CHATHAM[0] - 260, 3600, 0, { id: 'chwalker' }); s('chatham-dog', 'props/animals/dog-dachshund', CHATHAM[0] - 176, 3606, 0, { k: 0.9, leash: 'chwalker' });
        s('garden-work', C + 'gardener', 300, 3700); s('garden-work', C + 'maintenance-worker', 2600, 3760, 1);
        return st;
      },
      zones: [sqWalk('chatham-paths', ...CHATHAM), sqLawn('chatham-lawn', ...CHATHAM), walkH('west', 3300, 3330, 6), walkH('west', 4120, 4248, 8), walkNS('west', 2780, 4560), gardenZone(60, 560, 3340, 3980), gardenZone(2240, 2900, 3340, 3980)],
      blocked: (x, y) => y < 3296 || (y > 4270 && !inNSGap('west', x, y)) || onRoad('west', x, y) || ((x - CHATHAM[0]) / 110) ** 2 + ((y - CHATHAM[1]) / 50) ** 2 < 1 || inGardenFence(x, y, 60, 560, 3980) || inGardenFence(x, y, 2240, 2900, 3980),
      spots: [
        { id: 'chatham-square', x: CHATHAM[0], y: CHATHAM[1], r: 420, d: ['easy', 'normal'] },
        { id: 'chatham-chess', x: CHATHAM[0] + 200, y: 3750, r: 60, d: ['hard'] },
        { id: 'charlton-west', x: 1500, y: 4200, r: 1300, d: ['easy'] },
      ],
      area: (x, y) => (y < 3300 ? 'on Harris Street, west side' : y > 4030 ? 'on Charlton Street, west side' : Math.abs(x - CHATHAM[0]) < CHATHAM[2] ? 'in Chatham Square' : 'by the gardens on Harris Street'),
    }),
    east: () => part('east', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/squares/row-houses-east', E, 3220, 1, 0, { layer: 'far' });
        add('environments/wings/cemetery-gate', E + 1540, 4002, 0.9);
        for (const [x, y, a] of TOMBS) add(a, x, y, 0.8, x % 2);
        for (const [x, y] of [[CEM[0] + 120, 3420], [CEM[2] - 120, 3430], [CEM[0] + 200, 3900], [CEM[2] - 200, 3880], [E + 1300, 3520], [E + 1800, 3820]]) add('props/vegetation/live-oak-tall', x, y, 0.62, x % 2);
        squareDress(add, ...TROUP, { oak: 0.5, noAzaleas: true });
        garden(add, E + 60, E + 690, 3340, 3980);
        add('props/landmarks/armillary-sphere', TROUP[0], TROUP[1] + 20, 0.9);
        for (const c of NS.east) { avenue(add, c, 2780, 3220); avenue(add, c, 3290, 4040); avenue(add, c, 4110, 4560); }
        streetLife(add, 'east', 3220, 70, 'harris'); streetLife(add, 'east', 4040, 70, 'charlton');
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a ghost tour gathering at the cemetery gate
        s('ghost-tour', C + 'historian', E + 1460, 4060); for (const [dx, a] of [[-50, B + 'umbrella'], [-90, B + 'books'], [-130, B + 'child'], [-170, C + 'tourist-photographer']]) s('ghost-tour', a, E + 1460 + dx, 4070 + (dx % 3) * 4, 0);
        // a student sketching a tomb, and dogs at Troup Square
        s('tomb-sketch', C + 'scad-student-portfolio', E + 1200, 3600, 1);
        s('troup-dogs', C + 'dog-walker', TROUP[0] - 120, TROUP[1] + 90, 0, { id: 'trwalker' }); s('troup-dogs', 'props/animals/dog-dachshund', TROUP[0] - 36, TROUP[1] + 96, 0, { k: 0.9, leash: 'trwalker' });
        s('troup-dogs', 'props/animals/dog-sandwich-thief', TROUP[0] + 90, TROUP[1] + 110, 1, { k: 0.9 });
        return st;
      },
      zones: [
        { id: 'cemetery-paths', w: 10, path: true, pt: (r) => (r() < 0.5 ? [E + 1520 + r() * 40, 3340 + r() * 650] : [CEM[0] + 20 + r() * 1120, 3646 + r() * 28]) },
        sqWalk('troup-paths', ...TROUP), walkH('east', 3300, 3330, 6), walkH('east', 4120, 4248, 8), walkNS('east', 2780, 4560), gardenZone(E + 60, E + 690, 3340, 3980),
      ],
      blocked: (x, y) => y < 3296 || (y > 4270 && !inNSGap('east', x, y)) || onRoad('east', x, y) || inGardenFence(x, y, E + 60, E + 690, 3980) || inRect(x, y, [E + 1380, 3960, E + 1700, 4004]) || TOMBS.some(([tx, ty]) => inRect(x, y, [tx - 50, ty - 16, tx + 50, ty + 4])) || ((x - TROUP[0]) / 40) ** 2 + ((y - TROUP[1] - 20) / 18) ** 2 < 1,
      spots: [
        { id: 'colonial-park', x: E + 1540, y: 3660, r: 520, d: ['normal', 'hard'] },
        { id: 'ghost-tour', x: E + 1380, y: 4070, r: 80, d: ['hard'] },
        { id: 'troup-square', x: TROUP[0], y: TROUP[1], r: 220, d: ['easy', 'normal'] },
      ],
      area: (x, y) => (y < 3300 ? 'on Harris Street, east side' : y > 4030 ? 'on Charlton Street, by the cemetery gate' : x >= CEM[0] && x <= CEM[2] ? 'in Colonial Park Cemetery' : Math.abs(x - TROUP[0]) < TROUP[2] ? 'in Troup Square, by the armillary sphere' : 'by the gardens on Harris Street'),
    }),
  };

  // ---------- Jones Street band ----------
  const CALHOUN = [E + 1540, 4910, 450, 170], WHITEFIELD = [E + 2620, 4910, 300, 170];
  const jones = {
    west: () => part('west', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/monterey/jones-row-west', 0, 4560, 1, 0, { layer: 'far' });
        for (const [a, b] of [[60, 610], [790, 2010], [2190, 2900]]) garden(add, a, b, 4690, 4990);
        for (const c of NS.west) avenue(add, c, 4640, 5200);
        streetLife(add, 'west', 4560, 80, 'jones');
        add('props/street/bike-rack', 1140, 5180, 0.9);
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a lemonade stand by the pocket playground, with a queue
        s('lemonade', 'props/street/lemonade-stand', 1700, 5110); s('lemonade', B + 'child', 1680, 5120, 1); s('lemonade', B + 'child', 1730, 5124, 0);
        for (const [dx, a] of [[100, B + 'walk'], [140, B + 'coffee'], [180, C + 'jogger']]) s('lemonade', a, 1700 + dx, 5132, 1);
        // kids playing in the playground sand
        for (const [x, y, f] of [[1260, 5090, 0], [1330, 5120, 1], [1420, 5100, 0], [1500, 5136, 1]]) s('playground', B + 'child', x, y, f);
        s('playground', C + 'child-bubbles', 1380, 5148);
        return st;
      },
      zones: [walkH('west', 4646, 4676, 10), walkH('west', 5000, 5168, 8), walkNS('west', 4640, 5200), { id: 'pocket-playground', w: 4, path: false, pt: (r) => [1190 + r() * 400, 5046 + r() * 100] }, gardenZone(60, 610, 4690, 4990), gardenZone(790, 2010, 4690, 4990), gardenZone(2190, 2900, 4690, 4990)],
      blocked: (x, y) => y < 4644 || (y > 5180 && !inNSGap('west', x, y)) || onRoad('west', x, y) || [[60, 610], [790, 2010], [2190, 2900]].some(([a, b]) => inGardenFence(x, y, a, b, 4990)),
      spots: [
        { id: 'lemonade', x: 1760, y: 5120, r: 120, d: ['normal', 'hard'] },
        { id: 'jones-west', x: 1500, y: 4660, r: 1300, d: ['easy', 'normal'] },
        { id: 'playground', x: 1380, y: 5100, r: 140, d: ['easy'] },
      ],
      area: (x, y) => (y < 4700 ? 'on Jones Street, west side' : x > 1150 && x < 1850 && y > 5030 ? 'by the lemonade stand and the playground' : 'by the front gardens on Jones Street'),
    }),
    east: () => part('east', {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        add('environments/monterey/jones-row-east', E, 4560, 1, 0, { layer: 'far' });
        add('environments/wings/wesley-monumental', E + 380, 4985, 0.85);
        squareDress(add, ...CALHOUN, { oak: 0.55 });
        squareDress(add, ...WHITEFIELD, { oak: 0.5, noAzaleas: true });
        add('environments/wings/gazebo', WHITEFIELD[0], WHITEFIELD[1] + 40, 0.9);
        for (const c of NS.east) avenue(add, c, 4640, 5200);
        streetLife(add, 'east', 4560, 80, 'jones');
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        // a wedding in the Whitefield Square gazebo
        s('gazebo-wedding', C + 'bride', WHITEFIELD[0] - 24, 4940); s('gazebo-wedding', C + 'groom', WHITEFIELD[0] + 24, 4942, 1);
        for (const [dx, a, f] of [[-120, B + 'dress', 0], [-90, B + 'wave', 0], [110, B + 'coffee', 1], [140, C + 'tourist-photographer', 1]]) s('gazebo-wedding', a, WHITEFIELD[0] + dx, 4990, f);
        // a saxophonist on Calhoun Square and a reader on a bench
        s('calhoun-music', C + 'saxophonist', CALHOUN[0] + 80, 4930, 1); s('calhoun-music', 'props/furniture/tip-hat', CALHOUN[0] + 30, 4938, 0, { k: 0.9 });
        s('calhoun-reader', C + 'reader-seated', CALHOUN[0] - 200, 4855);
        return st;
      },
      zones: [walkH('east', 4646, 4676, 10), walkH('east', 5000, 5168, 8), walkNS('east', 4640, 5200), sqWalk('calhoun-paths', ...CALHOUN), sqWalk('whitefield-paths', ...WHITEFIELD, 6)],
      blocked: (x, y) => y < 4644 || (y > 5180 && !inNSGap('east', x, y)) || onRoad('east', x, y) || inRect(x, y, [E + 60, 4690, E + 700, 4990]) || inRect(x, y, [WHITEFIELD[0] - 110, 4900, WHITEFIELD[0] + 110, 4950]),
      spots: [
        { id: 'calhoun-square', x: CALHOUN[0], y: CALHOUN[1], r: 380, d: ['easy', 'normal'] },
        { id: 'gazebo-wedding', x: WHITEFIELD[0], y: 4980, r: 120, d: ['normal', 'hard'] },
        { id: 'jones-east', x: E + 1500, y: 4660, r: 1300, d: ['easy'] },
      ],
      area: (x, y) => (y < 4700 ? 'on Jones Street, east side' : Math.abs(x - CALHOUN[0]) < CALHOUN[2] + 40 ? 'in Calhoun Square' : Math.abs(x - WHITEFIELD[0]) < WHITEFIELD[2] + 40 ? 'in Whitefield Square, by the gazebo' : 'by Wesley Monumental Church'),
    }),
  };

  // ---------- Forsyth band: the Victorian District ----------
  const VSTREETS = [[5470, 72, 0], [6200, 70, 1], [6900, 70, 2], [7520, 70, 3]];
  const VBLOCKS = [[5542, 6200], [6270, 6900], [6970, 7520]];
  function victorian(side) {
    const a = x0(side), segs = side === 'west' ? [[40, 600], [800, 2000], [2200, 2830]] : [[150, 760], [940, 2150], [2340, 2920]];
    return part(side, {
      geography() {
        const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
        for (const [y, h, i] of VSTREETS) {
          const row = i < 3 ? `environments/victorian/row-${side}-${i}` : `environments/victorian/row-${side === 'west' ? 'east' : 'west'}-0`;
          add(row, i < 3 ? a : a + 2960, y, 1, i < 3 ? 0 : 1, { layer: 'far' });
          streetLife(add, side, y, h, ['gaston', 'hall', 'parkave', null][i]);
        }
        for (const [y0, y1] of VBLOCKS) for (const [s0, s1] of segs) garden(add, a + s0, a + s1, y0 + 20, Math.min(y1 - 280, y0 + 300));
        for (const c of nsOf(side, 5300)) { avenue(add, c, 5542, 6200); avenue(add, c, 6270, 6900); avenue(add, c, 6970, 7520); }
        return g;
      },
      stories() {
        const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
        if (side === 'west') {
          // a painter painting a pink Victorian; kids on bikes; a gardener at the azaleas
          s('house-painter', C + 'painter', 1100, 5884, 1); s('house-painter', 'props/furniture/easel-fountain-painting', 1040, 5886, 1, { k: 0.85 });
          s('bike-kids', C + 'cyclist', 1500, 6250, 0); s('bike-kids', C + 'cyclist', 1600, 6240, 0); s('bike-kids', B + 'wave', 1760, 6288, 1);
          s('azalea-garden', C + 'gardener', 2400, 6530); s('porch-wave', B + 'wave', 400, 6984, 0);
        } else {
          // a second lemonade stand with a dog in the queue; a jogger and a stroller; a mail-day chat
          s('lemonade-east', 'props/street/lemonade-stand', E + 1200, 6594); s('lemonade-east', B + 'child', E + 1180, 6604, 1); s('lemonade-east', 'props/animals/dog-dachshund', E + 1300, 6610, 1, { k: 0.9 });
          s('neighbours', B + 'coffee', E + 2500, 5884, 0); s('neighbours', B + 'books', E + 2550, 5886, 1); s('neighbours', B + 'umbrella', E + 2600, 5892, 1);
          s('stroll', C + 'parent-stroller', E + 600, 6984, 0);
        }
        return st;
      },
      zones: [
        walkH(side, 5548, 5564, 10), walkH(side, 6276, 6292, 8), walkH(side, 6976, 6992, 8), walkH(side, 7594, 7598, 2),
        walkH(side, 5852, 5912, 6), walkH(side, 6580, 6612, 6), walkNS(side, 5542, 7520),
        ...VBLOCKS.flatMap(([y0, y1]) => segs.map(([s0, s1]) => gardenZone(a + s0, a + s1, y0 + 20, Math.min(y1 - 280, y0 + 300)))),
      ],
      blocked: (x, y) => y < 5546 || onRoad(side, x, y)
        || (!inNSGap(side, x, y) && ((y > 5920 && y < 6202) || (y > 6620 && y < 6902) || (y > 7240 && y < 7522)))
        || VBLOCKS.some(([y0, y1]) => segs.some(([s0, s1]) => inGardenFence(x, y, a + s0, a + s1, Math.min(y1 - 280, y0 + 300)))),
      spots: side === 'west'
        ? [{ id: 'victorian-west', x: 1500, y: 6600, r: 1300, d: ['easy', 'normal'] }, { id: 'bike-kids', x: 1600, y: 6260, r: 120, d: ['hard', 'normal'] }, { id: 'whitaker-street', x: 2905, y: 6400, r: 400, d: ['easy'] }]
        : [{ id: 'victorian-east', x: E + 1500, y: 6600, r: 1300, d: ['easy', 'normal'] }, { id: 'lemonade-east', x: E + 1260, y: 6600, r: 100, d: ['hard', 'normal'] }, { id: 'drayton-street', x: E + 75, y: 6400, r: 400, d: ['easy'] }],
      area: (x, y) => (y < 5546 ? 'on Gaston Street, ' + (side === 'west' ? 'west' : 'east') + ' of Forsyth Park' : (side === 'west' && x > 2780) || (side === 'east' && x < E + 200) ? 'on ' + (side === 'west' ? 'Whitaker' : 'Drayton') + ' Street, beside Forsyth Park' : 'in the Victorian District, ' + (side === 'west' ? 'west' : 'east') + ' of Forsyth Park'),
    });
  }
  const forsyth = { west: () => victorian('west'), east: () => victorian('east') };

  WS.wings = { riverfront: river, market, squares, monterey: jones, forsyth, E, NS };
})();
