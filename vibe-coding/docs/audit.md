# Phase 0 audit: why the build looks primitive, and what must survive

Date: 2026-11-15. Read in full: `prd.md`, `plan.md`, `decisions/ADR-001.md`, `../HARNESS.md`, `../AGENTS.md` (CLAUDE.md and GEMINI.md are symlinks to it), `../HANDOFF.md`, `build/index.html`, `sources/source-index.md`, `CHECKLIST.md`, `README.md`, `START-HERE.md`, `disclosure.md`, `build-record/ai-use-log.md`, `build-record/testing-and-failure-log.md`, `build-record/tests/README.md`. Before screenshots: `build-record/tests/visual-overhaul/before-*.png`.

## 1. What the current build actually is

`build/index.html` (1,182 lines) draws everything with `fillRect`, `arc` and four-sided polygons:

- **People**: two rectangles for legs, one for the torso, one circle for the head. Roughly 12 draw calls each. One silhouette for all 421 people; only shirt colour, trouser colour and three booleans vary.
- **Landmarks**: Poetter Hall is two extruded boxes and a yellow rectangle flag. Forsyth Fountain is three stacked boxes and a dot. Factors Walk is two boxes joined by a third.
- **Props**: 48 candidates, filtered by distance. An oak is a 5×16 rectangle under a circle. A tent is a box.
- **Ground**: one flat sand fill and one blue strip.
- **Composition**: landmarks shuffled into four quadrants; people scattered uniformly at random. No paths, no clusters, no activities.

## 2. Restrictions that block visual quality

| Source | Restriction | Effect |
|---|---|---|
| ADR-001, HARNESS §1, plan.md boundary | No image files, no models, everything inside one HTML file | Rules out an asset pipeline, so every visual has to be typed as primitive geometry |
| ADR-001, HARNESS §5, PRD FR-04 | Fixed 45° elevation, 15° azimuth orthographic camera | Makes the scene a diorama of boxes; illustrated picture-book scenes use a composed 2D view |
| PRD (historical) | No animation beyond bobbing | Rules out painting, waving, eating, performing |
| HARNESS §3 | 80/15/5 colour rule applied to the whole product | Starves the world of colour; it belongs to the interface |
| HARNESS gate 1, CHECKLIST | 60 FPS with 10,000 citizens as a hard gate | Pushes every person toward the cheapest possible drawing |
| HANDOFF | Radius-only hit test around a screen point | Cannot respect occlusion, pose or silhouette |

Adding polygons to this renderer would not fix it: the limits are in the rules, not the polygon count.

## 3. Requirements that stay binding

| Requirement | Source | Status in the rebuild |
|---|---|---|
| States INTRO, PLAYING, WON, FALLBACK | HANDOFF | Keep |
| Exactly one target with five traits, colours `#E53935`, `#FFFFFF`, `#1E88E5`, `#8D6E63` | PRD FR-03, HARNESS §4 | Keep |
| Decoys share at most two traits | PRD FR-03 | Keep, enforce in code |
| Seeded replay (Mulberry32 from a string seed) | PRD FR-02 | Keep; replay identity adds scene, difficulty, density and art version |
| `?seed=`, `?fallback=1`, `?beacon=1`, `?crowd=` | HARNESS §6 | Keep; `crowd` becomes a stress-test override with documented limits |
| Pointer travel under 6 CSS px is a click | HARNESS §5, FAIL-01 | Keep; add multi-touch and cancel handling |
| Drag pan, wheel zoom 0.6x to 3.5x (relative to fit), arrows and WASD | HARNESS §5 | Keep; add pinch, reset and on-screen buttons |
| Leaderboard key `waldos_savannah_leaderboard_v1`, ten records, sort by time then guesses, record `{username, elapsedMs, wrongGuesses, seed}` | HARNESS §7 | Keep; optional extra fields only |
| No accounts, analytics, remote storage, CDN | HARNESS §1, privacy gate | Keep, and actually meet it (see §4) |
| Opens from `build/index.html` with no build step for the player | CHECKLIST, README | Keep; verify `file://` and `http://` |
| Friendly fallback with recovery | FAIL-04 | Keep |
| Tabular timer digits, sentence case, ARIA labels | FAIL-03, accessibility | Keep |

## 4. Findings the old record gets wrong

- **External requests**: `index.html` line 396 loads Google Fonts. The before-capture logged four requests to `fonts.googleapis.com` and `fonts.gstatic.com`. The CHECKLIST marks "zero external requests" as verified. It was not true.
- **Performance**: no measurement exists for "60 FPS with 10,000 citizens". The CHECKLIST marks it verified.
- **Timer format**: the spec says `00:00.0`; the build renders `12.3s`.
- **Leaderboard rendering**: usernames are written with `innerHTML`, so a nickname containing markup is injected into the page.
- **Hint chip**: shows the literal text `&middot;` because it is set with `textContent`.

## 5. Conflict list (resolved by ADR-002)

1. Asset ban vs. illustration: lifted. Original local assets allowed.
2. Fixed 3D camera vs. composed picture-book view: replaced by a 2D world camera.
3. Single HTML file vs. asset pipeline: the build becomes a folder; `index.html` still opens directly.
4. 80/15/5 colour rule vs. a rich world: rule kept for the interface only.
5. 10,000 at 60 FPS vs. illustrated characters: becomes a measured stress mode, not the default.
6. Sine-bob-only animation vs. activities: replaced by per-activity animation with reduced-motion support.
7. Seaside Festival Pier and Oglethorpe Squares (ZONE-D) vs. the brief's "Savannah Festival" scene: Scene D combines them (festival booths across an Oglethorpe-era square and the pier). Recorded in ADR-002.

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hand-authored SVG art falls short of a professional illustrator | High | High | Gate 1 approval on a representative illustration before engine work; bitmap generation offered as an alternative |
| `file://` blocks asset fetches and pixel reads | Confirmed | High | Pack SVG sources into a local script; rasterize from Blob URLs (tested 2026-11-15, see engine review) |
| Hundreds of detailed sprites drop frame rate | Medium | Medium | Pre-rasterized sprite caches per zoom tier, viewport culling, LOD; measure before claiming |
| Target fully hidden by foliage or crowd | Medium | High | Visibility validator rejects spawns below a visible-area threshold |
| Asset revisions change what an old seed shows | Certain | Low | Version the art (`artVersion`) and keep it in share links |
| Scope: four scenes at benchmark quality | High | Medium | Forsyth Park first; others only after it passes review |
| Copyright: imitating book pages or a named illustrator | Low | High | Original drawings only; no tracing, no extracted sprites |
