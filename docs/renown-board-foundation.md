# Renown Board foundation

Status: data and asset foundation only. The existing Ranks UI remains active.

## Data contract

- `lib/the-great-game/rank-progression.ts` is the shared display-tier source, consumed by PlayerTierGem without changing its public exports.
- Existing ranks: C, B at 1100, A at 1200, S at 1350, S+ at 1500. C has no promotion threshold.
- Read the signed-in player's `useHubData().data.ranking.rating`. Loading, guest and missing-ranking states must remain distinct; do not fabricate a rating.
- There is no separate Renown currency in the current system. Renown Board is a presentation concept for existing Ranked rating; do not create a new score or rename leaderboard statistics implicitly.
- Ranked-only rating attribution remains in the existing result processing. Season standings and season history are separate and stay unchanged.
- The model supplies current/next rank, points remaining, milestone states and a fraction only where both boundaries exist. C shows points remaining, without an invented percentage; S+ shows the highest rank with no fabricated next milestone.

## Visual assets

- Candidate lettering: Cabin Sketch Regular by Impallari Type. Local font and OFL license: `public/fonts/chalk/`. Source: https://github.com/google/fonts/tree/main/ofl/cabinsketch . This is a candidate, not visual approval.
- Render lettering with next/font/local when the board component is introduced; do not add a site-wide font or request fonts from third-party CDNs at runtime.
- Still needed: a restrained black-wall chalk texture and genuinely drawn white chalk track/medieval ornaments. Every supplied asset must carry its source, author and license. Never use unknown-license image-search results.
- No green board, wood frame, enclosing border, gold, glossy gems or dashboard cards inside this section.
- Do not substitute ordinary white serif text and straight CSS rules for approved chalk artwork. Keep the current Ranks UI until the visual assets are convincing together.

## Integration seam and acceptance

Insert the eventual isolated board in the Overall view of `app/cards/ranks/RanksView.tsx`, above At the high table. Pass the authoritative rating into the presentation component. Keep leaderboard, podium proportions, Alpha season information, Seasons and History intact.

Use semantic text and an ordered milestone list; artwork is decorative. Expose current rank with aria-current, and do not rely solely on chalk intensity. Keep small supporting text opaque enough to read without applying distress masks to it. Announce changed progression once, without replaying animation on every hub poll.

On mobile, preserve rank order using a touch-scrollable horizontal track with visible continuation; never shrink text to fit all milestones. At 320, 390, 768 and 1440 pixels verify text, page overflow, keyboard focus, touch scrolling, current/next labels, guest/loading states, C, exact boundaries and S+. Respect reduced motion and avoid continuous grain filters or redraw loops.

No board renderer or new public progression UI is shipped in this foundation stage. Desktop/mobile visual acceptance remains part of that subsequent stage.
