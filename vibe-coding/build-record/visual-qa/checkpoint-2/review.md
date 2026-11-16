# Checkpoint 2 review: first playable scene (Forsyth Park)

Date: 2026-11-15. Status: **revised after the project lead chose "fix the gaps first"; resubmitted, not approved yet.**

## Revision 2 (after review)

- **Motion.** Walkers bounce in step, joggers run, standers breathe, kites sway, bubbles rise and the fountain basin sparkles. This is procedural motion (offsets and rotation). Update, checkpoint 4 revision 3: the five walking bodies and the target now have a second drawn frame (passing pose) that alternates with the stride; other archetypes still use procedural motion only. `prefers-reduced-motion` freezes everything (tested). Picking follows the moving sprites.
- **Seated pose.** New `bodies/seated` with a cup; 10 café customers at the six tables.
- **Hard mode.** Besides 50–86% visibility, hard now needs at least 6 people within reach and 2 decoys within view; normal needs 2 people nearby. Six hard seeds sampled: 54–69% visible, crowds of 6–9, 4–11 decoys nearby.
- **Bug fixed.** Story people had `undefined` ids (masked until motion hashed them).
- Tests: 14 of 14. Performance with motion: still 60 FPS average at every density (see `performance.md`).
- Self-assessed score after revision: **4.0** (craftsmanship 3.9, composition 4.1, diversity 4.0, landmarks 3.8, readability 4.2, interface 3.5, consistency 4.2). Still open: drawn animation frames, the café pavilion and fort, oak-alley repetition, phone HUD, more target poses. Checkpoint 1 (art direction) was approved on 2026-11-15.

## What was built

- **Page**: `build/illustrated.html`, a separate page next to version 1. `build/index.html` is still the version 1 game until gameplay integration (checkpoint 3) is approved.
- **Engine**: `src/` sources joined into `build/js/game.js` by `tools/build.mjs`. Canvas 2D, opens from `file://`.
- **Art**: 84 original SVG assets. The added ones are:
  - a part library of 5 faces, 10 hair styles, 9 hats, 3 glasses and 2 beards;
  - 7 bodies with a head socket (walk, dress, phone, coffee, tote, cane, child);
  - 6 new story archetypes (sculptor, dancer, gardener, maintenance worker, chess players, juggler), taking the total to 24;
  - 2 more oak shapes, a sabal palmetto, a foreground hedge, 3 market stalls, a café table and a kite;
  - the full 3200 × 2400 ground plan.
- **Scene**: 361 people at standard density, 25 stories, the fountain plaza, Gaston Street townhouses, an oak alley, the café patio and chess table, the farmers market, the playground and the south lawn.
- **Gameplay at this checkpoint**:
  - an intro card listing the five traits, a timer and a wrong-guess count;
  - win on the target, seeded hiding spots, and difficulty and density from the URL;
  - `?beacon=1`.
  - Leaderboard, hints, share links and the fallback state are checkpoint 3.

## Evidence

All captures were opened from `file://` and made **0 requests outside the build folder**.

| File | Shows |
|---|---|
| `overview-1440.png`, `overview-playing-1440.png` | Whole park at 1.0x, intro card and playing |
| `detail-plaza-3.5x.png` | Maximum zoom on the fountain plaza, DPR 2 |
| `detail-market-2.5x.png` | Farmers market with vendors behind the stalls and a peach queue |
| `detail-cafe-chess-2.5x.png` | Café patio, chess game with kibitzers, sculptor |
| `detail-juggler-dancer-2.5x.png` | South lawn: juggler ring, dancer, kite, gardener |
| `detail-playground-kites-2.5x.png` | Playground sand circle, kids, parents, kite |
| `detail-oak-alley-2x.png` | Oak alley over the promenade |
| `detail-south-hedges-2.5x.png` | Leaf raking, picnics, foreground hedges |
| `target-easy.png`, `target-normal.png`, `target-hard.png` | The target on seed `QA-7` at each difficulty |
| `beacon.png` | `?beacon=1` ring around the target |
| `phone-390.png` | 390 × 844 phone viewport at 1.6x |

Tests: `tests/illustrated.test.mjs`, 12 of 12 passing (list in `testing-and-failure-log.md`). Performance: `build-record/performance.md`.

## Observations

**Working**
- People are composed from real drawn parts. Hair, hats, glasses, beards, faces, skin, clothing and shoes vary independently, and 361 people produce 396 distinct sprites. In the 2.5x crops, repeats are hard to spot. Bodies repeat more than heads, and the walking body is the most common.
- Every area holds a story: busker, wedding, painter, pigeon feeder, picnic raid, dachshund walker, tour group, praline queue, balloon, chess game, sculptor, juggler, dancer, gardener, leaf raking, market queue, kites, picnics, playground and the phone walker.
- Zoom from 0.6x to 3.5x stays sharp at DPR 2. Sprite and ground tiers are rasterized lazily and rasterization is budgeted per frame.
- Clicks hit the drawn pixels, not boxes. A tree or hedge in front of the target takes the click, which counts as a wrong guess.
- The validator places the target where at least 60% of the head and hat and at least 50% overall stay visible. Hard mode prefers 50–86% visible; easy needs at least 92%.

**Not good enough yet**
- **Nothing moves.** ADR-002 calls for 2 to 6 animation frames per archetype, plus fountain water and flags. Not started.
- **Hard is sometimes not hard.** Seed `QA-7` on hard puts the target on the café patio behind an umbrella edge: 76% visible but obvious. Difficulty only measures occlusion, not crowd density or decoys nearby.
- **Café tables are empty.** People stand on the patio; nobody sits at the tables, because there is no seated-at-table pose.
- **Oak alley repeats.** Twelve oaks from three drawings, close together. It reads as an alley, but the repetition shows at 1.0x.
- **Landmarks are simplified.** The café pavilion building, fragrant garden and the fort and memorial at the park's centre are not drawn. Whitaker and Drayton Street houses are not drawn either; oaks stand in for them.
- **Target poses.** There is only one target drawing (walking). The blueprint's seated and waving hiding spots need more target poses.
- **Phone HUD.** The card takes about a fifth of a 390 × 844 screen.
- **Finish.** Still flat cartoon vector: no paper texture or painted shading.

## Preliminary rubric (self-assessed, not proof)

| Category | Weight | Score | Why |
|---|---:|---:|---|
| Illustration craftsmanship | 25% | 3.8 | Part library and new archetypes hold the line weight and lighting; three oak shapes; flat finish; no motion |
| Scene composition and density | 20% | 4.0 | 25 stories spread across the park; clear zones; south lawn lighter than the north half |
| Character diversity and expression | 15% | 4.0 | 24 archetypes, 7 bodies, 29 head parts and seeded palettes; five expressions; walking body over-represented |
| Savannah landmark authenticity | 10% | 3.8 | Fountain, townhouses, live oaks with moss, palmettos and Saturday market; pavilion and fort missing |
| Gameplay readability | 10% | 4.0 | Traits readable from 1.6x up; decoys scale with difficulty; hard mode inconsistent |
| Interface quality | 10% | 3.5 | Clear and accessible (labels, 44 px targets, keyboard), but minimal; leaderboard, hints and share links not wired; phone HUD heavy |
| Visual consistency | 10% | 4.2 | One ink colour, line weight and light direction throughout |

Weighted: **3.9 out of 5. Below the 4.0 bar, though no category is under 3.5.** Gate B (playable scene) is functionally met; the visual standard is close but not met.

## What would raise it

1. Animation: walk and idle frames for the bodies, fountain water, flags and awnings, kites. Honour reduced motion.
2. A seated pose for café customers and more target poses (sitting, waving).
3. Difficulty that also weighs crowd density and nearby decoys, not just occlusion.
4. Café pavilion and a centre-of-park landmark; a fourth oak shape; break up the alley spacing.
5. A compact HUD on phones.
