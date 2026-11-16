# Project 4 packet: Waldo's Savannah

Every file you need for Project 4 is in this folder, already arranged the way the brief asks for. The full brief is on the course site: [Vibe Coding](https://ai-101-v4.vercel.app/projects/vibe-coding).

## What this project is

**Waldo's Savannah** is a zero-asset, procedurally generated 3D crowd-search game set across the Savannah College of Art and Design (SCAD) campus and historic Savannah waterfront. Built entirely on localhost with zero external dependencies.

### The Storybook Experience
Imagine a giant, sunny toy box version of Savannah, Georgia during a seaside art festival. Hundreds of tiny animated people are walking around SCAD buildings, park fountains, and riverfront bridges. Somewhere in that crowd is Waldo, wearing his iconic red-and-white striped shirt, bobble hat, round glasses, blue trousers, and walking stick. Every time you refresh the page, the whole town rearranges itself and Waldo picks a brand-new hiding spot!

### The Graduate-Level Engineering
Underneath that playful ten-year-old storybook experience is a production-grade procedural 3D web application:

- **Zero external assets**: No downloaded .gltf models, no external .png textures, and no external fonts required to run. Every building, tree, prop, and animated person is generated through procedural 3D isometric geometry and canvas rendering.
- **100% localhost privacy**: No accounts, no analytics, no tracking pixels, and no external API calls. The Top 10 Leaderboard saves directly to the player's machine via localStorage.
- **Resilient fallback engineering**: If 3D scene setup encounters an error or a user triggers the fallback test, a friendly Storybook Fallback State catches the condition and lets the player generate a fresh scene immediately.

## How to navigate this packet

| Action | File | Description |
|--------|------|-------------|
| To play the game right now | `build/index.html` | Open directly in a browser or serve via `python3 -m http.server 8000 --directory vibe-coding/build` |
| To read the product specification | `prd.md` | Dual-register requirements (10-year-old story + graduate engineering spec) |
| To review the 3-agent build plan | `plan.md` | Three-agent tandem execution workflow |
| To inspect Savannah & technical research | `sources/source-index.md` | Complete research dossier on reference repos and Savannah landmarks |
| To review architectural decisions | `decisions/` | Architecture Decision Records (ADR-001, etc.) |
| To audit AI usage | `build-record/ai-use-log.md` | Session-by-session AI usage documentation |
| To review testing results | `build-record/testing-and-failure-log.md` | Failure modes and verified fixes |
| To read the reflection | `reflection.md` | Project reflection in "Weight, Not Weight Loss" voice |
| To see AI contributions | `disclosure.md` | Full disclosure of AI tools, skills, and contributions |
| To verify submission | `CHECKLIST.md` | Pre-submission verification checklist |

## Project Structure

```
vibe-coding/
├── START-HERE.md          # You are here
├── README.md              # Quick-start instructions and feature summary
├── CHECKLIST.md           # Pre-submission verification checklist
├── plan.md                # Five-line execution plan
├── prd.md                 # Product Requirements Document
├── reflection.md          # Project reflection
├── disclosure.md          # AI contribution disclosure
├── build/
│   ├── index.html          # The illustrated game (opens from disk)
│   └── js/                 # game.js and assets.bundle.js, written by tools/build.mjs
├── sources/
│   └── source-index.md     # Research dossier
├── decisions/
│   └── ADR-001-template.md # Architecture Decision Record template
└── build-record/
    ├── ai-use-log.md               # AI usage log
    ├── testing-and-failure-log.md # Testing and failure documentation
    └── tests/
        └── README.md               # Test parameters and instructions
```

## Dual-Register Design Philosophy

This project embodies the **Cognitive UX & Whimsical Design System** with two simultaneous registers:

### Surface Level: Ten-Year-Old Storybook
- Warm, nostalgic coastal palette
- Simple, joyful microcopy
- Tactile, toy-like interface
- Effortless to understand and play

### Underlying Level: Graduate Design Professor
- Orthographic 45°/15° projection math
- Mulberry32 seeded PRNG
- Batched instancing for 10,000 NPCs
- Euclidean hit detection
- Painter's algorithm depth sorting

**The consistency is in the commit log. The precision is in the code.**

## Key Features

1. **Procedural 3D Savannah Diorama**: Four distinct zones (SCAD Poetter Hall, Forsyth Park Fountain, Factors Walk, Seaside Festival Pier) generated in code
2. **Seeded Randomization**: Every refresh generates a new town layout; ?seed= parameter allows sharing exact layouts
3. **Full Controls**: Mouse drag to pan, scroll wheel to zoom, Arrow keys/WASD to roam
4. **Local Top 10 Leaderboard**: Persists to localStorage on your machine
5. **Share Link**: Copy a URL with ?seed= to challenge friends with the exact same layout
6. **Friendly Fallback State**: Graceful error handling with recovery options

## Privacy & Compliance

- **Zero external assets**: All visuals generated mathematically at runtime
- **100% localhost execution**: Zero external network requests
- **No tracking**: No analytics, no cookies, no telemetry
- **Privacy compliant**: Only stores leaderboard data in your own browser's localStorage

## Technical Stack

- **Rendering**: Pure HTML5 Canvas 2D with orthographic projection
- **Math**: Mulberry32 PRNG, 45°/15° orthographic camera
- **UI**: CSS Design System with 80/15/5 color rule
- **Storage**: localStorage API
- **Framework**: Zero dependencies - runs in any modern browser

## Submit

When complete, name the folder `AI101_P4_[Last]_[First]` and push it to the GitHub repository shared with the instructor.

Due Sunday, November 22, 2026 at 11:59 p.m.
