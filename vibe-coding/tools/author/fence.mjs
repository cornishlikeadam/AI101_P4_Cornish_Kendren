// Author-time helper: fills <!--FENCE_BACK--> and <!--FENCE_FRONT--> markers in an SVG
// with an elliptical wrought-iron fence (posts, two rails, spear finials).
// usage: node fence.mjs <file.svg> cx cy rx ry posts height
import { readFileSync, writeFileSync } from 'node:fs';

const [file, ...nums] = process.argv.slice(2);
const [cx, cy, rx, ry, n, h] = nums.map(Number);
const f = (v) => +v.toFixed(1);
const back = [], front = [];
for (let i = 0; i < n; i++) {
  const a = (i / n) * Math.PI * 2;
  const x = f(cx + Math.cos(a) * rx), y = f(cy + Math.sin(a) * ry);
  const top = f(y - h);
  const post = `<path d="M${x},${y} V${top}"/><path class="fence-top" stroke="none" d="M${f(x - 1.8)},${top} L${x},${f(top - 4.5)} L${f(x + 1.8)},${top} Z"/>`;
  (Math.sin(a) < 0 ? back : front).push(post);
}
const rail = (dy, sweep) => `<path d="M${cx - rx},${f(cy - dy)} A${rx},${ry} 0 0,${sweep} ${cx + rx},${f(cy - dy)}"/>`;
const backSvg = rail(3, 1) + rail(h - 2, 1) + back.join('');
const frontSvg = rail(3, 0) + rail(h - 2, 0) + front.join('');
let svg = readFileSync(file, 'utf8');
svg = svg.replace(/<!--FENCE_BACK-->[\s\S]*?(?=<\/g>)/, '<!--FENCE_BACK-->' + backSvg).replace(/<!--FENCE_FRONT-->[\s\S]*?(?=<\/g>)/, '<!--FENCE_FRONT-->' + frontSvg);
writeFileSync(file, svg);
console.log(`fence: ${back.length} back posts, ${front.length} front posts`);
