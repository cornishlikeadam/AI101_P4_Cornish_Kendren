// Author-time helper for environments/forsyth/ground-north.svg (the art-direction sample area).
// Layout shapes are hand-placed. The helper scatters grass tufts, daisies and paving joints.
// usage: node tools/author/forsyth-ground.mjs > assets/environments/forsyth/ground-north.svg
const W = 1600, H = 1000;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (v) => +v.toFixed(1);

// plaza ring and fountain footprint
const P = { cx: 800, cy: 640, rx: 430, ry: 172 };
const inEll = (x, y, e, pad = 0) => ((x - e.cx) / (e.rx + pad)) ** 2 + ((y - e.cy) / (e.ry + pad)) ** 2 < 1;
// paths: polygons
const paths = [
  [[730, 350], [870, 350], [862, 480], [738, 480]],               // north entrance from Gaston Street
  [[738, 790], [862, 790], [880, 1000], [720, 1000]],            // south promenade
  [[430, 700], [480, 770], [150, 1000], [40, 1000]],             // south-west diagonal
  [[1170, 700], [1120, 770], [1450, 1000], [1560, 1000]],        // south-east diagonal
  [[0, 372], [1600, 372], [1600, 404], [0, 404]],                // perimeter walk inside the fence
];
const inPoly = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const onPaving = (x, y) => inEll(x, y, P, 6) || paths.some((p) => inPoly(p, x, y)) || y < 410;

let tufts = '', tuftsLt = '', daisies = '', clover = '';
for (let i = 0; i < 2600; i++) {
  const x = rnd() * W, y = 410 + rnd() * (H - 410);
  if (onPaving(x, y)) continue;
  const w = 2.4 + rnd() * 2.6, h = 2.4 + rnd() * 3;
  const s = `M${f(x)},${f(y)} l${f(-w / 2)},${f(-h)} M${f(x)},${f(y)} l${f(w / 4)},${f(-h * 1.2)} M${f(x)},${f(y)} l${f(w / 2)},${f(-h * 0.8)} `;
  if (rnd() < 0.7) tufts += s; else tuftsLt += s;
}
for (let i = 0; i < 140; i++) {
  const x = rnd() * W, y = 420 + rnd() * (H - 420);
  if (onPaving(x, y)) continue;
  if (rnd() < 0.6) daisies += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5"/>`;
  else clover += `<circle cx="${f(x)}" cy="${f(y)}" r="1.3"/>`;
}
// plaza paving joints: concentric ellipses plus radial joints
let joints = '';
for (let k = 1; k <= 7; k++) {
  const t = 0.62 + k * 0.054;
  joints += `<ellipse cx="${P.cx}" cy="${P.cy}" rx="${f(P.rx * t)}" ry="${f(P.ry * t)}"/>`;
}
for (let a = 0; a < 360; a += 4.5) {
  const r = (a * Math.PI) / 180, ring = Math.floor(a / 4.5) % 7;
  const t0 = 0.62 + ring * 0.054, t1 = t0 + 0.054;
  joints += `<path d="M${f(P.cx + Math.cos(r) * P.rx * t0)},${f(P.cy + Math.sin(r) * P.ry * t0)} L${f(P.cx + Math.cos(r) * P.rx * t1)},${f(P.cy + Math.sin(r) * P.ry * t1)}"/>`;
}
// shell paving speckle on paths
let speck = '';
for (let i = 0; i < 900; i++) {
  const x = rnd() * W, y = 350 + rnd() * (H - 350);
  if (!paths.some((p) => inPoly(p, x, y))) continue;
  speck += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + rnd() * 0.8)}"/>`;
}
const poly = (pts) => 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';
// mowing stripes, diagonal bands
let stripes = '';
for (let x = -600; x < W + 600; x += 120) stripes += `<path d="M${x},${H} L${x + 380},410 L${x + 440},410 L${x + 60},${H} Z"/>`;

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-anchor="0 0" data-layer="ground" data-asset="environments/forsyth/ground-north" data-author="original SVG, hand-composed with tools/author/forsyth-ground.mjs, Waldo's Savannah 2026-11-15">
<defs><clipPath id="lawn"><rect x="0" y="404" width="${W}" height="${H - 404}"/></clipPath></defs>
<!-- warm sky behind the rooftops -->
<rect x="0" y="0" width="${W}" height="272" fill="#F6E7C8"/>
<!-- Gaston Street -->
<rect x="0" y="270" width="${W}" height="72" fill="#7E776D"/>
<path d="M0,306 H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>
<g fill="#F4EEDD"><rect x="738" y="276" width="10" height="60"/><rect x="758" y="276" width="10" height="60"/><rect x="778" y="276" width="10" height="60"/><rect x="798" y="276" width="10" height="60"/><rect x="818" y="276" width="10" height="60"/><rect x="838" y="276" width="10" height="60"/></g>
<path d="M0,270 H${W} M0,342 H${W}" stroke="#2B1D16" stroke-width="1.6"/>
<rect x="0" y="342" width="${W}" height="8" fill="#BDB3A0" stroke="#2B1D16" stroke-width="1"/>
<!-- park lawn with mowing stripes -->
<rect x="0" y="350" width="${W}" height="${H - 350}" fill="#8DBA5A"/>
<g clip-path="url(#lawn)" fill="#97C263" opacity=".7">${stripes}</g>
<!-- walks -->
${paths.map((p) => `<path d="${poly(p)}" fill="#E8D6B0" stroke="#2B1D16" stroke-width="1.6" stroke-linejoin="round"/>`).join('\n')}
<g fill="#CDB68A">${speck}</g>
<!-- plaza ring -->
<ellipse cx="${P.cx + 8}" cy="${P.cy + 8}" rx="${P.rx}" ry="${P.ry}" fill="#2B1D16" opacity=".08"/>
<ellipse cx="${P.cx}" cy="${P.cy}" rx="${P.rx}" ry="${P.ry}" fill="#D49A74" stroke="#2B1D16" stroke-width="1.8"/>
<ellipse cx="${P.cx}" cy="${P.cy}" rx="${P.rx - 14}" ry="${P.ry - 6}" fill="none" stroke="#B9774F" stroke-width="5"/>
<g fill="none" stroke="#B26E4A" stroke-width="1" opacity=".75">${joints}</g>
<!-- grass texture -->
<g fill="none" stroke="#5E8F3E" stroke-width="1.1" stroke-linecap="round" opacity=".75">${tufts.replace(/^/, '<path d="') + '"/>'}</g>
<g fill="none" stroke="#B5D67D" stroke-width="1" stroke-linecap="round" opacity=".8">${tuftsLt.replace(/^/, '<path d="') + '"/>'}</g>
<g fill="#FFFFFF" stroke="#C9B36A" stroke-width=".5">${daisies}</g>
<g fill="#F7C548">${clover}</g>
</svg>
`);
