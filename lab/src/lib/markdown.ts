/* Small Markdown renderer for repository documents and generated briefs. Escapes all HTML first, so a
   document can never inject markup into the lab. Supports headings, lists, tables, code, emphasis, links. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s: string) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<span title="$2">$1</span>');
  return t;
}

export function renderMarkdown(md: string, opts: { lineIds?: boolean } = {}): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  const id = (n: number) => (opts.lineIds ? ` id="L${n + 1}"` : '');
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const start = i; const buf: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; out.push(`<pre${id(start)}><code>${esc(buf.join('\n'))}</code></pre>`); continue;
    }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const n = Math.min(h[1].length, 3); out.push(`<h${n}${id(i)}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^\|/.test(l)) {
      const start = i; const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim())); i++; }
      const body = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      const [head, ...rest] = body;
      out.push(`<table${id(start)}><thead><tr>${(head ?? []).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const start = i; const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(`<li>${inline(item.replace(/^\[( |x)\]\s*/, (m) => (m.includes('x') ? '☑ ' : '☐ ')))}</li>`);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}${id(start)}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`); continue;
    }
    if (/^>\s?/.test(l)) { out.push(`<p${id(i)} class="border-l-2 border-line pl-3 text-muted">${inline(l.replace(/^>\s?/, ''))}</p>`); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const start = i; const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\||\s*([-*]|\d+\.)\s+|>)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p${id(start)}>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
