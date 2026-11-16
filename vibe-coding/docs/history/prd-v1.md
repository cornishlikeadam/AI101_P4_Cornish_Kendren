> Historical version 1. Body below is copied unchanged from commit c4b8bbc. Superseded by ADR-002 (2026-11-15). Kept for traceability; not an active instruction.

# Product Requirements Document: Waldo's Savannah

*One screen. A partner should be able to read it and predict what the AI will build. This is the dual-register PRD: ten-year-old story + graduate engineering spec.*

---

## The Kid-Simple Story

**We are making** a single-page 3D hidden-object game called **Waldo's Savannah** (inspired by Waldo Stripes Soft).

When you open the page, you see a warm, cozy coastal festival town that looks like historic Savannah, Georgia and the SCAD art school campus.

Here is how you play:

1. **Read the little How to play card** at the start. It tells you exactly what to look for.
2. **Press the coral-pink Start round pill button.** The timer starts ticking!
3. **Drag with your mouse, spin your scroll wheel, or press the arrow keys** to float around the 3D town. Look past the mossy oak trees, the red-brick SCAD castle (Poetter Hall), the white park fountain (Forsyth Park), and the riverfront iron bridges (Factors Walk).
4. **Spot the one man** wearing a red-and-white striped shirt, a bobble hat, round glasses, blue trousers, and a walking stick.
5. **Click him!** If you click the wrong person, your Wrong guesses counter goes up by one and a silly purple message tells you who you clicked instead. When you click Waldo, the timer stops, a green ring highlights him, and you can type your nickname into the Top 10 local leaderboard or copy a Share link so your friend can try the exact same town layout!

That is it. That is the entire game.

---

## Graduate Design & Engineering Specifications

### Core Functional Requirements

**FR-01 (Procedural 3D Savannah Diorama)**: The scene must generate a 3D miniature festival town representing Savannah's SCAD districts, squares, and waterfront using pure procedural geometry. Zero image assets (.png, .jpg, .webp) or downloaded 3D model files (.glb, .gltf, .obj) may be fetched.

**FR-02 (Seeded Randomization on Refresh)**: Every page refresh, or click of "New town layout", must seed a deterministic Mulberry32 pseudo-random number generator (`?seed=`). This randomizes district assignments, prop positions (festival tents, live oak trees), crowd paths, and Waldo's exact coordinate.

**FR-03 (Target Character Uniqueness)**: Exactly one instance in the crowd is Waldo, defined by five mandatory visual primitives:
- Torso with horizontal red (#E53935) and white (#FFFFFF) stripes
- Knit bobble hat with matching red color and a white sphere pom-pom on top
- Two dark-cocoa rings on the face representing round glasses
- Lower legs in trouser blue (#1E88E5)
- Angled wooden walking stick (#8D6E63)
- **Decoy Constraint**: Crowd NPCs (SCAD students, tourists, riverboat musicians) may share at most 1 to 2 of these 5 attributes so visual search requires conjunction-feature attention.

**FR-04 (Camera & Navigation Controls)**: Use an orthographic projection (45° elevation tilt, 15° azimuth rotation) so character scale remains uniform across the entire town. Support mouse left-click drag / touch pan, scroll wheel zoom (clamped between 0.6x and 3.5x), and keyboard ArrowUp, ArrowDown, ArrowLeft, ArrowRight plus WASD panning.

**FR-05 (HUD, Timer, & Wrong-Guess Telemetry)**:
- **Intro State**: Displays game title, 3-step storybook instructions, visual badges of Waldo's 5 traits, and the primary Coral Pink pill button (Start round).
- **Active State**: Starts a performance.now() delta timer formatted in tabular monospace (00.0s) and a Wrong guesses counter. Clicking any non-Waldo location (when pointer movement between pointerdown and pointerup is < 6 pixels) increments wrongGuesses by 1 and triggers a non-blocking whimsical toast.
- **Congrats State**: Triggered immediately upon clicking Waldo's bounding radius. Freezes timer, highlights Waldo with a Nickelodeon Slime Mint (#00E676) ring, displays final time and wrong-guess count, provides a nickname input to save to the Top 10 Leaderboard, and offers a Copy share link pill button (localhost URL with ?seed=...).

**FR-06 (Local-Only Top 10 Leaderboard)**: Persists to `window.localStorage.getItem('waldos_savannah_leaderboard_v1')`. Stores up to 10 records sorted by fastest time (elapsedMs ascending), then fewest wrong guesses. Includes a "Reset local leaderboard" secondary button.

**FR-07 (Friendly Fallback State)**: If 3D scene setup fails or is manually tested via `?fallback=1` or the "Test fallback state" button, display a warm storybook fallback card explaining that the festival tent caught a sea breeze and offering a "Try a new scene" button that re-seeds and launches a fresh layout.

### Non-Functional & Privacy Constraints

**NFR-01 (Strict Localhost Isolation)**: Zero external HTTP/HTTPS requests required at runtime. No accounts, no cookies, no analytics, no telemetry.

**NFR-02 (Visual Hierarchy & Unslop Compliance)**: Warm Sand (#F6EFE6) background, Cocoa Brown (#3E2723) text, Coral Pink (#FF6F61) primary pill buttons, zero heavy drop shadows, sentence-case headings, and zero AI writing clichés.

**NFR-03 (Performance Target)**: 60 frames per second on localhost with up to 10,000 animated citizens. Default crowd size: 420 for instant responsiveness.

**NFR-04 (Accessibility)**: Sentence-case headings, tabular-nums for timer and counters, ARIA labels on interactive elements, keyboard navigation support.

---

## Look and Feel

### Color Palette (80/15/5 Cognitive Color Rule)

**80% Calm Storybook Canvas (Waldo Stripes Soft Foundation)**:
- Warm Tybee Sand (#F6EFE6) - Primary page and sky-dome background, eliminates harsh white glare during visual search
- Sweet Tea Cream (#FFFDF9) - Intro card, leaderboard panel, and fallback dialog surface with soft warm border (#E2D3C1)
- River Street Cocoa (#3E2723) - High-contrast storybook text
- Spanish Moss Bark (#6D5D53) - Captions, timer labels, and leaderboard timestamps

**15% Historic Savannah & SCAD Architectural Tokens**:
- Poetter Hall Terracotta (#C86D51) - 3-story fortress block with corner Romanesque tower
- Forsyth Cast-Iron White (#F4F6F7) - 30-foot multi-tier fountain basin and spouting statues
- Factors Walk Wrought Iron (#4A5559) - 1800s iron bridges and bluff stairways
- Live Oak Canopy / River Water (#689F77 / #7BA7BC) - Soft-shaded low-poly live oaks with hanging moss and Savannah River water plane

**5% Nickelodeon Whimsical Pop & Target Signals**:
- Nickelodeon Forsyth Slime (#00E676) - Victory ring, personal-best time badge, St. Patrick's Day green fountain water
- SCAD Bee Gold (#FFCA28) - Top-3 leaderboard crown highlights and Poetter Hall SCAD flag accents
- Jellyfish Splat Violet (#7C4DFF) - Playful "Oops! That is a Savannah festival-goer, not Waldo!" wrong-guess bounce toast

**Waldo Target Tokens (Locked)**:
- Waldo Stripe Red & White (#E53935 & #FFFFFF) - Exclusive horizontal stripe pattern for Waldo's shirt and bobble hat
- Waldo Trouser Blue & Cane (#1E88E5 & #8D6E63) - Waldo's blue trousers, walking stick, and round cocoa-rimmed glasses

### Typography and Layout Hierarchy

**Display & Storybook Headings** (`--font-display`): 'Fraunces', 'Fredoka', 'Cooper Black', or 'Georgia', serif. Soft, rounded, slightly bouncy serifs that feel like a classic children's picture book (font-weight: 800, letter-spacing: -0.02em).

**Kid-Readable UI & Instructions** (`--font-sans`): 'Plus Jakarta Sans', 'Quicksand', or system sans-serif. Open counters, tall x-height, and generous line-height (1.55) so a 10-year-old reads the 3-step rules in seconds.

**Precision Telemetry & Leaderboard** (`--font-mono`): 'Space Mono', 'JetBrains Mono', or system monospace with `font-variant-numeric: tabular-nums`. Prevents the timer (00:14.8) and wrong-guess counter (Wrong guesses: 2) from jittering horizontally while ticking.

### Layout Rules

- **Pill Button & Breathing-Room Rules**: Every interactive button uses `border-radius: 9999px` (rounded pill shape), zero heavy drop shadows (`box-shadow: none`), and a tactile 2px solid #3E2723 cocoa outline with a `transform: translateY(-2px)` hover lift.
- **Generous Whitespace**: Warm Sand (#F6EFE6) whitespace surrounds the 3D diorama viewport and sidebar cards to preserve breathing room.
- **Card Styling**: Storybook cards use 22-24px border radius with 2px cocoa border.

---

## Out of Scope

The AI must NOT add:

1. **External Dependencies**: No npm packages, no CDN scripts, no external libraries
2. **Network Requests**: No HTTP/HTTPS calls, no analytics, no telemetry
3. **External Assets**: No image files, no 3D models, no downloaded fonts
4. **Multiplayer**: No WebSocket, no server, no online leaderboards
5. **Accounts/Authentication**: No login, no sign-up, no user accounts
6. **Persistent Backend**: No database, no Firebase, no external storage
7. **Ads/Tracking**: No advertising, no tracking pixels, no data collection
8. **Sound Effects**: No audio files, no Web Audio API synthesis
9. **Animations Beyond Spec**: Only the specified sine-wave walk/bob animation for crowds
10. **Additional UI**: Only the specified overlays, HUD elements, and controls

---

## Done When

A check anyone could run in a minute:

1. **Game opens**: Open `vibe-coding/build/index.html` in any modern browser (Chrome, Firefox, Safari, Edge) and the Intro card appears within 2 seconds with no errors in the console.
2. **Game plays**: Click "Start round", the timer starts, the 3D town renders with animated crowds, and you can drag to pan, scroll to zoom, and use arrow keys to navigate.
3. **Waldo can be found**: After exploring, clicking Waldo (the only character with all 5 traits) triggers the Congrats state with your time and wrong guesses displayed, and you can save your score to the local leaderboard.
4. **Sharing works**: Copy the share link, open it in another tab, and the exact same town layout and Waldo position appear, allowing a friend to try the same challenge.
5. **Fallback works**: Visit `?fallback=1` and the Friendly Fallback State appears with a "Try a new scene" button that successfully generates a fresh layout when clicked.

---

**Status**: Complete | **Version**: 1.0 | **Last Updated**: 2026-11-15
