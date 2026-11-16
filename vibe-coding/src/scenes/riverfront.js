/* River Street and Festival Pier (Agent 2): world y 0-1500. River, riverwalk, plank pier with festival
   tents, cobbled River Street, the cotton warehouse row and Bay Street. Mirrors tools/author/savannah-ground.mjs. */
(function () {
  const WS = (window.WS = window.WS || {});
  const C = 'characters/archetypes/', B = 'characters/bodies/';
  const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const TENTS = [];
  for (const y of [380, 430]) for (let x = 2120; x < 3120; x += 150) TENTS.push([x + (y === 430 ? 75 : 0), y]);
  function geography() {
    const g = [], add = (asset, x, y, k = 1, flip = 0, extra = {}) => g.push(Object.assign({ asset, x, y, k, flip }, extra));
    add('environments/riverfront/warehouse-row', 0, 1350, 1, 0, { layer: 'far' });
    add('props/river/riverboat', 900, 424, 1);
    add('props/river/tugboat', 1820, 300, 0.9, 1);
    add('props/landmarks/waving-girl', 420, 560, 0.9);
    const awn = ['#2F7FA8', '#C73E3A', '#3E8E7E', '#E07A3F', '#7D5BA6', '#2F5D50', '#E8457A'];
    TENTS.forEach(([x, y], i) => add('props/festival/tent', x, y, 1, i % 2, { tint: { tent: awn[i % awn.length], tent2: '#F5F0E6', cloth: ['#F2D55C', '#F5F0E6', '#F4A3B5', '#9EC3B5'][i % 4] } }));
    for (let x = 120; x < 3200; x += 260) add('props/furniture/lamp-post', x, 452, 0.95);
    for (const x of [260, 760, 1300, 1760]) add('props/furniture/park-bench', x, 470, 0.9);
    for (let x = 80; x < 3200; x += 380) add('props/furniture/lamp-post', x, 1046, 0.9);
    add('props/vehicles/trolley', 1200, 1470, 0.95);
    add('props/vehicles/carriage', 2500, 1460, 0.95, 1);
    add('props/vehicles/carriage', 700, 1030, 0.95);
    return g;
  }
  function stories() {
    const st = [], s = (story, asset, x, y, flip = 0, extra = {}) => st.push(Object.assign({ story, asset, x, y, flip }, extra));
    // deckhands coiling rope by the riverboat gangway; a captain waving from the dock
    s('deckhands', C + 'riverboat-worker', 1150, 470); s('deckhands', C + 'riverboat-worker', 1210, 478, 1); s('deckhands', B + 'tote', 1080, 488, 0);
    // tourists photographing the Waving Girl statue
    s('waving-girl', C + 'tourist-photographer', 520, 640, 1); s('waving-girl', B + 'phone', 340, 630); s('waving-girl', C + 'historian', 470, 660, 1);
    // festival on the pier: cotton candy, a juggler, a queue at a tent
    s('festival', C + 'juggler', 2560, 520); for (const [x, y, f] of [[2500, 556, 0], [2620, 560, 1], [2470, 520, 0], [2650, 524, 1]]) s('festival', C + 'festival-goer', x, y, f);
    for (const [x, f] of [[2190, 0], [2230, 1], [2270, 0]]) s('festival', B + 'coffee', x, 470, f);
    s('festival', C + 'saxophonist', 2900, 560, 1); s('festival', 'props/furniture/tip-hat', 2860, 566, 0, { k: 0.9 });
    // pralines on River Street and a dropped ice cream
    s('river-street', C + 'praline-vendor', 1500, 1000); s('river-street', B + 'child', 1580, 1012, 1); s('river-street', C + 'kid-balloon', 1640, 1020, 1);
    // ghost-tour historian with a group on Factors Walk
    s('ghost-tour', C + 'historian', 2200, 1380); for (const [x, f] of [[2260, 1], [2300, 1], [2340, 1]]) s('ghost-tour', B + 'walk', x, 1385, f);
    // pigeons on the riverwalk
    s('river-pigeons', C + 'elder-pigeon-feeder', 1900, 760); for (const [x, y, f] of [[1960, 770, 0], [1980, 784, 1], [1940, 790, 1], [2000, 764, 0]]) s('river-pigeons', 'props/animals/pigeon', x, y, f, { k: 0.9 });
    return st;
  }
  const ZONES = [
    { id: 'riverwalk', w: 26, path: true, pt: (r) => [40 + r() * 3120, 470 + r() * 420] },
    { id: 'pier', w: 12, path: false, pt: (r) => [2040 + r() * 1080, 450 + r() * 30 - 0] },
    { id: 'river-street', w: 12, path: true, pt: (r) => [40 + r() * 3120, 906 + r() * 128] },
    { id: 'factors-walk', w: 7, path: true, pt: (r) => [40 + r() * 3120, 1356 + r() * 40] },
  ];
  const blocked = (x, y) => y < 456 && !(x > 2000 && y > 440) || (y > 1040 && y < 1350) || (y > 1400 && y < 1480) || TENTS.some(([tx, ty]) => inRect(x, y, [tx - 66, ty - 10, tx + 66, ty + 2])) || inRect(x, y, [370, 520, 470, 566]);
  const SPOTS = [
    { id: 'riverwalk-open', x: 1400, y: 700, r: 400, d: ['easy'] },
    { id: 'festival-crowd', x: 2560, y: 540, r: 150, d: ['normal', 'hard'] },
    { id: 'among-tents', x: 2600, y: 470, r: 400, d: ['hard'] },
    { id: 'river-street-cobbles', x: 1600, y: 960, r: 900, d: ['easy', 'normal'] },
    { id: 'gangway', x: 1160, y: 490, r: 80, d: ['normal'] },
    { id: 'ghost-tour', x: 2280, y: 1386, r: 90, d: ['hard', 'normal'] },
  ];
  function area(x, y) {
    if (y < 0 || y >= 1500) return null;
    if (x > 2000 && y < 640) return 'on the Festival Pier';
    if (y < 900) return x < 900 ? 'on the riverwalk by the Waving Girl' : 'on the riverwalk along the Savannah River';
    if (y < 1100) return 'on cobbled River Street';
    return 'on Factors Walk and Bay Street';
  }
  WS.districts = Object.assign(WS.districts || {}, { riverfront: () => ({ id: 'riverfront', name: 'River Street', y0: 0, h: 1500, geography, stories, zones: ZONES, blocked, spots: SPOTS, area }) });
})();
