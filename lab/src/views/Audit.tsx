import { useEffect, useMemo, useRef, useState } from 'react';
import { mutate, useWs } from '../store/store';
import { Area, Button, Empty, PageHeader, Section, StatusBadge, Tabs, toast } from '../components/ui';
import { EntityLink } from '../components/links';
import { docByPath, snapshot } from '../seed/snapshot';
import { renderMarkdown } from '../lib/markdown';
import { href, setQuery, useRoute } from '../lib/router';
import { fmtTime, now, uid } from '../lib/util';
import { storeFile } from '../components/images';
import type { Source } from '../types';

function cite(path: string, re: RegExp) {
  const d = docByPath(path);
  if (!d) return null;
  const i = d.text.split('\n').findIndex((l) => re.test(l));
  return i < 0 ? null : { path, line: i + 1, text: d.text.split('\n')[i].trim() };
}

export default function Audit() {
  const ws = useWs();
  const route = useRoute();
  const tab = (route.q.get('doc') ? 'docs' : route.q.get('tab')) ?? 'audit';
  const facts = snapshot.facts ?? [];
  const measured = Object.values(ws.measurements);

  const claims = useMemo(() => {
    const c = [
      { claim: 'README: "60 FPS Performance: Supports up to 10,000 animated NPCs"', at: cite('README.md', /60 FPS/), note: 'The root README still describes version 1. performance.md reports 59.5–60 FPS at 10,001 people on one Apple M4 in headless Chrome. Not re-measured by the lab.' },
      { claim: 'README: "100% Procedural Generation … Zero External Dependencies: No image assets"', at: cite('README.md', /100% Procedural/), note: 'Contradicted by the current build: 100 SVG assets are packed into build/js/assets.bundle.js (fact F-ASSETS). The README is out of date.' },
      { claim: 'performance.md: average 60 FPS at every density, with motion', at: cite('vibe-coding/build-record/performance.md', /Re-run with motion/), note: 'Documented measurement from tests/perf.mjs on one machine. Treated as a claim until reproduced on named devices.' },
      { claim: 'Checkpoint 2: self-assessed rubric score 4.0', at: cite('vibe-coding/build-record/visual-qa/checkpoint-2/review.md', /Self-assessed score/), note: 'HARNESS.md: "A self-assigned score alone is not proof; the project lead\'s review decides."' },
      { claim: 'Brief baseline: "default crowd of approximately 420", "four shuffled districts"', at: null, note: 'Describes version 1. The current default is one world with budgets low 450, standard 900, dense 1,500 (fact F-WORLD).' },
    ];
    return c;
  }, []);

  const health = useMemo(() => {
    const failing = facts.filter((f) => !f.ok);
    const approvedDecisions = Object.values(ws.decisions).filter((d) => d.workflow === 'Approved').length;
    const reviews = Object.values(ws.reviews).length;
    return { failing, approvedDecisions, reviews };
  }, [facts, ws]);

  return (
    <div>
      <PageHeader eyebrow="Project Audit" title="What the repository actually says" lede={<>Read from the checkout next to this lab by <span className="font-mono">scripts/ingest.mjs</span> on {fmtTime(snapshot.generatedAt)}. Facts are checked against source lines. The game files were not modified.</>}>
        <Tabs label="Audit views" value={tab} onChange={(t) => { setQuery('doc', null); setQuery('tab', t); }} tabs={[{ value: 'audit', label: 'Audit' }, { value: 'docs', label: 'Documents' }, { value: 'import', label: 'Import' }]} />
      </PageHeader>

      {tab === 'docs' && <DocBrowser />}
      {tab === 'import' && <ImportPanel />}
      {tab === 'audit' && (
        <div className="flex flex-col gap-5">
          {!snapshot.available && <Empty title="No repository snapshot">Run <code>npm run ingest</code> inside <code>lab/</code>, or import files in the Import tab.</Empty>}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Project health summary">
              <ul className="flex flex-col gap-1.5 text-[13.5px]">
                <li>Repository checks: <b>{facts.length - health.failing.length} of {facts.length}</b> found where expected{health.failing.length ? ` (${health.failing.map((f) => f.id).join(', ')} failing)` : ''}.</li>
                <li>Current build: illustrated edition (ADR-002), art version {snapshot.artVersion ?? 'unknown'}, {snapshot.counts?.assets ?? 0} SVG assets, {snapshot.counts?.tests ?? 0} declared Playwright checks.</li>
                <li>Deployed site: serves the illustrated build (checked 2026-11-16, see source "Deployed game").</li>
                <li>Version 1 procedural game archived and still runnable (fact F-V1-ARCHIVED).</li>
                <li>Lab measurements recorded: <b>{measured.length}</b>. Quality reviews recorded: <b>{health.reviews}</b>.</li>
                <li>Out-of-date document: the root README still describes version 1.</li>
              </ul>
            </Section>
            <Section title="Visual redesign readiness">
              <ul className="flex flex-col gap-1.5 text-[13.5px]">
                <li><StatusBadge status="Verified" small /> The pipeline exists: authored SVG, part library, packer, alpha hit testing.</li>
                <li><StatusBadge status="Needs research" small /> Whether the current crowd reads as illustrated at gameplay scale (VIS-001, VIS-003) has no owner verdict yet.</li>
                <li><StatusBadge status="Tentative" small /> Design rules ADR-V001 to V008: {health.approvedDecisions} approved in the lab.</li>
                <li><StatusBadge status="Needs research" small /> SCAD Poetter Hall (brief District A) has no asset or district in the current build.</li>
                <li><StatusBadge status="Tentative" small /> Course restrictions on assets are unreviewed. Keep the v1 build available.</li>
              </ul>
            </Section>
          </div>

          <Section title="1 · Verified implementation facts" actions={<span className="text-[12px] text-muted">checked by ingest against source lines</span>}>
            <ul className="divide-y divide-line/60">
              {facts.map((f) => (
                <li key={f.id} className="grid gap-2 py-2.5 md:grid-cols-[7rem_1fr_16rem]">
                  <div className="flex items-start gap-2"><span className="font-mono text-[11.5px] text-muted">{f.id}</span></div>
                  <div>
                    <p className="text-[13.5px]"><span className={`mr-1.5 font-semibold ${f.ok ? 'text-moss' : 'text-[#B3261E]'}`}>{f.ok ? '✓ Found' : '✗ Not found'}</span>{f.claim}</p>
                    {f.evidence.map((e, i) => <a key={i} href={href('audit', null, { doc: e.path, line: String(e.line ?? 1) })} className="mt-0.5 block truncate font-mono text-[11.5px] text-muted hover:text-cocoa">{e.path}{e.line ? ':' + e.line : ''}: {e.text}</a>)}
                  </div>
                  <textarea aria-label={`Owner note for ${f.id}`} className="input h-14 text-[12px]" placeholder="Owner note…" value={ws.auditNotes[f.id] ?? ''} onChange={(e) => mutate('audit note ' + f.id, (d) => { d.auditNotes[f.id] = e.target.value; })} />
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="2 · Documented design decisions">
              <ul className="flex flex-col gap-2 text-[13.5px]">
                <DocLink path="vibe-coding/decisions/ADR-001.md" note="Zero-asset procedural 3D. Its supersession notice says ADR-002 replaced the asset ban, geometry-only rendering, the fixed camera and the synthetic performance gate." />
                <DocLink path="vibe-coding/decisions/ADR-002-illustrated-world.md" note={'Illustrated 2D world. Header: "Accepted for the visual overhaul, subject to repository review", 2026-11-15.'} />
                <DocLink path="HARNESS.md" note="Hard rules (offline, original art, Forsyth first, one target, determinism), visual gates A–F, weighted rubric." />
                <DocLink path="HANDOFF.md" note="State machine, replay identity, asset manifest and function contracts." />
                <DocLink path="vibe-coding/sources/art-direction.md" note="Line, palette, people, target, layout and variation system." />
              </ul>
            </Section>
            <Section title="3 · User-reported visual problems">
              <ul className="flex flex-col gap-1">{Object.values(ws.issues).filter((i) => i.reportedBy === 'Project owner').map((i) => <li key={i.id}><EntityLink kind="issue" id={i.id} showStatus /></li>)}</ul>
              <p className="mt-2 text-[12px] text-muted">Reported by the owner in the brief. Each needs inspection before it counts as a verified defect.</p>
            </Section>
            <Section title="4 · Proposed design improvements">
              <ul className="flex flex-col gap-2">
                {Object.values(ws.decisions).sort((a, b) => a.priority - b.priority).map((d) => (
                  <li key={d.id} className="text-[13px]"><EntityLink kind="decision" id={d.id} showStatus /><p className="mt-0.5 text-muted">{d.proposedReplacement}</p></li>
                ))}
              </ul>
            </Section>
            <Section title="5 · Unverified technical or performance claims">
              <ul className="flex flex-col gap-3">
                {claims.map((c) => (
                  <li key={c.claim} className="text-[13px]">
                    <p className="flex items-start gap-2"><StatusBadge status="Tentative" small /><span className="font-medium">{c.claim}</span></p>
                    {c.at && <a className="block truncate font-mono text-[11.5px] text-muted hover:text-cocoa" href={href('audit', null, { doc: c.at.path, line: String(c.at.line) })}>{c.at.path}:{c.at.line}</a>}
                    <p className="text-muted">{c.note}</p>
                  </li>
                ))}
                {measured.length > 0 && <li className="text-[13px]"><StatusBadge status="Verified" small /> {measured.length} lab benchmark run(s) are recorded in Quality Control.</li>}
              </ul>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function DocLink({ path, note }: { path: string; note: string }) {
  const d = docByPath(path);
  return (
    <li>
      <a href={href('audit', null, { doc: path })} className="font-mono text-[12.5px] underline decoration-terracotta/40">{path}</a>
      {d && <span className="ml-2 text-[11px] text-muted">{d.lines} lines · sha {d.sha}</span>}
      <p className="text-muted">{note}</p>
    </li>
  );
}

function DocBrowser() {
  const route = useRoute();
  const ws = useWs();
  const sel = route.q.get('doc') ?? 'vibe-coding/decisions/ADR-002-illustrated-world.md';
  const line = Number(route.q.get('line') ?? 0);
  const repoDoc = docByPath(sel);
  const uploaded = Object.values(ws.sources).find((s) => s.id === sel);
  const text = repoDoc?.text ?? uploaded?.text ?? '';
  const html = useMemo(() => renderMarkdown(text, { lineIds: true }), [text]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!line || !ref.current) return;
    const els = [...ref.current.querySelectorAll<HTMLElement>('[id^="L"]')];
    const target = els.filter((e) => Number(e.id.slice(1)) <= line).pop();
    target?.scrollIntoView({ block: 'center' });
    target?.classList.add('bg-gold/30');
  }, [html, line]);
  const groups = new Map<string, string[]>();
  for (const d of snapshot.docs ?? []) { const g = d.path.split('/').slice(0, -1).join('/') || '(root)'; (groups.get(g) || groups.set(g, []).get(g)!).push(d.path); }
  const uploads = Object.values(ws.sources).filter((s) => s.kind === 'upload' && s.text);
  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <nav aria-label="Documents" className="max-h-[75vh] overflow-y-auto rounded-lg border border-line bg-cream p-2 text-[12.5px]">
        {[...groups].map(([g, list]) => (
          <div key={g} className="mb-2">
            <p className="px-2 font-mono text-[11px] text-muted">{g}/</p>
            {list.map((p) => <a key={p} href={href('audit', null, { doc: p })} className={`block truncate rounded px-2 py-0.5 ${p === sel ? 'bg-cocoa text-cream' : 'hover:bg-sand'}`}>{p.split('/').pop()}</a>)}
          </div>
        ))}
        {uploads.length > 0 && <div><p className="px-2 font-mono text-[11px] text-muted">imported/</p>{uploads.map((s) => <a key={s.id} href={href('audit', null, { doc: s.id })} className={`block truncate rounded px-2 py-0.5 ${s.id === sel ? 'bg-cocoa text-cream' : 'hover:bg-sand'}`}>{s.title}</a>)}</div>}
      </nav>
      <article className="min-w-0 rounded-lg border border-line bg-cream p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-line pb-2">
          <span className="font-mono text-[12px]">{sel}</span>
          {repoDoc && <span className="text-[11px] text-muted">{repoDoc.lines} lines · sha {repoDoc.sha} · read-only</span>}
          {uploaded && <StatusBadge status={uploaded.status} small />}
        </div>
        {text ? <div ref={ref} className="prose-doc" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-muted">Document not found in the snapshot.</p>}
      </article>
    </div>
  );
}

function ImportPanel() {
  const ws = useWs();
  const [remote, setRemote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function importFiles(files: File[]) {
    for (const f of files) {
      const isText = /\.(md|markdown|txt|json|js|mjs|ts|tsx|html|css|py)$/i.test(f.name) || f.type.startsWith('text/');
      const isImage = f.type.startsWith('image/');
      if (!isText && !isImage) { toast(`Skipped ${f.name}: unsupported type`); continue; }
      const blob = isImage ? await storeFile(f) : null;
      const text = isText ? await f.text() : null;
      const rec: Source = { id: uid('src'), createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Uploaded file: ' + f.name, rationale: 'Imported by the owner; contents not cross-checked against the repository.', tags: [], title: f.name, kind: 'upload', path: null, url: null, sha: null, note: '', text, blob };
      mutate('import file', (d) => { d.sources[rec.id] = rec; d.activity.unshift({ at: now(), text: `Imported ${f.name}` }); });
    }
    toast(`Imported ${files.length} file(s)`);
  }
  async function checkRemote() {
    const url = snapshot.git?.remote?.match(/github\.com[:/](.+?)(\.git)?$/)?.[1];
    if (!url) { setRemote('No GitHub remote recorded in the snapshot.'); return; }
    setBusy(true);
    try {
      const r = await fetch(`https://api.github.com/repos/${url}/commits/main`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const sha = String(j.sha).slice(0, 7);
      setRemote(`GitHub main is at ${sha} (${j.commit?.message?.split('\n')[0] ?? ''}, ${j.commit?.committer?.date?.slice(0, 10) ?? ''}). The lab snapshot is ${snapshot.git?.head ?? 'unknown'} on ${snapshot.git?.branch ?? 'unknown'}${sha === snapshot.git?.head ? ', the same commit' : '. They differ, so re-run ingest on the commit you want to audit'}.`);
    } catch (e) { setRemote('Could not reach the GitHub API from this browser: ' + String(e)); }
    setBusy(false);
  }
  const uploads = Object.values(ws.sources).filter((s) => s.kind === 'upload');
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Section title="Mode A · Local import">
        <p className="mb-3 text-[13px] text-muted">Markdown, JSON, source files and images. Text is kept in the workspace; images go to IndexedDB. Imported files are marked Tentative until checked.</p>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-line px-4 py-6 text-center hover:border-cocoa/40">
          <span className="text-[13px] font-medium">Choose files</span>
          <input type="file" multiple hidden onChange={(e) => { importFiles([...(e.target.files ?? [])]); e.target.value = ''; }} />
        </label>
        <ul className="mt-3 flex flex-col gap-1 text-[12.5px]">{uploads.map((s) => <li key={s.id} className="flex items-center justify-between gap-2"><a className="truncate underline" href={href('audit', null, { doc: s.id })}>{s.title}</a><span className="text-muted">{fmtTime(s.createdAt)}</span></li>)}</ul>
      </Section>
      <Section title="Mode B · Repository inspection">
        <p className="text-[13px]">The lab reads the local checkout at build time (<span className="font-mono">{snapshot.git?.head ?? '?'}</span>, {snapshot.counts?.docs ?? 0} documents). You can also compare it with the public GitHub repository.</p>
        <Button className="mt-3" onClick={checkRemote} disabled={busy}>{busy ? 'Checking…' : 'Compare with GitHub main'}</Button>
        <p className="mt-2 text-[11.5px] text-muted">Sends one unauthenticated request to api.github.com for the public repository. Nothing about you is sent.</p>
        {remote && <p className="mt-2 rounded bg-sand p-2 text-[12.5px]">{remote}</p>}
      </Section>
      <Section title="Mode C · Authorized connection">
        <p className="text-[13px]">Not connected. Fetching branches and comparing revisions needs a GitHub token the owner grants. The lab will not claim commits, pull requests or pushes that did not happen.</p>
        <Area label="Notes for later setup" value={ws.auditNotes['modeC'] ?? ''} onChange={(v) => mutate('mode c note', (d) => { d.auditNotes['modeC'] = v; })} rows={3} />
      </Section>
    </div>
  );
}
