# Agent Orchestration: Waldo's Savannah

This AGENTS.md defines the three-agent tandem workflow for building Waldo's Savannah, including agent roles, capabilities, execution order, and coordination mechanisms.

## Agent Architecture Overview

The project uses a **spec-driven, three-agent tandem** approach with non-overlapping scopes:

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN (Project Lead)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Phase 1: Pre-Prompt Foundation                            ││
│  │  - Initialize directory structure                          ││
│  │  - Populate specification artifacts (prd.md, plan.md, etc.) ││
│  │  - Extract architectural keys via REA                      ││
│  │  - Create HARNESS.md, HANDOFF.md, AGENTS.md                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AGENT 1    │     │  AGENT 2    │     │  AGENT 3    │
│             │     │             │     │             │
│ 3D World &  │     │ Cognitive   │     │ Harness QA, │
│  Math       │     │  UX/UI      │     │ Unslop     │
│  Architect  │     │  Engineer   │     │  Auditor    │
└─────────────┘     └─────────────┘     └─────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Phase 2:    │   │ Phase 2:    │   │ Phase 2:    │
    │ Build 3D    │   │ Build UI    │   │ Verify &    │
    │ Engine      │   │ & HUD       │   │ Test        │
    └─────────────┘   └─────────────┘   └─────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Phase 3:        │
                    │ Verification &  │
                    │ Finalization    │
                    └─────────────────┘
```

## Agent 1: Procedural 3D World & Math Architect

### Role Definition
**Primary Responsibility**: Build the zero-asset procedural 3D isometric engine that renders Savannah landmarks, crowds, and Waldo with orthographic projection.

### Capabilities & Skills
- **Mathematical**: Orthographic projection matrices, 45°/15° camera math, depth sorting
- **Algorithmic**: Mulberry32 PRNG, Fisher-Yates shuffle, Euclidean distance calculations
- **Architectural**: Modular 3D rendering pipeline, batching/instancing for performance
- **Reference**: Tiny London orthographic spec, pixel-worlds procedural patterns

### Owned Deliverables
1. **Core 3D Engine** (`vibe-coding/build/index.html` - 3D layer)
   - Orthographic camera with 45° elevation, 15° azimuth
   - `project3D(wx, wy, wz)` - 3D to 2D projection with depth
   - Seeded PRNG for deterministic scene generation
   - Savannah landmark generation (Poetter Hall, Forsyth Fountain, Factors Walk, Festival Pier)
   - Prop generation (Live Oak trees, Festival Tents)
   - Crowd animation with sine-wave walk/bob
   - Waldo spawning with 5-trait uniqueness
   - Euclidean hit detection on click

2. **Camera & Navigation System**
   - Mouse drag pan
   - Scroll wheel zoom (0.6x - 3.5x clamped)
   - Arrow keys/WASD keyboard panning
   - Smooth velocity-based movement

3. **World State Management**
   - Landmark positions
   - Prop positions
   - Crowd NPC data
   - Waldo position and metadata
   - Depth sorting for painter's algorithm

### Inputs Required
- HARNESS.md (color system, landmark specs, Waldo traits)
- HANDOFF.md (interface contracts, shared state)
- Savannah/SCAD landmark research (ZONE-A/B/C/D specs)
- Tiny London camera math specifications

### Outputs Produced
- 3D rendering functions
- World generation functions
- Camera control logic
- Hit detection logic
- Scene state object

### Success Criteria
- [ ] Scene generates procedurally with zero external assets
- [ ] All 4 Savannah zones render correctly
- [ ] Camera controls work smoothly (drag, zoom, keyboard)
- [ ] Crowd animation runs at 60 FPS with 10,000 NPCs
- [ ] Waldo has exactly 5 unique traits
- [ ] Decoys share at most 1-2 traits
- [ ] Click detection triggers only when pointer movement < 6px
- [ ] Deterministic replay via ?seed= works correctly

### Tools & References
- **REA**: For inspecting Tiny London reference implementation
- **pixel-worlds**: For procedural rendering patterns
- **harness-engineering**: For performance optimization
- **isometric-city-map**: For orthographic projection reference

---

## Agent 2: Cognitive UX, Storybook UI & Copy Engineer

### Role Definition
**Primary Responsibility**: Build the storybook UI, HUD, and copy that feels like a ten-year-old's creation while maintaining graduate-level precision underneath.

### Capabilities & Skills
- **Design Systems**: 80/15/5 color rule implementation
- **Typography**: Google Fonts integration with system fallbacks
- **UI/UX**: Pill buttons, storybook cards, breathing room layout
- **Copywriting**: Child-readable instructions with unslop prose compliance
- **State Management**: UI state transitions, overlay management
- **Persistence**: localStorage leaderboard with proper sorting

### Owned Deliverables
1. **CSS Design System** (`vibe-coding/build/index.html` - CSS layer)
   - :root CSS variables for all color tokens
   - Warm Sand (#F6EFE6) background
   - Cocoa Brown (#3E2723) text
   - Coral Pink (#FF6F61) primary buttons
   - Nickelodeon Whimsical tokens (Slime Mint, Bee Gold, Jellyfish Violet)
   - Typography scale (Fraunces/Fredoka display, Plus Jakarta Sans body, Space Mono mono)
   - Pill button styling with 2px cocoa border, no drop shadows
   - Storybook card styling with 22-24px border radius
   - Responsive layout (workspace-grid)

2. **HUD & Telemetry**
   - Timer display with tabular-nums (00:00.0 format)
   - Wrong guesses counter
   - Seed display
   - Zone hint chip
   - Control hint chips

3. **Overlay Cards**
   - Intro card with How to Play, trait badges, Start Round button, Test Fallback button
   - Congrats card with victory message, nickname input, Save Time button, Copy Share Link button, Play New Random Town button
   - Fallback card with error message, Try a New Scene button

4. **Leaderboard System**
   - Top 10 local leaderboard display
   - Score saving with username input
   - Share link generation (?seed=)
   - Clear leaderboard button

5. **Toast System**
   - Whimsical splat toast for wrong guesses
   - Non-blocking, auto-dismissing
   - Jellyfish Splat Violet styling

6. **Copy & Microcopy**
   - All UI text in sentence case
   - No AI prose tells (no em dashes, no pleading, concrete language)
   - Child-readable instructions (3-step format)

### Inputs Required
- HARNESS.md (80/15/5 color rule, typography specifications)
- HANDOFF.md (state machine, shared state contracts)
- Cognitive UX Design Guide (color tokens, hierarchy principles)
- unslop UI rules (spacing, visual weight, accessibility)

### Outputs Produced
- CSS stylesheet
- HTML structure
- UI state management
- Event handlers (pointer, keyboard, button)
- Leaderboard persistence logic
- URL parameter handling

### Success Criteria
- [ ] UI passes unslop audit (spacing, color, icons, copy, type, layout, details, visuals, motion)
- [ ] All text is sentence case
- [ ] No heavy drop shadows (box-shadow: none)
- [ ] Generous breathing room (Warm Sand whitespace)
- [ ] Timer digits don't jitter (tabular-nums)
- [ ] All overlays display correctly
- [ ] Leaderboard persists in localStorage
- [ ] Share links work correctly
- [ ] All buttons have pill shape (border-radius: 9999px)
- [ ] Copy is child-readable and passes unslop prose check

### Tools & References
- **unslop**: For UI and prose auditing
- **pixel-worlds**: For frame-by-frame visual verification
- **tiny-savannah**: For storybook aesthetic reference

---

## Agent 3: Harness QA, Unslop Auditor & REA Verifier

### Role Definition
**Primary Responsibility**: Verify, test, and document the build. Run audits, capture failure modes, and ensure all quality gates are met.

### Capabilities & Skills
- **Testing**: Systematic failure mode identification
- **Verification**: Frame-by-frame visual inspection
- **Auditing**: unslop UI and prose checks
- **Documentation**: Build record logging, ADR authoring
- **Debugging**: Root cause analysis
- **REA**: Reverse engineering inspection

### Owned Deliverables

1. **Verification Framework**
   - Frame capture across all states (Intro, Active Search, Congrats, Fallback)
   - Side-by-side contact sheets for visual verification
   - Performance measurement (60 FPS target)
   - Accessibility audit

2. **Failure Mode Documentation**
   - FAIL-01: Camera drag counted as wrong guess → Fixed with < 6px threshold
   - FAIL-02: Waldo overlapped with landmarks → Fixed with radial offset
   - FAIL-03: Timer digits jittered → Fixed with tabular-nums
   - FAIL-04: Offline CDN failure → Fixed with try/catch + fallback state
   - Build record: `vibe-coding/build-record/testing-and-failure-log.md`

3. **AI Use Log**
   - Session-by-session documentation
   - Skills invoked and tasks performed
   - Human review and modifications applied
   - File: `vibe-coding/build-record/ai-use-log.md`

4. **Test Parameters**
   - Deterministic URL testing suite
   - ?seed= for reproducible layouts
   - ?fallback=1 for fallback state testing
   - ?beacon=1 for Waldo verification
   - ?crowd= for performance testing
   - File: `vibe-coding/build-record/tests/README.md`

5. **Quality Gates**
   - CHECKLIST.md verification
   - unslop UI audit pass
   - unslop prose audit pass
   - Privacy compliance check (zero external requests)
   - Performance check (60 FPS with 10,000 NPCs)

6. **Final Documentation**
   - reflection.md (human-written, "Weight, Not Weight Loss" voice)
   - disclosure.md (AI tools, skills, contributions)
   - Verification that all vibe-coding packet files are complete

### Inputs Required
- HARNESS.md (quality gates, failure mode handling)
- HANDOFF.md (interface contracts for verification)
- All artifacts from Agent 1 and Agent 2
- tiny-savannah skills (unslop, pixel-worlds, harness-engineering)

### Outputs Produced
- `vibe-coding/build-record/ai-use-log.md`
- `vibe-coding/build-record/testing-and-failure-log.md`
- `vibe-coding/build-record/tests/README.md`
- `vibe-coding/reflection.md`
- `vibe-coding/disclosure.md`
- CHECKLIST.md verification
- unslop audit results

### Success Criteria
- [ ] All four failure modes identified and fixed
- [ ] All tests pass in both Cycle 1 and Cycle 2
- [ ] AI Use Log is complete and accurate
- [ ] Testing & Failure Log documents all edge cases
- [ ] All CHECKLIST.md items verified
- [ ] unslop UI audit passes
- [ ] unslop prose audit passes
- [ ] reflection.md written in proper voice
- [ ] disclosure.md complete and accurate

### Tools & References
- **REA (rea-agents)**: For static JavaScript inspection
- **unslop**: For UI and prose auditing
- **pixel-worlds (look.mjs)**: For frame stepping and capture
- **pixel-worlds (snapshot.mjs)**: For contact sheet generation
- **harness-engineering**: For project structure verification

---

## Agent Coordination Protocol

### Sequential Execution (Phase 2)

While agents have non-overlapping scopes, they execute in sequence with clear handoffs:

```
1. Agent 1: Build 3D Engine
   ├── Generate orthographic projection system
   ├── Create landmark generation
   ├── Build crowd animation system
   ├── Implement Waldo spawning
   └── Output: Working 3D scene in index.html

2. Agent 2: Build UI & HUD
   ├── Layer CSS design system on top of Agent 1's canvas
   ├── Add HUD overlays and telemetry
   ├── Implement leaderboard and share links
   ├── Add all overlay cards
   └── Output: Complete interactive game

3. Agent 3: Verify & Test
   ├── Run unslop audits on Agent 2's UI
   ├── Verify Agent 1's performance
   ├── Document all sessions and findings
   └── Output: Complete build-record/ + final docs
```

### Shared Artifact Flow

```
HARNESS.md + HANDOFF.md + AGENTS.md
         │
         ▼
┌──────────────────────────────────┐
│     Pre-Prompt Foundation        │ ← HUMAN
│  (prd.md, plan.md, source-index) │
└──────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Agent 1   Agent 2
(3D)      (UI)
    │         │
    └────┬────┘
         │
         ▼
   index.html (v1)
         │
         ▼
   Agent 3
   (QA)
         │
         ▼
┌──────────────────────────────────┐
│  Final Packet Verification       │ ← HUMAN
│  (CHECKLIST.md, reflection, etc.)│
└──────────────────────────────────┘
```

### Communication Channels

1. **HARNESS.md**: Single source of truth for architectural rules
2. **HANDOFF.md**: Interface contracts and state machine
3. **vibe-coding/ files**: Shared specification artifacts
4. **build/index.html**: Shared build artifact (each agent adds its layer)

---

## Execution Commands

### For Claude Code / Cursor / Codex Users

```bash
# Navigate to project directory
cd /path/to/waldos-savannah

# Agent 1: Build 3D Engine
# (Run in Claude Code with skills/ directory accessible)

# Agent 2: Build UI & HUD
# (Run in separate Claude Code session or after Agent 1 completes)

# Agent 3: Verify & Test
# (Run after Agents 1 & 2 complete)

# Or use delegate_task for parallel execution (if supported)
```

### For REA MCP Server Setup

```bash
# Install and configure REA MCP Server
npm install --global rea-agents
npx rea-agents@latest setup

# Analyze reference architectures
npx -y rea-agents@latest analyze-javascript-application /path/to/reference-app --json
```

### For Skills Installation

```bash
# Install core skills
npx skills add asavvin-pixel/unslop --all -g -y
npx skills add finktheartist/pixel-worlds
```

---

## Quality Assurance Checklist

Before any agent signs off, verify:

### Agent 1 Checklist
- [ ] Orthographic projection uses 45° elevation, 15° azimuth
- [ ] All 4 Savannah zones generate correctly
- [ ] Crowd animation runs at 60 FPS with 10,000 NPCs
- [ ] Waldo has exactly 5 unique traits
- [ ] Decoys share at most 1-2 traits
- [ ] Camera controls (drag, zoom, keyboard) work smoothly
- [ ] Click detection uses < 6px threshold
- [ ] Seeded PRNG produces deterministic results
- [ ] try/catch wraps scene generation with fallback

### Agent 2 Checklist
- [ ] All CSS variables match 80/15/5 color rule
- [ ] Typography uses correct font stack with fallbacks
- [ ] All text is sentence case
- [ ] No heavy drop shadows (box-shadow: none)
- [ ] Generous breathing room (Warm Sand whitespace)
- [ ] Timer uses tabular-nums
- [ ] All overlays display correctly
- [ ] Leaderboard persists and sorts correctly
- [ ] Share links work with ?seed=
- [ ] All buttons have pill shape
- [ ] Copy passes unslop prose check

### Agent 3 Checklist
- [ ] All four failure modes documented
- [ ] AI Use Log is complete
- [ ] Testing & Failure Log is complete
- [ ] Test URL parameters work (?seed=, ?fallback=1, ?beacon=1, ?crowd=)
- [ ] CHECKLIST.md all items verified
- [ ] unslop UI audit passes
- [ ] unslop prose audit passes
- [ ] reflection.md written in proper voice
- [ ] disclosure.md complete

---

## Agent Name Mapping

| Agent Reference | Internal Name | Provider | Model |
|----------------|---------------|----------|-------|
| Agent 1 | Procedural 3D World & Math Architect | Any | Any |
| Agent 2 | Cognitive UX, Storybook UI & Copy Engineer | Any | Any |
| Agent 3 | Harness QA, Unslop Auditor & REA Verifier | Any | Any |

For delegation across providers:
- Use `delegate_task` with `target.provider` and `target.model`
- Maintain separate checkouts per agent if needed

---

**Status**: Active | **Version**: 1.0 | **Last Updated**: 2026-11-15
