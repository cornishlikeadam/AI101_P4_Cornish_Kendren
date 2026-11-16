# Waldo's Savannah: Art Direction & Build Lab

A companion workspace for redesigning the game one approved change at a time. It reads the repository; it never writes to `vibe-coding/`.

```bash
cd lab
npm install
npm run dev        # reads the repo (scripts/ingest.mjs), then serves http://localhost:5173
npm run build      # same ingest, typecheck, static build in dist/ (opens from any static host)
npm test           # unit tests (vitest)
node scripts/journeys.mjs http://localhost:5173/ /tmp/journeys   # the brief's five journeys, A–E
node scripts/smoke.mjs    http://localhost:5173/ /tmp/smoke      # every view, errors and failed requests
```

The journey and smoke scripts need `playwright-core` (a dev dependency) and an installed Google Chrome.

## What is real and what is simulated

| Area | Source |
|---|---|
| Project Audit facts | `scripts/ingest.mjs` checks source lines and records file:line for each fact, failing or not |
| Character previews, decoys, crowd context | The game's own `assets.bundle.js`, `compose.js`, `make.js` loaded as classic scripts |
| Scene Composer base layout | The game's own `WS.scenes.savannah.build(identity)` for the chosen seed, difficulty and density |
| Scene Composer adjustments (crowd ×, variety, clustering…) | **Lab simulation**, labelled on screen and in exports. The game has no such parameters |
| Target hidden share in the Composer | Alpha-sampled like the engine's validator. Motion and head weighting are not modelled |
| Live game, validator, hit test, benchmark | The lab's copy of `vibe-coding/build/`, run in a same-origin iframe; values read from `window.WS.game` |
| Performance from `performance.md` | Shown as **documented claims**, never as lab measurements |
| Playtests | Only typed in or imported from the game's local leaderboard in the same browser |

Nothing is seeded as approved, scored, measured or play-tested. Those fields fill as the owner uses the lab.

## Data

Everything is saved in the browser's IndexedDB: workspace records, uploaded images as separate blobs, and milestones. Use Export Center → Workspace backup to move it. Undo and redo cover every workspace edit (⌘Z / ⇧⌘Z outside text fields).

## Layout

- `scripts/ingest.mjs`: repository reader (docs, assets, screenshots, tests, perf tables, facts) plus runtime copies into `public/repo/` (git-ignored)
- `src/types.ts`: the shared data model (Project, Source, Reference, DesignDecision, Character, Asset, Landmark, Scene, SceneIteration, ClueConfiguration, QualityReview, Issue, Sprint, ScreenshotComparison, ImplementationBrief, Measurement)
- `src/seed/seed.ts`: first-run workspace, with every seeded claim citing its file
- `src/lib/`: store helpers, readiness gates, exporters, brief generator, composition model, automated checks, game iframe driver
- `src/views/`: the 15 sections

## Notes for maintainers

- ADR exports are numbered after the highest ADR in the repo (ADR-002 exists, so new ones start at ADR-003). Earlier ADRs are never rewritten.
- The lab is outside the three agents' ownership areas in `AGENTS.md`. Changes to the game itself still go through the agents and HANDOFF.md.
- `public/repo/` is regenerated on every dev/build run; re-run `npm run ingest` after changing the game.
