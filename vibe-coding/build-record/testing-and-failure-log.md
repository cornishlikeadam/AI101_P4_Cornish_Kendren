# Testing and failure log

## Success criteria (from prd.md)

1. Open `build/index.html`, press Play, find Waldo (add `?beacon=1` to mark him) and tap him: the timer stops and the celebration shows.
2. Zoom all the way out and drag to every edge: the screen always shows city, never blank space.
3. Drag across the crowd and let go: the wrong-guess counter stays at 0.

## Cycle 1 (first illustrated build, 2026-11-15)

Automated browser checks live in `tests/illustrated.test.mjs`. Key screenshots are saved in `build-record/tests/` (and full visual QA sets in `build-record/visual-qa/`).

- **Main path:** Pressed Play, found Waldo with `?beacon=1`, and tapped him. Timer stopped and the win screen appeared (23/23 automated checks passed; `build-record/tests/c1-main-won.png`).
- **Edge case:** Zoomed all the way out and panned to corners at laptop and phone sizes.
  - **Problem:** Blank background showed past the edge of the city because minimum zoom was a fixed number and panning wasn't clamped (`build-record/tests/c1-edge-minzoom-1440x900.png`).
- **Unexpected input:** Dragged across Waldo and released. Counted as a pan, never a wrong guess.
- **Out-of-scope request:** Checked for sign-in, scores sent online, or external requests while loading from `file://`. None; zero outside requests.
- **Visual note:** Two crowd silhouettes looked almost identical, making the crowd feel repetitive.

## Cycle 2 (after fixes, 2026-11-16)

Re-ran the same four checks after the camera, city, and speed fixes:

- **Main path — unchanged:** Winning works with the updated celebration screen (`build-record/tests/c2-main-won.png`).
- **Edge case — improved (ADR-003):** **Fix:** Tied minimum zoom to the window size and kept panning inside the world. **Result:** City covers the screen at all five tested viewports and on rotation (`build-record/tests/c2-edge-before-after-camera.png`).
- **Unexpected input — improved (ADR-002):** Dragging still never guesses, and two-finger pinching never triggers a guess.
- **Out-of-scope request — unchanged (ADR-002):** Still zero outside requests and no accounts.

All **29/29** automated tests pass after widening the city and fixing a loading-title timing flake.

## Other failures found and fixed

- **Waldo walking away:** He sometimes walked back toward an earlier rejected spot. Fixed so he stays where the visibility check placed him.
- **Mirrored trolley sign & depth order:** Fixed the backwards sign on the trolley and fixed the City Hall dome drawing in front of people standing on its steps.
- **Reload test flake & 404 favicon:** The difficulty-picker test sometimes checked the page title while it was still loading, and browsers logged a missing favicon. Fixed both so all 29 tests pass cleanly.
- **Slow initial load on the wider city:** Startup climbed to ~3.8 s and ~6.9 MB after widening the city to 9,120 units. Simplified repeated background shapes and deferred extra animation decoding so startup runs in ~0.6 s on an Apple M4 laptop (`build-record/performance.md`).
- **Earlier history:** Fails `FAIL-01` to `FAIL-09` from the old box version are in `docs/history/testing-and-failure-log-full.md` (unmeasured v1 FPS numbers there are not relied on).

## What the two cycles proved

The core game worked in Cycle 1, but zooming out revealed empty edges and the wider city slowed down startup. Tying minimum zoom to the screen size fixed the blank edges across every viewport we tested, and all 29 automated checks now catch regressions automatically. Phones still need real-device speed testing.
