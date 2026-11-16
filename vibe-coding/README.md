# Waldo's Savannah

A search-and-find game set in an illustrated Savannah, Georgia. One person in the crowd has all five clues: a red-and-white striped shirt, a striped bobble hat, round glasses, blue trousers and a walking stick. Find him and tap him.

## How to open it

- Online: https://waldo-savannah.vercel.app
- Offline: open `build/index.html` in Chrome, Safari, Firefox or Edge. It works straight from the file, with no internet.
- Or serve the folder: `python3 -m http.server 8000 --directory vibe-coding/build`, then go to http://localhost:8000.

## How to play

1. Press **Play!** and the timer starts.
2. Drag to look around. Scroll or pinch to zoom. Arrow keys and WASD work too.
3. Tap the person you think is Waldo. A wrong tap adds one to the ✗ counter.
4. **💡 Hint** helps up to three times: first the area, then a nearby landmark, then a circle around him.
5. The small map in the corner shows where you are. **☰** holds the level, crowd size, scores and a new city.

A link like `?seed=SAV-1234` replays the same city. There are also testing links: `?beacon=1` marks Waldo, `?fallback=1` shows the error screen and `?crowd=2000` makes a big crowd.

## What it will not do

- No accounts, no online leaderboard, no tracking. Scores stay in your own browser.
- No requests to other websites while you play.
- It is not a real map of Savannah. The streets and landmarks are in their real order, but distances are squeezed so the whole city fits.

## Known limits

- Phones have not been measured for speed. Performance was only checked on one Apple M4 laptop in Chrome (about 60 FPS and ~0.6 s load with 1,801 people).
- The first load downloads about 2.9 MB because all the drawings are packed into the game.
- Changing the art can change how an old seed link looks.

## Rebuild and test

```bash
node vibe-coding/tools/build.mjs              # rebuilds build/js from src/ and assets/
node vibe-coding/tests/illustrated.test.mjs   # Playwright checks; see the file header
```

Don't edit `build/js/*.js` by hand. Change `src/` or `assets/` and rebuild.
