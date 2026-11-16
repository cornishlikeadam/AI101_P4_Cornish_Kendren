/* Implementation brief generator. Uses only what the workspace and the repository snapshot contain; says
   "not recorded" rather than inventing, and keeps each decision's approval state next to it. */
import type { BriefSelection, DesignDecision, Milestone, Workspace } from '../types';
import { snapshot } from '../seed/snapshot';
import { reviewResult, sprintGates } from './readiness';

export const PRESERVED_CONTRACTS = [
  'Deterministic replay: same seed, scene, difficulty, density, crowd and artVersion build the same world (HARNESS hard rule 5; HANDOFF replay identity).',
  '`?seed=`, `?scene=`, `?difficulty=`, `?density=`, `?crowd=` (20–10,000, stress only), `?fallback=1`, `?beacon=1` keep their meaning (HANDOFF URL parameters).',
  'Exactly one target with all five traits: red-and-white horizontal stripes (#E53935/#FFFFFF), striped bobble hat with white pom-pom, round glasses, #1E88E5 trousers, #8D6E63 walking stick. Decoys carry at most two (make.js throws otherwise).',
  'Pan versus click: a tap counts only if one pointer travelled under 6 CSS px and was not cancelled (src/engine/input.js).',
  'State machine INIT → INTRO → PLAYING → WON, with FALLBACK reachable and a friendly recovery card.',
  'Timer, wrong-guess count, hints (two per round), local leaderboard key `waldos_savannah_leaderboard_v1`, ten records, sorted by points then time then wrong guesses, names rendered as text.',
  'Share links carry the whole replay identity.',
  'No runtime request outside the build folder: no CDN, font service, analytics, accounts or remote storage (HARNESS hard rule 1).',
  'Keyboard: arrows/WASD pan, + and - zoom, 0 resets; prefers-reduced-motion freezes world motion.',
  'Graceful errors: asset or scene failure shows the fallback state, never a blank page.',
];

const OWNERS: [RegExp, string][] = [
  [/vibe-coding\/src\/engine\/|tools\/pack-assets/, 'Agent 1 (rendering)'],
  [/vibe-coding\/(assets|src\/scenes|src\/characters)\/|sources\/(art-direction|asset-register)|docs\/.*blueprint/, 'Agent 2 (art and scenes)'],
  [/vibe-coding\/(src\/gameplay|src\/ui|tests)\/|build\/index\.html|build-record\//, 'Agent 3 (UX, gameplay, QA)'],
];
export const ownerOf = (f: string) => OWNERS.find(([re]) => re.test(f))?.[1] ?? 'unassigned';

const state = (d: DesignDecision) => (d.workflow === 'Approved' ? `APPROVED${d.history.filter((h) => h.action === 'Approved').slice(-1).map((h) => ` by ${h.by} ${h.at.slice(0, 10)}`).join('')}` : `${d.workflow.toUpperCase()} (not approved, do not implement as settled)`);

export interface Brief { title: string; sections: { heading: string; body: string }[]; files: string[]; decisions: { code: string; title: string; state: string; value: string }[]; selection: BriefSelection }

export function buildBrief(ws: Workspace, sel: BriefSelection, milestones: Milestone[]): Brief {
  const issue = sel.issueId ? ws.issues[sel.issueId] : null;
  const sprint = sel.sprintId ? ws.sprints[sel.sprintId] : null;
  const scene = sel.sceneId ? ws.scenes[sel.sceneId] : null;
  const ch = sel.characterId ? ws.characters[sel.characterId] : null;
  const ms = sel.milestoneId ? milestones.find((m) => m.id === sel.milestoneId) ?? null : null;
  const decIds = new Set([sel.decisionId, ...(issue?.decisionIds ?? []), ...(sprint?.decisionIds ?? []), ...(scene?.decisionIds ?? []), ...(ch?.decisionIds ?? [])].filter(Boolean) as string[]);
  const decisions = [...decIds].map((id) => ws.decisions[id]).filter(Boolean).sort((a, b) => a.priority - b.priority);
  const files = [...new Set([...(issue?.codePaths ?? []), ...(sprint?.files ?? []), ...decisions.flatMap((d) => d.relatedFiles)])];
  const refIds = new Set([...(sprint?.referenceIds ?? []), ...decisions.flatMap((d) => d.referenceIds)]);
  const refs = [...refIds].map((id) => ws.references[id]).filter(Boolean);
  const tests = [...new Set(decisions.flatMap((d) => d.tests))];
  const repoTests = snapshot.tests ?? [];
  const cands = ch?.candidates ?? [];
  const approvedCands = cands.filter((c) => c.approval === 'Approved');
  const comparisons = Object.values(ws.comparisons).filter((c) => (sprint?.comparisonIds ?? []).includes(c.id) || (issue?.comparisonIds ?? []).includes(c.id));
  const reviews = Object.values(ws.reviews).filter((r) => (sprint?.reviewIds ?? []).includes(r.id) || cands.some((c) => c.id === r.subject.id));
  const gates = sprint ? sprintGates(ws, sprint) : [];
  const title = sprint ? `${sprint.code}: ${sprint.title}` : issue ? `${issue.code}: ${issue.title}` : ch ? `Character family: ${ch.name}` : scene ? `Scene composition: ${scene.name}` : decisions[0] ? `${decisions[0].code}: ${decisions[0].title}` : 'Implementation brief';

  const nr = '_Not recorded in the lab._';
  const sections = [
    { heading: 'Current behavior', body: [
      `Repository snapshot \`${snapshot.git?.head ?? 'unknown'}\` on \`${snapshot.git?.branch ?? 'unknown'}\` (read ${snapshot.generatedAt.slice(0, 10)}), art version ${snapshot.artVersion ?? 'unknown'}.`,
      issue?.rootCause ? `Issue analysis (${issue.status}): ${issue.rootCause}` : '',
      sprint?.baseline ? `Sprint baseline: ${sprint.baseline}` : '',
      ch ? `Current drawings for ${ch.name}: ${ch.assetIds.map((a) => '`assets/' + a + '.svg`').join(', ')}.` : '',
      scene ? `Scene: seed \`${scene.params.seed}\`, ${scene.params.district}, ${scene.params.difficulty}, ${scene.params.density}. Built by the game's own scene code.` : '',
      ...decisions.map((d) => `${d.code} original rule: ${d.originalRule}`),
    ].filter(Boolean).join('\n\n') || nr },
    { heading: 'Problem', body: [issue?.description, sprint?.problem].filter(Boolean).join('\n\n') || nr },
    { heading: 'Approved direction', body: decisions.length ? decisions.map((d) => `- **${d.code} ${d.title}**: ${state(d)}. ${d.workflow === 'Approved' ? d.currentApproved ?? d.proposedReplacement : 'Proposed: ' + d.proposedReplacement}`).join('\n') + (approvedCands.length ? `\n- Approved character candidate(s): ${approvedCands.map((c) => `"${c.name}" (by ${c.approvedBy} ${c.approvedAt?.slice(0, 10)})`).join(', ')}` : '') + (scene?.preferredIterationId ? `\n- Preferred composition: "${ws.iterations[scene.preferredIterationId]?.name}"` : '') : '_No decision is linked. Approve or link one before building._' },
    { heading: 'Relevant references', body: [...refs.map((r) => `- ${r.title}${r.url ? ` <${r.url}>` : ''} (rights: ${r.license ?? 'not recorded'})`), ...decisions.map((d) => `- ${d.code} source: ${d.sourceRef}`), ...comparisons.map((c) => `- Comparison "${c.name}"${c.preferred ? `, preferred: ${c.preferred === 'left' ? c.leftLabel : c.rightLabel}` : ''}`)].join('\n') || nr },
    { heading: 'Files involved', body: files.length ? files.map((f) => `- \`${f}\` (owner: ${ownerOf(f)})`).join('\n') : nr },
    { heading: 'Required changes', body: [issue?.proposedChange, issue?.steps, sprint?.plan, sprint?.workItems.length ? sprint.workItems.map((w) => `- [${w.done ? 'x' : ' '}] ${w.text}`).join('\n') : '', scene ? sceneChanges(ws, scene.id) : ''].filter(Boolean).join('\n\n') || nr },
    { heading: 'Preserved contracts', body: PRESERVED_CONTRACTS.map((c) => `- ${c}`).join('\n') },
    { heading: 'Asset requirements', body: assetReq(ws, ch?.id ?? null, sprint?.assetIds ?? [], issue?.assetIds ?? []) },
    { heading: 'Testing', body: [
      'Reproducible steps:',
      '1. `node vibe-coding/tools/build.mjs` (packs assets, joins sources).',
      '2. `node vibe-coding/tests/illustrated.test.mjs`; every check must pass. Most relevant: ' + (tests.length ? tests.map((t) => `"${t}"`).join(', ') : repoTests.slice(0, 4).map((t) => `"${t.name}"`).join(', ')) + '.',
      `3. Capture screenshots at fixed seeds${scene ? ` (\`${scene.params.seed}\`)` : ''} and viewports into \`vibe-coding/build-record/visual-qa/\`, with written observations.`,
      sprint?.testing ? '4. ' + sprint.testing : '',
      '5. Re-run the lab checks (Quality Control → Automated checks) and attach a before/after comparison.',
    ].filter(Boolean).join('\n') },
    { heading: 'Acceptance criteria', body: [...(sprint?.acceptance ?? []).map((a) => `- [ ] ${a}`), issue?.acceptance ? `- [ ] ${issue.acceptance}` : '', ...gates.map((g) => `- [${g.ok ? 'x' : ' '}] Gate: ${g.label}. ${g.detail}`)].filter(Boolean).join('\n') || nr },
    { heading: 'Risks and unresolved questions', body: [
      ...decisions.filter((d) => d.workflow !== 'Approved').map((d) => `- ${d.code} is ${d.workflow.toLowerCase()}, not approved.`),
      ...decisions.filter((d) => d.status === 'Needs research').map((d) => `- ${d.code} needs research.`),
      issue && issue.status !== 'Verified' ? `- ${issue.code} is "${issue.status}": its cause is a hypothesis.` : '',
      ...reviews.map((r) => { const v = reviewResult(r); return v.verdict !== 'Pass' ? `- Quality review ${r.id} is ${v.verdict}: ${v.reasons[0] ?? ''}` : ''; }),
      ws.project.restrictions ? `- Course restrictions: ${ws.project.restrictions}` : '',
      ...Object.values(ws.landmarks).filter((l) => l.status === 'Needs research' && (!scene || l.district === scene.params.district)).map((l) => `- Landmark "${l.name}" needs research before it is named as a real place.`),
      '- Changing art changes what old seeds show: bump `artVersion` if the drawing set changes (ADR-002 Consequences).',
    ].filter(Boolean).join('\n') },
    { heading: 'Next milestone', body: sprint?.nextDependency || (ms ? `After milestone "${ms.name}" (${ms.at.slice(0, 10)}).` : '') || 'One follow-up, chosen after the owner accepts this change.' },
  ];
  return { title, sections, files, decisions: decisions.map((d) => ({ code: d.code, title: d.title, state: state(d), value: d.workflow === 'Approved' ? d.currentApproved ?? d.proposedReplacement : d.proposedReplacement })), selection: sel };
}

function sceneChanges(ws: Workspace, sceneId: string) {
  const s = ws.scenes[sceneId]; const p = s.params;
  const it = s.preferredIterationId ? ws.iterations[s.preferredIterationId] : null;
  const src = it ?? s;
  const q = src.params;
  const adj = [q.crowdScale !== 1 && `crowd ×${q.crowdScale}`, q.varietyBias && `variety ${q.varietyBias}`, q.overlap && `clustering ${q.overlap}`, q.propScale !== 1 && `props ×${q.propScale}`, q.foregroundEmphasis && `foreground ${q.foregroundEmphasis}`, q.decoyBoost && `decoys +${q.decoyBoost}`, q.landmarkProminence !== 1 && `landmarks ×${q.landmarkProminence}`].filter(Boolean);
  return `Composition target (${it ? `preferred iteration "${it.name}"` : 'current editor state, no preferred iteration'}) for seed \`${p.seed}\`, ${p.district}: ${adj.length ? adj.join(', ') : 'no lab adjustments'}; ${Object.keys(src.moved).length} moved, ${src.added.length} added, ${src.removed.length} removed sprites. These are lab simulations: translate them into scene code in \`vibe-coding/src/scenes/\` (budgets, zones, story clusters), not into new runtime parameters.${it?.metrics ? ` Target metrics: ${it.metrics.people} people, ${Math.round(it.metrics.emptyShare * 100)}% empty, ${it.metrics.decoys} decoys.` : ''}`;
}

function assetReq(ws: Workspace, chId: string | null, ...idLists: string[][]) {
  const ch = chId ? ws.characters[chId] : null;
  const assets = [...new Set(idLists.flat())].map((id) => ws.assets[id]).filter(Boolean);
  const lines = [
    ...(ch?.candidates ?? []).filter((c) => c.approval !== 'Rejected').map((c) => `- Candidate "${c.name}" (${c.approval}): ${c.svgText ? 'SVG' : 'raster'}, ${c.units} game units tall. Lives in the lab's browser storage only: export it and add it under \`vibe-coding/assets/characters/\` with a row in \`sources/asset-register.md\`.`),
    ...assets.map((a) => `- ${a.repoId ?? a.title} (${a.stage}, v${a.version}): ${a.dims ?? 'size unknown'}; licence: ${a.license ?? 'not recorded'}${a.knownIssues ? `; known issues: ${a.knownIssues}` : ''}`),
    '- Format: original SVG with a `data-anchor`, colour slots as CSS custom properties, `<!--HEAD-->` sockets where a head kit applies (HANDOFF asset manifest). Ink #2B1D16; people about 1.1 world-unit outline.',
    '- Provenance: every new file needs a row in `vibe-coding/sources/asset-register.md`. Nothing traced or extracted from books (HARNESS hard rule 2).',
  ];
  return lines.join('\n');
}

export function briefMarkdown(b: Brief) {
  return `# ${b.title}\n\n_Implementation brief from the Waldo's Savannah Build Lab, ${new Date().toISOString().slice(0, 10)}. Approval states are as recorded in the lab; anything marked not approved is a proposal._\n\n${b.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n')}\n`;
}

export function briefJson(b: Brief) {
  return JSON.stringify({ generatedBy: "Waldo's Savannah Build Lab", generatedAt: new Date().toISOString(), repoHead: snapshot.git?.head ?? null, ...b, sections: Object.fromEntries(b.sections.map((s) => [s.heading, s.body])) }, null, 2);
}

export function briefGithub(b: Brief) {
  return `${b.sections.map((s) => `### ${s.heading}\n\n${s.body}`).join('\n\n')}\n\n---\n_Generated by the Build Lab. Decisions: ${b.decisions.map((d) => `${d.code} ${d.state}`).join('; ') || 'none linked'}._`;
}

export function builderPrompt(b: Brief) {
  const owners = [...new Set(b.files.map(ownerOf))];
  return `You are working in the Waldo's Savannah repository. Make one bounded change: ${b.title}.

Before you start, read HARNESS.md, HANDOFF.md, AGENTS.md and vibe-coding/decisions/ADR-002-illustrated-world.md. File ownership: ${owners.length ? owners.join(', ') : 'see AGENTS.md'}. Change another agent's files only through a HANDOFF contract change.

Scope: change only what this brief lists. Do not redesign other districts, the HUD, the engine or the art direction. If something outside the scope looks wrong, write it in the failure log instead of fixing it.

${b.sections.map((s) => `## ${s.heading}\n${s.body}`).join('\n\n')}

Rules that override anything above:
- Decisions marked "not approved" are proposals. Do not implement them as settled; ask the owner.
- Keep every preserved contract. Run \`node vibe-coding/tools/build.mjs\` and \`node vibe-coding/tests/illustrated.test.mjs\` and report the real results.
- A passing test suite never satisfies a visual gate. Capture screenshots at fixed seeds into vibe-coding/build-record/visual-qa/ with written observations.
- Do not claim performance numbers you did not measure. Log the session in vibe-coding/build-record/ai-use-log.md.
- Do not edit vibe-coding/reflection.md.
`;
}
