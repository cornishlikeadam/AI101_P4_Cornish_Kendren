# Waldo's Savannah: Multi-Agent Vibe-Coding Project

This repository contains **Project 4: Waldo's Savannah** — a complete, self-contained zero-asset 3D crowd-search game built using a multi-agent harness approach.

## Project Overview

Waldo's Savannah is a procedurally generated 3D hidden-object game set across the Savannah College of Art and Design (SCAD) campus and historic Savannah waterfront. Players search for Waldo among animated crowds in a warm, storybook-style interface, while the underlying engineering demonstrates graduate-level architectural rigor.

### Key Features

- **100% Procedural Generation**: All buildings, trees, props, and animated characters generated mathematically at runtime
- **Zero External Dependencies**: No image assets, 3D models, or network requests required
- **Localhost-First**: Runs completely offline in any modern browser
- **60 FPS Performance**: Supports up to 10,000 animated NPCs
- **Deterministic Replay**: Seeded randomization allows sharing exact game layouts
- **Friendly Fallback**: Graceful error handling with recovery options

## Quick Start

### Option 1: Direct File Open
Simply open `vibe-coding/build/index.html` in any modern browser.

### Option 2: Local HTTP Server (Recommended)
```bash
cd /path/to/this/repository
python3 -m http.server 8000 --directory vibe-coding/build
# Then open http://localhost:8000
```

## Repository Structure

```
.
├── README.md                          # This file
├── HARNESS.md                         # Multi-agent engineering rules
├── HANDOFF.md                         # Atomic state & interface contracts
├── AGENTS.md                          # Agent roles and execution workflow
├── CLAUDE.md → AGENTS.md              # Symlink for Claude Code
└── GEMINI.md → AGENTS.md              # Symlink for Gemini CLI

vibe-coding/
├── START-HERE.md                      # Project orientation guide
├── README.md                          # Quick-start and feature summary
├── CHECKLIST.md                       # Submission verification checklist
├── plan.md                            # Five-line execution plan
├── prd.md                             # Product Requirements Document
├── reflection.md                      # Project reflection
├── disclosure.md                      # AI contribution disclosure
├── build/
│   └── index.html                      # Complete self-contained game
├── sources/
│   └── source-index.md                 # Research dossier
├── decisions/
│   ├── ADR-001-template.md             # ADR template
│   └── ADR-001.md                      # Zero-asset procedural 3D decision
└── build-record/
    ├── ai-use-log.md                   # AI usage documentation
    ├── testing-and-failure-log.md     # Testing and failure documentation
    └── tests/
        └── README.md                   # Test parameters and instructions
```

## How to Play

1. **Start**: Click "Start round" to begin the timer
2. **Explore**: Drag to pan, scroll to zoom, use arrow keys/WASD to navigate
3. **Find Waldo**: Search for the one person with all five traits:
   - Red & white striped shirt
   - Striped bobble hat with white pom-pom
   - Round glasses
   - Blue trousers
   - Walking stick
4. **Click Waldo**: Victory! Save your time to the local leaderboard
5. **Share**: Copy the URL with `?seed=` to challenge friends

## Testing & Verification

Use these URL parameters for testing:

| Parameter | Example | Purpose |
|-----------|---------|---------|
| `?seed=SAVANNAH2026` | Lock town layout for reproducible testing |
| `?fallback=1` | Force fallback state for error testing |
| `?beacon=1` | Show verification halo around Waldo |
| `?crowd=10000` | Set crowd density (max: 10,000) |

Example: `http://localhost:8000/?seed=TEST123&beacon=1`

## Technical Architecture

### 3D Engine
- **Projection**: Orthographic 45° elevation, 15° azimuth (Tiny London spec)
- **PRNG**: Mulberry32 seeded pseudo-random number generator
- **Rendering**: HTML5 Canvas 2D with painter's algorithm depth sorting
- **Geometry**: Procedural generation of Savannah landmarks (Poetter Hall, Forsyth Fountain, Factors Walk, Festival Pier)

### Design System
- **80/15/5 Color Rule**: 80% calm storybook, 15% historic tokens, 5% whimsical pop
- **Typography**: Fraunces/Fredoka (display), Plus Jakarta Sans (body), Space Mono (mono)
- **UI**: Pill buttons, storybook cards, no heavy shadows

### Privacy & Compliance
- **Zero external requests**: No analytics, no tracking, no CDN
- **localStorage only**: Leaderboard persists on user's machine
- **Offline-first**: Works without internet connection

## Multi-Agent Workflow

The project was built using a **three-agent tandem approach**:

1. **Agent 1** (Procedural 3D World & Math Architect): Built the 3D orthographic engine, PRNG, landmarks, crowd animation
2. **Agent 2** (Cognitive UX, Storybook UI & Copy Engineer): Built the CSS design system, HUD, overlays, leaderboard
3. **Agent 3** (Harness QA, Unslop Auditor & REA Verifier): Verified quality, ran audits, documented failures

See `AGENTS.md`, `HARNESS.md`, and `HANDOFF.md` for complete details.

## File Count

- **Total Files**: 19
- **Markdown Files**: 16
- **HTML Files**: 1
- **Symlinks**: 2 (CLAUDE.md, GEMINI.md)

## Submission

For course submission:
1. Rename folder to `AI101_P4_[Last]_[First]`
2. Verify all CHECKLIST.md items
3. Push to GitHub repository shared with instructor

Due: Sunday, November 22, 2026 at 11:59 p.m.

## License

All code and documentation are provided for educational purposes. See `vibe-coding/disclosure.md` for AI contribution details.

---

**Project**: Waldo's Savannah  
**Course**: AI101 Project 4  
**Status**: Complete  
**Version**: 1.0  
**Last Updated**: 2026-11-15
