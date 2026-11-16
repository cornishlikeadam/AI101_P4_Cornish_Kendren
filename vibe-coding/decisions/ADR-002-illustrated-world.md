# ADR-002: An illustrated Savannah world

**Status:** Accepted for the visual overhaul, subject to repository review
**Date:** 2026-11-15
**Failure behind it:** FAIL-05, visual fidelity. Players and reviewers read the game as a geometry demo, not a search-and-find book (see `build-record/testing-and-failure-log.md` and `build-record/tests/visual-overhaul/before-*.png`).
**Supersedes in ADR-001:** the zero-asset rule, procedural-geometry-only rendering, the fixed 45°/15° orthographic camera, the single-file packaging rule, sine-bob-only animation, the world-wide 80/15/5 palette rule, and the 10,000-citizen/60 FPS acceptance gate.
**Keeps from ADR-001:** offline operation, seeded determinism, the fallback state, local-only data and the gameplay contract.

## 1. Why the procedural approach failed

Every person is four rectangles and a circle, so the crowd is one silhouette in different shirt colours. Landmarks are stacked boxes. People are scattered uniformly over flat sand. The result has none of what makes a search-and-find page worth looking at: distinct characters, recognisable places, and small stories.

## 2. Why more geometry would not fix it

The limit is in the rules. With no assets, a fixed isometric box camera, and a 10,000-citizen budget, the cheapest drawing always wins. More boxes give a busier diorama, not an illustration. Illustration needs authored shapes (curves, folds, faces, ornament), a composed view, and a scene laid out by hand.

## 3. Why illustrated 2D

Search-and-find books use one composed view: the ground seen from above at a steep angle, people and buildings standing upright on it, and depth from overlap. A 2D world camera with depth sorting by ground position reproduces that, keeps hit testing exact, and lets each asset be drawn once in its natural view.

## 4. Requirements that remain binding

States INTRO, PLAYING, WON, FALLBACK. Exactly one target with all five traits (`#E53935`/`#FFFFFF` stripes, striped bobble hat with white pom-pom, round glasses, `#1E88E5` trousers, `#8D6E63` stick). Decoys with at most two. Seeded replay. `?seed`, `?fallback=1`, `?beacon=1`, `?crowd`. The 6 CSS px click threshold. Drag, wheel, arrows and WASD. Leaderboard key, ten records, record shape and sort order. No accounts, analytics, remote storage or third-party requests. The full matrix is in `docs/audit.md` §3.

## 5. Offline deployment

`build/` is the whole deployable folder. `build/index.html` loads classic scripts from `build/js/` and bundled fonts from `build/fonts/` (or uses system fonts). Asset SVG is packed into a script, because on `file://` Chrome refuses `fetch` and marks SVG files' pixels as cross-origin (tested 2026-11-15). The game makes no request outside its own folder; Playwright checks this on every QA run.

## 6. Asset pipeline

- Source art: original SVG files in `vibe-coding/assets/` (characters, environments, props, effects, ui), drawn by hand in this project. Colour slots like `#SKIN#` and named groups like `arm-front` let one drawing produce many variants and animation frames.
- Packing: `vibe-coding/tools/pack-assets.mjs` writes `build/js/assets.bundle.js` and a manifest with each asset's anchor point, size and slots.
- Runtime: variants are composed as SVG text, rasterized once per zoom tier into offscreen canvases, and cached.
- Provenance: `sources/asset-register.md` lists every asset, its author or tool, and its permission. If a bitmap or generated image is ever used, its exact prompt and tool go beside it.
- Alternative kept open: a generated-bitmap pipeline (e.g. an image model plus background removal) can be swapped in per asset; it costs credits and makes style consistency harder, so it needs the project lead's approval.

## 7. Rendering, hit testing, occlusion, animation

- Layers: `00` sky and far canopy, `10` far buildings, `20` ground and paths (cached), `30` structures, `60` sorted world (people, trees, benches, stalls, fountain), `80` foreground foliage, `90` effects and hints. The interface is HTML above the canvas.
- Depth: inside layer 60, sprites sort by ground-contact y, then by id, so order is deterministic.
- Hit testing: the pointer goes through the inverse camera transform into world units, then into each sprite's local pixels. Sprites are tested front to back; the first non-transparent pixel wins. A tree canopy in front of a person therefore takes the click.
- Target validator: before a round starts, sample the target's head, hat, torso and stick pixels and check what draws in front of them. Reject the spawn unless at least 60% of the hat and head samples and 50% overall stay visible.
- Animation: each archetype has 2 to 6 frames made by transforming named groups (an arm raising a brush, legs in a stride). Frame timing is seeded per character. With `prefers-reduced-motion`, everyone holds frame 0 and water stops.

## 8. Performance measurement

Density modes: Low (~180 people), Standard (~360, default), Dense (~600), Stress (`?crowd=`, up to 10,000, labelled as a test). Measure load time, time to first playable frame, average FPS and 5th-percentile frame time over a 20 s scripted pan and zoom, JS heap where the browser exposes it, and pointer-to-feedback latency. Record device, browser, viewport, density and build version in `build-record/performance.md`. Numbers that are not measured are reported as unknown.

## 9. Visual quality verification

Gates A to F and the weighted rubric in `HARNESS.md` decide visual completion, backed by screenshots in `build-record/visual-qa/` with written observations. A passing test suite does not satisfy a visual gate. The project lead approves four checkpoints in order: art direction, first playable scene, gameplay integration, remaining locations.

## 10. Incremental replacement

1. Keep the current build playable and capture before images (done: `build-record/tests/visual-overhaul/`).
2. Approve a representative illustration built from real asset files.
3. Build the new engine beside the old code, then switch `build/index.html` once the Forsyth Park slice carries every preserved feature.
4. Port features in this order: seed and PRNG, target and decoy rules, camera and input, picking, states, leaderboard, share links, fallback, beacon, hints, difficulty.
5. Add the other three scenes only after Forsyth Park passes review.

Scene D note: the original ZONE-D was "Seaside Festival Pier and Oglethorpe Squares". Scene D, "Savannah Festival", combines them: festival booths across a square, with the pier at its river edge. Nothing from ZONE-D is dropped.

## Consequences

The build becomes a folder with a pack step for authors (not for players). Art review becomes an engineering gate. Download size grows; the manifest and caches keep it manageable. Old seeds may draw differently after an art revision, so share links carry `artVersion`.
