import { useMemo, useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, Kv, PageHeader, Section, Select, StatusBadge, StatusSelect, Text, toast } from '../components/ui';
import { Backlinks, FileList, LinkList } from '../components/links';
import { go, href, useRoute } from '../lib/router';
import { download, fmtTime, now, slug, uid } from '../lib/util';
import { decisionAdr, nextAdrNumber } from '../lib/exporters';
import type { DecisionFields, DesignDecision } from '../types';

const FIELD_KEYS: (keyof DecisionFields)[] = ['title', 'category', 'originalRule', 'proposedReplacement', 'rationale', 'evidence', 'evidenceType', 'expectedVisual', 'expectedCost', 'compatibility', 'sourceRef'];
const pickFields = (d: DesignDecision): DecisionFields => Object.fromEntries(FIELD_KEYS.map((k) => [k, d[k]])) as unknown as DecisionFields;
const WF_GLYPH = { Proposed: '◇', Approved: '✓', Rejected: '✗', Superseded: '↷', Experiment: '⚗' } as const;

export default function Rules() {
  const ws = useWs();
  const route = useRoute();
  const [filter, setFilter] = useState<'all' | DesignDecision['workflow']>('all');
  const list = Object.values(ws.decisions).filter((d) => filter === 'all' || d.workflow === filter).sort((a, b) => a.priority - b.priority || a.code.localeCompare(b.code));
  const sel = route.id ? ws.decisions[route.id] : list[0];

  function create() {
    const id = uid('dec');
    const n = Object.keys(ws.decisions).length + 1;
    mutate('new decision', (d) => {
      d.decisions[id] = { id, code: 'ADR-V' + String(n).padStart(3, '0'), createdAt: now(), updatedAt: now(), status: 'Tentative', source: null, rationale: '', tags: [], title: 'New design rule', category: 'General', originalRule: '', proposedReplacement: '', evidence: '', evidenceType: 'None yet', expectedVisual: '', expectedCost: '', compatibility: '', sourceRef: '', owner: d.project.owner, priority: 50, workflow: 'Proposed', lineage: 'experimental', currentApproved: null, supersedes: null, experimentOf: null, history: [{ at: now(), action: 'Created', by: d.project.owner || 'Owner', note: '' }], versions: [], relatedFiles: [], referenceIds: [], assetIds: [], issueIds: [], sprintIds: [], tests: [] };
      logActivity(d, 'Created a design rule', { kind: 'decision', id });
    });
    go('rules', id);
  }

  return (
    <div>
      <PageHeader eyebrow="Design Rules" title="Editable decision registry" lede="The old ADRs are the starting point. Change a rule here with a rationale and evidence, keep its history, and export it as a new ADR. Earlier ADR files are never rewritten.">
        <Button kind="primary" onClick={create}>+ New rule</Button>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {(['all', 'Proposed', 'Approved', 'Experiment', 'Rejected', 'Superseded'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-2.5 py-0.5 text-[12px] ${filter === f ? 'border-cocoa bg-cocoa text-cream' : 'border-line bg-cream hover:border-cocoa/40'}`}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
          <ol className="flex flex-col gap-1.5">
            {list.map((d, i) => (
              <li key={d.id} className={`group rounded-lg border bg-cream ${sel?.id === d.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}>
                <div className="flex items-start gap-2 p-2.5">
                  <a href={href('rules', d.id)} className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted"><span aria-hidden>{WF_GLYPH[d.workflow]}</span>{d.code} · {d.workflow} · {d.lineage}</p>
                    <p className="truncate text-[13.5px] font-medium">{d.title}</p>
                    <div className="mt-1"><StatusBadge status={d.status} small /></div>
                  </a>
                  <div className="flex flex-col">
                    <button aria-label={`Raise priority of ${d.code}`} disabled={i === 0} className="px-1 text-muted hover:text-cocoa disabled:opacity-20" onClick={() => swap(list, i, i - 1)}>▲</button>
                    <button aria-label={`Lower priority of ${d.code}`} disabled={i === list.length - 1} className="px-1 text-muted hover:text-cocoa disabled:opacity-20" onClick={() => swap(list, i, i + 1)}>▼</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {sel ? <DecisionEditor key={sel.id} d={sel} /> : <Empty title="No rules match this filter" />}
      </div>
    </div>
  );
}

function swap(list: DesignDecision[], a: number, b: number) {
  const x = list[a], y = list[b];
  mutate('reorder decisions', (d) => {
    list.forEach((r, i) => { d.decisions[r.id].priority = i + 1; });
    d.decisions[x.id].priority = b + 1; d.decisions[y.id].priority = a + 1;
  });
}

function DecisionEditor({ d }: { d: DesignDecision }) {
  const ws = useWs();
  const owner = ws.project.owner || 'Owner';
  const [cmp, setCmp] = useState<number | null>(d.versions.length ? d.versions.length - 1 : null);
  const set = <K extends keyof DesignDecision>(k: K, v: DesignDecision[K]) => mutate(`decision ${d.id} ${String(k)}`, (w) => { (w.decisions[d.id] as DesignDecision)[k] = v; w.decisions[d.id].updatedAt = now(); });
  const event = (w: Parameters<Parameters<typeof mutate>[1]>[0], action: string, note = '') => { w.decisions[d.id].history.push({ at: now(), action, by: owner, note }); w.decisions[d.id].updatedAt = now(); };
  const snapshotVersion = (w: Parameters<Parameters<typeof mutate>[1]>[0], note: string) => { w.decisions[d.id].versions.push({ at: now(), note, fields: pickFields(w.decisions[d.id] as DesignDecision) }); };

  async function approve() {
    if (!ws.project.owner && !(await confirmAction('No owner name set', 'Approvals record who approved. The project owner is not set, so this will be recorded as "Owner". Continue?', 'Approve anyway', false))) return;
    if (!d.proposedReplacement.trim()) { toast('Write the proposed replacement before approving'); return; }
    mutate('approve decision', (w) => { snapshotVersion(w, 'Approved version'); const x = w.decisions[d.id]; x.workflow = 'Approved'; x.currentApproved = x.proposedReplacement; x.status = 'Completed'; event(w, 'Approved'); logActivity(w, `Approved ${d.code}`, { kind: 'decision', id: d.id }); });
  }
  function reject() { mutate('reject decision', (w) => { snapshotVersion(w, 'Rejected version'); w.decisions[d.id].workflow = 'Rejected'; event(w, 'Rejected'); logActivity(w, `Rejected ${d.code}`, { kind: 'decision', id: d.id }); }); }
  function reopen() { mutate('reopen decision', (w) => { w.decisions[d.id].workflow = 'Proposed'; w.decisions[d.id].status = 'Tentative'; event(w, 'Reopened'); }); }
  function saveVersion() { mutate('save version', (w) => { snapshotVersion(w, 'Saved by owner'); event(w, 'Saved version'); }); toast('Version saved'); }
  function duplicate() {
    const id = uid('dec');
    mutate('duplicate decision', (w) => {
      const src = w.decisions[d.id];
      w.decisions[id] = { ...JSON.parse(JSON.stringify(src)), id, code: src.code + '-X' + (Object.values(w.decisions).filter((x) => x.experimentOf === d.id).length + 1), workflow: 'Experiment', lineage: 'experimental', experimentOf: d.id, status: 'Tentative', currentApproved: null, createdAt: now(), updatedAt: now(), history: [{ at: now(), action: 'Duplicated as experiment', by: owner, note: 'From ' + src.code }], versions: [] };
      event(w, 'Experiment created', w.decisions[id].code);
      logActivity(w, `Experiment from ${d.code}`, { kind: 'decision', id });
    });
    go('rules', id);
  }
  async function restore(i: number) {
    const v = d.versions[i];
    if (!(await confirmAction('Restore this version?', `The current text is saved as a version first, then fields are replaced with the version from ${fmtTime(v.at)}.`, 'Restore', false))) return;
    mutate('restore version', (w) => { snapshotVersion(w, 'Before restore'); Object.assign(w.decisions[d.id], v.fields); event(w, 'Restored version', fmtTime(v.at)); });
  }
  async function del() {
    if (!(await confirmAction(`Delete ${d.code}?`, 'This removes the record and unlinks it from issues and sprints. Undo (⌘Z) can bring it back during this session. Prefer Reject to keep the history.', 'Delete'))) return;
    useLab.getState().remove('decision', d.id); go('rules');
  }
  function exportAdr() {
    const n = nextAdrNumber(ws);
    download(`ADR-${String(n).padStart(3, '0')}-${slug(d.title)}.md`, decisionAdr(ws, d, n));
    mutate('export adr', (w) => event(w, 'Exported ADR', `ADR-${String(n).padStart(3, '0')}`));
  }

  const parent = d.experimentOf ? ws.decisions[d.experimentOf] : null;
  const experiments = Object.values(ws.decisions).filter((x) => x.experimentOf === d.id);
  const version = cmp != null ? d.versions[cmp] : null;
  const diff = useMemo(() => version ? FIELD_KEYS.filter((k) => version.fields[k] !== d[k]) : [], [version, d]);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-cream p-3">
        <span className="font-mono text-[12px] text-muted">{d.code}</span>
        <span className="rounded border border-line px-1.5 text-[12px]">{WF_GLYPH[d.workflow]} {d.workflow}</span>
        <StatusBadge status={d.status} />
        <div className="ml-auto flex flex-wrap gap-1.5">
          {d.workflow !== 'Approved' && <Button small kind="primary" onClick={approve}>Approve</Button>}
          {d.workflow !== 'Rejected' && <Button small onClick={reject}>Reject</Button>}
          {(d.workflow === 'Approved' || d.workflow === 'Rejected') && <Button small onClick={reopen}>Reopen</Button>}
          <Button small onClick={duplicate}>Duplicate as experiment</Button>
          <Button small onClick={saveVersion}>Save version</Button>
          <Button small onClick={exportAdr}>Export as ADR</Button>
          <Button small kind="danger" onClick={del}>Delete</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <Section title="Rule">
            <div className="grid gap-3 md:grid-cols-2">
              <Text label="Title" value={d.title} onChange={(v) => set('title', v)} className="md:col-span-2" />
              <Text label="Category" value={d.category} onChange={(v) => set('category', v)} />
              <Text label="Owner" value={d.owner} onChange={(v) => set('owner', v)} />
              <Area label="Original rule" value={d.originalRule} onChange={(v) => set('originalRule', v)} hint="As documented. Kept for provenance." />
              <Area label="Proposed replacement" value={d.proposedReplacement} onChange={(v) => set('proposedReplacement', v)} />
              {d.currentApproved && <div className="rounded-md border border-moss/40 bg-moss/5 p-3 md:col-span-2"><p className="text-[11.5px] font-semibold uppercase tracking-wide text-moss">Current approved value</p><p className="text-[13.5px]">{d.currentApproved}</p></div>}
              <Area label="Design rationale" rows={4} value={d.rationale} onChange={(v) => set('rationale', v)} className="md:col-span-2" />
              <Area label="Supporting evidence" rows={3} value={d.evidence} onChange={(v) => set('evidence', v)} />
              <div className="flex flex-col gap-3">
                <Select label="Evidence type" value={d.evidenceType} onChange={(v) => set('evidenceType', v)} options={['Repository document', 'Visual evidence', 'Measurement', 'Owner judgement', 'None yet'] as const} />
                <Text label="Source document or URL" value={d.sourceRef} onChange={(v) => set('sourceRef', v)} mono />
              </div>
              <Area label="Expected visual effect" value={d.expectedVisual} onChange={(v) => set('expectedVisual', v)} />
              <Area label="Expected technical cost" value={d.expectedCost} onChange={(v) => set('expectedCost', v)} />
              <Area label="Compatibility implications" value={d.compatibility} onChange={(v) => set('compatibility', v)} className="md:col-span-2" />
            </div>
          </Section>
          <Section title="Links">
            <div className="grid gap-4 md:grid-cols-2">
              <LinkList kind="reference" label="Linked visual examples" ids={d.referenceIds} onChange={(v) => set('referenceIds', v)} />
              <LinkList kind="issue" label="Implementation issues" ids={d.issueIds} onChange={(v) => set('issueIds', v)} />
              <LinkList kind="sprint" label="Sprints" ids={d.sprintIds} onChange={(v) => set('sprintIds', v)} />
              <LinkList kind="asset" label="Related assets" ids={d.assetIds} onChange={(v) => set('assetIds', v)} />
              <FileList label="Related code files" value={d.relatedFiles} onChange={(v) => set('relatedFiles', v)} />
              <FileList label="Tests required" value={d.tests} onChange={(v) => set('tests', v)} />
            </div>
          </Section>
          <Section title={`Compare versions (${d.versions.length})`}>
            {d.versions.length === 0 ? <p className="text-[13px] text-muted">No saved versions yet. "Save version", Approve, Reject and Restore all save one first.</p> : (
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <label className="text-[12.5px]">Compare current with
                    <select className="input ml-2 inline w-auto" value={cmp ?? ''} onChange={(e) => setCmp(Number(e.target.value))}>
                      {d.versions.map((v, i) => <option key={i} value={i}>{fmtTime(v.at)}: {v.note}</option>)}
                    </select>
                  </label>
                  {cmp != null && <Button small onClick={() => restore(cmp)}>Restore this version</Button>}
                </div>
                {diff.length === 0 ? <p className="text-[13px] text-muted">Identical to the current text.</p> : (
                  <ul className="flex flex-col gap-2">
                    {diff.map((k) => (
                      <li key={k} className="grid gap-2 text-[12.5px] md:grid-cols-[9rem_1fr_1fr]">
                        <span className="font-semibold text-muted">{k}</span>
                        <del className="rounded bg-coral/10 p-1.5 decoration-coral/50">{String(version!.fields[k]) || '∅'}</del>
                        <ins className="rounded bg-moss/10 p-1.5 no-underline">{String(d[k]) || '∅'}</ins>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Section title="Provenance">
            <dl>
              <Kv k="Lineage">
                <select aria-label="Lineage" className="input py-0.5" value={d.lineage} onChange={(e) => set('lineage', e.target.value as DesignDecision['lineage'])}>
                  <option value="inherited">Inherited</option><option value="superseded">Superseded</option><option value="experimental">Experimental</option>
                </select>
              </Kv>
              <Kv k="Supersedes">{d.supersedes ? (ws.decisions[d.supersedes] ? <a className="underline" href={href('rules', d.supersedes)}>{ws.decisions[d.supersedes].code}</a> : d.supersedes) : '—'}</Kv>
              {parent && <Kv k="Experiment of"><a className="underline" href={href('rules', parent.id)}>{parent.code}</a></Kv>}
              {experiments.length > 0 && <Kv k="Experiments">{experiments.map((x) => <a key={x.id} className="mr-2 underline" href={href('rules', x.id)}>{x.code}</a>)}</Kv>}
              <Kv k="Source">{d.sourceRef || '—'}</Kv>
              <Kv k="Created">{fmtTime(d.createdAt)}</Kv>
              <Kv k="Last updated">{fmtTime(d.updatedAt)}</Kv>
              <Kv k="Priority">{d.priority}</Kv>
            </dl>
            <div className="mt-3"><StatusSelect value={d.status} onChange={(v) => set('status', v)} label="Verification status" /></div>
          </Section>
          <Section title="Approval history">
            <ol className="flex flex-col gap-2 text-[12.5px]">
              {[...d.history].reverse().map((h, i) => <li key={i} className="border-l-2 border-line pl-2"><p className="font-medium">{h.action} <span className="font-normal text-muted">by {h.by}</span></p><p className="text-muted">{fmtTime(h.at)}{h.note ? ` · ${h.note}` : ''}</p></li>)}
            </ol>
          </Section>
          <Section title="Linked from"><Backlinks id={d.id} /></Section>
        </div>
      </div>
    </div>
  );
}
