# Agent roles: Waldo's Savannah (illustrated edition)

Three agents with non-overlapping ownership. Rules and gates are in [HARNESS.md](HARNESS.md); interfaces in [HANDOFF.md](HANDOFF.md); decisions in [ADR-002](vibe-coding/decisions/ADR-002-illustrated-world.md). The version 1 roles (3D math architect, storybook UI engineer, QA auditor) are archived in `vibe-coding/docs/history/AGENTS-v1.md` and are not active.

## Agent 1: illustrated world and rendering architect

Owns `vibe-coding/src/engine/`, `vibe-coding/tools/pack-assets.mjs`, and the engine parts of `build/`.

- Renderer (Canvas 2D with pre-rasterized sprites, behind a swappable interface), layers and depth sorting.
- Camera: world coordinates, pan, wheel and pinch zoom toward the pointer, bounds, keyboard.
- Asset loading, rasterization caches per zoom tier, culling, LOD.
- Hit testing (alpha masks, front to back) and the target visibility validator.
- Performance measurement and `build-record/performance.md`.

## Agent 2: art director, character and scene systems

Owns `vibe-coding/assets/`, `vibe-coding/src/scenes/`, `vibe-coding/src/characters/`, `sources/art-direction.md`, `sources/asset-register.md` and scene blueprints in `docs/`.

- Illustration standards, line weights, palette, lighting direction.
- Character archetypes, part libraries, colour slots, poses and animation frames.
- Scene composition: geography, clusters, paths, micro-stories, hiding places.
- Asset quality review and provenance for every file.
- Visual benchmark approval before handing a scene to Agent 3.

## Agent 3: UX, gameplay and QA engineer

Owns `vibe-coding/src/gameplay/`, `vibe-coding/src/ui/`, `build/index.html` markup and styles, `vibe-coding/tests/`, and `build-record/` apart from `performance.md`.

- Interface, states, timer, wrong guesses, hints, difficulty, leaderboard, share links, URL parameters, fallback, beacon.
- Accessibility: keyboard, focus, labels, reduced motion, contrast, touch targets, an assisted-search option.
- Playwright flows, screenshot evidence in `build-record/visual-qa/`, regression tests, acceptance report.

## Rules for all three

- Read HARNESS.md, HANDOFF.md and ADR-002 before starting.
- Change another agent's files only through a HANDOFF contract change, recorded in HANDOFF.md.
- No agent marks visual quality complete because its own code passes. The project lead approves each checkpoint.
- Log the session in `vibe-coding/build-record/ai-use-log.md`.
- Different providers and models are fine. Use separate checkouts when agents work in parallel.
