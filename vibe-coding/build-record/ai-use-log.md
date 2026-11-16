# AI-use log

Short record of consequential AI sessions. Prompt descriptions are summarized where full chat text is archived; full session notes are in `docs/history/ai-use-log-full.md`.

**Date:** 2026-11-14
**AI tool:** Research session (REA)
**Prompt (reconstructed):** Study reference search-and-find and isometric map games for camera, seed, and storage patterns.
**Result:** Drafted the initial architecture plan and design rules for version 1.
**My contribution:** Picked Savannah as the setting and chose the core rules (offline, no accounts, seeded replay).

**Date:** 2026-11-15
**AI tool:** Multi-agent coding setup
**Prompt (reconstructed):** Build the first playable browser game in `build/index.html` using geometric 3D boxes with zero external assets.
**Result:** Built version 1 (`docs/history/index-v1.html`).
**My contribution:** Tested it, asked for the 6 px drag rule, fixed-width timer, and fallback screen, and rejected the box look because it did not feel like a picture book.

**Date:** 2026-11-15
**AI tool:** Claude Code + `playwright-core`
**Prompt (summary):** Switch to original illustrated SVG art (ADR-002), build Forsyth Park first, then expand into one continuous Savannah with hints, scores, and tests.
**Result:** Created the SVG artwork, 2D canvas engine, four connected districts, gameplay UI, and Playwright tests (23 passing).
**My contribution:** Approved the art direction, rejected early drafts without motion or hard difficulty, and decided the landmarks should follow real Bull Street order.

**Date:** 2026-11-16
**AI tool:** Claude Code (Vite, React)
**Prompt:** Master prompt to build an "Art Direction & Build Lab" workspace to inspect assets and before/after screenshots.
**Result:** Built the separate `lab/` design tool outside the game build.
**My contribution:** Used it to review visual gaps without mixing dev tools into `vibe-coding/build/`.

**Date:** 2026-11-16
**AI tool:** Claude Code + `playwright-core` + Vercel CLI
**Prompt (summary):** Fix the zoomed-out blank edges (ADR-003), simplify the kid UI, widen the city with west and east wings, and deploy to Vercel.
**Result:** Added full-screen camera clamping, 78 new drawings across a 9120-wide city, 29 automated tests, and the live Vercel deployment.
**My contribution:** Caught the zoomed-out edge failure in Cycle 1, requested the wider city and kid-friendly UI, and verified the live site.

**Date:** 2026-11-16
**AI tool:** AI coding agents + `playwright-core` + Vercel CLI
**Prompt (summary):** Shorten the submission docs to match the course templates, fix the reload test flake and 404, speed up loading and panning, and sync the Obsidian folder.
**Result:** Shortened docs and ADRs, cut asset size to ~2.9 MB and startup load to ~0.6 s, cleared all 29/29 tests, redeployed Vercel, and synced Obsidian.
**My contribution:** Reviewed the docs and Obsidian folder, caught overly long technical text in the ADRs and logs, and asked to keep the submission concise and faithful to the course format (with `reflection.md` left for me to write).
