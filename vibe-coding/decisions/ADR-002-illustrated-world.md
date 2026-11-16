# ADR-002: Illustrated Savannah world

Status: Accepted (replaces ADR-001; full notes in `docs/history/ADR-002-illustrated-world-full.md`).
Context: Version 1's box geometry looked like a math demo rather than a search-and-find book, and clicking in a 3D stack felt awkward.
Decision: Switch to original SVG drawings packed into `build/js/assets.bundle.js`, drawn in a 2D top-down view you can pan and zoom, with clicks checked against real character pixels.
Consequence: Looks like a picture book and clicks feel accurate. The build needs a pack step, loads ~2.9 MB on first visit, and art changes can shift old seed links.
