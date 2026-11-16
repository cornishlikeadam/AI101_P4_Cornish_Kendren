> Historical version 1. Body below is copied unchanged from commit c4b8bbc. Superseded by ADR-002 (2026-11-15). Kept for traceability; not an active instruction.

# Execution Plan: Waldo's Savannah

*Five lines. The user is a cognitive UX professor evaluating AI-generated work. Replace each [placeholder] and delete this line.*

1. **Option:** game
2. **User:** A cognitive UX professor who needs to evaluate whether a project demonstrates architectural rigor beneath a joyful, approachable surface, and who values consistency, precision, and reproducibility above all else.
3. **Build sentence:** When the professor opens index.html, Waldo's Savannah generates a zero-asset procedural 3D Savannah diorama with 420 animated citizens, randomized landmarks, and one Waldo hiding in a new spot every refresh, and the professor can find him by clicking the only character wearing all five traits (red-and-white striped shirt, bobble hat, round glasses, blue trousers, walking stick) while the timer counts up and wrong guesses are tracked.
4. **Boundary:** The build must never make external network requests, must never require accounts or analytics, must never use external image assets or 3D models, and must always run 100% on localhost with a friendly fallback state if scene setup fails.
5. **Rejected idea:** A multiplayer online version with real-time leaderboards and WebSocket synchronization. Rejected because it violates the zero-external-dependency requirement, introduces latency, requires server infrastructure, and loses the 100% localhost guarantee that makes the project special.
