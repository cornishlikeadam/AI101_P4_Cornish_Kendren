import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Button, confirmAction, PageHeader, Section, Select, Tabs, toast } from '../components/ui';
import { EntityLink } from '../components/links';
import { allBlobs, clearAll, deleteMilestone, listMilestones, putBlob, putMilestone, requestPersistence } from '../lib/db';
import { buildBrief, briefGithub, briefJson, briefMarkdown, builderPrompt } from '../lib/brief';
import { artDirectionMd, assetManifest, characterSystemMd, nextAdrNumber, pipelineAdr, sceneCompositionMd, visualQaMd } from '../lib/exporters';
import { renderMarkdown } from '../lib/markdown';
import { setQuery, useRoute } from '../lib/router';
import { copyText, download, fmtTime, now, slug, uid } from '../lib/util';
import { initialWorkspace } from '../seed/seed';
import { snapshot } from '../seed/snapshot';
import type { BriefSelection, Milestone, Workspace } from '../types';

export const useMilestones = create<{ list: Milestone[]; load(): Promise<void> }>((set) => ({
  list: [],
  async load() { try { set({ list: (await listMilestones()).sort((a, b) => b.at.localeCompare(a.at)) }); } catch { set({ list: [] }); } },
}));

export default function Export() {
  const route = useRoute();
  const tab = route.q.get('tab') ?? 'brief';
  return (
    <div>
      <PageHeader eyebrow="Export Center" title="Hand off the next build" lede="Briefs and documents are generated from linked records and the repository snapshot. Unapproved decisions stay labelled as proposals in everything exported.">
        <Tabs label="Export" value={tab} onChange={(t) => setQuery('tab', t)} tabs={[{ value: 'brief', label: 'Implementation brief' }, { value: 'docs', label: 'Documents' }, { value: 'milestones', label: 'Milestones' }, { value: 'backup', label: 'Workspace backup' }]} />
      </PageHeader>
      {tab === 'brief' && <BriefTab />}
      {tab === 'docs' && <DocsTab />}
      {tab === 'milestones' && <Milestones />}
      {tab === 'backup' && <Backup />}
    </div>
  );
}

function BriefTab() {
  const ws = useWs();
  const route = useRoute();
  const ms = useMilestones();
  useEffect(() => { ms.load(); }, []); // eslint-disable-line
  const highest = Object.values(ws.issues).filter((i) => i.stage === 'Selected' || i.stage === 'In progress').sort((a, b) => a.priority - b.priority)[0] ?? Object.values(ws.issues).filter((i) => i.stage !== 'Completed').sort((a, b) => a.priority - b.priority)[0];
  const [sel, setSel] = useState<BriefSelection>(() => ({
    issueId: route.q.get('issue') ?? null, sprintId: route.q.get('sprint') ?? (route.q.get('issue') ? null : ws.project.currentChallenge?.kind === 'sprint' ? ws.project.currentChallenge.id : null),
    sceneId: route.q.get('scene') ?? null, characterId: route.q.get('character') ?? null, decisionId: route.q.get('decision') ?? null, milestoneId: null,
  }));
  const [fmt, setFmt] = useState<'md' | 'github' | 'prompt' | 'json'>('md');
  const brief = useMemo(() => buildBrief(ws, sel, ms.list), [ws, sel, ms.list]);
  const out = fmt === 'md' ? briefMarkdown(brief) : fmt === 'github' ? briefGithub(brief) : fmt === 'prompt' ? builderPrompt(brief) : briefJson(brief);
  const issue = sel.issueId ? ws.issues[sel.issueId] : null;
  const deps = issue ? [...issue.decisionIds.map((id) => ({ kind: 'decision' as const, id })), ...issue.sprintIds.map((id) => ({ kind: 'sprint' as const, id })), ...issue.assetIds.map((id) => ({ kind: 'asset' as const, id })), ...issue.comparisonIds.map((id) => ({ kind: 'comparison' as const, id }))] : [];
  const pick = (k: keyof BriefSelection) => (v: string) => setSel({ ...sel, [k]: v || null });
  function save() {
    const id = uid('brf');
    mutate('save brief', (d) => { d.briefs[id] = { id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Export Center', rationale: null, tags: [], title: brief.title, selection: sel, markdown: briefMarkdown(brief) }; logActivity(d, `Generated brief "${brief.title}"`, { kind: 'brief', id }); });
    toast('Brief saved to the workspace');
  }
  function printPdf() {
    const w = window.open('', '_blank');
    if (!w) { toast('Pop-up blocked: allow pop-ups to print'); return; }
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${brief.title}</title><style>body{font:14px/1.55 Georgia,serif;max-width:46rem;margin:2rem auto;color:#3E2723}h1,h2{font-family:Georgia,serif}code{font:12px ui-monospace,monospace;background:#F6EFE6;padding:0 3px}pre{background:#F6EFE6;padding:8px}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:3px 6px}</style>${renderMarkdown(briefMarkdown(brief))}`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  }
  const opt = <T extends { id: string }>(recs: T[], label: (r: T) => string) => [{ value: '', label: 'None' }, ...recs.map((r) => ({ value: r.id, label: label(r) }))];
  return (
    <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
      <div className="flex flex-col gap-4">
        <Section title="Select">
          <div className="flex flex-col gap-2.5">
            {highest && <Button small onClick={() => setSel({ ...sel, issueId: highest.id, sprintId: highest.sprintIds[0] ?? sel.sprintId })}>Use the highest-priority ready issue ({highest.code})</Button>}
            <Select label="Challenge (issue)" value={sel.issueId ?? ''} options={opt(Object.values(ws.issues).sort((a, b) => a.priority - b.priority), (r) => `${r.code} ${r.title}`)} onChange={pick('issueId')} />
            <Select label="Sprint" value={sel.sprintId ?? ''} options={opt(Object.values(ws.sprints), (r) => `${r.code} ${r.title}`)} onChange={pick('sprintId')} />
            <Select label="Scene" value={sel.sceneId ?? ''} options={opt(Object.values(ws.scenes), (r) => r.name)} onChange={pick('sceneId')} />
            <Select label="Asset family" value={sel.characterId ?? ''} options={opt(Object.values(ws.characters), (r) => r.name)} onChange={pick('characterId')} />
            <Select label="Design decision" value={sel.decisionId ?? ''} options={opt(Object.values(ws.decisions).sort((a, b) => a.priority - b.priority), (r) => `${r.code} ${r.title} (${r.workflow})`)} onChange={pick('decisionId')} />
            <Select label="Implementation milestone" value={sel.milestoneId ?? ''} options={opt(ms.list, (r) => `${r.name} (${r.at.slice(0, 10)})`)} onChange={pick('milestoneId')} />
          </div>
        </Section>
        {issue && (
          <Section title="Dependencies of the selected issue">
            {deps.length ? <ul className="flex flex-col gap-1">{deps.map((d) => <li key={d.id}><EntityLink kind={d.kind} id={d.id} showStatus /></li>)}</ul> : <p className="text-[13px] text-muted">None linked.</p>}
          </Section>
        )}
        <Section title="Decisions in this brief">
          {brief.decisions.length ? <ul className="flex flex-col gap-1.5 text-[12.5px]">{brief.decisions.map((d) => <li key={d.code}><b>{d.code}</b> {d.title}<br /><span className={d.state.startsWith('APPROVED') ? 'text-moss' : 'text-terracotta'}>{d.state}</span></li>)}</ul> : <p className="text-[13px] text-muted">No decision linked: the brief will say so.</p>}
        </Section>
        <Section title={`Saved briefs (${Object.keys(ws.briefs).length})`}>
          <ul className="flex flex-col gap-1 text-[12.5px]">{Object.values(ws.briefs).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((b) => <li key={b.id} className="flex items-center justify-between gap-2"><span className="truncate">{b.title}</span><span className="flex gap-1"><button className="underline" onClick={() => download(`${slug(b.title)}.md`, b.markdown)}>.md</button><span className="text-muted">{fmtTime(b.createdAt)}</span></span></li>)}</ul>
        </Section>
      </div>
      <Section title={brief.title} actions={<>
        <Tabs label="Format" value={fmt} onChange={(v) => setFmt(v as typeof fmt)} tabs={[{ value: 'md', label: 'Markdown' }, { value: 'github', label: 'GitHub issue' }, { value: 'prompt', label: 'Builder prompt' }, { value: 'json', label: 'JSON' }]} />
      </>}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button kind="primary" small onClick={save}>Generate implementation brief</Button>
          <Button small onClick={async () => { await copyText(out); toast('Copied'); }}>Copy</Button>
          <Button small onClick={() => download(`${slug(brief.title)}${fmt === 'json' ? '.json' : fmt === 'prompt' ? '-prompt.md' : '.md'}`, out, fmt === 'json' ? 'application/json' : 'text/markdown')}>Download</Button>
          <Button small onClick={printPdf}>PDF (print)</Button>
        </div>
        {fmt === 'md' ? <div className="prose-doc max-h-[70vh] overflow-y-auto rounded-md border border-line bg-white/60 p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(out) }} /> : <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-white/60 p-4 font-mono text-[12px]">{out}</pre>}
      </Section>
    </div>
  );
}

function DocsTab() {
  const ws = useWs();
  const n = String(nextAdrNumber(ws)).padStart(3, '0');
  const latest = Object.values(ws.briefs).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const docs: { name: string; note: string; make(): string; type?: string }[] = [
    { name: 'ART-DIRECTION.md', note: 'Current and proposed direction, decisions with approval state, references with rights.', make: () => artDirectionMd(ws) },
    { name: 'CHARACTER-SYSTEM.md', note: 'Every character family, parameters, candidates and review verdicts.', make: () => characterSystemMd(ws) },
    { name: 'SCENE-COMPOSITION.md', note: 'Scenes, iterations with metrics, preferred compositions, landmarks.', make: () => sceneCompositionMd(ws) },
    { name: 'ASSET-MANIFEST.json', note: 'Every asset record with stage, licence and provenance.', make: () => assetManifest(ws), type: 'application/json' },
    { name: 'VISUAL-QA.md', note: 'Recorded reviews, comparisons and lab measurements only.', make: () => visualQaMd(ws) },
    { name: 'IMPLEMENTATION-BRIEF.md', note: latest ? `Latest saved brief: "${latest.title}".` : 'No brief saved yet: generate one in the first tab.', make: () => latest?.markdown ?? '# IMPLEMENTATION-BRIEF\n\n_No brief has been generated in the lab yet._\n' },
    { name: `ADR-${n}-illustrated-scene-pipeline.md`, note: `The brief names this ADR-002, but ADR-002 already exists in the repo, so the next free number is ${n}. It builds on ADR-002 and leaves ADR-001 and ADR-002 unedited.`, make: () => pipelineAdr(ws) },
  ];
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {docs.map((d) => (
        <Section key={d.name} title={<span className="font-mono text-[15px]">{d.name}</span>} actions={<><Button small onClick={() => setOpen(open === d.name ? null : d.name)}>{open === d.name ? 'Hide' : 'Preview'}</Button><Button small kind="primary" onClick={() => download(d.name, d.make(), d.type ?? 'text/markdown')}>Download</Button></>}>
          <p className="text-[13px] text-muted">{d.note}</p>
          {open === d.name && (d.type ? <pre className="mt-3 max-h-80 overflow-auto rounded bg-sand p-3 font-mono text-[11.5px]">{d.make()}</pre> : <div className="prose-doc mt-3 max-h-80 overflow-y-auto rounded bg-white/60 p-3" dangerouslySetInnerHTML={{ __html: renderMarkdown(d.make()) }} />)}
        </Section>
      ))}
      <p className="text-[12px] text-muted md:col-span-2">These are downloads. The lab never writes into the repository. Commit them yourself after review.</p>
    </div>
  );
}

function Milestones() {
  const ws = useWs();
  const ms = useMilestones();
  const [name, setName] = useState('');
  useEffect(() => { ms.load(); }, []); // eslint-disable-line
  async function save() {
    const m: Milestone = { id: uid('ms'), name: name.trim() || `Milestone ${fmtTime(now())}`, at: now(), note: `Repo ${snapshot.git?.head ?? '?'}`, data: JSON.parse(JSON.stringify(ws)) };
    await putMilestone(m); setName(''); await ms.load();
    mutate('milestone', (d) => logActivity(d, `Saved milestone "${m.name}"`));
    toast('Milestone saved');
  }
  async function restore(m: Milestone) {
    if (!(await confirmAction(`Restore "${m.name}"?`, 'The whole workspace is replaced with this snapshot. The current state stays in undo history for this session; save a milestone first if you want to keep it.', 'Restore'))) return;
    useLab.getState().replace(m.data, 'restore milestone');
    toast('Workspace restored');
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <Section title="Save a project iteration">
        <p className="mb-2 text-[12.5px] text-muted">A milestone freezes the whole workspace (records, not image files) so Demo Theater can present it and briefs can reference it.</p>
        <div className="flex gap-1.5"><input aria-label="Milestone name" className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><Button kind="primary" onClick={save}>Save</Button></div>
      </Section>
      <Section title={`Milestones (${ms.list.length})`}>
        {ms.list.length ? (
          <ul className="flex flex-col gap-2">
            {ms.list.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-md border border-line p-2.5 text-[13px]">
                <span className="flex-1"><b>{m.name}</b> <span className="text-muted">{fmtTime(m.at)} · {m.note} · {Object.keys(m.data.decisions).length} decisions, {Object.keys(m.data.issues).length} issues</span></span>
                <a className="text-[12px] underline" href={`#/demo?milestone=${m.id}`}>Present</a>
                <Button small onClick={() => restore(m)}>Restore</Button>
                <Button small onClick={() => download(`milestone-${slug(m.name)}.json`, JSON.stringify(m, null, 2), 'application/json')}>Export</Button>
                <Button small kind="danger" onClick={async () => { if (await confirmAction('Delete milestone?', m.name, 'Delete')) { await deleteMilestone(m.id); ms.load(); } }}>Delete</Button>
              </li>
            ))}
          </ul>
        ) : <p className="text-[13px] text-muted">None yet.</p>}
      </Section>
    </div>
  );
}

function Backup() {
  const ws = useWs();
  const [withImages, setWithImages] = useState(true);
  const [persist, setPersist] = useState<string>('');
  async function exportAll() {
    const blobs = withImages ? await Promise.all((await allBlobs()).map(async (b) => ({ id: b.id, name: b.name, type: b.type, at: b.at, dataUrl: await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(b.blob); }) }))) : [];
    download(`waldos-savannah-lab-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ kind: 'waldos-savannah-lab-backup', version: 1, exportedAt: now(), repoHead: snapshot.git?.head ?? null, workspace: ws, blobs }, null, 1), 'application/json');
  }
  async function importFile(f: File) {
    let j: { kind?: string; workspace?: Workspace; blobs?: { id: string; name: string; type: string; at: string; dataUrl: string }[] };
    try { j = JSON.parse(await f.text()); } catch { toast('Not a JSON file'); return; }
    if (j.kind !== 'waldos-savannah-lab-backup' || !j.workspace?.decisions) { toast('This is not a Build Lab backup'); return; }
    if (!(await confirmAction('Replace the workspace?', `Imports ${Object.keys(j.workspace.decisions).length} decisions, ${Object.keys(j.workspace.issues).length} issues and ${j.blobs?.length ?? 0} image(s). The current workspace is replaced (undo is available during this session).`, 'Import'))) return;
    for (const b of j.blobs ?? []) { const blob = await (await fetch(b.dataUrl)).blob(); await putBlob({ id: b.id, name: b.name, type: b.type, size: blob.size, at: b.at, blob }); }
    useLab.getState().replace({ ...j.workspace, checks: j.workspace.checks ?? {} }, 'import backup');
    toast('Workspace imported');
  }
  async function reset() {
    if (!(await confirmAction('Reset the whole lab?', 'Deletes every record, uploaded image and milestone in this browser and starts again from the repository snapshot. This cannot be undone. Export a backup first.', 'Delete everything'))) return;
    await clearAll();
    useLab.getState().replace(initialWorkspace(snapshot), 'reset');
    toast('Workspace reset');
  }
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Section title="Export">
        <label className="mb-3 flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-[#C86D51]" checked={withImages} onChange={(e) => setWithImages(e.target.checked)} />Include uploaded images</label>
        <Button kind="primary" onClick={exportAll}>Download backup (.json)</Button>
        <p className="mt-2 text-[12px] text-muted">Everything lives in this browser's IndexedDB. A backup moves it to another machine or browser.</p>
      </Section>
      <Section title="Import">
        <input type="file" accept="application/json,.json" aria-label="Import backup" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} className="text-[13px]" />
      </Section>
      <Section title="Storage">
        <Button onClick={async () => { const r = await requestPersistence(); setPersist(r === null ? 'This browser does not support persistent storage requests.' : r ? 'The browser agreed not to evict lab data.' : 'The browser declined; data may be evicted under storage pressure.'); }}>Ask the browser to keep lab data</Button>
        {persist && <p className="mt-2 text-[12.5px]">{persist}</p>}
        <div className="mt-4 border-t border-line pt-3"><Button kind="danger" onClick={reset}>Reset workspace…</Button></div>
        <p className="mt-3 text-[12px] text-muted">Workspace format version {ws.version} · {Object.keys(ws.assets).length} asset records · {ws.activity.length} activity entries.</p>
      </Section>
    </div>
  );
}
