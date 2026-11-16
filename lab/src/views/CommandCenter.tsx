import { useState } from 'react';
import { mutate, useWs } from '../store/store';
import { Area, Button, Modal, PageHeader, Section, SeverityBadge, StageBadge, StatusBadge, Text, Unknown } from '../components/ui';
import { Img, ImageSlot } from '../components/images';
import { EntityLink } from '../components/links';
import { nextActions, sprintGates } from '../lib/readiness';
import { href, useRoute } from '../lib/router';
import { fmtTime } from '../lib/util';
import { SEVERITIES } from '../types';
import { snapshot } from '../seed/snapshot';

export default function CommandCenter() {
  const ws = useWs();
  const route = useRoute();
  const [edit, setEdit] = useState(route.q.get('edit') === 'project');
  const p = ws.project;
  const ch = p.currentChallenge;
  const sprint = ch?.kind === 'sprint' ? ws.sprints[ch.id] : null;
  const issue = ch?.kind === 'issue' ? ws.issues[ch.id] : null;
  const gates = sprint ? sprintGates(ws, sprint) : [];
  const openIssues = Object.values(ws.issues).filter((i) => i.stage !== 'Completed');
  const awaiting = Object.values(ws.decisions).filter((d) => d.workflow === 'Proposed' || d.workflow === 'Experiment').sort((a, b) => a.priority - b.priority);
  const redesign = Object.values(ws.assets).filter((a) => a.stage === 'Redesign' || a.stage === 'Discard' || a.stage === 'Placeholder');
  const research = [
    ...Object.values(ws.decisions).filter((d) => d.status === 'Needs research'),
    ...Object.values(ws.landmarks).filter((l) => l.status === 'Needs research'),
    ...Object.values(ws.issues).filter((i) => i.status === 'Needs research'),
  ];
  const actions = nextActions(ws).slice(0, 3);
  const approvedCands = Object.values(ws.characters).flatMap((c) => c.candidates.filter((x) => x.approval === 'Approved').map((x) => ({ c, x })));
  const latest = p.latestApprovedImage ?? approvedCands.sort((a, b) => (b.x.approvedAt ?? '').localeCompare(a.x.approvedAt ?? ''))[0]?.x.image ?? null;
  const failingFacts = (snapshot.facts ?? []).filter((f) => !f.ok);

  const readiness = (() => {
    if (!sprint) return { label: 'No current sprint', detail: 'Pick a challenge to work on.' };
    const ok = gates.filter((g) => g.ok).length;
    if (ok === gates.length) return { label: 'Ready to implement', detail: 'All six evidence gates are met and the owner accepted.' };
    return { label: `${ok} of ${gates.length} evidence gates met`, detail: 'Gates count only linked evidence: uploads, captures, comparisons, passing reviews and owner acceptance.' };
  })();

  return (
    <div>
      <PageHeader eyebrow="Command Center" title={p.title + ': redesign status'} lede={<>Where the redesign stands, grounded in evidence. The repository is read at <span className="font-mono">{snapshot.git?.head ?? 'unknown'}</span>; nothing here edits the game.</>}>
        <Button onClick={() => setEdit(true)}>Edit direction</Button>
        {sprint && <a href={href('sprints', sprint.id)} className="inline-flex h-9 items-center rounded-md bg-coral px-4 text-[13px] font-semibold text-white hover:brightness-95">Continue current challenge →</a>}
        {issue && <a href={href('issues', issue.id)} className="inline-flex h-9 items-center rounded-md bg-coral px-4 text-[13px] font-semibold text-white hover:brightness-95">Continue current challenge →</a>}
      </PageHeader>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-lg border border-line bg-cream">
            <div className="grid md:grid-cols-3">
              <Frame title="Baseline" refx={p.baselineImage} empty="No baseline image yet. Edit direction to attach a real capture." />
              <div className="border-line p-4 md:border-x">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Proposed direction</p>
                <p className="mt-2 text-[13.5px] leading-relaxed">{p.proposedDirection}</p>
              </div>
              <Frame title="Latest approved iteration" refx={latest} empty="Nothing approved yet. Approval happens on a candidate or a sprint, with evidence." />
            </div>
            <div className="border-t border-line bg-sand/50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Current art direction</p>
              <p className="mt-1 font-display text-[16px] leading-snug">{p.artDirection}</p>
            </div>
          </section>

          <Section title="Current challenge" actions={sprint && <StageBadge stage={sprint.stage} />}>
            {sprint ? (
              <div>
                <p className="font-display text-[19px] leading-snug">{sprint.code}: {sprint.title}</p>
                <p className="mt-1 text-[13px] text-muted">{sprint.problem}</p>
                <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {gates.map((g, i) => (
                    <li key={g.label} className={`flex items-start gap-2 rounded border px-2.5 py-1.5 text-[12.5px] ${g.ok ? 'border-moss/40 bg-moss/5' : 'border-line'}`}>
                      <span aria-hidden className={`mt-px font-mono ${g.ok ? 'text-moss' : 'text-muted'}`}>{g.ok ? '✓' : String(i + 1)}</span>
                      <span><span className="font-medium">{g.label}</span><span className="sr-only">{g.ok ? ' (met)' : ' (not met)'}</span><span className="block text-muted">{g.detail}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : issue ? <EntityLink kind="issue" id={issue.id} showStatus /> : <p className="text-[13px] text-muted">No current challenge. Pick one in Build Sprints or the Issue Tracker.</p>}
          </Section>

          <Section title="Next three recommended actions">
            <ol className="flex flex-col gap-2">
              {actions.map((a, i) => (
                <li key={a.text}><a href={a.to} className="flex gap-3 rounded-md border border-line p-3 hover:border-cocoa/50">
                  <span className="font-display text-[22px] leading-none text-terracotta">{i + 1}</span>
                  <span><span className="block text-[14px] font-medium">{a.text}</span><span className="text-[12.5px] text-muted">{a.why}</span></span>
                </a></li>
              ))}
              {!actions.length && <li className="text-[13px] text-muted">No outstanding actions detected.</li>}
            </ol>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Implementation readiness">
            <p className="font-display text-[20px]">{readiness.label}</p>
            <p className="text-[12.5px] text-muted">{readiness.detail}</p>
            {failingFacts.length > 0 && <p className="mt-2 rounded bg-coral/10 px-2 py-1 text-[12.5px]">{failingFacts.length} repository check(s) failing. See Project Audit.</p>}
          </Section>
          <Section title={`Open issues by severity (${openIssues.length})`} actions={<a className="text-[12px] underline" href={href('issues')}>Tracker</a>}>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITIES.map((s) => {
                const n = openIssues.filter((i) => i.severity === s).length;
                return <a key={s} href={href('issues', null, { severity: s })} className="rounded-md border border-line p-2 text-center hover:border-cocoa/50"><p className="font-display text-[24px] tabular-nums">{n}</p><SeverityBadge severity={s} /></a>;
              })}
            </div>
            <p className="mt-2 text-[12px] text-muted">{openIssues.filter((i) => i.status === 'Needs research').length} still need inspection before they count as verified defects.</p>
          </Section>
          <Section title={`Decisions awaiting approval (${awaiting.length})`}>
            <ul className="flex flex-col gap-1">{awaiting.slice(0, 6).map((d) => <li key={d.id}><EntityLink kind="decision" id={d.id} showStatus /></li>)}</ul>
            {!awaiting.length && <p className="text-[13px] text-muted">None.</p>}
          </Section>
          <Section title={`Assets requiring redesign (${redesign.length})`}>
            {redesign.length ? <ul className="flex flex-wrap gap-1">{redesign.slice(0, 10).map((a) => <li key={a.id}><EntityLink kind="asset" id={a.id} /></li>)}</ul> : <p className="text-[13px] text-muted">No asset is flagged yet. Flag assets in the Asset Library after inspecting them.</p>}
          </Section>
          <Section title={`Outstanding research (${research.length})`}>
            <ul className="flex flex-col gap-1">{research.slice(0, 8).map((r) => <li key={r.id}><EntityLink kind={'code' in r && String(r.id).startsWith('dec') ? 'decision' : String(r.id).startsWith('lmk') ? 'landmark' : 'issue'} id={r.id} /></li>)}</ul>
          </Section>
          <Section title="Recent activity">
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto text-[12.5px]">
              {ws.activity.slice(0, 20).map((a, i) => <li key={i} className="flex gap-2"><span className="w-24 shrink-0 text-muted">{fmtTime(a.at)}</span><span>{a.text}</span></li>)}
            </ul>
          </Section>
        </div>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title="Project direction" wide>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Text label="Project owner" value={p.owner} onChange={(v) => mutate('project owner', (d) => { d.project.owner = v; })} hint="Recorded on approvals and acceptances." />
            <Area label="Current overall art direction" rows={4} value={p.artDirection} onChange={(v) => mutate('art direction', (d) => { d.project.artDirection = v; })} />
            <Area label="Proposed visual direction" rows={4} value={p.proposedDirection} onChange={(v) => mutate('proposed direction', (d) => { d.project.proposedDirection = v; })} />
            <Area label="Academic or submission restrictions" rows={3} value={p.restrictions} onChange={(v) => mutate('restrictions', (d) => { d.project.restrictions = v; })} />
            <label className="flex flex-col gap-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Current challenge
              <select className="input normal-case tracking-normal" value={p.currentChallenge ? p.currentChallenge.kind + ':' + p.currentChallenge.id : ''} onChange={(e) => mutate('current challenge', (d) => { const [k, id] = e.target.value.split(':'); d.project.currentChallenge = id ? { kind: k as 'sprint' | 'issue', id } : null; })}>
                <option value="">None</option>
                {Object.values(ws.sprints).map((s) => <option key={s.id} value={'sprint:' + s.id}>{s.code}: {s.title}</option>)}
                {Object.values(ws.issues).map((s) => <option key={s.id} value={'issue:' + s.id}>{s.code}: {s.title}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-4">
            <ImageSlot label="Baseline image" value={p.baselineImage} onChange={(r) => mutate('baseline image', (d) => { d.project.baselineImage = r; })} />
            <ImageSlot label="Latest approved iteration (override)" value={p.latestApprovedImage} onChange={(r) => mutate('approved image', (d) => { d.project.latestApprovedImage = r; })} />
            <p className="text-[12px] text-muted">Leave the override empty to show the most recently approved candidate automatically.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Frame({ title, refx, empty }: { title: string; refx: import('../types').ImageRef | null; empty: string }) {
  return (
    <div className="flex flex-col">
      <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
      {refx ? <Img refx={refx} alt={title} className="m-3 h-44 rounded bg-sand" /> : <div className="m-3 flex h-44 items-center justify-center rounded border border-dashed border-line p-3 text-center text-[12px] text-muted"><Unknown>{empty}</Unknown></div>}
    </div>
  );
}

export { StatusBadge };
