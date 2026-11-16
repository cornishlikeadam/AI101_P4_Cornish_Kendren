# ADR-004: Round state table, CI tests, branch previews, and a Waldo who moves

**Date:** 2026-11-16 · **Status:** Accepted

## Context
- The round's state (INIT, INTRO, PLAYING, WON, FALLBACK) was a plain string that `main.js` changed in four places. Nothing stopped an illegal move such as WON → PLAYING.
- The repo had no CI at all: `gh run list` returned 0 runs. Tests ran only on one laptop.
- Vercel was deployed by hand, so there were no preview links for branches.
- Players found Waldo in the same place. Changing difficulty kept the same seed, which rebuilt the same city. He also only paced 22 px, so he looked frozen.

## Decision
1. **One table for the round.** `ROUND_MOVES` in `src/gameplay/round.js` lists every allowed move. `transition(round, event)` is the only way to change state. Unlisted moves are ignored and logged.

   | State | Event → next state |
   |---|---|
   | INIT | loaded → INTRO, fail → FALLBACK |
   | INTRO | start → PLAYING, fail → FALLBACK |
   | PLAYING | found → WON, fail → FALLBACK |
   | WON | fail → FALLBACK |
   | FALLBACK | (none, end state) |

2. **Small CI.** `.github/workflows/tests.yml` checks that `build/index.html` matches `src/`, then runs the Playwright suite on every push and PR.
3. **Branch previews.** The Vercel project is linked to the GitHub repo, so every branch gets a preview URL.
4. **Waldo moves and reshuffles.** Choosing a difficulty starts a fresh seed. Waldo now strolls 70 / 100 / 130 px (easy / normal / hard) around his hiding spot.

## Consequences
- **UX:** a new spot each time you change difficulty, and a Waldo you have to track.
- **DX:** a failing test or a stale build blocks the PR, not the class demo.
- **AX:** an agent reads one table instead of searching `main.js` for string writes.
- Trade-off: share links still replay the exact seed; only the difficulty picker reshuffles.
