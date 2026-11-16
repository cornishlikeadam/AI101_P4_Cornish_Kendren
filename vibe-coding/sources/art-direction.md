# Art direction: Waldo's Savannah, illustrated edition

Working reference for every scene, sprite and prop. [ADR-002](../decisions/ADR-002-illustrated-world.md) sets the rules; this file says how the pictures should look.

## The look in one paragraph

A busy search-and-find picture book page set in Savannah. The camera looks down at roughly 50 degrees from the south, so the ground reads as a map and every person, tree and building stands upright on it. Everything carries a warm dark-brown ink line. Fills are flat and saturated, with one shade tone per shape at most. Crowds are full of small stories you only notice when you zoom in.

## Line

- Ink colour `#2B1D16`. Never pure black.
- People: 1.1 world-unit outline. Buildings and trees: 1.4 to 2.0. Ground detail (paving joints, grass tufts): 0.6 and lighter.
- Below roughly 18 on-screen pixels per person, drop face detail and double strokes so a crowd reads as colour, not noise.

## Palette

Rich and varied, with natural contrast. Savannah specifics:

| Use | Colours |
|---|---|
| Lawn | `#8DBA5A` base, `#79A84A` shade, `#A6CC6E` light |
| Paths, shell paving | `#E8D6B0`, joint `#CDB68A` |
| Plaza brick | `#C9805E`, `#B56E4E` |
| Live oak canopy | `#3F6B3A`, `#558A45`, highlight `#79A856` |
| Spanish moss | `#B9C2A3`, `#9AA58A` |
| Fountain cast iron | `#F4F1E8`, shade `#D7D3C7` |
| Fountain water | `#7FC4D8`, `#A9DCEA`, foam `#FFFFFF` |
| Azaleas | `#E2557E`, `#F07FA2`, `#C93F6B` |
| Town houses | brick `#B4573E`, stucco `#E7C07A`, `#9EC3B5`, `#E8A28C`, shutters `#2F5D50` |

Red-and-white horizontal stripes belong to the target. Awnings and umbrellas may use red-and-white stripes too, but only vertical or radial ones, which makes them honest camouflage rather than a second target.

## People

- Proportions: big round head (radius about 5 for an adult 36 units tall), short body, readable hands and shoes.
- Built from parts: legs and arms are double-stroked (ink then colour) so poses come from joint angles. Torsos are filled shapes with patterns clipped inside.
- Variety comes from silhouette first (height, build, hair shape, hats, held objects), then colour. Two people should never differ only in shirt colour.
- Each archetype is its own drawing in `assets/characters/archetypes/` with its outfit, props and activity. See the inventory below.

## The target

Red-and-white horizontal stripes on shirt and sleeves, red-and-white striped bobble hat with a white pom-pom, round glasses, blue trousers, and a brown walking stick. Every decoy carries at most two of these five. The background art never contains a lookalike.

## Forsyth Park layout (north at the top)

1. Gaston Street town houses along the top: stoops, shutters, iron balconies, cornices.
2. Street and sidewalk with a horse carriage, a trolley and cyclists.
3. The fountain plaza in the upper middle: white two-tier fountain with figures and spouting water, round basin, low iron fence, benches and lamps around a brick ring.
4. Live oak alleys with hanging moss along the central promenade running south.
5. West lawn: the café pavilion with umbrella tables, the playground.
6. East lawn: the Saturday farmers market with striped awnings, peaches, honey and flowers.
7. South lawn: picnics, frisbee, kites, yoga, dogs.
8. Azalea beds and hedges along the edges.

Geography stays fixed. Seeds change who is where, what they are doing and where the target hides.

## Stories to plant

A dog stealing a sandwich. A painter at an easel with a pigeon on their beret. A dropped ice cream. A balloon drifting away. A busker with listeners and a tip hat. A wedding photo at the fountain. A man asleep under a newspaper. A squirrel photobombing a selfie. A chess game with kibitzers. A tour guide with a raised flag and a trailing group.

## Motion

Walk cycles, fountain jets, flags and awnings, wagging tails, drifting balloons and kites. Keep it gentle. With `prefers-reduced-motion`, everyone freezes mid-pose and the water stops.

## Character style guide

- **Frame**: each character is one SVG with its feet at a stated anchor (`data-anchor`). An adult is about 92 SVG units from soles to crown and ships at scale 0.8 (about 74 world units).
- **Head**: egg-shaped, about 22 units wide, a quarter of the body height. Three-quarter view facing right; flip for left. Near eye at x+8 from the head centre, far eye at x+1.5; a small nose bump breaks the outline; one ear on the far side.
- **Expression**: brows and mouth carry it. Closed arcs for concentrating or playing, open ellipse for surprise, small smile by default, blush on the near cheek.
- **Hands**: round mitten shapes with ink outline; finger lines only when gripping.
- **Clothing**: a filled shape with one shade tone on the right (light comes from the upper left) and 1 to 3 fold lines at 40% ink. Patterns are clipped inside the garment and curve with the body.
- **Colour slots**: `--skin`, `--hair`, `--top`, `--top2`, `--bottom`, `--hat`, `--hat2`, `--acc`, `--shoe`, set on the root SVG at runtime. A second person in one drawing uses `--skin2`, `--hair2`, `--top3`, `--top4`, `--bottom2`, `--shoe2`, `--hat3`. Props use their own slots (`--awn`, `--awn2`, `--cloth`, `--umb`, `--umb2`, `--kite`, `--kite2`).
- **Stripes**: red-and-white horizontal stripes belong to the target only. Decoy stripes use other colours or run vertically.

## Archetype inventory

Drawn (24 archetypes): target walker, painter, tourist photographer, saxophonist, elder pigeon feeder, jogger, child with bubbles, seated reader, dog walker, startled picnicker, SCAD student with portfolio, tour guide, parent with stroller, cyclist, praline vendor with cart, bride, groom, kid with balloon, sculptor at a plinth, dancer mid-twirl, kneeling gardener, maintenance worker with rake, chess players (pair), costumed juggler.

Bodies with a head socket (7), used for the crowd: walking, dress with shoulder bag, reading a phone, holding a coffee, tote bag with baguette, elder with cane, child.

Still planned: riverboat worker, festival attendee, historian in period dress (for River Street and the squares), a seated-at-table pose, and target poses for sitting and waving.

Animals and props drawn: dachshund, sandwich thief dog, pigeon, easel with fountain painting, park bench, lamp post, picnic blanket, tip hat, bubbles, kite, azalea bush, hedge, three live oak shapes, sabal palmetto, café table with umbrella, three market stalls (peaches, flowers, honey).

## Variation system

Recolouring alone was visibly repetitive (see `build-record/visual-qa/art-direction/review.md`), so heads are now assembled from parts in `assets/characters/parts/`, all drawn on one head frame (head centre 33.8, 21):

- faces (5): smile, neutral, talk, happy, surprised;
- hair (10): crop, side part, bob, long, bun, afro, ponytail, bald, locs, curly;
- hats (9): cap, sun hat, boater, beanie, bobble, bucket, fedora, head wrap, top hat;
- glasses (3): round (a target trait), square, sunglasses;
- beards (2): full, moustache.

Assembly:

- Bodies and the newer archetypes mark where the head goes with `<!--HEAD-->` (and `<!--HEAD2-->` for a second person) and `data-head="dx dy scale"`.
- A hair part splits into `<!--back-->` and `<!--front-->` layers, and lists the hats it allows in `data-hats`.
- An archetype's own head kit is `data-kit`, for example `hair=curly hat=sunhat`.

`src/characters/compose.js` builds the SVG and `src/characters/make.js` picks colours and parts from a seed. Red tops never get white trim. The bobble hat, round glasses, `#1E88E5` trousers and the brown cane count as decoy traits, capped at two per person.

## Sprite atlas plan

At load, each needed variant is rasterized once per zoom tier (1x, 2x, 4x of base resolution, times device pixel ratio) into a shared atlas canvas of up to 4096 px. Animation frames come from the same SVG with named groups transformed (an arm raised, a leg forward), so a frame is just another variant. Alpha from the atlas is reused for hit testing.

## Asset pipeline

1. Draw or edit SVG in `vibe-coding/assets/`. Helpers in `vibe-coding/tools/author/` only do repetitive drafting.
2. Run `node vibe-coding/tools/pack-assets.mjs`, which writes `vibe-coding/build/js/assets.bundle.js`.
3. Record every new file in `sources/asset-register.md`.
4. Check it in `docs/art-direction/forsyth-sample.html` or the game, at 1x and 2x.

Bitmap art (PNG/WebP) remains allowed by ADR-002. Record prompts and provenance beside any such file.
