# Engineering harness: Waldo's Savannah (illustrated edition)

Operating contract for every agent and human working on the build. Decisions: [ADR-002](vibe-coding/decisions/ADR-002-illustrated-world.md). Look: [art direction](vibe-coding/sources/art-direction.md). Contracts: [HANDOFF.md](HANDOFF.md). Roles: [AGENTS.md](AGENTS.md). Version 1 of this file is archived in `vibe-coding/docs/history/HARNESS-v1.md` and is not active.

## Project map

| Path | Holds |
|---|---|
| `vibe-coding/assets/` | Original SVG source art: `characters/`, `environments/`, `props/`, `effects/`, `ui/` |
| `vibe-coding/src/` | Engine, scenes, characters, gameplay, ui, utilities (authoring sources) |
| `vibe-coding/tools/` | `build.mjs` (packs assets, joins `src/` into `build/js/game.js`), `pack-assets.mjs`, author-time helpers in `author/` |
| `vibe-coding/build/` | The deployable folder. `index.html` (the illustrated game) plus `js/game.js` and `js/assets.bundle.js`; must open from disk and over HTTP |
| `vibe-coding/tests/` | Playwright flows: `illustrated.test.mjs`, `perf.mjs` (need `playwright-core`; see the file headers) |
| `vibe-coding/build-record/` | Logs, `visual-qa/` screenshots, `performance.md` |
| `vibe-coding/docs/` | Audit, engine review, scene blueprints, archived v1 docs |

## Hard rules

1. No runtime request outside the build folder. No CDN, font service, analytics, accounts or remote storage. Fonts are bundled or system fonts.
2. All art is original. No tracing or extracting from books, no imitation of a named illustrator. Every asset is listed in `vibe-coding/sources/asset-register.md`.
3. Forsyth Park first. No other scene is built until Forsyth Park passes the visual gates and the project lead approves it.
4. Exactly one target with five traits; decoys at most two. Enforced in code and tested.
5. Same seed, scene, difficulty, density and `artVersion` give the same initial world.
6. The reflection is human-written. Agents do not edit `vibe-coding/reflection.md`.
7. A claim needs evidence: a test result, a screenshot with observations, or a measurement. Unmeasured numbers are reported as unknown.

## Approval checkpoints (project lead)

1. **Art direction**: a representative illustration of Forsyth Fountain, detailed people, foliage and small activities, built from real asset files.
2. **First playable scene**: illustrated characters rendered as assets, with working zoom and target selection.
3. **Gameplay integration**: timer, leaderboard, seed, fallback and controls all working.
4. **Remaining locations**: only after checkpoint 2 meets the agreed standard.

## Visual quality gates

A passing test suite never satisfies a visual gate.

- **A. Illustration**: characters drawn, not assembled from boxes and circles; buildings with recognisable detail; organic foliage; coherent props; consistent linework; deliberate stories. Fails if it resembles a low-poly or basic canvas demo.
- **B. Composition**: foreground, middle ground and background; intentional clusters; visual paths; focal points; interesting with labels hidden. Fails if the crowd looks randomly scattered.
- **C. Character diversity**: varied silhouettes, clothing, recognisable activities, group interactions, no obvious repetition.
- **D. Search-and-find**: target visible, selectable, fair; meaningful difficulty; no highlight in normal play; hints reveal only on request.
- **E. Engineering**: preserved features work; seeded replay; offline; leaderboard; fallback; keyboard; mobile; no unhandled errors in tested flows.
- **F. Screenshot evidence** in `vibe-coding/build-record/visual-qa/`: initial desktop, full scene, zoomed crowd, target hidden in a normal round, victory, mobile, fallback, before and after.

## Rubric (0 to 5 each)

| Category | Weight |
|---|---:|
| Illustration craftsmanship | 25% |
| Scene composition and density | 20% |
| Character diversity and expression | 15% |
| Savannah landmark authenticity | 10% |
| Gameplay readability | 10% |
| Interface quality | 10% |
| Visual consistency | 10% |

Pass: weighted score at least 4.0, no category below 3.5, all functional tests passing. Every score cites a screenshot and concrete observations. A self-assigned score alone is not proof; the project lead's review decides.

## Performance

Density modes Low, Standard (default), Dense and Stress (`?crowd=`, test only). Measure load, time to first playable frame, average FPS, 5th-percentile frame time, heap where available and input latency on named devices. Report in `vibe-coding/build-record/performance.md`.

## Failure modes on record

FAIL-01 drag counted as a guess (6 px rule). FAIL-02 target overlapped by landmarks (now: visibility validator). FAIL-03 timer jitter (tabular digits). FAIL-04 setup failure (fallback state). FAIL-05 visual fidelity (ADR-002). FAIL-06 Google Fonts requests in v1 despite the privacy claim.

## Working loop

Plan the slice, build it, capture screenshots at fixed seeds and viewports, write observations, fix, capture again. Log each session in `vibe-coding/build-record/ai-use-log.md`. Do not repeat an approach that already failed; note it in the failure log instead.
