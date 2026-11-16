/* Jones Street and Monterey Square (Agent 2): world y 4300-5200, the last blocks of Bull Street before
   Forsyth Park. The Jones Street row (Victorian, Italianate and Second Empire houses, with SCAD's Poetter Hall
   at the Bull Street corner), then Monterey Square on Bull with the Pulaski Monument, Mercer House on its
   west side and Temple Mickve Israel on its east. Distances are compressed; the order matches the real city.
   Mirrors tools/author/savannah-ground.mjs. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const ST = () => WS.streets;
  const Y0 = 4300, H = 900;
  const SQ = { cx: 1600, cy: 4910, hw: 450, hh: 170 };       // the square's lawn; a paved ring road surrounds it
  const RING = [1080, 4680, 2120, 5140];
  function geography() {
    const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/monterey/jones-row', 0, 4560, 1, 0, { layer: 'far' });
    ST().street(add, 4560, 80, { parked: [200, 470, 760, 1020, 1300, 1960, 2240, 2520, 2800, 3060] });
    ST().corner(add, 'jones', 4660); ST().bull(add, 4110, 4560, { noTrees: true });
    // Monterey Square
    add('props/landmarks/pulaski-monument', SQ.cx, SQ.cy + 40, 0.82);
    const OAK = ['props/vegetation/live-oak', 'props/vegetation/live-oak-tall', 'props/vegetation/live-oak-lean'];
    [[-360, -100], [360, -100], [-360, 150], [360, 150]].forEach(([dx, dy], i) => add(OAK[i % 3], SQ.cx + dx, SQ.cy + dy, 0.6, i % 2));
    for (const [dx, dy] of [[-200, -60], [200, -60], [-200, 70], [200, 70]]) add('props/furniture/park-bench', SQ.cx + dx, SQ.cy + dy, 0.85);
    for (const dx of [-150, 150]) add('props/furniture/lamp-post', SQ.cx + dx, SQ.cy - 40, 0.9);
    for (const dx of [-260, 260]) add('props/vegetation/azalea-bush', SQ.cx + dx, SQ.cy + 6, 0.85, dx > 0 ? 1 : 0);
    // the houses facing the square, behind their front gardens
    add('environments/monterey/mercer-house', 560, 4930, 1);
    add('environments/monterey/temple', 2640, 4930, 1);
    for (const x of [180, 980, 2230, 3020]) add('props/vegetation/live-oak-tall', x, 4980, 0.6, x > 1600 ? 1 : 0);
    for (const x of [130, 300, 840, 1000, 2200, 2400, 2880, 3070]) add('props/vegetation/azalea-bush', x, 4986, 0.8, x % 2);
    for (const x of [140, 560, 980, 2240, 2640, 3060]) add('props/furniture/lamp-post', x, 5010, 0.92);
    add('props/street/bike-rack', 860, 5020, 0.9); add('props/street/bin', 1060, 5014, 0.9);
    // traffic round the square, and Bull Street's last block to the Forsyth gate
    add('props/vehicles/car', 1250, 4718, 0.7, 0, { tint: { car: '#2F7FA8', car2: '#F5F0E6' }, parked: true });
    add('props/vehicles/car-small', 1950, 5136, 0.7, 1, { tint: { car: '#F2D55C', car2: '#F5F0E6' }, parked: true });
    add('props/vehicles/carriage', 1350, 5130, 0.9, 1);
    ST().corner(add, 'gordon', 5180);
    return g;
  }
  function stories() {
    const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
    // SCAD students hauling an enormous sculpture out of Poetter Hall toward Bull Street
    s('scad-sculpture', 'props/street/sculpture-haul', 1830, 4692);
    s('scad-sculpture', C + 'scad-student-portfolio', 1960, 4700, 1); s('scad-sculpture', B + 'books', 2010, 4690);
    // a ghost-tour guide at the Mercer House gate with a group listening
    s('mercer-tour', C + 'historian', 760, 5040, 1); for (const [x, f] of [[690, 0], [830, 1], [870, 1], [650, 0]]) s('mercer-tour', [B + 'walk', C + 'tourist-photographer', B + 'dress', B + 'umbrella'][x % 4], x, 5070 + (x % 3) * 6, f);
    // tourists photographing the monument
    s('monument-photo', C + 'tourist-photographer', 1690, 5010, 1); for (const [x, f] of [[1560, 0], [1600, 1], [1640, 0]]) s('monument-photo', [B + 'wave', B + 'dress', B + 'walk'][x % 3], x, 4990, f);
    // a painter at an easel on the square, and a reader on a bench
    s('square-easel', C + 'painter', 1360, 4870); s('square-easel', 'props/furniture/easel-fountain-painting', 1412, 4872, 0, { k: 0.85 });
    s('square-reader', C + 'reader-seated', 1800, 4855, 1);
    return st;
  }
  const ZONES = [
    { id: 'jones-walk', w: 12, path: true, pt: (r) => [40 + r() * 3120, 4646 + r() * 28] },
    { id: 'monterey-paths', w: 10, path: true, pt: (r) => (r() < 0.5 ? [SQ.cx - 420 + r() * 840, SQ.cy - 16 + r() * 32] : [SQ.cx - 16 + r() * 32, SQ.cy - 150 + r() * 300]) },
    { id: 'monterey-sidewalks', w: 10, path: true, pt: (r) => [40 + r() * 3120, 5020 + r() * 160] },
    ST().bullWalk(4110, 4560),
  ];
  const inRing = (x, y) => x > RING[0] && x < RING[2] && y > RING[1] && y < RING[3] && !(Math.abs(x - SQ.cx) < SQ.hw && Math.abs(y - SQ.cy) < SQ.hh);
  const blocked = (x, y) => y < 4644 || (y > 4556 && y < 4644) || inRing(x, y) || ST().onBullRoad(x, y, 4110, 4680) || ST().onBullRoad(x, y, 5140, 5200)
    || (y > 4688 && y < 4990 && (x < 1070 || x > 2130))                          // the houses' front gardens and fences
    || ((x - SQ.cx) / 54) ** 2 + ((y - SQ.cy - 40) / 22) ** 2 < 1;
  const SPOTS = [
    { id: 'monterey-square', x: SQ.cx, y: SQ.cy, r: 380, d: ['easy', 'normal'] },
    { id: 'jones-street', x: 1600, y: 4660, r: 1300, d: ['easy', 'normal'] },
    { id: 'mercer-tour', x: 760, y: 5060, r: 120, d: ['hard', 'normal'] },
    { id: 'monument-crowd', x: 1620, y: 5000, r: 90, d: ['hard'] },
    { id: 'monterey-sidewalk', x: 1600, y: 5100, r: 1300, d: ['easy'] },
  ];
  function area(x, y) {
    if (y < Y0 || y >= Y0 + H) return null;
    if (y < 4560) return x > 1500 && x < 1700 ? 'on Bull Street by Poetter Hall' : 'below the Jones Street houses';
    if (y < 4690) return 'on Jones Street';
    if (Math.abs(x - SQ.cx) < SQ.hw + 60 && y < 5140) return 'in Monterey Square';
    if (y > 5000) return 'on the sidewalk south of Monterey Square';
    return x < 1600 ? 'by Mercer House' : 'by the temple on Monterey Square';
  }
  WS.districts = Object.assign(WS.districts || {}, { monterey: () => ({ id: 'monterey', name: 'Jones Street & Monterey Square', y0: Y0, h: H, geography, stories, zones: ZONES, blocked, spots: SPOTS, area }) });
})();
