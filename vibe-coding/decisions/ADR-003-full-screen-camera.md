# ADR-003: The camera always fills the screen

**Status:** Accepted (2026-11-16). Adds to ADR-002; replaces nothing.
**Context:** In Cycle 1, zooming all the way out or panning to a corner showed blank space past the edge of the city. This happened at every screen size I tested (`build-record/visual-qa/overhaul/before/minzoom-*.png`). The minimum zoom was a fixed number, and panning wasn't kept inside the world.
**Decision:** The minimum zoom is now worked out from the window size, so the city always covers the whole screen. The view is kept inside the world after every pan, zoom, resize or phone rotation. Wheel and pinch zoom stay anchored under the pointer or between the fingers.
**Consequence:** Kids never see empty edges, and the camera tests check this at five window sizes. On a wide screen you can't zoom out as far as before, so you can't see the whole city at once. The minimap covers that.
