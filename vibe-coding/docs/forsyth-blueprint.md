# Forsyth Park scene blueprint

The benchmark scene. Geography is fixed; seeds vary who is where, what they do and where the target hides. Built and playable in `build/illustrated.html` (`src/scenes/forsyth.js`, ground from `tools/author/forsyth-ground-full.mjs`). The checkpoint 1 sample (`docs/art-direction/forsyth-sample.html`) covered the north third.

## World

3,200 × 2,400 world units, north at the top. An adult is about 80 units tall at scale 0.8.

| Band (y) | Content | Layer |
|---|---|---|
| 0–270 | Sky, distant canopy, Gaston Street town houses | 00, 10 |
| 270–350 | Gaston Street: carriages, trolley, cyclists, crossing | 20 ground, 60 world |
| 350–410 | Park sidewalk, iron fence, azalea beds | 20, 60 |
| 410–1,050 | Fountain plaza (ellipse 430 × 172 around the basin), north gate, benches, lamps | 20, 60 |
| 1,050–1,900 | Central promenade under an oak alley; west lawn with café patio and chess table; east lawn with the Saturday farmers market; east-west cross walk at y 1,560 | 20, 60 |
| 1,900–2,400 | South lawn: playground sand circle, picnics, kites, juggler, dancer, leaf raking; south walk at y 2,300; foreground hedges | 20, 60, 80 |

West and east edges: perimeter walks lined with oaks. The Whitaker and Drayton Street house rows are not drawn yet.

## Micro-stories

Status: **placed** means drawn and placed in the playable scene; **planned** means assets still to draw.

| # | Story | Where | Status |
|---|---|---|---|
| 1 | Painter at an easel, painting the fountain | Plaza west | Placed |
| 2 | Saxophone busker, tip hat, listeners | North gate | Placed |
| 3 | Wedding photo in front of the fountain | Plaza south | Placed |
| 4 | Dog runs off with a picnic sandwich | South-east lawn | Placed |
| 5 | Elder scattering crumbs to pigeons | South-west lawn | Placed |
| 6 | Child chasing bubbles | Promenade head | Placed |
| 7 | Dachshund towing its walker | Promenade | Placed |
| 8 | Walking tour behind a raised umbrella | South-east walk | Placed |
| 9 | Queue at the praline cart | North lawn | Placed |
| 10 | Balloon slipping out of a child's hand | Near the cart | Placed |
| 11 | Cyclists on Gaston Street | Street | Placed |
| 12 | Reader with headphones on a bench | East bench | Placed |
| 13 | Sculptor carving a bust, watched by a passer-by | West lawn | Placed |
| 14 | Musician's sheet music blowing away | Bandstand | Planned |
| 15 | Juggler in a top hat with a ring of watchers | South lawn | Placed |
| 16 | Painter knocks over a paint pot | Plaza west | Planned |
| 17 | Gull stealing a snack | Market | Planned |
| 18 | Dancer twirling while a friend films | South lawn | Placed |
| 19 | Queue at the peach stall | Market | Placed |
| 20 | Two players at chess with kibitzers | By the café patio | Placed |
| 21 | Gardener planting azaleas | East bed | Placed |
| 22 | Maintenance worker raking leaves, a child about to jump in | South-west lawn | Placed |
| 23 | Someone reading a phone, about to walk into a lamp post | Cross walk | Placed |
| 24 | Kite flyers | South lawn | Placed |
| 25 | Playground: kids on the sand, parents on the rim | West lawn | Placed |
| 26 | Coffee chat on the patio; picnics on the south lawn; vendors behind the stalls | Several | Placed |
| 27 | Artist painting a dog that will not sit still | West lawn | Planned |
| 28 | One person walking six dogs | South lawn | Planned |

## Hiding spots (target candidates)

Each spot lists the poses allowed and the difficulty it suits. The validator still rejects any seed where too little of the target shows. The playable scene uses the 16 spots in `SPOTS` in `src/scenes/forsyth.js`; only the walking target pose exists so far, so seated and waving spots fall back to walking.

| Spot | Poses | Difficulty |
|---|---|---|
| Plaza ring, north-west | Walk, stand | Easy |
| Busker crowd, back row | Stand | Normal |
| Tour group, middle | Walk | Normal |
| Market aisle between two striped awnings | Stand | Hard |
| Under the oak alley, behind a lamp | Walk | Hard |
| Café tables, seated | Sit | Normal |
| Playground fence | Stand, wave | Easy |
| Bench by the azaleas, seated | Sit | Hard |

## Density budgets

| Mode | People | Use |
|---|---:|---|
| Low | ~180 | Older devices |
| Standard | ~360 | Default |
| Dense | ~600 | Hard mode |
| Stress | `?crowd=` up to 10,000 | Performance testing only |
