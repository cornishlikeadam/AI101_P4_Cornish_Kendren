// Author-time helper for props/vegetation/live-oak.svg.
// The composition (limb lines, canopy lobe outlines, moss clump positions) is hand-placed below.
// The helper only does repetitive drafting: scalloping lobe edges, drawing moss strands, scattering leaf marks.
// usage: node tools/author/live-oak.mjs [spread|tall|lean] > assets/props/vegetation/live-oak[-tall|-lean].svg
// Variants reshape the same hand-placed canopy (narrower and taller, or leaning east) and re-roll the
// lobe scallops, leaf marks and moss with their own seed, so each variant has its own silhouette.
const f = (v) => +v.toFixed(1);
const VARIANT = process.argv[2] || 'spread';
const V = { spread: { seed: 7, sx: 1, sy: 1, lean: 0, id: 'live-oak' }, tall: { seed: 19, sx: 0.7, sy: 1.22, lean: 0, id: 'live-oak-tall' }, lean: { seed: 31, sx: 0.92, sy: 0.86, lean: 0.3, id: 'live-oak-lean' } }[VARIANT];
let seed = V.seed;
// Blend from identity at the trunk base (y >= 330) to the full reshape in the crown (y <= 290).
function T(x, y) {
  const w = Math.max(0, Math.min(1, (330 - y) / 40));
  const nx = 238 + (x - 238) * V.sx + (300 - y) * V.lean, ny = 300 + (y - 300) * V.sy;
  return [f(x + (nx - x) * w), f(y + (ny - y) * w)];
}
const TP = (pts) => pts.map(([x, y]) => T(x, y));
const TD = (d) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => T(+x, +y).join(','));
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function scallop(pts, bump) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / bump));
    for (let k = 1; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
      const r = (len / n) * (0.55 + rnd() * 0.25);
      d += ` A${f(r)},${f(r)} 0 0,1 ${f(x)},${f(y)}`;
    }
  }
  return d + ' Z';
}
function inside(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function marks(pts, n) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let d = '';
  for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
    if (!inside(pts, x, y)) continue;
    const w = 3 + rnd() * 3;
    d += `M${f(x)},${f(y)} q${f(w / 2)},${f(-w * 0.6)} ${f(w)},0 `;
    k++;
  }
  return d;
}
function moss(x, y, n, len) {
  let under = '', over = '';
  for (let i = 0; i < n; i++) {
    const x0 = x + (i - n / 2) * 2.6 + rnd() * 2;
    const L = len * (0.45 + rnd() * 0.6), w = 2 + rnd() * 3, dx = (rnd() - 0.5) * 6;
    const d = `M${f(x0)},${y} C${f(x0 + w)},${f(y + L * 0.33)} ${f(x0 - w)},${f(y + L * 0.66)} ${f(x0 + dx)},${f(y + L)}`;
    const sw = f(1.3 + rnd() * 1.4);
    under += `<path d="${d}" stroke-width="${f(sw + 1.4)}"/>`;
    over += `<path d="${d}" stroke-width="${sw}"/>`;
  }
  return { under, over };
}

// ---- hand-placed composition (viewBox 480 x 380, ground contact at 240,372) ----
const back0 = [[22, 236], [30, 192], [66, 152], [118, 120], [178, 94], [248, 82], [318, 90], [380, 116], [430, 158], [460, 206], [452, 242], [400, 250], [330, 244], [262, 252], [192, 244], [122, 252], [60, 250]];
const back = TP(back0);
const lobes0 = [
  [[34, 232], [46, 196], [84, 170], [130, 166], [160, 186], [166, 222], [140, 244], [90, 248], [50, 246]],
  [[108, 152], [140, 118], [196, 100], [240, 104], [258, 130], [240, 160], [196, 170], [150, 170], [118, 168]],
  [[250, 112], [290, 92], [350, 98], [394, 126], [402, 160], [372, 178], [320, 176], [276, 160], [256, 136]],
  [[338, 214], [356, 182], [400, 170], [440, 188], [454, 222], [430, 244], [380, 248], [350, 238]],
  [[184, 214], [206, 190], [250, 184], [292, 196], [300, 224], [276, 242], [226, 246], [196, 238]],
];
const lobes = lobes0.map(TP);
const lights0 = [
  [[44, 206], [70, 180], [108, 172], [132, 180], [104, 192], [70, 202]],
  [[124, 140], [156, 116], [200, 106], [228, 112], [196, 126], [150, 140]],
  [[266, 116], [300, 98], [346, 102], [372, 116], [334, 122], [290, 130]],
  [[350, 196], [376, 178], [412, 176], [430, 186], [400, 194], [370, 202]],
  [[200, 204], [226, 190], [262, 190], [282, 198], [252, 206], [220, 210]],
];
const lights = lights0.map(TP);
const limbs0 = [
  [26, 'M232,336 C234,318 236,306 238,292'],
  [24, 'M236,302 C214,282 186,268 156,260'],
  [15, 'M156,260 C124,252 96,244 64,236'],
  [9, 'M64,236 C50,231 40,224 30,214'],
  [22, 'M240,298 C268,268 312,252 352,240'],
  [13, 'M352,240 C380,232 402,222 424,208'],
  [19, 'M238,296 C242,254 232,214 240,176'],
  [11, 'M240,184 C244,154 258,132 268,112'],
  [12, 'M156,260 C146,232 136,206 126,180'],
  [12, 'M310,250 C316,222 322,196 330,170'],
  [18, 'M228,334 C192,322 140,320 98,332'],
  [11, 'M98,332 C74,339 52,350 30,364'],
];
const limbs = limbs0.map(([w, d]) => [w, TD(d)]);
const mossAt0 = [[46, 240, 5, 44], [72, 244, 6, 58], [104, 248, 4, 40], [132, 250, 6, 54], [150, 262, 4, 30], [196, 246, 5, 46], [222, 248, 3, 26], [282, 250, 6, 56], [314, 246, 4, 36], [348, 244, 6, 60], [378, 248, 4, 40], [410, 238, 5, 46], [436, 226, 4, 36], [88, 336, 5, 32], [58, 350, 5, 34], [140, 326, 4, 26], [184, 324, 3, 22]];

const mossAt = mossAt0.map(([x, y, n, l]) => [...T(x, y), n, l]);
const ms = mossAt.map(([x, y, n, l]) => moss(x, y, n + 2, l * 1.45));
const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VARIANT === 'lean' ? 540 : 480} 380" width="${VARIANT === 'lean' ? 540 : 480}" height="380" data-anchor="240 372" data-asset="props/vegetation/${V.id}" data-author="original SVG, hand-composed with tools/author/live-oak.mjs, Waldo's Savannah 2026-11-15">
<style>
.o{stroke:#2B1D16;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.lf{fill:none;stroke:#1F3A22;stroke-opacity:.45;stroke-width:1.2;stroke-linecap:round}
.leaf-dk{fill:#2F5934}.leaf{fill:#4A8343}.leaf-lt{fill:#6FA352}
.bark{fill:#6B4A33}.bark-sh{fill:#4F3524}
.ink-limb{fill:none;stroke:#2B1D16;stroke-linecap:round;stroke-linejoin:round}
.limb{fill:none;stroke:#6E4C34;stroke-linecap:round;stroke-linejoin:round}
.moss-u{fill:none;stroke:#5E6A52;stroke-linecap:round;opacity:.85}
.moss{fill:none;stroke:#C2CAAD;stroke-linecap:round}
</style>
<g id="shadow"><ellipse cx="262" cy="364" rx="190" ry="30" fill="#2B1D16" opacity=".16"/></g>
<path class="leaf-dk o" d="${scallop(back, 22)}"/>
<path class="lf" d="${marks(back, 40)}"/>
<g class="ink-limb">${limbs.map(([w, d]) => `<path stroke-width="${w + 4}" d="${d}"/>`).join('')}</g>
<g class="limb">${limbs.map(([w, d]) => `<path stroke-width="${w}" d="${d}"/>`).join('')}</g>
<g fill="none" stroke="#4F3524" stroke-linecap="round"><path stroke-width="5" d="${TD('M230,312 C210,292 186,280 158,272')}"/><path stroke-width="5" d="${TD('M246,308 C272,282 312,264 350,252')}"/><path stroke-width="5" d="M224,344 C190,333 142,330 102,341"/></g>
<path class="bark o" d="M200,376 C212,362 220,348 222,330 C224,314 220,300 208,288 Q238,304 270,286 C256,300 251,316 253,332 C255,350 264,364 280,376 C256,381 222,381 200,376 Z"/>
<path class="bark-sh" d="M246,298 Q258,294 270,286 C256,300 251,316 253,332 C255,350 264,364 280,376 C272,378 262,379 252,379 C252,362 246,344 246,326 C246,312 244,302 242,292 Z"/>
<path class="lf" style="stroke:#2B1D16" d="M230,302 c-2,10 2,18 -1,28 c-2,8 1,16 -2,26 M238,306 c2,10 -2,20 1,30 M212,366 c4,-6 8,-10 10,-18 M262,368 c-4,-6 -6,-12 -7,-20 M198,376 c10,-1 18,2 24,-2 M254,378 c8,1 16,-1 22,0"/>
${lobes.map((p) => `<path class="leaf o" d="${scallop(p, 16)}"/>`).join('\n')}
${lights.map((p) => `<path class="leaf-lt" d="${scallop(p, 12)}"/>`).join('\n')}
<path class="lf" d="${lobes.map((p) => marks(p, 14)).join('')}"/>
<g class="moss-u">${ms.map((m) => m.under).join('')}</g>
<g class="moss">${ms.map((m) => m.over).join('')}</g>
</svg>
`;
process.stdout.write(out);
