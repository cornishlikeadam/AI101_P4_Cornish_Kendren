# Project Reflection: Precision, Dual-Register UX, and Harness Engineering

This reflection is written in my own words, in the "Weight, Not Weight Loss" voice established in the Cognitive UX audit.

---

## 1. Carrying Weight, Not Weight Loss

The central thesis of Waldo's Savannah is that **simplicity on the surface requires structural discipline underneath**.

A ten-year-old player should never have to think about orthographic frustum matrices, Mulberry32 bit-shifting, or Euclidean drag-threshold disambiguation. They should simply see a warm, sandy storybook page, press a coral-pink pill button, and feel the immediate joy of exploring a living miniature Savannah.

When people misjudge "vibe coding," they assume it means surrendering architectural control to a model's first guess. This project demonstrates the opposite. By setting up the **complete 16-file hierarchy**, **Architecture Decision Records (ADR-001)**, **Savannah historical landmark specs**, and a **three-agent tandem harness** before prompting, we eliminated context drift before it could start.

The consistency is in the commit log. The precision is in the code. Open `index.html` and press Start.

---

## 2. What Worked

### 2.1 Orthographic Isometric Projection
Borrowing the 45° elevation and 15° azimuth camera rule from Tiny London and Tiny Savannah solved the hardest problem in 3D hidden-object games: **perspective distortion**.

Because an orthographic camera renders distant objects at the exact same pixel scale as foreground objects, hiding Waldo near the Factors Walk riverfront is just as fair as hiding him beside the Forsyth Park Fountain. No visual advantage or disadvantage based on distance.

This mathematical precision, invisible to the player, ensures the game is fundamentally fair.

### 2.2 Cognitive Conjunction Search
Early iterations made crowd colors completely random, which allowed Waldo's red-and-white stripes to pop out pre-attentively in under two seconds. This was too easy.

Applying **cognitive visual-search principles**, we introduced decoy features:
- Yellow/teal striped shirts on non-Waldo characters
- Bobble hats on non-striped citizens
- Round glasses on SCAD artists

Now the player's brain must perform **serial conjunction search** across all five of Waldo's traits. This transforms the game from a trivial spot-the-color exercise to a genuine challenge requiring attention and focus.

### 2.3 Zero-Dependency Resilience
By writing a **self-contained 3D orthographic projection engine** directly inside `index.html`, the game runs smoothly even if an evaluator:
- Opens the file completely offline
- Uses `file://` protocol
- Has no internet connection
- Disables JavaScript CDN access

This zero-dependency approach means the game is **universally accessible** and **completely portable**.

### 2.4 Dual-Register Design
The project successfully balances two aesthetic directives:
- **Calm, nostalgic Waldo Stripes Soft palette**: Warm sand, cocoa brown, coral pink
- **Vibrant, whimsical Nickelodeon/Google energy**: Slime mint, bee gold, jellyfish violet

The **80/15/5 Cognitive Color Rule** ensures:
- 80% calm storybook canvas (eliminates visual fatigue)
- 15% historic Savannah architectural tokens (grounds in authenticity)
- 5% whimsical pop signals (celebrates victories and highlights targets)

This hierarchy creates visual breathing room while maintaining joyful surprises.

---

## 3. What Required Human Steering

### 3.1 Decoy Trait Distribution
Initial AI-generated decoys sometimes shared 3-4 traits with Waldo, making visual search too difficult. Human adjustment ensured decoys share **at most 1-2 traits**, providing the right balance of challenge without frustration.

### 3.2 Camera Movement Threshold
Without disambiguation, every camera pan ended with a mouse release that registered as a click, incrementing wrong guesses. Human implementation of the **< 6px pointer movement threshold** (FAIL-01 fix) separated intentional clicks from accidental releases.

### 3.3 Waldo Spawning Logic
Random coordinate generation sometimes placed Waldo directly inside landmark centers, occluding him at default camera angles. Human implementation of **radial offset (65-160 units) from district centers** (FAIL-02 fix) ensures Waldo is always visible and findable.

### 3.4 Typography Precision
Default proportional fonts caused timer digits to jitter horizontally as values changed. Human application of **font-variant-numeric: tabular-nums** (FAIL-03 fix) ensures smooth, non-jittering digit updates.

### 3.5 Fallback State Design
Initial error handling simply showed a console error. Human implementation of the **Friendly Fallback State** (FAIL-04 fix) with warm, reassuring copy maintains the storybook aesthetic even in error conditions.

---

## 4. Lessons Learned

### 4.1 Spec-Driven Development Prevents Drift
The most critical decision was **writing all specification artifacts before any code was generated**:
- `HARNESS.md`: Multi-agent contract
- `HANDOFF.md`: Interface definitions
- `prd.md`: Dual-register requirements
- `plan.md`: Execution strategy
- `sources/source-index.md`: Research foundation

This prevented the AI agents from making assumptions or inventing features. Every decision could be traced back to a human-written specification.

### 4.2 The 80/15/5 Rule is Universal
The cognitive color hierarchy (80% calm, 15% grounding, 5% pop) isn't just for games. It's a **universal principle for any interface**:
- 80% should be calm and consistent (the foundation)
- 15% should provide context and orientation (the structure)
- 5% should highlight what's important (the signal)

Anything that violates this ratio creates visual noise and cognitive overload.

### 4.3 Harness Engineering Prevents Regression
The three-agent tandem approach with **non-overlapping scopes** prevented:
- Context collisions between agents
- Inconsistent architectural decisions
- Duplicate work
- Integration issues

Each agent owned a clear domain, and **HANDOFF.md** defined exactly how they interacted.

### 4.4 Testing Deterministic Systems
The ?seed= parameter wasn't just for sharing. It was **essential for testing**:
- Verify that Waldo appears in the same location
- Reproduce specific bugs
- Test edge cases consistently
- Verify performance with consistent scene complexity

Deterministic systems are **easier to test** than truly random ones.

---

## 5. What I Would Do Differently

### 5.1 Start with the Build-Record Structure Earlier
I initially focused on the code first, then created the documentation. In hindsight, I should have:
1. Created the complete file structure first
2. Populated all specification artifacts
3. Then begun implementation

This would have prevented some early refactoring and reorganization.

### 5.2 Implement ADR-002, ADR-003, ADR-004
While ADR-001 covers the core architectural decision, documenting the other key decisions would have provided even better traceability:
- ADR-002: Cognitive Color System (80/15/5 Rule)
- ADR-003: Pointer Disambiguation Threshold (6px)
- ADR-004: Waldo Spawning Algorithm (Radial Offset)

Each of these decisions had significant architectural impact.

### 5.3 Add More Unit Tests
The testing infrastructure could be expanded with:
- Automated visual regression tests using pixel-worlds/snapshot.mjs
- Performance benchmark tests
- Accessibility audit tests
- Cross-browser compatibility tests

Currently, testing relies on manual verification and the deterministic ?seed= parameter.

---

## 6. The Bottom Line

Waldo's Savannah proves that **vibe coding doesn't mean sloppy coding**.

By combining:
- **Graduate-level architectural rigor** (orthographic projection, seeded PRNG, painters algorithm)
- **Ten-year-old accessibility** (warm colors, simple copy, clear instructions)
- **Production-grade resilience** (fallback states, error handling, offline-first)

The result is a project that **delights users** while **impressing engineers**.

The work speaks louder than adjectives. The consistency is in the commit log. The precision is in the code.

Open `index.html` and press Start.

---

**Reflection Status**: Complete | **Voice**: "Weight, Not Weight Loss" | **Date**: 2026-11-15
