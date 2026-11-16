import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useWs } from '../store/store';
import { Img } from '../components/images';
import { useMilestones } from './Export';
import { go, setQuery, useRoute } from '../lib/router';
import { reviewResult, sprintGates } from '../lib/readiness';
import { download } from '../lib/util';
import { evidenceByPath, snapshot } from '../seed/snapshot';
import { RUBRIC, type ImageRef, type Workspace } from '../types';

interface Slide { title: string; kicker: string; body: ReactNode; notes: string }

function Missing({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-[14rem] items-center justify-center rounded-xl border-2 border-dashed border-cocoa/30 p-6 text-center font-sans text-[15px] text-cocoa/70"><span><b className="mb-1 block text-[12px] uppercase tracking-[0.16em] text-terracotta">Not yet available</b>{children}</span></div>;
}
const Pic = ({ r, label }: { r: ImageRef; label: string }) => <figure className="flex min-h-0 flex-col gap-2"><Img refx={r} alt={label} className="max-h-[52vh] w-full rounded-lg bg-white/50" /><figcaption className="font-sans text-[13px] text-cocoa/70">{label}</figcaption></figure>;

function slides(ws: Workspace): Slide[] {
  const v1 = evidenceByPath('vibe-coding/build-record/tests/visual-overhaul/before-overview-1440.png');
  const baseline: { r: ImageRef; label: string } | null = ws.project.baselineImage ? { r: ws.project.baselineImage, label: 'Baseline chosen by the owner' } : v1 ? { r: { kind: 'evidence', path: v1.path, url: v1.url }, label: 'Version 1, repository capture (build-record/tests/visual-overhaul/before-overview-1440.png)' } : null;
  const issues = Object.values(ws.issues).filter((i) => i.stage !== 'Completed').sort((a, b) => a.priority - b.priority);
  const pinned = Object.values(ws.comparisons).filter((c) => c.pins.length && c.left).sort((a, b) => b.pins.length - a.pins.length)[0];
  const refs = Object.values(ws.references).filter((r) => r.pinned || (r.relevance ?? 0) >= 4).slice(0, 6);
  const approvedCands = Object.values(ws.characters).flatMap((c) => c.candidates.filter((x) => x.approval === 'Approved').map((x) => ({ c, x })));
  const scene = Object.values(ws.scenes).find((s) => s.preferredIterationId) ?? Object.values(ws.scenes)[0];
  const pref = scene?.preferredIterationId ? ws.iterations[scene.preferredIterationId] : null;
  const base = scene?.baselineIterationId ? ws.iterations[scene.baselineIterationId] : null;
  const strongest = Object.values(ws.comparisons).filter((c) => c.left && c.right).sort((a, b) => (Number(!!b.preferred) - Number(!!a.preferred)) || (RUBRIC.filter((k) => b.rubric[k]?.right != null).length - RUBRIC.filter((k) => a.rubric[k]?.right != null).length))[0];
  const decisions = Object.values(ws.decisions).sort((a, b) => a.priority - b.priority);
  const sprints = Object.values(ws.sprints);
  const brief = Object.values(ws.briefs).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const cur = ws.project.currentChallenge?.kind === 'sprint' ? ws.sprints[ws.project.currentChallenge.id] : null;
  return [
    { kicker: '1 · The project', title: ws.project.title, notes: ws.project.artDirection, body: <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]"><p className="text-[clamp(20px,2.4vw,30px)] leading-snug">{ws.project.artDirection}</p><div className="font-sans text-[15px] leading-relaxed text-cocoa/80"><p>A search-and-find game set in Savannah, Georgia: find the one walker with five traits in a crowded illustrated city.</p><p className="mt-3">Repository <span className="font-mono">{snapshot.git?.head}</span> · art version {snapshot.artVersion} · {snapshot.counts?.assets} original SVG assets · deployed at waldo-savannah.vercel.app.</p></div></div> },
    { kicker: '2 · Existing experience', title: 'Where it started', notes: baseline?.label ?? 'No baseline image.', body: baseline ? <Pic r={baseline.r} label={baseline.label} /> : <Missing>Attach a baseline screenshot in the Command Center.</Missing> },
    { kicker: '3 · The visual problem', title: 'What the owner reported', notes: issues.map((i) => `${i.code} ${i.title} (${i.status})`).join('\n'), body: (
      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        {pinned ? <figure className="relative"><Img refx={pinned.left} alt={pinned.leftLabel} className="w-full rounded-lg" />{pinned.pins.map((p, i) => <span key={p.id} className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-coral font-sans text-[12px] font-bold text-white shadow" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>{i + 1}</span>)}<figcaption className="mt-1 font-sans text-[13px] text-cocoa/70">{pinned.name}: {pinned.pins.map((p, i) => `${i + 1}. ${p.text}`).join(' · ')}</figcaption></figure> : <Missing>No annotated comparison yet. Pin problems in the Comparison Studio.</Missing>}
        <ol className="flex flex-col gap-2 font-sans text-[15px]">{issues.slice(0, 7).map((i) => <li key={i.id}><b>{i.code}</b> {i.title} <span className="text-[12px] text-cocoa/60">· {i.severity} · {i.status}</span></li>)}</ol>
      </div>
    ) },
    { kicker: '4 · Visual references', title: 'What we are learning from', notes: refs.map((r) => r.title).join('\n') || 'No references.', body: refs.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{refs.map((r) => <figure key={r.id}>{r.image ? <Img refx={r.image} alt={r.title} className="aspect-[4/3] w-full rounded-lg" fit="cover" /> : <div className="aspect-[4/3] rounded-lg bg-white/50" />}<figcaption className="mt-1 font-sans text-[13px]"><b>{r.title}</b> · {r.works || 'no notes'}<br /><span className="text-cocoa/60">Rights: {r.license ?? 'not recorded'}</span></figcaption></figure>)}</div> : <Missing>No pinned or high-relevance references. Add and pin them in the Reference Studio.</Missing> },
    { kicker: '5 · New art direction', title: 'Characters, palette, environment', notes: approvedCands.map((a) => `${a.c.name}: ${a.x.name}`).join('\n') || 'No approved candidates.', body: (
      <div className="flex flex-col gap-6">
        {approvedCands.length ? <div className="flex flex-wrap items-end gap-6">{approvedCands.map(({ c, x }) => <figure key={x.id} className="text-center"><Img refx={x.image} alt={x.name} className="h-56 w-40 rounded-lg bg-white/60" /><figcaption className="mt-1 font-sans text-[13px]"><b>{x.name}</b><br />{c.name} · approved by {x.approvedBy}</figcaption></figure>)}</div> : <Missing>No character candidate has been approved yet. Sprint 01 produces the first one.</Missing>}
        <div className="flex flex-wrap gap-2">{['#8DBA5A', '#E8D6B0', '#C9805E', '#3F6B3A', '#B9C2A3', '#7FC4D8', '#E2557E', '#B4573E', '#E7C07A', '#9EC3B5', '#2B1D16'].map((c) => <span key={c} title={c} className="h-10 w-10 rounded-full border-2 border-white shadow" style={{ background: c }} />)}<span className="self-center font-sans text-[13px] text-cocoa/70">World palette from sources/art-direction.md. The 80/15/5 rule stays with the interface.</span></div>
      </div>
    ) },
    { kicker: '6 · Composition', title: 'Density and staging', notes: pref ? `Preferred: ${pref.name}` : 'No preferred composition.', body: base?.thumbnail || pref?.thumbnail ? (
      <div className="grid gap-6 md:grid-cols-2">
        {[['Baseline: the game as built', base], ['Preferred composition', pref]].map(([l, it]) => it && typeof it !== 'string' && it.thumbnail ? <figure key={l as string}><img src={it.thumbnail} alt={it.name} className="w-full rounded-lg" /><figcaption className="mt-1 font-sans text-[13px]"><b>{l as string}</b> · {it.name} · {it.metrics?.people} people, {Math.round((it.metrics?.emptyShare ?? 0) * 100)}% empty, difficulty {it.metrics?.difficultyScore.toFixed(2)} (tentative)</figcaption></figure> : <Missing key={l as string}>{l as string}: not saved yet.</Missing>)}
      </div>
    ) : <Missing>Save a baseline and a preferred iteration in the Scene Composer.</Missing> },
    { kicker: '7 · Before and after', title: strongest?.name ?? 'Before and after', notes: strongest ? RUBRIC.filter((k) => strongest.rubric[k]).map((k) => `${k}: ${strongest.rubric[k].left ?? '-'} → ${strongest.rubric[k].right ?? '-'}`).join('\n') : 'None.', body: strongest ? (
      <div className="flex flex-col gap-3"><div className="grid gap-4 md:grid-cols-2"><Pic r={strongest.left!} label={strongest.leftLabel} /><Pic r={strongest.right!} label={strongest.rightLabel} /></div>
        <p className="font-sans text-[14px]">{RUBRIC.filter((k) => strongest.rubric[k]?.left != null || strongest.rubric[k]?.right != null).map((k) => `${k} ${strongest.rubric[k].left ?? '–'} → ${strongest.rubric[k].right ?? '–'}`).join(' · ') || 'Rubric not scored yet.'}{strongest.preferred ? ` · Preferred: ${strongest.preferred === 'left' ? strongest.leftLabel : strongest.rightLabel}` : ''}</p></div>
    ) : <Missing>No comparison with both images yet.</Missing> },
    { kicker: '8 · Engineering decisions', title: 'Preserved, changed, unresolved', notes: decisions.map((d) => `${d.code} ${d.title}: ${d.workflow}`).join('\n'), body: (
      <table className="w-full font-sans text-[14px]"><tbody>{decisions.map((d) => <tr key={d.id} className="border-b border-cocoa/10"><td className="py-1.5 pr-3 font-mono text-[12px]">{d.code}</td><td className="pr-3">{d.title}</td><td className={`pr-3 font-semibold ${d.workflow === 'Approved' ? 'text-moss' : d.workflow === 'Rejected' ? 'text-[#B3261E]' : 'text-terracotta'}`}>{d.workflow === 'Approved' ? 'Changed (approved)' : d.workflow === 'Rejected' ? 'Preserved (proposal rejected)' : 'Unresolved'}</td><td className="text-[12.5px] text-cocoa/70">{d.workflow === 'Approved' ? d.currentApproved : d.proposedReplacement}</td></tr>)}</tbody></table>
    ) },
    { kicker: '9 · Roadmap', title: 'One approved change at a time', notes: sprints.map((s) => `${s.code}: ${sprintGates(ws, s).filter((g) => g.ok).length}/6 gates`).join('\n'), body: (
      <ol className="flex flex-col gap-3 font-sans">{sprints.map((s) => { const g = sprintGates(ws, s); return <li key={s.id} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 md:grid-cols-[8rem_minmax(0,1fr)_10rem]"><b>{s.code}</b><span>{s.title}</span><span className="flex gap-1">{g.map((x, i) => <span key={i} title={x.label} className={`h-3 flex-1 rounded ${x.ok ? 'bg-moss' : 'bg-cocoa/15'}`} />)}</span></li>; })}</ol>
    ) },
    { kicker: '10 · Next build', title: cur ? `${cur.code}: ${cur.title}` : 'Next build', notes: brief?.title ?? 'No brief generated.', body: (
      <div className="grid gap-6 font-sans md:grid-cols-2">
        <div>{cur ? <ul className="flex flex-col gap-1.5 text-[15px]">{sprintGates(ws, cur).map((g) => <li key={g.label}><span className={g.ok ? 'text-moss' : 'text-cocoa/40'}>{g.ok ? '✓' : '○'}</span> {g.label}</li>)}</ul> : <Missing>No current sprint.</Missing>}</div>
        <div>{brief ? <><p className="text-[12px] uppercase tracking-[0.16em] text-terracotta">Implementation brief</p><p className="font-display text-[24px]">{brief.title}</p><p className="mt-2 text-[14px] text-cocoa/70">Generated {brief.createdAt.slice(0, 10)}. {Object.values(ws.reviews).filter((r) => reviewResult(r).verdict === 'Pass').length} passing quality review(s) recorded.</p></> : <Missing>Generate a brief in the Export Center.</Missing>}</div>
      </div>
    ) },
  ];
}

export default function Demo() {
  const live = useWs();
  const route = useRoute();
  const ms = useMilestones();
  useEffect(() => { ms.load(); }, []); // eslint-disable-line
  const mid = route.q.get('milestone');
  const milestone = mid ? ms.list.find((m) => m.id === mid) : null;
  const ws = milestone?.data ?? live;
  const deck = useMemo(() => slides(ws), [ws]);
  const [i, setI] = useState(Number(route.q.get('slide') ?? 0) || 0);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); setI((x) => Math.min(deck.length - 1, x + 1)); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
      else if (e.key === 'Home') setI(0); else if (e.key === 'End') setI(deck.length - 1);
      else if (e.key.toLowerCase() === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); }
      else if (e.key === 'Escape' && !document.fullscreenElement) go('command');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [deck.length]);
  useEffect(() => { document.title = `${deck[i].kicker} · Demo Theater`; }, [i, deck]);
  const s = deck[i];
  function notes() {
    download(`demo-notes-${new Date().toISOString().slice(0, 10)}.md`, `# Demo notes: ${ws.project.title}\n\n${milestone ? `Milestone: ${milestone.name} (${milestone.at.slice(0, 10)})\n\n` : ''}${deck.map((d) => `## ${d.kicker}: ${d.title}\n\n${d.notes}`).join('\n\n')}\n`);
  }
  return (
    <div className="flex min-h-screen flex-col bg-[#F3E9DA] text-cocoa" style={{ colorScheme: 'light' }}>
      <header className="flex flex-wrap items-center gap-3 px-4 py-4 font-sans text-[12.5px] md:px-8">
        <span className="font-display text-[15px]">Waldo's Savannah · Demo Theater</span>
        <select aria-label="Project iteration" className="rounded border border-cocoa/20 bg-transparent px-2 py-1" value={mid ?? ''} onChange={(e) => setQuery('milestone', e.target.value || null)}>
          <option value="">Current workspace</option>
          {ms.list.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.at.slice(0, 10)})</option>)}
        </select>
        <span className="ml-auto hidden text-cocoa/60 md:inline">← → to move · F fullscreen · Esc exits</span>
        <button className="rounded border border-cocoa/20 px-2 py-1 hover:bg-white/50" onClick={notes}>Export notes</button>
        <button className="rounded bg-cocoa px-3 py-1 text-[#FFFDF9]" onClick={() => go('command')}>Exit</button>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-6 md:px-8" aria-live="polite">
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-terracotta">{s.kicker}</p>
        <h1 className="mb-6 font-display text-[clamp(32px,4.6vw,60px)] leading-[1.05]">{s.title}</h1>
        <div className="flex-1 font-display">{s.body}</div>
      </main>
      <footer className="flex items-center gap-3 px-4 pb-5 font-sans text-[12px] md:px-8">
        <button aria-label="Previous slide" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full border border-cocoa/30 px-3 py-1 disabled:opacity-30">←</button>
        <div className="flex flex-1 gap-1" role="tablist" aria-label="Slides">{deck.map((d, n) => <button key={n} role="tab" aria-selected={n === i} aria-label={d.kicker} onClick={() => setI(n)} className={`h-1.5 flex-1 rounded-full ${n === i ? 'bg-cocoa' : n < i ? 'bg-cocoa/40' : 'bg-cocoa/15'}`} />)}</div>
        <button aria-label="Next slide" disabled={i === deck.length - 1} onClick={() => setI(i + 1)} className="rounded-full border border-cocoa/30 px-3 py-1 disabled:opacity-30">→</button>
        <span className="tabular-nums text-cocoa/60">{i + 1} / {deck.length}</span>
      </footer>
    </div>
  );
}
