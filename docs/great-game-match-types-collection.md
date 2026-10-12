# Match types, metadata and collection

Implemented 2026-10-09. Apply `supabase/migrations/20261009160000_great_game_match_types_collection.sql` before deploying the application. This migration is tested locally against PostgreSQL/PGlite; it has not been applied to the linked production project. No purchases or deployment are part of this change.

## Match types

New friend tables default to **Custom Game**; Ranked is an explicit choice in both Challenge a Friend and direct friend invitations. Join codes show the server's match type before joining. Match type belongs to the table, is immutable, and cannot be changed by the joining player. Old clients omitting the field and historical/ongoing tables remain Ranked, preserving the previous behavior.

`record_great_game_result` records both types and updates Elo only for Ranked. Custom snapshots keep rating_before equal to rating_after without creating a rating row. Leaderboard tie-breaks and season records use Ranked results only. Existing results are not replayed or re-rated by the migration.

`great_game_type_stats` and `great_game_deck_type_stats` expose Total / Custom / Ranked counts. Total sums both types. These new scopes count abandonment as a loss and calculate win rate over all completed results, including draws and abandonment. Existing legacy summary views retain their separate abandonment fields/denominators for compatibility; the profile's primary summary uses the new scoped view. Personal deck records continue to group exact card rosters across renames; no opponent deck is exposed.

## Editorial metadata

`data/the-great-game/metadata.json` defines extensible groups and labels. `metadata` on cards and stored decks is an optional map from group ID to arrays of label IDs, for example `{"archetype":["aggro"],"meta-role":["your-registered-label"]}`. This example is documentation, not a live assignment. Register future options in the taxonomy file, then assign them deliberately in canonical card data or saved deck metadata. Existing InternalRole values are unrelated and are never auto-promoted to labels.

The shared `MetadataFilters` and `MetadataBadges` discover registered, populated labels. Empty groups are hidden. Combined filters use AND across groups; a card/deck can carry multiple labels per group. No gameplay mechanic consumes this metadata. The deck list supports filtering and displaying saved deck archetypes without modifying any existing deck labels. A metadata-authoring UI is intentionally deferred.

## Ownership and future Store fulfillment

`/cards/collection` is the personal Backpack, linked from Decks and Encyclopedia; old `?card=` links still open the shared card details. Owned is its default. Decks and Encyclopedia default to All, preserving their existing catalog and unrestricted gameplay rules. Empty inventories do not fabricate starter ownership and do not restrict building or playing decks. Purchases, prices, pack opening and ownership-based legality remain disabled/deferred.

`great_game_collection` holds account/card quantities. RLS allows members to read only their own inventory; clients cannot insert/update/delete records. `GET /api/great-game/collection` authenticates, paginates and returns known card IDs only. Browser state is keyed to the signed-in profile; errors are not shown as an empty real inventory.

Future trusted fulfillment calls `grantCollectedCards` in `lib/the-great-game/collection-server.ts`, which validates canonical card IDs, quantities and references and invokes the service-only `grant_great_game_cards` RPC. A grant reference is idempotent, and reusing it for a different award is rejected. Award insertion and quantity update share a transaction. No public grant or purchase endpoint exists. Existing accounts intentionally start with no ownership rows until an explicit distribution policy or Store launch.

## Checks

- `node scripts/test-great-game-match-types.cjs`: actual migrations, legacy compatibility, Custom/Ranked results, aggregation, rating isolation, idempotency, RLS and trusted grants.
- `node scripts/test-great-game-metadata.cjs`: empty/future metadata, combined filters, ownership, saved deck metadata and unchanged deck legality.
- `node scripts/test-great-game-foundation-api.cjs`: authenticated create/join, invalid values, immutable join type, private collection pagination and failures.
- `node scripts/test-great-game-foundation-ui.cjs`: local dev server and Edge, desktop/portrait/landscape workflows, collection states, existing deep links, unowned deck access, match choices and history.

Existing regression coverage also passed for Chronicle desktop/touch, independent online mulligans, local replacement animations, card-play feedback, results, timers, rank history and scroll/expanded-menu bounds across Play, Decks, Encyclopedia, Ranks, Social and Store. Old test fixtures were aligned with the existing Game turn/Ruler turn copy, simultaneous mulligans and portrait carousel; privacy, full card reachability, animation and layout-stability assertions remain in place. The supporter regression exposed a missing createGame assignment, now restored using the existing assignSupporters helper.
