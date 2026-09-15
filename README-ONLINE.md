# The Great Game — Online Multiplayer

Changed/new files:
- app/cards/play/page.tsx
- app/cards/play/play.module.css
- app/api/great-game/route.ts
- lib/the-great-game/online.ts
- lib/supabase/database.types.ts
- supabase/migrations/20260915143000_great_game_online.sql

After merging the files, apply the Supabase migration:

    npm run community:push

(or `npx supabase db push --linked`).

Online mode uses private two-player tables with six-character invite codes.
The full authoritative game state stays server-side. Opponent hand/deck contents
are redacted from API responses; Supabase Realtime carries only safe invalidation
events, after which each client fetches its own redacted state.

Requires the project's existing Supabase public variables and a server-only
SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.
