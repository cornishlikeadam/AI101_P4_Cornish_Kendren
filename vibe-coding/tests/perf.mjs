// Scripted 20 s pan-and-zoom tour of build/index.html; prints one JSON line per run for build-record/performance.md.
// usage: node vibe-coding/tests/perf.mjs [query ...]   (same PLAYWRIGHT_CORE / CHROME / HEADED env as the tests)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const here = dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + join(here, '..', 'build', 'index.html');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DPR = +(process.env.DPR || 1);
const queries = process.argv.slice(2).length ? process.argv.slice(2) : ['?seed=PERF-1&density=low', '?seed=PERF-1', '?seed=PERF-1&density=dense', '?seed=PERF-1&crowd=2000', '?seed=PERF-1&crowd=10000'];

const browser = await chromium.launch({ executablePath: CHROME, headless: !process.env.HEADED, args: (process.env.CHROME_ARGS || '--enable-gpu --use-angle=metal --ignore-gpu-blocklist --enable-gpu-rasterization').split(' ') });
for (const q of queries) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DPR });
  const t0 = Date.now();
  await page.goto(PAGE + q);
  await page.waitForFunction(() => document.title.startsWith('Forsyth'), null, { timeout: 120000 });
  const wall = Date.now() - t0;
  await page.click('#startBtn');
  const r = await page.evaluate(() => new Promise((resolve) => {
    const eng = WS.game.engine, cam = eng.camera, W = WS.game.world.w, H = WS.game.world.h;
    // keyframes: [t seconds, x, y, zoom]
    const K = [[0, W / 2, H / 2, 1], [3, 600, 700, 1.6], [6, 1600, 640, 3.5], [8, 2400, 1300, 2.5], [11, 2600, 1900, 3.5], [13, 1600, 2000, 1.2], [16, 800, 1300, 2.8], [18, 1600, 1200, 0.6], [20, W / 2, H / 2, 1]];
    const lerp = (a, b, u) => a + (b - a) * u;
    const dts = [];
    let start = 0, last = 0;
    function step(t) {
      if (!start) { start = t; last = t; }
      const s = (t - start) / 1000;
      dts.push(t - last); last = t;
      let i = 0; while (i < K.length - 2 && K[i + 1][0] < s) i++;
      const a = K[i], b = K[i + 1], u = Math.min(1, Math.max(0, (s - a[0]) / (b[0] - a[0]))), e = u * u * (3 - 2 * u);
      cam.centerOn(lerp(a[1], b[1], e), lerp(a[2], b[2], e), Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), e)));
      if (s < 20) requestAnimationFrame(step);
      else {
        dts.shift();
        const sorted = dts.slice().sort((x, y) => x - y);
        const avg = dts.reduce((x, y) => x + y, 0) / dts.length;
        const p95 = sorted[Math.floor(sorted.length * 0.95)], p99 = sorted[Math.floor(sorted.length * 0.99)];
        // pointer-to-feedback: synthetic click to the next painted frame with the marker
        const c = document.getElementById('scene'), rc = c.getBoundingClientRect();
        const t1 = performance.now();
        const opts = { clientX: rc.left + rc.width / 2, clientY: rc.top + rc.height / 2, pointerId: 9, bubbles: true, isPrimary: true };
        c.dispatchEvent(new PointerEvent('pointerdown', opts)); c.dispatchEvent(new PointerEvent('pointerup', opts));
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const gl = document.createElement('canvas').getContext('webgl');
          const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
          resolve({ frames: dts.length, avgFps: 1000 / avg, p95FrameMs: p95, p99FrameMs: p99, worstMs: sorted[sorted.length - 1], feedbackMs: performance.now() - t1,
            heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null, rasterMPx: WS.sprites.usedPx() / 1e6, sprites: WS.sprites.stats,
            gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown' });
        }));
      }
    }
    requestAnimationFrame(step);
  }));
  const t = await page.evaluate(() => WS.game.timings);
  console.log(JSON.stringify({ query: q, dpr: DPR, people: await page.evaluate(() => WS.game.world.people), loadMs: Math.round(t.loadMs), firstFrameMs: Math.round(t.firstFrameMs), wallMs: wall,
    avgFps: +r.avgFps.toFixed(1), p95FrameMs: +r.p95FrameMs.toFixed(1), p99FrameMs: +r.p99FrameMs.toFixed(1), worstMs: +r.worstMs.toFixed(1), feedbackMs: +r.feedbackMs.toFixed(1),
    heapMB: r.heapMB && +r.heapMB.toFixed(1), rasterMPx: +r.rasterMPx.toFixed(1), decoded: r.sprites.decoded, gpu: r.gpu, headless: !process.env.HEADED, host: `${os.cpus()[0].model}, ${os.platform()} ${os.release()}` }));
  await page.close();
}
await browser.close();
