import { useEffect, useRef, useState } from 'react';
import { logActivity, mutate, useLab, useWs } from '../store/store';
import { Area, Button, confirmAction, Empty, PageHeader, Score, Section, Select, SeverityBadge, Slider, StatusSelect, Tabs, Text, toast } from '../components/ui';
import { EntityLink, LinkList } from '../components/links';
import { ImageSlot, loadImage, refLabel, storeFile, useImageUrl } from '../components/images';
import { canvasBlob } from '../components/sprites';
import { loadRuntime, svgToImage } from '../lib/runtime';
import { go, href, setQuery, useRoute } from '../lib/router';
import { download, now, uid } from '../lib/util';
import { RUBRIC, SEVERITIES, type Pin, type ScreenshotComparison, type Severity } from '../types';

const MODES = [
  { value: 'side', label: 'Side by side' }, { value: 'overlay', label: 'Overlay' }, { value: 'reveal', label: 'Reveal slider' }, { value: 'detail', label: 'Zoomed detail' },
  { value: 'align', label: 'Aligned crop' }, { value: 'diff', label: 'Difference' }, { value: 'composition', label: 'Composition' },
] as const;
type Mode = (typeof MODES)[number]['value'];
const SEV_RING: Record<Severity, string> = { Critical: '#B3261E', Major: '#C86D51', Minor: '#FFCA28', Note: '#7C4DFF' };

export default function Compare() {
  const ws = useWs();
  const route = useRoute();
  const [focus, setFocus] = useState<'all' | 'scene' | 'character'>('all');
  const list = Object.values(ws.comparisons).filter((c) => focus === 'all' || c.focus === focus).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sel = route.id ? ws.comparisons[route.id] : list[0];
  const started = useRef(false);

  // "Compare with current" from the Character Workshop: render the repo drawing now, pair it with the candidate.
  useEffect(() => {
    const spec = route.q.get('new');
    if (!spec || started.current) return;
    started.current = true;
    const [, candId, charId] = spec.split(':');
    const ch = ws.characters[charId]; const cand = ch?.candidates.find((x) => x.id === candId);
    if (!ch || !cand) return;
    (async () => {
      let left = null;
      const asset = ch.primaryAsset ?? ch.assetIds[0];
      if (asset) {
        const rt = await loadRuntime();
        const m = rt.assets.meta[asset];
        const svg = m.head || m.head2 ? rt.WS.characters.compose(asset, null) : rt.assets.svg[asset];
        const img = await svgToImage(svg);
        const c = document.createElement('canvas'); const s = 4; c.width = m.viewBox[2] * s; c.height = m.viewBox[3] * s;
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        left = await storeFile(await canvasBlob(c), `${asset.split('/').pop()}-current-render.png`);
      }
      const id = uid('cmp');
      mutate('new comparison', (d) => {
        d.comparisons[id] = blank(id, `${ch.name}: current drawing vs "${cand.name}"`, 'character');
        Object.assign(d.comparisons[id], { left, right: cand.image, leftLabel: `Current repo drawing (${asset ?? 'none'}), rendered by the lab at 4×`, rightLabel: `Candidate "${cand.name}"` });
        for (const s of Object.values(d.sprints)) if (s.characterIds.includes(ch.id)) s.comparisonIds.push(id);
        logActivity(d, 'Comparison created from a candidate', { kind: 'comparison', id });
      });
      go('compare', id);
    })();
  }, [route.q, ws.characters]);

  function create() {
    const id = uid('cmp');
    mutate('new comparison', (d) => { d.comparisons[id] = blank(id, 'New comparison', 'scene'); logActivity(d, 'Comparison created', { kind: 'comparison', id }); });
    go('compare', id);
  }
  return (
    <div>
      <PageHeader eyebrow="Comparison Studio" title="Before and after, side by side" lede="Only real captures: uploads, repository screenshots, or the lab's own renders of repository art. If the deployed game cannot be captured automatically, upload a screenshot.">
        <Tabs label="Focus" value={focus} onChange={(v) => setFocus(v as typeof focus)} tabs={[{ value: 'all', label: 'All' }, { value: 'scene', label: 'Scene composition' }, { value: 'character', label: 'Character only' }]} />
        <Button kind="primary" onClick={create}>+ Comparison</Button>
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[16rem_1fr]">
        <ul className="flex flex-col gap-1.5">
          {list.map((c) => <li key={c.id}><a href={href('compare', c.id)} className={`block rounded-lg border bg-cream p-2.5 ${sel?.id === c.id ? 'border-cocoa ring-1 ring-cocoa' : 'border-line hover:border-cocoa/40'}`}><p className="text-[13px] font-medium leading-snug">{c.name}</p><p className="text-[11.5px] text-muted">{c.focus} · {c.pins.length} pin(s){c.preferred ? ` · prefers ${c.preferred}` : ''}</p></a></li>)}
          {!list.length && <li className="text-[13px] text-muted">No comparisons yet.</li>}
        </ul>
        {sel ? <Studio key={sel.id} c={sel} /> : <Empty title="Create a comparison" />}
      </div>
    </div>
  );
}

function blank(id: string, name: string, focus: 'scene' | 'character'): ScreenshotComparison {
  return { id, createdAt: now(), updatedAt: now(), status: 'Tentative', source: 'Comparison Studio', rationale: null, tags: [], name, left: null, right: null, leftLabel: 'Before', rightLabel: 'After', seed: null, viewport: null, focus, align: { dx: 0, dy: 0, scale: 1 }, pins: [], decisionIds: [], issueIds: [], rubric: {}, preferred: null, notes: '' };
}

function Studio({ c }: { c: ScreenshotComparison }) {
  const route = useRoute();
  const mode = (route.q.get('mode') as Mode) ?? 'side';
  const L = useImageUrl(c.left), R = useImageUrl(c.right);
  const [view, setView] = useState({ z: 1, x: 0.5, y: 0.5 });   // shared zoom/pan, centre in image fractions
  const [opacity, setOpacity] = useState(0.5);
  const [reveal, setReveal] = useState(0.5);
  const [sev, setSev] = useState<Severity>('Major');
  const set = <K extends keyof ScreenshotComparison>(k: K, v: ScreenshotComparison[K]) => mutate(`cmp ${c.id} ${String(k)}`, (d) => { (d.comparisons[c.id] as ScreenshotComparison)[k] = v; d.comparisons[c.id].updatedAt = now(); });
  const addPin = (x: number, y: number) => { const text = prompt('What is the problem here?'); if (text) set('pins', [...c.pins, { id: uid('pin'), x, y, text, severity: sev, issueId: null }]); };

  async function exportPng() {
    if (!L || !R) { toast('Both images are needed'); return; }
    const [a, b] = await Promise.all([loadImage(L), loadImage(R)]);
    const H = 720, wa = a.width * H / a.height, wb = b.width * H / b.height, pad = 32, head = 84;
    const scored = RUBRIC.filter((k) => c.rubric[k]?.left != null || c.rubric[k]?.right != null);
    const foot = 40 + Math.max(c.pins.length, scored.length) * 22;
    const cv = document.createElement('canvas'); cv.width = wa + wb + pad * 3; cv.height = H + head + foot + pad;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#FFFDF9'; x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#3E2723'; x.font = '600 30px Georgia, serif'; x.fillText(c.name, pad, 46);
    x.font = '15px ui-sans-serif, system-ui'; x.fillStyle = '#786258'; x.fillText(`Seed ${c.seed ?? 'unknown'} · viewport ${c.viewport ?? 'unknown'} · ${new Date().toISOString().slice(0, 10)}`, pad, 70);
    x.drawImage(a, pad, head, wa, H); x.drawImage(b, pad * 2 + wa, head, wb, H);
    x.fillStyle = 'rgba(62,39,35,0.85)'; x.fillRect(pad, head, Math.min(wa, x.measureText(c.leftLabel).width + 24), 26); x.fillRect(pad * 2 + wa, head, Math.min(wb, x.measureText(c.rightLabel).width + 24), 26);
    x.fillStyle = '#FFFDF9'; x.fillText(c.leftLabel, pad + 10, head + 18); x.fillText(c.rightLabel, pad * 2 + wa + 10, head + 18);
    c.pins.forEach((p, i) => { for (const [ox, w] of [[pad, wa], [pad * 2 + wa, wb]] as const) { const px = ox + p.x * w, py = head + p.y * H; x.strokeStyle = SEV_RING[p.severity ?? 'Note']; x.lineWidth = 4; x.beginPath(); x.arc(px, py, 18, 0, Math.PI * 2); x.stroke(); x.fillStyle = '#3E2723'; x.font = '700 14px ui-sans-serif'; x.fillText(String(i + 1), px - 4, py + 5); } });
    x.font = '15px ui-sans-serif'; x.fillStyle = '#3E2723';
    c.pins.forEach((p, i) => x.fillText(`${i + 1}. [${p.severity ?? 'Note'}] ${p.text}`.slice(0, 110), pad, head + H + 34 + i * 22));
    scored.forEach((k, i) => x.fillText(`${k}: ${c.rubric[k].left ?? '–'} → ${c.rubric[k].right ?? '–'}`, cv.width / 2, head + H + 34 + i * 22));
    download(`${c.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`, await canvasBlob(cv), 'image/png');
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs label="Comparison mode" value={mode} onChange={(v) => setQuery('mode', v)} tabs={MODES} />
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <label className="text-[12px]">Pin severity <select className="input ml-1 inline w-auto py-0.5 text-[12px]" value={sev} onChange={(e) => setSev(e.target.value as Severity)}>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <Button small onClick={exportPng}>Export presentation PNG</Button>
        </div>
      </div>
      {!L || !R ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ImageSlot label="Original screenshot (before)" value={c.left} onChange={(r) => set('left', r)} height="h-56" />
          <ImageSlot label="Revised screenshot (after)" value={c.right} onChange={(r) => set('right', r)} height="h-56" />
        </div>
      ) : (
        <Viewer mode={mode} L={L} R={R} c={c} view={view} setView={setView} opacity={opacity} reveal={reveal} setReveal={setReveal} onPin={addPin} />
      )}
      {L && R && (
        <div className="flex flex-wrap items-center gap-4 text-[12px]">
          <span className="text-muted">Click an image to pin a problem. Wheel zooms both images together; drag pans both.</span>
          {mode === 'overlay' && <div className="w-60"><Slider label="After opacity" value={opacity} onChange={setOpacity} format={(v) => Math.round(v * 100) + '%'} /></div>}
          {mode === 'reveal' && <div className="w-60"><Slider label="Reveal" value={reveal} onChange={setReveal} format={(v) => Math.round(v * 100) + '%'} /></div>}
          <Button small kind="ghost" onClick={() => setView({ z: 1, x: 0.5, y: 0.5 })}>Reset zoom</Button>
        </div>
      )}
      {mode === 'align' && L && R && (
        <div className="grid max-w-xl grid-cols-3 gap-3">
          <Slider label="Shift X" min={-0.3} max={0.3} step={0.002} value={c.align.dx} onChange={(v) => set('align', { ...c.align, dx: v })} format={(v) => (v * 100).toFixed(1) + '%'} />
          <Slider label="Shift Y" min={-0.3} max={0.3} step={0.002} value={c.align.dy} onChange={(v) => set('align', { ...c.align, dy: v })} format={(v) => (v * 100).toFixed(1) + '%'} />
          <Slider label="Scale" min={0.5} max={2} step={0.01} value={c.align.scale} onChange={(v) => set('align', { ...c.align, scale: v })} format={(v) => '×' + v.toFixed(2)} />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-5">
          <Section title={`Annotations (${c.pins.length})`}>
            {c.pins.length === 0 ? <p className="text-[13px] text-muted">No pins yet.</p> : (
              <ol className="flex flex-col gap-2">
                {c.pins.map((p, i) => <PinRow key={p.id} p={p} n={i + 1} c={c} />)}
              </ol>
            )}
          </Section>
          <Section title="Rubric" actions={<span className="text-[12px] text-muted">0–5, before → after</span>}>
            <div className="overflow-x-auto"><table className="w-full text-[13px]">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-1">Criterion</th><th>{c.leftLabel}</th><th>{c.rightLabel}</th></tr></thead>
              <tbody>
                {RUBRIC.map((k) => (
                  <tr key={k} className="border-t border-line">
                    <td className="py-1.5 pr-2">{k}</td>
                    {(['left', 'right'] as const).map((side) => <td key={side}><Score label={`${k}, ${side}`} value={c.rubric[k]?.[side] ?? null} onChange={(v) => set('rubric', { ...c.rubric, [k]: { left: c.rubric[k]?.left ?? null, right: c.rubric[k]?.right ?? null, [side]: v } })} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px]">Preferred:</span>
              {(['left', 'right'] as const).map((s) => <Button key={s} small kind={c.preferred === s ? 'primary' : 'secondary'} onClick={() => set('preferred', c.preferred === s ? null : s)}>{s === 'left' ? c.leftLabel : c.rightLabel}</Button>)}
            </div>
          </Section>
        </div>
        <Section title="Record">
          <div className="flex flex-col gap-3">
            <Text label="Name" value={c.name} onChange={(v) => set('name', v)} />
            <div className="grid grid-cols-2 gap-2"><Text label="Left label" value={c.leftLabel} onChange={(v) => set('leftLabel', v)} /><Text label="Right label" value={c.rightLabel} onChange={(v) => set('rightLabel', v)} /></div>
            <div className="grid grid-cols-2 gap-2"><Text label="Scene seed" value={c.seed} onChange={(v) => set('seed', v || null)} mono /><Text label="Viewport" value={c.viewport} onChange={(v) => set('viewport', v || null)} placeholder="1440×900" /></div>
            <Select label="Focus" value={c.focus} options={[{ value: 'scene', label: 'Scene composition' }, { value: 'character', label: 'Character only' }]} onChange={(v) => set('focus', v as 'scene' | 'character')} />
            {L && R && <><ImageSlot label="Before" value={c.left} onChange={(r) => set('left', r)} height="h-24" /><ImageSlot label="After" value={c.right} onChange={(r) => set('right', r)} height="h-24" /></>}
            <p className="text-[11px] text-muted">Before: {refLabel(c.left)}<br />After: {refLabel(c.right)}</p>
            <LinkList kind="decision" label="Design decisions" ids={c.decisionIds} onChange={(v) => set('decisionIds', v)} />
            <LinkList kind="issue" label="Issues" ids={c.issueIds} onChange={(v) => set('issueIds', v)} />
            <Area label="Notes" value={c.notes} onChange={(v) => set('notes', v)} />
            <StatusSelect value={c.status} onChange={(v) => set('status', v)} />
            <Button small kind="danger" onClick={async () => { if (await confirmAction('Delete comparison?', c.name, 'Delete')) { useLab.getState().remove('comparison', c.id); go('compare'); } }}>Delete</Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function PinRow({ p, n, c }: { p: Pin; n: number; c: ScreenshotComparison }) {
  const ws = useWs();
  const upd = (patch: Partial<Pin>) => mutate('pin', (d) => { const x = d.comparisons[c.id].pins.find((y) => y.id === p.id); if (x) Object.assign(x, patch); });
  function toIssue() {
    const id = uid('iss');
    mutate('pin to issue', (d) => {
      const num = Math.max(0, ...Object.values(d.issues).map((i) => Number(i.code.match(/\d+/)?.[0] ?? 0))) + 1;
      d.issues[id] = { id, code: 'VIS-' + String(num).padStart(3, '0'), createdAt: now(), updatedAt: now(), status: 'Needs research', source: 'Comparison: ' + c.name, rationale: null, tags: [], title: p.text.slice(0, 80), description: p.text, category: c.focus === 'character' ? 'Characters' : 'Composition', severity: p.severity ?? 'Minor', priority: Object.keys(d.issues).length + 1, stage: 'Backlog', reportedBy: d.project.owner || 'Owner', evidence: [c.left, c.right].filter(Boolean) as NonNullable<typeof c.left>[], assetIds: [], characterIds: [], sceneId: null, district: null, decisionIds: [...c.decisionIds], sprintIds: [], comparisonIds: [c.id], rootCause: '', proposedChange: '', steps: '', codePaths: [], acceptance: '', testEvidence: '' };
      const x = d.comparisons[c.id].pins.find((y) => y.id === p.id); if (x) x.issueId = id;
      if (!d.comparisons[c.id].issueIds.includes(id)) d.comparisons[c.id].issueIds.push(id);
      logActivity(d, 'Comparison finding moved into an issue', { kind: 'issue', id });
    });
    toast('Issue created with both images as evidence');
  }
  return (
    <li className="flex flex-wrap items-center gap-2 text-[13px]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: SEV_RING[p.severity ?? 'Note'] }}>{n}</span>
      <input aria-label={`Pin ${n} text`} className="input flex-1 py-0.5" value={p.text} onChange={(e) => upd({ text: e.target.value })} />
      <select aria-label={`Pin ${n} severity`} className="input w-auto py-0.5 text-[12px]" value={p.severity ?? 'Note'} onChange={(e) => upd({ severity: e.target.value as Severity })}>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select>
      <SeverityBadge severity={p.severity ?? 'Note'} />
      {p.issueId && ws.issues[p.issueId] ? <EntityLink kind="issue" id={p.issueId} /> : <Button small kind="ghost" onClick={toIssue}>→ Issue</Button>}
      <button aria-label="Delete pin" className="text-muted hover:text-coral" onClick={() => mutate('del pin', (d) => { d.comparisons[c.id].pins = d.comparisons[c.id].pins.filter((x) => x.id !== p.id); })}>×</button>
    </li>
  );
}

function Viewer({ mode, L, R, c, view, setView, opacity, reveal, setReveal, onPin }: { mode: Mode; L: string; R: string; c: ScreenshotComparison; view: { z: number; x: number; y: number }; setView(v: { z: number; x: number; y: number }): void; opacity: number; reveal: number; setReveal(v: number): void; onPin(x: number, y: number): void }) {
  const drag = useRef<{ sx: number; sy: number; v: typeof view; moved: number; w: number; h: number } | null>(null);
  const style = (align = false): React.CSSProperties => ({
    transform: `translate(${(0.5 - view.x) * 100}%, ${(0.5 - view.y) * 100}%) scale(${view.z})${align ? ` translate(${c.align.dx * 100}%, ${c.align.dy * 100}%) scale(${c.align.scale})` : ''}`,
    transformOrigin: `${view.x * 100}% ${view.y * 100}%`,
  });
  const handlers = {
    onWheel: (e: React.WheelEvent) => { setView({ ...view, z: Math.max(1, Math.min(8, view.z * Math.exp(-e.deltaY * 0.0015))) }); },
    onPointerDown: (e: React.PointerEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); drag.current = { sx: e.clientX, sy: e.clientY, v: view, moved: 0, w: r.width, h: r.height }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); },
    onPointerMove: (e: React.PointerEvent) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.sx, dy = e.clientY - d.sy; d.moved = Math.max(d.moved, Math.hypot(dx, dy)); if (mode === 'reveal' && view.z === 1) { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setReveal(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); return; } if (view.z > 1) setView({ ...d.v, x: d.v.x - dx / d.w / view.z, y: d.v.y - dy / d.h / view.z }); },
    onPointerUp: (e: React.PointerEvent) => { const d = drag.current; drag.current = null; if (!d || d.moved > 5) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height; const ix = view.x + (fx - 0.5) / view.z, iy = view.y + (fy - 0.5) / view.z; onPin(Math.max(0, Math.min(1, ix)), Math.max(0, Math.min(1, iy))); },
  };
  const pins = (
    <>{c.pins.map((p, i) => <span key={p.id} title={p.text} className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, background: SEV_RING[p.severity ?? 'Note'] }}>{i + 1}</span>)}</>
  );
  const thirds = mode === 'composition' && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, transparent calc(33.333% - 1px), rgba(255,255,255,.9) calc(33.333% - 1px), rgba(255,255,255,.9) 33.333%, transparent 33.333%, transparent calc(66.666% - 1px), rgba(255,255,255,.9) calc(66.666% - 1px), rgba(255,255,255,.9) 66.666%, transparent 66.666%), linear-gradient(to bottom, transparent calc(33.333% - 1px), rgba(255,255,255,.9) calc(33.333% - 1px), rgba(255,255,255,.9) 33.333%, transparent 33.333%, transparent calc(66.666% - 1px), rgba(255,255,255,.9) calc(66.666% - 1px), rgba(255,255,255,.9) 66.666%, transparent 66.666%)' }} />;
  const panel = (src: string, label: string, align?: boolean) => (
    <figure className="flex min-w-0 flex-col gap-1">
      <div className="relative cursor-crosshair overflow-hidden rounded-lg border border-line bg-sand select-none" {...handlers}>
        <div className="relative" style={style(align)}><img src={src} alt={label} draggable={false} className="block w-full" />{pins}</div>
        {thirds}
      </div>
      <figcaption className="truncate text-[12px] font-medium">{label}</figcaption>
    </figure>
  );
  if (mode === 'side' || mode === 'composition' || mode === 'detail') return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">{panel(L, c.leftLabel)}{panel(R, c.rightLabel)}</div>
      {mode === 'detail' && <p className="text-[12px] text-muted">Zoomed detail: scroll on either image to magnify both to the same spot (up to 8×); drag to move. Current zoom {view.z.toFixed(1)}×.</p>}
    </div>
  );
  if (mode === 'diff') return <DiffView L={L} R={R} c={c} />;
  return (
    <figure className="flex flex-col gap-1">
      <div className="relative cursor-crosshair overflow-hidden rounded-lg border border-line bg-sand select-none" {...handlers}>
        <div className="relative" style={style()}><img src={L} alt={c.leftLabel} draggable={false} className="block w-full" />{pins}</div>
        <div className="pointer-events-none absolute inset-0" style={mode === 'overlay' || mode === 'align' ? { opacity: mode === 'align' ? 0.5 : opacity } : { clipPath: `inset(0 0 0 ${reveal * 100}%)` }}>
          <div style={style(mode === 'align')}><img src={R} alt={c.rightLabel} draggable={false} className="block w-full" /></div>
        </div>
        {mode === 'reveal' && <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.3)]" style={{ left: `${reveal * 100}%` }}><span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1.5 text-[11px] shadow">⇆</span></div>}
      </div>
      <figcaption className="text-[12px]"><b>{c.leftLabel}</b> {mode === 'reveal' ? 'left of the line' : 'underneath'} · <b>{c.rightLabel}</b> {mode === 'reveal' ? 'right of the line' : mode === 'align' ? 'at 50%, shifted by the alignment' : 'on top'}</figcaption>
    </figure>
  );
}

function DiffView({ L, R, c }: { L: string; R: string; c: ScreenshotComparison }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [thr, setThr] = useState(40);
  const [stat, setStat] = useState<string>('');
  useEffect(() => {
    let live = true;
    Promise.all([loadImage(L), loadImage(R)]).then(([a, b]) => {
      if (!live || !ref.current) return;
      const W = Math.min(1200, a.width), H = Math.round(W * a.height / a.width);
      const cv = ref.current; cv.width = W; cv.height = H;
      const x = cv.getContext('2d', { willReadFrequently: true })!;
      x.drawImage(a, 0, 0, W, H); const da = x.getImageData(0, 0, W, H);
      x.clearRect(0, 0, W, H);
      x.save(); x.translate(W / 2, H / 2); x.translate(c.align.dx * W, c.align.dy * H); x.scale(c.align.scale, c.align.scale); x.drawImage(b, -W / 2, -H / 2, W, H); x.restore();
      const db = x.getImageData(0, 0, W, H);
      const out = x.createImageData(W, H); let changed = 0;
      for (let i = 0; i < da.data.length; i += 4) {
        const d = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
        const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 3;
        if (d > thr * 3) { out.data[i] = 255; out.data[i + 1] = 111; out.data[i + 2] = 97; out.data[i + 3] = 255; changed++; }
        else { out.data[i] = out.data[i + 1] = out.data[i + 2] = g * 0.6 + 100; out.data[i + 3] = 255; }
      }
      x.putImageData(out, 0, 0);
      setStat(`${Math.round(changed / (W * H) * 100)}% of pixels differ by more than ${thr} per channel (after alignment). Images with different sizes are stretched to the first image's frame.`);
    });
    return () => { live = false; };
  }, [L, R, thr, c.align]);
  return (
    <div className="flex flex-col gap-2">
      <canvas ref={ref} role="img" aria-label="Pixel difference" className="w-full rounded-lg border border-line" />
      <div className="flex flex-wrap items-center gap-4"><div className="w-64"><Slider label="Threshold" min={5} max={120} step={1} value={thr} onChange={setThr} format={(v) => String(v)} /></div><p className="text-[12px] text-muted">{stat}</p></div>
    </div>
  );
}
