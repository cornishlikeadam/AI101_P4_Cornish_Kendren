import { useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, Num, PageHeader, Section, Select, Slider, StatusBadge, StatusSelect, Text, toast, Toggle } from '../components/ui';
import { probeGame, gameUrl } from '../lib/gameFrame';
import { DISTRICT_NAME } from '../lib/compose';
import { go, href, useRoute } from '../lib/router';
import { fmtTime, now, uid } from '../lib/util';
import type { ClueConfiguration, Playtest } from '../types';

const LB_KEY = 'waldos_savannah_leaderboard_v1';

/** Predicted difficulty from the configuration alone. A heuristic: always Tentative until playtests support it. */
function predicted(c: ClueConfiguration) {
  const sim = [c.sharedPatterns, c.similarHats, c.similarGlasses, c.similarColours, c.similarSilhouettes].filter(Boolean).length / 5;
  const v = 0.2 * c.decoyFrequency / 0.4 + 0.15 * (c.maxSharedTraits / 2) + 0.1 * sim + 0.2 * c.occlusion + 0.1 * c.distraction + 0.1 * (1 - c.contrast) + 0.05 * Math.min(1, 300 / Math.max(50, c.decoyDistance)) + 0.1 * c.complexity;
  const s = Math.max(0, Math.min(1, v));
  return { score: s, label: s < 0.33 ? 'Easy' : s < 0.6 ? 'Normal' : 'Hard' };
}

export default function Clues() {
  const ws = useWs();
  const route = useRoute();
  const list = Object.values(ws.clues);
  const sel = route.id ? ws.clues[route.id] : list[0];
  function create() {
    const id = uid('clu');
    mutate('new clue config', (d) => { const base = Object.values(d.clues)[0]; d.clues[id] = { ...JSON.parse(JSON.stringify(base ?? {})), id, name: 'New configuration', createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Lab', rationale: 'Copied from the game default; edits are proposals.', playtests: [], validator: null, experimentalApproved: false }; logActivity(d, 'New clue configuration', { kind: 'clue', id }); });
    go('clues', id);
  }
  return (
    <div>
      <PageHeader eyebrow="Clue & Difficulty Lab" title="Hard because of composition, not tiny graphics" lede="A scene succeeds only if the target stays discoverable. The live validator below runs the real game and reads its own placement check: no fully hidden, unclickable or inaccessible targets.">
        <Button kind="primary" onClick={create}>+ Configuration</Button>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
        <ul className="flex flex-col gap-1.5">
          {list.map((c) => { const p = predicted(c); return <li key={c.id}><a href={href('clues', c.id)} className={`block rounded-lg border bg-cream p-2.5 ${sel?.id === c.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}><p className="text-[13.5px] font-medium">{c.name}</p><p className="text-[11.5px] text-muted">Predicted {p.label} (tentative) · {c.playtests.length} playtest(s)</p></a></li>; })}
        </ul>
        {sel ? <Editor key={sel.id} c={sel} /> : <Empty title="No configurations" />}
      </div>
    </div>
  );
}

function Editor({ c }: { c: ClueConfiguration }) {
  const ws = useWs();
  const [seed, setSeed] = useState(Object.values(ws.scenes)[0]?.params.seed ?? 'SAV-2026');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [busy, setBusy] = useState(false);
  const [pt, setPt] = useState<Partial<Playtest>>({});
  const set = <K extends keyof ClueConfiguration>(k: K, v: ClueConfiguration[K]) => mutate(`clue ${c.id} ${String(k)}`, (d) => { (d.clues[c.id] as ClueConfiguration)[k] = v; d.clues[c.id].updatedAt = now(); });
  const p = predicted(c);
  const observed = c.playtests.filter((x) => x.timeMs != null);
  const avg = observed.length ? observed.reduce((s, x) => s + (x.timeMs ?? 0), 0) / observed.length : null;

  async function validate() {
    setBusy(true);
    try {
      const r = await probeGame({ seed, scene: 'savannah', difficulty, density: 'standard' });
      if (!r.placement) { toast('The game reached its fallback state; no placement to read'); return; }
      mutate('validator run', (d) => { d.clues[c.id].validator = { at: now(), seed, difficulty, ok: r.placement!.ok, visibleShare: r.placement!.visibleShare, headShare: r.placement!.headShare, spot: `${r.placement!.spot} (${r.district ?? '?'})`, tries: r.placement!.tries }; logActivity(d, `Validator ran on ${seed}/${difficulty}: ${r.placement!.ok ? 'pass' : 'fail'}`, { kind: 'clue', id: c.id }); });
    } catch (e) { toast('Validator run failed: ' + String(e)); } finally { setBusy(false); }
  }
  function importLeaderboard() {
    let recs: { username: string; elapsedMs: number; wrongGuesses: number; seed: string; difficulty?: string; hints?: number }[] = [];
    try { recs = JSON.parse(localStorage.getItem(LB_KEY) || '[]'); } catch { recs = []; }
    if (!Array.isArray(recs) || !recs.length) { toast('No leaderboard records in this browser. Play a round from the button above first.'); return; }
    const existing = new Set(c.playtests.map((x) => x.seed + x.timeMs + x.player));
    const add: Playtest[] = recs.filter((r) => !existing.has(r.seed + r.elapsedMs + r.username)).map((r) => ({ id: uid('pt'), at: now(), seed: r.seed, difficulty: r.difficulty ?? 'normal', timeMs: r.elapsedMs, wrong: r.wrongGuesses, hints: r.hints ?? 0, feedback: '', failures: '', accessibility: '', from: 'game leaderboard', player: r.username }));
    mutate('import leaderboard', (d) => { d.clues[c.id].playtests.push(...add); });
    toast(`${add.length} new result(s) imported from the game's local leaderboard`);
  }
  function addManual() {
    const rec: Playtest = { id: uid('pt'), at: now(), seed: pt.seed || seed, difficulty: pt.difficulty || difficulty, timeMs: pt.timeMs ?? null, wrong: pt.wrong ?? null, hints: pt.hints ?? null, feedback: pt.feedback ?? '', failures: pt.failures ?? '', accessibility: pt.accessibility ?? '', from: 'manual', player: pt.player ?? null };
    mutate('add playtest', (d) => { d.clues[c.id].playtests.push(rec); });
    setPt({});
  }
  const v = c.validator;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Configuration" actions={<StatusBadge status={c.status} small />}>
          <div className="grid gap-3 md:grid-cols-2">
            <Text label="Name" value={c.name} onChange={(x) => set('name', x)} />
            <Select label="Target placement by district" value={c.district} options={['all', 'riverfront', 'market', 'squares', 'forsyth'].map((d) => ({ value: d, label: DISTRICT_NAME[d] }))} onChange={(x) => set('district', x)} />
            <Slider label="Traits a decoy may share" min={0} max={4} step={1} value={c.maxSharedTraits} onChange={(x) => set('maxSharedTraits', c.experimentalApproved ? x : Math.min(2, x))} format={(x) => String(x)} hint={c.experimentalApproved ? 'Experimental cap approved.' : 'Capped at 2 (HARNESS hard rule 4). Approve below to test 3 or 4.'} />
            <Slider label="Decoy frequency" min={0} max={0.5} step={0.01} value={c.decoyFrequency} onChange={(x) => set('decoyFrequency', x)} format={(x) => Math.round(x * 100) + '%'} hint="Game: easy 6%, normal 16%, hard 32%." />
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Similarity</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Toggle label="Shared clothing patterns" checked={c.sharedPatterns} onChange={(x) => set('sharedPatterns', x)} />
                <Toggle label="Similar hats" checked={c.similarHats} onChange={(x) => set('similarHats', x)} />
                <Toggle label="Similar glasses" checked={c.similarGlasses} onChange={(x) => set('similarGlasses', x)} />
                <Toggle label="Similar colours" checked={c.similarColours} onChange={(x) => set('similarColours', x)} />
                <Toggle label="Similar silhouettes" checked={c.similarSilhouettes} onChange={(x) => set('similarSilhouettes', x)} />
              </div>
            </div>
            <Slider label="Partial occlusion" value={c.occlusion} onChange={(x) => set('occlusion', x)} format={(x) => Math.round(x * 100) + '%'} hint="Game hard mode: 50–86% visible." />
            <Slider label="Nearby distractions" value={c.distraction} onChange={(x) => set('distraction', x)} format={(x) => Math.round(x * 100) + '%'} />
            <Slider label="Background contrast" value={c.contrast} onChange={(x) => set('contrast', x)} format={(x) => Math.round(x * 100) + '%'} />
            <Slider label="Scene complexity" value={c.complexity} onChange={(x) => set('complexity', x)} format={(x) => Math.round(x * 100) + '%'} />
            <Num label="Target-to-decoy distance (units)" value={c.decoyDistance} onChange={(x) => set('decoyDistance', x ?? 200)} />
            <Num label="Hint radius (units)" value={c.hintRadius} onChange={(x) => set('hintRadius', x ?? 300)} hint="Game: 300-unit dashed circle." />
            <Num label="Identifiable at zoom" value={c.zoom} step={0.1} onChange={(x) => set('zoom', x ?? 1)} hint="Game range 0.6× to 3.5×." />
            <Num label="Target scale" value={c.targetScale} step={0.05} onChange={(x) => set('targetScale', x ?? 0.8)} />
            <StatusSelect value={c.status} onChange={(x) => set('status', x)} />
            <div className="md:col-span-2"><Toggle label="Approve experimental decoy caps above two" checked={c.experimentalApproved} hint="Records an explicit owner decision. It changes nothing in the game; a real change needs ADR-V006 approved and a sprint." onChange={async (x) => {
              if (x && !(await confirmAction('Approve an experimental decoy cap?', 'Decoys sharing three or four traits break HARNESS hard rule 4 if shipped. This approval only unlocks lab previews. Exactly one five-trait target is still enforced.', 'Approve experiment', false))) return;
              mutate('experimental approval', (d) => { d.clues[c.id].experimentalApproved = x; if (!x) d.clues[c.id].maxSharedTraits = Math.min(2, d.clues[c.id].maxSharedTraits); logActivity(d, x ? 'Approved experimental decoy cap' : 'Withdrew experimental decoy cap', { kind: 'clue', id: c.id }); });
            }} /></div>
          </div>
        </Section>
        <div className="flex flex-col gap-5">
          <Section title="Predicted difficulty">
            <p className="font-display text-[26px]">{p.label} <span className="text-[16px] text-muted">({p.score.toFixed(2)})</span></p>
            <p className="mt-1"><StatusBadge status="Tentative" small /> <span className="text-[12.5px] text-muted">A weighted heuristic of the settings. Becomes evidence only once playtests agree with it.</span></p>
            <p className="mt-2 text-[13px]">Observed: {observed.length ? `${observed.length} round(s), average ${(avg! / 1000).toFixed(1)} s, ${(observed.reduce((s, x) => s + (x.wrong ?? 0), 0) / observed.length).toFixed(1)} wrong guesses, ${(observed.reduce((s, x) => s + (x.hints ?? 0), 0) / observed.length).toFixed(1)} hints` : 'no playtests recorded'}.</p>
          </Section>
          <Section title="Live target validator (real game)">
            <div className="flex flex-wrap items-end gap-2">
              <Text label="Seed" value={seed} onChange={setSeed} mono />
              <Select label="Difficulty" value={difficulty} options={['easy', 'normal', 'hard'] as const} onChange={(v) => setDifficulty(v as typeof difficulty)} />
              <Button kind="primary" onClick={validate} disabled={busy}>{busy ? 'Running the game…' : 'Run validator'}</Button>
            </div>
            <p className="mt-2 text-[12px] text-muted">Loads the lab's copy of the game off-screen and reads <span className="font-mono">WS.game.placement</span>, the engine's own check (head ≥ 60% and body ≥ 50% visible; hard 50–86%).</p>
            {v && (
              <div className={`mt-3 rounded-md border p-3 text-[13px] ${v.ok ? 'border-moss/50 bg-moss/5' : 'border-coral bg-coral/10'}`}>
                <p className="font-semibold">{v.ok ? '✓ Target discoverable' : '✗ Validator rejected the placement'}</p>
                <p>Seed {v.seed}, {v.difficulty}: visible {Math.round(v.visibleShare * 100)}%, head {Math.round(v.headShare * 100)}%, spot {v.spot}, {v.tries} tries.</p>
                <p className="text-[11.5px] text-muted">Measured {fmtTime(v.at)} in this browser.</p>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="inline-flex h-8 items-center rounded-md border border-line px-3 text-[12.5px] hover:border-cocoa/50" href={gameUrl({ seed, scene: 'savannah', difficulty })} target="_blank" rel="noreferrer">Play a test round</a>
              <a className="inline-flex h-8 items-center rounded-md border border-dashed border-coral px-3 text-[12.5px] text-[#B3261E]" href={gameUrl({ seed, scene: 'savannah', difficulty, beacon: 1 })} target="_blank" rel="noreferrer">Open with developer beacon</a>
            </div>
            <p className="mt-1 text-[11.5px] text-muted">The beacon needs <span className="font-mono">?beacon=1</span> and never shows in an ordinary round.</p>
          </Section>
        </div>
      </div>

      <Section title={`Difficulty testing (${c.playtests.length})`} actions={<Button small onClick={importLeaderboard}>Import from game leaderboard</Button>}>
        <p className="mb-3 text-[12.5px] text-muted">Only real rounds go here: typed in after watching someone play, or imported from the game's local leaderboard (same browser). Nothing is generated.</p>
        {c.playtests.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-left text-[11px] uppercase tracking-wide text-muted"><tr><th className="py-1">When</th><th>Player</th><th>Seed</th><th>Difficulty</th><th>Time</th><th>Wrong</th><th>Hints</th><th>Feedback</th><th>Failures</th><th>Access.</th><th>From</th><th /></tr></thead>
              <tbody>{c.playtests.map((x) => <tr key={x.id} className="border-t border-line"><td className="py-1">{fmtTime(x.at)}</td><td>{x.player ?? '—'}</td><td className="font-mono">{x.seed}</td><td>{x.difficulty}</td><td className="tabular-nums">{x.timeMs != null ? (x.timeMs / 1000).toFixed(1) + ' s' : '—'}</td><td>{x.wrong ?? '—'}</td><td>{x.hints ?? '—'}</td><td>{x.feedback}</td><td>{x.failures}</td><td>{x.accessibility}</td><td className="text-muted">{x.from}</td><td><button aria-label="Delete playtest" className="text-muted hover:text-coral" onClick={() => mutate('delete playtest', (d) => { d.clues[c.id].playtests = d.clues[c.id].playtests.filter((y) => y.id !== x.id); })}>×</button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <form className="grid gap-2 md:grid-cols-6" onSubmit={(e) => { e.preventDefault(); addManual(); }}>
          <Text label="Player" value={pt.player ?? ''} onChange={(x) => setPt({ ...pt, player: x })} />
          <Text label="Seed" value={pt.seed ?? seed} onChange={(x) => setPt({ ...pt, seed: x })} mono />
          <Select label="Difficulty" value={(pt.difficulty as 'easy') ?? difficulty} options={['easy', 'normal', 'hard'] as const} onChange={(x) => setPt({ ...pt, difficulty: x })} />
          <Num label="Seconds" value={pt.timeMs != null ? pt.timeMs / 1000 : null} step={0.1} onChange={(x) => setPt({ ...pt, timeMs: x == null ? null : Math.round(x * 1000) })} />
          <Num label="Wrong guesses" value={pt.wrong ?? null} onChange={(x) => setPt({ ...pt, wrong: x })} />
          <Num label="Hints" value={pt.hints ?? null} onChange={(x) => setPt({ ...pt, hints: x })} />
          <Area label="Feedback" rows={2} value={pt.feedback ?? ''} onChange={(x) => setPt({ ...pt, feedback: x })} className="md:col-span-2" />
          <Area label="Search failures" rows={2} value={pt.failures ?? ''} onChange={(x) => setPt({ ...pt, failures: x })} className="md:col-span-2" />
          <Area label="Visibility / accessibility problems" rows={2} value={pt.accessibility ?? ''} onChange={(x) => setPt({ ...pt, accessibility: x })} className="md:col-span-2" />
          <div className="md:col-span-6"><Button type="submit">Record playtest</Button></div>
        </form>
      </Section>
      <div className="flex justify-end"><Button small kind="danger" onClick={async () => { if (await confirmAction('Delete configuration?', c.name, 'Delete')) { useLab.getState().remove('clue', c.id); go('clues'); } }}>Delete configuration</Button></div>
    </div>
  );
}
