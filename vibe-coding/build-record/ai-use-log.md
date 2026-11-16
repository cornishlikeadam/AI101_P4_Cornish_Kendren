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
**Prompt (summary):** Shorten the submission docs to match the course templates, inline all JS/assets into a single `build/index.html` with 100% HTML repo language settings, strip `Co-Authored-By:` git trailers, speed up loading and panning, and sync the Obsidian folder.
**Result:** Shortened docs and ADRs, packed all assets and game scripts inline into `build/index.html`, set `.gitattributes` for HTML-only repo language detection, cleared all 29/29 tests, redeployed Vercel, cleaned git history, and synced Obsidian.
**My contribution:** Reviewed the docs, GitHub sidebar, and Obsidian folder, caught overly long technical text, enforced the single-file HTML rule and contributor settings, and kept `reflection.md` human-written.

**Date:** 2026-11-16
**AI tool:** Codex + GitHub API
**Prompt (summary):** Verify and fix the stale GitHub Languages bar so the single-file submission reports 100% HTML.
**Result:** Confirmed GitHub was still serving its pre-submission language snapshot, strengthened `.gitattributes` to exclude authoring sources and force the packed HTML artifact to count, and triggered a fresh Linguist analysis.
**My contribution:** Rechecked the public repository and reiterated that the course submission must display as HTML only.
