#!/usr/bin/env node
/*
 * Repository ingest for the Build Lab.
 *
 * Reads the Waldo's Savannah checkout this lab sits in (read-only) and writes:
 *   - src/seed/repo-snapshot.json  : documents, asset metadata, screenshots, tests, computed facts
 *   - public/repo/build/            : a copy of the deployable game, for live previews and benchmarks
 *   - public/repo/v1/               : the archived version 1 game, for baseline previews
 *   - public/repo/src/              : the game's own character composer, factory and PRNG
 *   - public/repo/evidence/         : PNG screenshots from build-record/
 *
 * It never writes inside vibe-coding/. Every fact it records carries the file and line it was read from,
 * and a fact whose check fails is recorded as failing, not dropped.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LAB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(LAB, '..');
const GAME = path.join(ROOT, 'vibe-coding');
const OUT_JSON = path.join(LAB, 'src/seed/repo-snapshot.json');
const PUB = path.join(LAB, 'public/repo');

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, 'utf8');
const sha = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);

function walk(dir, filter = () => true, out = []) {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, filter, out);
    else if (filter(p)) out.push(p);
  }
  return out;
}
function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
function git(cmd) {
  try { return execSync('git ' + cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
}

if (!exists(GAME)) {
  console.error('[ingest] vibe-coding/ not found next to lab/. The lab still runs; the audit will show the import flow only.');
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify({ available: false, generatedAt: new Date().toISOString() }));
  process.exit(0);
}

// ---------- documents ----------
const DOC_PATHS = [
  'README.md', 'AGENTS.md', 'HARNESS.md', 'HANDOFF.md',
  ...walk(GAME, (p) => p.endsWith('.md')).map(rel),
];
const docs = [...new Set(DOC_PATHS)].filter((p) => exists(path.join(ROOT, p))).map((p) => {
  const buf = fs.readFileSync(path.join(ROOT, p));
  const text = buf.toString('utf8');
  const lines = text.split('\n');
  const headings = lines.map((l, i) => ({ l, i })).filter(({ l }) => /^#{1,3} /.test(l)).map(({ l, i }) => ({ level: l.match(/^#+/)[0].length, text: l.replace(/^#+ /, ''), line: i + 1 }));
  return { path: p, bytes: buf.length, sha: sha(buf), lines: lines.length, title: headings[0]?.text ?? p, headings, text: text.length > 90000 ? text.slice(0, 90000) + '\n\n[truncated by ingest at 90 KB]' : text };
});

// ---------- source files ----------
const sourceFiles = walk(GAME, (p) => /\.(js|mjs|html|py)$/.test(p) && !p.includes('/build/js/') && !p.includes('build-record'))
  .map((p) => ({ path: rel(p), lines: read(p).split('\n').length, bytes: fs.statSync(p).size }));

// ---------- assets (from the packed bundle, which is what the game actually loads) ----------
const bundlePath = path.join(GAME, 'build/js/assets.bundle.js');
let bundle = { artVersion: null, svg: {}, meta: {} };
if (exists(bundlePath)) {
  const ctx = { window: {} };
  vm.runInNewContext(read(bundlePath), ctx);
  bundle = ctx.window.WS_ASSETS;
}
const registerDoc = exists(path.join(GAME, 'sources/asset-register.md')) ? read(path.join(GAME, 'sources/asset-register.md')) : '';
const register = {};
registerDoc.split('\n').forEach((line, i) => {
  const m = line.match(/^\|\s*`assets\/([^`]+)\.svg`\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/);
  if (m) register[m[1]] = { origin: m[2].trim(), author: m[3].trim(), permission: m[4].trim(), line: i + 1 };
});
const svgFiles = walk(path.join(GAME, 'assets'), (p) => p.endsWith('.svg'));
const assets = svgFiles.map((p) => {
  const id = rel(p).replace(/^vibe-coding\/assets\//, '').replace(/\.svg$/, '');
  const m = bundle.meta?.[id] ?? null;
  const svg = read(p);
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1]?.split(/[\s,]+/).map(Number) ?? null;
  return {
    id, file: rel(p), bytes: fs.statSync(p).size, sha: sha(svg),
    category: id.split('/').slice(0, 2).join('/'),
    inBundle: Boolean(bundle.svg?.[id]),
    viewBox: m?.viewBox ?? vb, anchor: m?.anchor ?? null, slots: m?.slots ?? [], traits: m?.traits ?? [],
    head: m?.head ?? null, kit: m?.kit ?? null, hats: m?.hats ?? null, author: m?.author ?? null,
    register: register[id] ?? null,
  };
});

// ---------- evidence screenshots ----------
function pngSize(p) {
  const b = fs.readFileSync(p);
  if (b.length > 24 && b.toString('ascii', 1, 4) === 'PNG') return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  return { width: null, height: null };
}
const evidence = walk(path.join(GAME, 'build-record'), (p) => p.endsWith('.png')).map((p) => {
  const r = rel(p);
  const local = 'repo/evidence/' + r.replace(/^vibe-coding\/build-record\//, '');
  copy(p, path.join(LAB, 'public', local));
  return { path: r, url: local, bytes: fs.statSync(p).size, folder: r.split('/').slice(-2, -1)[0], name: path.basename(p, '.png'), ...pngSize(p) };
});

// ---------- runtime copies for live previews ----------
fs.rmSync(path.join(PUB, 'build'), { recursive: true, force: true });
for (const p of walk(path.join(GAME, 'build'))) copy(p, path.join(PUB, 'build', path.relative(path.join(GAME, 'build'), p)));
const v1 = path.join(GAME, 'docs/history/index-v1.html');
if (exists(v1)) copy(v1, path.join(PUB, 'v1/index.html'));
// The game's own composer, factory, PRNG and scene builder. The lab loads them as classic scripts, exactly
// as the game does, so previews and baseline layouts come from the real code, not a re-implementation.
const RUNTIME = ['src/utilities/rng.js', 'src/characters/compose.js', 'src/characters/make.js', 'src/scenes/build.js', 'src/scenes/streets.js',
  'src/scenes/riverfront.js', 'src/scenes/market.js', 'src/scenes/squares.js', 'src/scenes/monterey.js', 'src/scenes/forsyth.js', 'src/scenes/savannah.js'];
fs.rmSync(path.join(PUB, 'src'), { recursive: true, force: true });
for (const f of RUNTIME) if (exists(path.join(GAME, f))) copy(path.join(GAME, f), path.join(PUB, f));

// ---------- tests ----------
const testFile = path.join(GAME, 'tests/illustrated.test.mjs');
const tests = exists(testFile)
  ? read(testFile).split('\n').map((l, i) => ({ m: l.match(/^await test\('([^']+)'/), line: i + 1 })).filter((x) => x.m).map((x) => ({ name: x.m[1], file: rel(testFile), line: x.line }))
  : [];

// ---------- performance tables (documented claims, not lab measurements) ----------
const perfDoc = path.join(GAME, 'build-record/performance.md');
const perfTables = [];
if (exists(perfDoc)) {
  let heading = '', header = null, rows = [], start = 0;
  const flush = () => { if (header && rows.length) perfTables.push({ heading, header, rows, line: start }); header = null; rows = []; };
  read(perfDoc).split('\n').forEach((l, i) => {
    if (/^#{1,3} /.test(l)) { flush(); heading = l.replace(/^#+ /, ''); }
    else if (l.startsWith('|')) {
      const cells = l.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) return;
      if (!header) { header = cells; start = i + 1; } else rows.push(cells);
    } else flush();
  });
  flush();
}

// ---------- districts (savannah blueprint table) ----------
const districts = [];
const bp = path.join(GAME, 'docs/savannah-blueprint.md');
if (exists(bp)) read(bp).split('\n').forEach((l, i) => {
  const m = l.match(/^\|\s*(\d+)–(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*`([^`]+)`/);
  if (m) districts.push({ y0: +m[1], y1: +m[2], name: m[3].trim(), contents: m[4].trim(), source: m[5], doc: rel(bp), line: i + 1 });
});

// ---------- computed facts ----------
function findLine(file, re) {
  const p = path.join(ROOT, file);
  if (!exists(p)) return null;
  const lines = read(p).split('\n');
  const i = lines.findIndex((l) => re.test(l));
  return i < 0 ? null : { path: file, line: i + 1, text: lines[i].trim().slice(0, 200) };
}
const facts = [];
function fact(id, area, claim, evidenceFns, okFn) {
  const ev = evidenceFns.map((f) => f()).filter(Boolean);
  const ok = okFn ? okFn(ev) : ev.length === evidenceFns.length;
  facts.push({ id, area, claim, ok, evidence: ev });
}
const ext = (() => {
  const files = ['vibe-coding/build/index.html', 'vibe-coding/build/js/game.js'];
  const hits = [];
  for (const f of files) {
    read(path.join(ROOT, f)).split('\n').forEach((l, i) => {
      for (const u of l.match(/https?:\/\/[^\s"'`)]+/g) || []) if (!/w3\.org\/(2000|1999)/.test(u)) hits.push({ path: f, line: i + 1, text: u });
    });
  }
  return hits;
})();
fact('F-ENTRY', 'Build', 'build/index.html loads the packed asset bundle and the joined game script from build/js/.',
  [() => findLine('vibe-coding/build/index.html', /assets\.bundle\.js/), () => findLine('vibe-coding/build/index.html', /js\/game\.js/)]);
facts.push({ id: 'F-OFFLINE', area: 'Privacy', claim: 'No http(s) URL appears in build/index.html or build/js/game.js (SVG namespace URIs excluded).', ok: ext.length === 0, evidence: ext.length ? ext.slice(0, 5) : [{ path: 'vibe-coding/build/index.html', line: null, text: '0 matches for https?:// outside SVG namespaces' }] });
fact('F-RENDERER', 'Engine', 'The renderer is Canvas 2D drawing pre-rasterized SVG sprites.',
  [() => findLine('vibe-coding/src/engine/engine.js', /getContext\('2d'/), () => findLine('vibe-coding/src/engine/sprites.js', /Blob|createObjectURL|drawImage/)]);
fact('F-RNG', 'Determinism', 'Seeded Mulberry32 PRNG, seeded from an FNV-1a hash of the full replay identity.',
  [() => findLine('vibe-coding/src/utilities/rng.js', /function mulberry32/), () => findLine('vibe-coding/src/utilities/rng.js', /identityKey/)]);
fact('F-WORLD', 'Scenes', 'The default scene is one continuous 3200 × 7600 world of five districts joined by Bull Street with crowd budgets low 450, standard 900, dense 1,500.',
  [() => findLine('vibe-coding/src/scenes/savannah.js', /w: 3200, h: 7600/), () => findLine('vibe-coding/src/scenes/savannah.js', /budget: \{ low: 450/)]);
fact('F-DECOY-CAP', 'Gameplay', 'The character factory throws rather than produce a non-target with more than two target traits.',
  [() => findLine('vibe-coding/src/characters/make.js', /decoy cap broken/)]);
fact('F-TARGET-COLOURS', 'Gameplay', 'Target trousers #1E88E5 and stick #8D6E63 are defined in the character factory.',
  [() => findLine('vibe-coding/src/characters/make.js', /TARGET_BLUE = '#1E88E5', TARGET_STICK = '#8D6E63'/)]);
fact('F-CLICK', 'Input', 'A tap counts only if a single pointer travelled under 6 CSS px.',
  [() => findLine('vibe-coding/src/engine/input.js', /CLICK_PX = 6/)]);
fact('F-LEADERBOARD', 'Gameplay', 'Local leaderboard uses key waldos_savannah_leaderboard_v1 with at most 10 records, sorted by points.',
  [() => findLine('vibe-coding/src/gameplay/leaderboard.js', /waldos_savannah_leaderboard_v1', MAX = 10/), () => findLine('vibe-coding/src/gameplay/leaderboard.js', /const sort/)]);
fact('F-PARAMS', 'Gameplay', 'URL identity reads seed, scene, difficulty, density, crowd (clamped 20 to 10,000), beacon and fallback.',
  [() => findLine('vibe-coding/src/gameplay/round.js', /Math\.max\(20, Math\.min\(10000/), () => findLine('vibe-coding/src/gameplay/round.js', /beacon: q\.get\('beacon'\)/), () => findLine('vibe-coding/src/gameplay/round.js', /fallback: q\.get\('fallback'\)/)]);
fact('F-REDUCED-MOTION', 'Accessibility', 'prefers-reduced-motion freezes world motion.',
  [() => findLine('vibe-coding/src/engine/engine.js', /prefers-reduced-motion: reduce/)]);
fact('F-V1-ARCHIVED', 'History', 'The version 1 procedural game is archived unchanged at docs/history/index-v1.html.',
  [() => (exists(v1) ? { path: rel(v1), line: null, text: `${read(v1).split('\n').length} lines` } : null)]);
const archetypes = assets.filter((a) => a.id.startsWith('characters/archetypes/'));
facts.push({ id: 'F-ASSETS', area: 'Art', claim: `${svgFiles.length} SVG source files in vibe-coding/assets/, ${Object.keys(bundle.svg || {}).length} packed into the bundle at art version ${bundle.artVersion}. ${archetypes.length} archetype drawings.`, ok: svgFiles.length > 0, evidence: [{ path: 'vibe-coding/build/js/assets.bundle.js', line: 2, text: `artVersion ${bundle.artVersion}` }] });
const unregistered = assets.filter((a) => !a.register).map((a) => a.file);
facts.push({ id: 'F-REGISTER', area: 'Provenance', claim: 'Every SVG asset has a row in sources/asset-register.md.', ok: unregistered.length === 0, evidence: unregistered.length ? unregistered.slice(0, 8).map((f) => ({ path: f, line: null, text: 'no register row found' })) : [{ path: 'vibe-coding/sources/asset-register.md', line: null, text: `${Object.keys(register).length} rows matched` }] });
facts.push({ id: 'F-TESTS', area: 'QA', claim: `${tests.length} Playwright checks are declared in tests/illustrated.test.mjs (declared, not run by the lab).`, ok: tests.length > 0, evidence: tests.slice(0, 3).map((t) => ({ path: t.file, line: t.line, text: t.name })) });

// ---------- git ----------
const gitInfo = {
  head: git('rev-parse --short HEAD'), branch: git('branch --show-current'),
  subject: git('log -1 --format=%s'), date: git('log -1 --format=%cI'),
  dirty: (git('status --porcelain -- vibe-coding') || '').length > 0,
  remote: git('remote get-url origin'),
};

const snapshot = {
  available: true,
  generatedAt: new Date().toISOString(),
  git: gitInfo,
  artVersion: bundle.artVersion,
  docs, sourceFiles, assets, evidence, tests, perfTables, districts, facts,
  counts: { docs: docs.length, assets: assets.length, archetypes: archetypes.length, evidence: evidence.length, tests: tests.length },
};
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(snapshot));
const failing = facts.filter((f) => !f.ok).map((f) => f.id);
console.log(`[ingest] ${docs.length} docs, ${assets.length} assets, ${evidence.length} screenshots, ${tests.length} tests, ${facts.length} facts (${failing.length ? 'failing: ' + failing.join(', ') : 'all checks found'}). HEAD ${gitInfo.head}.`);
