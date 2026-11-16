import { useEffect, useMemo, useState } from 'react';
import { logActivity, mutate, useWs } from '../store/store';
import { Area, Button, Empty, PageHeader, Score, Section, Select, StatusBadge, Tabs, Text, toast } from '../components/ui';
import { EntityLink, LinkList } from '../components/links';
import { EvidencePicker, ImageDrop, Img, refLabel, storeFile } from '../components/images';
import { canvasBlob, RuntimeError, useRuntime } from '../components/sprites';
import { CHECKS, runCheck } from '../lib/checks';
import { benchmarkGame } from '../lib/gameFrame';
import { reviewResult } from '../lib/readiness';
import { svgToImage } from '../lib/runtime';
import { go, href, setQuery, useRoute } from '../lib/router';
import { fmtTime, now, uid } from '../lib/util';
import { snapshot } from '../seed/snapshot';
import { QC_CATEGORIES, type Measurement, type QcKey, type QualityReview } from '../types';

export default function Quality() {
  const route = useRoute();
  const tab = route.q.get('tab') ?? (route.q.get('subject') || route.id ? 'reviews' : 'reviews');
  return (
    <div>
      <PageHeader eyebrow="Quality Control" title="Visual and engineering quality" lede="Reviews need visual evidence and the owner's scores. Automated checks run against the game's own code and art in this browser. Only measured numbers are shown as measurements.">
        <Tabs label="Quality" value={tab} onChange={(t) => setQuery('tab', t)} tabs={[{ value: 'reviews', label: 'Sprite reviews' }, { value: 'gates', label: 'Visual gates A–F' }, { value: 'checks', label: 'Automated checks' }, { value: 'bench', label: 'Performance' }]} />
      </PageHeader>
      {tab === 'reviews' && <Reviews />}
      {tab === 'gates' && <Gates />}
      {tab === 'checks' && <Checks />}
      {tab === 'bench' && <Bench />}
    </div>
  );
}

function subjectTitle(ws: ReturnType<typeof useWs>, s: QualityReview['subject']) {
  if (s.kind === 'asset') return ws.assets[s.id]?.title ?? s.id;
  if (s.kind === 'character') return ws.characters[s.id]?.name ?? s.id;
  const ch = s.parentId ? ws.characters[s.parentId] : null;
  return `${ch?.name ?? '?'} · candidate "${ch?.candidates.find((c) => c.id === s.id)?.name ?? s.id}"`;
}

function Reviews() {
  const ws = useWs();
  const route = useRoute();
  const reviews = Object.values(ws.reviews).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  // ?subject=asset:<id> | candidate:<candId>:<charId> | character:<id>  → open or create its review
  useEffect(() => {
    const spec = route.q.get('subject'); if (!spec) return;
    const [kind, id, parent] = spec.split(':');
    const existing = Object.values(ws.reviews).find((r) => r.subject.id === id);
    if (existing) { go('quality', existing.id, { tab: 'reviews' }); return; }
    const rid = uid('rev');
    const entries = Object.fromEntries((Object.keys(QC_CATEGORIES) as QcKey[]).map((k) => [k, { score: null, checks: Object.fromEntries(QC_CATEGORIES[k].checks.map((c) => [c, null])), blocking: false, note: '' }])) as QualityReview['entries'];
    mutate('new review', (d) => {
      d.reviews[rid] = { id: rid, createdAt: now(), updatedAt: now(), status: 'In progress', source: 'Quality Control', rationale: null, tags: [], subject: { kind: kind as 'asset', id, parentId: parent }, reviewer: d.project.owner, entries, evidence: [], observations: '' };
      for (const s of Object.values(d.sprints)) if (parent && s.characterIds.includes(parent)) s.reviewIds.push(rid);
      logActivity(d, 'Started a quality review', { kind: 'review', id: rid });
    });
    go('quality', rid, { tab: 'reviews' });
  }, [route.q]); // eslint-disable-line
  const sel = route.id ? ws.reviews[route.id] : reviews[0];
  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
      <div className="flex flex-col gap-1.5">
        {reviews.map((r) => { const v = reviewResult(r); return <a key={r.id} href={href('quality', r.id, { tab: 'reviews' })} className={`block rounded-lg border bg-cream p-2.5 ${sel?.id === r.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}><p className="text-[13px] font-medium leading-snug">{subjectTitle(ws, r.subject)}</p><p className="text-[11.5px] text-muted">{v.verdict}{v.score != null ? ` · ${v.score.toFixed(2)}` : ''} · {fmtTime(r.updatedAt)}</p></a>; })}
        {!reviews.length && <Empty title="No reviews yet">Start one from an asset card ("Quality review") or a candidate in the Character Workshop ("Review").</Empty>}
      </div>
      {sel && <ReviewEditor key={sel.id} r={sel} />}
    </div>
  );
}

function ReviewEditor({ r }: { r: QualityReview }) {
  const ws = useWs();
  const { rt } = useRuntime();
  const [pick, setPick] = useState(false);
  const v = reviewResult(r);
  const upd = (fn: (x: QualityReview) => void) => mutate('review ' + r.id, (d) => { fn(d.reviews[r.id]); d.reviews[r.id].updatedAt = now(); });
  const cand = r.subject.kind === 'candidate' && r.subject.parentId ? ws.characters[r.subject.parentId]?.candidates.find((c) => c.id === r.subject.id) : null;
  const asset = r.subject.kind === 'asset' ? ws.assets[r.subject.id] : null;
  async function renderEvidence() {
    if (!rt || !asset?.repoId) return;
    const m = rt.assets.meta[asset.repoId];
    const svg = m.head || m.head2 ? rt.WS.characters.compose(asset.repoId, null) : rt.assets.svg[asset.repoId];
    const img = await svgToImage(svg);
    const scales = [0.32, 0.8, 2];   // gameplay 0.6×-ish, 1× world, 2.5× zoom equivalent heights
    const H = Math.ceil(m.viewBox[3] * 2) + 40, W = Math.ceil(m.viewBox[2] * (scales.reduce((s, x) => s + x, 0)) + 80);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d')!; x.fillStyle = '#8DBA5A'; x.fillRect(0, 0, W, H);
    let ox = 20; for (const s of scales) { const w = m.viewBox[2] * s, h = m.viewBox[3] * s; x.drawImage(img, ox, H - 20 - h, w, h); ox += w + 20; }
    const ref = await storeFile(await canvasBlob(c), `${asset.repoId.split('/').pop()}-review-render.png`);
    upd((d) => d.evidence.push(ref)); toast('Rendered the repository drawing at three scales as evidence');
  }
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-cream p-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px]">{subjectTitle(ws, r.subject)}</p>
          <p className="text-[12px] text-muted">{r.subject.kind === 'asset' && <a className="underline" href={href('assets', r.subject.id)}>Open asset</a>}{r.subject.parentId && <a className="underline" href={href('characters', r.subject.parentId)}>Open in Character Workshop</a>}</p>
        </div>
        <div className={`rounded-md border-2 px-3 py-1.5 text-center ${v.verdict === 'Pass' ? 'border-moss text-moss' : v.verdict === 'Blocked' ? 'border-[#B3261E] text-[#B3261E]' : 'border-line'}`}>
          <p className="font-display text-[20px] leading-none">{v.verdict}</p>
          <p className="text-[11.5px]">{v.score != null ? `average ${v.score.toFixed(2)} / 5` : 'not scored'}</p>
        </div>
      </div>
      <Section title="Why this verdict"><ul className="list-disc pl-5 text-[13px]">{v.reasons.map((x) => <li key={x}>{x}</li>)}</ul></Section>
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(QC_CATEGORIES) as QcKey[]).map((k) => {
            const e = r.entries[k];
            return (
              <section key={k} className={`rounded-lg border bg-cream p-3 ${e.blocking ? 'border-[#B3261E]' : 'border-line'}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{QC_CATEGORIES[k].label}</h3><Score label={QC_CATEGORIES[k].label} value={e.score} onChange={(s) => upd((d) => { d.entries[k].score = s; })} /></div>
                <ul className="flex flex-col gap-1">
                  {QC_CATEGORIES[k].checks.map((c) => {
                    const val = e.checks[c] ?? null;
                    return (
                      <li key={c} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span>{c}</span>
                        <span role="radiogroup" aria-label={c} className="flex gap-0.5">
                          {([[true, '✓ Pass'], [false, '✗ Fail'], [null, '–']] as const).map(([vv, l]) => <button key={String(vv)} role="radio" aria-checked={val === vv} onClick={() => upd((d) => { d.entries[k].checks[c] = vv; })} className={`rounded border px-1.5 text-[11px] ${val === vv ? (vv === true ? 'border-moss bg-moss text-cream' : vv === false ? 'border-[#B3261E] bg-[#B3261E] text-white' : 'border-cocoa bg-sand') : 'border-line text-muted'}`}>{l}</button>)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <label className="mt-2 flex items-center gap-2 text-[12.5px]"><input type="checkbox" className="accent-[#B3261E]" checked={e.blocking} onChange={(ev) => upd((d) => { d.entries[k].blocking = ev.target.checked; })} />Blocking failure: prevents completion</label>
                <textarea aria-label={`${QC_CATEGORIES[k].label} note`} className="input mt-2 h-14 text-[12px]" placeholder="Observation, with what you looked at" value={e.note} onChange={(ev) => upd((d) => { d.entries[k].note = ev.target.value; })} />
              </section>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          <Section title={`Visual evidence (${r.evidence.length})`}>
            <div className="grid grid-cols-2 gap-2">{r.evidence.map((e, i) => <figure key={i} className="relative"><Img refx={e} alt={refLabel(e)} className="h-24 w-full rounded border border-line bg-sand" /><button aria-label="Remove evidence" className="absolute right-1 top-1 rounded bg-cream/90 px-1 text-[12px]" onClick={() => upd((d) => { d.evidence.splice(i, 1); })}>×</button></figure>)}</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {cand && cand.captures.length > 0 && <Button small onClick={() => upd((d) => { for (const c of cand.captures) if (!d.evidence.some((x) => x.kind === 'blob' && c.kind === 'blob' && x.id === c.id)) d.evidence.push(c); })}>Attach the candidate's {cand.captures.length} capture(s)</Button>}
              {asset?.repoId && <Button small onClick={renderEvidence}>Render the drawing at three scales</Button>}
              <ImageDrop compact multiple onAdd={(refs) => upd((d) => { d.evidence.push(...refs); })} label="Add screenshots" />
              <Button small onClick={() => setPick(true)}>From repo evidence</Button>
            </div>
            <EvidencePicker open={pick} onClose={() => setPick(false)} onPick={(ref) => upd((d) => { d.evidence.push(ref); })} />
          </Section>
          <Text label="Reviewer" value={r.reviewer} onChange={(x) => upd((d) => { d.reviewer = x; })} />
          <Area label="Overall observations" value={r.observations} onChange={(x) => upd((d) => { d.observations = x; })} />
          <div className="flex flex-col gap-1"><span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Status</span><StatusBadge status={v.verdict === 'Pass' ? 'Completed' : 'In progress'} /></div>
        </div>
      </div>
    </div>
  );
}

const GATES = [
  ['A', 'Illustration', 'Characters drawn, not assembled from boxes; buildings with detail; organic foliage; coherent props; consistent linework; deliberate stories.'],
  ['B', 'Composition', 'Foreground, middle ground, background; intentional clusters; visual paths; focal points; interesting with labels hidden.'],
  ['C', 'Character diversity', 'Varied silhouettes, clothing, recognisable activities, group interactions, no obvious repetition.'],
  ['D', 'Search-and-find', 'Target visible, selectable, fair; meaningful difficulty; no highlight in normal play; hints only on request.'],
  ['E', 'Engineering', 'Preserved features work; seeded replay; offline; leaderboard; fallback; keyboard; mobile; no unhandled errors.'],
  ['F', 'Screenshot evidence', 'Initial desktop, full scene, zoomed crowd, hidden target, victory, mobile, fallback, before and after.'],
] as const;
interface GateRecord { verdict: 'Pass' | 'Fail' | 'Not reviewed'; observations: string; comparisonIds: string[]; at: string | null }

function Gates() {
  const ws = useWs();
  const data: Record<string, GateRecord> = useMemo(() => { try { return JSON.parse(ws.auditNotes['harness-gates'] ?? '{}'); } catch { return {}; } }, [ws.auditNotes]);
  const save = (k: string, patch: Partial<GateRecord>) => mutate('gate ' + k, (d) => { const blankGate: GateRecord = { verdict: 'Not reviewed', observations: '', comparisonIds: [], at: null }; const cur: GateRecord = Object.assign(blankGate, data[k], patch, { at: now() }); d.auditNotes['harness-gates'] = JSON.stringify({ ...data, [k]: cur }); });
  return (
    <div>
      <p className="mb-4 max-w-3xl text-[13px] text-muted">The repository's own visual gates (HARNESS.md). "A passing test suite never satisfies a visual gate." Each verdict is the owner's, recorded with observations and linked comparisons.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {GATES.map(([k, name, desc]) => {
          const g = data[k] ?? { verdict: 'Not reviewed', observations: '', comparisonIds: [], at: null };
          return (
            <Section key={k} title={<><span className="text-terracotta">Gate {k}.</span> {name}</>} actions={<span className={`rounded border px-2 text-[12px] font-semibold ${g.verdict === 'Pass' ? 'border-moss text-moss' : g.verdict === 'Fail' ? 'border-[#B3261E] text-[#B3261E]' : 'border-line text-muted'}`}>{g.verdict === 'Pass' ? '✓ ' : g.verdict === 'Fail' ? '✗ ' : '○ '}{g.verdict}</span>}>
              <p className="mb-2 text-[12.5px] text-muted">{desc}</p>
              <div className="flex flex-col gap-2">
                <Select label="Owner verdict" value={g.verdict} options={['Not reviewed', 'Pass', 'Fail'] as const} onChange={(v) => save(k, { verdict: v })} />
                <Area label="Observations (cite screenshots)" value={g.observations} onChange={(v) => save(k, { observations: v })} rows={3} />
                <LinkList kind="comparison" label="Evidence comparisons" ids={g.comparisonIds} onChange={(v) => save(k, { comparisonIds: v })} />
                {g.at && <p className="text-[11px] text-muted">Updated {fmtTime(g.at)}</p>}
              </div>
            </Section>
          );
        })}
      </div>
    </div>
  );
}

function Checks() {
  const ws = useWs();
  const { rt, err } = useRuntime();
  const [running, setRunning] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  async function run(id: string) {
    if (!rt) return;
    const def = CHECKS.find((c) => c.id === id)!;
    setRunning(id);
    const r = await runCheck(def, rt, setProgress);
    mutate('check ' + id, (d) => { d.checks[id] = r; logActivity(d, `Check "${def.name}": ${r.ok === null ? 'needs review' : r.ok ? 'pass' : 'fail'}`); });
    setRunning(null); setProgress('');
  }
  async function runAll() { for (const c of CHECKS) await run(c.id); }
  return (
    <div className="flex flex-col gap-4">
      {err && <RuntimeError err={err} />}
      <div className="flex flex-wrap items-center gap-2"><Button kind="primary" onClick={runAll} disabled={!rt || !!running}>Run all checks</Button>{running && <span className="text-[12.5px] text-muted">Running: {progress || running}</span>}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(['Visual', 'Engineering'] as const).map((area) => (
          <Section key={area} title={area + ' checks'}>
            <ul className="flex flex-col gap-3">
              {CHECKS.filter((c) => c.area === area).map((c) => {
                const r = ws.checks[c.id];
                return (
                  <li key={c.id} className="rounded-md border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{r ? <span className={r.ok === null ? 'text-violet' : r.ok ? 'text-moss' : 'text-[#B3261E]'}>{r.ok === null ? '◐ ' : r.ok ? '✓ ' : '✗ '}</span> : '○ '}{c.name}</p>
                      <Button small onClick={() => run(c.id)} disabled={!rt || !!running}>{running === c.id ? 'Running…' : r ? 'Run again' : 'Run'}</Button>
                    </div>
                    {r ? (
                      <>
                        <p className="mt-1 text-[13px]">{r.summary}</p>
                        {r.details.length > 0 && <details className="mt-1 text-[12px]"><summary className="cursor-pointer text-muted">Details ({r.details.length})</summary><ul className="mt-1 list-disc pl-5">{r.details.map((d, i) => <li key={i}>{d}</li>)}</ul></details>}
                        <p className="mt-1 text-[11px] text-muted">{fmtTime(r.at)} · {r.method}</p>
                      </>
                    ) : <p className="mt-1 text-[12.5px] text-muted">Not run in this workspace yet.</p>}
                  </li>
                );
              })}
            </ul>
          </Section>
        ))}
      </div>
      <Section title={`Game test suite (declared in the repo, run outside the lab)`}>
        <p className="mb-2 text-[12.5px] text-muted">These Playwright checks live in <span className="font-mono">vibe-coding/tests/illustrated.test.mjs</span>. The lab lists them but cannot run them from a browser page; run <span className="font-mono">node vibe-coding/tests/illustrated.test.mjs</span> and record results in the failure log.</p>
        <ol className="grid list-decimal gap-x-6 gap-y-0.5 pl-5 text-[12.5px] md:grid-cols-2">{(snapshot.tests ?? []).map((t) => <li key={t.line}><a className="hover:underline" href={href('audit', null, { doc: 'vibe-coding/tests/illustrated.test.mjs', line: String(t.line) })}>{t.name}</a></li>)}</ol>
      </Section>
      <p className="text-[12px] text-muted">Keyboard navigation, touch, browser compatibility and memory beyond the numbers below are not measured by the lab. They are covered only by the declared game tests above.</p>
      <EntityLink kind="issue" id="iss_vis010" showStatus />
    </div>
  );
}

const TIERS: { tier: Measurement['tier']; label: string; params: Record<string, string> }[] = [
  { tier: 'Interactive baseline', label: 'Standard density (900 people across the city)', params: { density: 'standard' } },
  { tier: 'Illustrated quality test', label: 'Dense (1,500 people)', params: { density: 'dense' } },
  { tier: 'Stress test', label: 'crowd=2000', params: { crowd: '2000' } },
  { tier: 'Stress test', label: 'crowd=10000', params: { crowd: '10000' } },
];

function Bench() {
  const ws = useWs();
  const [tier, setTier] = useState(0);
  const [seconds, setSeconds] = useState(10);
  const [seed, setSeed] = useState('PERF-1');
  const [busy, setBusy] = useState<string | null>(null);
  const runs = Object.values(ws.measurements).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  async function run() {
    const t = TIERS[tier];
    const params = { seed, scene: 'savannah', difficulty: 'normal', ...t.params };
    setBusy('Starting…');
    try {
      const r = await benchmarkGame(params, seconds, setBusy);
      const id = uid('mea');
      mutate('benchmark', (d) => {
        d.measurements[id] = { id, createdAt: now(), updatedAt: now(), status: r.hidden ? 'Tentative' : 'Verified', source: 'Lab benchmark (requestAnimationFrame inside the real game)', rationale: r.hidden ? 'The tab was hidden during the run, so frame timing is throttled and unreliable.' : 'Measured in this browser during this session.', tags: [], label: t.label, tier: t.tier, url: 'repo/build/index.html?' + new URLSearchParams(params), params, seconds, userAgent: navigator.userAgent, ...r };
        logActivity(d, `Benchmark ${t.label}: ${r.fps.toFixed(1)} FPS average`, { kind: 'measurement', id });
      });
    } catch (e) { toast('Benchmark failed: ' + String(e)); }
    setBusy(null);
  }
  return (
    <div className="flex flex-col gap-5">
      <Section title="Run a benchmark against the real game">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Tier" value={String(tier)} options={TIERS.map((t, i) => ({ value: String(i), label: `${t.tier}: ${t.label}` }))} onChange={(v) => setTier(Number(v))} />
          <Text label="Seed" value={seed} onChange={setSeed} mono />
          <Select label="Duration" value={String(seconds)} options={['5', '10', '20'].map((v) => ({ value: v, label: v + ' s' }))} onChange={(v) => setSeconds(Number(v))} />
          <Button kind="primary" onClick={run} disabled={!!busy}>{busy ?? 'Run benchmark'}</Button>
        </div>
        <p className="mt-2 text-[12px] text-muted">Opens the lab's copy of the game in a 1280 × 800 frame (shown scaled down in the corner), starts a round, then pans and zooms on a script while recording requestAnimationFrame intervals. Keep this tab in front: hidden tabs throttle animation and the run is marked unreliable. Displays cap at their refresh rate, so 60 FPS on a 60 Hz screen is a ceiling, not headroom.</p>
      </Section>
      <Section title={`Lab measurements (${runs.length})`}>
        {runs.length === 0 ? <p className="text-[13px] text-muted">Nothing measured yet. No benchmark numbers are shown until one runs.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-left text-[11px] uppercase tracking-wide text-muted"><tr><th className="py-1">When</th><th>Tier</th><th>Run</th><th className="text-right">People</th><th className="text-right">Avg FPS</th><th className="text-right">Avg ms</th><th className="text-right">p95 ms</th><th className="text-right">Worst ms</th><th className="text-right">σ ms</th><th className="text-right">Load ms</th><th className="text-right">Heap MB</th><th>Target</th><th>Status</th></tr></thead>
              <tbody>{runs.map((m) => <tr key={m.id} className="border-t border-line"><td className="py-1">{fmtTime(m.createdAt)}</td><td>{m.tier}</td><td>{m.label} · {m.seconds}s</td><td className="text-right tabular-nums">{m.people ?? '—'}</td><td className="text-right tabular-nums">{m.fps.toFixed(1)}</td><td className="text-right tabular-nums">{m.avgFrameMs.toFixed(2)}</td><td className="text-right tabular-nums">{m.p95FrameMs.toFixed(1)}</td><td className="text-right tabular-nums">{m.worstFrameMs.toFixed(1)}</td><td className="text-right tabular-nums">{m.stdevMs.toFixed(2)}</td><td className="text-right tabular-nums">{m.loadMs?.toFixed(0) ?? '—'}</td><td className="text-right tabular-nums">{m.heapMB?.toFixed(1) ?? 'n/a'}</td><td>{m.validator ? (m.validator.ok ? '✓' : '✗') + ' ' + Math.round(m.validator.visibleShare * 100) + '%' : '—'}</td><td><StatusBadge status={m.status} small /></td></tr>)}</tbody>
            </table>
            <p className="mt-2 text-[11.5px] text-muted">Browser: {runs[0].userAgent} · DPR {runs[0].dpr} · {runs[0].viewport}</p>
          </div>
        )}
      </Section>
      <Section title="Documented in build-record/performance.md (not re-measured by the lab)">
        <p className="mb-3 text-[12.5px]"><StatusBadge status="Tentative" small /> <span className="text-muted">Reported by the repository's own perf script on one machine. Shown for reference only; the lab treats them as claims until reproduced.</span></p>
        {(snapshot.perfTables ?? []).filter((t) => t.header.includes('Avg FPS')).map((t) => (
          <div key={t.line} className="mb-4 overflow-x-auto">
            <p className="mb-1 text-[12.5px] font-semibold">{t.heading} <a className="font-normal text-muted hover:underline" href={href('audit', null, { doc: 'vibe-coding/build-record/performance.md', line: String(t.line) })}>performance.md:{t.line}</a></p>
            <table className="text-[12px]"><thead><tr>{t.header.map((h) => <th key={h} className="border border-line bg-sand px-1.5 py-0.5 text-left font-medium">{h}</th>)}</tr></thead><tbody>{t.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border border-line px-1.5 py-0.5 tabular-nums">{c}</td>)}</tr>)}</tbody></table>
          </div>
        ))}
      </Section>
    </div>
  );
}
