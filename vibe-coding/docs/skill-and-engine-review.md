# Skill and engine review

Date: 2026-11-15. Each entry says what was read, whether anything was installed or run, and the decision.

## Frontend design skill (anthropics/skills)

- **Read**: `skills/frontend-design/SKILL.md` on GitHub. It is a guidance document. I did not confirm whether the folder contains scripts, so nothing from it was run.
- **Installed**: No. Its principles are applied by hand.
- **What it asks for**: ground the design in the subject; open with "the most characteristic thing in the subject's world"; one or two clearly distinct typefaces; write a short token plan (4 to 6 named colours, type, layout) and review it against the brief before coding; spend boldness in one place; motion that answers user action; visible focus, reduced motion, accessible contrast; screenshot self-critique; plain verbs and sentence case.
- **What it warns against**: identical rounded "SaaS-card" panels, gradient washes, all-caps labels, middle-dot meta strings, arrows on links, fade-and-slide on everything, and a generic cream-and-terracotta palette.
- **How it applies here**: the most characteristic thing in this subject's world is the illustrated scene itself, so the canvas becomes the hero and the chrome shrinks to compact controls. The old interface already uses cream and terracotta-adjacent tones; we keep the project's named colours for continuity but use them only on the frame, and drop the middle-dot strings and generic card stack. It does not cover illustration or canvas rendering.

## PixiJS

- **Read**: README (github.com/pixijs/pixijs) and the v8 performance-tips guide. MIT licence. WebGL and WebGPU renderers; no Canvas 2D fallback mentioned.
- **Installed**: No.
- **Strengths**: sprite batching (up to 16 textures per batch), spritesheets, opt-in culling (`cullable`), `hitArea` rectangles, good at very large sprite counts.
- **Weaknesses for this project**:
  - It is a GPU-texture renderer. A test on 2026-11-15 in Chrome showed that on `file://` an SVG file loads but its pixels count as cross-origin (`getImageData` throws `SecurityError`), and `fetch` of a local file is refused. Opening `index.html` directly is a project requirement, so textures would have to come from Blob or data URLs either way. The same test could not settle WebGL upload because headless Chrome had no GL context.
  - The guide warns that hundreds of complex `Graphics` objects are slow and recommends sprites, so vector art has to be rasterized first anyway.
  - It adds a dependency of several hundred kilobytes to vendor and keep current.
- **Decision**: not adopted for the vertical slice. The renderer sits behind a small interface (`drawSprite`, `drawLayer`, `hitTest`) so PixiJS can replace Canvas 2D later if the measured stress mode needs it.

## Konva

- **Read**: README (github.com/konvajs/konva). MIT, current major 10, a Canvas 2D scene graph where every shape carries its own events, transforms and cache.
- **Installed**: No.
- **Decision**: not adopted. A per-shape scene graph with its own event system is the wrong tool for several hundred animated sprites with custom depth sorting and silhouette picking. It also runs on Canvas 2D, so it adds no rendering speed.

## Playwright

- **Read**: README (github.com/microsoft/playwright). Apache-2.0.
- **Installed**: `playwright-core@1.49.1` in this session's scratch folder, not in the project. It drives the installed Google Chrome through `executablePath`. Used for the before screenshots and the `file://` loading test. It has not yet been added as a project dev dependency.
- **Decision**: adopt for QA. Next step is a `vibe-coding/tests/` package with `playwright-core` as a dev dependency and scripted flows (start, pan, zoom, wrong guess, win, save, replay, fallback, mobile) plus screenshot capture into `build-record/visual-qa/`.

## Chosen architecture

Canvas 2D with pre-rasterized sprites.

1. **Source art** is original SVG in `vibe-coding/assets/`, written by hand with named colour slots (for example `#SKIN#`, `#TOP#`) and named groups for animation.
2. **A pack step** (`node vibe-coding/tools/pack-assets.mjs`) reads every SVG and writes `build/js/assets.bundle.js`, one classic script holding the SVG strings and a manifest. Classic scripts load on `file://`, so the player still opens `build/index.html` directly.
3. **At load**, the game turns each needed character variant into SVG text, makes a Blob URL, and draws it once into an offscreen canvas at the zoom tier in use (1x, 2x, 4x of base resolution). Those canvases are the sprites. Canvas 2D can read their pixels, so the alpha channel doubles as the hit mask.
4. **Each frame** draws cached background layers, then sorted sprites with viewport culling, then foreground layers. Picking walks the same order front to back and tests sprite alpha.

Reasons: it works under `file://` and over HTTP with no dependency, keeps vector art sharp at each zoom tier, gives pixel-accurate picking with occlusion, and keeps per-frame work to `drawImage` calls. The cost is upfront rasterization time, which will be measured and reported.
