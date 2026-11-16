# Waldo's Savannah

A search-and-find game in an illustrated Savannah, Georgia. Somewhere in a crowded city that runs from the river down Bull Street to Forsyth Park, and from the Talmadge Bridge to Emmet Park, one person wears a red-and-white striped shirt, a striped bobble hat, round glasses, blue trousers and carries a walking stick. Find him.

Play online: https://waldo-savannah.vercel.app/

## Run it

Open `vibe-coding/build/index.html` in a browser. That's all; it works offline from the file. Or serve the folder:

```bash
python3 -m http.server 8000 --directory vibe-coding/build   # then open http://localhost:8000
```

## How to play

- **Play!** starts the timer.
- **Drag** (or one finger) to look around. **Scroll** or **pinch** to zoom. Arrow keys and WASD work too.
- **Tap** the person you think is Waldo. Wrong taps add to the ✗ counter.
- **💡 Hint** up to three times: the area, then a landmark near him, then a circle he is inside.
- The little map at the bottom left shows where you are; tap it to jump.
- **☰** holds the level, crowd size, top scores and a new city.

Links can replay the same city: `?seed=SAV-1234`. Other options: `?difficulty=easy|normal|hard`, `?density=low|standard|dense`, `?scene=forsyth` (the park only), `?crowd=2000` (stress test), `?beacon=1` (marks Waldo, for testing), `?fallback=1` (shows the error screen).

## Where things are

| Path | What |
|---|---|
| `vibe-coding/build/` | The game: `index.html`, plus `js/game.js` and `js/assets.bundle.js` (generated) |
| `vibe-coding/src/engine/` | Camera, drawing, picking, input |
| `vibe-coding/src/scenes/` | The city: one file per district, `streets.js` for traffic and Bull Street |
| `vibe-coding/src/characters/` | Builds people from body drawings and head parts |
| `vibe-coding/src/main.js`, `src/gameplay/` | Screens, timer, hints, scores |
| `vibe-coding/assets/` | The original SVG drawings (listed with their origin in `vibe-coding/sources/asset-register.md`) |
| `vibe-coding/tools/` | `build.mjs` rebuilds the game; `author/` holds the scripts that wrote the drawings |
| `vibe-coding/tests/` | Playwright checks (`illustrated.test.mjs`) and a frame-rate tour (`perf.mjs`) |

## Rebuild

```bash
node vibe-coding/tools/build.mjs            # packs assets/ and joins src/ into build/js/
node vibe-coding/tests/illustrated.test.mjs # needs playwright-core and Chrome; see the file header
```

Never edit `build/js/*.js` by hand. Change `src/` or `assets/` and rebuild. Some drawings come from the scripts in `tools/author/`, so re-run the relevant script after editing it.

## What changed in the latest overhaul (2026-11-16)

- **The screen is always full of city.** The camera cannot zoom out or pan past the edge of the world at any window size, including after rotating a phone. Zoom is smooth and stays anchored under the mouse or between your fingers.
- **One connected Savannah.** Bull Street now runs from City Hall on Bay Street through City Market and Johnson Square, between Pulaski and Lafayette Squares, past SCAD Poetter Hall and Monterey Square, to the Forsyth Park gate. There are street signs, crosswalks, and parked and moving cars.
- **New drawings:** City Hall, Poetter Hall, the Jones Street houses, Mercer House, Temple Mickve Israel, the Pulaski Monument, three new crowd bodies (an umbrella, a student with books, a waving person), cars, street furniture and new mini-stories.
- **Simpler for kids:** a picture of Waldo and **Play!**, a small in-game bar, three gentle hints, playful wrong-guess reactions, a celebration when you find him, and an optional score save.

**Wider city (2026-11-16, later):** the city is now 2.85× wider (9120 units). Every street continues west and east with real places in their real order: the Talmadge Bridge, Plant Riverside, Franklin Square and First African Baptist Church, Chatham Square and the Victorian District to the west; the Cotton Exchange, Emmet Park and the Old Harbor Light, Reynolds Square and the Olde Pink House, Colonial Park Cemetery, Troup, Calhoun and Whitefield Squares to the east. About twice as many people live in it.

Screenshots before and after: `vibe-coding/build-record/visual-qa/overhaul/`. Measurements: `vibe-coding/build-record/performance.md`.

## For the class

Project documents stay where they were: `vibe-coding/prd.md`, `plan.md`, `decisions/` (ADR-001, ADR-002), `HARNESS.md`, `HANDOFF.md`, `AGENTS.md`, `vibe-coding/build-record/` (AI-use log, testing log) and `vibe-coding/disclosure.md`. The original version 1 READMEs are archived in `vibe-coding/docs/history/`.

All art is original. No tracking, no accounts, no network requests: scores stay in your browser.
