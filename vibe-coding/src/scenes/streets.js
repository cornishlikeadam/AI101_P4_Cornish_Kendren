/* Street furniture shared by every district (Agent 2): traffic and parked cars on the east-west streets,
   and the trees, lamps, signs and hydrants of Bull Street, the north-south spine that joins the districts
   from Bay Street to the Forsyth Park gate. Positions are fixed (no randomness), so geography never depends
   on the seed. Mirrors tools/author/savannah-ground.mjs (Bull Street sidewalks at x 1515-1545 and 1655-1685). */
(function () {
  const WS = (window.WS = window.WS || {});
  const BULL = { x0: 1545, x1: 1655, s0: 1515, s1: 1685 };
  const CAR_COLOURS = ['#C73E3A', '#2F7FA8', '#F2D55C', '#3E8E7E', '#F5F0E6', '#3D4F6E', '#E07A3F', '#7D5BA6', '#2B2B2B', '#8DBA5A'];
  let ci = 0;
  const car = (add, x, y, flip, extra = {}) => add(ci % 3 === 2 ? 'props/vehicles/car-small' : 'props/vehicles/car', x, y, 0.72, flip, Object.assign({ tint: { car: CAR_COLOURS[ci++ % CAR_COLOURS.length], car2: '#F5F0E6' } }, extra));

  // An east-west street from y to y + h: parked cars along the south curb (never on the Bull crossing),
  // and moving traffic in both directions. Westbound keeps to the north half, eastbound to the south half.
  function street(add, y, h, opts = {}) {
    const parked = opts.parked || [], moving = opts.moving == null ? 2 : opts.moving;
    for (const x of parked) if (x < BULL.s0 - 90 || x > BULL.s1 + 90) car(add, x, y + h - 3, (x / 100) % 2 > 1 ? 1 : 0, { parked: true });
    for (let i = 0; i < moving; i++) {
      car(add, 400 + i * 1500 + (y % 300), y + h * 0.5 - 2, 1, { drive: 46 + ((y + i * 17) % 22) });
      car(add, 1100 + i * 1500 - (y % 260), y + h * 0.78, 0, { drive: 50 + ((y + i * 29) % 18) });
    }
  }
  // Bull Street between two cross streets: an oak in every tree pit (alternating sides), lamps between.
  function bull(add, y0, y1, opts = {}) {
    let side = 0;
    for (let y = y0 + 90; y < y1 - 60; y += 170, side++) {
      const x = side % 2 ? BULL.s1 - 15 : BULL.s0 + 15;
      if (!opts.noTrees) add(side % 3 === 2 ? 'props/vegetation/live-oak-lean' : 'props/vegetation/live-oak', x, y + 4, 0.42, side % 2);
      add('props/furniture/lamp-post', side % 2 ? BULL.s0 + 12 : BULL.s1 - 12, y + 70, 0.8);
    }
  }
  // The corner of Bull and a cross street: the street sign, a hydrant and a litter bin.
  function corner(add, name, y) {
    add('props/street/sign-' + name, BULL.s1 + 22, y, 0.9);
    add('props/street/hydrant', BULL.s0 - 30, y - 4, 0.9);
    add('props/street/bin', BULL.s1 + 60, y - 2, 0.9);
  }
  // Pedestrians keep off the asphalt of Bull Street.
  const onBullRoad = (x, y, y0, y1) => x > BULL.x0 - 4 && x < BULL.x1 + 4 && y > y0 && y < y1;
  const bullWalk = (y0, y1) => ({ id: 'bull-walk', w: 4, path: true, pt: (r) => [r() < 0.5 ? BULL.s0 + 8 + r() * 18 : BULL.x1 + 4 + r() * 20, y0 + 40 + r() * (y1 - y0 - 80)] });
  WS.streets = { BULL, street, bull, corner, onBullRoad, bullWalk };
})();
