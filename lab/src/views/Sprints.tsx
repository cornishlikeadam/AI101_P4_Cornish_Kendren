import { useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, Modal, PageHeader, Section, Select, StageBadge, StatusBadge, StatusSelect, Text, toast } from '../components/ui';
import { EntityLink, FileList, LinkList } from '../components/links';
import { ImageSlot } from '../components/images';
import { go, href, useRoute } from '../lib/router';
import { now, uid } from '../lib/util';
import { sprintGates } from '../lib/readiness';
import { STAGES, type Sprint } from '../types';

const TEMPLATES = [
  'Sprint 02: Character pose variation', 'Sprint 03: Outfit and expression system', 'Sprint 04: SCAD Poetter Hall illustration',
  'Sprint 05: Forsyth Park environmental detail', 'Sprint 06: Crowd density and staging', 'Sprint 07: Hidden-object placement',
  'Sprint 08: Scene rendering performance', 'Sprint 09: Final composition and visual polish',
];

export default function Sprints() {
  const ws = useWs();
  const route = useRoute();
  const [tpl, setTpl] = useState(false);
  const list = Object.values(ws.sprints).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const sel = route.id ? ws.sprints[route.id] : list[0];

  function create(title: string) {
    const id = uid('spr');
    const m = title.match(/^(Sprint \d+):\s*(.*)$/);
    const n = list.length + 1;
    mutate('new sprint', (d) => {
      d.sprints[id] = { id, code: m?.[1] ?? 'Sprint ' + String(n).padStart(2, '0'), title: m?.[2] ?? title, createdAt: now(), updatedAt: now(), status: 'Tentative', source: d.project.owner || 'Owner', rationale: null, tags: [], stage: 'Backlog', problem: '', baseline: '', baselineImage: null, target: '', referenceIds: [], decisionIds: [], assetIds: [], characterIds: [], issueIds: [], files: [], plan: '', workItems: [], testing: '', acceptance: [], comparisonIds: [], reviewIds: [], finalDecision: '', nextDependency: '', ownerAccepted: null };
      logActivity(d, 'Created ' + (m?.[1] ?? 'a sprint'), { kind: 'sprint', id });
    });
    setTpl(false); go('sprints', id);
  }

  return (
    <div>
      <PageHeader eyebrow="Build Sprints" title="One bounded change at a time" lede="Each sprint fixes one aspect of the game and proves it with evidence. A text note never satisfies a gate.">
        <Button onClick={() => setTpl(true)}>+ From template</Button>
        <Button kind="primary" onClick={() => create('New sprint')}>+ Blank sprint</Button>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <ol className="flex flex-col gap-1.5">
          {list.map((s) => {
            const g = sprintGates(ws, s); const ok = g.filter((x) => x.ok).length;
            return (
              <li key={s.id}><a href={href('sprints', s.id)} className={`block rounded-lg border bg-cream p-2.5 ${sel?.id === s.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}>
                <p className="flex items-center justify-between font-mono text-[11px] text-muted">{s.code}<StageBadge stage={s.stage} /></p>
                <p className="text-[13.5px] font-medium leading-snug">{s.title}</p>
                <div className="mt-1.5 flex items-center gap-1" aria-label={`${ok} of ${g.length} gates met`}>
                  {g.map((x, i) => <span key={i} title={x.label} className={`h-1.5 flex-1 rounded-full ${x.ok ? 'bg-moss' : 'bg-line'}`} />)}
                  <span className="ml-1 text-[11px] tabular-nums text-muted">{ok}/{g.length}</span>
                </div>
              </a></li>
            );
          })}
        </ol>
        {sel ? <SprintEditor key={sel.id} s={sel} /> : <Empty title="No sprints yet" />}
      </div>
      <Modal open={tpl} onClose={() => setTpl(false)} title="Start a sprint from the brief's examples">
        <ul className="flex flex-col gap-1">{TEMPLATES.map((t) => <li key={t}><button className="w-full rounded px-2 py-1.5 text-left text-[13.5px] hover:bg-sand" onClick={() => create(t)}>{t}</button></li>)}</ul>
      </Modal>
    </div>
  );
}

function SprintEditor({ s }: { s: Sprint }) {
  const ws = useWs();
  const gates = sprintGates(ws, s);
  const [item, setItem] = useState('');
  const [crit, setCrit] = useState('');
  const set = <K extends keyof Sprint>(k: K, v: Sprint[K]) => mutate(`sprint ${s.id} ${String(k)}`, (d) => { (d.sprints[s.id] as Sprint)[k] = v; d.sprints[s.id].updatedAt = now(); });
  const allMet = gates.slice(0, 5).every((g) => g.ok);

  async function accept() {
    if (!allMet && !(await confirmAction('Gates not met', `${gates.slice(0, 5).filter((g) => !g.ok).length} evidence gate(s) are still open. Accepting now records an acceptance without evidence. Continue?`, 'Accept anyway'))) return;
    mutate('accept sprint', (d) => { const x = d.sprints[s.id]; x.ownerAccepted = { at: now(), by: d.project.owner || 'Owner' }; x.stage = 'Completed'; x.status = allMet ? 'Completed' : 'Tentative'; logActivity(d, `${s.code} accepted by the owner`, { kind: 'sprint', id: s.id }); });
  }
  async function del() {
    if (!(await confirmAction(`Delete ${s.code}?`, 'Removes the sprint and unlinks it everywhere.', 'Delete'))) return;
    useLab.getState().remove('sprint', s.id); go('sprints');
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-cream p-3">
        <span className="font-mono text-[12px] text-muted">{s.code}</span>
        <StatusBadge status={s.status} />
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button small onClick={() => { mutate('current challenge', (d) => { d.project.currentChallenge = { kind: 'sprint', id: s.id }; }); toast('Set as current challenge'); }}>Make current challenge</Button>
          <a href={href('export', null, { sprint: s.id })} className="inline-flex h-7 items-center rounded-md border border-line px-2 text-[12px] hover:border-cocoa/50">Generate brief →</a>
          {s.ownerAccepted ? <Button small onClick={() => set('ownerAccepted', null)}>Withdraw acceptance</Button> : <Button small kind="primary" onClick={accept}>Owner accepts</Button>}
          <Button small kind="danger" onClick={del}>Delete</Button>
        </div>
      </div>

      <Section title="Acceptance gate" actions={<span className="text-[12px] text-muted">computed from linked evidence</span>}>
        <ol className="grid gap-2 md:grid-cols-2">
          {gates.map((g, i) => (
            <li key={g.label} className={`rounded-md border p-2.5 text-[13px] ${g.ok ? 'border-moss/50 bg-moss/5' : 'border-line'}`}>
              <p className="font-medium"><span aria-hidden className={`mr-1.5 font-mono ${g.ok ? 'text-moss' : 'text-muted'}`}>{g.ok ? '✓' : i + 1}</span>{g.label}<span className="sr-only">{g.ok ? ': met' : ': not met'}</span></p>
              <p className="text-[12px] text-muted">{g.detail}</p>
              {g.link && <div className="mt-1"><EntityLink kind={g.link.kind} id={g.link.id} /></div>}
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Definition">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[7rem_1fr] gap-2"><Text label="Code" value={s.code} onChange={(v) => set('code', v)} /><Text label="Title" value={s.title} onChange={(v) => set('title', v)} /></div>
            <div className="grid grid-cols-2 gap-2"><Select label="Workflow stage" value={s.stage} options={STAGES} onChange={(v) => set('stage', v)} /><StatusSelect value={s.status} onChange={(v) => set('status', v)} /></div>
            <Area label="Problem statement" value={s.problem} onChange={(v) => set('problem', v)} />
            <Area label="Baseline state" value={s.baseline} onChange={(v) => set('baseline', v)} />
            <ImageSlot label="Baseline image" value={s.baselineImage} onChange={(r) => set('baselineImage', r)} />
            <Area label="Target visual outcome" value={s.target} onChange={(v) => set('target', v)} />
          </div>
        </Section>
        <Section title="Plan and tests">
          <div className="flex flex-col gap-3">
            <Area label="Implementation plan" rows={6} value={s.plan} onChange={(v) => set('plan', v)} />
            <div>
              <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Work items</p>
              <ul className="flex flex-col gap-1">
                {s.workItems.map((w) => (
                  <li key={w.id} className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" aria-label={w.text} className="accent-[#C86D51]" checked={w.done} onChange={() => set('workItems', s.workItems.map((x) => x.id === w.id ? { ...x, done: !x.done } : x))} />
                    <span className={w.done ? 'text-muted line-through' : ''}>{w.text}</span>
                    <button aria-label="Remove work item" className="ml-auto text-muted hover:text-coral" onClick={() => set('workItems', s.workItems.filter((x) => x.id !== w.id))}>×</button>
                  </li>
                ))}
              </ul>
              <form className="mt-1.5 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (item.trim()) { set('workItems', [...s.workItems, { id: uid('w'), text: item.trim(), done: false }]); setItem(''); } }}>
                <input className="input" aria-label="New work item" placeholder="Add a work item" value={item} onChange={(e) => setItem(e.target.value)} /><Button small type="submit">Add</Button>
              </form>
              <p className="mt-1 text-[11.5px] text-muted">Work items track effort. They do not count toward the gate.</p>
            </div>
            <Area label="Testing procedure" value={s.testing} onChange={(v) => set('testing', v)} />
            <div>
              <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Acceptance criteria</p>
              <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13px]">
                {s.acceptance.map((a, n) => <li key={n}><span className="flex items-start gap-2"><span className="flex-1">{a}</span><button aria-label="Remove criterion" className="text-muted hover:text-coral" onClick={() => set('acceptance', s.acceptance.filter((_, x) => x !== n))}>×</button></span></li>)}
              </ol>
              <form className="mt-1.5 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (crit.trim()) { set('acceptance', [...s.acceptance, crit.trim()]); setCrit(''); } }}>
                <input className="input" aria-label="New acceptance criterion" placeholder="Observable completion condition" value={crit} onChange={(e) => setCrit(e.target.value)} /><Button small type="submit">Add</Button>
              </form>
            </div>
          </div>
        </Section>
        <Section title="Links">
          <div className="flex flex-col gap-3">
            <LinkList kind="issue" label="Issues" ids={s.issueIds} onChange={(v) => set('issueIds', v)} />
            <LinkList kind="decision" label="Related ADRs" ids={s.decisionIds} onChange={(v) => set('decisionIds', v)} />
            <LinkList kind="character" label="Characters being changed" ids={s.characterIds} onChange={(v) => set('characterIds', v)} />
            <LinkList kind="asset" label="Assets being changed" ids={s.assetIds} onChange={(v) => set('assetIds', v)} />
            <LinkList kind="reference" label="Relevant references" ids={s.referenceIds} onChange={(v) => set('referenceIds', v)} />
            <LinkList kind="comparison" label="Before-and-after evidence" ids={s.comparisonIds} onChange={(v) => set('comparisonIds', v)} />
            <LinkList kind="review" label="Quality reviews" ids={s.reviewIds} onChange={(v) => set('reviewIds', v)} />
          </div>
        </Section>
        <Section title="Outcome">
          <div className="flex flex-col gap-3">
            <FileList label="Files potentially affected" value={s.files} onChange={(v) => set('files', v)} />
            <Area label="Final decision" value={s.finalDecision} onChange={(v) => set('finalDecision', v)} />
            <Text label="Next dependency" value={s.nextDependency} onChange={(v) => set('nextDependency', v)} />
            {s.ownerAccepted && <p className="rounded bg-moss/10 p-2 text-[13px]">Accepted by {s.ownerAccepted.by} on {s.ownerAccepted.at.slice(0, 10)}.</p>}
          </div>
        </Section>
      </div>
    </div>
  );
}
