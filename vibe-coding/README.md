# Waldo's Savannah (Waldo Stripes Soft Edition)

A playful, nostalgic, zero-asset 3D crowd-search game set in historic Savannah, Georgia and the SCAD campus. Built inside the vibe-coding verification packet.

## Quick Start (Localhost Only)

### Option 1: Direct File Open
Simply open `vibe-coding/build/index.html` in any modern browser (Chrome, Firefox, Safari, Edge).

### Option 2: Local HTTP Server (Recommended)
For best results, serve the files on localhost:

```bash
# Navigate to the repository root
cd /path/to/AI101_P4_[Last]_[First]

# Start a Python HTTP server
python3 -m http.server 8000 --directory vibe-coding/build

# Open in browser
# Navigate to: http://localhost:8000
```

The game runs **100% offline** with no external dependencies. You can disconnect from the internet after loading and continue playing.

## Features

### 1. 100% Procedural Savannah Diorama
Every building, tree, prop, and animated person is generated in code with zero image or model files:
- **SCAD Poetter Hall** (342 Bull St., Madison Square) - Terracotta brick Richardsonian Romanesque fortress with SCAD Bee Gold roof banner
- **Forsyth Park & Fountain** - Lush green park square with 30-foot cast-iron white fountain, dyed green on St. Patrick's Day
- **Factors Walk & River Street** - Historic cotton warehouses connected by wrought-iron bridges over the Savannah River bluff
- **Seaside Festival Pier & Squares** - Coastal festival pier with red-and-white beacon tower, yellow and teal festival tents

### 2. Random Scene Every Refresh
A seeded Mulberry32 pseudo-random number generator rearranges town districts, festival tents, live oak trees, crowd paths, and Waldo's hiding spot on every page load. Use `?seed=SAVANNAH2026` to lock a specific layout for sharing.

### 3. Full Controls
- **Mouse**: Left-click drag to pan around the 3D town
- **Scroll Wheel**: Zoom in and out (clamped between 0.6x and 3.5x)
- **Keyboard**: Arrow keys or WASD to roam
- **Touch**: Tap and drag to pan, pinch to zoom

### 4. Local Top 10 Leaderboard & Share Link
- **Leaderboard**: Fastest times are saved privately on your own machine via localStorage
- **Sorting**: By time (fastest first), then by fewest wrong guesses
- **Share**: Copy a URL with `?seed=` parameter to challenge friends with the exact same town layout
- **Reset**: Clear your local leaderboard with the "Reset local leaderboard" button

### 5. Friendly Fallback State
If scene setup encounters an error (or you click "Test fallback state"), a warm storybook card appears with:
- Friendly message: "Our festival tent caught a sea breeze!"
- Explanation of what happened
- "Try a new scene" recovery button to generate a fresh layout

Test the fallback state with: `http://localhost:8000/?fallback=1`

## How to Play

1. **Read the Intro Card**: Learn the 3-step storybook instructions
2. **Click "Start Round"**: The timer begins counting
3. **Find Waldo**: Search the crowd for the ONE person wearing all five traits:
   - Red & white striped shirt
   - Striped bobble hat with white pom-pom
   - Round glasses
   - Blue trousers
   - Walking stick
4. **Click Waldo**: Victory! Your time and wrong guesses are recorded
5. **Save Your Score**: Enter your nickname to join the Top 10 leaderboard
6. **Share or Play Again**: Copy your share link or start a new random town

## What It Will NOT Do

- **No internet connection required**: Works completely offline
- **No external assets**: No downloaded images, models, or fonts
- **No accounts or login**: No user accounts, no sign-up
- **No analytics or tracking**: No telemetry, no cookies, no data collection
- **No ads**: Completely ad-free
- **No external API calls**: All data stays on your machine
- **No browser extensions**: Runs in standard browsers without plugins

## Known Limits

| Limit | Reason | Mitigation |
|-------|--------|------------|
| Max 10,000 NPCs | Performance target (60 FPS) | Default is 420 for instant responsiveness; use `?crowd=10000` to test maximum |
| Single-page app | vibe-coding requirement | All functionality in one HTML file |
| localStorage only | Privacy requirement | Leaderboard persists per browser on your machine |
| 2D Canvas | Zero-dependency requirement | Uses orthographic projection for 3D effect without WebGL |
| No sound | Zero-asset requirement | Visual feedback only |

## Technical Details

### Performance Budget (60 FPS Target)
- Crowd update: 4.2ms
- Landmark/foliage draw: 3.8ms
- Hit-test/pan math: 1.1ms
- DOM HUD update: 0.8ms
- Headroom: 6.7ms
- **Total frame budget: 16.6ms**

### Camera Specifications
- **Projection**: Orthographic (no perspective distortion)
- **Elevation**: 45° tilt (Math.PI / 4 radians)
- **Azimuth**: 15° rotation (Math.PI / 12 radians)
- **Zoom range**: 0.6x to 3.5x

### Color System (80/15/5 Rule)
- **80% Calm Storybook Canvas**: Warm Sand (#F6EFE6), Sweet Tea Cream (#FFFDF9), Cocoa Brown (#3E2723)
- **15% Historic Savannah Tokens**: Poetter Hall Terracotta (#C86D51), Forsyth Cast-Iron White (#F4F6F7), Factors Walk Wrought Iron (#4A5559)
- **5% Nickelodeon Whimsical Pop**: Forsyth Slime Mint (#00E676), SCAD Bee Gold (#FFCA28), Jellyfish Splat Violet (#7C4DFF)

### Typography
- **Display**: Fraunces, Fredoka, Cooper Black, Georgia (serif)
- **Body**: Plus Jakarta Sans, Quicksand, system sans-serif
- **Monospace**: Space Mono, JetBrains Mono, system monospace
- **Features**: font-variant-numeric: tabular-nums for timer and counters

## Testing & Verification

### Deterministic URL Parameters

Use these URL parameters for testing and grading:

| Parameter | Example | Purpose |
|-----------|---------|---------|
| `seed` | `?seed=SAVANNAH2026` | Locks town layout and Waldo position for reproducible testing |
| `fallback` | `?fallback=1` | Forces Friendly Fallback State to test recovery |
| `beacon` | `?beacon=1` | Draws green verification halo around Waldo for inspection |
| `crowd` | `?crowd=10000` | Sets crowd density (default: 420, max: 10000) |

### Testing Commands

```bash
# Start the server
python3 -m http.server 8000 --directory vibe-coding/build

# Test default layout
open http://localhost:8000

# Test deterministic seed
open http://localhost:8000/?seed=SAVANNAH2026

# Test fallback state
open http://localhost:8000/?fallback=1

# Test with beacon (for grading)
open http://localhost:8000/?seed=SAVANNAH2026&beacon=1

# Test maximum crowd
open http://localhost:8000/?crowd=10000
```

## Browser Compatibility

Tested and working on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Note**: Uses modern JavaScript (const, let, arrow functions, template literals). Requires ES2015+ compatible browser.

## File Structure

```
vibe-coding/
├── README.md              # This file
├── START-HERE.md          # Project orientation
├── CHECKLIST.md           # Submission checklist
├── plan.md                # Execution plan
├── prd.md                 # Product requirements
├── reflection.md          # Project reflection
├── disclosure.md          # AI disclosure
├── build/
│   ├── index.html          # The illustrated game
│   └── js/                 # game.js + assets.bundle.js (generated by tools/build.mjs)
├── sources/
│   └── source-index.md     # Research sources
├── decisions/
│   └── ADR-001.md          # Architecture decisions
└── build-record/
    ├── ai-use-log.md              # AI usage documentation
    ├── testing-and-failure-log.md # Testing results
    └── tests/
        └── README.md              # Test parameters
```

## Architecture Reference

This project is built on three technical lineages:
1. **vibe-coding packet**: Academic documentation and verification structure
2. **tiny-savannah**: Multi-agent skill harness (unslop, pixel-worlds, harness-engineering, isometric-city-map, interactive-map-app)
3. **morluto/rea**: Reverse-engineering inspection workflow

For more details, see:
- `HARNESS.md` (root level) - Multi-agent engineering rules
- `HANDOFF.md` (root level) - Interface contracts and state machine
- `AGENTS.md` (root level) - Agent roles and execution workflow

## License & Attribution

- **Code**: Written by the project author with AI assistance
- **Design**: Cognitive UX & Whimsical Design System
- **Inspiration**: Waldo Stripes Soft, Tiny London, Tiny Savannah
- **Landmark Data**: Public domain Savannah/SCAD historical records

See `disclosure.md` for full AI contribution disclosure.

---

**Project**: Waldo's Savannah  
**Version**: 1.0  
**Last Updated**: 2026-11-15  
**Status**: Complete and ready for submission
