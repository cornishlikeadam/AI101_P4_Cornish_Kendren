/* Character factory (Agent 2). Picks colours and a head kit for a body or archetype, and enforces the
   decoy rule: nobody but the target carries more than two of the five target traits. */
(function () {
  const WS = (window.WS = window.WS || {});
  const A = () => window.WS_ASSETS;

  const PAL = {
    skin: ['#FBE0C8', '#F6D2B8', '#F1C7A0', '#E0A97E', '#C68858', '#9C6440', '#6E432A', '#4E2E1E'],
    hair: ['#1E1410', '#2B1D16', '#4A2F1E', '#7A4A2A', '#B5452C', '#D9B06A', '#8E8E8E', '#E8E4DA', '#1E1410', '#4A2F1E'],
    top: ['#4F6CC4', '#E07A3F', '#5C9E4A', '#F2D55C', '#A33F6B', '#2F9C95', '#7D5BA6', '#E8457A', '#3D4F6E', '#F5F0E6', '#C73E3A', '#6FA3D8', '#F2A65A', '#8DBA5A', '#2F5D50', '#E8C872', '#D98FB0', '#B5452C'],
    top2: ['#F5F0E6', '#F7C548', '#2B1D16', '#E8457A', '#3FC1C9', '#7D5BA6', '#F4A3B5', '#5C9E4A', '#4F6CC4'],
    // No #1E88E5 here: target-blue trousers only appear as a deliberate decoy trait.
    bottom: ['#3B3A48', '#2F4858', '#6B5A44', '#26324A', '#C9B48A', '#7A3B3B', '#4A4A52', '#2F5D50', '#8A7A64', '#5B6B8A', '#E8E4DA'],
    hat: ['#3E8E7E', '#E8457A', '#F2D55C', '#2F7FA8', '#F5F0E6', '#7D5BA6', '#C73E3A', '#3D4F6E', '#E8C872', '#5C9E4A', '#E07A3F'],
    hat2: ['#F5F0E6', '#2B1D16', '#F7C548', '#E8457A', '#2F5D50', '#C73E3A'],
    acc: ['#F2D55C', '#4F6CC4', '#E8457A', '#5C9E4A', '#3FC1C9', '#7D5BA6', '#E07A3F', '#C99A62'],
    shoe: ['#5A3A28', '#2B1D16', '#F5F0E6', '#7A3B3B', '#3D4F6E', '#C99A62', '#2B1D16'],
    cane: ['#3B3A48', '#2B1D16', '#A8B0B8', '#5A3A28'],
    awn: ['#2F7FA8', '#3E8E7E', '#E07A3F', '#7D5BA6', '#C73E3A', '#2F5D50', '#E8457A'],
    umb: ['#2F5D50', '#C73E3A', '#2F7FA8', '#E8C872', '#7D5BA6', '#E07A3F'],
  };
  const REDS = ['#C73E3A', '#B5452C', '#E8457A', '#E53935'];
  const WHITES = ['#F5F0E6', '#FFFFFF', '#E8E4DA'];
  const TARGET_BLUE = '#1E88E5', TARGET_STICK = '#8D6E63';
  const HAIRS = ['crop', 'sidepart', 'bob', 'long', 'bun', 'afro', 'ponytail', 'bald', 'locs', 'curly'];
  const HATS = ['cap', 'sunhat', 'boater', 'beanie', 'bucket', 'fedora', 'headwrap', 'tophat'];
  const HAT_WEIGHTS = { cap: 6, sunhat: 5, boater: 3, beanie: 3, bucket: 4, fedora: 3, headwrap: 3, tophat: 0.4 };

  function colours(rng) {
    const c = {};
    for (const k of ['skin', 'hair', 'top', 'top2', 'bottom', 'hat', 'hat2', 'acc', 'shoe']) c[k] = rng.pick(PAL[k]);
    // Red tops never carry white trim: red-and-white stripes belong to the target alone.
    while (REDS.includes(c.top) && WHITES.includes(c.top2)) c.top2 = rng.pick(PAL.top2);
    if (REDS.includes(c.hat) && WHITES.includes(c.hat2)) c.hat2 = '#2B1D16';
    return c;
  }
  const secondPerson = (rng) => ({ skin2: rng.pick(PAL.skin), hair2: rng.pick(PAL.hair), top3: rng.pick(PAL.top), top4: rng.pick(PAL.top2), bottom2: rng.pick(PAL.bottom), shoe2: rng.pick(PAL.shoe), hat3: rng.pick(PAL.hat) });

  function hatsAllowed(hair) {
    const m = A().meta['characters/parts/hair/' + hair];
    const h = m && m.hats ? m.hats : ['all'];
    return h[0] === 'all' ? HATS : h[0] === 'none' ? [] : h.filter((x) => HATS.includes(x));
  }
  function kit(rng, { child = false } = {}) {
    const k = { face: rng.weighted([['smile', 4], ['neutral', 2], ['talk', 2], ['happy', 2], ['surprised', 1]]), hair: rng.pick(HAIRS) };
    if (child && k.hair === 'bald') k.hair = 'crop';
    const allowed = hatsAllowed(k.hair);
    if (allowed.length && rng.chance(0.42)) k.hat = rng.weighted(allowed.map((h) => [h, HAT_WEIGHTS[h] || 1]));
    const g = rng();
    if (g < 0.13) k.glasses = 'square'; else if (g < 0.24 && !child) k.glasses = 'sun';
    if (!child) { const b = rng(); if (b < 0.12) k.beard = 'full'; else if (b < 0.22) k.beard = 'moustache'; }
    return k;
  }

  function traitsOf(e) {
    const m = A().meta[e.asset];
    const t = new Set(m.traits || []);
    if (e.kit) WS.characters.kitTraits(e.kit).forEach((x) => t.add(x));
    if (e.colours && e.colours.bottom === TARGET_BLUE && (m.slots || []).includes('bottom')) t.add('blue');
    return [...t];
  }

  // Give a character up to n decoy traits it can physically show, then enforce the cap of two.
  function addDecoys(rng, e, n) {
    const m = A().meta[e.asset];
    const options = [];
    if (m.head) options.push('glasses', 'bobble');
    if ((m.slots || []).includes('bottom')) options.push('blue');
    if (e.asset === 'characters/bodies/cane') options.push('stick');
    for (let i = 0; i < n && options.length; i++) {
      const t = options.splice(rng.int(options.length), 1)[0];
      if (t === 'glasses') e.kit.glasses = 'round';
      if (t === 'bobble') { e.kit.hat = 'bobble'; if (!hatsAllowed(e.kit.hair).includes('beanie')) e.kit.hair = 'crop'; }
      if (t === 'blue') e.colours.bottom = TARGET_BLUE;
      if (t === 'stick') e.colours.acc = TARGET_STICK;
    }
  }
  function enforceCap(e) {
    let t = traitsOf(e);
    if (t.length > 2 && e.kit && e.kit.glasses === 'round') { e.kit.glasses = 'square'; t = traitsOf(e); }
    if (t.length > 2 && e.kit && e.kit.hat === 'bobble') { e.kit.hat = 'beanie'; t = traitsOf(e); }
    if (t.length > 2 && e.colours && e.colours.bottom === TARGET_BLUE) { e.colours.bottom = '#3B3A48'; t = traitsOf(e); }
    if (t.length > 2) throw new Error('decoy cap broken for ' + e.asset);
    e.traits = t;
    return e;
  }

  // make(rng, asset, { decoys: 0..2, child }) -> character data for a world entity
  function make(rng, asset, opts = {}) {
    const m = A().meta[asset];
    if (!m) throw new Error('unknown archetype ' + asset);
    const e = { asset, colours: colours(rng) };
    if (asset === 'characters/bodies/cane' && e.colours.acc !== TARGET_STICK) e.colours.acc = rng.pick(PAL.cane);
    if (m.head) {
      const child = asset === 'characters/bodies/child';
      const own = WS.characters.defaultKit(asset, 1);
      e.kit = Object.keys(own).length ? Object.assign({}, own, { face: kit(rng, { child }).face }) : kit(rng, { child });
      if (own.hat && rng.chance(0.5)) { const k2 = kit(rng); if (hatsAllowed(k2.hair).includes(own.hat)) e.kit.hair = k2.hair; }
    }
    if (m.head2) { Object.assign(e.colours, secondPerson(rng)); e.kit2 = Object.assign(WS.characters.defaultKit(asset, 2), { face: rng.pick(['talk', 'neutral', 'happy']) }); }
    if (opts.decoys) addDecoys(rng, e, Math.min(2, opts.decoys));
    return enforceCap(e);
  }

  WS.characters = Object.assign(WS.characters || {}, { make, traitsOf, PAL, TARGET_BLUE });
})();
