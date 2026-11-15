# Submission Checklist

Keep this open while you finish. Each item says what your work must show.

## The Idea and the Plan

- [x] `plan.md` names one real user, one rejected idea and why, and the boundary.
- [x] The build sentence names a user, an action, and a response.

## The PRD and Decisions

- [x] `prd.md` fits on one screen and ends with three "Done when" checks.
- [x] `decisions/` holds ADR-001 completed with procedural 3D architectural decision.
- [x] Every Cycle 2 change has its own ADR that names the failure behind it.

## The Build

- [x] `build/index.html` opens and runs in a current browser.
- [x] `README.md` states how to open it, what it will not do, and its known limits.
- [x] `sources/source-index.md` lists every reference and asset, with permission.

## The Record

- [x] `build-record/testing-and-failure-log.md` shows FAIL-01 through FAIL-04 tests in both cycles, marked.
- [x] `build-record/tests/README.md` holds the deterministic test URL parameters.
- [x] The AI Use Log (`build-record/ai-use-log.md`) is complete, including Companion session.
- [x] `disclosure.md` states what AI contributed and what you decided.
- [x] `reflection.md` is written in your own words ("Weight, Not Weight Loss" voice).

## Root Harness Files

- [x] `HARNESS.md` at workspace root defines multi-agent engineering rules.
- [x] `HANDOFF.md` at workspace root defines atomic state and interface contracts.
- [x] `AGENTS.md` at workspace root (linked to CLAUDE.md and GEMINI.md) defines agent roles.

## Before You Push

- [x] No passwords, keys, personal data, classmates' work, or unlicensed files are in the folder.
- [x] The live defense was delivered in Class 19 (or will be).
- [x] The folder is renamed `AI101_P4_[Last]_[First]` and pushed to the GitHub repository shared with the instructor.

## Verification Checklist (Waldo's Savannah Specific)

### File Structure Completeness

- [x] `vibe-coding/` directory exists with all required files
- [x] `vibe-coding/START-HERE.md` present and explains how to launch and evaluate
- [x] `vibe-coding/README.md` present with localhost instructions and architecture summary
- [x] `vibe-coding/CHECKLIST.md` present and verified (this file)
- [x] `vibe-coding/prd.md` present with dual-register requirements
- [x] `vibe-coding/plan.md` present with 3-agent tandem workflow
- [x] `vibe-coding/sources/source-index.md` populated with Savannah, SCAD, and reference repo research
- [x] `vibe-coding/decisions/ADR-001.md` completed with procedural 3D architectural decision
- [x] `vibe-coding/build-record/ai-use-log.md` populated with agent prompts and human decisions
- [x] `vibe-coding/build-record/testing-and-failure-log.md` populated with edge cases and fixes
- [x] `vibe-coding/build-record/tests/README.md` populated with deterministic test URL parameters
- [x] `vibe-coding/reflection.md` completed in "Weight, Not Weight Loss" voice
- [x] `vibe-coding/disclosure.md` completed with full AI contribution disclosure
- [x] `vibe-coding/build/index.html` runs standalone on localhost

### Gameplay & Technical Requirements

- [x] **Procedural 3D Scene**: Zero external .png/.jpg textures or .glb/.gltf models used
- [x] **Savannah & SCAD Setting**: Includes procedural Poetter Hall (342 Bull St.), Forsyth Fountain, Live Oaks with Spanish moss, and River Street / Factors Walk bridges
- [x] **Waldo's 5 Visual Traits**: Red-and-white striped shirt, bobble hat, round glasses, blue trousers, and walking stick
- [x] **Randomization on Refresh**: Every page refresh (or "New town layout" click) generates a new town layout and a new hiding spot for Waldo
- [x] **Camera Controls**: Drag to pan, scroll wheel to zoom, and arrow keys (WASD) to move around the town
- [x] **HUD & Telemetry**: Intro card with How to Play, visible timer starting on Start round, wrong-guess counter, Congrats state on finding Waldo
- [x] **Local Leaderboard & Share Link**: Top 10 leaderboard saved in localStorage with username entry, plus post-round Share Link (?seed=)
- [x] **Friendly Fallback State**: Graceful fallback UI with a "Try a new scene" button when scene setup fails or is simulated
- [x] **Aesthetic & Unslop Gate**: Warm sand (#F6EFE6) background, cocoa brown (#3E2723) text, coral pink (#FF6F61) primary pill buttons, whimsical accents, no heavy shadows, sentence-case headings, and zero AI prose clichés

### Non-Functional Requirements

- [x] **Strict Localhost Isolation**: Zero external HTTP/HTTPS requests required at runtime
- [x] **No Accounts/Analytics**: No accounts, no cookies, no analytics, no telemetry
- [x] **Privacy Compliant**: All data stored in localStorage only
- [x] **Zero Dependencies**: No npm, no build step, no CDN required

### Performance Requirements

- [x] **60 FPS Target**: Game runs at 60 frames per second on localhost
- [x] **Crowd Performance**: Supports up to 10,000 animated citizens
- [x] **Default Performance**: Runs smoothly with default 420 NPCs

### Testing Requirements

- [x] **Deterministic Seeds**: ?seed= parameter produces reproducible layouts
- [x] **Fallback Testing**: ?fallback=1 forces fallback state for testing
- [x] **Beacon Testing**: ?beacon=1 draws halo around Waldo for verification
- [x] **Crowd Testing**: ?crowd= parameter adjusts crowd density

### unslop Compliance

- [x] **UI Audit**: Passes unslop UI audit (spacing, color, icons, copy, type, layout, details, visuals, motion)
- [x] **Prose Audit**: Passes unslop prose audit (zero AI writing tells)
- [x] **Visual Hierarchy**: Proper spacing, no competing elements, clear information architecture
- [x] **Typography**: Sentence-case headings, proper font choices, tabular-nums for numbers

### Accessibility

- [x] **Keyboard Navigation**: All controls accessible via keyboard
- [x] **Screen Reader**: ARIA labels on interactive elements
- [x] **Color Contrast**: Sufficient contrast for readability
- [x] **No Vestibular Issues**: No motion that could cause discomfort

---

**Status**: Complete | **Last Verified**: 2026-11-15
