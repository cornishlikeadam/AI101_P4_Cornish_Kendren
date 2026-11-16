// Author-time helper for the city's west and east wings: environments/savannah/ground-west.svg and
// ground-east.svg, each 2960 x 7600. The original ground (3200 wide) sits between them at world x 2960, so
// every band continues at exactly the same y as tools/author/savannah-ground.mjs:
//   river 0-430, riverwalk 430-900, River Street 900-1040, warehouses 1040-1350, Bay Street 1400-1480,
//   Congress 2700-2780, Harris 3220-3290, Charlton 4040-4110, Jones 4560-4640, Gaston 5470-5542, and in the
//   Victorian District south of Gaston: Hall 6200-6270, Park Avenue 6900-6970, Duffy 7520-7590.
// North-south streets (local x): west Montgomery 700, Jefferson 2100, Whitaker 2905 (Forsyth band only);
// east Habersham 840, Price 2240, Drayton 75 (Forsyth band only). Squares follow the real ones nearby:
// west Franklin (market band), Chatham (squares band); east Reynolds (market), Colonial Park Cemetery and
// Troup (squares), Calhoun and Whitefield (Monterey band). Distances are compressed.
// usage: node tools/author/savannah-wings.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = 2960, H = 7600;
const INK = '#2B1D16', ASPHALT = '#7E776D', WALK = '#E8D6B0', JOINT = '#CDB68A', CURB = '#C9C2B2', PAINT = '#F4F0E4', LAWN = '#8DBA5A';
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (v) => +v.toFixed(1);
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const lineH = (y, x0 = 0, x1 = W, sw = 1.6) => `<path d="M${x0},${y}H${x1}" stroke="${INK}" stroke-width="${sw}"/>`;
function sidewalk(x, y, w, h, step = 26) {
  let j = '';
  for (let yy = y + step; yy < y + h; yy += step) j += `M${x},${yy}h${w}`;
  for (let xx = x + step; xx < x + w; xx += step) j += `M${xx},${y}v${h}`;
  return rect(x, y, w, h, WALK) + `<path d="${j}" stroke="${JOINT}" stroke-width=".7" opacity=".7"/>`;
}
const tufts = (x0, y0, w, h, n, skip = () => false) => {
  let t = '';
  for (let i = 0; i < n; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h; if (skip(x, y)) continue; t += `M${f(x)},${f(y)}l-1.5,-3M${f(x)},${f(y)}l.8,-3.6M${f(x)},${f(y)}l1.6,-2.4`; }
  return `<path d="${t}" fill="none" stroke="#5E8F3E" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>`;
};
function streetH(y, h, ns) {
  let p = rect(0, y, W, h, ASPHALT) + lineH(y) + lineH(y + h) + `<path d="M0,${y + 2}H${W}M0,${y + h - 2}H${W}" stroke="${CURB}" stroke-width="3"/>`;
  p += `<path d="M0,${y + h / 2}H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>`;
  let bays = ''; for (let x = 40; x < W; x += 92) { if (ns.some((c) => Math.abs(x - c) < 150)) continue; bays += `M${x},${y + 4}v12M${x},${y + h - 4}v-12`; }
  p += `<path d="${bays}" stroke="${PAINT}" stroke-width="1.6" opacity=".8"/>`;
  let z = ''; for (const c of ns) for (const x0 of [c - 125, c + 91]) for (let yy = y + 6; yy < y + h - 4; yy += 10) z += `M${x0},${yy}h34`;
  return p + `<path d="${z}" stroke="${PAINT}" stroke-width="5"/>`;
}
// a north-south street between two cross streets: sidewalks, curbs, centre line, crosswalks, tree pits
function streetV(c, y0, y1) {
  const x0 = c - 55, x1 = c + 55;
  let p = sidewalk(c - 85, y0, 30, y1 - y0, 22) + sidewalk(x1, y0, 30, y1 - y0, 22) + rect(x0, y0, 110, y1 - y0, ASPHALT);
  p += `<path d="M${x0},${y0}V${y1}M${x1},${y0}V${y1}" stroke="${INK}" stroke-width="1.6"/><path d="M${x0 + 2},${y0}V${y1}M${x1 - 2},${y0}V${y1}" stroke="${CURB}" stroke-width="3"/>`;
  if (y1 - y0 > 150) p += `<path d="M${c},${y0 + 50}V${y1 - 50}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="22 20"/>`;
  let z = ''; for (let x = x0 + 6; x < x1 - 4; x += 12) z += `M${x},${y0 + 6}v26M${x},${y1 - 32}v26`;
  p += `<path d="${z}" stroke="${PAINT}" stroke-width="6"/>`;
  for (let y = y0 + 90; y < y1 - 60; y += 170) for (const x of [c - 70, c + 70]) p += `<ellipse cx="${x}" cy="${y}" rx="13" ry="6" fill="#6B5A44" stroke="${INK}" stroke-width="1"/>`;
  return p;
}
function square(cx, cy, hw, hh, circle = [150, 70]) {
  let p = rect(cx - hw, cy - hh, hw * 2, hh * 2, LAWN, `stroke="${INK}" stroke-width="1.8"`);
  p += `<path d="M${cx - hw},${cy - hh}L${cx + hw},${cy + hh}M${cx + hw},${cy - hh}L${cx - hw},${cy + hh}" stroke="${WALK}" stroke-width="40"/>`;
  p += `<path d="M${cx},${cy - hh}V${cy + hh}M${cx - hw},${cy}H${cx + hw}" stroke="${WALK}" stroke-width="52"/>`;
  p += `<ellipse cx="${cx}" cy="${cy}" rx="${circle[0]}" ry="${circle[1]}" fill="${WALK}" stroke="${INK}" stroke-width="1.6"/>`;
  p += tufts(cx - hw + 10, cy - hh + 10, hw * 2 - 20, hh * 2 - 20, Math.round(hw * hh / 230), (x, y) => Math.abs(x - cx) < 40 || Math.abs(y - cy) < 34);
  return p + rect(cx - hw, cy - hh, hw * 2, hh * 2, 'none', `stroke="${INK}" stroke-width="1.8"`);
}
function gardens(x0, x1, y0, y1) {   // front gardens with a low iron fence along the bottom
  let fence = ''; for (let x = x0; x <= x1; x += 12) fence += `M${x},${y1}v-8`;
  return rect(x0, y0, x1 - x0, y1 - y0, LAWN, `stroke="${INK}" stroke-width="1.6"`) + tufts(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12, Math.round((x1 - x0) * (y1 - y0) / 400)) + `<path d="M${x0},${y1 - 8}H${x1}" stroke="${INK}" stroke-width="1.4"/><path d="${fence}" stroke="${INK}" stroke-width="1.1"/>`;
}
function riverBand(side) {
  let s = rect(0, 0, W, 430, '#4F8FA8') + rect(0, 0, W, 54, '#7E9A6E') + lineH(54);
  let waves = ''; for (let i = 0; i < 650; i++) { const x = rnd() * W, y = 60 + rnd() * 360, w = 6 + rnd() * 14; waves += `M${f(x)},${f(y)}q${f(w / 2)},-3 ${f(w)},0`; }
  s += `<path d="${waves}" fill="none" stroke="#A9DCEA" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
  s += rect(0, 430, W, 470, '#D9C6A4') + lineH(430, 0, W, 2.2);
  let pav = ''; for (let y = 446; y < 900; y += 16) pav += `M0,${y}H${W}`;
  for (let y = 430, r = 0; y < 900; y += 16, r++) for (let x = (r % 2) * 16; x < W; x += 32) pav += `M${x},${y}v16`;
  s += `<path d="${pav}" stroke="#BFA984" stroke-width=".8"/>`;
  if (side === 'east') {   // Emmet Park on the bluff at the east end: a lawn strip with paths
    s += rect(1500, 440, 1200, 120, LAWN, `stroke="${INK}" stroke-width="1.6"`) + tufts(1506, 446, 1188, 108, 500) + `<path d="M1500,500H2700" stroke="${WALK}" stroke-width="22"/>`;
  } else {                 // the Plant Riverside plaza: a brick terrace by the water
    s += rect(80, 450, 900, 140, '#C9805E', `stroke="${INK}" stroke-width="1.6"`);
    let b = ''; for (let y = 462; y < 590; y += 12) b += `M80,${y}H980`; s += `<path d="${b}" stroke="#A9654A" stroke-width=".8"/>`;
  }
  s += rect(0, 900, W, 140, '#9C948A') + lineH(900) + lineH(1040);
  let cob = ''; for (let i = 0; i < 4800; i++) { const x = rnd() * W, y = 904 + rnd() * 132; cob += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2 + rnd() * 2)}" ry="${f(1.2 + rnd())}"/>`; }
  s += `<g fill="#B5ADA2" stroke="#7E776D" stroke-width=".5">${cob}</g>`;
  s += rect(0, 1040, W, 310, '#C9C2B2') + sidewalk(0, 1350, W, 50, 22);
  return s;
}
function build(side) {
  seed = side === 'west' ? 101 : 202;
  const NS = side === 'west' ? [700, 2100] : [840, 2240];
  const PARK_EDGE = side === 'west' ? 2905 : 75;          // Whitaker / Drayton along Forsyth Park
  let s = riverBand(side);
  // the plain bands first, then squares and gardens, then north-south streets, then cross streets on top
  s += sidewalk(0, 1480, W, 20, 10) + sidewalk(0, 1500, W, 1200);
  if (side === 'west') {          // City Market's brick continues west to Jefferson Street
    s += rect(2185, 1830, W - 2185, 870, '#C9805E') + lineH(1830, 2185, W);
    let brk = ''; for (let y = 1842; y < 2700; y += 12) brk += `M2185,${y}H${W}`;
    for (let y = 1830, r = 0; y < 2700; y += 12, r++) for (let x = 2185 + (r % 2) * 13; x < W; x += 26) brk += `M${x},${y}v12`;
    s += `<path d="${brk}" stroke="#A9654A" stroke-width=".8"/>`;
    s += square(1400, 2265, 520, 360);                    // Franklin Square
  } else {
    s += square(1540, 2265, 560, 360);                    // Reynolds Square
    s += square(2600, 2265, 300, 300, [90, 46]);           // Warren Square
  }
  s += sidewalk(0, 2780, W, 1260) + sidewalk(0, 4110, W, 450);
  if (side === 'west') {
    s += square(1400, 3655, 520, 325);                    // Chatham Square
    s += gardens(60, 560, 3340, 3980);
    s += gardens(2240, 2900, 3340, 3980);
  } else {
    // Colonial Park Cemetery: a big lawn with paths and old tombs
    s += rect(960, 3330, 1160, 670, '#7FAA4E', `stroke="${INK}" stroke-width="1.8"`) + tufts(966, 3336, 1148, 658, 2600);
    s += `<path d="M1540,3330V4000M960,3660H2120M1000,3360L2080,3970" stroke="#D9C6A4" stroke-width="30"/>`;
    s += square(2620, 3655, 280, 280, [80, 40]);           // Troup Square
    s += gardens(60, 690, 3340, 3980);
  }
  s += sidewalk(0, 4640, W, 830);
  if (side === 'west') {
    s += gardens(60, 610, 4690, 4990) + gardens(790, 2010, 4690, 4990) + gardens(2190, 2900, 4690, 4990);
    s += rect(1180, 5040, 420, 140, '#E7D3A6', `stroke="${INK}" stroke-width="1.6"`);   // a sandy pocket playground
  } else {
    s += square(1540, 4910, 450, 170, [120, 50]);          // Calhoun Square
    s += square(2620, 4910, 300, 170, [90, 44]);           // Whitefield Square
    s += gardens(60, 700, 4690, 4990);
  }
  // Victorian District blocks south of Gaston Street: front gardens behind each street
  for (const [y0, y1] of [[5542, 6200], [6270, 6900], [6970, 7520], [7590, H]]) {
    s += sidewalk(0, y0, W, y1 - y0);
    if (y1 - y0 > 200) {
      const segs = side === 'west' ? [[40, 600], [800, 2000], [2200, 2830]] : [[150, 760], [940, 2150], [2340, 2920]];
      for (const [a, b] of segs) s += gardens(a, b, y0 + 20, Math.min(y1 - 280, y0 + 300));
    }
  }
  s += sidewalk(0, 5200, W, 270);
  for (const c of NS) s += streetV(c, 1480, H);
  s += streetV(PARK_EDGE, 5470, H);            // Whitaker and Drayton start at Gaston Street, beside the park
  for (const [y, h] of [[1400, 80], [2700, 80], [3220, 70], [4040, 70], [4560, 80], [5470, 72], [6200, 70], [6900, 70], [7520, 70]]) s += streetH(y, h, y >= 5470 ? [...NS, PARK_EDGE] : NS);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-anchor="0 0" data-layer="ground" data-asset="environments/savannah/ground-${side}" data-author="original SVG, hand-composed with tools/author/savannah-wings.mjs, Waldo's Savannah 2026-11-16">\n${s}\n</svg>\n`;
}
for (const side of ['west', 'east']) writeFileSync(join(root, 'assets', 'environments', 'savannah', `ground-${side}.svg`), build(side));
console.log('wing grounds written');
