import { useEffect, useState } from 'react';

/** Hash routes: #/view/id?key=value. Deep links survive reloads and can be shared within the lab. */
export interface Route { view: string; id: string | null; q: URLSearchParams }

function parse(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = h.split('?');
  const [view = 'command', id = null] = path.split('/').map(decodeURIComponent);
  return { view: view || 'command', id: id || null, q: new URLSearchParams(query) };
}

export function useRoute(): Route {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}

export function href(view: string, id?: string | null, q?: Record<string, string>) {
  const qs = q ? '?' + new URLSearchParams(q).toString() : '';
  return '#/' + view + (id ? '/' + encodeURIComponent(id) : '') + qs;
}
export function go(view: string, id?: string | null, q?: Record<string, string>) { location.hash = href(view, id, q); }

export function setQuery(key: string, value: string | null) {
  const r = parse();
  if (value == null) r.q.delete(key); else r.q.set(key, value);
  const qs = r.q.toString();
  history.replaceState(null, '', '#/' + r.view + (r.id ? '/' + encodeURIComponent(r.id) : '') + (qs ? '?' + qs : ''));
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// Where each record kind is edited.
export const KIND_VIEW: Record<string, string> = {
  decision: 'rules', issue: 'issues', sprint: 'sprints', character: 'characters', asset: 'assets', reference: 'references',
  landmark: 'atlas', zone: 'atlas', story: 'atlas', scene: 'composer', iteration: 'composer', clue: 'clues', review: 'quality',
  comparison: 'compare', brief: 'export', measurement: 'quality', source: 'audit',
};
