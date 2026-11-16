/* Two Oglethorpe squares (Agent 2): world y 2950-4300. Townhouse rows, an obelisk square and a fountain
   square, with oaks, benches and tour traffic. Mirrors tools/author/savannah-ground.mjs. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const SQ = [[900, 3655], [2300, 3655]];
  function geography() {
    const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/squares/row-houses', 0, 3220, 1, 0, { layer: 'far' });
    add('props/landmarks/obelisk', 900, 3690, 0.95);
    add('environments/forsyth/fountain', 2300, 3700, 0.5);
    const OAK = ['props/vegetation/live-oak', 'props/vegetation/live-oak-tall', 'props/vegetation/live-oak-lean'];
    SQ.forEach(([cx, cy], q) => {
      [[-400, -200], [400, -200], [-400, 260], [400, 260]].forEach(([dx, dy], i) => add(OAK[(i + q) % 3], cx + dx, cy + dy, 0.62, (i + q) % 2));
      for (const [dx, dy] of [[-150, -100], [150, -100], [-150, 110], [150, 110]]) add('props/furniture/park-bench', cx + dx, cy + dy, 0.85);
      for (const [dx, dy] of [[-260, -10], [260, -10]]) add('props/vegetation/azalea-bush', cx + dx, cy + dy, 0.9, dx > 0 ? 1 : 0);
      for (const dx of [-220, 220]) add('props/furniture/lamp-post', cx + dx, cy - 60, 0.9);
    });
    add('props/vehicles/trolley', 1600, 3276, 0.95); add('props/vehicles/carriage', 400, 4096, 0.95, 1);
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
    { id: 'between-squares', w: 6, path: true, pt: (r) => [1440 + r() * 320, 3320 + r() * 700] },
  ];
  const blocked = (x, y) => y < 3296 || (y > 4036 && y < 4116) || ((x - 900) / 40) ** 2 + ((y - 3680) / 26) ** 2 < 1 || ((x - 2300) / 150) ** 2 + ((y - 3650) / 60) ** 2 < 1;
  const SPOTS = [
    { id: 'square-west-paths', x: 900, y: 3655, r: 420, d: ['easy', 'normal'] },
    { id: 'square-east-oaks', x: 2300, y: 3655, r: 480, d: ['hard', 'normal'] },
    { id: 'square-tour-group', x: 760, y: 3720, r: 90, d: ['hard'] },
    { id: 'square-sidewalk', x: 1600, y: 4200, r: 1300, d: ['easy'] },
  ];
  function area(x, y) {
    if (y < 2950 || y >= 4300) return null;
    if (y < 3300) return 'on the street below the squares\' townhouses';
    if (y > 4030) return 'on the street between the squares and Forsyth Park';
    return x < 1600 ? 'in the obelisk square' : 'in the fountain square';
  }
  WS.districts = Object.assign(WS.districts || {}, { squares: () => ({ id: 'squares', name: 'The squares', y0: 2950, h: 1350, geography, stories, zones: ZONES, blocked, spots: SPOTS, area }) });
})();
