# AI-use log

These are short summaries, not exact quotes. Where the original prompt isn't saved, the "What I asked" column is reconstructed from my notes. The full session notes are in `docs/history/ai-use-log-full.md`.

| Date | Tool | What I asked | What came back | Keep/change/reject | Why |
|---|---|---|---|---|---|
| 2026-11-14 | Research session (the v1 log names REA) | Study reference games and pull out camera, seed and storage patterns | A list of design "keys" (isometric camera, seeded random, local scores) | Kept, later replaced | These shaped version 1. ADR-002 later dropped the camera and the no-art rule |
| 2026-11-15 | AI agents (3-agent setup, v1) | Build the zero-asset 3D crowd game: engine, UI, QA | Version 1 in one `index.html` | Changed, then replaced | It worked but looked like boxes. I asked for the 6 px drag rule, the fixed-width timer and the fallback screen |
| 2026-11-15 | Claude Code (Claude Opus 5.5) | Audit the project and plan an illustrated rebuild; draw a Forsyth Park sample | An audit, ADR-002, art direction and 32 SVG drawings | Kept | I approved the art direction at checkpoint 1 |
| 2026-11-15 | Claude Code + playwright-core | Make Forsyth Park playable | Engine, crowd, picking, tests (12, then 14, passing) | Changed | I asked it to fix the gaps first (motion, seated poses, hard mode) before approving |
| 2026-11-15 | Claude Code + playwright-core | Wire in scores, hints, share links and fallback | Gameplay features; 19 tests passing | Kept | I approved checkpoint 2 |
| 2026-11-15 | Claude Code + playwright-core | Put every location in one world; difficulty should affect points | One city with four districts, a points system; 23 tests passing | Kept | I wanted Waldo to be able to hide anywhere |
| 2026-11-16 | Claude Code (Vite, React) | Build a separate "Art Direction & Build Lab" | The `lab/` app | Kept, outside the game | A design workspace, not part of the submission build |
| 2026-11-16 | Claude Code + playwright-core | Fix the camera, improve the art and make it kid-friendly; join the city with Bull Street | Full-screen camera, Bull Street city, 24 new drawings, simpler UI; 28 tests passing | Kept | Cycle 2. I wanted one believable Savannah, not separate maps |
| 2026-11-16 | Claude Code + Vercel CLI | Deploy and update the repo | Live site and merged PRs | Kept | So I could check it myself |
| 2026-11-16 | Claude Code + playwright-core + Vercel CLI | Make the world 2.85× wider with more real Savannah places | West and east wings, 78 new drawings; 29 tests passing | Kept | More to search, same gameplay |
| 2026-11-16 | Claude Code | Clean up the documentation for submission | These shorter documents | Pending my review | — |
