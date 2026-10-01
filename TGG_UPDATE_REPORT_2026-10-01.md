# The Great Game — Data Update & Gameplay Backlog (2026-10-01)

## Completed in this patch

### Generic / affiliation data
- `Harbor Cutthroat` renamed to **Hull Bladesman**.
- Hull Bladesman is now affiliated with **House Velaryon** (`houseId: "velaryon"`).
- Stats/trait unchanged: **2 Command / 2 Strength / 0 Influence / 2 Health / Swift**.
- Internal card id remains `harbor-cutthroat` intentionally, to avoid breaking existing saved deck references.
- **Ironborn Reaver** remains the Greyjoy generic: 2 / 4 / 0 / 1, vanilla/aggro.
- Generic skeleton audit: **0 collisions** under Cost + Strength + Influence + Health + Traits.

### Drack Harlaw
- Subtitle changed from `Ironborn Reaver` to **Lord of Harlaw**, avoiding duplication with the generic card.

### Locations — complete card data set
The card pool now contains all 13 agreed/provisional Locations:

| Location | Cost | Ability |
|---|---:|---|
| King's Landing | 2 | All Characters have +1 Influence. |
| Dragonstone | 2 | Dragons cost 1 less Command. |
| Oldtown | 3 | **The Maester's Chain** — first positive Character stat modifier each Ruler gives each turn is increased by 1. |
| Winterfell | 2 | **The North Remembers** — retaliation after a Character was destroyed during the opponent's previous turn; first Conflict initiator gets +1 Strength/+1 Influence for that Conflict. |
| Starfall | 2 | First Character each Ruler uses to initiate a Military Conflict each turn gets +1 Strength for that Conflict. |
| Driftmark | 3 | **Lord of the Tides** — first Character deployed each turn gains Swift until end of turn. |
| Storm's End | 2 | **The Stag's Hunt** — first Military Conflict win each turn restores 1 Standing. |
| Highgarden | 4 | **Growing Stronger** — Characters retained for 2/4/6 own turns gain permanent +1 Influence each threshold, max +3. |
| Riverrun | 3 | Defending Characters have +1 Strength and +1 Influence during Conflicts. |
| Sunspear | 3 | **The Viper's Kiss** — first qualifying 3+ Military damage to a Character poisons it; 1 delayed damage after normal draw on each of the poisoner's next 2 turns. |
| Castle Black | 2 | **Watcher on the Walls** — Characters with Guard have +1 Health. |
| Braavos | 3 | **The Iron Bank** — end with at least 1 unspent Command -> +1 additional Command next turn; may exceed normal max. |
| Tyrosh | 3 | **Tyroshi Trade** — end-turn discard/draw trade, not usable on consecutive own turns; drawn card costs 1 less while in hand. |

All Location data is marked provisional where balance values are not locked.

### Type/data consistency
- `AbilityId` now includes every ability id currently present in the card data, including the new Locations and the two generic aura finishers.
- `balanceStatus?: "provisional"` is represented in card types.
- The three card-data copies are synchronized byte-for-byte:
  - `data/the-great-game/cards.json`
  - `data/cards/cards.json`
  - `lib/the-great-game/cards.json`

### Legacy behavior removed
- The old Oldtown behavior, “first normal Event each turn costs 1 less,” has been removed from the engine so it cannot silently conflict with **The Maester's Chain** card text.

## Gameplay implementation status

### Already implemented / remains valid
- Shared single active Location slot and replacement behavior.
- King's Landing: global +1 Influence.
- Dragonstone: global Dragon -1 Command.
- P1 5-card opening / P2 6-card opening + Royal Favor.
- Royal Favor = +1 Command, hand-limit exempt.
- P1 first-draw skip is **not** production behavior (intentionally; still experimental).
- Ruler Influence is **not** production behavior (intentionally; still experimental).
- Political defender is chosen by the attacker.

### Location gameplay still to implement
1. **Oldtown — The Maester's Chain**
   - Needs a per-Ruler, per-turn “first positive stat modifier” tracker.
   - Multi-stat modifier behavior should be made explicit before final implementation (increase every positive component vs one component).

2. **Winterfell — The North Remembers**
   - Needs tracking of Characters destroyed during the opponent's previous turn.
   - Needs one-shot first-Conflict bonus tracking.
   - +1/+1 is still a provisional balance value.

3. **Starfall**
   - Needs first Military Conflict initiator tracking and conflict-scoped +1 Strength.

4. **Driftmark — Lord of the Tides**
   - Needs first-deployment-per-turn tracking and temporary Swift.

5. **Storm's End — The Stag's Hunt**
   - Needs a canonical engine definition of “wins a Military Conflict” and a once-per-turn trigger.

6. **Highgarden — Growing Stronger**
   - Needs per-unit retained-turn counters and permanent Influence milestones at 2/4/6.
   - Behavior when Highgarden leaves and later returns still needs a precise progress rule.

7. **Riverrun**
   - Needs defender-only +1 Strength/+1 Influence during conflict resolution.

8. **Sunspear — The Viper's Kiss**
   - Needs qualifying Military-damage detection, poison source tracking, two delayed ticks, and “after normal draw” timing.

9. **Castle Black — Watcher on the Walls**
   - Needs Guard health aura handling, including correct current/max Health behavior when the Location enters or leaves.

10. **Braavos — The Iron Bank**
    - Needs end-turn unspent-Command detection and a dedicated next-turn bonus that can exceed 10.
    - Existing generic `nextCommandBonus` refill is capped at `MAX_COMMAND`, so Braavos cannot use that path unchanged.

11. **Tyrosh — Tyroshi Trade**
    - Needs an optional end-turn decision state/UI (mini-mulligan style), discard-pile move, draw, persistent in-hand -1 cost modifier, and alternate-turn lockout.

### Other known gameplay-data mismatches
- **Crownlands Champion — Rally the Men**: card data exists; aura is not implemented in engine.
- **Grand Counselor — Command the Room**: card data exists; aura is not implemented in engine.
- **Ser Orwell Morrigen — Experience Triumphs**: approved card text exists; engine implementation is still missing.
- A larger set of later named-card abilities in the current `cards.json` are also data/text-only. They are a pre-existing gameplay backlog and were not silently implemented in this data patch.
- `createTestDeck()` still points at the old practice deck. It should not be treated as a balance benchmark; replacing it needs an approved representative test deck or a change to local quick-game deck selection.

## Verification
- Generic skeleton collisions: **0**.
- Affiliated generics: **12** (Arryn, Baratheon, Dayne, Greyjoy, Hightower, Lannister, Martell, Stark, Targaryen, Tully, Tyrell, Velaryon).
- Location count: **13**.
- Focused TypeScript compilation for `lib/the-great-game/**`: **passes**.
