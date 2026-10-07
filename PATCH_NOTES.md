# The Great Game — Ranks / Social / Store / Summon patch v3

## This follow-up
- Removed the Social sidebar copy about private decks. The feed still never queries or returns deck contents.
- Rebuilt **On a Run** as one live entry per player instead of deriving one sidebar item from every winning match. Each entry can show the player's current overall win streak and best active head-to-head streak at the same time.
- Reworked match entries so both players are visible: winner and defeated player now have their avatar, display name and handle on the result row. Player names use a stronger House-of-the-Dragon display treatment instead of repeating a plain “X bested Y at the table” sentence.
- Fixed the Social page's extra navigation gap by removing its second sticky offset. `HubNavFrame` now follows the same global-navbar transform logic it uses on Play.
- Ranks now uses the card Command-gem artwork for player tiers, including the normal/highlighted image swap on hover. Rating mapping is: **C < 1100**, **B 1100–1199**, **A 1200–1349**, **S 1350–1499**, **S+ 1500+**.
- The shared Great Game profile chip also shows the player's tier gem when the player has a ranking.
- Ranks, Social and Store now point to their dedicated backgrounds at:
  - `/public/images/cards/hub/ranks-bg.webp`
  - `/public/images/cards/hub/social-bg.webp`
  - `/public/images/cards/hub/store-bg.webp`
- Store keeps the normal five-tab Great Game navigation, but its Cupbearer sign is once again a large centered standalone sign. CSS clips the chain portions from the existing sign asset rather than generating a new image.
- The Mara/Aldren confirmation seal is centered inside its right-hand gutter both horizontally and vertically.

## Existing patch features retained
- Great Game navigation is **Play / Decks / Ranks / Social / Store**.
- Collection is removed from Great Game navigation and the old collection page is deleted.
- Ranks is backed by `great_game_leaderboard` and keeps the complete ranked field in the ledger.
- Social shows public match outcomes, streaks, likes and replies without exposing private deck contents or deck create/update activity.
- Social uses final Standing margin rather than Elo change as match context when the Standing migration is available.
- Store lives at `/cards/store` rather than as a standalone `/store` page.
- Token terminology is renamed to the noun **Summon** and `summon.png` is used as its keyword icon.

## Supabase
For a fresh target, apply both migrations in order:

1. `supabase/migrations/20261008002000_great_game_social.sql` — likes/replies tables and RLS.
2. `supabase/migrations/20261008005500_great_game_social_standing.sql` — final Standing capture/backfill for Social.

No additional migration is required for the v3 streak/sidebar changes. The run summaries are derived from existing public match history.

## Dedicated background assets
The three new background files named by the user were not present in the uploaded working copy available to this patch builder. The code is wired to the `/public/images/cards/hub/` paths above; keep the user's existing `ranks-bg.webp`, `social-bg.webp` and `store-bg.webp` files there when applying the patch.

## Deletions
See `DELETE_THESE_FILES.txt`.

## Validation
- Modified TS/TSX files were syntax-transpiled with TypeScript 5.8.3.
- `data/update-notes.json` parses successfully.
- Modified CSS modules have balanced rule braces.
- A full Next build was not run because the uploaded working tree does not contain installed project dependencies.
