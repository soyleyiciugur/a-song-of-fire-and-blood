THE GREAT GAME — UI POLISH DELTA — 2026-10-10

Base: ASOFAB_The_Great_Game_UI_Round_Updated_2026-10-09.zip

Contains the 16 modified code/style files only; no public asset files, no .env, no credentials.

How to apply:
1. Extract your base ASOFAB project.
2. Extract this ZIP into the PROJECT ROOT (alongside package.json).
3. Allow overwriting the matching files.

Changes: PlayHub tabs and dialog, Friendly/Crown labels, Decks filters/validation, Encyclopedia trait terminology, Chronicle Round/Turn labels, leave dialogue and HUD, Ranks layout/podium, quote wrapping, burn effects.

Note: Included a minor Chronicle context-property fix (owner) and removed a stale function reference discovered while packaging.
Verification: Edited TS/TSX files passed TypeScript parser/transpilation syntax checks. A full Next.js build was not runnable because project dependencies are not installed in the current environment.
