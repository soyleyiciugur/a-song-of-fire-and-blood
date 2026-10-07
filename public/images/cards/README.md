# The Great Game assets

Keep The Great Game runtime assets under `/public/images/cards/` and group them by surface rather than by file type.

- `hub/` — Play, Decks, Ranks, Social and Cupbearer shared backgrounds/signage.
- `keywords/` — card keyword icons such as `summon.png`.
- `background/`, `boards/`, `chat-wheel/`, `innkeepers/`, `locations/`, `tavern-table/`, `audio/` — existing runtime groups referenced by the game.

Existing asset paths outside the files supplied with this change were intentionally not moved because the uploaded project archive did not include the original `public/` tree. This avoids breaking live pull paths. New and supplied assets use the established `/images/cards/...` structure.
