# Checkpoint 1 review: art direction sample

Date: 2026-11-15. Status: **approved by the project lead on 2026-11-15.** Checkpoint 2 is in `../checkpoint-2/review.md`.

## What was built

A 1600 × 1000 world-unit corner of Forsyth Park (Gaston Street, the north gate, the fountain plaza and the lawns south of it), composed from 32 original SVG asset files by `docs/art-direction/forsyth-sample.html`. The page uses the runtime path the game will use: packed SVG text from `build/js/assets.bundle.js`, colour slots injected as CSS variables, a Blob URL per variant, a raster sprite, and drawing sorted by ground-contact depth. It is a still composition. Nothing animates and nothing is clickable yet.

Capture: Chrome via `playwright-core`, opened from `file://`. Every capture logged **0 requests outside the build folder** and no page errors.

| File | Shows |
|---|---|
| `forsyth-sample-full.png` | The full sample at 1x |
| `detail-wedding-fountain.png` | 2x: fountain, wedding photo, photographers, bubbles |
| `detail-busker-vendor.png` | 2x: saxophone busker and listeners, praline cart, escaping balloon |
| `detail-picnic-pigeons.png` | 2x: pigeon feeder, bubbles, dachshund walker, picnic raid |
| `detail-target.png` | 2x: the target on the plaza ring |
| `before-after.png` | Version 1 detail zoom beside this sample |
| `before-overview-1440.png`, `before-detail-1440.png` | Version 1 captures (seed `SAV-2026`) |

## Observations

**Working**
- The fountain is recognisable without a label: two tiers, robed figure with staff, tritons spouting into a round basin, iron fence.
- The Gaston Street row reads as Savannah: stoops with iron rails, shutters, balconies, fanlights, brick and stucco in different colours, and a cat in a window.
- Live oaks have spreading limbs and hanging moss.
- Characters are drawn, not assembled: faces, hands, shoes, clothing folds, props. Each archetype has its own silhouette (beret and smock, fedora and sax, flat cap and cane, sun hat and camera, bucket hat and umbrella, veil, praline cart, bicycle).
- Fourteen stories are placed: painter at an easel painting the fountain, busker with tip hat and listeners, wedding photo, dog stealing a picnic sandwich, pigeon feeder, bubbles, dachshund towing its walker, jogger, two cyclists, stroller, walking tour, praline cart queue, escaping balloon, reader with headphones.
- At 2x zoom every area shows intentional detail, and the line weight is consistent across people, props and buildings.

**Not good enough yet**
- **Repetition**: the filler crowd uses nine archetypes recoloured. The same tourist, stroller and student appear several times in the full view. Hair, hat and outfit parts are not swappable yet.
- **Trees**: one oak drawing, flipped and scaled. Needs at least three oak shapes plus a palm and magnolias.
- **Density**: the plaza ring is busy, but the lawns at the edges are sparse and there is no foreground layer (hedges, near figures) for depth.
- **Target**: standing in the open on the ring, he is too easy. Real hiding spots, occlusion and decoys come with the engine.
- **Small story issues**: a filler jogger lands in the praline queue, and the balloon kid is mostly behind an oak.
- **Style**: clean cartoon-vector, flat fills with one shade tone. It is illustrated, but not painterly. A richer look (texture, hand-drawn line wobble, softer shading) is possible but costs time per asset.

## Preliminary rubric (self-assessed, not proof)

| Category | Weight | Score | Why |
|---|---:|---:|---|
| Illustration craftsmanship | 25% | 3.5 | Consistent ink line and real drawing; flat vector finish; one oak reused |
| Scene composition and density | 20% | 3.5 | Clusters and stories exist; edges sparse; no foreground layer |
| Character diversity and expression | 15% | 3.0 | 18 archetypes with expressions, but recolour-only repetition is visible |
| Savannah landmark authenticity | 10% | 4.0 | Fountain and townhouses recognisable; park layout simplified |
| Gameplay readability | 10% | 3.5 | Target traits readable at 2x; too easy to spot |
| Interface quality | 10% | n/a | No interface in this sample |
| Visual consistency | 10% | 4.0 | Same line, palette and lighting direction throughout |

Weighted over the scored categories: **3.5 out of 5. This is below the 4.0 bar, so gate A is not passed.** The sample shows the direction, not the finished standard.

## What would raise it before the vertical slice

1. Part libraries (hair, hats, glasses, tops, bottoms) on a shared head and torso rig, so hundreds of combinations look like different people.
2. Six more archetypes to reach 24: sculptor, dancer, gardener, maintenance worker, chess players, costumed performer.
3. Two more oak shapes, a palm, magnolias, hedges and a foreground layer.
4. Optional finish pass: paper texture, slight line wobble, painted shadows.
