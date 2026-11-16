# Savannah city blueprint (checkpoint 4)

One continuous world, 3200 × 6700 units, north at the top. The target can hide in any district; players scroll and zoom to search. Geography is fixed; the replay identity varies looks, the crowd and the hiding spot. This replaces the earlier plan of four separate scenes (the "Scene D" question in `audit.md` is resolved: Festival Pier is part of the River Street district).

| y | District | Contents | Source |
|---|---|---|---|
| 0–1500 | River Street and Festival Pier | Savannah River with a paddle-wheeler and a tug; riverwalk with lamps, benches and the Waving Girl statue; plank pier with eight festival tents; cobbled River Street; cotton warehouse row; Factors Walk and Bay Street | `src/scenes/riverfront.js` |
| 1500–2950 | City Market | Shopfront row with the City Market gate; brick plaza with stalls, café tables, planters; Congress Street with a carriage and trolley | `src/scenes/market.js` |
| 2950–4300 | Two Oglethorpe squares | Italianate townhouse row with a twin-spired church; an obelisk square and a fountain square with oaks, benches and azaleas; streets either side | `src/scenes/squares.js` |
| 4300–6700 | Forsyth Park | Unchanged from checkpoints 2 and 3, moved south | `src/scenes/forsyth.js` |

Ground: `assets/environments/savannah/ground.svg` from `tools/author/savannah-ground.mjs` (embeds the Forsyth ground). Crowd budgets: low 450, standard 900, dense 1,500.

## New stories (22, on top of Forsyth's 25)

Deckhands at the riverboat gangway; tourists photographing the Waving Girl; a historian at the statue; festival juggler with cotton-candy fans; a tent queue; a pier saxophonist; praline cart on River Street with a balloon kid; ghost tour on Factors Walk; riverwalk pigeons; a City Market painter; a market busker and listeners; a dancer filmed by a friend; café customers; a chess game with a kibitzer; a carriage wedding; market vendors; a square walking tour with a historian; readers on square benches; a sculptor; a fountain-square wedding photo; a dachshund walk; a gardener and a leaf raker.

## Hiding spots

River: open riverwalk (easy), festival crowd (normal, hard), among the tents (hard), River Street cobbles (easy, normal), gangway (normal), ghost tour (normal, hard). Market: gate (easy, normal), stalls (normal, hard), café tables (hard), busker ring (normal), Congress Street (easy). Squares: west paths (easy, normal), east square oaks (normal, hard), tour group (hard), sidewalks (easy). Forsyth: the 16 spots in `forsyth-blueprint.md`.

## Known gaps

The warehouse row is drawn as its Bay Street side, which is the side a viewer south of it really sees: upper-floor offices with cotton-trade signs reached by iron footbridges over Factors Walk, above a stone retaining wall (revision 3). Revision 2: the squares have their own row (pastel Italianate townhouses with high stoops and cast-iron balconies around a twin-spired church), and the market plaza gained 4 more stalls, 4 tents, planters and five more stories (tent shoppers, a juggler with kids, sketching students, a balloon kid, pigeons), with a larger share of the crowd. Vehicles carrying signs are never mirrored.
