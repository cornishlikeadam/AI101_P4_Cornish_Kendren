> Historical version 1. Body below is copied unchanged from commit c4b8bbc. Superseded by ADR-002 (2026-11-15). Kept for traceability; not an active instruction.

# Atomic State & Interface Contract: Waldo's Savannah

This HANDOFF.md defines the synchronization points, state contracts, and interface boundaries between the three agents building Waldo's Savannah.

## State Machine Contract

The application operates as a deterministic finite state machine with these states:

```
┌─────────────────────────────────────────────────────────────┐
│                         INITIALIZE                            │
│  (Parse URL params, set up canvas, load from localStorage)   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                          INTRO                                │
│  (Show storybook card with How to Play, trait badges,        │
│   Start Round button, Test Fallback button)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   ┌──────────┐              ┌───────────────┐
   │ PLAYING  │              │  FALLBACK     │
   │          │              │               │
   │ (Active │              │ (Friendly     │
   │  game:  │              │  recovery     │
   │  timer  │              │  state with   │
   │  running,│              │  "Try a new   │
   │  crowd   │              │  scene"       │
   │  animated│              │  button)      │
   │  )       │              │               │
   └────┬─────┘              └──────┬────────┘
        │                           │
        │                    ┌──────┴──────┐
        │                    │ (retry)    │
        │                    ▼            │
        │              ┌──────────────┐
        │              │   INTRO      │
        └─────────────►│ (new scene) │◄───────┘
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │     PLAYING   │
                       │  (new round)  │
                       └──────────────┘
                              │
        ┌─────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                         WON                                  │
│  (Congrats overlay: victory ring, final time, wrong guesses, │
│   nickname input, Save Time button, Copy Share Link button,  │
│   Play New Random Town button)                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   ┌──────────┐              ┌───────────────┐
   │ PLAYING  │              │   INTRO       │
   │ (new     │              │               │
   │  random  │              │               │
   │  scene)  │              │               │
   └──────────┘              └───────────────┘
```

## State Transitions & Triggers

| From State | To State | Trigger | Responsible Agent |
|------------|----------|---------|-------------------|
| INITIALIZE | INTRO | DOMContentLoaded + canvas ready | Agent 1 + 2 |
| INTRO | PLAYING | Click Start Round button | Agent 2 |
| INTRO | FALLBACK | Click Test Fallback button OR scene setup fails | Agent 1 |
| PLAYING | WON | Click on Waldo (distance <= 18px * zoom) | Agent 1 |
| PLAYING | PLAYING | Click on decoy NPC (distance > 18px * zoom) | Agent 1 |
| WON | PLAYING | Click Play New Random Town | Agent 1 |
| WON | INTRO | Click Play New Random Town | Agent 2 |
| FALLBACK | INTRO | Click Try a New Scene button | Agent 1 |

## Shared Global State Contract

### Game State Object (Agent 1 Owned, Agent 2 Consumes)

```javascript
const gameState = {
  // Phase enum
  phase: 'INTRO' | 'PLAYING' | 'WON' | 'FALLBACK',
  
  // Timing
  startTime: number,        // performance.now() when round started
  elapsedMs: number,        // Current elapsed time in milliseconds
  
  // Score tracking
  wrongGuesses: number,     // Incremented on decoy clicks
  scoreSavedThisRound: boolean, // Prevents double-saving
  
  // World state
  currentSeed: string,      // Deterministic seed (SAV-XXXX format)
  crowdCount: number        // Number of NPCs + Waldo
}
```

### World Object (Agent 1 Owned, Agent 1+2 Consume)

```javascript
const world = {
  landmarks: Array<{
    type: 'POETTER_HALL' | 'FORSYTH_FOUNTAIN' | 'FACTORS_WALK' | 'FESTIVAL_PIER',
    x: number,
    z: number,
    label: string
  }>,
  props: Array<{
    type: 'LIVE_OAK' | 'FESTIVAL_TENT',
    x: number,
    z: number,
    scale: number,
    color: string
  }>,
  people: Array<{
    isWaldo: boolean,
    x: number,
    z: number,
    baseX: number,
    baseZ: number,
    phase: number,
    speed: number,
    walkRadius: number,
    shirtColor: string,
    pantColor: string,
    hasStripes: boolean,
    stripeColor: string,
    hasBobble: boolean,
    hasGlasses: boolean,
    hasStick: boolean,
    role: string,
    districtName?: string,
    screenX: number,
    screenY: number
  }>,
  waldo: Person | null
}
```

### Camera Object (Agent 1 Owned, Agent 1+2 Consume)

```javascript
const cam = {
  panX: number,              // Horizontal pan offset
  panY: number,              // Vertical pan offset
  zoom: number,              // Current zoom level (0.6 - 3.5)
  azimuth: number,           // 15° in radians (Math.PI / 12)
  elevation: number,         // 45° in radians (Math.PI / 4)
  velX: number,              // Keyboard pan velocity X
  velY: number               // Keyboard pan velocity Y
}
```

## Interface Contract: Agent 1 → Agent 2

### Functions Agent 1 Provides

```javascript
// Core projection math (Tiny London spec)
function project3D(wx: number, wy: number, wz: number): { x: number, y: number, depth: number }

// World generation
function generateSavannahScene(seedStr: string): void

// PRNG
function createPRNG(seedString: string): () => number

// Geometry rendering
function drawIsoBox(wx: number, wy: number, wz: number, w: number, h: number, d: number, topCol: string, leftCol: string, rightCol: string): void

// Render loop
function renderScene(now: number): void

// Hit detection
function checkWaldoClick(clickX: number, clickY: number): boolean
```

### Functions Agent 2 Provides

```javascript
// UI state management
function updateHUD(): void
function showSplatToast(message: string): void
function showOverlay(overlayId: 'intro' | 'congrats' | 'fallback' | 'none'): void

// Leaderboard management
function saveScore(username: string, elapsedMs: number, wrongGuesses: number, seed: string): void
function loadLeaderboard(): Array<LeaderboardEntry>
function clearLeaderboard(): void

// URL parameter handling
function parseURLParams(): { seed: string, fallback: boolean, beacon: boolean, crowd: number }
function generateShareURL(seed: string): string
```

## Interface Contract: Agent 3 → All Agents

### Verification Functions (Agent 3 Provides)

```javascript
// Visual frame inspection
function captureFrame(state: 'INTRO' | 'PLAYING' | 'WON' | 'FALLBACK'): ImageData

// Performance measurement
function measureFrameTime(): number

// Color hierarchy audit
function auditColorUsage(): ColorAuditResult

// Prose quality audit
function auditProse(): ProseAuditResult
```

## Canvas Contract

The `<canvas id="savannahCanvas">` element is the shared rendering surface:

- **Agent 1**: Draws all 3D content (landmarks, props, people, ground, water)
- **Agent 2**: Manages canvas size, handles pointer events, updates HUD overlays
- **Agent 3**: Captures frames for verification, does NOT draw to canvas

## Event Handling Contract

### Pointer Events (Agent 2 Owned)

```javascript
canvas.addEventListener('pointerdown', handlePointerDown)
canvas.addEventListener('pointermove', handlePointerMove)
canvas.addEventListener('pointerup', handlePointerUp)
canvas.addEventListener('wheel', handleWheel)
```

**Disambiguation Rule (FAIL-01 Fix)**:
- Record `downX`, `downY` on `pointerdown`
- Calculate `moveDist = Math.hypot(upX - downX, upY - downY)` on `pointerup`
- If `moveDist < 6`: Treat as click (pass to Agent 1 for hit detection)
- If `moveDist >= 6`: Treat as drag (Agent 1 pans camera)

### Keyboard Events (Agent 2 Owned)

```javascript
window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)
```

- Arrow keys/WASD: Set `cam.velX` and `cam.velY`
- Agent 1 consumes these in `renderScene()` for smooth panning

## URL Parameter Contract

All agents must respect these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `seed` | string | Random SAV-XXXX | Deterministic town layout and Waldo position |
| `fallback` | 0/1 | 0 | Force Friendly Fallback State for testing |
| `beacon` | 0/1 | 0 | Draw verification halo around Waldo for grading |
| `crowd` | integer | 420 | Number of NPCs (1-10000) |

**Agent 1** is responsible for parsing these on initialization.
**Agent 2** is responsible for generating share URLs with the current seed.
**Agent 3** is responsible for testing all parameter combinations.

## Local Storage Contract

### Schema

```javascript
// Key
const STORAGE_KEY = 'waldos_savannah_leaderboard_v1'

// Value type
interface LeaderboardEntry {
  username: string      // Player's chosen nickname
  elapsedMs: number     // Time to find Waldo in milliseconds
  wrongGuesses: number  // Number of wrong clicks
  seed: string           // The seed used for this game
}

// Storage format
// Value: JSON.stringify(LeaderboardEntry[])
// Max length: 10 entries
// Sort order: elapsedMs ascending, then wrongGuesses ascending
```

### Operations

- **Read**: `JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')`
- **Write**: `localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))`
- **Clear**: `localStorage.removeItem(STORAGE_KEY)`

**Agent 2** owns all localStorage operations.
**Agent 3** verifies persistence and sorting logic.

## Error Handling Contract

### Scene Generation (Agent 1)

```javascript
function generateSavannahScene(seedStr: string) {
  try {
    // Generate scene...
    if (forceFallback && gameState === 'INTRO') {
      throw new Error('Simulated fallback requested via URL parameter');
    }
    // ... generation logic
  } catch (err) {
    gameState = 'FALLBACK';
    showOverlay('fallback');
    console.error('Scene generation failed:', err);
  }
}
```

**Fallback State** must display:
- Friendly message: "Our festival tent caught a sea breeze!"
- Explanation: "The 3D town scene could not be set up... we can spin up a fresh Savannah layout immediately."
- Recovery button: "Try a new scene" → Re-seeds and retries scene generation

## Synchronization Checklist

Before any agent completes its work, verify:

- [ ] All shared state objects use consistent naming
- [ ] All interface functions have JSDoc comments
- [ ] All URL parameters are parsed and respected
- [ ] All error conditions trigger fallback gracefully
- [ ] All state transitions are deterministic
- [ ] No race conditions in shared state access
- [ ] All agents can co-exist in the same runtime context

---

**Status**: Active | **Version**: 1.0 | **Last Updated**: 2026-11-15
