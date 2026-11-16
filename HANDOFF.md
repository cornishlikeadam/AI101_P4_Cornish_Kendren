# Interface contracts: Waldo's Savannah (illustrated edition)

How the three agents' work fits together. Roles are in [AGENTS.md](AGENTS.md). The version 1 contracts (`project3D`, `drawIsoBox`, fixed camera angles, radius picking) are archived in `vibe-coding/docs/history/HANDOFF-v1.md` and are not active.

## State machine

`INIT → INTRO → PLAYING → WON`, with `FALLBACK` reachable from INIT, INTRO and PLAYING.

| From | To | Trigger | Owner |
|---|---|---|---|
| INIT | INTRO | Assets packed and scene built | 1 |
| INIT, INTRO | FALLBACK | Asset or scene failure, `?fallback=1`, or the test button | 1 raises, 3 shows |
| INTRO | PLAYING | Start round | 3 |
| PLAYING | WON | Pick returns the target | 1 picks, 3 transitions |
| PLAYING | PLAYING | Pick returns anything else: wrong guess +1 | 3 |
| WON | INTRO | New round (new seed) | 3 |
| FALLBACK | INTRO | Try a new scene (new seed, rebuild) | 3 |

A new round resets timer, wrong guesses, hints used and save-once state.

## Replay identity (Agent 2 builds, Agent 3 serialises)

```js
{ seed: 'SAV-2026', scene: 'forsyth', difficulty: 'normal', density: 'standard', crowd: null, artVersion: 1 }
```

Share links carry all of these. The PRNG is Mulberry32 seeded from an FNV-1a hash of `seed|scene|difficulty|density|crowd|artVersion`. Frame time never changes placement.

## Asset manifest (Agent 2 produces, Agent 1 consumes)

```js
window.WS_ASSETS = {
  artVersion: 1,
  svg: { 'characters/bodies/walk': '<svg …>', … },
  meta: { 'characters/bodies/walk': { viewBox: [0, -8, 64, 112], anchor: [32, 100], layer: 'world', slots: ['skin', 'hair', …],
          traits: [], head: [0, 0, 1], head2: null, kit: null, kit2: null, part: null, hats: null, hand: null, collar: null, seat: null, author: '…' }, … }
}
```

Written by `tools/pack-assets.mjs` from the `data-*` attributes on each root `<svg>`.

- `anchor` is the ground-contact point in SVG units.
- Colour slots are CSS custom properties with defaults, such as `fill:var(--top,#4F6CC4)`. The composer sets them in a `style` attribute on the root SVG.
- `head` places the head kit at a `<!--HEAD-->` marker; `head2` places it at `<!--HEAD2-->`.
- Parts (`characters/parts/{faces,hair,hats,glasses,beards}`) share one head frame. Hair splits into `<!--back-->` and `<!--front-->`.
- Animation frames (named groups with transforms) are not implemented yet.

## Scene definition (Agent 2 produces, Agent 1 and 3 consume)

```js
{
  id: 'forsyth', world: { w: 3200, h: 2200 },
  layers: [{ id: 'ground', z: 20, asset: 'environments/forsyth/ground' }, …],
  landmarks: [{ id: 'fountain', x, y, asset, hit: 'alpha' }],
  props: [{ asset, x, y, flip }],
  paths: [{ id, points: [[x, y], …], width }],
  clusters: [{ id: 'busker-crowd', story: 'busker', x, y, r, roles: […] }],
  spawnZones: [{ id, polygon, allow: ['walk', 'sit', …] }],
  hidingSpots: [{ id, x, y, poses: ['stand', 'sit'], difficulty: ['easy', 'normal'] }],
  budgets: { low: 180, standard: 360, dense: 600 }
}
```

## World entities (Agent 1 owns the runtime list)

```js
{ id: 'npc_001', archetype: 'painter', variant: {...slots}, pose: 'paint', frame: 0, facing: 1,
  x, y, scale, layer: 60, group: 'artists_01', isTarget: false, traits: { stripes, bobble, glasses, blue, stick } }
```

## Functions

| Provider | Function | Contract |
|---|---|---|
| 1 | `engine.pick(clientX, clientY) → entity \| null` | Front-to-back alpha test in world space, with a 4 CSS px near-miss allowance |
| 1 | `engine.validateTarget(entity) → { ok, visibleShare, headShare, samples }` | Rejects spawns below the thresholds in ADR-002 §7 |
| 1 | `engine.placeTarget() → { ok, spot, visibleShare, headShare, tries }` | Walks `world.candidates` in seeded order until one passes; easy wants ≥ 92% visible, normal ≥ 70%, hard 50–86% |
| 1 | `engine.camera.{panBy, zoomAt, centerOn, reset, fit, toWorld, toScreen}` | World coordinates are never changed by the camera. Zoom 1.0x = 0.4 CSS px per world unit; range 0.6x to 3.5x |
| 1 | `engine.onFrame(fn)` | Called once per frame with `{ t, dt }`; return true to request a redraw |
| 1 | `engine.tryTarget(x, y, flip)` | Test hook: moves the target and returns the validator result |
| 2 | `WS.scenes.{savannah,forsyth}.build(identity) → world` | Deterministic for a given identity. Built by `WS.buildScene` from districts (`WS.districts.*`, each `{ id, name, y0, h, geography, stories, zones, blocked, spots, area }`). `world = { w, h, ground, districts, area(x, y), entities, target, candidates, identity, people, stories }` |
| 2 | `WS.characters.make(rng, asset, { decoys }) → { colours, kit, kit2, traits }` | Applies the decoy cap; throws rather than yield more than two traits |
| 2 | `WS.characters.compose(asset, colours, kit, kit2) → svg string` | Assembles head parts at the head markers and sets colour slots |
| 3 | `ui.show(state)`, `ui.toast(text)`, `ui.hud(update)` | DOM only, never draws on the canvas |
| 3 | `leaderboard.{load, save, clear}` | Key `waldos_savannah_leaderboard_v1`, records `{ username, elapsedMs, wrongGuesses, seed }` plus optional `scene`, `difficulty`, `hints`, `artVersion`; plus `points`; max 10; sort by `points` (high first), then `elapsedMs`, then `wrongGuesses`; tolerate missing optional fields and score old records from their own fields |
| 3 | `leaderboard.points(record)` | `round(max(100, 10000 − 10·seconds − 300·wrong − 1500·hints) × {easy 1, normal 1.5, hard 2.5})` |

## Input

Agent 1 owns pointer, wheel and keyboard handling on the canvas. A tap or click counts only if the pointer travelled under 6 CSS px, only one pointer was down, and it was not cancelled. Pinch and drags never count. Keyboard: arrows and WASD pan, `+` and `-` zoom, `0` resets.

## Build

Sources in `vibe-coding/src/` are classic scripts that attach to `window.WS`. `node vibe-coding/tools/build.mjs` packs the assets and joins the sources, in a fixed order, into `build/js/game.js`. There is no bundler and there are no ES modules, so the page runs from `file://`. Since checkpoint 3 the illustrated game is `build/index.html`. Version 1 is archived, unchanged, at `vibe-coding/docs/history/index-v1.html`.

## URL parameters

| Param | Meaning |
|---|---|
| `seed` | Replay seed; random `SAV-XXXX` if absent |
| `scene` | `savannah` (default: River Street, City Market, two squares and Forsyth Park in one 3200 × 6700 world) or `forsyth` (Forsyth alone, used by older tests) |
| `difficulty` | `easy`, `normal` (default), `hard` |
| `density` | `low`, `standard` (default), `dense` |
| `crowd` | Stress override, 20 to 10,000; marks the round as a stress test |
| `fallback=1` | Force the fallback state |
| `beacon=1` | Debug ring around the target; never shown otherwise |
