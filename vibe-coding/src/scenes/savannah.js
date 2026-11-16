/* The whole city in one world (Agent 2): 9120 x 7600. North to south it runs from the river down Bull Street
   to Forsyth Park; west to east it spans from the Talmadge Bridge and Plant Riverside to Emmet Park and the
   Victorian District. The original 3200-wide city (River Street, City Market and Johnson Square, Pulaski and
   Lafayette Squares, Jones Street and Monterey Square, Forsyth Park) sits in the middle at x 2960-6160, with
   Bull Street at x 4560; src/scenes/wings.js adds the west and east wings to every band. The target can be
   anywhere. The ground is three seamless chunks so no single image is too large for a phone. */
(function () {
  const WS = (window.WS = window.WS || {});
  const OFF = 2960, CORE = 3200, W = 9120, H = 7600;
  // A district written in core coordinates (x 0-3200), moved east by OFF.
  function shift(d) {
    const sx = (o) => Object.assign({}, o, { x: o.x + OFF });
    return Object.assign({}, d, {
      geography: () => d.geography().map(sx), stories: () => d.stories().map(sx),
      zones: d.zones.map((z) => Object.assign({}, z, { pt: (r) => { const [x, y] = z.pt(r); return [x + OFF, y]; } })),
      blocked: (x, y) => d.blocked(x - OFF, y), spots: d.spots.map(sx), area: (x, y) => d.area(x - OFF, y),
      fountain: d.fountain ? sx(d.fountain) : undefined, fountains: d.fountains ? d.fountains.map(sx) : undefined,
    });
  }
  // One band across the whole width: the west wing, the shifted core and the east wing.
  function band(core, wing) {
    const c = shift(core), w = wing.west(), e = wing.east();
    const pick = (x) => (x < OFF ? w : x >= OFF + CORE ? e : c);
    return Object.assign({}, c, {
      geography: () => [...w.geography(), ...c.geography(), ...e.geography()],
      stories: () => [...w.stories(), ...c.stories(), ...e.stories()],
      zones: [...c.zones, ...w.zones, ...e.zones], spots: [...c.spots, ...w.spots, ...e.spots],
      blocked: (x, y) => x < 6 || x > W - 6 || pick(x).blocked(x, y),
      area: (x, y) => (y < c.y0 || y >= c.y0 + c.h ? null : pick(x).area(x, y)),
    });
  }
  function build(identity) {
    const D = WS.districts, X = WS.wings;
    return WS.buildScene(identity, {
      id: 'savannah', name: 'Savannah', w: W, h: H, ground: 'environments/savannah/ground',
      grounds: [
        { asset: 'environments/savannah/ground-west', x: 0, y: 0, w: OFF, h: H },
        { asset: 'environments/savannah/ground', x: OFF, y: 0, w: CORE, h: H },
        { asset: 'environments/savannah/ground-east', x: OFF + CORE, y: 0, w: W - OFF - CORE, h: H },
      ],
      districts: [band(D.riverfront(), X.riverfront), band(D.market(), X.market), band(D.squares(), X.squares), band(D.monterey(), X.monterey), band(D.forsyth(5200), X.forsyth)],
      budget: { low: 900, standard: 1800, dense: 3000 },
      // The camera opens on the Forsyth fountain plaza: the busiest, most finished view in the city.
      home: { x: OFF + 1600, y: 5200 + 830, zoom: 1.3 },
    });
  }
  WS.scenes = Object.assign(WS.scenes || {}, { savannah: { build, OFF } });
})();
