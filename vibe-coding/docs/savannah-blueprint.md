# Savannah city blueprint (checkpoint 4, revised 2026-11-16)

One continuous world, 3200 × 7600 units, north at the top, joined by **Bull Street** (x 1515–1685), which runs from Bay Street past City Hall to the Forsyth Park north gate, as it does in the real city. Distances are compressed and some blocks are left out (Broughton Street; Wright, Chippewa and Madison Squares), but the order is the real order. Geography is fixed; the replay identity varies looks, the crowd and the hiding spot.

| y | District | Contents | Source |
|---|---|---|---|
| 0–1500 | River Street and Festival Pier | River with a paddle-wheeler and a tug; riverwalk with the Waving Girl; plank pier with festival tents; cobbled River Street; cotton warehouse row with City Hall's gold dome at the head of Bull Street; Bay Street traffic | `src/scenes/riverfront.js` |
| 1500–2950 | City Market and Johnson Square | City Market west of Bull (brick plaza, stalls, café tables, performers); Johnson Square east of Bull with the Greene Monument obelisk; Congress Street | `src/scenes/market.js` |
| 2950–4300 | Pulaski and Lafayette Squares | Harris Street townhouses with the twin-spired cathedral over Lafayette Square (fountain); Pulaski Square (oaks); Charlton Street | `src/scenes/squares.js` |
| 4300–5200 | Jones Street and Monterey Square | Jones Street houses with SCAD Poetter Hall at Bull; Monterey Square with the Pulaski Monument, Mercer House to the west and Temple Mickve Israel to the east | `src/scenes/monterey.js` |
| 5200–7600 | Forsyth Park | Unchanged park, moved south; Bull Street reaches its gate between the Gaston Street houses | `src/scenes/forsyth.js` |

Ground: `assets/environments/savannah/ground.svg` from `tools/author/savannah-ground.mjs`. Street furniture shared by all districts (traffic, parked cars, Bull Street oaks and lamps, signs, hydrants): `src/scenes/streets.js`. Crowd budgets: low 450, standard 900, dense 1,500.

## New stories (22, on top of Forsyth's 25)

Deckhands at the riverboat gangway; tourists photographing the Waving Girl; a historian at the statue; festival juggler with cotton-candy fans; a tent queue; a pier saxophonist; praline cart on River Street with a balloon kid; ghost tour on Factors Walk; riverwalk pigeons; a City Market painter; a market busker and listeners; a dancer filmed by a friend; café customers; a chess game with a kibitzer; a carriage wedding; market vendors; a square walking tour with a historian; readers on square benches; a sculptor; a fountain-square wedding photo; a dachshund walk; a gardener and a leaf raker.

## Hiding spots

River: open riverwalk (easy), festival crowd (normal, hard), among the tents (hard), River Street cobbles (easy, normal), gangway (normal), ghost tour (normal, hard). Market: gate (easy, normal), stalls (normal, hard), café tables (hard), busker ring (normal), Congress Street (easy). Squares: west paths (easy, normal), east square oaks (normal, hard), tour group (hard), sidewalks (easy). Forsyth: the 16 spots in `forsyth-blueprint.md`.

## Known gaps

The warehouse row is drawn as its Bay Street side, which is the side a viewer south of it really sees: upper-floor offices with cotton-trade signs reached by iron footbridges over Factors Walk, above a stone retaining wall (revision 3). Revision 2: the squares have their own row (pastel Italianate townhouses with high stoops and cast-iron balconies around a twin-spired church), and the market plaza gained 4 more stalls, 4 tents, planters and five more stories (tent shoppers, a juggler with kids, sketching students, a balloon kid, pigeons), with a larger share of the crowd. Vehicles carrying signs are never mirrored.

## Movement (revision 4)

Crowd people travel: along walks, streets, the riverwalk and River Street (back and forth across the city width), up and down the promenade and side paths, or wandering with pauses on lawns, plazas, the pier and the market. Joggers run (about 55 units/s), cyclists ride (85), walkers stroll (about 22), children and cane users go slower. Dogs on leads follow their walkers. Story characters stay at their stories. The target paces within 22 units of his validated hiding spot. Placement is still decided by the replay identity; positions after that depend on time. `prefers-reduced-motion` stops all of it.
