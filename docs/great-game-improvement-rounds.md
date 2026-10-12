# The Great Game improvement rounds

Status: Rounds 1 through 6 complete. Updated 2026-10-09.

## Round 1 - Deck foundations
- One ruleset for deck-editor feedback, online create/join, invitations and engine starts.
- Block invalid decks and show actionable reasons before making a request.
- Personal deck records: completed online matches, games, wins, losses, draws, abandons and win rate.
- Identity is the exact sorted card roster including copies, independent of name/order. Roster edits are separate versions; identical copies share a record. Local games are excluded. Win rate is wins / all completed matches; abandon counts as loss.
- Read existing authoritative history and saved match rosters; no new database schema. Report missing historical rosters instead of guessing from names.

## Round 2 - Match records and Chronicle
- Match-result breakdown derived from authoritative events/state.
- Distinguish engine game turn from each ruler's turns taken consistently across Chronicle and result UI.
- Define event-derived metrics before persisting them; cover draws, concessions, simultaneous results and reconnects.

## Round 3 - Card interaction feedback
- Legal target highlights and clear reasons why cards cannot be played.
- Reuse engine legality checks; preserve hover/detail inspection, drag, touch and spectator read-only behavior.

## Round 4 - Table presence and timing
- Atmospheric away/return notices with debouncing and reconnect handling.
- Turn timer and warning thresholds based on server timestamps.
- Confirmed policy: reminders at 60 and 90 seconds, no automatic end-turn or penalty. Mulligans do not count; mandatory effects pause the clock. Away status does not pause it. Server timestamps persist in existing match state; legacy games begin timing with the next accepted move. Spectators observe timers without publishing presence.

## Round 5 - Seasons and rank history
- Add season and historical rank views to Ranks.
- Reversible default policy pending user preference: monthly Istanbul periods, opening 9 October 2026; season points are net rating gained and reset to zero each month. Lifetime Elo is untouched. Equal points use wins, then shared rank.
- No new schema or frozen snapshots: standings derive from retained authoritative results, including later corrections. Personal history shows rating/tier, not unrecorded historical leaderboard positions.

## Round 6 - Card encyclopedia and keyword glossary
- Deck Workshop links to /cards/encyclopedia, reusing shared card faces and details. Search includes canonical card/ability text, all card types, summons and non-deckable cards. Keyword rules link to filtered card results.
- Neutral keyword definitions and status rules share lib/the-great-game/glossary.ts with card tooltips. Game/ruler turns and Command are explained alongside them.

## Validation
- Each round gets focused regression checks, desktop/mobile/landscape checks for affected UI, and a same-day Update Notes entry.
- Publication, commits, pushes and deployments are separate actions; this queue does not perform them.

Round 1 verification: TypeScript and targeted ESLint passed; deck-rule and record-calculation tests passed. Fixture-based API checks covered authentication, both seats, 201-history-row pagination and opponent-roster privacy. Browser fixtures covered records at 1440x900, 844x390 and 390x844 plus invalid/valid create and join controls. No live match or production data was modified.

Round 2 verification: Engine tests cover game/ruler turn progression, legacy logs, duplicate actions, private-log exclusion, both player projections and resumed state. TypeScript and targeted ESLint passed. Browser fixtures cover victory, draw, abandonment, spectator results and Chronicle labels at desktop, portrait and landscape sizes. Action totals from older unstructured logs are marked unavailable rather than guessed.

Round 3 verification: Read-only feedback shares committed-play validation. Engine regressions cover affordability, full boards, Unique cards, Naela Event targeting (obsolete protection removed), two-target Events, turn gating and immutability. Browser fixtures verify blocked-card explanations and legal target highlights at desktop and mobile landscape sizes. Existing inspection and attack interactions are retained; turn notices yield to active selection/error prompts. TypeScript passed.

Round 4 verification: TypeScript and targeted ESLint passed. Engine-adjacent tests cover mulligan exclusion, pause/resume, turn reset, finished and legacy states, reminder thresholds and multiple presence sessions. Browser fixtures with simulated Realtime peers cover Step away/Return, ten-second away debounce, return notice, 60/90 warnings, paused display, spectator isolation and desktop/landscape layouts through 667x375. Live two-account Realtime delivery has not been exercised.

Round 5 verification: TypeScript and targeted ESLint passed. Tests cover Istanbul boundaries, partial opening season, year rollover, shared ranks, abandonment, immutable aggregation, authenticated personal history and stable pagination. Browser fixtures cover history, tier changes, pagination and season views on desktop, mobile portrait and landscape. No ratings were reset or historical seasons invented.

Round 6 verification: TypeScript and targeted ESLint passed. Browser fixtures cover canonical Naela ability details, Escape dismissal, keyword search and linked card filtering at 1440x900, 844x390 and 390x844 without horizontal overflow. Card details use the existing modal; deck routes and collection redirects are preserved.

Reference UI follow-up: Encyclopedia has its own hub tab, all matching cards render without Show more, and grouped rules reuse existing keyword artwork. Encyclopedia and Ranks share CardsControls styles. The glossary defines a game turn as a Command round containing two ruler turns; Your turn/Opponent turn refer to ruler turns. This clarification changes reference copy, not engine counters. Navigation and views passed browser checks down to 320px, plus portrait/landscape and existing Ranks regression fixtures.

Interaction follow-up: CardsSelect is shared by Deck Workshop, Play/Invite deck selectors, Encyclopedia and Seasons. Expanded menus render outside clipping containers and support arrow keys, Home/End, Enter, Escape, typeahead and outside dismissal. Card selection opens details regardless of affordability; validation runs on explicit action buttons or drag initiation. Browser checks cover insufficient-Command inspection/confirm/drag, open menu bounds in portrait/landscape and card Command gem reuse.
