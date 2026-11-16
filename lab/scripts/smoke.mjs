#!/usr/bin/env node
/* Visit every lab view in headless Chrome, record page errors and failed requests, and save screenshots.
   Usage: node scripts/smoke.mjs <base-url> <out-dir>   (needs playwright-core and an installed Chrome) */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5199/';
const out = process.argv[3] ?? 'smoke-out';
fs.mkdirSync(out, { recursive: true });
const views = ['command', 'audit', 'references', 'rules', 'characters', 'composer', 'atlas', 'clues', 'assets', 'compare', 'quality', 'issues', 'sprints', 'export', 'demo'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push(['pageerror', page.url(), e.message]));
page.on('console', (m) => { if (m.type() === 'error') problems.push(['console', page.url(), m.text()]); });
page.on('requestfailed', (r) => problems.push(['requestfailed', r.url(), r.failure()?.errorText]));
for (const v of views) {
  await page.goto(base + '#/' + v, { waitUntil: 'networkidle' });
  await page.waitForTimeout(v === 'composer' || v === 'characters' ? 3500 : 700);
  await page.screenshot({ path: `${out}/${v}.png`, fullPage: false });
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  console.log(v.padEnd(11), '→', h1);
}
console.log(problems.length ? 'PROBLEMS:\n' + problems.map((p) => p.join(' | ')).join('\n') : 'No page errors, console errors or failed requests.');
await browser.close();
