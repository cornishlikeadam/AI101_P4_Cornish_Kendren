/* Progress is earned by evidence, never by filled-in fields. These functions decide whether a review passes,
   whether a sprint's gates are met, and what to do next, and they always say which records decided it. */
import type { Candidate, Character, Kind, QualityReview, QcKey, Sprint, Workspace } from '../types';
import { QC_CATEGORIES } from '../types';

export interface ReviewResult { verdict: 'Pass' | 'Blocked' | 'Incomplete' | 'Below bar'; score: number | null; reasons: string[] }

export function reviewResult(r: QualityReview): ReviewResult {
  const keys = Object.keys(QC_CATEGORIES) as QcKey[];
  const reasons: string[] = [];
  const scored = keys.filter((k) => r.entries[k]?.score != null);
  const score = scored.length ? scored.reduce((s, k) => s + (r.entries[k].score as number), 0) / scored.length : null;
  const blocking = keys.filter((k) => r.entries[k]?.blocking);
  const failedChecks = keys.flatMap((k) => Object.entries(r.entries[k]?.checks ?? {}).filter(([, v]) => v === false).map(([c]) => `${QC_CATEGORIES[k].label}: ${c}`));
  if (blocking.length) reasons.push('Blocking failure in ' + blocking.map((k) => QC_CATEGORIES[k].label).join(', '));
  if (scored.length < keys.length) reasons.push(`${keys.length - scored.length} of ${keys.length} categories not scored`);
  if (!r.evidence.length) reasons.push('No visual evidence attached');
  const low = scored.filter((k) => (r.entries[k].score as number) < 3);
  if (low.length) reasons.push('Below 3: ' + low.map((k) => QC_CATEGORIES[k].label).join(', '));
  if (failedChecks.length) reasons.push(`${failedChecks.length} checklist item(s) marked failing`);
  let verdict: ReviewResult['verdict'];
  if (blocking.length) verdict = 'Blocked';
  else if (scored.length < keys.length || !r.evidence.length) verdict = 'Incomplete';
  else if (low.length || (score ?? 0) < 3.5 || failedChecks.length) verdict = 'Below bar';
  else { verdict = 'Pass'; reasons.push(`All categories scored, average ${score!.toFixed(2)}, evidence attached, no blocking failure`); }
  return { verdict, score, reasons };
}

export interface Gate { label: string; ok: boolean; detail: string; link?: { kind: Kind; id: string } }

function sprintCandidates(ws: Workspace, s: Sprint): { ch: Character; c: Candidate }[] {
  return s.characterIds.flatMap((id) => (ws.characters[id]?.candidates ?? []).map((c) => ({ ch: ws.characters[id], c })));
}

/** The six evidence gates (brief §16 example gate) evaluated from linked records. */
export function sprintGates(ws: Workspace, s: Sprint): Gate[] {
  const cands = sprintCandidates(ws, s);
  const uploads = s.assetIds.map((id) => ws.assets[id]).filter((a) => a && a.origin === 'upload');
  const revised = cands.length > 0 || uploads.length > 0;
  const captured = cands.filter(({ c }) => c.captures.length > 0);
  const comps = Object.values(ws.comparisons).filter((c) => s.comparisonIds.includes(c.id) || c.issueIds.some((i) => s.issueIds.includes(i)));
  const compsWithBoth = comps.filter((c) => c.left && c.right);
  const reviews = Object.values(ws.reviews).filter((r) => s.reviewIds.includes(r.id) || cands.some(({ c }) => r.subject.id === c.id) || uploads.some((a) => r.subject.id === a.id));
  const passing = reviews.filter((r) => reviewResult(r).verdict === 'Pass');
  const posed = reviews.filter((r) => (r.entries.construction?.checks?.['Readable pose'] === true || r.entries.variation?.checks?.['Different poses'] === true || r.entries.variation?.checks?.['Different expressions'] === true) && r.evidence.length > 0);
  return [
    { label: 'An actual revised asset exists', ok: revised, detail: revised ? `${cands.length} uploaded candidate(s), ${uploads.length} uploaded asset(s)` : 'Upload a candidate in Character Workshop or link an uploaded asset', link: cands[0] ? { kind: 'character', id: cands[0].ch.id } : undefined },
    { label: 'Previewed at intended gameplay scale', ok: captured.length > 0, detail: captured.length ? `${captured.length} candidate(s) with a saved gameplay-scale capture` : 'Use "Save gameplay-scale capture" in Character Workshop', link: captured[0] ? { kind: 'character', id: captured[0].ch.id } : undefined },
    { label: 'Compared against the old representation', ok: compsWithBoth.length > 0, detail: compsWithBoth.length ? `${compsWithBoth.length} comparison(s) with both images` : 'Save a comparison in Comparison Studio and link it to this sprint', link: compsWithBoth[0] ? { kind: 'comparison', id: compsWithBoth[0].id } : undefined },
    { label: 'Pose or expression quality demonstrated', ok: posed.length > 0, detail: posed.length ? 'A review with evidence marks pose or expression variety' : 'In the review, tick "Readable pose" or "Different poses/expressions" with evidence attached', link: posed[0] ? { kind: 'review', id: posed[0].id } : undefined },
    { label: 'Sprite quality checklist passes', ok: passing.length > 0, detail: passing.length ? `${passing.length} passing review(s)` : reviews.length ? `Reviews exist but none pass: ${reviewResult(reviews[0]).reasons[0] ?? ''}` : 'No quality review linked yet', link: (passing[0] ?? reviews[0]) ? { kind: 'review', id: (passing[0] ?? reviews[0]).id } : undefined },
    { label: 'Explicit acceptance by the project owner', ok: !!s.ownerAccepted, detail: s.ownerAccepted ? `Accepted by ${s.ownerAccepted.by} on ${s.ownerAccepted.at.slice(0, 10)}` : 'Not accepted' },
  ];
}

export function nextActions(ws: Workspace): { text: string; to: string; why: string }[] {
  const out: { text: string; to: string; why: string }[] = [];
  const p = ws.project;
  if (!p.owner) out.push({ text: 'Set the project owner\'s name', to: '#/command?edit=project', why: 'Approvals and acceptances record who made them.' });
  const sprint = p.currentChallenge?.kind === 'sprint' ? ws.sprints[p.currentChallenge.id] : null;
  if (sprint && !sprint.baselineImage) out.push({ text: `Attach a baseline screenshot to ${sprint.code}`, to: `#/sprints/${sprint.id}`, why: 'Every later comparison needs a fixed starting point.' });
  if (!Object.keys(ws.iterations).length) out.push({ text: 'Save a baseline iteration in Scene Composer', to: '#/composer', why: 'Density experiments need the game\'s own layout for the same seed to compare against.' });
  if (sprint) {
    const gates = sprintGates(ws, sprint);
    const first = gates.find((g) => !g.ok);
    if (first) out.push({ text: `${sprint.code}: ${first.label.toLowerCase()}`, to: `#/sprints/${sprint.id}`, why: first.detail });
  }
  if (!Object.values(ws.measurements).length) out.push({ text: 'Run a lab benchmark of the current build', to: '#/quality?tab=bench', why: 'Performance numbers in performance.md are documented claims until re-measured.' });
  const proposed = Object.values(ws.decisions).filter((d) => d.workflow === 'Proposed').sort((a, b) => a.priority - b.priority);
  if (proposed.length) out.push({ text: `Decide ${proposed[0].code}: ${proposed[0].title}`, to: `#/rules/${proposed[0].id}`, why: `${proposed.length} design rule(s) await a decision.` });
  if (!Object.values(ws.references).length) out.push({ text: 'Add licensed references to the Reference Studio', to: '#/references', why: 'Design rules should cite visual evidence.' });
  const unreviewed = Object.values(ws.characters).flatMap((ch) => ch.candidates.filter((c) => !Object.values(ws.reviews).some((r) => r.subject.id === c.id)).map((c) => ({ ch, c })));
  if (unreviewed.length) out.unshift({ text: `Review candidate "${unreviewed[0].c.name}"`, to: `#/characters/${unreviewed[0].ch.id}`, why: 'Uploaded candidates count for nothing until reviewed.' });
  return out;
}
