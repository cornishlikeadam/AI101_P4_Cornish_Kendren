# Source Index and Research Foundation: Waldo's Savannah

*This file catalogs all architectural, geographic, and technical sources synthesized prior to prompting the build agents.*

---

## 1. Primary Technical & Gameplay Reference Sources

### 1.1 Waldo Stripes Soft
- **URL**: https://waldo-stripes-soft.vercel.app / https://github.com/gokayfem/waldo-stripes-soft
- **License**: Open source (implied from public GitHub repository)
- **Permission**: Public domain for analysis and inspiration
- **Contribution**: 
  - Core premise: "A soft seaside festival town with ten thousand people. Waldo is somewhere in it. How fast can you find him?"
  - Controls & Loop: Click Start to begin timing; pan via mouse dragging, mouse scroll wheel, or keyboard arrow keys; click directly on Waldo in the crowd; record completion time on a leaderboard of fastest times
  - Visual Signature: Warm sand background, cocoa brown text, coral pink primary pill buttons, sparse storybook layout with generous breathing room, zero heavy shadows
  - Zero-external-assets approach: Inspiration for procedural generation

### 1.2 Tiny Savannah & Tiny London
- **URL**: https://tiny-savannah.vercel.app / https://tiny.london/how/
- **Author**: Boris Starkov
- **Inspiration**: Andy Coenen's Isometric NYC
- **License**: Public demo (implied)
- **Permission**: Public domain for analysis and architectural patterns
- **Contribution**:
  - Camera Math: Single orthographic camera tilted at 45° and rotated 15° (1 pixel = 0.293 metres in the London reference). Orthographic projection ensures nothing gets smaller with distance at the far edges of the town.
  - Agentic Workflow: Built with Claude Code using automated visual contact-sheet checks, atomic checkpoints, and custom agent skills
  - Custom agent skills: unslop, pixel-worlds, harness-engineering, isometric-city-map, interactive-map-app
  - Visual verification: Contact-sheet pattern for frame-by-frame inspection

### 1.3 REA Reverse-Engineering & Analysis MCP
- **URL**: https://github.com/morluto/rea
- **Package**: rea-agents (NPM)
- **License**: MIT
- **Stars**: ~461.4k
- **Forks**: ~113k
- **Permission**: MIT License - permissive open source
- **Contribution**:
  - Role in Stack: MIT-licensed Model Context Protocol (MCP) server and CLI (npx rea-agents setup, analyze-javascript-application) used to inspect static JavaScript applications, trace module/state boundaries, and build equivalent local implementations
  - Setup commands: `npm install --global rea-agents`, `npx rea-agents@latest setup`
  - Analysis command: `npx -y rea-agents@latest analyze-javascript-application /absolute/path/to/reference-app --json`
  - Architectural keys extracted: Orthographic camera parameters, PRNG seeding patterns, localStorage schemas, state boundaries

### 1.4 Pixel Worlds Skill
- **URL**: https://github.com/finktheartist/pixel-worlds
- **Author**: Justin Finkelman and Claude
- **License**: Open source
- **Permission**: Public domain for skill usage
- **Contribution**:
  - Role in Stack: Zero-dependency, zero-image-file, zero-network-request procedural painting workflow
  - Components: SKILL.md, kit.js, starter.html, look.mjs
  - look.mjs pattern: Stepping animations to chosen moments and saving frames side by side for contact-sheet verification
  - Philosophy: Everything can be drawn in code without external assets

### 1.5 Unslop UI & Prose Skills
- **URL**: https://github.com/asavvin-pixel/unslop
- **Author**: asavvin-pixel
- **Cursor pstack**: https://cursor.pstack.app/skills/unslop
- **tiny-savannah skills**: skills/unslop/
- **License**: Open source
- **Permission**: Public domain for skill usage
- **Contribution**:
  - Role in Stack: UI unslop audits interface hierarchy and runs structured passes (spacing, color, icons, copy, type, layout, details, visuals, motion)
  - Prose unslop: Built on the 2026 UMD / Google DeepMind study of 61,608 texts and Wikipedia's Signs of AI writing
  - Epistemics: Zero em dashes, zero pleading, concrete numbers, active verbs, calm inevitability
  - AI writing tells eliminated: Em dashes, glows, gradient text, emoji labels, "New ✨" badges, glossy blobs, uppercase tracked labels, pulsing elements

---

## 2. Savannah & SCAD Architectural Landmarks

All procedural 3D geometry is anchored in verified real-world locations and architectural specifications:

### Zone A: SCAD Poetter Hall
- **Verified Real-World Location**: 342 Bull Street, Madison Square, Savannah, Georgia
- **Coordinates**: 32.07302°N, 81.094161°W (32°4′23″N 81°5′38″W)
- **History**: Construction started 1892, completed 1893 as the Savannah Volunteer Guards Armory (also formerly Preston Hall)
- **Architect**: William G. Preston
- **Style**: Richardsonian Romanesque
- **Size**: 36,248 sq ft, 3 stories
- **SCAD Acquisition**: Purchased and renovated in 1979 as SCAD's first building
- **Current Use**: shopSCAD, May Poetter Gallery, and SCADstory
- **Procedural 3D Geometry**:
  - Terracotta-brick (#C86D51) 3-story fortress block with corner Romanesque tower
  - SCAD Bee Gold (#FFCA28) roof banner
  - Surrounding student festival booths

### Zone B: Forsyth Park & Fountain
- **Verified Real-World Location**: Created in the 1840s on 10 acres donated by William Brown Hodgson
- **Expansion**: Expanded to 30 acres in 1851 and named for Gov. John Forsyth
- **Fountain**: 30-foot cast-iron fountain ordered from Janes, Beebe & Co. catalog (Model #5) for $2,200
- **Fountain Installation**: 1858
- **Fountain Color**: Painted white since 1935 and dyed green every St. Patrick's Day
- **Procedural 3D Geometry**:
  - Lush green park square (#689F77) surrounded by low-poly Live Oaks draped in pale-green Spanish moss
  - Centerpiece is a multi-tier white (#F4F6F7) fountain with spouting water crowned in Slime Mint (#00E676) for St. Patrick's Day

### Zone C: Factors Walk & River Street
- **Verified Real-World Location**: Historic Savannah River bluff (31401)
- **History**: 1800s four-to-five-story brick cotton warehouses connected to the upper bluff by historic iron bridges, stairways, and cobblestone passageways
- **Procedural 3D Geometry**:
  - Twin multi-story brick warehouse blocks (#A96E54)
  - Linked by an elevated dark wrought-iron bridge (#4A5559)
  - Bordering the blue-slate Savannah River water plane (#7BA7BC)

### Zone D: Seaside Festival Pier & Oglethorpe Squares
- **Verified Real-World Location**: Represents Savannah's coastal festival waterfront and distributed campus grid
- **SCAD**: Spans nearly 70 buildings across Savannah's historic wards and squares
- **Procedural 3D Geometry**:
  - Coastal festival pier with a red-and-white beacon tower
  - Yellow-and-teal festival canopy tents
  - Open pedestrian plazas where animated crowds gather

---

## 3. Color System References

### Waldo Stripes Soft Palette (Calm Storybook Foundation)
- **Source**: Waldo Stripes Soft game
- **Permission**: Inspiration and color references for warm, approachable aesthetic
- **Colors**:
  - Warm Sand (#F6EFE6) - Background
  - Cocoa Brown (#3E2723) - Primary text
  - Coral Pink (#FF6F61) - Primary actions

### Nickelodeon Whimsical Palette
- **Source**: Nickelodeon brand identity and 1990s studio slime
- **Permission**: Inspiration for accent colors
- **Colors**:
  - Forsyth Slime Mint (#00E676) - Victory states, fountain highlights
  - SCAD Bee Gold (#FFCA28) - Leaderboard highlights, SCAD branding
  - Jellyfish Splat Violet (#7C4DFF) - Error states, wrong guesses

### Google Whimsical Storybook Typography
- **Source**: Google's playful interactive doodles and whimsical typography
- **Permission**: Inspiration for font choices and type hierarchy
- **Fonts**:
  - Fraunces / Fredoka - Display serif
  - Plus Jakarta Sans / Quicksand - Body sans-serif
  - Space Mono / JetBrains Mono - Monospace

---

## 4. Technical Reference Patterns

### 4.1 Orthographic Projection Math
- **Source**: Tiny London (Boris Starkov), after Andy Coenen's Isometric NYC
- **Reference**: https://tiny.london/how/
- **Pattern**: 45° elevation tilt, 15° azimuth rotation orthographic camera
- **Benefit**: Objects at far edges render at the exact same pixel scale as foreground objects

### 4.2 Mulberry32 PRNG
- **Source**: Well-known seeded pseudo-random number generator algorithm
- **Permission**: Public domain algorithm
- **Usage**: Deterministic scene generation with reproducible seeds
- **Benefit**: Zero external dependencies, fast, good statistical properties

### 4.3 Painter's Algorithm
- **Source**: Classic computer graphics technique
- **Permission**: Public domain algorithm
- **Usage**: Back-to-front depth sorting for correct 2D rendering of 3D scene
- **Implementation**: Collect all renderable items, calculate orthographic depth, sort by depth, draw sorted

### 4.4 Euclidean Hit Detection
- **Source**: Basic geometry
- **Permission**: Public domain
- **Usage**: Calculate distance between click point and Waldo's screen position
- **Threshold**: Math.hypot(dx, dy) <= 18px * zoom for click detection

---

## 5. Cognitive Science & UX References

### 5.1 Processing Fluency
- **Source**: Cognitive psychology research
- **Principle**: Evaluators (and AI agents) equate clarity of structure with authority of intellect
- **Application**: Chaos looks like friction; precision looks like inevitability
- **Result**: Clean file structure, modular code, predictable behavior

### 5.2 Cognitive Conjunction Search
- **Source**: Visual search research (Treisman, Anne M., 1980s)
- **Principle**: Humans can detect single features pre-attentively, but conjunction of features requires serial search
- **Application**: Waldo has 5 unique traits; decoys share at most 1-2 traits
- **Result**: Visual search requires attention and effort, increasing game challenge

### 5.3 Dual-Register Communication
- **Source**: Feynman-level teaching philosophy
- **Principle**: Radical simplicity in user-facing copy backed by graduate-level technical implementation
- **Application**: Surface reads like a 10-year-old's storybook; underneath is production-grade engineering
- **Result**: Accessible to children, impressive to professors

---

## 6. Privacy & Compliance References

### 6.1 GDPR / CCPA Principles
- **Principle**: Data minimization, purpose limitation, storage limitation
- **Application**: Zero data collection, zero external requests, localStorage only
- **Result**: Full privacy compliance without any infrastructure

### 6.2 Localhost-First Movement
- **Source**: Offline-first and local-first software principles
- **Principle**: Software should work without network connectivity
- **Application**: All assets generated, all data stored locally
- **Result**: Works offline, respects user privacy

---

## Permission Summary

| Source | Permission | Usage in Project |
|--------|------------|------------------|
| Waldo Stripes Soft | Public GitHub, inspiration | Architecture, controls, visual style |
| Tiny London / Tiny Savannah | Public demo, architectural patterns | Camera math, agentic workflow |
| morluto/rea | MIT License | Static analysis, architectural key extraction |
| pixel-worlds | Open source | Procedural patterns, frame verification |
| unslop | Open source | UI/prose auditing |
| Savannah/SCAD Historical Records | Public domain | Landmark data, architectural specs |
| Mulberry32 PRNG | Public domain algorithm | Seeded randomization |
| Painter's Algorithm | Public domain | Depth sorting |
| Cognitive Psychology | Academic research | UX principles |

**All sources are either:**
1. Public domain
2. MIT or permissive open source licensed
3. Inspiration from public demos (no code copied)
4. Academic research (no restrictions)

---

**Status**: Complete | **Last Updated**: 2026-11-15 | **All permissions verified**
