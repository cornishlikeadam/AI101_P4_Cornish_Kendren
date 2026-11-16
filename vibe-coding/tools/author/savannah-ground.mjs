// Author-time helper for environments/savannah/ground.svg: the whole 3200 x 7600 city in one ground plan.
// North to south, following the real order along Bull Street (distances simplified):
//   River Street and the Festival Pier (y 0-1400), Bay Street and City Hall (1400-1500),
//   City Market west of Bull and Johnson Square east of it (1500-2950, Congress Street at 2700),
//   Harris Street with Pulaski Square (west) and Lafayette Square (east) (2950-4300, Charlton Street at 4040),
//   Jones Street and Monterey Square on Bull (4300-5200), then Forsyth Park from Gaston Street (5200-7600).
// Bull Street runs north-south at x = 1600 through every district and meets the Forsyth north gate.
// Layout is hand-placed; the script scatters texture (waves, cobbles, pavers, grass). Constants mirror src/scenes/*.js.
// usage: node tools/author/savannah-ground.mjs > assets/environments/savannah/ground.svg
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = 3200, H = 7600, MONTEREY = 4300, FORSYTH = 5200;
const BULL = { x0: 1545, x1: 1655, s0: 1515, s1: 1685 };   // road and sidewalk edges of Bull Street
let seed = 99;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (v) => +v.toFixed(1);
const INK = '#2B1D16', ASPHALT = '#7E776D', WALK = '#E8D6B0', JOINT = '#CDB68A', CURB = '#C9C2B2', PAINT = '#F4F0E4';
let s = '';
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line = (y, x0 = 0, x1 = W, sw = 1.6) => `<path d="M${x0},${y}H${x1}" stroke="${INK}" stroke-width="${sw}"/>`;

// ---- street furniture painted on the ground ----
function sidewalk(x, y, w, h, step = 22) {
  let p = rect(x, y, w, h, WALK), j = '';
  for (let yy = y + step; yy < y + h; yy += step) j += `M${x},${yy}h${w}`;
  for (let xx = x + step; xx < x + w; xx += step) j += `M${xx},${y}v${h}`;
  return p + `<path d="${j}" stroke="${JOINT}" stroke-width=".7" opacity=".7"/>`;
}
// An east-west street: curbs, a dashed centre line, painted parking bays along both curbs, and the odd
// manhole cover. Crosswalk stripes are added where Bull Street crosses.
function streetH(y, h = 80) {
  let p = rect(0, y, W, h, ASPHALT) + line(y) + line(y + h);
  p += `<path d="M0,${y + 2}H${W}M0,${y + h - 2}H${W}" stroke="${CURB}" stroke-width="3"/>`;
  p += `<path d="M0,${y + h / 2}H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>`;
  let bays = '';
  for (let x = 40; x < W; x += 92) { if (x > BULL.s0 - 80 && x < BULL.s1 + 40) continue; bays += `M${x},${y + 4}v12M${x},${y + h - 4}v-12`; }
  p += `<path d="${bays}" stroke="${PAINT}" stroke-width="1.6" opacity=".8"/>`;
  for (let i = 0; i < 4; i++) { const x = 200 + rnd() * 2800; if (Math.abs(x - 1600) > 160) p += `<ellipse cx="${f(x)}" cy="${y + h / 2 + 12}" rx="9" ry="4" fill="#5E5850" stroke="${INK}" stroke-width=".8"/>`; }
  p += crossH(y, h);
  return p;
}
// zebra stripes across an east-west street on both sides of Bull Street
function crossH(y, h) {
  let z = '';
  for (const x0 of [BULL.s0 - 40, BULL.s1 + 6]) for (let yy = y + 6; yy < y + h - 4; yy += 10) z += `M${x0},${yy}h34`;
  return `<path d="${z}" stroke="${PAINT}" stroke-width="5"/>`;
}
// Bull Street between two cross streets: sidewalks, curbs, centre line, a crosswalk at each end.
function bull(y0, y1, opts = {}) {
  let p = sidewalk(BULL.s0, y0, BULL.x0 - BULL.s0, y1 - y0) + sidewalk(BULL.x1, y0, BULL.s1 - BULL.x1, y1 - y0);
  p += rect(BULL.x0, y0, BULL.x1 - BULL.x0, y1 - y0, ASPHALT);
  p += `<path d="M${BULL.x0},${y0}V${y1}M${BULL.x1},${y0}V${y1}" stroke="${INK}" stroke-width="1.6"/><path d="M${BULL.x0 + 2},${y0}V${y1}M${BULL.x1 - 2},${y0}V${y1}" stroke="${CURB}" stroke-width="3"/>`;
  p += `<path d="M${BULL.s0},${y0}V${y1}M${BULL.s1},${y0}V${y1}" stroke="${INK}" stroke-width="1.2" opacity=".6"/>`;
  if (y1 - y0 > 150) p += `<path d="M1600,${y0 + 50}V${y1 - 50}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="22 20"/>`;
  let z = '';
  if (!opts.noTop) for (let x = BULL.x0 + 6; x < BULL.x1 - 4; x += 12) z += `M${x},${y0 + 6}v26`;
  if (!opts.noBottom) for (let x = BULL.x0 + 6; x < BULL.x1 - 4; x += 12) z += `M${x},${y1 - 32}v26`;
  p += `<path d="${z}" stroke="${PAINT}" stroke-width="6"/>`;
  // tree pits along the sidewalks (the oaks themselves are sprites)
  for (let y = y0 + 90; y < y1 - 60; y += 170) for (const x of [BULL.s0 + 15, BULL.s1 - 15]) p += `<ellipse cx="${x}" cy="${y}" rx="13" ry="6" fill="#6B5A44" stroke="${INK}" stroke-width="1"/>`;
  return p;
}
const tufts = (x0, y0, w, h, n, skip = () => false) => {
  let t = '';
  for (let i = 0; i < n; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h; if (skip(x, y)) continue; t += `M${f(x)},${f(y)}l-1.5,-3M${f(x)},${f(y)}l.8,-3.6M${f(x)},${f(y)}l1.6,-2.4`; }
  return `<path d="${t}" fill="none" stroke="#5E8F3E" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>`;
};
// A city square: lawn, diagonal and cross paths, a central circle, a low iron rail.
function square(cx, cy, hw, hh, circle = [170, 80]) {
  let p = rect(cx - hw, cy - hh, hw * 2, hh * 2, '#8DBA5A', `stroke="${INK}" stroke-width="1.8"`);
  p += `<path d="M${cx - hw},${cy - hh}L${cx + hw},${cy + hh}M${cx + hw},${cy - hh}L${cx - hw},${cy + hh}" stroke="${WALK}" stroke-width="44"/>`;
  p += `<path d="M${cx},${cy - hh}V${cy + hh}M${cx - hw},${cy}H${cx + hw}" stroke="${WALK}" stroke-width="56"/>`;
  p += `<ellipse cx="${cx}" cy="${cy}" rx="${circle[0]}" ry="${circle[1]}" fill="${WALK}" stroke="${INK}" stroke-width="1.6"/>`;
  p += tufts(cx - hw + 10, cy - hh + 10, hw * 2 - 20, hh * 2 - 20, Math.round(hw * hh / 230), (x, y) => Math.abs(x - cx) < 40 || Math.abs(y - cy) < 34 || ((x - cx) / circle[0]) ** 2 + ((y - cy) / circle[1]) ** 2 < 1.1);
  p += rect(cx - hw, cy - hh, hw * 2, hh * 2, 'none', `stroke="${INK}" stroke-width="1.8"`);
  let rail = ''; for (let x = cx - hw + 8; x < cx + hw; x += 14) { if (Math.abs(x - cx) < 34) continue; rail += `M${x},${cy + hh}v-7`; }
  p += `<path d="M${cx - hw},${cy + hh - 7}H${cx - 30}M${cx + 30},${cy + hh - 7}H${cx + hw}" stroke="${INK}" stroke-width="1.4"/><path d="${rail}" stroke="${INK}" stroke-width="1.2"/>`;
  return p;
}

// ---- River Street and Festival Pier ----
s += rect(0, 0, W, 430, '#4F8FA8');
s += rect(0, 0, W, 54, '#7E9A6E') + line(54);
let waves = '';
for (let i = 0; i < 700; i++) { const x = rnd() * W, y = 60 + rnd() * 360, w = 6 + rnd() * 14; waves += `M${f(x)},${f(y)}q${f(w / 2)},-3 ${f(w)},0`; }
s += `<path d="${waves}" fill="none" stroke="#A9DCEA" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
s += rect(0, 430, W, 470, '#D9C6A4') + line(430, 0, W, 2.2);
let pav = '';
for (let y = 446; y < 900; y += 16) pav += `M0,${y}H${W}`;
for (let y = 430, r = 0; y < 900; y += 16, r++) for (let x = (r % 2) * 16; x < W; x += 32) pav += `M${x},${y}v16`;
s += `<path d="${pav}" stroke="#BFA984" stroke-width=".8"/>`;
s += rect(2000, 250, 1160, 190, '#B98A5E', `stroke="${INK}" stroke-width="2"`);
let planks = ''; for (let x = 2000; x < 3160; x += 14) planks += `M${x},250v190`;
s += `<path d="${planks}" stroke="#9C7048" stroke-width="1"/>`;
for (let x = 2010; x < 3160; x += 60) s += `<rect x="${x}" y="440" width="8" height="10" fill="#6B4A33" stroke="${INK}" stroke-width="1"/>`;
s += rect(0, 900, W, 140, '#9C948A') + line(900) + line(1040);
let cob = ''; for (let i = 0; i < 5200; i++) { const x = rnd() * W, y = 904 + rnd() * 132; cob += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2 + rnd() * 2)}" ry="${f(1.2 + rnd())}"/>`; }
s += `<g fill="#B5ADA2" stroke="#7E776D" stroke-width=".5">${cob}</g>`;
s += rect(0, 1040, W, 310, '#C9C2B2');
// Factors Walk sidewalk and Bay Street
s += sidewalk(0, 1350, W, 50);
s += streetH(1400, 80);
s += sidewalk(0, 1480, W, 20, 10);

// ---- Bay Street to Congress Street: City Market (west of Bull) and Johnson Square (east) ----
s += sidewalk(0, 1500, W, 330, 26);
s += rect(0, 1830, BULL.s0, 870, '#C9805E') + line(1830, 0, BULL.s0);
let brk = ''; for (let y = 1842; y < 2700; y += 12) brk += `M0,${y}H${BULL.s0}`;
for (let y = 1830, r = 0; y < 2700; y += 12, r++) for (let x = (r % 2) * 13; x < BULL.s0; x += 26) brk += `M${x},${y}v12`;
s += `<path d="${brk}" stroke="#A9654A" stroke-width=".8"/>`;
for (const x of [380, 1300]) s += `<ellipse cx="${x}" cy="2440" rx="90" ry="36" fill="#8DBA5A" stroke="${INK}" stroke-width="1.6"/>`;
// Johnson Square: Savannah's first square, with the Greene Monument obelisk at its centre
s += sidewalk(BULL.s1, 1830, W - BULL.s1, 870, 24);
s += square(2450, 2265, 650, 385, [150, 70]);
s += bull(1480, 2700, { noTop: false });
s += streetH(2700, 80);
s += sidewalk(0, 2780, W, 170, 24);

// ---- Harris Street with Pulaski Square (west) and Lafayette Square (east) ----
s += sidewalk(0, 2950, W, 270, 26);
s += streetH(3220, 70);
s += sidewalk(0, 3290, W, 750, 30);
s += square(900, 3655, 520, 325);
s += square(2300, 3655, 520, 325);
s += bull(2780, 3220) + bull(3290, 4040);
s += streetH(4040, 70);
s += sidewalk(0, 4110, W, 190, 26);
s += bull(4110, 4560);

// ---- Jones Street and Monterey Square ----
s += sidewalk(0, MONTEREY, W, 260, 26);           // behind the Jones Street row (visible only at Bull)
s += streetH(4560, 80);
s += sidewalk(0, 4640, W, 560, 26);
// front gardens of the houses facing the square, with low iron fences
for (const [x0, x1] of [[90, 1060], [2140, 3110]]) {
  s += rect(x0, 4690, x1 - x0, 300, '#8DBA5A', `stroke="${INK}" stroke-width="1.6"`) + tufts(x0 + 6, 4696, x1 - x0 - 12, 288, 700);
  let fence = ''; for (let x = x0; x <= x1; x += 12) fence += `M${x},4990v-8`;
  s += `<path d="M${x0},4982H${x1}" stroke="${INK}" stroke-width="1.4"/><path d="${fence}" stroke="${INK}" stroke-width="1.1"/>`;
}
// Bull Street wraps around the square: a paved ring road with crosswalks
s += rect(1080, 4680, 1040, 460, ASPHALT, `stroke="${INK}" stroke-width="1.6"`);
s += square(1600, 4910, 450, 170, [130, 54]);
s += `<path d="M1080,4910H1150M2050,4910H2120" stroke="${PAINT}" stroke-width="22" stroke-dasharray="5 7"/>`;
s += bull(4640, 4680, { noTop: true, noBottom: true }) + bull(5140, FORSYTH, { noTop: true, noBottom: true });

// ---- Forsyth Park, embedded unchanged and moved south ----
const fg = readFileSync(join(root, 'assets', 'environments', 'forsyth', 'ground.svg'), 'utf8');
const inner = fg.slice(fg.indexOf('>', fg.indexOf('<svg')) + 1, fg.lastIndexOf('</svg>')).replace(/id="lawn"/g, 'id="forsyth-lawn"').replace(/url\(#lawn\)/g, 'url(#forsyth-lawn)');
s += `<g transform="translate(0 ${FORSYTH})">${inner}</g>`;
// Bull Street's last block, between the Gaston Street houses, ends at the park's north gate
s += bull(FORSYTH, FORSYTH + 350, { noTop: true });

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-anchor="0 0" data-layer="ground" data-asset="environments/savannah/ground" data-author="original SVG, hand-composed with tools/author/savannah-ground.mjs, Waldo's Savannah 2026-11-15; Bull Street and Monterey Square added 2026-11-16">\n${s}\n</svg>\n`);
