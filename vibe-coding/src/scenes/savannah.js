/* The whole city in one world (Agent 2), joined by Bull Street from Bay Street to the Forsyth Park gate:
   River Street, City Market and Johnson Square, Pulaski and Lafayette Squares, Jones Street and Monterey
   Square, then Forsyth Park, north to south. The target can be in any district. */
(function () {
  const WS = (window.WS = window.WS || {});
  function build(identity) {
    const D = WS.districts;
    return WS.buildScene(identity, {
      id: 'savannah', name: 'Savannah', w: 3200, h: 7600, ground: 'environments/savannah/ground',
      districts: [D.riverfront(), D.market(), D.squares(), D.monterey(), D.forsyth(5200)],
      budget: { low: 450, standard: 900, dense: 1500 },
      // The camera opens on the Forsyth fountain plaza: the busiest, most finished view in the city.
      home: { x: 1600, y: 5200 + 830, zoom: 1.3 },
    });
  }
  WS.scenes = Object.assign(WS.scenes || {}, { savannah: { build } });
})();
