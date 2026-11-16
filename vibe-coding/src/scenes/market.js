/* Bay Street to City Market (Agent 2): world y 1500-2950. Shopfront row with the City Market gate,
   a brick plaza with stalls, café tables, planters and street performers, then Congress Street. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const STALLS = [[500, 2060], [700, 2060], [900, 2060], [2300, 2060], [2500, 2060], [2700, 2060], [1100, 2520], [2100, 2520], [400, 2560], [2800, 2560]];
  const TENTS = [[700, 2250], [900, 2250], [2300, 2250], [2500, 2250]];
  const TABLES = [[1350, 2160], [1520, 2180], [1700, 2160], [1860, 2180], [1440, 2320], [1780, 2330]];
  function geography() {
    const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/market/market-row', 0, 1830, 1, 0, { layer: 'far' });
    const kinds = ['peaches', 'flowers', 'honey'], awn = ['#E07A3F', '#2F7FA8', '#3E8E7E', '#7D5BA6', '#E8457A', '#2F5D50'];
    STALLS.forEach(([x, y], i) => add('props/market/stall-' + kinds[i % 3], x, y, 1.05, 0, { tint: { awn: awn[i % 6], awn2: '#F5F0E6', cloth: ['#F2D55C', '#F5F0E6', '#F4A3B5'][i % 3] } }));
    const tc = ['#C73E3A', '#2F7FA8', '#3E8E7E', '#E07A3F'];
    TENTS.forEach(([x, y], i) => add('props/festival/tent', x, y, 1, i % 2, { tint: { tent: tc[i], tent2: '#F5F0E6', cloth: ['#F4A3B5', '#F2D55C', '#9EC3B5', '#F5F0E6'][i] } }));
    for (const x of [1300, 1900]) add('props/vegetation/azalea-bush', x, 2600, 0.9, x > 1600 ? 1 : 0);
    TABLES.forEach(([x, y], i) => add('props/furniture/cafe-table', x, y, 0.9, i % 2, { tint: { umb: ['#2F5D50', '#C73E3A', '#2F7FA8', '#E8C872', '#7D5BA6', '#E07A3F'][i], umb2: '#F5F0E6' } }));
    for (const x of [500, 1100, 2100, 2700]) { add('props/vegetation/azalea-bush', x - 40, 2386, 0.85); add('props/vegetation/azalea-bush', x + 40, 2392, 0.85, 1); add('props/vegetation/palmetto', x, 2372, 0.7); }
    for (let x = 200; x < 3200; x += 400) add('props/furniture/lamp-post', x, 1850, 0.95);
    add('props/vehicles/carriage', 900, 2770, 0.95); add('props/vehicles/trolley', 2300, 2776, 0.95);
    add('props/vegetation/live-oak-tall', 150, 2920, 0.8); add('props/vegetation/live-oak', 3060, 2930, 0.8, 1);
    return g;
  }
  function stories() {
    const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
    s('market-painter', C + 'painter', 1200, 1960); s('market-painter', 'props/furniture/easel-fountain-painting', 1258, 1962, 0, { k: 0.85 });
    s('market-busker', C + 'saxophonist', 2000, 1960, 1); s('market-busker', 'props/furniture/tip-hat', 1950, 1968, 0, { k: 0.9 });
    for (const [x, f] of [[1900, 0], [1940, 1], [2060, 1]]) s('market-busker', B + 'coffee', x, 1990, f);
    s('market-dance', C + 'dancer', 1600, 2470); s('market-dance', B + 'phone', 1660, 2480, 1); s('market-dance', B + 'child', 1550, 2490);
    for (const [x, y, both] of TABLES.map(([x, y], i) => [x, y, i % 2])) { s('market-cafe', B + 'seated', x - 24, y + 3); if (both) s('market-cafe', B + 'seated', x + 26, y + 4, 1); }
    s('market-chess', C + 'chess-players', 2700, 2300); s('market-chess', B + 'cane', 2760, 2270, 1);
    s('carriage-ride', C + 'bride', 960, 2800); s('carriage-ride', C + 'groom', 1010, 2802, 1);
    for (const [i, [x, y]] of STALLS.entries()) s('market-vendors', [B + 'coffee', B + 'dress', B + 'walk'][i % 3], x + 20, y - 14, i % 2);
    // shoppers at the tents, a flower buyer with a toddler, a juggler drawing kids, students sketching
    for (const [i, [x, y]] of TENTS.entries()) for (const [dx, a, f] of [[-40, B + 'tote', 0], [10, B + 'dress', 1], [50, [B + 'coffee', B + 'phone', B + 'cane', B + 'walk'][i], 1]]) s('market-tents', a, x + dx, y + 30, f);
    s('market-juggler', C + 'juggler', 1600, 2620); for (const [x, y, f] of [[1550, 2650, 0], [1650, 2655, 1], [1600, 2668, 0], [1520, 2620, 0]]) s('market-juggler', B + 'child', x, y, f);
    s('market-sketch', C + 'scad-student-portfolio', 1250, 2440); s('market-sketch', C + 'scad-student-portfolio', 1300, 2450, 1); s('market-sketch', C + 'painter', 1960, 2440, 1);
    s('market-balloon', C + 'kid-balloon', 2380, 2400); s('market-balloon', C + 'parent-stroller', 2300, 2410);
    s('market-pigeons', C + 'elder-pigeon-feeder', 820, 2440); for (const [x, y, f] of [[880, 2448, 0], [900, 2462, 1], [860, 2470, 1]]) s('market-pigeons', 'props/animals/pigeon', x, y, f, { k: 0.9 });
    return st;
  }
  const ZONES = [
    { id: 'market-plaza', w: 46, path: false, pt: (r) => [80 + r() * 3040, 1880 + r() * 780] },
    { id: 'market-front', w: 10, path: true, pt: (r) => [40 + r() * 3120, 1840 + r() * 34] },
    { id: 'congress-walk', w: 8, path: true, pt: (r) => [40 + r() * 3120, 2790 + r() * 150] },
  ];
  const blocked = (x, y) => y < 1836 || (y > 2696 && y < 2786) || STALLS.some(([sx, sy]) => inRect(x, y, [sx - 62, sy - 26, sx + 62, sy + 4])) || TENTS.some(([tx, ty]) => inRect(x, y, [tx - 66, ty - 10, tx + 66, ty + 2])) || TABLES.some(([tx, ty]) => inRect(x, y, [tx - 40, ty - 12, tx + 40, ty + 6])) || [500, 1100, 2100, 2700].some((px) => ((x - px) / 92) ** 2 + ((y - 2380) / 38) ** 2 < 1);
  const SPOTS = [
    { id: 'market-gate', x: 1600, y: 1900, r: 160, d: ['easy', 'normal'] },
    { id: 'market-stalls', x: 800, y: 2090, r: 200, d: ['normal', 'hard'] },
    { id: 'market-tents', x: 1600, y: 2280, r: 900, d: ['hard', 'normal'] },
    { id: 'market-cafe-tables', x: 1600, y: 2260, r: 260, d: ['hard'] },
    { id: 'busker-ring', x: 1980, y: 1990, r: 80, d: ['normal'] },
    { id: 'congress-street', x: 1600, y: 2860, r: 1200, d: ['easy'] },
  ];
  function area(x, y) {
    if (y < 1500 || y >= 2950) return null;
    if (y < 1880) return 'along the City Market shopfronts';
    if (y > 2690) return 'on Congress Street below the market';
    return 'in the City Market plaza';
  }
  WS.districts = Object.assign(WS.districts || {}, { market: () => ({ id: 'market', name: 'City Market', y0: 1500, h: 1450, geography, stories, zones: ZONES, blocked, spots: SPOTS, area }) });
})();
