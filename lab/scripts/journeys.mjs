#!/usr/bin/env node
/* The brief's five acceptance journeys (A–E), driven through the UI in a fresh browser profile.
   Usage: node scripts/journeys.mjs <base-url> <out-dir>. Needs playwright-core and an installed Chrome.
   The SVG uploaded in journey B is a labelled test fixture written to <out-dir>; it never enters the repo. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5199/';
const out = path.resolve(process.argv[3] ?? 'journeys-out');
fs.mkdirSync(out, { recursive: true });
const fixture = path.join(out, 'test-fixture-candidate.svg');
fs.writeFileSync(fixture, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 104" width="64" height="104"><title>TEST FIXTURE (journey B), not artwork</title><g stroke="#2B1D16" stroke-width="1.2" stroke-linejoin="round"><path d="M24 100 L26 66 L38 66 L40 100 Z" fill="#3B3A48"/><path d="M18 68 Q32 40 46 68 Z" fill="#2F9C95"/><circle cx="32" cy="28" r="12" fill="#F1C7A0"/></g></svg>`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const results = [];
const go = async (hash) => { await page.goto(base + '#/' + hash); await page.waitForLoadState('networkidle'); await page.waitForTimeout(400); };
const saved = async () => { await page.waitForFunction(() => /Saved/.test(document.body.innerText), null, { timeout: 8000 }); await page.waitForTimeout(500); };
const shot = (n) => page.screenshot({ path: path.join(out, n + '.png') });
const field = (label) => page.getByLabel(label, { exact: true });
async function journey(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push([name, 'PASS', ((Date.now() - t0) / 1000).toFixed(1) + 's']); }
  catch (e) { results.push([name, 'FAIL', e.message.split('\n')[0]]); await shot('FAIL-' + name.slice(0, 1)); }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }

await go('command');

await journey('A · Challenge a disliked design rule', async () => {
  // a reference to attach
  await go('references');
  await page.getByLabel('Reference URL').fill('https://example.org/my-own-forsyth-photo');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByLabel('Title', { exact: true }).fill('Owner photo of Forsyth fountain (journey A)');
  await page.keyboard.press('Escape');
  await go('rules/dec_adrv003');
  expect(await page.getByText('No image files, downloaded models or external assets', { exact: false }).count() > 0, 'original rule not shown');
  await field('Proposed replacement').fill('Allow original local SVG and WebP assets with provenance rows (journey A edit).');
  await field('Design rationale').fill('Typed primitives cannot carry faces and folds (journey A rationale).');
  await page.getByRole('button', { name: '+ Link reference' }).click();
  await page.getByRole('dialog').getByText('Owner photo of Forsyth fountain (journey A)').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: '+ Link sprint' }).click();
  await page.getByRole('dialog').getByText('Sprint 01 · Replace', { exact: false }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
  await saved();
  await page.reload(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
  expect((await field('Proposed replacement').inputValue()).includes('journey A edit'), 'replacement did not persist');
  expect((await field('Design rationale').inputValue()).includes('journey A rationale'), 'rationale did not persist');
  expect(await page.getByRole('link', { name: /Owner photo of Forsyth fountain/ }).count() > 0, 'reference link did not persist');
  expect(await page.getByRole('link', { name: /Sprint 01/ }).count() > 0, 'sprint link did not persist');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export as ADR' }).click()]);
  const p = path.join(out, dl.suggestedFilename()); await dl.saveAs(p);
  const md = fs.readFileSync(p, 'utf8');
  expect(/^ADR-00[3-9]-/.test(dl.suggestedFilename()), 'ADR number should follow the repo ADRs: ' + dl.suggestedFilename());
  expect(md.includes('## Original rule') && md.includes('journey A edit') && md.includes('not approved'), 'ADR content incomplete');
  await shot('A-rules');
});

await journey('B · Fix character quality', async () => {
  await go('characters/chr_search-decoys-and-crowd-bodies');
  await page.waitForTimeout(1500);
  await page.locator('[aria-label="Upload a replacement SVG or raster"] input[type=file]').setInputFiles(fixture);
  await page.waitForTimeout(1200);
  expect(await page.getByText('test-fixture-candidate (Candidate)').count() > 0, 'candidate not listed in subject picker');
  for (const z of ['100%', '200%', '400%']) { await page.getByRole('button', { name: z, exact: true }).click(); await page.waitForTimeout(200); }
  const h = await page.locator('canvas[aria-label$="at 400%"]').evaluate((c) => c.getBoundingClientRect().height);
  expect(h > 380, 'preview not at 400% (height ' + h + ')');
  await page.getByRole('button', { name: 'Save gameplay-scale capture' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('link', { name: 'Review', exact: true }).first().click();
  await page.waitForTimeout(1200);
  for (const g of await page.getByRole('radiogroup').all()) {
    const label = await g.getAttribute('aria-label');
    if (/,|Pin/.test(label ?? '')) continue;
    const pass = g.getByRole('radio', { name: '✓ Pass' });
    if (await pass.count()) await pass.click(); else await g.getByRole('radio', { name: '4 of 5' }).click();
  }
  await page.getByRole('button', { name: /Attach the candidate's 1 capture/ }).click();
  await page.waitForTimeout(400);
  expect(await page.getByText('Pass', { exact: true }).first().isVisible(), 'review verdict is not Pass');
  await shot('B-review');
  await go('characters/chr_search-decoys-and-crowd-bodies');
  await page.waitForTimeout(800);
  await page.getByRole('link', { name: 'Compare with current' }).first().click();
  await page.waitForURL(/#\/compare\/cmp_/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  page.once('dialog', (d) => d.accept('Fixture torso reads as a cone at 1x (journey B)'));
  await page.locator('figure img').first().click({ position: { x: 40, y: 60 } });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: '→ Issue' }).first().click();
  await page.waitForTimeout(400);
  expect(await page.getByRole('link', { name: /VIS-011/ }).count() > 0, 'pin did not become an issue');
  await shot('B-compare');
  await go('characters/chr_search-decoys-and-crowd-bodies');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  await page.waitForTimeout(400);
  expect(await page.getByText('✓ Approved').count() > 0, 'candidate not approved');
  await go('sprints/spr_s01');
  const gates = await page.locator('text=/gates met|✓/').count();
  await go('export?character=chr_search-decoys-and-crowd-bodies&sprint=spr_s01');
  await page.getByRole('button', { name: 'Generate implementation brief' }).click();
  const brief = await page.locator('.prose-doc').innerText();
  expect(brief.includes('test-fixture-candidate') && brief.includes('Preserved contracts'), 'brief does not mention the approved candidate');
  expect(gates > 0, 'no gates rendered');
  await saved();
});

await journey('C · Improve scene density', async () => {
  await go('composer');
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Save iteration' }).click();
  await page.waitForTimeout(600);
  await field('Density').selectOption('dense');
  await page.waitForTimeout(2500);
  const canvas = page.locator('canvas[aria-label^="Composition canvas"]');
  const box = await canvas.boundingBox();
  let selected = false;
  for (const [fx, fy] of [[0.5, 0.5], [0.42, 0.6], [0.6, 0.4], [0.3, 0.7], [0.7, 0.75]]) {
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    await page.waitForTimeout(250);
    if (await page.getByText('Selected sprite').count()) {
      const x = box.x + box.width * fx, y = box.y + box.height * fy;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 30, y + 10, { steps: 6 }); await page.mouse.move(x + 60, y + 20, { steps: 6 }); await page.mouse.up();
      selected = true; break;
    }
  }
  expect(selected, 'could not select a sprite on the canvas');
  await page.waitForTimeout(500);
  expect(await page.getByText(/moved -?\d+, -?\d+/).count() > 0, 'drag did not record a move');
  await page.getByRole('button', { name: 'Save iteration' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('tab', { name: 'Compare iterations' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Prefer this composition' }).last().click();
  await page.waitForTimeout(300);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export parameters' }).last().click()]);
  const p = path.join(out, dl.suggestedFilename()); await dl.saveAs(p);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  expect(j.preferred === true && j.replayIdentity.density === 'dense' && Object.keys(j.manualEdits.moved).length === 1, 'exported parameters wrong: ' + JSON.stringify({ preferred: j.preferred, density: j.replayIdentity.density, moved: j.manualEdits.moved }));
  await shot('C-compare');
  await saved();
});

await journey('D · Prepare a presentation', async () => {
  await go('export?tab=milestones');
  await page.getByLabel('Milestone name').fill('Journey D milestone');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(600);
  await go('demo');
  await page.getByLabel('Project iteration').selectOption({ index: 1 });
  expect((await page.getByLabel('Project iteration').locator('option:checked').innerText()).includes('Journey D milestone'), 'milestone not selectable');
  await page.waitForTimeout(500);
  const titles = [];
  for (let k = 0; k < 10; k++) { titles.push(await page.locator('main p').first().innerText()); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); }
  expect(titles[1].includes('2') && titles[9].includes('10'), 'slides did not advance: ' + titles.join(' | '));
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  await shot('D-demo');
  await page.getByRole('button', { name: 'Exit' }).click();
  await page.waitForTimeout(600);
  expect(page.url().includes('#/command'), 'exit did not return to the Command Center');
  await go('rules/dec_adrv003');
  expect((await field('Proposed replacement').inputValue()).includes('journey A edit'), 'data lost after presentation');
});

await journey('E · Hand off the next build', async () => {
  await go('issues/iss_vis001');
  await field('Stage').selectOption('Selected');
  await page.waitForTimeout(300);
  await go('export');
  await page.getByRole('button', { name: /Use the highest-priority ready issue/ }).click();
  await page.waitForTimeout(300);
  expect(await page.getByText('Dependencies of the selected issue').count() > 0, 'dependencies not shown');
  await page.getByRole('button', { name: 'Generate implementation brief' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download', exact: true }).click()]);
  const p = path.join(out, dl.suggestedFilename()); await dl.saveAs(p);
  const md = fs.readFileSync(p, 'utf8');
  for (const must of ['## Files involved', 'vibe-coding/src/scenes/build.js', '## Preserved contracts', 'waldos_savannah_leaderboard_v1', '## Testing', 'illustrated.test.mjs', '## Acceptance criteria', 'not approved']) expect(md.includes(must), 'brief is missing: ' + must);
  await page.getByRole('tab', { name: 'Builder prompt' }).click();
  expect((await page.locator('pre').innerText()).includes('Make one bounded change'), 'builder prompt missing');
  await shot('E-brief');
});

console.log(results.map((r) => r.join('  ')).join('\n'));
console.log(errors.length ? 'Page errors:\n' + [...new Set(errors)].join('\n') : 'No page errors.');
await browser.close();
process.exit(results.every((r) => r[1] === 'PASS') ? 0 : 1);
