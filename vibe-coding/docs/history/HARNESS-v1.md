> Historical version 1. Body below is copied unchanged from commit c4b8bbc. Superseded by ADR-002 (2026-11-15). Kept for traceability; not an active instruction.

# Multi-Agent Engineering Harness: Waldo's Savannah

This HARNESS.md establishes the operating contract for the three-agent tandem build of **Waldo's Savannah** — a zero-asset, procedurally generated 3D crowd-search game.

## Non-Overlapping Agent Scopes

The build is partitioned across three specialized agents to prevent context collisions and ensure architectural precision:

| Agent | Role | Owned Scope | Deliverables |
|-------|------|-------------|--------------|
| **Agent 1** | Procedural 3D World & Math Architect | Orthographic 45°/15° camera, Mulberry32 PRNG, Savannah landmarks, crowd animation, Euclidean hit detection | `vibe-coding/build/index.html` (3D engine core) |
| **Agent 2** | Cognitive UX, Storybook UI & Copy Engineer | Warm Sand/Cocoa/Coral + Nickelodeon Whimsical CSS tokens, HUD, timer, leaderboard, fallback state | `vibe-coding/build/index.html` (UI layer) |
| **Agent 3** | Harness QA, Unslop Auditor & REA Verifier | unslop UI/prose checks, frame inspections, testing/failure logs, verification | `vibe-coding/build-record/` artifacts + CHECKLIST.md |

## Shared Contracts

### 1. Zero-Asset Mandate
- **No external image files**: No .png, .jpg, .webp textures
- **No external 3D models**: No .glb, .gltf, .obj files
- **No external network requests**: 100% localhost execution
- **No CDN dependencies**: All code self-contained in index.html

### 2. Savannah/SCAD Landmark Specifications
All procedural geometry must reference verified architectural data:
- **ZONE-A**: SCAD Poetter Hall (342 Bull St., Madison Square) - Terracotta brick (#C86D51) Richardsonian Romanesque
- **ZONE-B**: Forsyth Park & Fountain - Cast-iron white (#F4F6F7) multi-tier fountain on lush green square (#689F77)
- **ZONE-C**: Factors Walk & River Street - Wrought iron bridges (#4A5559) over brick warehouses (#A96E54)
- **ZONE-D**: Seaside Festival Pier & Oglethorpe Squares - Red-and-white beacon tower, festival tents

### 3. Cognitive Color System (80/15/5 Rule)
- **80% Calm Storybook Canvas**: Warm Sand (#F6EFE6), Cocoa Brown (#3E2723), Coral Pink (#FF6F61)
- **15% Historic Savannah Tokens**: Poetter Hall Terracotta (#C86D51), Forsyth Cast-Iron White (#F4F6F7), Factors Walk Wrought Iron (#4A5559)
- **5% Nickelodeon Whimsical Pop**: Forsyth Slime Mint (#00E676), SCAD Bee Gold (#FFCA28), Jellyfish Splat Violet (#7C4DFF)

### 4. Waldo's Five Mandatory Traits
The single Waldo character MUST have ALL five attributes:
1. Red (#E53935) and white (#FFFFFF) horizontal striped shirt
2. Striped bobble hat with white pom-pom
3. Round glasses (two dark cocoa rings)
4. Blue trousers (#1E88E5)
5. Wooden walking stick (#8D6E63)

**Decoy Constraint**: NPCs may share at most 1-2 of these 5 traits to ensure conjunction search is required.

### 5. Camera & Navigation Contract
- **Projection**: Orthographic with 45° elevation tilt, 15° azimuth rotation (Tiny London spec)
- **Controls**: Mouse drag pan, scroll wheel zoom (0.6x-3.5x clamped), Arrow keys/WASD
- **Pointer Disambiguation**: Click only fires if pointer movement < 6 pixels between pointerdown and pointerup

### 6. URL Query Parameter Contract
For deterministic testing and grading:
- `?seed=SAVANNAH2026` - Locks town layout and Waldo position
- `?fallback=1` - Forces Friendly Fallback State
- `?beacon=1` - Draws verification halo around Waldo
- `?crowd=10000` - Sets crowd density (default: 420, max: 10000)

### 7. Local Storage Schema
- **Key**: `waldos_savannah_leaderboard_v1`
- **Value**: JSON array of up to 10 records, sorted by `elapsedMs` ascending, then `wrongGuesses` ascending
- **Record Structure**: `{ username: string, elapsedMs: number, wrongGuesses: number, seed: string }`

## Build Phase Contract

### Phase 1: Pre-Prompt Foundation (HUMAN)
- [ ] Initialize directory structure via setup script
- [ ] Populate `prd.md`, `plan.md`, `sources/source-index.md`
- [ ] Extract architectural keys via morluto/rea
- [ ] Create HARNESS.md, HANDOFF.md, AGENTS.md

### Phase 2: Three-Agent Tandem Implementation
- **Agent 1**: Build procedural 3D orthographic engine
- **Agent 2**: Build storybook HUD, CSS system, leaderboard
- **Agent 3**: Run unslop audits, frame inspections, populate build-record/

### Phase 3: Verification & Packet Finalization (HUMAN + Agent 3)
- [ ] Verify localhost execution (offline)
- [ ] Confirm deterministic replay via ?seed=
- [ ] Complete ai-use-log.md, reflection.md, disclosure.md
- [ ] Run final unslop pass

## Quality Gates

All agents must pass these gates before completion:

1. **Rendering Performance**: 60 FPS on localhost with up to 10,000 animated citizens
2. **Visual Hierarchy**: Passes unslop UI audit (spacing, color, icons, copy, type, layout, details, visuals, motion)
3. **Prose Quality**: Passes unslop prose audit (zero AI writing tells)
4. **Accessibility**: Sentence-case headings, tabular-nums for timer, ARIA labels
5. **Privacy**: Zero external requests, zero analytics, localStorage only

## Failure Mode Handling

Agent 3 is responsible for documenting and verifying fixes for:
- FAIL-01: Camera drag counted as wrong guess → Implement < 6px pointer threshold
- FAIL-02: Waldo overlapped with landmarks → Radial offset (65-160 units) from district centers
- FAIL-03: Timer digits jitter → Apply font-variant-numeric: tabular-nums
- FAIL-04: Offline CDN failure → Wrap scene generation in try/catch with fallback state

## Synchronization Points

Agents coordinate via HANDOFF.md which defines:
- Atomic state contracts between agents
- Interface boundaries (what each agent exposes)
- Version compatibility requirements

---

**Status**: Active | **Version**: 1.0 | **Last Updated**: 2026-11-15
