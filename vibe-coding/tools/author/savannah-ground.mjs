// Author-time helper for environments/savannah/ground.svg: the whole 3200 x 6700 city in one ground plan.
// North to south: River Street and Festival Pier (y 0-1500), Bay Street and City Market (1500-2950),
// two Oglethorpe squares (2950-4300), Forsyth Park (4300-6700, embedded from environments/forsyth/ground.svg).
// Layout is hand-placed; the script scatters texture (waves, cobbles, pavers, grass). Constants mirror src/scenes/*.js.
// usage: node tools/author/savannah-ground.mjs > assets/environments/savannah/ground.svg
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = 3200, H = 6700, FORSYTH = 4300;
let seed = 99;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (v) => +v.toFixed(1);
const INK = '#2B1D16';
let s = '';
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line = (y, x0 = 0, x1 = W, sw = 1.6) => `<path d="M${x0},${y}H${x1}" stroke="${INK}" stroke-width="${sw}"/>`;

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
// Festival Pier: a plank deck out over the water
s += rect(2000, 250, 1160, 190, '#B98A5E', `stroke="${INK}" stroke-width="2"`);
let planks = ''; for (let x = 2000; x < 3160; x += 14) planks += `M${x},250v190`;
s += `<path d="${planks}" stroke="#9C7048" stroke-width="1"/>`;
for (let x = 2010; x < 3160; x += 60) s += `<rect x="${x}" y="440" width="8" height="10" fill="#6B4A33" stroke="${INK}" stroke-width="1"/>`;
// River Street cobbles
s += rect(0, 900, W, 140, '#9C948A') + line(900) + line(1040);
let cob = ''; for (let i = 0; i < 5200; i++) { const x = rnd() * W, y = 904 + rnd() * 132; cob += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2 + rnd() * 2)}" ry="${f(1.2 + rnd())}"/>`; }
s += `<g fill="#B5ADA2" stroke="#7E776D" stroke-width=".5">${cob}</g>`;
s += rect(0, 1040, W, 310, '#C9C2B2');
// Factors Walk sidewalk and Bay Street
s += rect(0, 1350, W, 50, '#E8D6B0') + line(1350);
s += rect(0, 1400, W, 80, '#7E776D') + line(1400) + line(1480) + `<path d="M0,1440H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>`;
s += rect(0, 1480, W, 20, '#E8D6B0');

// ---- Bay Street to City Market ----
s += rect(0, 1500, W, 330, '#F6E7C8');
s += rect(0, 1830, W, 870, '#C9805E') + line(1830);
let brk = ''; for (let y = 1842; y < 2700; y += 12) brk += `M0,${y}H${W}`;
for (let y = 1830, r = 0; y < 2700; y += 12, r++) for (let x = (r % 2) * 13; x < W; x += 26) brk += `M${x},${y}v12`;
s += `<path d="${brk}" stroke="#A9654A" stroke-width=".8"/>`;
for (const x of [500, 1100, 2100, 2700]) s += `<ellipse cx="${x}" cy="2380" rx="90" ry="36" fill="#8DBA5A" stroke="${INK}" stroke-width="1.6"/>`;
s += rect(0, 2700, W, 80, '#7E776D') + line(2700) + line(2780) + `<path d="M0,2740H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>`;
s += rect(0, 2780, W, 170, '#E8D6B0');

// ---- Oglethorpe squares ----
s += rect(0, 2950, W, 270, '#F6E7C8');
s += rect(0, 3220, W, 70, '#7E776D') + line(3220) + line(3290) + `<path d="M0,3255H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>`;
s += rect(0, 3290, W, 750, '#E8D6B0');
const squares = [[900, 3655], [2300, 3655]];
for (const [cx, cy] of squares) {
  s += rect(cx - 520, cy - 325, 1040, 650, '#8DBA5A', `stroke="${INK}" stroke-width="1.8"`);
  s += `<path d="M${cx - 520},${cy - 325}L${cx + 520},${cy + 325}M${cx + 520},${cy - 325}L${cx - 520},${cy + 325}" stroke="#E8D6B0" stroke-width="44"/>`;
  s += `<path d="M${cx},${cy - 325}V${cy + 325}M${cx - 520},${cy}H${cx + 520}" stroke="#E8D6B0" stroke-width="56"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="170" ry="80" fill="#E8D6B0" stroke="${INK}" stroke-width="1.6"/>`;
  s += rect(cx - 520, cy - 325, 1040, 650, 'none', `stroke="${INK}" stroke-width="1.8"`);
}
let tuft = ''; for (let i = 0; i < 2200; i++) { const x = 380 + rnd() * 2440, y = 3335 + rnd() * 640; if (Math.abs(x - 1600) < 190) continue; tuft += `M${f(x)},${f(y)}l-1.5,-3M${f(x)},${f(y)}l.8,-3.6M${f(x)},${f(y)}l1.6,-2.4`; }
s += `<path d="${tuft}" fill="none" stroke="#5E8F3E" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>`;
s += rect(0, 4040, W, 70, '#7E776D') + line(4040) + line(4110) + `<path d="M0,4075H${W}" stroke="#E9D9A6" stroke-width="2.4" stroke-dasharray="26 22"/>`;
s += rect(0, 4110, W, 190, '#E8D6B0');

// ---- Forsyth Park, embedded unchanged and moved south ----
const fg = readFileSync(join(root, 'assets', 'environments', 'forsyth', 'ground.svg'), 'utf8');
const inner = fg.slice(fg.indexOf('>', fg.indexOf('<svg')) + 1, fg.lastIndexOf('</svg>')).replace(/id="lawn"/g, 'id="forsyth-lawn"').replace(/url\(#lawn\)/g, 'url(#forsyth-lawn)');
s += `<g transform="translate(0 ${FORSYTH})">${inner}</g>`;

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-anchor="0 0" data-layer="ground" data-asset="environments/savannah/ground" data-author="original SVG, hand-composed with tools/author/savannah-ground.mjs, Waldo's Savannah 2026-11-15">\n${s}\n</svg>\n`);
