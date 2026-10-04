# TGG balance update — 2026-10-04

## Scope

- Applied all balance/card decisions explicitly approved through the 1-, 2-, and 3-cost review.
- Applied the approved 4-cost generic normalization.
- Moved Rhaella Targaryen, Ser Myles Mooton, and Ser Grance Morrigen to 4 cost, but kept them provisional because the 4-cost named review is not finished.
- Updated Ser Orwell Morrigen's locked ability wording/behavior while keeping his overall balance provisional.
- Added Harrenhal and Pyke with the approved 1-cost concepts.
- Marked every card whose balance review is not complete as `balanceStatus: "provisional"`.

## Status

- Total cards: 141
- Reviewed / non-provisional: 74
- Provisional: 67
- All currently named 4-cost Characters are provisional pending the ongoing 4-cost pass.

## Engine behavior added/updated

Implemented and runtime-tested behavior for the approved effects that fit the current engine action model, including:

- Annara Celtigar — A Friend Summoned
- Alysanne Hightower — Unintended
- Timos Hightower — He Asked for Parley
- Brandon Stark — Death in His Own Bed
- Naela Targaryen — North of Tyrosh
- Nymos — Guarded Questions
- Maela Targaryen — Buried Secret
- Melessa Hightower — A Secret Kept
- Ser Brannyn Vance — Broken Vows
- Malaenar Targaryen — The Crown Was Never Mine
- Tansy Riverside — She Organized the Whole Thing
- Martyn Mullendore — Safe Passage
- Almar Larchmont — Do Not Forget It, My Lady
- Perric Bracken — An Unfortunate Accident
- Benjen Stark — Howl, including pre-combat 1-Health kills without counter-damage
- Myrielle Marbrand — Lady of Ashemark
- Bethany Bracken — A Quiet Alliance
- Elwood Tully — Shelter of Riverrun
- Oscar Tully — River Knight
- Elinor Tyrell — Golden Rose Brooch
- The Motley Three shared Influence synergy plus individual effects
- Reyenald Reyne — Promising Blade
- Ser Myles Mooton — persistent Pull Him Clear protection
- Ser Grance Morrigen — Hold Fast defensive buffer
- Ser Orwell Morrigen — first Military participation tracking
- Pyke — per-Ruler Raid counters and +1 next-turn Command at 3 Raid
- Harrenhal — Curse tracking and normal 3-Curse resolution

## Intentionally unresolved / not auto-invented

The following approved card texts need interactive deck-top choice UI beyond the currently supplied `cards.json` + `engine.ts` surface, so no fake/random resolution was invented:

- Vhaemys Targaryen — Dreams of Things to Come
- Mother Marya — A Moment of Sight
- Edmyn Uller — They Are Utterly Fucked

Harrenhal's simultaneous case where both Rulers would fall to 0 Standing is also intentionally left unresolved. The engine holds at 3 Curse rather than silently choosing a draw rule.

## Validation

- `cards.json` parses as valid JSON.
- `engine.ts` passes TypeScript syntax/transpile validation.
- Targeted runtime suites pass for the newly implemented approved interactions.
