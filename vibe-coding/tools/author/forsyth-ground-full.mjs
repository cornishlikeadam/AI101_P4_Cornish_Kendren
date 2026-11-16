// Author-time helper for environments/forsyth/ground.svg, the full 3200 x 2400 benchmark scene.
// Layout shapes (walks, plaza, patio, market square) are hand-placed below; the helper only scatters
// grass tufts, daisies, paving joints and shell speckle. Layout constants are mirrored in src/scenes/forsyth.js.
// usage: node tools/author/forsyth-ground-full.mjs > assets/environments/forsyth/ground.svg
const W = 3200, H = 2400;
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (v) => +v.toFixed(1);

const P = { cx: 1600, cy: 640, rx: 430, ry: 172 };           // fountain plaza ring
const inEll = (x, y, e, pad = 0) => ((x - e.cx) / (e.rx + pad)) ** 2 + ((y - e.cy) / (e.ry + pad)) ** 2 < 1;
const walks = [
  [[1530, 350], [1670, 350], [1662, 480], [1538, 480]],          // north gate from Gaston Street
  [[1538, 790], [1662, 790], [1662, 2400], [1538, 2400]],        // central promenade
  [[1230, 700], [1280, 770], [560, 1140], [470, 1080]],          // south-west diagonal
  [[1970, 700], [1920, 770], [2640, 1140], [2730, 1080]],        // south-east diagonal
  [[0, 372], [3200, 372], [3200, 404], [0, 404]],                // north perimeter walk
  [[40, 404], [76, 404], [76, 2400], [40, 2400]],                // west perimeter walk
  [[3124, 404], [3160, 404], [3160, 2400], [3124, 2400]],        // east perimeter walk
  [[76, 1560], [3124, 1560], [3124, 1612], [76, 1612]],          // east-west cross walk
  [[76, 2300], [3124, 2300], [3124, 2336], [76, 2336]],          // south walk
];
const patio = [[420, 1150], [1080, 1150], [1110, 1420], [390, 1420]];    // cafe patio (brick)
const market = [[1880, 1110], [2960, 1110], [2990, 1470], [1850, 1470]]; // farmers market (shell)
const play = { cx: 820, cy: 1900, rx: 250, ry: 110 };                     // sandy play circle

const inPoly = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const onPaving = (x, y) => y < 410 || inEll(x, y, P, 8) || inEll(x, y, play, 6) || walks.some((p) => inPoly(p, x, y)) || inPoly(patio, x, y) || inPoly(market, x, y);
const poly = (pts) => 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';

let pTufts = '', pTuftsLt = '', pDaisies = '', pClover = '';
for (let i = 0; i < 42; i++) {
  const x = 6 + rnd() * 148, y = 8 + rnd() * 146;
  const w = 2.4 + rnd() * 2.6, h = 2.4 + rnd() * 3;
  const s = `M${f(x)},${f(y)}l${f(-w / 2)},${f(-h)}M${f(x)},${f(y)}l${f(w / 4)},${f(-h * 1.2)}M${f(x)},${f(y)}l${f(w / 2)},${f(-h * 0.8)}`;
  if (rnd() < 0.7) pTufts += s; else pTuftsLt += s;
}
for (let i = 0; i < 4; i++) {
  const x = 8 + rnd() * 144, y = 8 + rnd() * 144;
  if (rnd() < 0.6) pDaisies += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5"/>`;
  else pClover += `<circle cx="${f(x)}" cy="${f(y)}" r="1.3"/>`;
}
let joints = '';
for (let k = 1; k <= 7; k++) {
  const t = 0.62 + k * 0.054;
  joints += `<ellipse cx="${P.cx}" cy="${P.cy}" rx="${f(P.rx * t)}" ry="${f(P.ry * t)}"/>`;
}
for (let a = 0; a < 360; a += 4.5) {
  const r = (a * Math.PI) / 180, ring = Math.floor(a / 4.5) % 7;
  const t0 = 0.62 + ring * 0.054, t1 = t0 + 0.054;
  joints += `<path d="M${f(P.cx + Math.cos(r) * P.rx * t0)},${f(P.cy + Math.sin(r) * P.ry * t0)}L${f(P.cx + Math.cos(r) * P.rx * t1)},${f(P.cy + Math.sin(r) * P.ry * t1)}"/>`;
}
let pSpeck = '';
for (let i = 0; i < 36; i++) {
  pSpeck += `<circle cx="${f(4 + rnd() * 152)}" cy="${f(4 + rnd() * 152)}" r="${f(0.6 + rnd() * 0.8)}"/>`;
}
let pSand = '';
for (let i = 0; i < 24; i++) {
  pSand += `<circle cx="${f(4 + rnd() * 92)}" cy="${f(4 + rnd() * 92)}" r="${f(0.7 + rnd())}"/>`;
}
let stripes = '';
for (let x = -1400; x < W + 800; x += 140) stripes += `<path d="M${x},${H}L${x + 900},410L${x + 970},410L${x + 70},${H}Z"/>`;

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-anchor="0 0" data-layer="ground" data-asset="environments/forsyth/ground" data-author="original SVG, hand-composed with tools/author/forsyth-ground-full.mjs, Waldo's Savannah 2026-11-15">
<defs>
<clipPath id="lawn"><rect x="0" y="404" width="${W}" height="${H - 404}"/></clipPath>
<pattern id="fg-grass" width="160" height="160" patternUnits="userSpaceOnUse">
<path d="${pTufts}" fill="none" stroke="#5E8F3E" stroke-width="1.1" stroke-linecap="round" opacity=".75"/>
<path d="${pTuftsLt}" fill="none" stroke="#B5D67D" stroke-width="1" stroke-linecap="round" opacity=".8"/>
<g fill="#FFFFFF" stroke="#C9B36A" stroke-width=".5">${pDaisies}</g>
<g fill="#F7C548">${pClover}</g>
</pattern>
<pattern id="fg-brick" width="26" height="24" patternUnits="userSpaceOnUse">
<rect width="26" height="24" fill="#C9805E"/>
<path d="M0,12H26M0,24H26M0,0v12M13,12v12" stroke="#A9654A" stroke-width="1" fill="none"/>
</pattern>
<pattern id="fg-speck" width="160" height="160" patternUnits="userSpaceOnUse">
<rect width="160" height="160" fill="#E8D6B0"/>
<g fill="#CDB68A">${pSpeck}</g>
</pattern>
<pattern id="fg-sand" width="100" height="100" patternUnits="userSpaceOnUse">
<rect width="100" height="100" fill="#EBD9A8"/>
<g fill="#D2BC86">${pSand}</g>
</pattern>
</defs>
<rect x="0" y="0" width="${W}" height="272" fill="#F6E7C8"/>
<rect x="0" y="270" width="${W}" height="72" fill="#7E776D"/>
<path d="M0,306H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>
<g fill="#F4EEDD">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${1538 + i * 20}" y="276" width="10" height="60"/>`).join('')}</g>
<path d="M0,270H${W}M0,342H${W}" stroke="#2B1D16" stroke-width="1.6"/>
<rect x="0" y="342" width="${W}" height="8" fill="#BDB3A0" stroke="#2B1D16" stroke-width="1"/>
<rect x="0" y="350" width="${W}" height="${H - 350}" fill="#8DBA5A"/>
<g clip-path="url(#lawn)" fill="#97C263" opacity=".7">${stripes}</g>
<rect x="0" y="404" width="${W}" height="${H - 404}" fill="url(#fg-grass)"/>
<path d="${poly(patio)}" fill="url(#fg-brick)" stroke="#2B1D16" stroke-width="1.8" stroke-linejoin="round"/>
<path d="${poly(market)}" fill="url(#fg-speck)" stroke="#2B1D16" stroke-width="1.8" stroke-linejoin="round"/>
${walks.map((p) => `<path d="${poly(p)}" fill="url(#fg-speck)" stroke="#2B1D16" stroke-width="1.6" stroke-linejoin="round"/>`).join('\n')}
<ellipse cx="${play.cx}" cy="${play.cy}" rx="${play.rx}" ry="${play.ry}" fill="url(#fg-sand)" stroke="#2B1D16" stroke-width="1.8"/>
<ellipse cx="${P.cx + 8}" cy="${P.cy + 8}" rx="${P.rx}" ry="${P.ry}" fill="#2B1D16" opacity=".08"/>
<ellipse cx="${P.cx}" cy="${P.cy}" rx="${P.rx}" ry="${P.ry}" fill="#D49A74" stroke="#2B1D16" stroke-width="1.8"/>
<ellipse cx="${P.cx}" cy="${P.cy}" rx="${P.rx - 14}" ry="${P.ry - 6}" fill="none" stroke="#B9774F" stroke-width="5"/>
<g fill="none" stroke="#B26E4A" stroke-width="1" opacity=".75">${joints}</g>
</svg>
`);
