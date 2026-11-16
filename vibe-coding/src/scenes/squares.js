/* Harris Street (Agent 2): world y 2950-4300. Bull Street runs between Pulaski Square (west, live oaks and
   benches) and Lafayette Square (east, its fountain, with the twin-spired cathedral on the Harris Street row).
   Both are real squares on the Harris-Charlton row; the space between them is simplified. Charlton Street
   closes the block at y 4040-4110. Mirrors tools/author/savannah-ground.mjs. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const SQ = [[900, 3655], [2300, 3655]];
  const ST = () => WS.streets;
  function geography() {
    const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/squares/row-houses', 0, 3220, 1, 0, { layer: 'far' });
    // Pulaski Square has no monument: a ring of benches and azaleas round a lamp
    for (const [dx, dy] of [[-90, -40], [90, -40], [-90, 40], [90, 40]]) add('props/vegetation/azalea-bush', 900 + dx, 3655 + dy, 0.8, dx > 0 ? 1 : 0);
    add('props/furniture/lamp-post', 900, 3672, 0.95);
    add('environments/forsyth/fountain', 2300, 3700, 0.5);
    const OAK = ['props/vegetation/live-oak', 'props/vegetation/live-oak-tall', 'props/vegetation/live-oak-lean'];
    SQ.forEach(([cx, cy], q) => {
      [[-400, -200], [400, -200], [-400, 260], [400, 260]].forEach(([dx, dy], i) => add(OAK[(i + q) % 3], cx + dx, cy + dy, 0.62, (i + q) % 2));
      for (const [dx, dy] of [[-150, -100], [150, -100], [-150, 110], [150, 110]]) add('props/furniture/park-bench', cx + dx, cy + dy, 0.85);
      for (const [dx, dy] of [[-260, -10], [260, -10]]) add('props/vegetation/azalea-bush', cx + dx, cy + dy, 0.9, dx > 0 ? 1 : 0);
      for (const dx of [-220, 220]) add('props/furniture/lamp-post', cx + dx, cy - 60, 0.9);
    });
    ST().bull(add, 2780, 3220); ST().bull(add, 3290, 4040, { noTrees: true }); ST().bull(add, 4110, 4300);
    ST().corner(add, 'harris', 3310); ST().corner(add, 'charlton', 4130);
    ST().street(add, 3220, 70, { parked: [220, 480, 760, 1040, 1300, 1900, 2160, 2700, 2960] });
    ST().street(add, 4040, 70, { parked: [300, 620, 980, 1240, 1980, 2380, 2620, 2900] });
    add('props/vehicles/trolley', 2400, 3286, 0.95, 0, { drive: 30 }); add('props/vehicles/carriage', 400, 4096, 0.95, 0, { drive: 24 });
    add('props/street/bus-stop', 2600, 4140, 0.85); add('props/street/bike-rack', 1300, 4136, 0.9);
    return g;
  }
  function stories() {
    const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
    s('square-tour', C + 'historian', 760, 3700); for (const [x, y, f] of [[700, 3740, 0], [820, 3750, 1], [660, 3700, 0], [860, 3720, 1]]) s('square-tour', [B + 'walk', B + 'dress', C + 'tourist-photographer', B + 'tote'][x % 4], x, y, f);
    s('square-reader', C + 'reader-seated', 2150, 3555); s('square-reader', C + 'reader-seated', 2450, 3765, 1);
    s('square-painter', C + 'sculptor', 2560, 3500); s('square-wedding', C + 'bride', 2240, 3770); s('square-wedding', C + 'groom', 2290, 3772, 1); s('square-wedding', C + 'tourist-photographer', 2380, 3830, 1);
    s('square-dog', C + 'dog-walker', 1100, 3900, 0, { id: 'sqwalker' }); s('square-dog', 'props/animals/dog-dachshund', 1184, 3906, 0, { k: 0.9, leash: 'sqwalker' });
    s('square-gardener', C + 'gardener', 640, 3610); s('square-rake', C + 'maintenance-worker', 2000, 3900);
    return st;
  }
  const ZONES = [
    { id: 'square-paths', w: 20, path: true, pt: (r) => { const [cx, cy] = SQ[r() < 0.5 ? 0 : 1]; return r() < 0.5 ? [cx - 500 + r() * 1000, cy - 20 + r() * 40] : [cx - 20 + r() * 40, cy - 310 + r() * 620]; } },
    { id: 'square-lawns', w: 14, path: false, pt: (r) => { const [cx, cy] = SQ[r() < 0.5 ? 0 : 1]; return [cx - 500 + r() * 1000, cy - 300 + r() * 600]; } },
    { id: 'square-sidewalks', w: 10, path: true, pt: (r) => [40 + r() * 3120, r() < 0.5 ? 3300 + r() * 26 : 4120 + r() * 160] },
    ST().bullWalk(3290, 4040),
  ];
  const blocked = (x, y) => y < 3296 || (y > 4036 && y < 4116) || ST().onBullRoad(x, y, 3290, 4300) || ((x - 900) / 110) ** 2 + ((y - 3655) / 50) ** 2 < 1 || ((x - 2300) / 150) ** 2 + ((y - 3650) / 60) ** 2 < 1;
  const SPOTS = [
    { id: 'square-west-paths', x: 900, y: 3655, r: 420, d: ['easy', 'normal'] },
    { id: 'square-east-oaks', x: 2300, y: 3655, r: 480, d: ['hard', 'normal'] },
    { id: 'square-tour-group', x: 760, y: 3720, r: 90, d: ['hard'] },
    { id: 'square-sidewalk', x: 1600, y: 4200, r: 1300, d: ['easy'] },
  ];
  function area(x, y) {
    if (y < 2950 || y >= 4300) return null;
    if (y < 3300) return 'on Harris Street, below the cathedral';
    if (y > 4030) return 'on Charlton Street';
    if (x > 1500 && x < 1700) return 'on Bull Street, between the squares';
    return x < 1600 ? 'in Pulaski Square' : 'in Lafayette Square, by the fountain';
  }
  WS.districts = Object.assign(WS.districts || {}, { squares: () => ({ id: 'squares', name: 'Pulaski & Lafayette Squares', y0: 2950, h: 1350, geography, stories, zones: ZONES, blocked, spots: SPOTS, area }) });
})();
