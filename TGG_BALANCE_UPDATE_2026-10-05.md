# TGG balance update — 2026-10-05

## Scope

- Preserves all approved balance/card decisions already applied through the prior update.
- Preserves `balanceStatus: "provisional"` on every card whose balance review is not complete.
- Adds the approved **Familiar Ground** duplicate-Location hand transformation rule.

## Status

- Total card records: 142
- Reviewed / non-provisional: 75
- Provisional: 67
- `Familiar Ground` is a non-deckable special rule card and is not provisional.

## Familiar Ground

When a Location card in a player's hand matches the currently active Location:

- That hand card dynamically presents as **Familiar Ground**.
- Familiar Ground has a fixed cost of **1 Command**, regardless of the printed Location cost or hand cost modifiers.
- Playing it discards the original Location card and draws 1 card.
- It does **not** replace or reactivate the current Location.
- It is **not an Event** and does not increment Event counters or consume Event-specific discounts/triggers.
- If the active Location changes before Familiar Ground is used, the hand card immediately presents and behaves as its original Location again.
- The transformation itself creates no public log. The exact Location name and the replacement draw are logged owner-only when Familiar Ground is used.
- The underlying hand state retains the original Location card ID; the engine exposes `getHandCardPresentationCardId(...)` so the owning hand UI can render `familiar-ground` without mutating or publicly exposing the original hand card.

## Validation

- `cards.updated-2026-10-05.json` parses as valid JSON.
- `engine.updated-2026-10-05.ts` passes TypeScript syntax/transpile validation.
- Targeted Familiar Ground runtime test passed:
  - matching Location presents as `familiar-ground`;
  - effective cost is 1;
  - original Location is discarded;
  - one card is drawn;
  - active Location is unchanged;
  - no public log is emitted;
  - after the active Location changes, the same unspent Location card reverts to its printed card ID and printed cost.
