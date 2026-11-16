import { useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, PageHeader, Select, SeverityBadge, StageBadge, StatusBadge, StatusSelect, Tabs, Text, toast } from '../components/ui';
import { Backlinks, FileList, LinkList } from '../components/links';
import { EvidencePicker, Img, ImageDrop, refLabel } from '../components/images';
import { go, href, setQuery, useRoute } from '../lib/router';
import { copyText, download, fmtDate, now, slug, uid } from '../lib/util';
import { issueMd } from '../lib/exporters';
import { SEVERITIES, STAGES, STATUSES, type Issue, type Stage } from '../types';

export default function Issues() {
  const ws = useWs();
  const route = useRoute();
  const view = route.q.get('view') ?? 'board';
  const [q, setQ] = useState('');
  const sev = route.q.get('severity') ?? '';
  const status = route.q.get('status') ?? '';
  const cat = route.q.get('category') ?? '';
  const [sort, setSort] = useState<'priority' | 'severity' | 'updated'>('priority');
  const all = Object.values(ws.issues);
  const cats = [...new Set(all.map((i) => i.category))].sort();
  const sevRank = (s: Issue['severity']) => SEVERITIES.indexOf(s);
  const shown = all
    .filter((i) => (!sev || i.severity === sev) && (!status || i.status === status) && (!cat || i.category === cat) && (!q || (i.code + i.title + i.description).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === 'priority' ? a.priority - b.priority : sort === 'severity' ? sevRank(a.severity) - sevRank(b.severity) || a.priority - b.priority : b.updatedAt.localeCompare(a.updatedAt));
  const sel = route.id ? ws.issues[route.id] : null;

  function create() {
    const id = uid('iss');
    const n = Math.max(0, ...all.map((i) => Number(i.code.match(/\d+/)?.[0] ?? 0))) + 1;
    mutate('new issue', (d) => {
      d.issues[id] = { id, code: 'VIS-' + String(n).padStart(3, '0'), createdAt: now(), updatedAt: now(), status: 'Needs research', source: d.project.owner || 'Owner', rationale: null, tags: [], title: 'New issue', description: '', category: 'Characters', severity: 'Minor', priority: all.length + 1, stage: 'Backlog', reportedBy: d.project.owner || 'Owner', evidence: [], assetIds: [], characterIds: [], sceneId: null, district: null, decisionIds: [], sprintIds: [], comparisonIds: [], rootCause: '', proposedChange: '', steps: '', codePaths: [], acceptance: '', testEvidence: '' };
      logActivity(d, 'Opened an issue', { kind: 'issue', id });
    });
    go('issues', id);
  }

  function moveTo(id: string, stage: Stage, beforeId?: string) {
    mutate('move issue', (d) => {
      const it = d.issues[id]; it.stage = stage; it.updatedAt = now();
      const col = Object.values(d.issues).filter((x) => x.stage === stage && x.id !== id).sort((a, b) => a.priority - b.priority);
      const idx = beforeId ? col.findIndex((x) => x.id === beforeId) : col.length;
      col.splice(idx < 0 ? col.length : idx, 0, it);
      // keep global priority order: renumber this column inside its current priority slots
      const slots = col.map((x) => x.priority).sort((a, b) => a - b);
      col.forEach((x, i) => { x.priority = slots[i] ?? x.priority; });
      if (stage === 'In progress' && it.status === 'Needs research') it.status = 'In progress';
      logActivity(d, `${it.code} → ${stage}`, { kind: 'issue', id });
    });
  }

  return (
    <div>
      <PageHeader eyebrow="Issue Tracker" title="Design and technical problems" lede="Workflow stage and verification status are separate: an issue can be In progress while its cause is still Needs research.">
        <Tabs label="Layout" value={view} onChange={(v) => setQuery('view', v)} tabs={[{ value: 'board', label: 'Board' }, { value: 'list', label: 'List' }]} />
        <Button kind="primary" onClick={create}>+ New issue</Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <input aria-label="Filter issues" className="input w-56" placeholder="Filter by text…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Severity" className="input w-auto" value={sev} onChange={(e) => setQuery('severity', e.target.value || null)}><option value="">All severities</option>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Status" className="input w-auto" value={status} onChange={(e) => setQuery('status', e.target.value || null)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Category" className="input w-auto" value={cat} onChange={(e) => setQuery('category', e.target.value || null)}><option value="">All categories</option>{cats.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Sort" className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="priority">Sort: priority</option><option value="severity">Sort: severity</option><option value="updated">Sort: last updated</option></select>
        <span className="text-[12px] text-muted">{shown.length} of {all.length}</span>
      </div>

      {view === 'board' ? (
        <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-5">
          {STAGES.map((stage) => {
            const col = shown.filter((i) => i.stage === stage);
            return (
              <div key={stage} className="flex min-w-[14rem] flex-col rounded-lg bg-cream/60 p-2 ring-1 ring-line"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData('text/issue'); if (id) moveTo(id, stage); }}>
                <p className="mb-2 flex items-center justify-between px-1 text-[12px] font-semibold"><StageBadge stage={stage} /><span className="text-muted">{col.length}</span></p>
                <ol className="flex flex-1 flex-col gap-1.5">
                  {col.map((i) => (
                    <li key={i.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/issue', i.id)}
                      onDrop={(e) => { e.stopPropagation(); const id = e.dataTransfer.getData('text/issue'); if (id && id !== i.id) moveTo(id, stage, i.id); }}
                      className={`cursor-grab rounded-md border bg-cream p-2 shadow-sm active:cursor-grabbing ${sel?.id === i.id ? 'border-cocoa' : 'border-line'}`}>
                      <a href={href('issues', i.id, Object.fromEntries(route.q))} className="block">
                        <p className="flex items-center justify-between gap-1 font-mono text-[11px] text-muted">{i.code}<SeverityBadge severity={i.severity} /></p>
                        <p className="mt-0.5 text-[13px] font-medium leading-snug">{i.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1"><StatusBadge status={i.status} small />{i.evidence.length > 0 && <span className="text-[11px] text-muted">▣ {i.evidence.length}</span>}</div>
                      </a>
                      <label className="sr-only" htmlFor={'st' + i.id}>Move {i.code}</label>
                      <select id={'st' + i.id} className="mt-1.5 w-full rounded border border-line bg-sand/50 text-[11px]" value={i.stage} onChange={(e) => moveTo(i.id, e.target.value as Stage)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
                    </li>
                  ))}
                  {!col.length && <li className="rounded border border-dashed border-line p-3 text-center text-[11.5px] text-muted">Drop here</li>}
                </ol>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-cream">
          <table className="w-full text-[13px]">
            <thead className="bg-sand text-left text-[11.5px] uppercase tracking-wide text-muted"><tr><th className="p-2">#</th><th className="p-2">Issue</th><th className="p-2">Severity</th><th className="p-2">Stage</th><th className="p-2">Status</th><th className="p-2">Category</th><th className="p-2">Updated</th></tr></thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className="border-t border-line hover:bg-sand/40">
                  <td className="p-2 font-mono text-[11.5px] text-muted">{i.priority}</td>
                  <td className="p-2"><a className="font-medium hover:underline" href={href('issues', i.id, { view: 'list' })}>{i.code} · {i.title}</a></td>
                  <td className="p-2"><SeverityBadge severity={i.severity} /></td>
                  <td className="p-2"><StageBadge stage={i.stage} /></td>
                  <td className="p-2"><StatusBadge status={i.status} small /></td>
                  <td className="p-2">{i.category}</td>
                  <td className="p-2 text-muted">{fmtDate(i.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <Empty title="No issues match these filters" />}
        </div>
      )}

      {sel && <div className="mt-6"><IssueEditor key={sel.id} i={sel} /></div>}
    </div>
  );
}

function IssueEditor({ i }: { i: Issue }) {
  const ws = useWs();
  const [pick, setPick] = useState(false);
  const set = <K extends keyof Issue>(k: K, v: Issue[K]) => mutate(`issue ${i.id} ${String(k)}`, (d) => { (d.issues[i.id] as Issue)[k] = v; d.issues[i.id].updatedAt = now(); });
  async function del() {
    if (!(await confirmAction(`Delete ${i.code}?`, 'The issue is removed and unlinked from decisions, sprints and comparisons. Undo (⌘Z) restores it during this session.', 'Delete'))) return;
    useLab.getState().remove('issue', i.id); go('issues');
  }
  return (
    <section className="rounded-xl border-2 border-cocoa/20 bg-cream">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="font-mono text-[12px] text-muted">{i.code}</span>
        <h2 className="font-display text-[20px]">{i.title}</h2>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button small onClick={() => { mutate('current challenge', (d) => { d.project.currentChallenge = { kind: 'issue', id: i.id }; }); toast('Set as current challenge'); }}>Make current challenge</Button>
          <Button small onClick={async () => { await copyText(issueMd(ws, i, true)); toast('GitHub issue Markdown copied'); }}>Copy as GitHub issue</Button>
          <Button small onClick={() => download(`${i.code}-${slug(i.title)}.md`, issueMd(ws, i))}>Download .md</Button>
          <a href={href('export', null, { issue: i.id })} className="inline-flex h-7 items-center rounded-md border border-line px-2 text-[12px] hover:border-cocoa/50">Generate brief →</a>
          <Button small kind="danger" onClick={del}>Delete</Button>
          <a href={href('issues')} className="inline-flex h-7 items-center px-2 text-[12px] text-muted hover:text-cocoa">Close</a>
        </div>
      </div>
      <div className="grid gap-5 p-4 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-3 md:grid-cols-2">
          <Text label="Title" value={i.title} onChange={(v) => set('title', v)} className="md:col-span-2" />
          <Area label="Description" value={i.description} onChange={(v) => set('description', v)} className="md:col-span-2" />
          <Area label="Root-cause hypothesis" rows={4} value={i.rootCause} onChange={(v) => set('rootCause', v)} />
          <Area label="Proposed change" rows={4} value={i.proposedChange} onChange={(v) => set('proposedChange', v)} />
          <Area label="Implementation steps" rows={4} value={i.steps} onChange={(v) => set('steps', v)} />
          <Area label="Acceptance criteria" rows={4} value={i.acceptance} onChange={(v) => set('acceptance', v)} />
          <Area label="Test evidence" value={i.testEvidence} onChange={(v) => set('testEvidence', v)} hint="Command, result and date. Leave empty until a test actually ran." className="md:col-span-2" />
          <FileList label="Code paths" value={i.codePaths} onChange={(v) => set('codePaths', v)} />
          <div className="flex flex-col gap-3">
            <LinkList kind="decision" label="Related rules" ids={i.decisionIds} onChange={(v) => set('decisionIds', v)} />
            <LinkList kind="sprint" label="Sprints" ids={i.sprintIds} onChange={(v) => set('sprintIds', v)} />
            <LinkList kind="asset" label="Affected assets" ids={i.assetIds} onChange={(v) => set('assetIds', v)} />
            <LinkList kind="character" label="Affected characters" ids={i.characterIds} onChange={(v) => set('characterIds', v)} />
            <LinkList kind="comparison" label="Comparisons" ids={i.comparisonIds} onChange={(v) => set('comparisonIds', v)} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Severity" value={i.severity} options={SEVERITIES} onChange={(v) => set('severity', v)} />
            <Select label="Stage" value={i.stage} options={STAGES} onChange={(v) => set('stage', v)} />
            <Text label="Category" value={i.category} onChange={(v) => set('category', v)} />
            <Text label="Reported by" value={i.reportedBy} onChange={(v) => set('reportedBy', v)} />
            <Select label="Affected scene" value={i.sceneId ?? ''} options={[{ value: '', label: 'None' }, ...Object.values(ws.scenes).map((s) => ({ value: s.id, label: s.name }))]} onChange={(v) => set('sceneId', v || null)} />
            <Select label="District" value={i.district ?? ''} options={[{ value: '', label: 'Any' }, { value: 'riverfront', label: 'River Street' }, { value: 'market', label: 'City Market' }, { value: 'squares', label: 'Squares' }, { value: 'forsyth', label: 'Forsyth Park' }]} onChange={(v) => set('district', v || null)} />
          </div>
          <StatusSelect value={i.status} onChange={(v) => set('status', v)} label="Verification status" />
          <div>
            <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Screenshot evidence ({i.evidence.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {i.evidence.map((r, n) => (
                <figure key={n} className="relative overflow-hidden rounded border border-line">
                  <Img refx={r} alt={refLabel(r)} className="h-24 w-full bg-sand" />
                  <figcaption className="truncate px-1 text-[10.5px] text-muted" title={refLabel(r)}>{refLabel(r)}</figcaption>
                  <button aria-label="Remove evidence" className="absolute right-1 top-1 rounded bg-cream/90 px-1 text-[12px]" onClick={() => set('evidence', i.evidence.filter((_, x) => x !== n))}>×</button>
                </figure>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <ImageDrop compact multiple onAdd={(refs) => set('evidence', [...i.evidence, ...refs])} label="Add screenshots" />
              <Button small onClick={() => setPick(true)}>Add from repo evidence</Button>
            </div>
            <EvidencePicker open={pick} onClose={() => setPick(false)} onPick={(r) => set('evidence', [...i.evidence, r])} />
          </div>
          <div><p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Linked from</p><Backlinks id={i.id} /></div>
          <p className="text-[11.5px] text-muted">Source: {i.source ?? 'unknown'} · created {fmtDate(i.createdAt)} · updated {fmtDate(i.updatedAt)}</p>
        </div>
      </div>
    </section>
  );
}
