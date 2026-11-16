/* Character composer (Agent 2). Builds one SVG string from a body or archetype plus a head kit.
   Classic script: works from file:// and attaches to window.WS.characters. */
(function () {
  const WS = (window.WS = window.WS || {});
  const A = () => window.WS_ASSETS;

  function inner(svg) {
    const start = svg.indexOf('>', svg.indexOf('<svg')) + 1;
    return svg.slice(start, svg.lastIndexOf('</svg>')).replace(/<style>[\s\S]*?<\/style>/g, '');
  }
  function section(svg, name) {
    const a = svg.indexOf('<!--' + name + '-->');
    if (a < 0) return name === 'front' ? inner(svg) : '';
    const b = svg.indexOf('<!--/' + name + '-->', a);
    return svg.slice(a + name.length + 7, b);
  }
  const part = (kind, name) => (name && name !== 'none' ? A().svg['characters/parts/' + kind + '/' + name] : null);

  // kit: { face, hair, hat, glasses, beard }
  function headAssembly(kit) {
    const hair = part('hair', kit.hair), face = part('faces', kit.face || 'smile');
    let s = '';
    if (hair) s += section(hair, 'back');
    s += inner(face);
    if (hair) s += section(hair, 'front');
    if (part('beards', kit.beard)) s += inner(part('beards', kit.beard));
    if (part('glasses', kit.glasses)) s += inner(part('glasses', kit.glasses));
    if (part('hats', kit.hat)) s += inner(part('hats', kit.hat));
    return s;
  }

  // Traits a head kit adds (decoy accounting).
  function kitTraits(kit) {
    const t = [];
    for (const [kind, name] of [['hats', kit.hat], ['glasses', kit.glasses]]) {
      const id = 'characters/parts/' + kind + '/' + name;
      if (name && A().meta[id]) t.push(...A().meta[id].traits);
    }
    return t;
  }

  const parseKit = (s) => Object.fromEntries((s || '').split(/\s+/).filter(Boolean).map((kv) => kv.split('=')));
  // The archetype's own head kit (data-kit), overridden by the caller's choices.
  const defaultKit = (assetId, n) => parseKit(A().meta[assetId][n === 2 ? 'kit2' : 'kit']);

  // colours: { skin, hair, top, top2, bottom, hat, hat2, acc, shoe } plus skin2, hair2, top3, top4, bottom2, shoe2, hat3 for a second person
  function compose(assetId, colours, kit, kit2, frame = 1) {
    const a = A();
    let svg = a.svg[assetId];
    if (!svg) throw new Error('unknown asset ' + assetId);
    const m = a.meta[assetId];
    const head = (pos, k) => '<g transform="translate(' + pos[0] + ' ' + pos[1] + ') scale(' + pos[2] + ')">' + headAssembly(k) + '</g>';
    if (svg.includes('<!--HEAD-->')) svg = svg.replace('<!--HEAD-->', head(m.head || [0, 0, 1], Object.assign(defaultKit(assetId, 1), kit || {})));
    if (svg.includes('<!--HEAD2-->')) svg = svg.replace('<!--HEAD2-->', head(m.head2 || [0, 0, 1], Object.assign(defaultKit(assetId, 2), kit2 || {})));
    if (frame === 2) svg = svg.replace('<g data-frame="1">', '<g data-frame="1" display="none">').replace('<g data-frame="2" display="none">', '<g data-frame="2">');
    if (colours) {
      const style = Object.entries(colours).filter(([, v]) => v).map(([k, v]) => '--' + k + ':' + v).join(';');
      svg = svg.replace('<svg ', '<svg style="' + style + '" ');
    }
    return svg;
  }

  WS.characters = Object.assign(WS.characters || {}, { compose, headAssembly, kitTraits, parseKit, defaultKit });
})();
