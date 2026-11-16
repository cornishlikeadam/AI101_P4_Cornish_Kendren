/* The whole city in one world (Agent 2): River Street, City Market, two squares and Forsyth Park from north
   to south. The target can be in any district. */
(function () {
  const WS = (window.WS = window.WS || {});
  function build(identity) {
    const D = WS.districts;
    return WS.buildScene(identity, {
      id: 'savannah', name: 'Savannah', w: 3200, h: 6700, ground: 'environments/savannah/ground',
      districts: [D.riverfront(), D.market(), D.squares(), D.forsyth(4300)],
      budget: { low: 450, standard: 900, dense: 1500 },
    });
  }
  WS.scenes = Object.assign(WS.scenes || {}, { savannah: { build } });
})();
