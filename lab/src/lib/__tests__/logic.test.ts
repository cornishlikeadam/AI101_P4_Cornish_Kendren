import { describe, expect, it } from 'vitest';
import { initialWorkspace } from '../../seed/seed';
import { snapshot } from '../../seed/snapshot';
import { reviewResult, sprintGates, nextActions } from '../readiness';
import { nextAdrNumber, decisionAdr, pipelineAdr } from '../exporters';
import { renderMarkdown } from '../markdown';
import { buildBrief, briefMarkdown, PRESERVED_CONTRACTS } from '../brief';
import { QC_CATEGORIES, type QcKey, type QualityReview } from '../../types';
import { useLab } from '../../store/store';

const ws = () => initialWorkspace(snapshot);
function review(score: number | null, opts: { blocking?: boolean; evidence?: boolean; failCheck?: boolean } = {}): QualityReview {
  const entries = Object.fromEntries((Object.keys(QC_CATEGORIES) as QcKey[]).map((k, i) => [k, { score, checks: Object.fromEntries(QC_CATEGORIES[k].checks.map((c, j) => [c, opts.failCheck && i === 0 && j === 0 ? false : true])), blocking: !!opts.blocking && i === 0, note: '' }])) as QualityReview['entries'];
  return { id: 'rev_t', createdAt: '', updatedAt: '', status: 'In progress', source: null, rationale: null, tags: [], subject: { kind: 'asset', id: 'x' }, reviewer: '', entries, evidence: opts.evidence === false ? [] : [{ kind: 'blob', id: 'b' }], observations: '' };
}

describe('seed workspace', () => {
  it('is grounded: no approvals, scores, playtests or measurements are invented', () => {
    const w = ws();
    expect(Object.values(w.decisions).every((d) => d.workflow === 'Proposed' && d.currentApproved === null)).toBe(true);
    expect(Object.keys(w.reviews)).toHaveLength(0);
    expect(Object.keys(w.measurements)).toHaveLength(0);
    expect(Object.values(w.clues).every((c) => c.playtests.length === 0)).toBe(true);
    expect(Object.values(w.comparisons).every((c) => Object.keys(c.rubric).length === 0)).toBe(true);
    expect(w.sprints.spr_s01.ownerAccepted).toBeNull();
    expect(Object.values(w.issues).map((i) => i.code)).toEqual(Array.from({ length: 10 }, (_, i) => 'VIS-' + String(i + 1).padStart(3, '0')));
    expect(Object.values(w.decisions).map((d) => d.code).sort()).toEqual(['ADR-V001', 'ADR-V002', 'ADR-V003', 'ADR-V004', 'ADR-V005', 'ADR-V006', 'ADR-V007', 'ADR-V008']);
  });
  it('has exactly one target family with the five traits written down', () => {
    const targets = Object.values(ws().characters).filter((c) => c.isTarget);
    expect(targets).toHaveLength(1);
    for (const t of ['stripes', 'bobble hat', 'glasses', 'blue trousers', 'walking stick']) expect((targets[0].params.clothing + targets[0].params.accessories + targets[0].params.silhouette).toLowerCase()).toContain(t.split(' ')[0]);
  });
  it('cites seeded test names that really exist in the game suite', () => {
    const names = new Set((snapshot.tests ?? []).map((t) => t.name));
    for (const d of Object.values(ws().decisions)) for (const t of d.tests) expect(names.has(t)).toBe(true);
  });
});

describe('quality review verdicts', () => {
  it('passes only with every category scored, evidence and no blocking failure', () => {
    expect(reviewResult(review(4)).verdict).toBe('Pass');
    expect(reviewResult(review(4, { evidence: false })).verdict).toBe('Incomplete');
    expect(reviewResult(review(4, { blocking: true })).verdict).toBe('Blocked');
    expect(reviewResult(review(2)).verdict).toBe('Below bar');
    expect(reviewResult(review(4, { failCheck: true })).verdict).toBe('Below bar');
    expect(reviewResult(review(null)).verdict).toBe('Incomplete');
  });
});

describe('sprint gates', () => {
  it('start unmet and are not satisfied by text alone', () => {
    const w = ws();
    w.sprints.spr_s01.plan = 'A long plan.'; w.sprints.spr_s01.workItems = [{ id: 'w', text: 'done', done: true }];
    expect(sprintGates(w, w.sprints.spr_s01).filter((g) => g.ok)).toHaveLength(0);
    expect(nextActions(w).length).toBeGreaterThan(2);
  });
});

describe('exports', () => {
  it('numbers new ADRs after the repository ADRs and never reuses ADR-002', () => {
    const w = ws();
    expect(nextAdrNumber(w)).toBe(3);
    const md = decisionAdr(w, w.decisions.dec_adrv001, 3);
    expect(md).toContain('# ADR-003');
    expect(md).toContain('not approved');
    expect(pipelineAdr(w)).toContain('ADR-001 and ADR-002 are not edited');
  });
  it('markdown rendering escapes HTML', () => {
    expect(renderMarkdown('<script>alert(1)</script> **b**')).not.toContain('<script>');
    expect(renderMarkdown('<img src=x onerror=alert(1)>')).toContain('&lt;img');
  });
  it('briefs carry real paths, preserved contracts and approval state', () => {
    const w = ws();
    const md = briefMarkdown(buildBrief(w, { issueId: 'iss_vis001', sprintId: 'spr_s01', sceneId: null, characterId: null, decisionId: null, milestoneId: null }, []));
    expect(md).toContain('vibe-coding/src/scenes/build.js');
    for (const c of PRESERVED_CONTRACTS.slice(0, 3)) expect(md).toContain(c.slice(0, 30));
    expect(md).toContain('PROPOSED (not approved');
    expect(md).toContain('illustrated.test.mjs');
  });
});

describe('store', () => {
  it('undoes, redoes and unlinks deleted records everywhere', () => {
    const s = useLab.getState();
    useLab.setState({ ws: ws(), past: [], future: [] });
    s.mutate('t', (d) => { d.decisions.dec_adrv003.title = 'Changed'; });
    expect(useLab.getState().ws.decisions.dec_adrv003.title).toBe('Changed');
    useLab.getState().undo();
    expect(useLab.getState().ws.decisions.dec_adrv003.title).toBe('Zero external image assets');
    useLab.getState().redo();
    expect(useLab.getState().ws.decisions.dec_adrv003.title).toBe('Changed');
    useLab.getState().remove('decision', 'dec_adrv001');
    const after = useLab.getState().ws;
    expect(after.decisions.dec_adrv001).toBeUndefined();
    expect(after.issues.iss_vis001.decisionIds).not.toContain('dec_adrv001');
    expect(after.sprints.spr_s01.decisionIds).not.toContain('dec_adrv001');
  });
});
