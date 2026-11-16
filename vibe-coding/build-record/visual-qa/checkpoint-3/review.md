# Checkpoint 3 review: gameplay integration

Date: 2026-11-15. Status: **submitted for the project lead's approval. Not approved yet.** Checkpoint 2 was approved on 2026-11-15.

## What changed

- `build/index.html` is now the illustrated game. Version 1 is archived unchanged at `docs/history/index-v1.html` (and in git history).
- Timer, wrong guesses, win card (unchanged from checkpoint 2).
- **Leaderboard** (`src/gameplay/leaderboard.js`): key `waldos_savannah_leaderboard_v1`, records `{ username, elapsedMs, wrongGuesses, seed }` plus `scene`, `difficulty`, `hints`, `artVersion`; ten records; sorted by time then wrong guesses; invalid records dropped; saved once per round; names shown with `textContent` (fixes the version 1 `innerHTML` injection); storage failures never break play. A Scores panel lists and clears it.
- **Hints**: two per round. The first names the area; the second pans there and draws a 300-unit dashed circle that contains, but is not centred on, the target. Hints used are saved with the score.
- **Share link**: seed, scene, difficulty, density (and crowd) in the URL; the same link rebuilds the same park.
- **Fallback**: `?fallback=1`, the "Test fallback state" button, and any load or placement error show a friendly card; "Try a new scene" reloads with a new seed.
- **Pickers**: difficulty and crowd density on the intro card; changing one reloads with the same seed.

## Evidence

`visual-qa/checkpoint-3/`: `intro-http.png`, `hint-1.png`, `hint-2.png`, `won-saved.png`, `scores.png`, `fallback.png`, `phone-playing.png`. Captured over HTTP (`python3 -m http.server` on `build/`), as Vercel serves it: 0 requests to any other host. Tests: 19 of 19 (`tests/illustrated.test.mjs`), including the five new ones listed in the failure log.

## Revision 2 (phone layout)

On screens under 560 px the info card is one line (portrait, title, time, wrong guesses), the seed label and help text are hidden, and Hint, Scores and zoom share one row on the bottom edge. Screen furniture now covers under 16% of a 390 × 844 screen (was about a third); the phone test checks this and that the two button groups never overlap. 19 of 19 pass.

## Known gaps

- Not deployed; Vercel still serves the committed version 1 until this is committed and pushed.
- Copy link may fall back to "select and copy" when the page is opened from `file://`, where browsers can refuse clipboard access.
- Open from checkpoint 2: drawn animation frames, café pavilion and fort, oak-alley repetition, more target poses.
