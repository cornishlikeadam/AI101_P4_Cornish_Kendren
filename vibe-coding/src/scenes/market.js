/* Bay Street to Congress Street (Agent 2): world y 1500-2950. As in the real city, City Market lies west of
   Bull Street (its brick plaza, stalls, café tables and street performers) and Johnson Square lies east of it,
   with the Greene Monument obelisk at its centre. Congress Street closes the block at y 2700-2780.
   Mirrors tools/author/savannah-ground.mjs. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const ST = () => WS.streets;
  const JS = { cx: 2450, cy: 2265, hw: 650, hh: 385 };          // Johnson Square lawn
  const STALLS = [[200, 2060], [400, 2060], [600, 2060], [940, 2060], [1140, 2060], [1340, 2060], [300, 2590], [700, 2590], [1100, 2590], [1400, 2590]];
  const TENTS = [[300, 2280], [540, 2280], [1180, 2280], [1410, 2280]];
  const TABLES = [[760, 2220], [920, 2240], [1060, 2220], [720, 2400], [890, 2420], [1060, 2400]];
  const PLANTERS = [380, 1300];
  function geography() {
    const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/market/market-row', 0, 1830, 1, 0, { layer: 'far' });
    const kinds = ['peaches', 'flowers', 'honey'], awn = ['#E07A3F', '#2F7FA8', '#3E8E7E', '#7D5BA6', '#E8457A', '#2F5D50'];
    STALLS.forEach(([x, y], i) => add('props/market/stall-' + kinds[i % 3], x, y, 1.05, 0, { tint: { awn: awn[i % 6], awn2: '#F5F0E6', cloth: ['#F2D55C', '#F5F0E6', '#F4A3B5'][i % 3] } }));
    const tc = ['#C73E3A', '#2F7FA8', '#3E8E7E', '#E07A3F'];
    TENTS.forEach(([x, y], i) => add('props/festival/tent', x, y, 1, i % 2, { tint: { tent: tc[i], tent2: '#F5F0E6', cloth: ['#F4A3B5', '#F2D55C', '#9EC3B5', '#F5F0E6'][i] } }));
    TABLES.forEach(([x, y], i) => add('props/furniture/cafe-table', x, y, 0.9, i % 2, { tint: { umb: ['#2F5D50', '#C73E3A', '#2F7FA8', '#E8C872', '#7D5BA6', '#E07A3F'][i], umb2: '#F5F0E6' } }));
    for (const x of PLANTERS) { add('props/vegetation/azalea-bush', x - 40, 2446, 0.85); add('props/vegetation/azalea-bush', x + 40, 2452, 0.85, 1); add('props/vegetation/palmetto', x, 2432, 0.7); }
    for (let x = 200; x < 1500; x += 400) add('props/furniture/lamp-post', x, 1850, 0.95);
    add('props/street/bike-rack', 1440, 1870, 0.9);
    // Johnson Square: oaks at the corners, benches along the paths, the obelisk in the middle
    const OAK = ['props/vegetation/live-oak', 'props/vegetation/live-oak-tall', 'props/vegetation/live-oak-lean'];
    [[-480, -230], [480, -230], [-480, 280], [480, 280], [-180, 300], [200, -250]].forEach(([dx, dy], i) => add(OAK[i % 3], JS.cx + dx, JS.cy + dy, 0.66, i % 2));
    add('props/landmarks/obelisk', JS.cx, JS.cy + 30, 0.95);
    for (const [dx, dy] of [[-300, -40], [300, -40], [-300, 70], [300, 70], [-120, 220], [120, 220]]) add('props/furniture/park-bench', JS.cx + dx, JS.cy + dy, 0.85);
    for (const dx of [-230, 230]) add('props/furniture/lamp-post', JS.cx + dx, JS.cy - 80, 0.9);
    for (const [dx, dy] of [[-520, 40], [520, 40]]) add('props/vegetation/azalea-bush', JS.cx + dx, JS.cy + dy, 0.9);
    for (let x = 1760; x < 3200; x += 360) add('props/furniture/lamp-post', x, 1850, 0.95);
    add('props/street/bus-stop', 2000, 1872, 0.85);
    // Bull Street, Bay and Congress corners, Congress Street traffic
    ST().bull(add, 1480, 2700);
    ST().corner(add, 'bay', 1520); ST().corner(add, 'congress', 2800);
    ST().street(add, 2700, 80, { parked: [260, 520, 900, 1280, 1980, 2340, 2760, 3020] });
    add('props/vehicles/carriage', 1100, 2750, 0.95, 1, { drive: 26 }); add('props/vehicles/trolley', 2600, 2774, 0.95, 0, { drive: 32 });
    add('props/vegetation/live-oak-tall', 150, 2920, 0.8); add('props/vegetation/live-oak', 3060, 2930, 0.8, 1);
    return g;
  }
  function stories() {
    const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
    s('market-painter', C + 'painter', 1200, 1960); s('market-painter', 'props/furniture/easel-fountain-painting', 1258, 1962, 0, { k: 0.85 });
    s('market-busker', C + 'saxophonist', 2450, 2150, 1); s('market-busker', 'props/furniture/tip-hat', 2400, 2158, 0, { k: 0.9 });
    for (const [x, f] of [[2350, 0], [2390, 1], [2510, 1], [2540, 0]]) s('market-busker', B + 'coffee', x, 2182, f);
    s('market-dance', C + 'dancer', 600, 2480); s('market-dance', B + 'phone', 660, 2490, 1); s('market-dance', B + 'child', 550, 2500);
    for (const [x, y, both] of TABLES.map(([x, y], i) => [x, y, i % 2])) { s('market-cafe', B + 'seated', x - 24, y + 3); if (both) s('market-cafe', B + 'seated', x + 26, y + 4, 1); }
    s('market-chess', C + 'chess-players', 2820, 2420); s('market-chess', B + 'cane', 2880, 2392, 1);
    s('carriage-ride', C + 'bride', 960, 2800); s('carriage-ride', C + 'groom', 1010, 2802, 1);
    for (const [i, [x, y]] of STALLS.entries()) s('market-vendors', [B + 'coffee', B + 'dress', B + 'walk'][i % 3], x + 20, y - 14, i % 2);
    for (const [i, [x, y]] of TENTS.entries()) for (const [dx, a, f] of [[-40, B + 'tote', 0], [10, B + 'dress', 1], [50, [B + 'coffee', B + 'phone', B + 'cane', B + 'walk'][i], 1]]) s('market-tents', a, x + dx, y + 30, f);
    s('market-juggler', C + 'juggler', 950, 2560); for (const [x, y, f] of [[900, 2590, 0], [1000, 2595, 1], [950, 2608, 0], [870, 2560, 0]]) s('market-juggler', B + 'child', x, y, f);
    s('market-sketch', C + 'scad-student-portfolio', 2150, 2380); s('market-sketch', C + 'scad-student-portfolio', 2200, 2390, 1); s('market-sketch', C + 'painter', 2060, 2370, 1);
    s('market-balloon', C + 'kid-balloon', 2700, 2040); s('market-balloon', C + 'parent-stroller', 2620, 2050);
    s('market-pigeons', C + 'elder-pigeon-feeder', 2300, 2320); for (const [x, y, f] of [[2360, 2328, 0], [2380, 2342, 1], [2340, 2350, 1]]) s('market-pigeons', 'props/animals/pigeon', x, y, f, { k: 0.9 });
    s('johnson-tour', C + 'tour-guide', 2200, 2230); for (const [x, y, f] of [[2140, 2250, 0], [2170, 2268, 1], [2120, 2276, 0], [2240, 2262, 1]]) s('johnson-tour', [B + 'walk', C + 'tourist-photographer', B + 'dress', B + 'phone'][x % 4], x, y, f);
    return st;
  }
  const ZONES = [
    { id: 'market-plaza', w: 30, path: false, pt: (r) => [80 + r() * 1400, 1880 + r() * 780] },
    { id: 'johnson-paths', w: 14, path: true, pt: (r) => (r() < 0.5 ? [JS.cx - 600 + r() * 1200, JS.cy - 20 + r() * 40] : [JS.cx - 20 + r() * 40, JS.cy - 360 + r() * 720]) },
    { id: 'johnson-lawn', w: 8, path: false, pt: (r) => [JS.cx - 620 + r() * 1240, JS.cy - 360 + r() * 720] },
    { id: 'market-front', w: 10, path: true, pt: (r) => [40 + r() * 3120, 1840 + r() * 34] },
    { id: 'congress-walk', w: 8, path: true, pt: (r) => [40 + r() * 3120, 2790 + r() * 150] },
    ST().bullWalk(1480, 2700),
  ];
  const blocked = (x, y) => y < 1836 || (y > 2696 && y < 2786) || ST().onBullRoad(x, y, 1480, 2700)
    || STALLS.some(([sx, sy]) => inRect(x, y, [sx - 62, sy - 26, sx + 62, sy + 4])) || TENTS.some(([tx, ty]) => inRect(x, y, [tx - 66, ty - 10, tx + 66, ty + 2]))
    || TABLES.some(([tx, ty]) => inRect(x, y, [tx - 40, ty - 12, tx + 40, ty + 6])) || PLANTERS.some((px) => ((x - px) / 92) ** 2 + ((y - 2440) / 38) ** 2 < 1)
    || ((x - JS.cx) / 60) ** 2 + ((y - JS.cy - 30) / 26) ** 2 < 1;
  const SPOTS = [
    { id: 'market-gate', x: 760, y: 1900, r: 160, d: ['easy', 'normal'] },
    { id: 'market-stalls', x: 600, y: 2090, r: 200, d: ['normal', 'hard'] },
    { id: 'market-tents', x: 900, y: 2300, r: 500, d: ['hard', 'normal'] },
    { id: 'market-cafe-tables', x: 900, y: 2320, r: 200, d: ['hard'] },
    { id: 'busker-ring', x: 2450, y: 2180, r: 90, d: ['normal'] },
    { id: 'johnson-square', x: 2450, y: 2265, r: 520, d: ['easy', 'normal'] },
    { id: 'johnson-tour', x: 2180, y: 2260, r: 70, d: ['hard'] },
    { id: 'congress-street', x: 1600, y: 2860, r: 1200, d: ['easy'] },
  ];
  function area(x, y) {
    if (y < 1500 || y >= 2950) return null;
    if (y < 1880) return x < 1600 ? 'along the City Market shopfronts' : 'on the Bay Street side of Johnson Square';
    if (y > 2690) return 'on Congress Street';
    if (x > 1500 && x < 1700) return 'on Bull Street, between City Market and Johnson Square';
    return x < 1600 ? 'in the City Market plaza' : 'in Johnson Square, by the Greene Monument';
  }
  WS.districts = Object.assign(WS.districts || {}, { market: () => ({ id: 'market', name: 'City Market & Johnson Square', y0: 1500, h: 1450, geography, stories, zones: ZONES, blocked, spots: SPOTS, area }) });
})();
