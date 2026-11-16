/* Local leaderboard (Agent 3). Key and record shape are fixed by HANDOFF.md; storage failures never break play. */
(function () {
  const WS = (window.WS = window.WS || {});
  const KEY = 'waldos_savannah_leaderboard_v1', MAX = 10;
  const valid = (r) => r && typeof r.username === 'string' && Number.isFinite(r.elapsedMs) && Number.isFinite(r.wrongGuesses) && typeof r.seed === 'string';
  const sort = (a) => a.sort((x, y) => x.elapsedMs - y.elapsedMs || x.wrongGuesses - y.wrongGuesses);
  function load() {
    try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? sort(a.filter(valid)).slice(0, MAX) : []; }
    catch (e) { return []; }
  }
  function save(rec) {
    const r = Object.assign({}, rec, { username: String(rec.username).trim().slice(0, 18) });
    if (!r.username || !valid(r)) return { ok: false, list: load() };
    const list = sort(load().concat([r])).slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(list)); return { ok: true, list, rank: list.indexOf(list.find((x) => x === r || (x.username === r.username && x.elapsedMs === r.elapsedMs && x.seed === r.seed))) + 1 }; }
    catch (e) { return { ok: false, list }; }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } }
  WS.leaderboard = { load, save, clear, KEY, MAX };
})();
