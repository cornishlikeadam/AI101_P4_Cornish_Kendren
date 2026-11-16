# Disclosure

## What AI contributed

AI wrote almost all of the code: the camera, drawing, picking, crowd, gameplay, tests and build tools. It also drew the SVG artwork by writing the SVG directly or through scripts in `tools/author/`, and it drafted most of the documents. Session details are in `build-record/ai-use-log.md`.

## What I decided

- The idea: a Waldo-style search game set in Savannah, for the kids I tutor.
- Dropping the first box-style version for an illustrated one, after seeing it didn't look like a picture book.
- Which places go in the city and that they follow real street order along Bull Street.
- That it has to be simple for kids: a picture of Waldo, a Play button, big buttons, gentle hints.
- No accounts, no tracking, no outside requests.
- Approving or sending back each checkpoint, and asking for the camera fix and the wider city.

## Tools used

- Claude Code (Claude Opus 5.5) for the illustrated version, from 2026-11-15 on.
- `playwright-core` with Chrome, for automated tests and screenshots.
- Vercel CLI, for the live site.
- Vite, React, TypeScript and Tailwind, only for the separate `lab/` workspace.
- Version 1 (2026-11-14 to 15) used a three-agent setup. Its log also names REA, unslop and pixel-worlds. That record is kept in `docs/history/disclosure-v1.md`, and I haven't re-checked it.
