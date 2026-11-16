export const uid = (prefix = 'id') => prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
export const now = () => new Date().toISOString();
export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const fmtTime = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

export function download(name: string, content: string | Blob, type = 'text/markdown') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export function mdEscape(s: string | null | undefined) { return (s ?? '').replace(/\|/g, '\\|'); }

export function lines(s: string | null | undefined) { return (s ?? '').split('\n').map((x) => x.trim()).filter(Boolean); }
