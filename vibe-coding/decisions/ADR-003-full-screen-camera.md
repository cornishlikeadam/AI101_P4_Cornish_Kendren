# ADR-003: Full-screen camera bounds

Status: Accepted (Cycle 2, 2026-11-16).
Context: Cycle 1's edge-case test showed blank space past the city edges when zooming all the way out or panning to a corner (`build-record/visual-qa/overhaul/before/minzoom-*.png`).
Decision: Set the minimum zoom from the window size so the city always fills the screen, and keep the view inside the city on every pan, zoom, resize, or rotation.
Consequence: Kids never see empty edges at any tested screen size. Wide screens cannot zoom out to see the whole city at once, so the corner minimap shows where you are.
