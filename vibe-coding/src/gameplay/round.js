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
      seed, scene: pick(q.get('scene'), ['forsyth'], 'forsyth'),
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
  function createRound() {
    return { state: 'INIT', wrong: 0, hints: 0, saved: false, startedAt: 0, endedAt: 0, elapsed() { return (this.endedAt || performance.now()) - this.startedAt; } };
  }
  WS.gameplay = { readIdentity, createRound, shareUrl, newSeed };
})();
