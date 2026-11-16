# PRD: Waldo's Savannah

**Goal:** a fun, fair search-and-find game that a ten-year-old can play without help.

**User:** a ten-year-old I tutor, on a laptop or tablet.

**Features**

1. The user can drag, scroll, pinch and use the keys to explore one big illustrated Savannah, from the river down Bull Street to Forsyth Park.
2. The user can tap people to find the one with all five clues, while a timer runs and wrong taps are counted.
3. The user can ask for up to three hints and save a score to a top-ten list on their own device.

**What happens:** the player sees a picture of Waldo and presses Play. The timer starts. They search the crowd. A wrong tap gives a playful "not him" and adds to the counter. The right tap stops the clock and shows a celebration with the time and points.

**Look and feel:** a hand-drawn picture book. Ink outlines, warm colours, live oaks with moss, real Savannah landmarks, and lots of small stories in the crowd. Big buttons and very little text.

**Out of scope:** accounts, online leaderboards, multiplayer, sound, a geographically exact map, and any request to another website.

**Done when**

1. Open `build/index.html`, press Play, find Waldo (add `?beacon=1` to mark him) and tap him: the timer stops and the celebration shows.
2. Zoom all the way out and drag to every edge: the screen always shows city, never blank space.
3. Drag across the crowd and let go: the wrong-guess counter stays at 0.
