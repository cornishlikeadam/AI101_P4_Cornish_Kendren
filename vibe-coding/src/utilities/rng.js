/* Seeded randomness (shared). Mulberry32 seeded from an FNV-1a hash of the replay identity.
   Frame time never feeds into it, so a replay identity always builds the same scene. */
(function () {
  const WS = (window.WS = window.WS || {});
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function make(seedStr) {
    const r = mulberry32(fnv1a(seedStr));
    r.int = (n) => Math.floor(r() * n);
    r.pick = (a) => a[Math.floor(r() * a.length)];
    r.range = (a, b) => a + r() * (b - a);
    r.chance = (p) => r() < p;
    r.weighted = (pairs) => { let t = 0; for (const [, w] of pairs) t += w; let x = r() * t; for (const [v, w] of pairs) { if ((x -= w) < 0) return v; } return pairs[pairs.length - 1][0]; };
    r.fork = (label) => make(seedStr + '#' + label);
    return r;
  }
  const identityKey = (id) => [id.seed, id.scene, id.difficulty, id.density, id.crowd == null ? '' : id.crowd, id.artVersion].join('|');
  WS.rng = { fnv1a, mulberry32, make, identityKey };
})();
