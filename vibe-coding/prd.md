# Product requirements: Waldo's Savannah (illustrated edition)

*One screen. Decisions live in [ADR-002](decisions/ADR-002-illustrated-world.md); the look lives in [art direction](sources/art-direction.md). Version 1 is archived in [docs/history/prd-v1.md](docs/history/prd-v1.md).*

## The story a ten-year-old would tell

You open a giant picture book of Savannah. Forsyth Park is packed: painters at easels, a dog running off with a sandwich, a saxophone player with a hat full of coins, kids chasing bubbles round the big white fountain. Somewhere in there is one person in a red-and-white striped shirt, a striped bobble hat, round glasses, blue trousers, with a walking stick. Drag and zoom to search. Click him. The clock stops.

## What we are building

1. **Scenes.** Forsyth Park first, as the quality benchmark. Then SCAD and Poetter Hall, River Street and Factors Walk, and the Savannah Festival (which keeps the old Festival Pier and Oglethorpe Squares zone). Each scene has authored, fixed geography.
2. **Art.** Original hand-drawn SVG assets with ink outlines, rich colour, detailed architecture, live oaks with moss, and at least 20 small stories per scene. Nothing copied from existing books.
3. **People.** At least 24 archetypes, each with its own silhouette, outfit and activity, varied by skin tone, hair, build, clothes, accessories, pose and facing. Gentle activity animation; still with reduced motion.
4. **The target.** Exactly one per round with all five traits (`#E53935` and `#FFFFFF` stripes, striped bobble hat with white pom-pom, round glasses, `#1E88E5` trousers, `#8D6E63` stick). Decoys carry at most two. A validator keeps enough of him visible to be fair.
5. **Play.** Intro, playing, won and fallback states. Timer, wrong guesses, optional hints, difficulty, density modes. Drag, pinch, wheel zoom, arrows and WASD, reset. Clicks need under 6 CSS px of travel; picking follows the drawn silhouettes and what is in front.
6. **Keep.** Seeded replay and share links, `?seed`, `?fallback=1`, `?beacon=1`, `?crowd`. Local top-ten leaderboard under `waldos_savannah_leaderboard_v1`, old records still readable.
7. **Never.** No third-party request of any kind at runtime, no accounts, analytics or remote storage. `build/index.html` opens directly from disk and over HTTP.

## Done when

1. **The picture works without the UI.** A screenshot of Forsyth Park, with the interface hidden, reads as a richly illustrated Savannah scene of distinct characters, and scores at least 4.0 on the HARNESS rubric with no category under 3.5, backed by stored screenshots.
2. **The game still works.** Scripted browser tests pass for start, pan, pinch and wheel zoom, keyboard, wrong guess, win, save score, seeded replay, share link, fallback, beacon and mobile layout, with zero runtime errors and zero requests outside the build folder.
3. **The numbers are real.** `build-record/performance.md` reports measured load time, frame time and density for named devices and browsers, and states plainly anything not yet met.
