/* Round logic for the first playable scene (Agent 3). Checkpoint 2 scope: find the target, count wrong
   guesses, time the round. Leaderboard, hints, share links and fallback are wired at checkpoint 3. */
(function () {
  const WS = (window.WS = window.WS || {});
  function readIdentity(search) {
    const q = new URLSearchParams(search);
    const pick = (v, allowed, d) => (allowed.includes(v) ? v : d);
    const seed = (q.get('seed') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'SAV-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0');
    const crowdN = parseInt(q.get('crowd'), 10);
    return {
      seed, scene: pick(q.get('scene'), ['savannah', 'forsyth'], 'savannah'),
      difficulty: pick(q.get('difficulty'), ['easy', 'normal', 'hard'], 'normal'),
      density: pick(q.get('density'), ['low', 'standard', 'dense'], 'standard'),
      crowd: Number.isFinite(crowdN) ? Math.max(20, Math.min(10000, crowdN)) : null,
      artVersion: window.WS_ASSETS.artVersion,
      beacon: q.get('beacon') === '1',
      fallback: q.get('fallback') === '1',
    };
  }
  // Share link carries the whole replay identity (HANDOFF.md, replay identity).
  function shareUrl(id, base) {
    const q = new URLSearchParams({ seed: id.seed, scene: id.scene, difficulty: id.difficulty, density: id.density });
    if (id.crowd) q.set('crowd', id.crowd);
    return base.split('?')[0].split('#')[0] + '?' + q.toString();
  }
  const newSeed = () => 'SAV-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0');
  // The round's state machine, written out as one table (ADR-004). Each state lists the events it accepts
  // and the state each one leads to. Anything missing from the table is an illegal move and is ignored.
  const ROUND_MOVES = Object.freeze({
    INIT:     { loaded: 'INTRO', fail: 'FALLBACK' },
    INTRO:    { start: 'PLAYING', fail: 'FALLBACK' },
    PLAYING:  { found: 'WON', fail: 'FALLBACK' },
    WON:      { fail: 'FALLBACK' },
    FALLBACK: {},
  });
  function createRound() {
    return { state: 'INIT', wrong: 0, hints: 0, saved: false, startedAt: 0, endedAt: 0, elapsed() { return (this.endedAt || performance.now()) - this.startedAt; } };
  }
  // Move the round on by one event. Returns true if the move was allowed.
  function transition(round, event) {
    const next = (ROUND_MOVES[round.state] || {})[event];
    if (!next) { console.warn('round: ignored', event, 'in', round.state); return false; }
    round.state = next;
    if (next === 'PLAYING') { round.startedAt = performance.now(); round.endedAt = 0; round.wrong = 0; round.hints = 0; round.saved = false; }
    if (next === 'WON') round.endedAt = performance.now();
    return true;
  }
  WS.gameplay = { readIdentity, createRound, shareUrl, newSeed, transition, ROUND_MOVES };
})();
