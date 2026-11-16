# Testing and failure log

## Success criteria (from the PRD)

1. Open `build/index.html`, press Play, find Waldo (add `?beacon=1` to mark him) and tap him: the timer stops and the celebration shows.
2. Zoom all the way out and drag to every edge: the screen always shows city, never blank space.
3. Drag across the crowd and let go: the wrong-guess counter stays at 0.

## Cycle 1: the first illustrated build (2026-11-15)

Cycle 1 is the illustrated city as it stood after checkpoint 4, before the overhaul. The automated tests are in `tests/illustrated.test.mjs` and run in Chrome through `playwright-core`.

| Test | What I did | Expected | Actual | Evidence | Likely cause |
|---|---|---|---|---|---|
| Main path | Pressed Play, found the target with `?beacon=1`, tapped him | Timer stops, win screen | Worked; 23 of 23 automated tests passed | `build-record/visual-qa/checkpoint-3/won-saved.png` | — |
| Edge case | Zoomed all the way out at 1440×900, 1920×1080 and phone sizes, then panned to the corners | Only city on screen | Blank space showed past the edge of the world | `build-record/visual-qa/overhaul/before/minzoom-*.png`, `topleft-*.png` | The minimum zoom was a fixed number, not tied to the window size, and panning wasn't kept inside the world |
| Unexpected input | Dragged across Waldo and let go | Counts as a pan, not a guess | Passed (a drag over 6 px pans) | Test "a drag across the target pans and never counts as a guess" | Fixed back in version 1 (FAIL-01) |
| Out-of-scope request | Looked for a sign-in or online scores; logged every network request | No accounts, nothing sent out | No sign-in; zero requests outside the build folder | Test "loads from file:// with no external requests" | Version 1 had loaded Google Fonts (FAIL-06); the illustrated build uses system fonts |

Other things I found in Cycle 1: two crowd bodies (`tote` and `walk`) had almost the same outline (96% overlap at 36 px), so the crowd looked repetitive.

## Cycle 2: after the overhaul (2026-11-16)

| Test | Cycle 1 | Cycle 2 | Mark | Evidence | ADR |
|---|---|---|---|---|---|
| Main path | Win works | Win works, with a new celebration screen | unchanged | `visual-qa/overhaul/after/won-1440.png`, `won-390.png` | ADR-002 |
| Edge case | Blank space when zoomed out | City covers the screen at every size, zoom and rotation | improved | `visual-qa/overhaul/before-after-camera.png`; tests "camera: at every viewport…" and "camera: resizing and rotating…" | ADR-003 |
| Unexpected input | Drag is not a guess | Same, and a two-finger pinch is never a guess | improved | Test "touch: a finger tap near a small person counts, a two-finger pinch never guesses" | ADR-002 |
| Out-of-scope request | No accounts or outside requests | Same | unchanged | Test "loads from file:// with no external requests" | ADR-002 |

After the overhaul all 28 automated tests passed. After I made the city 2.85× wider, all 29 passed.


## Other failures found and fixed

- The target sometimes walked back to his first candidate spot instead of the checked one. Fixed so he stays where the visibility check placed him.
- The trolley sign was drawn mirrored. Fixed.
- The City Hall dome drew in front of people standing in front of it. Fixed the depth sorting.
- The difficulty-picker test hit a reload race where `document.title.includes('Waldo')` matched `"Loading · Waldo's Savannah"` before `game.js` finished booting. Changed the initial `<title>` to `"Drawing Savannah…"` and added an inline favicon (`data:,`) so there are zero 404s; all 29 automated tests now pass.
- Cut `assets.bundle.js` from 6.94 MB (1.03 MB gzip) to 2.89 MB (310 KB gzip) via SVG `<pattern>` ground fills and safe path compaction, and cut startup load from 3.84 s to 0.56 s (standard 1,801 and dense 3,001 crowds) by deferring walk-frame decoding, lazy-building hit masks, and pooling crowd looks.
- Earlier failures FAIL-01 to FAIL-09 are written up in `docs/history/testing-and-failure-log-full.md`. The version 1 test matrix there has performance numbers that were never measured. I don't rely on them.

## What the two cycles proved

The game worked from the start: you could find Waldo, and dragging never counted as a guess. Cycle 1 showed that "working" wasn't enough, because zooming out showed blank edges and the crowd repeated itself. Tying the minimum zoom to the window size fixed the edges at every screen size I tested, and the automated camera tests now catch it if it breaks again. Phones were never measured for speed, so that part is still unproven.
