# Execution plan: Waldo's Savannah (illustrated edition)

*Five lines. Version 1 is archived in [docs/history/plan-v1.md](docs/history/plan-v1.md).*

1. **Option:** game
2. **User:** A cognitive UX professor who evaluates whether a joyful surface rests on rigorous, reproducible engineering, and who will judge the picture before reading any code.
3. **Build sentence:** When the professor opens `build/index.html`, Waldo's Savannah shows an illustrated Forsyth Park crowded with distinct characters and small stories, and the professor can pan and zoom to find and click the one person with all five traits while the timer runs and wrong guesses are counted.
4. **Boundary:** No third-party network request, account, analytics or remote storage at runtime; all art is original and ships inside the build folder; and no scene beyond Forsyth Park is built until Forsyth Park passes visual review.
5. **Rejected idea:** Adding more polygons and NPCs to the existing isometric renderer. Rejected because the zero-asset and fixed-camera rules, not the polygon count, are what make it look primitive (see `docs/audit.md`).
