import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import type { Severity, Stage, Status } from '../types';
import { STATUSES } from '../types';

// ---------- status vocabulary: text + glyph + border style, never colour alone ----------
const STATUS_STYLE: Record<Status, { glyph: string; cls: string; hint: string }> = {
  Verified: { glyph: '✓', cls: 'border-solid border-moss/70 bg-moss/10 text-moss', hint: 'Supported by inspected source material or a reproducible test' },
  Tentative: { glyph: '◐', cls: 'border-dashed border-terracotta/80 bg-terracotta/5 text-terracotta', hint: 'Proposed interpretation awaiting validation' },
  'Needs research': { glyph: '?', cls: 'border-dotted border-violet/70 bg-violet/5 text-violet', hint: 'Missing evidence, reference material, or an unresolved question' },
  'In progress': { glyph: '▸', cls: 'border-solid border-cocoa/60 bg-gold/20 text-cocoa', hint: 'Being designed, implemented or tested' },
  Completed: { glyph: '●', cls: 'border-double border-[3px] border-moss bg-moss text-cream', hint: 'Finished and accepted against specified criteria' },
};
export function StatusBadge({ status, small }: { status: Status; small?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span title={s.hint} className={`inline-flex items-center gap-1 rounded-full border ${s.cls} ${small ? 'px-1.5 py-0 text-[10.5px]' : 'px-2 py-0.5 text-[11.5px]'} font-medium whitespace-nowrap`}>
      <span aria-hidden>{s.glyph}</span>{status}
    </span>
  );
}
export function StatusSelect({ value, onChange, label = 'Status' }: { value: Status; onChange(s: Status): void; label?: string }) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex flex-wrap items-center gap-2">
          <select id={id} className="input w-auto max-w-full" value={value} onChange={(e) => onChange(e.target.value as Status)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <StatusBadge status={value} small />
        </div>
      )}
    </Field>
  );
}

const STAGE_GLYPH: Record<Stage, string> = { Backlog: '○', Selected: '◇', 'In progress': '▸', Review: '◎', Completed: '●' };
export function StageBadge({ stage }: { stage: Stage }) {
  return <span className="inline-flex items-center gap-1 rounded border border-line bg-cream px-1.5 text-[11px] text-muted"><span aria-hidden>{STAGE_GLYPH[stage]}</span>{stage}</span>;
}
const SEV: Record<Severity, string> = { Critical: 'bg-coral text-white', Major: 'bg-terracotta/15 text-terracotta border border-terracotta/40', Minor: 'bg-sand text-cocoa border border-line', Note: 'text-muted border border-line' };
export function SeverityBadge({ severity }: { severity: Severity }) {
  const glyph = { Critical: '‼', Major: '!', Minor: '·', Note: 'i' }[severity];
  return <span className={`inline-flex items-center gap-1 rounded px-1.5 text-[11px] font-semibold ${SEV[severity]}`}><span aria-hidden>{glyph}</span>{severity}</span>;
}

// ---------- form fields ----------
export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</label>
      {children(id)}
      {hint && <p className="text-[11.5px] text-muted">{hint}</p>}
    </div>
  );
}
export function Text({ label, value, onChange, placeholder, hint, className, mono }: { label: string; value: string | null | undefined; onChange(v: string): void; placeholder?: string; hint?: ReactNode; className?: string; mono?: boolean }) {
  return <Field label={label} hint={hint} className={className}>{(id) => <input id={id} className={`input ${mono ? 'font-mono text-[12.5px]' : ''}`} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}</Field>;
}
export function Area({ label, value, onChange, rows = 3, placeholder, hint, className, mono }: { label: string; value: string | null | undefined; onChange(v: string): void; rows?: number; placeholder?: string; hint?: ReactNode; className?: string; mono?: boolean }) {
  return <Field label={label} hint={hint} className={className}>{(id) => <textarea id={id} rows={rows} className={`input resize-y leading-relaxed ${mono ? 'font-mono text-[12.5px]' : ''}`} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}</Field>;
}
export function Num({ label, value, onChange, step = 1, min, max, hint, className }: { label: string; value: number | null; onChange(v: number | null): void; step?: number; min?: number; max?: number; hint?: ReactNode; className?: string }) {
  return <Field label={label} hint={hint} className={className}>{(id) => <input id={id} type="number" className="input tabular-nums" step={step} min={min} max={max} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />}</Field>;
}
export function Select<T extends string>({ label, value, options, onChange, hint, className }: { label: string; value: T; options: readonly (T | { value: T; label: string })[]; onChange(v: T): void; hint?: ReactNode; className?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}
export function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05, format, hint }: { label: string; value: number; onChange(v: number): void; min?: number; max?: number; step?: number; format?(v: number): string; hint?: ReactNode }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="flex items-center gap-2">
          <input id={id} type="range" className="w-full accent-[#C86D51]" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
          <output htmlFor={id} className="w-14 text-right font-mono text-[12px] tabular-nums">{format ? format(value) : value}</output>
        </div>
      )}
    </Field>
  );
}
export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange(v: boolean): void; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 accent-[#C86D51]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id} className="text-[13px] leading-snug">{label}{hint && <span className="block text-[11.5px] text-muted">{hint}</span>}</label>
    </div>
  );
}
/** 0..5 score, with an explicit "not scored" state. */
export function Score({ value, onChange, label }: { value: number | null; onChange(v: number | null): void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 5`} onClick={() => onChange(value === n ? null : n)}
          className={`h-6 w-6 rounded border text-[11px] font-semibold tabular-nums transition ${value === n ? 'border-cocoa bg-cocoa text-cream' : value != null && n < value ? 'border-cocoa/30 bg-sand' : 'border-line bg-cream text-muted hover:border-cocoa/50'}`}>{n}</button>
      ))}
      <span className="ml-1 w-14 text-[11px] text-muted">{value == null ? 'not scored' : ''}</span>
    </div>
  );
}

export function TagInput({ label, value, onChange, placeholder = 'Add and press Enter' }: { label: string; value: string[]; onChange(v: string[]): void; placeholder?: string }) {
  const [t, setT] = useState('');
  return (
    <Field label={label}>
      {(id) => (
        <div className="input flex flex-wrap items-center gap-1 py-1">
          {value.map((v) => <span key={v} className="inline-flex items-center gap-1 rounded bg-sand px-1.5 text-[12px]">{v}<button type="button" aria-label={`Remove ${v}`} className="text-muted hover:text-coral" onClick={() => onChange(value.filter((x) => x !== v))}>×</button></span>)}
          <input id={id} className="min-w-[8rem] flex-1 bg-transparent py-0.5 outline-none" value={t} placeholder={placeholder} onChange={(e) => setT(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && t.trim()) { e.preventDefault(); if (!value.includes(t.trim())) onChange([...value, t.trim()]); setT(''); } else if (e.key === 'Backspace' && !t && value.length) onChange(value.slice(0, -1)); }} />
        </div>
      )}
    </Field>
  );
}

// ---------- layout ----------
export function Button({ children, onClick, kind = 'secondary', small, disabled, title, type = 'button', className = '' }: { children: ReactNode; onClick?(): void; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; small?: boolean; disabled?: boolean; title?: string; type?: 'button' | 'submit'; className?: string }) {
  const k = { primary: 'bg-cocoa text-cream hover:bg-cocoa/90 border-cocoa', secondary: 'bg-cream text-cocoa border-line hover:border-cocoa/50', ghost: 'border-transparent text-cocoa hover:bg-sand', danger: 'bg-cream text-[#B3261E] border-[#B3261E]/40 hover:bg-[#B3261E] hover:text-white' }[kind];
  return <button type={type} title={title} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${small ? 'h-7 px-2 text-[12px]' : 'h-9 px-3 text-[13px]'} ${k} ${className}`}>{children}</button>;
}

export function PageHeader({ eyebrow, title, children, lede }: { eyebrow: string; title: ReactNode; children?: ReactNode; lede?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0 max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">{eyebrow}</p>
        <h1 className="font-display text-[28px] leading-tight text-cocoa md:text-[32px]">{title}</h1>
        {lede && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{lede}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
export function Section({ title, children, actions, className = '', id }: { title: ReactNode; children: ReactNode; actions?: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-lg border border-line bg-cream ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-2.5">
        <h2 className="font-display text-[17px] text-cocoa">{title}</h2>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="font-display text-[16px] text-cocoa">{title}</p>
      {children && <div className="max-w-md text-[13px] text-muted">{children}</div>}
      {action}
    </div>
  );
}
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: readonly (T | { value: T; label: string })[]; value: T; onChange(v: T): void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 rounded-md bg-sand p-0.5">
      {tabs.map((t) => {
        const v = typeof t === 'string' ? t : t.value, l = typeof t === 'string' ? t : t.label;
        return <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={`rounded px-2.5 py-1 text-[12.5px] font-medium ${value === v ? 'bg-cream text-cocoa shadow-sm' : 'text-muted hover:text-cocoa'}`}>{l}</button>;
      })}
    </div>
  );
}
export function Kv({ k, children }: { k: string; children: ReactNode }) {
  return <div className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-line/50 py-1.5 text-[13px] last:border-0"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{children}</dd></div>;
}
export function Unknown({ children = 'Unknown' }: { children?: ReactNode }) { return <span className="italic text-muted">{children}</span>; }

// ---------- modal and confirm ----------
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose(): void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', on, true);
    return () => { window.removeEventListener('keydown', on, true); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-cocoa/40 p-4 pt-[8vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} rounded-xl border border-line bg-cream shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-[18px]">{title}</h2>
          <button aria-label="Close" className="rounded px-2 text-[20px] leading-none text-muted hover:text-cocoa" onClick={onClose}>×</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmReq { title: string; body: ReactNode; confirm: string; danger?: boolean; resolve(ok: boolean): void }
const useConfirmStore = create<{ req: ConfirmReq | null }>(() => ({ req: null }));
export function confirmAction(title: string, body: ReactNode, confirm = 'Confirm', danger = true) {
  return new Promise<boolean>((resolve) => useConfirmStore.setState({ req: { title, body, confirm, danger, resolve } }));
}
export function ConfirmHost() {
  const req = useConfirmStore((s) => s.req);
  const close = (ok: boolean) => { req?.resolve(ok); useConfirmStore.setState({ req: null }); };
  return (
    <Modal open={!!req} onClose={() => close(false)} title={req?.title ?? ''}>
      <div className="text-[14px] leading-relaxed">{req?.body}</div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={() => close(false)}>Cancel</Button>
        <Button kind={req?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{req?.confirm}</Button>
      </div>
    </Modal>
  );
}

// ---------- toasts ----------
const useToasts = create<{ list: { id: number; text: string }[] }>(() => ({ list: [] }));
let tid = 0;
export function toast(text: string) {
  const id = ++tid;
  useToasts.setState((s) => ({ list: [...s.list, { id, text }] }));
  setTimeout(() => useToasts.setState((s) => ({ list: s.list.filter((t) => t.id !== id) })), 3200);
}
export function ToastHost() {
  const list = useToasts((s) => s.list);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map((t) => <div key={t.id} className="rounded-full bg-cocoa px-4 py-2 text-[13px] text-cream shadow-lg">{t.text}</div>)}
    </div>
  );
}
