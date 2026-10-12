# The Great Game — October 9 UI / Round language finishing pass

Changes made directly to the existing application without a new game engine, season subsystem or match-data migration.

## UX and visual changes

- Consistent functional type roles: Cinzel/established display font for headings, established body font for copy and buttons, a compact technical font only for micro-HUD statistics. Layout typography has been tuned in the Play HUD, Decks, Encyclopedia and Ranks.
- Your Backpack renamed to Your Satchel on user-visible card surfaces. Encyclopedia Satchel navigation is aligned right on the Cards / Keywords & Rules tab row. Deck Workshop link no longer carries an arrow.
- The Deck Workshop readiness indicator is a focusable custom check with CSS tooltip; invalid decks expose validation messages through a custom `Show details` disclosure. Validation stays delegated to the existing validator.
- Collection filter uses equally sized All / Owned / Not owned selectors and an explicit **Save filters as default** control. It preserves query, ownership, card type and metadata on the current device only. **Clear saved default** reverses the saved preference.
- Match type selection uses a themed radio seal rather than browser-default radio buttons.
- The A table for two dialog has Open Table / Join Table / Open Tables tabs; the latter uses four entries per page to keep the dialog from acquiring its own scrollbar. Invitation URLs open the Join tab. Very short viewports use compact controls.
- The Close table & return confirmation action is right aligned.
- Ranks navigation reads Overall / Seasons / History; season selection identifies Alpha — The First Embers — Current, and the selector is wider. History is ranked-only in the server query, not merely filtered client-side.
- At the high table displays proportionally sized rating columns, preserving ranks and hover gems. Mara's deck quote and Aldren's ranks quote keep the attribution on the same line when there is room.
- Added an icon-only Leave the table action, compressed two-line Round / active ruler status and stylized exit confirmations in Mara/Aldren's tavern voice.
- Burned cards appear in the same right-board reveal lane as played cards, then char and disappear in an ember/ash animation. This is driven by visible public engine burn log entries; no new card rule is introduced. Motion-sensitive users see a static cue.

## Gameplay terminology

**Round N**: a full pair of ruler turns, one for each player. **Turn N**: one player's individual turn. `GameState.turnNumber` and persisted `GameLogEntry.turn` remain sequential **ruler-turn indexes**, 1, 2, 3... . Round display is `Math.ceil(turnNumber/2)`; no historical record is rewritten. The Chronicle visually groups up to two ruler turns under each Round, and match-end summaries use Round. Timing, card rules and engine turn counters are unchanged. The Encyclopedia's turn explanation has been aligned.

## Validation and limits

- Relevant TypeScript/TSX files were parser checked with the locally available TypeScript compiler.
- Executed relevant zero-dependency engine/turn, season, deck, metadata, action, AFK and Chronicle regression scripts; passed.
- **Not verified:** a complete Next.js production build, browser-rendered responsive screenshots or DB integration tests. The supplied environment has no project `node_modules`, so `zod`, `@electric-sql/pglite`, React and Next.js runtime checks cannot be executed. Run `npm ci`, `npx tsc --noEmit`, `npm run build` and browser tests in the full development environment before deployment.
- No Supabase migration was run as part of this visual pass; the Alpha migration from the previous delivery is still included.
- Existing game mode labels Custom Game and Ranked Game have deliberately not been renamed because a final preferred pair has not been selected.
