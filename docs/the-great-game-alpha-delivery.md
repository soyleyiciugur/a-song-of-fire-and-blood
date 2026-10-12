# The Great Game — Alpha Season delivery (9 October 2026)

## Scope

This release completes the five-part Alpha and gameplay improvements request:

1. **Alpha Season — The First Embers:** a persistent season registry, Alpha backfill for Ranked matches and results, future Beta in a *planned* state, current-season references on Ranks and Play, and ranked-only season standings. No scheduled transitions, seasonal resets or changes to result/rating values.
2. **Play action clarity:** actual Game Turn numbering (`ceil(engine turnNumber / 2)`), active ruler turn, authoritative phase/selection/waiting feedback, and existing disabled-action feedback.
3. **Deck health:** saved-deck validity comes from the pre-existing shared deck validator. Type distribution, missing card count and printed Command curve are diagnostics only and do not introduce new rules.
4. **Encyclopedia:** contextual Guard/Challenge, Fall, Event/targeting and special-effect explanations with linked existing cards. Traps and an unresolved Harrenhal interaction remain visibly marked for rules review.
5. **AFK/timing:** existing server-tracked elapsed turn warnings and non-punitive, debounced Supabase presence stay intact. Missing presence, manual absence and true turn timeout are not conflated.

## Required deployment step

The SQL migration at `supabase/migrations/20261009200000_great_game_alpha_season.sql` **has not been run against a live database in this delivered ZIP**. Apply it using the project's established Supabase migration workflow, *after* `20261009160000_great_game_match_types_collection.sql` and before deploying the matching application. Take a database backup first and verify migration execution on a staging copy of the actual schema and match records.

Check after migration:

- Exactly one `great_game_seasons` row has `status='active'`: `alpha`.
- `beta` exists but has `status='planned'`, without a start date.
- Every `match_type='ranked'` row in `great_game_matches` and `great_game_match_results` has `season_id='alpha'` for the backfilled dataset; every `custom` row has `season_id IS NULL`.
- All original results, timestamps and ratings remain unchanged.
- New Ranked tables inherit the active season, Custom tables receive none, and results inherit their parent table's season (even after a later explicit transition).
- Guest Ranks/Play season reference and signed-in history work with the new view columns.

Season status changes are **manual administrative data operations only**; this deliverable does not introduce an automatic Beta start or a season reset.

## Automated checks

The following run successfully in the supplied workspace with TypeScript transpilation support:

- `scripts/test-great-game-decks.cjs`
- `scripts/test-great-game-seasons.cjs`
- `scripts/test-great-game-match-records.cjs`
- `scripts/test-great-game-tempo.cjs`
- `scripts/test-great-game-naela.cjs`
- `scripts/test-great-game-interactions.cjs`
- `scripts/test-great-game-metadata.cjs`
- `scripts/test-great-game-artifact-transfer.cjs`
- `scripts/test-great-game-zero-power-attack.cjs`
- `scripts/test-great-game-alpha-improvements.cjs`

The SQL schema presence is statically checked. Full Next.js build, browser/UI tests and database migration execution require dependencies and the deployment environment; they were **not** run for this ZIP. The environment could not install npm dependencies from the registry.

## Rules still requiring design review

- Trap timing, interrupt windows and hidden Trap cards are not implemented. The Encyclopedia must not treat conditional card protection as generic Traps.
- Simultaneous Standing loss during Harrenhal's Blackened Stones requires a deliberate gameplay ruling; no outcome is invented by this update.
